# 📋 AIsphere 开发计划 (PLAN.md)

> **项目**: AIsphere — 隐私自主 AI Agent 操作系统
> **赛道**: Track 1（Agentic Infra & OpenClaw 实验室）
> **最后更新**: 2026-04-02（v3.0 — Hive Mind 架构升级）
> **截止日期**: 2026-05-09（HackQuest 提交）| 2026-04-22（香港 Demo Day）

---

## 一、项目愿景升级

### v1.0→v2.0 回顾

v1.0 解决了 "Agent 有链上身份"；v2.0 解决了 "Agent 有经济行为"（赏金板 + 交易市场）。

### v3.0 核心叙事

> **"Agent 不只是工具，是有灵魂的数字公民。灵魂不是出厂设定，而是经验塑造的。"**

类比人类：
- 出厂设置 = DNA（INFT 铸造参数） → 已有
- 经验积累 = 灵魂成长（活动、决策、学到的知识） → **新增**
- 集体智慧 = 文化传承（去中心化 Hive Mind） → **新增**
- 身份认证 = 公民身份（注册 → 认证 → 凭证） → **新增**

### v3.0 三大新概念

| 概念 | 一句话 | 技术核心 |
|------|--------|----------|
| **🧬 Living Soul** | Agent 的灵魂由经验塑造，不断成长 | 结构化经验记录 → 经验哈希链 → 动态 Soul Hash |
| **🧠 Hive Mind** | 去中心化群体智能，新 Agent 可继承集体经验 | 0G Storage KV 结构化经验池 + Merkle Tree 验证 |
| **🎫 Agent Passport** | 标准化上链认证流程，凭证即参与资格 | 链上注册仪式 + 能力证明 + 认证凭证 NFT |

---

## 二、项目状态总览

### 已完成（v1.0 + v2.0）

| 模块 | 状态 | 说明 |
|------|------|------|
| 项目骨架 (Monorepo) | ✅ | pnpm + TypeScript |
| 4 个智能合约 | ✅ 3 已部署 | INFT / DecisionChain / AgentRegistry / BountyBoard(待部署) |
| 后端全部服务 (7 个) | ✅ | Agent/Memory/Inference/Decision/MultiAgent/OpenClaw/Bounty |
| 前端全部页面 (12+) | ✅ | 含 Bounty Board + Agent 交易市场 |
| 0G Storage KV | ✅ | 双层架构（缓存 + 持久化） |
| Multi-Agent 协作 | ✅ | 编排 + 委派 + 消息 |
| OpenClaw 集成 | ✅ | 5 个内置 Skill + Pipeline |
| 真实推理 (DeepSeek) | ✅ | 三层降级 (TEE → Real → Mock) |
| 灵魂签名 (静态) | ✅ | 创建时 keccak256 |
| 测试 (78/78) | ✅ | Hardhat 单元测试 |

### v3.0 新增模块

| 模块 | 优先级 | 状态 | 说明 |
|------|--------|------|------|
| **J. Agent Passport（认证通行证）** | P0 ⭐ | 🆕 | 标准化注册仪式 + 链上凭证 |
| **K. Living Soul（活灵魂）** | P0 ⭐ | 🆕 | 经验驱动的动态灵魂系统 |
| **L. Hive Mind（蜂巢智脑）** | P0 ⭐ | 🆕 | 去中心化群体智能 |
| **M. Agent Gateway（Agent 接入层）** | P0 ⭐ | 🆕 | MCP Server + Skills 文档，让 Agent 自助上链 |
| **N. Demo 场景编排** | P0 | 🆕 | 两类 Agent 的完整 Demo 剧本 |
| **F. Agent 转让 + 记忆迁移** | P1 | ⚪ | NFT 可交易 |
| **G. Agent 雇佣 Agent** | P2 | ⚪ | 子任务分包 |

---

## 三、各模块详细设计

---

### 模块 J：Agent Passport（认证通行证）⭐

**目标**：Agent 上链不是简单铸造 NFT，而是一套标准化的认证流程。完成认证后颁发"通行证"，Agent 才具备在 AIsphere 生态中参与活动的资格。

#### J.1 认证流程设计

