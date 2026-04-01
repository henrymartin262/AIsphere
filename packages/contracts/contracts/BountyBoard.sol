// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title BountyBoard
 * @notice AI Agent 赏金任务板，支持人类和 Agent 发布/接受任务，内置争议仲裁机制
 * @dev 使用 ReentrancyGuard 防重入，资金锁定于合约直到任务完成/取消/超时
 */
contract BountyBoard is ReentrancyGuard {

    // ==================== 枚举 ====================

    enum BountyStatus {
        Open,       // 开放中，等待接单
        Assigned,   // 已接单，等待提交
        Submitted,  // 已提交结果，等待验收
        Completed,  // 已完成，赏金已转出
        Disputed,   // 争议中，等待仲裁
        Expired,    // 已超时，赏金已退回
        Cancelled   // 已取消，赏金已退回
    }

    // ==================== 数据结构 ====================

    struct Bounty {
        uint256 id;
        address creator;          // 发布者地址
        uint256 creatorAgentId;   // 0=人类发布, >0=Agent 发布（子任务场景）
        string  title;
        string  description;
        uint256 reward;           // 赏金（wei）
        uint256 deadline;         // 截止时间（Unix 时间戳）
        bytes32 criteriaHash;     // 验收标准的 keccak256 哈希
        uint256 assignedAgentId;  // 接单 Agent ID（0=未接单）
        address assignedOwner;    // 接单 Agent 的 owner 地址（用于赏金转账）
        bytes32 resultProofHash;  // 提交结果的证明哈希
        BountyStatus status;
        uint256 parentBountyId;   // 父任务 ID（0=顶级任务）
        uint256 createdAt;
        uint256 completedAt;
    }

    // ==================== 状态变量 ====================

    uint256 private _nextBountyId;

    // bountyId => Bounty
    mapping(uint256 => Bounty) public bounties;

    // creator address => bountyId[]
    mapping(address => uint256[]) private _creatorBounties;

    // agentId => bountyId[]（接单记录）
    mapping(uint256 => uint256[]) private _agentBounties;

    // 所有 bountyId 的有序列表
    uint256[] private _allBountyIds;

    address public owner;

    // 争议期（提交后创建者可在此期间发起争议，此常量供链下使用参考）
    uint256 public constant DISPUTE_PERIOD = 3 days;

    // 最低赏金金额
    uint256 public constant MIN_REWARD = 0.001 ether;

    // ==================== 事件 ====================

    event BountyCreated(
        uint256 indexed id,
        address indexed creator,
        uint256 reward,
        uint256 deadline
    );

    event BountyAccepted(
        uint256 indexed id,
        uint256 indexed agentId,
        address indexed agentOwner
    );

    event BountySubmitted(
        uint256 indexed id,
        bytes32 proofHash
    );

    event BountyCompleted(
        uint256 indexed id,
        address indexed recipient,
        uint256 reward
    );

    event BountyDisputed(
        uint256 indexed id
    );

    event BountyDisputeResolved(
        uint256 indexed id,
        bool approved
    );

    event BountyCancelled(
        uint256 indexed id,
        uint256 refund
    );

    event BountyExpired(
        uint256 indexed id,
        uint256 refund
    );

    event SubBountyCreated(
        uint256 indexed parentId,
        uint256 indexed subId,
        uint256 reward
    );

    // ==================== 修饰器 ====================

    modifier onlyOwner() {
        require(msg.sender == owner, "BountyBoard: not owner");
        _;
    }

    modifier bountyExists(uint256 bountyId) {
        require(bounties[bountyId].id != 0, "BountyBoard: bounty does not exist");
        _;
    }

    // ==================== 构造函数 ====================

    constructor() {
        owner = msg.sender;
        _nextBountyId = 1;
    }

    // ==================== 核心写入函数 ====================

    /**
     * @notice 创建新赏金任务（人类发布）
     * @param title 任务标题（不可为空）
     * @param description 任务描述
     * @param deadline 截止时间戳（必须大于当前时间）
     * @param criteriaHash 验收标准哈希
     * @return id 新创建的 Bounty ID
     */
    function createBounty(
        string calldata title,
        string calldata description,
        uint256 deadline,
        bytes32 criteriaHash
    ) external payable nonReentrant returns (uint256 id) {
        require(msg.value >= MIN_REWARD, "BountyBoard: reward below minimum");
        require(deadline > block.timestamp, "BountyBoard: deadline must be in the future");
        require(bytes(title).length > 0, "BountyBoard: title cannot be empty");

        id = _nextBountyId++;

        bounties[id] = Bounty({
            id: id,
            creator: msg.sender,
            creatorAgentId: 0,
            title: title,
            description: description,
            reward: msg.value,
            deadline: deadline,
            criteriaHash: criteriaHash,
            assignedAgentId: 0,
            assignedOwner: address(0),
            resultProofHash: bytes32(0),
            status: BountyStatus.Open,
            parentBountyId: 0,
            createdAt: block.timestamp,
            completedAt: 0
        });

        _creatorBounties[msg.sender].push(id);
        _allBountyIds.push(id);

        emit BountyCreated(id, msg.sender, msg.value, deadline);
    }

    /**
     * @notice 接受赏金任务
     * @dev Hackathon 简化：任何地址可调用（实际生产应限制为授权后端或 Agent 合约）
     * @param bountyId 任务 ID
     * @param agentId 接单 Agent ID
     * @param agentOwner 接单 Agent 的 owner 地址（赏金接收地址）
     */
    function acceptBounty(
        uint256 bountyId,
        uint256 agentId,
        address agentOwner
    ) external nonReentrant bountyExists(bountyId) {
        Bounty storage bounty = bounties[bountyId];

        require(bounty.status == BountyStatus.Open, "BountyBoard: bounty is not open");
        require(bounty.deadline > block.timestamp, "BountyBoard: bounty has expired");
        require(agentOwner != address(0), "BountyBoard: agentOwner cannot be zero address");

        bounty.assignedAgentId = agentId;
        bounty.assignedOwner = agentOwner;
        bounty.status = BountyStatus.Assigned;

        _agentBounties[agentId].push(bountyId);

        emit BountyAccepted(bountyId, agentId, agentOwner);
    }

    /**
     * @notice 提交任务结果
     * @param bountyId 任务 ID
     * @param resultProofHash 结果证明哈希（不可为零值）
     */
    function submitResult(
        uint256 bountyId,
        bytes32 resultProofHash
    ) external nonReentrant bountyExists(bountyId) {
        Bounty storage bounty = bounties[bountyId];

        require(bounty.status == BountyStatus.Assigned, "BountyBoard: bounty is not assigned");
        require(
            msg.sender == bounty.assignedOwner || msg.sender == owner,
            "BountyBoard: not authorized to submit"
        );
        require(resultProofHash != bytes32(0), "BountyBoard: proof hash cannot be zero");

        bounty.resultProofHash = resultProofHash;
        bounty.status = BountyStatus.Submitted;

        emit BountySubmitted(bountyId, resultProofHash);
    }

    /**
     * @notice 验收任务，将赏金转给接单 Agent owner
     * @param bountyId 任务 ID
     */
    function approveBounty(
        uint256 bountyId
    ) external nonReentrant bountyExists(bountyId) {
        Bounty storage bounty = bounties[bountyId];

        require(bounty.status == BountyStatus.Submitted, "BountyBoard: bounty is not submitted");
        require(
            msg.sender == bounty.creator || msg.sender == owner,
            "BountyBoard: not authorized to approve"
        );

        address recipient = bounty.assignedOwner;
        uint256 reward = bounty.reward;

        bounty.status = BountyStatus.Completed;
        bounty.completedAt = block.timestamp;

        // 状态更新后再转账，防重入
        (bool success, ) = recipient.call{value: reward}("");
        require(success, "BountyBoard: reward transfer failed");

        emit BountyCompleted(bountyId, recipient, reward);
    }

    /**
     * @notice 对已提交的任务发起争议
     * @param bountyId 任务 ID
     */
    function disputeBounty(
        uint256 bountyId
    ) external bountyExists(bountyId) {
        Bounty storage bounty = bounties[bountyId];

        require(bounty.status == BountyStatus.Submitted, "BountyBoard: bounty is not submitted");
        require(msg.sender == bounty.creator, "BountyBoard: only creator can dispute");

        bounty.status = BountyStatus.Disputed;

        emit BountyDisputed(bountyId);
    }

    /**
     * @notice 仲裁争议（仅 owner 可调用）
     * @param bountyId 任务 ID
     * @param approved true=支持接单方（转赏金给 Agent），false=支持发布方（退赏金给 creator）
     */
    function resolveDispute(
        uint256 bountyId,
        bool approved
    ) external nonReentrant onlyOwner bountyExists(bountyId) {
        Bounty storage bounty = bounties[bountyId];

        require(bounty.status == BountyStatus.Disputed, "BountyBoard: bounty is not disputed");

        uint256 reward = bounty.reward;

        if (approved) {
            // 支持接单方：赏金转给 Agent owner
            address recipient = bounty.assignedOwner;
            bounty.status = BountyStatus.Completed;
            bounty.completedAt = block.timestamp;

            (bool success, ) = recipient.call{value: reward}("");
            require(success, "BountyBoard: reward transfer failed");

            emit BountyCompleted(bountyId, recipient, reward);
        } else {
            // 支持发布方：赏金退回给 creator
            address creator = bounty.creator;
            bounty.status = BountyStatus.Cancelled;

            (bool success, ) = creator.call{value: reward}("");
            require(success, "BountyBoard: refund transfer failed");

            emit BountyCancelled(bountyId, reward);
        }

        emit BountyDisputeResolved(bountyId, approved);
    }

    /**
     * @notice 取消开放中的任务，退回赏金
     * @param bountyId 任务 ID
     */
    function cancelBounty(
        uint256 bountyId
    ) external nonReentrant bountyExists(bountyId) {
        Bounty storage bounty = bounties[bountyId];

        require(bounty.status == BountyStatus.Open, "BountyBoard: can only cancel open bounties");
        require(
            msg.sender == bounty.creator || msg.sender == owner,
            "BountyBoard: not authorized to cancel"
        );

        uint256 refund = bounty.reward;
        address creator = bounty.creator;

        bounty.status = BountyStatus.Cancelled;

        (bool success, ) = creator.call{value: refund}("");
        require(success, "BountyBoard: refund transfer failed");

        emit BountyCancelled(bountyId, refund);
    }

    /**
     * @notice 触发超时，退回赏金（Open 或 Assigned 状态均可超时）
     * @param bountyId 任务 ID
     */
    function expireBounty(
        uint256 bountyId
    ) external nonReentrant bountyExists(bountyId) {
        Bounty storage bounty = bounties[bountyId];

        require(
            bounty.status == BountyStatus.Open || bounty.status == BountyStatus.Assigned,
            "BountyBoard: cannot expire in current status"
        );
        require(block.timestamp > bounty.deadline, "BountyBoard: deadline not reached");

        uint256 refund = bounty.reward;
        address creator = bounty.creator;

        bounty.status = BountyStatus.Expired;

        (bool success, ) = creator.call{value: refund}("");
        require(success, "BountyBoard: refund transfer failed");

        emit BountyExpired(bountyId, refund);
    }

    /**
     * @notice 创建子任务（由 Agent 在执行父任务时拆解子任务）
     * @param parentBountyId 父任务 ID
     * @param title 子任务标题
     * @param description 子任务描述
     * @param deadline 截止时间
     * @param criteriaHash 验收标准哈希
     * @param creatorAgentId 创建子任务的 Agent ID
     * @return id 新子任务 ID
     */
    function createSubBounty(
        uint256 parentBountyId,
        string calldata title,
        string calldata description,
        uint256 deadline,
        bytes32 criteriaHash,
        uint256 creatorAgentId
    ) external payable nonReentrant bountyExists(parentBountyId) returns (uint256 id) {
        Bounty storage parent = bounties[parentBountyId];

        // 父任务不能处于终态
        require(
            parent.status != BountyStatus.Cancelled && parent.status != BountyStatus.Expired,
            "BountyBoard: parent bounty is not active"
        );
        require(msg.value >= MIN_REWARD, "BountyBoard: reward below minimum");
        require(deadline > block.timestamp, "BountyBoard: deadline must be in the future");
        require(bytes(title).length > 0, "BountyBoard: title cannot be empty");

        id = _nextBountyId++;

        bounties[id] = Bounty({
            id: id,
            creator: msg.sender,
            creatorAgentId: creatorAgentId,
            title: title,
            description: description,
            reward: msg.value,
            deadline: deadline,
            criteriaHash: criteriaHash,
            assignedAgentId: 0,
            assignedOwner: address(0),
            resultProofHash: bytes32(0),
            status: BountyStatus.Open,
            parentBountyId: parentBountyId,
            createdAt: block.timestamp,
            completedAt: 0
        });

        _creatorBounties[msg.sender].push(id);
        _allBountyIds.push(id);

        emit BountyCreated(id, msg.sender, msg.value, deadline);
        emit SubBountyCreated(parentBountyId, id, msg.value);
    }

    // ==================== 查询函数 ====================

    /**
     * @notice 获取单个 Bounty 详情
     */
    function getBounty(uint256 id) external view bountyExists(id) returns (Bounty memory) {
        return bounties[id];
    }

    /**
     * @notice 分页获取所有 Bounty
     * @param offset 偏移量
     * @param limit 每页数量（传 0 返回全部）
     * @return result Bounty 数组
     * @return total 总数量
     */
    function getBounties(
        uint256 offset,
        uint256 limit
    ) external view returns (Bounty[] memory result, uint256 total) {
        total = _allBountyIds.length;

        if (offset >= total) {
            return (new Bounty[](0), total);
        }

        uint256 count = total - offset;
        if (limit > 0 && count > limit) {
            count = limit;
        }

        result = new Bounty[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = bounties[_allBountyIds[offset + i]];
        }
    }

    /**
     * @notice 按状态筛选并分页获取 Bounty
     * @param status 目标状态
     * @param offset 偏移量（针对筛选后的结果）
     * @param limit 每页数量（0=全部）
     */
    function getBountiesByStatus(
        BountyStatus status,
        uint256 offset,
        uint256 limit
    ) external view returns (Bounty[] memory result, uint256 total) {
        // 第一遍：统计匹配数量
        uint256 matchCount = 0;
        for (uint256 i = 0; i < _allBountyIds.length; i++) {
            if (bounties[_allBountyIds[i]].status == status) {
                matchCount++;
            }
        }

        total = matchCount;

        if (offset >= total) {
            return (new Bounty[](0), total);
        }

        uint256 returnCount = total - offset;
        if (limit > 0 && returnCount > limit) {
            returnCount = limit;
        }

        result = new Bounty[](returnCount);
        uint256 matchIdx = 0;
        uint256 resultIdx = 0;

        for (uint256 i = 0; i < _allBountyIds.length && resultIdx < returnCount; i++) {
            Bounty storage b = bounties[_allBountyIds[i]];
            if (b.status == status) {
                if (matchIdx >= offset) {
                    result[resultIdx] = b;
                    resultIdx++;
                }
                matchIdx++;
            }
        }
    }

    /**
     * @notice 获取某地址发布的所有 Bounty ID
     */
    function getBountiesByCreator(address creator) external view returns (uint256[] memory) {
        return _creatorBounties[creator];
    }

    /**
     * @notice 获取某 Agent 接单的所有 Bounty ID
     */
    function getBountiesByAgent(uint256 agentId) external view returns (uint256[] memory) {
        return _agentBounties[agentId];
    }

    /**
     * @notice 获取 Bounty 总数
     */
    function getTotalBounties() external view returns (uint256) {
        return _allBountyIds.length;
    }

    /**
     * @notice 统计当前锁定在合约中的总赏金池（Open + Assigned + Submitted + Disputed 状态）
     */
    function getTotalRewardPool() external view returns (uint256 pool) {
        pool = 0;
        for (uint256 i = 0; i < _allBountyIds.length; i++) {
            BountyStatus s = bounties[_allBountyIds[i]].status;
            if (
                s == BountyStatus.Open ||
                s == BountyStatus.Assigned ||
                s == BountyStatus.Submitted ||
                s == BountyStatus.Disputed
            ) {
                pool += bounties[_allBountyIds[i]].reward;
            }
        }
    }
}
