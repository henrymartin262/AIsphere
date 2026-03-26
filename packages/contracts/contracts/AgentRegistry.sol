// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title AgentRegistry
 * @notice AI Agent 公开注册表，支持按标签分类和公开/私有可见性设置
 */
contract AgentRegistry {

    // ==================== 数据结构 ====================

    struct RegistryEntry {
        uint256 agentId;      // INFT Token ID
        address owner;        // Agent 所有者
        string[] tags;        // 标签列表
        bool isPublic;        // 是否公开
        uint256 registeredAt; // 注册时间
    }

    // ==================== 状态变量 ====================

    // agentId => RegistryEntry
    mapping(uint256 => RegistryEntry) private _entries;

    // agentId => 是否已注册
    mapping(uint256 => bool) public registeredAgents;

    // tag => agentId[]
    mapping(string => uint256[]) private _tagToAgents;

    // 所有公开 Agent 的 ID 列表
    uint256[] private _allPublicAgents;

    // 公开 Agent 的索引（用于快速删除）
    mapping(uint256 => uint256) private _publicIndex;

    // INFT 合约地址（用于验证所有权）
    address public inftContract;

    address public owner;

    // ==================== 事件 ====================

    event AgentRegistered(uint256 indexed agentId, address indexed ownerAddr, bool isPublic);
    event VisibilityChanged(uint256 indexed agentId, bool isPublic);

    // ==================== 修饰器 ====================

    modifier onlyOwner() {
        require(msg.sender == owner, "AgentRegistry: not owner");
        _;
    }

    // ==================== 构造函数 ====================

    constructor(address _inftContract) {
        owner = msg.sender;
        inftContract = _inftContract;
    }

    // ==================== 核心函数 ====================

    /**
     * @notice 注册 Agent 到公开注册表
     * @param agentId INFT Token ID
     * @param tags 标签数组
     * @param _isPublic 是否公开展示
     * @param agentOwner Agent 所有者地址（由后端传入，hackathon 简化版本）
     */
    function registerAgent(
        uint256 agentId,
        string[] calldata tags,
        bool _isPublic,
        address agentOwner
    ) external {
        require(!registeredAgents[agentId], "AgentRegistry: already registered");
        require(agentOwner != address(0), "AgentRegistry: zero owner address");

        registeredAgents[agentId] = true;

        _entries[agentId] = RegistryEntry({
            agentId: agentId,
            owner: agentOwner,
            tags: tags,
            isPublic: _isPublic,
            registeredAt: block.timestamp
        });

        // 添加标签索引
        for (uint256 i = 0; i < tags.length; i++) {
            _tagToAgents[tags[i]].push(agentId);
        }

        // 如果公开，加入公开列表
        if (_isPublic) {
            _publicIndex[agentId] = _allPublicAgents.length;
            _allPublicAgents.push(agentId);
        }

        emit AgentRegistered(agentId, agentOwner, _isPublic);
    }

    /**
     * @notice 更改 Agent 可见性
     */
    function setVisibility(uint256 agentId, bool _isPublic) external {
        require(registeredAgents[agentId], "AgentRegistry: not registered");
        RegistryEntry storage entry = _entries[agentId];
        require(entry.owner == msg.sender, "AgentRegistry: not agent owner");

        bool currentlyPublic = entry.isPublic;
        if (currentlyPublic == _isPublic) return;

        entry.isPublic = _isPublic;

        if (_isPublic) {
            // 加入公开列表
            _publicIndex[agentId] = _allPublicAgents.length;
            _allPublicAgents.push(agentId);
        } else {
            // 从公开列表移除（swap and pop）
            uint256 idx = _publicIndex[agentId];
            uint256 last = _allPublicAgents[_allPublicAgents.length - 1];
            _allPublicAgents[idx] = last;
            _publicIndex[last] = idx;
            _allPublicAgents.pop();
            delete _publicIndex[agentId];
        }

        emit VisibilityChanged(agentId, _isPublic);
    }

    // ==================== 查询函数 ====================

    /**
     * @notice 按标签查询 Agent ID 列表
     */
    function getAgentsByTag(string calldata tag) external view returns (uint256[] memory) {
        return _tagToAgents[tag];
    }

    /**
     * @notice 获取所有公开 Agent 的 ID 列表（分页）
     */
    function getPublicAgents(
        uint256 offset,
        uint256 limit
    ) external view returns (uint256[] memory result, uint256 total) {
        total = _allPublicAgents.length;
        if (offset >= total || limit == 0) {
            return (new uint256[](0), total);
        }

        uint256 end = offset + limit > total ? total : offset + limit;
        uint256 count = end - offset;
        result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = _allPublicAgents[offset + i];
        }
    }

    /**
     * @notice 获取 Agent 注册信息
     */
    function getEntry(uint256 agentId) external view returns (RegistryEntry memory) {
        require(registeredAgents[agentId], "AgentRegistry: not registered");
        return _entries[agentId];
    }

    /**
     * @notice 获取公开 Agent 总数
     */
    function getTotalAgents() external view returns (uint256) {
        return _allPublicAgents.length;
    }
}