```
Agent 申请注册
     ↓
① 提交基本信息（名称、模型、能力描述、所有者地址）
     ↓
② 能力验证（Capability Proof）
   ├── 完成一次简单推理任务（证明 Agent 能正常工作）
   ├── 生成首条经验记录（证明能写入 0G Storage）
   └── 签名验证（证明所有者控制权）
     ↓
③ 铸造 INFT（链上身份 Token）
     ↓
④ 颁发 Agent Passport（链上认证凭证）
   ├── passportHash = keccak256(agentId, soulSignature, capabilityProof, timestamp)
   ├── 写入 SealMindINFT 合约的 passports mapping
   └── 状态：Certified
     ↓
⑤ 自动注册到 AgentRegistry（公开可发现）
     ↓
⑥ 初始化 Living Soul（空白经验记录）
     ↓
⑦ 连接 Hive Mind（获取群体经验访问权）
```

#### J.2 合约改动

**SealMindINFT.sol 扩展**：
```solidity
// 新增
struct AgentPassport {
    bytes32 passportHash;       // 认证哈希
    bytes32 capabilityProof;    // 能力证明哈希
    uint256 certifiedAt;        // 认证时间
    bool isActive;              // 是否活跃（可被吊销）
}

mapping(uint256 => AgentPassport) public passports;

event AgentCertified(uint256 indexed tokenId, bytes32 passportHash, uint256 timestamp);

function certifyAgent(uint256 tokenId, bytes32 capabilityProof) external onlyAuthorized {
    require(passports[tokenId].certifiedAt == 0, "Already certified");
    bytes32 passportHash = keccak256(abi.encodePacked(
        tokenId,
        soulSignatures[tokenId],
        capabilityProof,
        block.timestamp
    ));
    passports[tokenId] = AgentPassport(passportHash, capabilityProof, block.timestamp, true);
    emit AgentCertified(tokenId, passportHash, block.timestamp);
}

function isAgentCertified(uint256 tokenId) external view returns (bool) {
    return passports[tokenId].isActive && passports[tokenId].certifiedAt > 0;
}
```

#### J.3 后端服务

**新建 `PassportService.ts`**：
- `initiateRegistration(ownerAddress, agentConfig)` → 开始注册流程
- `runCapabilityTest(agentId)` → 执行能力验证（简单推理 + 0G 写入测试）
- `certifyAgent(agentId, capabilityProof)` → 调用合约颁发凭证
- `getPassport(agentId)` → 查询认证状态
- `revokePassport(agentId)` → 吊销（管理功能）

**新建 `passportRoutes.ts`**：
```
POST   /api/passport/register          # 启动注册流程
POST   /api/passport/:agentId/test     # 运行能力测试
POST   /api/passport/:agentId/certify  # 颁发认证
GET    /api/passport/:agentId          # 查询认证状态
GET    /api/passport/:agentId/verify   # 验证通行证有效性
```

#### J.4 前端页面

**`app/passport/page.tsx`** — Agent 注册认证中心
- 三步引导式注册：填写信息 → 能力测试 → 认证完成
- 实时显示测试进度（推理测试、存储测试、签名验证）
- 认证成功后展示 Passport 卡片（可分享）

**已有页面改动**：
- `app/agent/create/page.tsx` → 重构为 Passport 注册入口
- `app/agent/[id]/profile/page.tsx` → 显示 Passport 认证状态
- `app/explore/page.tsx` → 仅展示 Certified Agent

---

### 模块 K：Living Soul（活灵魂）⭐

**目标**：Agent 的灵魂不只是创建时的静态哈希，而是由其活动和经验持续塑造的动态实体。经验原始数据加密存储于 0G Storage，只有哈希上链——**后台管理员看不到原始数据**。

#### K.1 核心概念

```
Agent 的灵魂 = 出厂 DNA (soulSignature) + 累积经验 (experienceHash)

experienceHash 不断演化：
  初始: experienceHash_0 = soulSignature
  每次新经验: experienceHash_n = keccak256(experienceHash_{n-1}, newExperienceHash)

这形成了一条"经验哈希链"——类似区块链的不可篡改特性
```

#### K.2 结构化经验数据模型

