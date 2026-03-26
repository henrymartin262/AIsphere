// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SealMindINFT
 * @notice AI Agent 身份代币（INFT），每个 Agent 对应一个 ERC721 NFT
 * @dev 集成等级成长系统，记录推理次数、记忆数量和信任分
 */
contract SealMindINFT is ERC721Enumerable, Ownable, ReentrancyGuard {

    // ==================== 数据结构 ====================

    struct AgentProfile {
        string name;          // Agent 名称
        string model;         // 使用的模型（如 deepseek-v3.1）
        string metadataHash;  // 元数据 IPFS/0G hash
        string encryptedURI;  // 加密后的 metadata URI
        uint256 createdAt;    // 创建时间戳
    }

    struct AgentStats {
        uint256 totalInferences;  // 总推理次数
        uint256 totalMemories;    // 总记忆数量
        uint256 trustScore;       // 信任分（0-10000）
        uint8   level;            // 等级 1-5
        uint256 lastActiveAt;     // 最后活跃时间
    }

    // ==================== 状态变量 ====================

    uint256 private _nextTokenId;

    // tokenId => AgentProfile
    mapping(uint256 => AgentProfile) public agentProfiles;
    // tokenId => AgentStats
    mapping(uint256 => AgentStats) public agentStats;
    // 被授权的操作员（可调用 recordInference 等）
    mapping(address => bool) public authorizedOperators;

    // 等级升级阈值（推理次数）：Level 1→2: 100, 2→3: 500, 3→4: 2000, 4→5: 10000
    uint256[5] private _levelThresholds = [0, 100, 500, 2000, 10000];

    // ==================== 事件 ====================

    event AgentCreated(
        uint256 indexed tokenId,
        address indexed owner,
        string name,
        string model,
        uint256 timestamp
    );

    event AgentStatsUpdated(
        uint256 indexed tokenId,
        uint256 totalInferences,
        uint256 totalMemories,
        uint8 level,
        uint256 trustScore
    );

    event OperatorUpdated(address indexed operator, bool authorized);

    event LevelUp(uint256 indexed tokenId, uint8 oldLevel, uint8 newLevel);

    // ==================== 修饰器 ====================

    modifier onlyOperator() {
        require(authorizedOperators[msg.sender] || msg.sender == owner(), "SealMindINFT: not authorized operator");
        _;
    }

    modifier tokenExists(uint256 tokenId) {
        require(_ownerOf(tokenId) != address(0), "SealMindINFT: token does not exist");
        _;
    }

    // ==================== 构造函数 ====================

    constructor() ERC721("SealMind Agent", "SMAI") Ownable(msg.sender) {
        _nextTokenId = 1;
    }

    // ==================== 核心函数 ====================

    /**
     * @notice 创建新的 AI Agent，铸造 INFT
     * @param name Agent 名称
     * @param model 使用的模型
     * @param metadataHash 元数据哈希
     * @param encryptedURI 加密元数据 URI
     * @param to 接收者地址
     * @return tokenId 新铸造的 Token ID
     */
    function createAgent(
        string calldata name,
        string calldata model,
        string calldata metadataHash,
        string calldata encryptedURI,
        address to
    ) external nonReentrant returns (uint256 tokenId) {
        require(bytes(name).length > 0, "SealMindINFT: name cannot be empty");
        require(bytes(model).length > 0, "SealMindINFT: model cannot be empty");
        require(to != address(0), "SealMindINFT: mint to zero address");

        tokenId = _nextTokenId++;

        _safeMint(to, tokenId);

        agentProfiles[tokenId] = AgentProfile({
            name: name,
            model: model,
            metadataHash: metadataHash,
            encryptedURI: encryptedURI,
            createdAt: block.timestamp
        });

        agentStats[tokenId] = AgentStats({
            totalInferences: 0,
            totalMemories: 0,
            trustScore: 0,
            level: 1,
            lastActiveAt: block.timestamp
        });

        emit AgentCreated(tokenId, to, name, model, block.timestamp);
    }

    /**
     * @notice 记录一次推理，更新统计和等级
     * @param tokenId Agent Token ID
     * @param trustDelta 信任分增量（可为 0）
     */
    function recordInference(
        uint256 tokenId,
        uint256 trustDelta
    ) external onlyOperator tokenExists(tokenId) {
        AgentStats storage stats = agentStats[tokenId];

        stats.totalInferences += 1;
        stats.trustScore += trustDelta;
        stats.lastActiveAt = block.timestamp;

        uint8 oldLevel = stats.level;
        _checkLevelUp(tokenId);

        emit AgentStatsUpdated(
            tokenId,
            stats.totalInferences,
            stats.totalMemories,
            stats.level,
            stats.trustScore
        );

        if (stats.level != oldLevel) {
            emit LevelUp(tokenId, oldLevel, stats.level);
        }
    }

    /**
     * @notice 更新记忆数量
     * @param tokenId Agent Token ID
     * @param newCount 新的记忆总数
     */
    function updateMemoryCount(
        uint256 tokenId,
        uint256 newCount
    ) external onlyOperator tokenExists(tokenId) {
        agentStats[tokenId].totalMemories = newCount;

        emit AgentStatsUpdated(
            tokenId,
            agentStats[tokenId].totalInferences,
            newCount,
            agentStats[tokenId].level,
            agentStats[tokenId].trustScore
        );
    }

    /**
     * @notice 授权操作员
     */
    function authorizeOperator(address operator) external onlyOwner {
        require(operator != address(0), "SealMindINFT: zero address");
        authorizedOperators[operator] = true;
        emit OperatorUpdated(operator, true);
    }

    /**
     * @notice 撤销操作员权限
     */
    function revokeOperator(address operator) external onlyOwner {
        authorizedOperators[operator] = false;
        emit OperatorUpdated(operator, false);
    }

    // ==================== 查询函数 ====================

    /**
     * @notice 获取 Agent 完整信息
     */
    function getAgentInfo(uint256 tokenId) external view tokenExists(tokenId) returns (
        address owner,
        AgentProfile memory profile,
        AgentStats memory stats
    ) {
        owner = ownerOf(tokenId);
        profile = agentProfiles[tokenId];
        stats = agentStats[tokenId];
    }

    /**
     * @notice 获取某地址拥有的所有 Agent Token ID
     */
    function getAgentsByOwner(address ownerAddr) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(ownerAddr);
        uint256[] memory tokenIds = new uint256[](balance);
        for (uint256 i = 0; i < balance; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(ownerAddr, i);
        }
        return tokenIds;
    }

    /**
     * @notice 获取下一个将分配的 Token ID
     */
    function nextTokenId() external view returns (uint256) {
        return _nextTokenId;
    }

    // ==================== 内部函数 ====================

    /**
     * @dev 检查并触发等级升级
     * 阈值：[0, 100, 500, 2000, 10000] 对应 Level 1–5
     */
    function _checkLevelUp(uint256 tokenId) internal {
        AgentStats storage stats = agentStats[tokenId];
        uint8 currentLevel = stats.level;

        // 从当前等级往上检查是否满足升级条件
        for (uint8 i = currentLevel; i < 5; i++) {
            if (stats.totalInferences >= _levelThresholds[i]) {
                stats.level = i + 1;
            } else {
                break;
            }
        }
    }
}
