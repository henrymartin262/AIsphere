// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SealMindINFT
 * @notice AI Agent 身份代币（INFT），每个 Agent 对应一个 ERC721 NFT
 * @dev v3.0 — 新增 AgentPassport（认证凭证）和 SoulState（活灵魂状态）
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

    /// @dev v3.0 — Agent Passport（链上认证凭证）
    struct AgentPassport {
        bytes32 passportHash;    // keccak256(tokenId, soulSig, capabilityProof, certifiedAt)
        bytes32 capabilityProof; // 能力证明哈希（后端测试结果）
        uint256 certifiedAt;     // 认证时间戳（0 = 未认证）
        bool    isActive;        // 是否有效（可被吊销）
    }

    /// @dev v3.0 — Living Soul（活灵魂状态）
    struct SoulState {
        bytes32 currentHash;      // 当前经验哈希链头
        uint256 experienceCount;  // 累计经验数
        uint256 lastExperienceAt; // 最后经验时间
    }

    // ==================== 状态变量 ====================

    uint256 private _nextTokenId;

    mapping(uint256 => AgentProfile)  public agentProfiles;
    mapping(uint256 => AgentStats)    public agentStats;
    mapping(address => bool)          public authorizedOperators;
    mapping(uint256 => bytes32)       public soulSignatures;
    mapping(uint256 => AgentPassport) public passports;   // v3.0
    mapping(uint256 => SoulState)     public soulStates;  // v3.0

    uint256[5] private _levelThresholds = [0, 100, 500, 2000, 10000];

    // ==================== 事件 ====================

    event AgentCreated(uint256 indexed tokenId, address indexed owner, string name, string model, uint256 timestamp);
    event AgentStatsUpdated(uint256 indexed tokenId, uint256 totalInferences, uint256 totalMemories, uint8 level, uint256 trustScore);
    event OperatorUpdated(address indexed operator, bool authorized);
    event LevelUp(uint256 indexed tokenId, uint8 oldLevel, uint8 newLevel);
    event SoulSignatureGenerated(uint256 indexed tokenId, bytes32 soulSignature);

    // v3.0 events
    event AgentCertified(uint256 indexed tokenId, bytes32 passportHash, uint256 timestamp);
    event PassportRevoked(uint256 indexed tokenId, uint256 timestamp);
    event ExperienceRecorded(uint256 indexed tokenId, bytes32 experienceHash, bytes32 newSoulHash, uint256 experienceCount);

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

        bytes32 soulSig = keccak256(abi.encodePacked(block.timestamp, msg.sender, to, name, tokenId));
        soulSignatures[tokenId] = soulSig;
        emit SoulSignatureGenerated(tokenId, soulSig);

        // 初始化 Living Soul，以静态 soulSignature 作为经验哈希链起点
        soulStates[tokenId] = SoulState({
            currentHash: soulSig,
            experienceCount: 0,
            lastExperienceAt: block.timestamp
        });

        agentProfiles[tokenId] = AgentProfile({ name: name, model: model, metadataHash: metadataHash, encryptedURI: encryptedURI, createdAt: block.timestamp });
        agentStats[tokenId]    = AgentStats({ totalInferences: 0, totalMemories: 0, trustScore: 0, level: 1, lastActiveAt: block.timestamp });

        emit AgentCreated(tokenId, to, name, model, block.timestamp);
    }

    function recordInference(uint256 tokenId, uint256 trustDelta) external onlyOperator tokenExists(tokenId) {
        AgentStats storage stats = agentStats[tokenId];
        stats.totalInferences += 1;
        stats.trustScore += trustDelta;
        stats.lastActiveAt = block.timestamp;

        uint8 oldLevel = stats.level;
        _checkLevelUp(tokenId);

        emit AgentStatsUpdated(tokenId, stats.totalInferences, stats.totalMemories, stats.level, stats.trustScore);
        if (stats.level != oldLevel) emit LevelUp(tokenId, oldLevel, stats.level);
    }

    function updateMemoryCount(uint256 tokenId, uint256 newCount) external onlyOperator tokenExists(tokenId) {
        agentStats[tokenId].totalMemories = newCount;
        emit AgentStatsUpdated(tokenId, agentStats[tokenId].totalInferences, newCount, agentStats[tokenId].level, agentStats[tokenId].trustScore);
    }

    function authorizeOperator(address operator) external onlyOwner {
        require(operator != address(0), "SealMindINFT: zero address");
        authorizedOperators[operator] = true;
        emit OperatorUpdated(operator, true);
    }

    function revokeOperator(address operator) external onlyOwner {
        authorizedOperators[operator] = false;
        emit OperatorUpdated(operator, false);
    }

    // ==================== v3.0: Passport 函数 ====================

    /**
     * @notice 颁发 Agent 认证通行证
     * @dev 只能颁发一次；需要 operator 权限
     * @param tokenId Agent Token ID
     * @param capabilityProof 能力证明哈希（后端运行能力测试后提交）
     */
    function certifyAgent(uint256 tokenId, bytes32 capabilityProof) external onlyOperator tokenExists(tokenId) {
        require(passports[tokenId].certifiedAt == 0, "SealMindINFT: already certified");
        require(capabilityProof != bytes32(0), "SealMindINFT: empty capability proof");

        bytes32 passportHash = keccak256(abi.encodePacked(
            tokenId,
            soulSignatures[tokenId],
            capabilityProof,
            block.timestamp
        ));

        passports[tokenId] = AgentPassport({
            passportHash:    passportHash,
            capabilityProof: capabilityProof,
            certifiedAt:     block.timestamp,
            isActive:        true
        });

        emit AgentCertified(tokenId, passportHash, block.timestamp);
    }

    /**
     * @notice 吊销 Agent 认证
     */
    function revokePassport(uint256 tokenId) external onlyOwner tokenExists(tokenId) {
        require(passports[tokenId].certifiedAt > 0, "SealMindINFT: not certified");
        passports[tokenId].isActive = false;
        emit PassportRevoked(tokenId, block.timestamp);
    }

    /**
     * @notice 查询 Agent 是否已认证
     */
    function isAgentCertified(uint256 tokenId) external view returns (bool) {
        return passports[tokenId].isActive && passports[tokenId].certifiedAt > 0;
    }

    /**
     * @notice 获取 Agent Passport
     */
    function getPassport(uint256 tokenId) external view tokenExists(tokenId) returns (AgentPassport memory) {
        return passports[tokenId];
    }

    // ==================== v3.0: Living Soul 函数 ====================

    /**
     * @notice 记录一条经验，推进灵魂哈希链
     * @dev newHash = keccak256(oldHash, experienceHash)
     * @param tokenId Agent Token ID
     * @param experienceHash 经验哈希（keccak256 of structured experience data）
     */
    function recordExperience(uint256 tokenId, bytes32 experienceHash) external onlyOperator tokenExists(tokenId) {
        require(experienceHash != bytes32(0), "SealMindINFT: empty experience hash");

        SoulState storage soul = soulStates[tokenId];
        bytes32 newSoulHash = keccak256(abi.encodePacked(soul.currentHash, experienceHash));

        soul.currentHash      = newSoulHash;
        soul.experienceCount  += 1;
        soul.lastExperienceAt = block.timestamp;

        emit ExperienceRecorded(tokenId, experienceHash, newSoulHash, soul.experienceCount);
    }

    /**
     * @notice 获取 Agent 的 Living Soul 状态
     */
    function getSoulState(uint256 tokenId) external view tokenExists(tokenId) returns (SoulState memory) {
        return soulStates[tokenId];
    }

    // ==================== 查询函数 ====================

    function getAgentInfo(uint256 tokenId) external view tokenExists(tokenId) returns (
        address owner,
        AgentProfile memory profile,
        AgentStats memory stats
    ) {
        owner   = ownerOf(tokenId);
        profile = agentProfiles[tokenId];
        stats   = agentStats[tokenId];
    }

    function getAgentsByOwner(address ownerAddr) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(ownerAddr);
        uint256[] memory tokenIds = new uint256[](balance);
        for (uint256 i = 0; i < balance; i++) tokenIds[i] = tokenOfOwnerByIndex(ownerAddr, i);
        return tokenIds;
    }

    function getSoulSignature(uint256 tokenId) external view tokenExists(tokenId) returns (bytes32) {
        return soulSignatures[tokenId];
    }

    function nextTokenId() external view returns (uint256) {
        return _nextTokenId;
    }

    // ==================== 内部函数 ====================

    function _checkLevelUp(uint256 tokenId) internal {
        AgentStats storage stats = agentStats[tokenId];
        for (uint8 i = stats.level; i < 5; i++) {
            if (stats.totalInferences >= _levelThresholds[i]) stats.level = i + 1;
            else break;
        }
    }
}