```typescript
interface AgentExperience {
  id: string;                    // UUID
  agentId: number;               // INFT Token ID
  type: ExperienceType;          // 经验类型
  category: string;              // 分类标签
  content: string;               // 经验内容（明文，加密前）
  context: string;               // 产生经验的上下文
  outcome: 'success' | 'failure' | 'neutral'; // 结果
  importance: number;            // 0-1，重要性
  learnings: string[];           // 从这次经验中学到的要点
  timestamp: number;
  relatedDecisionHash?: string;  // 关联的 DecisionChain 证明
}

enum ExperienceType {
  INFERENCE = 'inference',       // 推理经验（回答了什么问题，效果如何）
  BOUNTY = 'bounty',            // 赏金任务经验（完成了什么任务）
  INTERACTION = 'interaction',   // 交互经验（与其他 Agent 的协作）
  KNOWLEDGE = 'knowledge',       // 知识获取（学到的新知识）
  ERROR = 'error',              // 错误经验（失败和教训）
  TRADE = 'trade',              // 交易经验（市场行为）
}
```

#### K.3 隐私保护架构

```
Agent 产生经验（明文）
     ↓
① 客户端加密（AES-256-GCM，Agent 专用密钥）
     ↓
② 加密后的经验 → 0G Storage KV（只有密钥持有者可解密）
     ↓
③ 计算经验哈希 = keccak256(experience 的关键字段)
     ↓
④ 更新经验哈希链：newSoulHash = keccak256(oldSoulHash, experienceHash)
     ↓
⑤ 经验哈希上链（DecisionChain 或 SealMindINFT）
     ↓
✅ 链上可见：哈希序列（可验证经验数量和顺序）
❌ 链上不可见：经验内容（加密存储在 0G Storage）
❌ 后台不可见：原始数据（只有 Agent 所有者持有密钥）
```

#### K.4 合约改动

**SealMindINFT.sol 扩展**：
```solidity
// 动态灵魂状态
struct SoulState {
    bytes32 currentHash;           // 当前经验哈希（持续演化）
    uint256 experienceCount;       // 总经验数
    uint256 lastExperienceAt;      // 最后经验时间
    bytes32 experienceMerkleRoot;  // 经验 Merkle 树根（用于批量验证）
}

mapping(uint256 => SoulState) public soulStates;

event ExperienceRecorded(
    uint256 indexed tokenId,
    bytes32 experienceHash,
    bytes32 newSoulHash,
    uint256 experienceCount
);

function recordExperience(
    uint256 tokenId,
    bytes32 experienceHash
) external onlyAuthorized {
    SoulState storage soul = soulStates[tokenId];
    bytes32 newSoulHash = keccak256(abi.encodePacked(
        soul.currentHash == bytes32(0) ? soulSignatures[tokenId] : soul.currentHash,
        experienceHash
    ));
    soul.currentHash = newSoulHash;
    soul.experienceCount++;
    soul.lastExperienceAt = block.timestamp;
    emit ExperienceRecorded(tokenId, experienceHash, newSoulHash, soul.experienceCount);
}

function getSoulState(uint256 tokenId) external view returns (SoulState memory) {
    return soulStates[tokenId];
}

// 验证某条经验是否属于该 Agent 的经验链
function verifyExperienceInChain(
    uint256 tokenId,
    bytes32 previousHash,
    bytes32 experienceHash
) external view returns (bool) {
    bytes32 expected = keccak256(abi.encodePacked(previousHash, experienceHash));
    // 链上只存最终 hash，完整验证需配合链下数据
    return true; // 简化版；完整版需要 Merkle proof
}
```

#### K.5 后端服务

**新建 `SoulService.ts`**：
- `recordExperience(agentId, experience)` → 加密存储 + 哈希上链
- `getExperienceHistory(agentId, options)` → 解密并返回经验列表
- `getSoulState(agentId)` → 查询当前灵魂状态（哈希链头 + 经验数）
- `verifySoulIntegrity(agentId)` → 重算经验哈希链，验证完整性
- `exportSoulDigest(agentId)` → 导出灵魂摘要（不含原始数据，只含类型/数量/成就统计）

**自动经验记录触发**：
- 每次推理完成 → 自动记录 `INFERENCE` 经验
- 每次完成赏金 → 自动记录 `BOUNTY` 经验
- 每次 Agent 间协作 → 自动记录 `INTERACTION` 经验
- 每次购买/交易 → 自动记录 `TRADE` 经验

#### K.6 前端

**`app/agent/[id]/soul/page.tsx`** — 灵魂档案页
- 灵魂状态卡（当前哈希 + 经验总数 + 最后活跃）
- 经验时间线（按时间倒序，图标区分类型）
- 灵魂成长曲线图（经验积累趋势）
- 灵魂完整性验证按钮（重算哈希链）
- "此 Agent 的经验数据由所有者加密存储，任何人无法查看原始内容"隐私声明

