// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title DecisionChain
 * @notice 不可篡改的链上 AI Agent 决策审计日志
 * @dev 记录每次 AI 推理的证明哈希，支持批量写入和链上验证
 */
contract DecisionChain {

    // ==================== 数据结构 ====================

    struct Decision {
        uint256 agentId;      // Agent Token ID
        bytes32 inputHash;    // 用户输入的 keccak256 哈希
        bytes32 outputHash;   // 推理输出的 keccak256 哈希
        bytes32 modelHash;    // 模型标识的 keccak256 哈希
        bytes32 proofHash;    // 综合证明哈希
        uint256 timestamp;    // 决策时间戳
        uint8   importance;   // 重要性 1-5
    }

    // ==================== 状态变量 ====================

    // agentId => Decision[]
    mapping(uint256 => Decision[]) private _decisions;

    // proofHash => 是否已存在（防重放）
    mapping(bytes32 => bool) public proofExists;

    // 被授权的记录者
    mapping(address => bool) public authorizedRecorders;

    address public owner;

    // ==================== 事件 ====================

    event DecisionRecorded(
        uint256 indexed agentId,
        bytes32 indexed proofHash,
        uint8 importance,
        uint256 timestamp
    );

    event BatchDecisionsRecorded(
        uint256 indexed agentId,
        uint256 count,
        uint256 timestamp
    );

    event RecorderUpdated(address indexed recorder, bool authorized);

    // ==================== 修饰器 ====================

    modifier onlyOwner() {
        require(msg.sender == owner, "DecisionChain: not owner");
        _;
    }

    modifier onlyAuthorized() {
        require(
            authorizedRecorders[msg.sender] || msg.sender == owner,
            "DecisionChain: not authorized recorder"
        );
        _;
    }

    // ==================== 构造函数 ====================

    constructor() {
        owner = msg.sender;
        authorizedRecorders[msg.sender] = true;
    }

    // ==================== 权限管理 ====================

    function addRecorder(address recorder) external onlyOwner {
        require(recorder != address(0), "DecisionChain: zero address");
        authorizedRecorders[recorder] = true;
        emit RecorderUpdated(recorder, true);
    }

    function removeRecorder(address recorder) external onlyOwner {
        authorizedRecorders[recorder] = false;
        emit RecorderUpdated(recorder, false);
    }

    // ==================== 核心写入函数 ====================

    /**
     * @notice 记录单条决策
     * @param agentId Agent Token ID
     * @param inputHash 输入哈希
     * @param outputHash 输出哈希
     * @param modelHash 模型哈希
     * @param importance 重要性 1-5
     */
    function recordDecision(
        uint256 agentId,
        bytes32 inputHash,
        bytes32 outputHash,
        bytes32 modelHash,
        uint8   importance
    ) external onlyAuthorized returns (bytes32 proofHash) {
        require(importance >= 1 && importance <= 5, "DecisionChain: importance must be 1-5");

        proofHash = keccak256(abi.encodePacked(
            inputHash,
            outputHash,
            modelHash,
            block.timestamp
        ));

        require(!proofExists[proofHash], "DecisionChain: proof already exists");

        proofExists[proofHash] = true;

        _decisions[agentId].push(Decision({
            agentId: agentId,
            inputHash: inputHash,
            outputHash: outputHash,
            modelHash: modelHash,
            proofHash: proofHash,
            timestamp: block.timestamp,
            importance: importance
        }));

        emit DecisionRecorded(agentId, proofHash, importance, block.timestamp);
    }

    /**
     * @notice 批量记录决策（节省 gas）
     */
    function recordBatchDecisions(
        uint256 agentId,
        bytes32[] calldata inputHashes,
        bytes32[] calldata outputHashes,
        bytes32[] calldata modelHashes,
        uint8[]   calldata importances
    ) external onlyAuthorized {
        uint256 len = inputHashes.length;
        require(len > 0, "DecisionChain: empty batch");
        require(
            len == outputHashes.length &&
            len == modelHashes.length &&
            len == importances.length,
            "DecisionChain: array length mismatch"
        );

        uint256 recorded = 0;
        for (uint256 i = 0; i < len; i++) {
            require(importances[i] >= 1 && importances[i] <= 5, "DecisionChain: importance out of range");

            bytes32 ph = keccak256(abi.encodePacked(
                inputHashes[i],
                outputHashes[i],
                modelHashes[i],
                block.timestamp + i  // 使用偏移量避免同一区块相同哈希冲突
            ));

            if (!proofExists[ph]) {
                proofExists[ph] = true;
                _decisions[agentId].push(Decision({
                    agentId: agentId,
                    inputHash: inputHashes[i],
                    outputHash: outputHashes[i],
                    modelHash: modelHashes[i],
                    proofHash: ph,
                    timestamp: block.timestamp,
                    importance: importances[i]
                }));
                recorded++;

                emit DecisionRecorded(agentId, ph, importances[i], block.timestamp);
            }
        }

        emit BatchDecisionsRecorded(agentId, recorded, block.timestamp);
    }

    // ==================== 查询函数 ====================

    /**
     * @notice 验证证明哈希是否存在于链上
     */
    function verifyProof(bytes32 proofHash) external view returns (bool) {
        return proofExists[proofHash];
    }

    /**
     * @notice 获取某 Agent 的决策总数
     */
    function getDecisionCount(uint256 agentId) external view returns (uint256) {
        return _decisions[agentId].length;
    }

    /**
     * @notice 获取指定索引的决策
     */
    function getDecision(uint256 agentId, uint256 index) external view returns (Decision memory) {
        require(index < _decisions[agentId].length, "DecisionChain: index out of bounds");
        return _decisions[agentId][index];
    }

    /**
     * @notice 获取最近 N 条决策（分页查询）
     * @param agentId Agent ID
     * @param page 页码（从 0 开始）
     * @param limit 每页条数
     */
    function getRecentDecisions(
        uint256 agentId,
        uint256 page,
        uint256 limit
    ) external view returns (Decision[] memory decisions, uint256 total) {
        total = _decisions[agentId].length;
        if (total == 0 || limit == 0) {
            return (new Decision[](0), total);
        }

        uint256 start = total > (page + 1) * limit ? total - (page + 1) * limit : 0;
        uint256 end   = total > page * limit ? total - page * limit : 0;
        uint256 count = end - start;

        decisions = new Decision[](count);
        for (uint256 i = 0; i < count; i++) {
            // 倒序返回，最新的在前
            decisions[i] = _decisions[agentId][end - 1 - i];
        }
    }
}