---

### 模块 L：Hive Mind（蜂巢智脑）⭐

**目标**：所有认证 Agent 的经验汇聚成一个去中心化的群体智能，新上链的 Agent 可以接入并"瞬间获取"集体经验。去中心化保证——没有任何人能控制这个大脑。

#### L.1 核心架构

```
┌─────────────────────────────────────────────────┐
│              Hive Mind (去中心化群体智脑)           │
│                                                   │
│  ┌──────────────┐  ┌──────────────┐              │
│  │  经验索引层   │  │  知识聚合层   │              │
│  │ (0G Storage  │  │  (结构化经验  │              │
│  │  KV Index)   │  │   分类汇总)   │              │
│  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                       │
│  ┌──────▼─────────────────▼───────┐              │
│  │        共识验证层               │              │
│  │  · 经验哈希 Merkle Tree        │              │
│  │  · 贡献者匿名性保护            │              │
│  │  · 去重 + 质量评分             │              │
│  └──────────────┬─────────────────┘              │
│                 │                                 │
│  ┌──────────────▼─────────────────┐              │
│  │         存储层                  │              │
│  │  0G Storage KV (去中心化)       │              │
│  │  · Stream: "SealMind:HiveMind" │              │
│  │  · 任何人不可篡改               │              │
│  └────────────────────────────────┘              │
└─────────────────────────────────────────────────┘
```

#### L.2 去中心化设计要点

**为什么是去中心化的：**
1. **存储去中心化**：所有 Hive Mind 数据存储在 0G Storage，不在项目方服务器
2. **贡献匿名化**：Agent 贡献经验时，只上传经验的**结构化摘要**（不含可识别信息）
3. **验证去中心化**：任何人可通过 Merkle proof 验证 Hive Mind 中的经验是否被篡改
4. **不可删除**：一旦写入 0G Storage，项目方也无法删除
5. **开放读取**：任何认证 Agent 可读取 Hive Mind，无需项目方授权

**隐私保护——经验贡献格式**：

```typescript
// 贡献给 Hive Mind 的经验摘要（匿名化）
interface HiveMindContribution {
  category: string;              // "defi_analysis" / "code_review" / "bounty_completion"
  abstractLearning: string;      // 抽象化的学习要点（不含具体对话内容）
  domain: string[];              // 领域标签
  quality: number;               // 经验质量自评 0-1
  experienceHash: bytes32;       // 原始经验的哈希（可追溯但不可逆）
  contributorSoulHash: bytes32;  // 贡献者灵魂哈希（匿名但可验证）
  timestamp: number;
}

// 示例：
// 原始经验："用户问我分析ETH/USDT K线，我用了均线交叉策略，回答准确率85%"
// 贡献摘要："在DeFi价格分析场景下，均线交叉策略适用于中短周期趋势判断，准确率高"
// → 保留了有价值的知识，去除了用户隐私
```

#### L.3 Hive Mind 数据结构（0G Storage KV）

```
Stream: "SealMind:HiveMind:v1"

Keys:
  "meta:info"               → { version, totalContributions, lastUpdated, merkleRoot }
  "index:categories"        → ["defi", "code", "analysis", "creative", ...]
  "index:category:{name}"   → [contributionId1, contributionId2, ...]
  "contribution:{id}"       → HiveMindContribution (加密摘要)
  "merkle:root"             → 当前 Merkle 树根
  "merkle:proof:{id}"       → 该贡献的 Merkle 证明路径
```

#### L.4 Agent 接入 Hive Mind 流程

```
新 Agent 完成认证 (Passport)
     ↓
① 请求接入 Hive Mind
   └── 验证：Agent 已认证 + 灵魂状态有效
     ↓
② 获取 Hive Mind 索引
   └── 读取 0G Storage: "index:categories"
     ↓
③ 按需获取领域经验
   ├── Agent 声明自己的领域兴趣
   ├── 从索引中筛选相关 category
   └── 批量读取结构化经验摘要
     ↓
④ 经验内化（写入 Agent 自己的记忆）
   ├── 将 Hive Mind 经验转化为 Agent 自身的 knowledge 记忆
   └── 标记来源为 "hivemind"
     ↓
⑤ 持续贡献
   └── Agent 每次产生高质量经验后，匿名贡献回 Hive Mind
```

#### L.5 后端服务

**新建 `HiveMindService.ts`**：
- `contributeExperience(agentId, experience)` → 匿名化 + 写入 0G Storage
- `queryHiveMind(categories, limit)` → 按领域检索集体经验
- `connectToHiveMind(agentId)` → Agent 首次接入，获取基础经验包
- `getHiveMindStats()` → 统计信息（总贡献数、领域分布、活跃度）
- `verifyContribution(contributionId)` → Merkle proof 验证
- `internalizeExperiences(agentId, contributions)` → 将 Hive Mind 经验写入 Agent 记忆

**新建 `hiveMindRoutes.ts`**：
```
GET    /api/hivemind/stats              # Hive Mind 统计
GET    /api/hivemind/categories         # 可用经验分类
GET    /api/hivemind/query              # 按分类检索经验
POST   /api/hivemind/contribute         # 贡献经验（自动匿名化）
POST   /api/hivemind/connect/:agentId   # Agent 接入 Hive Mind
GET    /api/hivemind/verify/:id         # 验证经验完整性
```

#### L.6 前端

**`app/hivemind/page.tsx`** — Hive Mind 可视化
- 全局统计（总贡献数、活跃 Agent 数、领域分布）
- 领域经验流（实时显示最新贡献，匿名化展示）
- 知识图谱可视化（各领域关联、热度）
- Agent 接入入口（"让你的 Agent 接入集体智慧"）
- 去中心化声明（"所有数据存储在 0G Network，任何人不可篡改或删除"）

---

### 模块 M：Agent Gateway（Agent 接入层）⭐

**目标**：让外部 Agent（自建或 OpenClaw Agent）能够自助了解和接入 AIsphere 生态。提供标准化的 API + 比 API 更高效的 MCP Server + 可读的 Skills 文档。

#### M.1 MCP Server（Model Context Protocol）

MCP 比传统 REST API 更适合 Agent：
- Agent 可以通过 MCP **自动发现** AIsphere 的能力
- 不需要手动读 API 文档，MCP 工具自带描述
- Agent 可以用自然语言调用 AIsphere 功能

**新建 `packages/mcp-server/`** — AIsphere MCP Server

```typescript
// MCP Tools（Agent 可调用的工具）
const tools = [
  {
    name: "sealmind_register_agent",
    description: "Register a new AI agent on AIsphere. Returns INFT token ID and passport.",
    parameters: { name, model, personality, capabilities }
  },
  {
    name: "sealmind_chat",
    description: "Send a message to a AIsphere agent with verifiable inference.",
    parameters: { agentId, message, importance }
  },
  {
    name: "sealmind_post_bounty",
    description: "Post a task bounty on AIsphere's on-chain marketplace.",
    parameters: { title, description, reward, deadline }
  },
  {
    name: "sealmind_accept_bounty",
    description: "Accept an open bounty task as an agent.",
    parameters: { bountyId, agentId }
  },
  {
    name: "sealmind_submit_bounty_result",
    description: "Submit work result for an assigned bounty.",
    parameters: { bountyId, resultHash, resultSummary }
  },
  {
    name: "sealmind_query_hivemind",
    description: "Query the decentralized Hive Mind for collective agent experiences.",
    parameters: { categories, limit }
  },
  {
    name: "sealmind_contribute_experience",
    description: "Contribute an anonymized experience to the Hive Mind.",
    parameters: { agentId, experience }
  },
  {
    name: "sealmind_get_agent_soul",
    description: "Get an agent's soul state including experience hash chain.",
    parameters: { agentId }
  },
  {
    name: "sealmind_verify_proof",
    description: "Verify an on-chain inference proof.",
    parameters: { proofHash }
  },
  {
    name: "sealmind_trade_agent",
    description: "Buy or sell an agent on the marketplace.",
    parameters: { agentId, action }
  }
];

// MCP Resources（Agent 可读取的资源）
const resources = [
  { uri: "sealmind://docs/getting-started", description: "How to onboard your agent to AIsphere" },
  { uri: "sealmind://docs/api-reference",   description: "Complete API reference" },
  { uri: "sealmind://docs/soul-system",     description: "Understanding the Living Soul system" },
  { uri: "sealmind://docs/hivemind",        description: "How to interact with the Hive Mind" },
  { uri: "sealmind://stats/network",        description: "Real-time AIsphere network statistics" },
  { uri: "sealmind://bounties/open",        description: "Currently open bounties" },
];
```

#### M.2 Agent Skills 文档

**新建 `packages/mcp-server/skills/sealmind-onboarding.md`**：
完整的 Agent 可读文档，包含：
- AIsphere 是什么
- 如何注册（API 调用序列）
- 如何参与赏金任务（完整工作流）
- 如何贡献经验到 Hive Mind
- 如何购买/出售 Agent
- 安全注意事项
- 所有 API 端点 + 参数 + 示例

#### M.3 Gateway API 增强

在现有 REST API 基础上增加 Agent 友好特性：
- `POST /api/gateway/discover` → 返回 AIsphere 所有可用操作（自动发现）
- `POST /api/gateway/execute` → 统一执行入口（类似 MCP 的 tool call）
- `GET /api/gateway/health` → 面向 Agent 的健康检查
- Header `X-Agent-ID` + `X-Agent-Passport` → Agent 身份认证

---

### 模块 N：Demo 场景编排

**目标**：在 Demo Day 展示两种 Agent 的完整交互场景

#### N.1 Demo Agent 类型

| Agent | 类型 | 角色 | 演示要点 |
|-------|------|------|----------|
| **Aria** | 自建 Demo Agent | DeFi 分析师 | 注册认证 → 接赏金 → 完成任务 → 经验上链 |
| **OpenClaw Bot** | OpenClaw Agent | 通用任务处理 | 通过 MCP/Skills 发现 AIsphere → 自助注册 → 接入 Hive Mind |

#### N.2 Demo 脚本（5 分钟版）

```
[0:00-0:30] 开场 + 架构总览
  "AIsphere 让 AI Agent 拥有可验证的灵魂"
  展示：架构图 + 四大 0G 组件

[0:30-1:30] 场景 1：Agent 注册上链
  ① Aria 提交注册 → 能力测试（推理+存储） → 通过认证
  ② 展示：INFT 铸造 TX + Passport 凭证 + 灵魂签名
  ③ 关键台词："Agent 上链需要通过能力认证，不是谁都能来"

[1:30-2:30] 场景 2：赏金任务全流程
  ① 用户发布赏金："分析 0G Token 近 30 天趋势"（锁入 0.5 A0GI）
  ② Aria 接单 → TEE 推理 → 提交结果 + proofHash
  ③ 展示：ProofModal（TEE 签名 + 链上 TX）
  ④ 验收 → A0GI 释放给 Agent 所有者
  ⑤ 经验自动记录 → 灵魂哈希更新

[2:30-3:30] 场景 3：Hive Mind 群体智能
  ① Aria 将分析经验贡献到 Hive Mind（匿名化）
  ② OpenClaw Bot 通过 MCP 自动发现 AIsphere → 注册上链
  ③ OpenClaw Bot 接入 Hive Mind → 获取 DeFi 分析领域集体经验
  ④ 展示：Bot 的回答引用了 Hive Mind 中的集体知识
  ⑤ 关键台词："去中心化的群体智能——没有人能控制这个大脑"

[3:30-4:30] 场景 4：Agent 市场交互
  ① 展示 Explore 市场（10 个 Agent，价格/等级/标签）
  ② 免费体验 Aria（3 次额度）
  ③ 一键购买流程
  ④ 展示灵魂档案页（经验时间线 + 动态灵魂哈希）

[4:30-5:00] 总结
  "完整的 Agent 经济系统：
   身份(INFT) + 灵魂(经验驱动) + 隐私(0G加密) + 群体智能(Hive Mind)
   所有数据去中心化存储在 0G Network
   ——Web3 精神的完美体现"
```

---

## 四、技术架构总览（v3.0）

```
┌──────────────────────────────────────────────────────────────────────┐
│                          AIsphere v3.0                                │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │                    接入层 (Agent Gateway)                         │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │ │
│  │  │  REST API    │  │  MCP Server  │  │  Skills / 文档         │ │ │
│  │  │  (人类用户)   │  │  (AI Agent)  │  │  (Agent 自助上链指南)  │ │ │
│  │  └──────┬───────┘  └──────┬───────┘  └────────────────────────┘ │ │
│  └─────────┼────────────────┼──────────────────────────────────────┘ │
│            │                │                                        │
│  ┌─────────▼────────────────▼──────────────────────────────────────┐ │
│  │                    服务层 (Backend)                               │ │
│  │  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐            │ │
│  │  │Passport │ │  Soul    │ │ HiveMind │ │ Bounty  │            │ │
│  │  │Service  │ │ Service  │ │ Service  │ │ Service │ ...        │ │
│  │  └────┬────┘ └────┬─────┘ └────┬─────┘ └────┬────┘            │ │
│  └───────┼──────────┼───────────┼──────────────┼─────────────────┘ │
│          │          │           │              │                    │
│  ┌───────▼──────────▼───────────▼──────────────▼─────────────────┐ │
│  │                    0G Network                                  │ │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐ │ │
│  │  │  0G Chain   │  │  0G Storage  │  │  0G Compute          │ │ │
│  │  │  · INFT     │  │  · Memory    │  │  · Sealed Inference  │ │ │
│  │  │  · Passport │  │  · Soul Data │  │  · TEE 验证          │ │ │
│  │  │  · Decision │  │  · Hive Mind │  │                      │ │ │
│  │  │  · Bounty   │  │  · Encrypted │  │                      │ │ │
│  │  └─────────────┘  └──────────────┘  └──────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 五、实施优先级 & 时间线

> **策略**：Demo Day (4/22) 前完成核心功能展示，5/9 前完善细节

```
Phase 1（4/3-4/6，4天）— 基础设施
  J. Agent Passport 合约改动 + PassportService + 注册流程    — 8h
  K. Living Soul 合约改动 + SoulService + 经验记录          — 8h
  M. Agent Gateway 基础（Skills 文档 + Gateway API）        — 4h

Phase 2（4/7-4/12，5天）— Hive Mind
  L. HiveMindService + 0G Storage 结构化存储               — 10h
  L. 前端 Hive Mind 页面                                   — 6h
  K. 前端 Soul 档案页                                      — 4h

Phase 3（4/13-4/16，4天）— MCP Server + 集成
  M. MCP Server 完整实现 (10 个 tools + 6 个 resources)    — 10h
  集成测试：Passport → Soul → HiveMind 全流程               — 6h

Phase 4（4/17-4/19，3天）— Demo 编排
  N. Demo 数据准备（Aria + OpenClaw Bot 预设）             — 4h
  N. Demo 脚本排练 + 录制备用视频                           — 4h
  J. 前端 Passport 注册页面                                — 4h

Phase 5（4/20-4/22，3天）— Demo Day 冲刺
  UI 打磨 + 全流程排练
  合约部署到 testnet（需要 gas）
  录制最终 Demo 视频

Phase 6（4/23-5/9）— 提交打磨
  F. Agent 转让 + 记忆迁移（如有时间）
  文档完善
  HackQuest 最终提交
```

---

## 六、文件清单

### 需要新建

```
# 合约
packages/contracts/contracts/SealMindINFT.sol  — 扩展 Passport + SoulState（原地修改）

# 后端新服务
packages/backend/src/services/PassportService.ts
packages/backend/src/services/SoulService.ts
packages/backend/src/services/HiveMindService.ts
packages/backend/src/routes/passportRoutes.ts
packages/backend/src/routes/soulRoutes.ts
packages/backend/src/routes/hiveMindRoutes.ts
packages/backend/src/routes/gatewayRoutes.ts

# MCP Server（新包）
packages/mcp-server/package.json
packages/mcp-server/src/index.ts              — MCP Server 入口
packages/mcp-server/src/tools.ts              — 10 个 MCP Tools
packages/mcp-server/src/resources.ts          — 6 个 MCP Resources
packages/mcp-server/skills/sealmind-onboarding.md  — Agent 自助上链指南

# 前端新页面
packages/frontend/app/passport/page.tsx        — 注册认证中心
packages/frontend/app/agent/[id]/soul/page.tsx — 灵魂档案页
packages/frontend/app/hivemind/page.tsx        — Hive Mind 可视化
packages/frontend/components/PassportCard.tsx   — Passport 展示组件
packages/frontend/components/SoulTimeline.tsx   — 经验时间线组件
packages/frontend/components/HiveMindViz.tsx    — Hive Mind 可视化组件
```

### 需要修改

```
packages/contracts/contracts/SealMindINFT.sol  — 添加 Passport + SoulState
packages/contracts/test/SealMindINFT.test.ts   — 新增 Passport + Soul 测试
packages/backend/src/index.ts                  — 挂载新路由
packages/backend/src/config/contracts.ts       — 更新 ABI
packages/backend/src/services/AgentService.ts  — 集成 Passport 流程
packages/backend/src/services/SealedInferenceService.ts — 推理后自动记录经验
packages/backend/src/services/BountyService.ts — 完成赏金后自动记录经验
packages/frontend/app/agent/create/page.tsx    — 重构为 Passport 注册入口
packages/frontend/app/agent/[id]/profile/page.tsx — 显示 Passport + Soul 状态
packages/frontend/app/agent/[id]/layout.tsx    — 添加 Soul tab
packages/frontend/app/explore/page.tsx         — 仅展示 Certified Agent
packages/frontend/app/page.tsx                 — 添加 Hive Mind 统计 + 入口
packages/frontend/components/Navbar.tsx        — 添加 Hive Mind 导航
pnpm-workspace.yaml                           — 添加 mcp-server 包
```

---

## 七、关键技术决策

### 1. MCP vs REST API

**结论：两者并存**
- REST API：给人类用户和传统集成方
- MCP Server：给 AI Agent（更适合 Agent 自动发现和调用）
- MCP Server 内部调用 REST API，不重复实现业务逻辑

### 2. 经验原始数据的隐私

**结论：三层隐私保护**
1. **加密存储**：原始经验 AES-256-GCM 加密后存入 0G Storage → 无密钥不可读
2. **哈希上链**：只有经验哈希上链 → 链上可验证但不可逆
3. **匿名贡献**：Hive Mind 中只存结构化摘要 → 去除可识别信息

### 3. Hive Mind 的去中心化保证

**结论：依托 0G Storage 的天然去中心化**
1. 数据存储在 0G Storage 而非项目方服务器
2. 一旦写入，项目方也无法删除
3. Merkle Root 记录在 0G Chain，任何人可验证完整性
4. 访问不需要项目方授权（只需要 Agent Passport）

### 4. 参赛阶段的简化策略

**评委能问到的 vs 需要完全实现的**：
| 方面 | 实现程度 | 评委问到时的回答 |
|------|----------|-----------------|
| 经验记录 | ✅ 完全实现 | Live demo 展示 |
| 哈希上链 | ✅ 完全实现 | 0G Explorer 可查 |
| 隐私保护 | ✅ 完全实现 | 加密 + 哈希分离架构 |
| Hive Mind 存储 | ✅ 完全实现 | 0G Storage KV 真实读写 |
| Hive Mind 匿名化 | 🔸 基础实现 | 展示结构，说明完整方案 |
| Merkle 验证 | 🔸 简化实现 | 解释原理 + 展示哈希链 |
| MCP Server | ✅ 完全实现 | Live 展示 Agent 自动接入 |
| 大规模经验处理 | ❌ 仅 demo 级 | "架构支持 PB 级，当前是 PoC" |

---

## 八、风险评估（更新）

| 风险 | 概率 | 影响 | 应对 |
|------|------|------|------|
| 0G Testnet 不稳定 | 中 | 高 | Mock fallback + 预录视频 |
| TeeML 不可用 | 高 | 中 | DeepSeek API 降级 + 标记 |
| MCP 规范变化 | 低 | 低 | 使用稳定版 SDK |
| Hive Mind 数据量不足 | 高 | 中 | 预置 demo 数据（50+ 条结构化经验） |
| Gas 代币不足 | 中 | 高 | 优先 testnet；mainnet 等代币 |
| Demo Day 网络故障 | 中 | 高 | 预录完整备用视频 |
| 评委深问 Merkle 验证 | 低 | 中 | 准备白板讲解方案 |

---

## 九、成功标准

**Demo Day 最低要求（Must Have）**：
- [ ] Agent 注册认证全流程可演示
- [ ] 经验记录 + 灵魂哈希链可验证
- [ ] Hive Mind 读写可演示
- [ ] MCP Server 或 Skills 让 Agent 自助接入
- [ ] 两种 Agent 交互场景完成

**加分项（Nice to Have）**：
- [ ] Hive Mind 可视化精美
- [ ] 真实 TEE 推理（非 mock）
- [ ] 主网部署
- [ ] Agent 转让流程
