# 📋 SealMind 详细开发计划 (plan.md)

> **项目**: SealMind — 隐私自主 AI Agent 操作系统
> **赛道**: Track 1（Agentic Infra & OpenClaw 实验室）
> **创建日期**: 2026-03-25
> **截止日期**: 2026-05-09 23:59 (UTC+8)

---

## 一、环境与工具链

### 1.1 当前环境

| 工具 | 版本 | 状态 |
|------|------|------|
| OS | TencentOS Server 4.4 (x86_64) | ✅ |
| Node.js | v20.20.1 (via nvm) | ✅ |
| npm | 10.8.2 | ✅ |
| Python | 3.13.12 (miniforge3) | ✅ |
| uv | 0.11.1 | ✅ 已安装 |
| pnpm | — | ❌ 待安装 |
| Hardhat | — | ❌ 待安装（项目内） |

### 1.2 环境管理策略

- **Node.js 包管理**: 使用 `pnpm` 管理 monorepo workspace
- **Python 环境**: 使用 `uv` 管理虚拟环境和依赖（用于脚本工具、测试辅助等）
- **Solidity 编译**: 通过 Hardhat 在 contracts 包内管理

### 1.3 项目结构（Monorepo）

```
SealMind/
├── doc/                              # 项目文档（已有）
├── plan.md                           # 本开发计划
├── packages/
│   ├── contracts/                    # 📜 智能合约（Hardhat + Solidity）
│   ├── backend/                      # 🖥️ 后端 API（Express + TypeScript）
│   └── frontend/                     # 🌐 前端应用（Next.js 14 + TypeScript）
├── scripts/                          # 🔧 Python 辅助脚本（uv 管理）
├── .env.example                      # 环境变量模板
├── package.json                      # monorepo 根配置
├── pnpm-workspace.yaml               # pnpm workspace 配置
├── .gitignore
└── README.md
```

---

## 二、模块依赖关系与开发顺序

### 2.1 模块依赖图

```
                    ┌──────────────────┐
                    │   0. 项目骨架     │
                    │   Monorepo 初始化 │
                    └────────┬─────────┘
                             │
                ┌────────────┼────────────┐
                ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────────┐
        │ 1. 智能  │ │ 2. 后端  │ │ 3. 前端骨架  │
        │    合约  │ │    骨架  │ │    + 钱包连接 │
        └────┬─────┘ └────┬─────┘ └──────┬───────┘
             │            │              │
             ▼            ▼              │
        ┌──────────┐ ┌──────────┐        │
        │ 4. 合约  │ │ 5. Agent │        │
        │    部署  │ │    Service│        │
        └────┬─────┘ └────┬─────┘        │
             │            │              │
             │       ┌────┼────┐         │
             │       ▼    ▼    ▼         │
             │  ┌────────┐┌────────┐     │
             │  │6.Memory││7.Sealed│     │
             │  │ Vault  ││Infer.  │     │
             │  └───┬────┘└───┬────┘     │
             │      │         │          │
             │      └────┬────┘          │
             │           ▼               │
             │    ┌──────────────┐       │
             │    │ 8. Decision  │       │
             │    │    Chain Svc │       │
             │    └──────┬───────┘       │
             │           │               │
             └─────┬─────┘               │
                   ▼                     ▼
           ┌──────────────┐     ┌──────────────┐
           │ 9. 对话 API  │     │ 10. 前端页面 │
           │    全流程联调 │────▶│     开发     │
           └──────┬───────┘     └──────┬───────┘
                  │                    │
                  ▼                    ▼
           ┌──────────────┐     ┌──────────────┐
           │ 11. 主网部署 │     │ 12. UI 打磨  │
           │     + 测试   │     │    + Demo    │
           └──────────────┘     └──────────────┘
```

### 2.2 开发顺序总览（12 个模块）

| 序号 | 模块 | 预计工时 | 优先级 | 依赖 |
|------|------|----------|--------|------|
| **0** | 项目骨架 — Monorepo 初始化 | 0.5 天 | P0 | 无 |
| **1** | 智能合约开发 | 2 天 | P0 | #0 |
| **2** | 后端骨架搭建 | 1 天 | P0 | #0 |
| **3** | 前端骨架 + 钱包连接 | 1 天 | P0 | #0 |
| **4** | 合约部署（Testnet） | 0.5 天 | P0 | #1 |
| **5** | AgentService（后端） | 1 天 | P0 | #2, #4 |
| **6** | MemoryVaultService（加密记忆） | 2 天 | P1 | #2, #4 |
| **7** | SealedInferenceService（TEE 推理）| 2 天 | P0 | #2 |
| **8** | DecisionChainService（决策上链） | 1.5 天 | P1 | #2, #4 |
| **9** | 对话 API 全流程联调 | 2 天 | P0 | #5, #6, #7, #8 |
| **10** | 前端页面开发 | 5 天 | P0 | #3, #9 |
| **11** | 主网部署 + 端到端测试 | 2 天 | P0 | #9 |
| **12** | UI 打磨 + Demo 准备 + 提交 | 3 天 | P0 | #10, #11 |

---

## 三、各模块详细设计

---

### 模块 0：项目骨架 — Monorepo 初始化

**目标**: 搭建 pnpm monorepo 工作区，配置所有子包的基础结构

**任务清单**:

- [ ] 安装 pnpm
- [ ] 创建根目录 `package.json` + `pnpm-workspace.yaml`
- [ ] 初始化 `packages/contracts/` — Hardhat + TypeScript
- [ ] 初始化 `packages/backend/` — Express + TypeScript
- [ ] 初始化 `packages/frontend/` — Next.js 14 + TypeScript + TailwindCSS
- [ ] 创建 `scripts/` 目录 + `uv init` Python 虚拟环境
- [ ] 配置 `.env.example` 全局环境变量模板
- [ ] 配置 `.gitignore`
- [ ] 配置 TypeScript 共享配置 `tsconfig.base.json`

**关键配置**:

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
```

**.env.example 关键变量**:

```bash
# 0G Chain
RPC_URL=https://evmrpc-testnet.0g.ai
CHAIN_ID=16602
PRIVATE_KEY=          # 后端服务钱包私钥
DEPLOYER_PRIVATE_KEY= # 部署钱包私钥

# 0G Storage
STORAGE_INDEXER_URL=https://indexer-storage-testnet-turbo.0g.ai
KV_NODE_URL=http://3.101.147.150:6789

# 0G Compute
# (Sealed Inference 通过 broker SDK 自动发现)

# 合约地址（部署后填写）
INFT_ADDRESS=
DECISION_CHAIN_ADDRESS=
REGISTRY_ADDRESS=

# 前端
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_CHAIN_ID=16602
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
```

**交付标准**: `pnpm install` 成功，三个子包均可独立启动（空壳状态）

---

### 模块 1：智能合约开发

**目标**: 编写 3 个核心合约 + 单元测试

**任务清单**:

#### 1.1 SealMindINFT.sol — Agent 身份 INFT

- [ ] 继承 `ERC721Enumerable`, `Ownable`, `ReentrancyGuard`
- [ ] 定义 `AgentProfile` 结构体（name, model, metadataHash, encryptedURI）
- [ ] 定义 `AgentStats` 结构体（totalInferences, totalMemories, trustScore, level, lastActiveAt, createdAt）
- [ ] 实现 `createAgent(name, model, encryptedURI, metadataHash)` — 铸造 + 初始化
- [ ] 实现 `recordInference(tokenId)` — 推理计数 + 等级检查
- [ ] 实现 `updateMemoryCount(tokenId, count)` — 更新记忆数
- [ ] 实现 `authorizeOperator(tokenId, operator)` / `revokeOperator` — 操作员管理
- [ ] 实现 `getAgentInfo(tokenId)` — 查询完整信息
- [ ] 实现 `getAgentsByOwner(address)` — 查询某地址所有 Agent
- [ ] 实现等级检查内部函数 `_checkLevelUp(tokenId)`
- [ ] 事件: `AgentCreated`, `AgentStatsUpdated`, `OperatorUpdated`

**等级阈值**:
```
Level 1: 0 次推理
Level 2: 100 次推理
Level 3: 500 次推理
Level 4: 2000 次推理
Level 5: 10000 次推理
```

#### 1.2 DecisionChain.sol — 决策链

- [ ] 定义 `Decision` 结构体（agentId, inputHash, outputHash, modelHash, proofHash, timestamp, importance）
- [ ] 存储: `decisions` (agentId → Decision[]), `proofExists` (proofHash → bool), `authorizedRecorders` (address → bool)
- [ ] 实现 `addRecorder(address)` — 添加授权记录者
- [ ] 实现 `removeRecorder(address)` — 移除授权记录者
- [ ] 实现 `recordDecision(agentId, inputHash, outputHash, modelHash, importance)` — 单条记录
- [ ] 实现 `recordBatchDecisions(agentId, inputHashes[], outputHashes[], modelHashes[], importances[])` — 批量记录
- [ ] 实现 `verifyProof(proofHash)` — 验证证明是否存在
- [ ] 实现 `getDecisionCount(agentId)` — 决策总数
- [ ] 实现 `getDecision(agentId, index)` — 按索引获取
- [ ] 实现 `getRecentDecisions(agentId, count)` — 最近 N 条
- [ ] 事件: `DecisionRecorded`, `BatchDecisionsRecorded`

**ProofHash 计算**: `keccak256(abi.encodePacked(inputHash, outputHash, modelHash, timestamp))`

#### 1.3 AgentRegistry.sol — 注册表

- [ ] 存储: `registeredAgents` (tokenId → bool), `agentTags` (tokenId → string[]), `tagToAgents` (tag → tokenId[]), `isPublic` (tokenId → bool)
- [ ] 实现 `registerAgent(tokenId, tags[])` — 注册到全局表
- [ ] 实现 `getAgentsByTag(tag)` — 按标签搜索
- [ ] 实现 `getPublicAgents(offset, limit)` — 分页获取公开 Agent
- [ ] 实现 `setVisibility(tokenId, isPublic)` — 设置可见性
- [ ] 实现 `getTotalAgents()` — 总数统计

#### 1.4 部署脚本 + 测试

- [ ] 编写 `scripts/deploy.ts` — 按依赖顺序部署 3 个合约
- [ ] 编写单元测试: INFT 创建/推理/升级
- [ ] 编写单元测试: DecisionChain 记录/验证/批量
- [ ] 编写单元测试: Registry 注册/搜索
- [ ] Hardhat 配置: 0G 测试网 + 主网网络

**Hardhat 配置要点**:
```typescript
{
  solidity: {
    version: "0.8.19",
    settings: {
      evmVersion: "cancun",
      optimizer: { enabled: true, runs: 200 }
    }
  },
  networks: {
    "og-testnet": {
      url: "https://evmrpc-testnet.0g.ai",
      chainId: 16602,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY]
    },
    "og-mainnet": {
      url: "https://evmrpc.0g.ai",
      chainId: 16661,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY]
    }
  }
}
```

**部署顺序**:
1. DecisionChain → 获得 `decisionChainAddress`
2. SealMindINFT(decisionChainAddress) → 获得 `inftAddress`
3. AgentRegistry(inftAddress) → 获得 `registryAddress`
4. 配置权限: `DecisionChain.addRecorder(backendAddress)`

**交付标准**: 所有合约编译通过，单元测试 100% 通过

---

### 模块 2：后端骨架搭建

**目标**: Express + TypeScript 基础框架，路由、中间件、0G 初始化

**任务清单**:

- [ ] 初始化 `package.json` + TypeScript 配置
- [ ] 安装依赖: `express`, `ethers@6`, `cors`, `dotenv`, `@0gfoundation/0g-ts-sdk`, `@0glabs/0g-serving-broker`
- [ ] 创建 `src/index.ts` — Express 启动入口
- [ ] 创建 `src/config/index.ts` — 环境变量加载 + 校验
- [ ] 创建 `src/config/contracts.ts` — 合约 ABI + 地址
- [ ] 创建 `src/config/og.ts` — 0G 组件初始化（Provider, Wallet, Indexer, KvClient, Broker）
- [ ] 创建路由文件:
  - `src/routes/agentRoutes.ts` — `/api/agents/*`
  - `src/routes/chatRoutes.ts` — `/api/chat/*`
  - `src/routes/memoryRoutes.ts` — `/api/memory/*`
  - `src/routes/decisionRoutes.ts` — `/api/decisions/*`
  - `src/routes/exploreRoutes.ts` — `/api/explore/*`
- [ ] 创建中间件:
  - `src/middleware/errorHandler.ts` — 统一错误处理
  - `src/middleware/auth.ts` — 钱包签名验证（可选，MVP 可简化）
- [ ] 创建 `src/utils/encryption.ts` — 加密工具占位
- [ ] 健康检查端点 `GET /api/health` — 返回 0G 连接状态

**API 端口**: 4000

**0G 初始化代码结构**:
```typescript
// src/config/og.ts
export async function initializeOG() {
  // 1. ethers Provider + Wallet
  // 2. 0G Storage Indexer
  // 3. 0G Storage KV Client
  // 4. 0G Compute Broker (延迟初始化)
  // 5. 合约实例 (INFT, DecisionChain, Registry)
}
```

**交付标准**: `pnpm --filter backend dev` 启动成功，`/api/health` 返回 200

---

### 模块 3：前端骨架 + 钱包连接

**目标**: Next.js 14 App Router + RainbowKit + wagmi + 0G 网络配置

**任务清单**:

- [ ] `create-next-app` 初始化 (TypeScript + TailwindCSS + App Router)
- [ ] 安装依赖: `@rainbow-me/rainbowkit`, `wagmi`, `viem`, `@tanstack/react-query`
- [ ] 配置 `lib/wagmiConfig.ts` — 0G 测试网/主网链定义
- [ ] 配置 `lib/contracts.ts` — 合约 ABI + 地址（从 contracts 包共享）
- [ ] 创建 `app/layout.tsx` — 全局布局 (WagmiProvider + RainbowKitProvider + QueryClientProvider)
- [ ] 创建 `components/Navbar.tsx` — 导航栏 + ConnectButton
- [ ] 创建空白页面路由:
  - `app/page.tsx` — 首页
  - `app/dashboard/page.tsx` — 仪表盘
  - `app/agent/create/page.tsx` — 创建 Agent
  - `app/agent/[id]/chat/page.tsx` — 对话
  - `app/agent/[id]/memory/page.tsx` — 记忆
  - `app/agent/[id]/decisions/page.tsx` — 决策
  - `app/explore/page.tsx` — 市场
  - `app/verify/page.tsx` — 验证器
- [ ] 配置 TailwindCSS 主题（深色科技风）
- [ ] 验证钱包连接功能（MetaMask 连接 0G 测试网）

**0G 网络定义**:
```typescript
const ogTestnet = {
  id: 16602,
  name: '0G Testnet',
  network: 'og-testnet',
  nativeCurrency: { name: '0G', symbol: 'A0GI', decimals: 18 },
  rpcUrls: { default: { http: ['https://evmrpc-testnet.0g.ai'] } },
  blockExplorers: { default: { name: '0G Explorer', url: 'https://chainscan-galileo.0g.ai' } },
};
```

**交付标准**: `pnpm --filter frontend dev` 启动成功，钱包可连接 0G 测试网

---

### 模块 4：合约部署（Testnet）

**目标**: 将 3 个合约部署到 0G 测试网，配置权限

**前置**: 需要 0G 测试网代币

**任务清单**:

- [ ] 获取 0G 测试网水龙头代币
- [ ] 执行部署脚本 `npx hardhat run scripts/deploy.ts --network og-testnet`
- [ ] 记录合约地址到 `.env` 和 `deployment.json`
- [ ] 执行权限配置脚本:
  - `DecisionChain.addRecorder(backendWalletAddress)`
- [ ] 在 0G Explorer 验证合约
- [ ] 更新前端 + 后端的合约地址配置

**输出物**:
```json
// deployment.json
{
  "network": "og-testnet",
  "chainId": 16602,
  "contracts": {
    "DecisionChain": "0x...",
    "SealMindINFT": "0x...",
    "AgentRegistry": "0x..."
  },
  "deployer": "0x...",
  "timestamp": "2026-03-XX"
}
```

**交付标准**: 合约部署成功，Explorer 可查

---

### 模块 5：AgentService（后端）

**目标**: 实现 Agent 创建/查询全流程

**任务清单**:

- [ ] 实现 `services/AgentService.ts`:
  - `createAgent(name, model, personality, description)`:
    1. 调用 INFT 合约 `createAgent()` 铸造 Token
    2. 在 0G Storage 创建 KV Stream（记忆库初始化）
    3. 写入初始记忆（人格设定 + 描述）
    4. 调用 Registry 合约 `registerAgent()` 注册
    5. 返回 agentId + txHash
  - `getAgent(agentId)`: 从合约查询 Profile + Stats + Skills
  - `getAgentsByOwner(address)`: 链上查询该地址所有 Token ID
- [ ] 实现 `routes/agentRoutes.ts`:
  - `POST /api/agents` — 创建 Agent
  - `GET /api/agents/:agentId` — 获取详情
  - `GET /api/agents/owner/:address` — 获取某地址 Agent 列表
- [ ] 实现 `routes/exploreRoutes.ts`:
  - `GET /api/explore/agents?offset=0&limit=20` — 浏览公开 Agent

**交付标准**: 通过 API 创建 Agent，链上可查 INFT

---

### 模块 6：MemoryVaultService（加密记忆）

**目标**: 实现客户端加密的去中心化记忆存储

**任务清单**:

- [ ] 实现 `utils/encryption.ts`:
  - `deriveAgentKey(signer, agentId)` — 钱包签名 → SHA-256 → 256-bit 密钥
  - `encryptMemory(plaintext, key)` — AES-256-GCM 加密（随机 IV + AuthTag）
  - `decryptMemory(cipherData, key)` — AES-256-GCM 解密
  - `hashContent(content)` — keccak256 哈希

- [ ] 实现 `services/MemoryVaultService.ts`:
  - `initializeVault(agentId)`:
    1. 计算 Stream ID = `keccak256(encode("SealMind:MemoryVault", agentId))`
    2. 通过 0G Storage Indexer 选择节点
    3. 创建 KV Stream
  - `saveMemory(agentId, memory, key)`:
    1. JSON 序列化记忆对象
    2. 生成随机 IV → AES-256-GCM 加密
    3. 计算明文 keccak256 哈希
    4. 通过 Batcher 写入 KV Store (`key = "memory:{uuid}"`)
    5. 更新索引 (`key = "index:memories"`)
  - `loadMemories(agentId, key, options?)`:
    1. 读取索引获取记忆列表
    2. 按 key 逐条读取加密数据
    3. AES-256-GCM 解密 → 反序列化
    4. 按 type/timestamp 排序
  - `buildContext(agentId, key)`:
    1. 加载最近 50 条记忆
    2. 筛选 personality → 全部纳入 [Personality] 块
    3. 筛选 knowledge → 最新 5 条 → [Knowledge] 块
    4. 筛选 conversation → 最新 10 条 → [Recent] 块
    5. 返回 string[] 上下文数组
  - `deleteMemory(agentId, memoryId, key)` — 删除单条记忆

- [ ] 实现 `routes/memoryRoutes.ts`:
  - `GET /api/memory/:agentId` — 获取记忆列表
  - `POST /api/memory/:agentId` — 手动添加记忆
  - `DELETE /api/memory/:agentId/:memoryId` — 删除记忆

**记忆数据模型**:
```typescript
interface Memory {
  id: string;          // UUID
  agentId: number;     // INFT Token ID
  type: 'conversation' | 'knowledge' | 'personality' | 'skill' | 'decision';
  content: string;     // 明文
  importance: number;  // 0-1
  timestamp: number;   // Unix ms
  tags: string[];
}
```

**存储格式（加密后）**:
```typescript
interface EncryptedMemory {
  encryptedData: string; // Base64(密文 + AuthTag)
  iv: string;            // Base64(16字节 IV)
  dataHash: string;      // keccak256(明文)
  timestamp: number;
}
```

**交付标准**: 能写入 / 读取 / 解密 0G Storage KV Store 中的加密记忆

---

### 模块 7：SealedInferenceService（TEE 推理）

**目标**: 接入 0G Compute Sealed Inference，实现可验证 TEE 推理

**任务清单**:

- [ ] 实现 `services/SealedInferenceService.ts`:
  - `initialize()`:
    1. 创建 `ethers.JsonRpcProvider` + `ethers.Wallet`
    2. 调用 `createBroker()` 创建 0G Compute 代理
    3. 调用 `broker.initialize()` 初始化
  - `inference(agentId, prompt, memoryContext)`:
    1. **构建系统提示词**: 拼接 `[Personality]\n...\n[Knowledge]\n...\n[Recent]\n...`
    2. **发现提供商**: `broker.listServices()` → 筛选 `model === 'deepseek-v3.1'` 且 `verifiability === 'TeeML'`
    3. **确认 + 充值**: `broker.acknowledgeProviderIfNeeded()` + `broker.ensureFundsForProvider()`
    4. **生成认证头**: `broker.getRequestHeaders(address, prompt)`
    5. **发送请求**: POST OpenAI 兼容格式到提供商 URL
    6. **处理响应**: `broker.processResponse()` → 提取 TEE 签名
    7. **构建证明**: `{ modelHash, inputHash, outputHash, signature, timestamp, teeAttestation }`
  - `listAvailableModels()` — 列出可用的 TeeML 模型

- [ ] 实现降级策略:
  - DeepSeek V3.1 不可用 → 切换 Qwen 2.5 VL 72B
  - 所有 TeeML 提供商离线 → 普通推理模式 + 警告标记
  - 超时 (>30s) → 自动重试 1 次

- [ ] 编写推理测试脚本

**请求格式**:
```typescript
{
  model: "deepseek-v3.1",
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage }
  ],
  temperature: 0.7,
  max_tokens: 2048
}
```

**推理证明结构**:
```typescript
interface InferenceProof {
  modelHash: string;    // keccak256("deepseek-v3.1")
  inputHash: string;    // keccak256(userInput)
  outputHash: string;   // keccak256(aiResponse)
  signature: string;    // TEE 硬件签名
  timestamp: number;    // Unix 时间戳
  teeAttestation: string; // TEE 远程证明
}
```

**交付标准**: 发送 prompt → 获得 AI 回复 + TeeML 签名证明

---

### 模块 8：DecisionChainService（决策上链）

**目标**: 实现智能决策上链策略

**任务清单**:

- [ ] 实现 `services/DecisionChainService.ts`:
  - 内部维护批量队列: `batchQueue: Map<number, Decision[]>`
  - `recordDecision(agentId, proof, importance)`:
    - `importance >= 4` → 立即上链（调用合约 `recordDecision()`）
    - `importance == 3` → 加入批量队列
    - `importance <= 2` → 仅存 0G Storage（不上链）
    - 当批量队列达到 10 条 → 自动 `flushBatch()`
  - `flushBatch(agentId)`:
    - 将队列打包为数组
    - 调用合约 `recordBatchDecisions()`
    - 清空队列
  - `verifyProof(proofHash)`:
    - 调用合约 `verifyProof(proofHash)` → 返回 true/false
    - 如果存在，获取完整 Decision 结构体
  - `getDecisions(agentId, page, limit)`:
    - 从合约获取决策总数
    - 分页获取决策记录
  - `getDecisionStats(agentId)`:
    - 返回总决策数、最近决策时间等统计

- [ ] 实现 `routes/decisionRoutes.ts`:
  - `GET /api/decisions/:agentId?page=1&limit=20` — 获取决策历史
  - `POST /api/decisions/verify` — 验证证明 (`{ proofHash }`)
  - `GET /api/decisions/:agentId/stats` — 决策统计

**交付标准**: 决策可按策略上链，proofHash 可验证

---

### 模块 9：对话 API 全流程联调

**目标**: 打通 "对话 → 推理 → 存记忆 → 上链" 完整流程

**任务清单**:

- [ ] 实现核心对话端点 `POST /api/chat/:agentId`:
  ```
  请求: { message: string, importance: number (1-5) }

  流程:
  1. 参数校验 (agentId 存在, message 非空, importance 1-5)
  2. MemoryVaultService.deriveAgentKey(signer, agentId) → 密钥
  3. MemoryVaultService.buildContext(agentId, key) → 上下文
  4. SealedInferenceService.inference(agentId, message, context)
     → { response, proof }
  5. MemoryVaultService.saveMemory(agentId, 新对话记忆, key)
  6. DecisionChainService.recordDecision(agentId, proof, importance)
  7. INFT 合约.recordInference(agentId) → 更新计数+升级
  8. 返回响应
  ```

- [ ] 实现对话历史端点 `GET /api/chat/:agentId/history`:
  - 从 Memory Vault 加载 type=conversation 的记忆
  - 格式化为对话消息格式返回

- [ ] 联调测试:
  - 创建 Agent → 首次对话 → 验证记忆存储 → 验证链上记录
  - 连续对话 → 验证上下文构建 → 验证记忆积累
  - 高重要性对话 → 验证立即上链
  - 低重要性对话 → 验证批量上链

**API 响应格式**:
```json
{
  "response": "根据我的分析...",
  "proof": {
    "proofHash": "0xdef0...1234",
    "modelHash": "0x5678...9abc",
    "teeSignature": "0x...",
    "verified": true,
    "onChain": true,
    "txHash": "0x1111...2222",
    "explorerUrl": "https://chainscan-galileo.0g.ai/tx/0x..."
  },
  "agentStats": {
    "totalInferences": 43,
    "level": 1,
    "trustScore": 50.00
  }
}
```

**交付标准**: Postman/curl 测试完整对话流程，所有数据正确存储和上链

---

### 模块 10：前端页面开发

**目标**: 实现所有前端页面（8 个页面 + 5 个核心组件）

#### 10.1 核心组件开发

- [ ] `components/AgentCard.tsx` — Agent 卡片（等级徽章、统计数据、标签）
- [ ] `components/ChatMessage.tsx` — 聊天消息（✅ Verified 标记、用户/AI 区分）
- [ ] `components/ProofModal.tsx` — 证明详情弹窗（模型哈希、TEE 签名、链上交易、Explorer 链接）
- [ ] `components/MemoryBrowser.tsx` — 记忆浏览器（分类筛选、加密状态显示）
- [ ] `components/DecisionTimeline.tsx` — 决策时间线（importance 等级、链上状态）

#### 10.2 页面开发（按优先级排序）

**P0 核心页面:**

- [ ] `app/page.tsx` — **首页**
  - 产品介绍区（标题 + 一句话描述 + 架构图）
  - 全网统计区（Agent 总数、推理总次数、验证总次数）
  - CTA: 连接钱包 → 开始使用

- [ ] `app/dashboard/page.tsx` — **仪表盘**
  - 我的 Agent 列表（AgentCard 卡片网格）
  - 创建 Agent 入口
  - 空状态引导

- [ ] `app/agent/create/page.tsx` — **创建 Agent**
  - 表单: 名称、描述、模型选择、人格设定
  - 钱包签名 → 铸造 INFT 动画
  - 成功后跳转对话页面

- [ ] `app/agent/[id]/chat/page.tsx` — ⭐ **对话核心页面**
  - Agent 信息头（名称、等级、模型）
  - 聊天消息列表（ChatMessage 组件）
  - 每条 AI 回复旁 ✅ Verified 标记（点击展开 ProofModal）
  - 消息输入框 + 重要性选择器 + 发送按钮
  - 加载状态动画（推理中 → 存记忆中 → 上链中）

- [ ] `app/verify/page.tsx` — **验证器**
  - 输入框: 粘贴 proofHash
  - 点击验证 → 显示链上记录详情
  - 验证成功/失败状态

**P1 重要页面:**

- [ ] `app/agent/[id]/memory/page.tsx` — **记忆浏览器**
  - 按类型分类标签（conversation/knowledge/personality/skill/decision）
  - 记忆列表（加密状态图标、时间、重要性）
  - 手动添加记忆功能

- [ ] `app/agent/[id]/decisions/page.tsx` — **决策审计**
  - DecisionTimeline 组件
  - 每条记录: importance 等级徽章 + 链上状态 + Explorer 链接
  - 分页加载

**P2 加分页面:**

- [ ] `app/explore/page.tsx` — **Agent 市场**
  - AgentCard 网格列表
  - 按等级/标签/热度排序
  - 分页

#### 10.3 Hooks 开发

- [ ] `hooks/useAgent.ts` — Agent CRUD + 列表查询
- [ ] `hooks/useChat.ts` — 对话发送 + 历史加载
- [ ] `hooks/useVerify.ts` — 证明验证
- [ ] `hooks/useMemory.ts` — 记忆管理
- [ ] `hooks/useDecisions.ts` — 决策查询

#### 10.4 UI 设计语言

- **主题**: 深色科技风（#0a0a0a 背景 + #00ff88 绿色强调 + 蓝紫渐变）
- **字体**: Inter / JetBrains Mono（代码/哈希展示）
- **组件库**: 自建 + TailwindCSS，不引入重型 UI 库
- **动画**: 铸造动画、推理进度、证明验证成功动效

**交付标准**: 所有页面可正常访问，数据从后端 API 加载，核心交互完整

---

### 模块 11：主网部署 + 端到端测试

**目标**: 合约部署到 0G 主网，全流程验证

**任务清单**:

- [ ] 获取 0G 主网代币
- [ ] 部署合约到 0G Mainnet (Chain ID: 16661)
- [ ] 更新所有配置为主网地址
- [ ] 端到端测试:
  - 连接钱包 → 创建 Agent → 对话 → 验证证明
  - 检查 0G Explorer 链上记录
  - 检查记忆存储/读取
  - 检查决策上链
- [ ] 性能测试:
  - 推理延迟 < 30s
  - 合约交易确认 < 5s
  - 页面加载 < 3s
- [ ] 安全检查:
  - .env 不在 Git 中
  - 私钥不暴露在前端
  - 合约权限配置正确

**交付标准**: 主网合约部署完成，Explorer 链接可访问，全流程正常

---

### 模块 12：UI 打磨 + Demo 准备 + 最终提交

**目标**: 完善所有提交材料

**任务清单**:

- [ ] UI/UX 打磨:
  - 响应式适配
  - 加载状态 / 空状态 / 错误状态
  - 动画效果细化
  - 颜色/间距微调

- [ ] Demo 视频录制 (≤3 分钟):
  ```
  [0:00-0:20] 开场: 产品介绍
  [0:20-1:00] 创建 Agent (铸造 INFT)
  [1:00-2:00] ⭐ 对话 + Verified 证明（WOW MOMENT）
  [2:00-2:30] 记忆浏览
  [2:30-3:00] 架构总结 + 0G 组件高亮
  ```

- [ ] README.md 完善:
  - 项目概述 + 架构图
  - 0G 组件集成说明
  - 本地部署步骤
  - 合约地址 + Explorer 链接

- [ ] Twitter 推文:
  - 项目介绍 + Demo 视频/截图
  - #0GHackathon #BuildOn0G @0G_labs @0g_CN @HackQuest_

- [ ] HackQuest 平台提交:
  - 项目名称 + 描述
  - GitHub Repo
  - 主网合约地址 + Explorer 链接
  - Demo 视频链接
  - Twitter 推文链接

**交付标准**: 所有提交材料齐全，通过 Checklist

---

## 四、按周时间线

### Week 1: 3/25 — 3/31 | 项目骨架 + 合约 + 基础设施

| 日期 | 模块 | 任务 | 交付物 |
|------|------|------|--------|
| 3/25 (二) | #0 | Monorepo 初始化 + 工具安装 | 项目可编译 |
| 3/26 (三) | #1 | SealMindINFT.sol + DecisionChain.sol | 合约代码 |
| 3/27 (四) | #1 | AgentRegistry.sol + 单元测试 | 测试通过 |
| 3/28 (五) | #2+#3 | 后端骨架 + 前端骨架 | 双端可启动 |
| 3/29 (六) | #4 | 合约部署 Testnet + 验证 | 合约地址 |
| 3/30 (日) | #3 | 前端钱包连接 + 0G 网络配置 | 钱包可连 |
| 3/31 (一) | — | 缓冲 / 修复 | 稳定基础 |

### Week 2: 4/01 — 4/07 | 推理 + 记忆 + Agent 服务

| 日期 | 模块 | 任务 | 交付物 |
|------|------|------|--------|
| 4/01 (二) | #7 | SealedInferenceService (初始化 + 提供商发现) | Broker 就绪 |
| 4/02 (三) | #7 | SealedInferenceService (推理 + 证明构建) | TEE 推理可用 |
| 4/03 (四) | #6 | MemoryVaultService (加密 + 0G Storage 写入) | 加密写入 |
| 4/04 (五) | #6 | MemoryVaultService (解密读取 + 上下文构建) | 记忆完整 |
| 4/05 (六) | #5 | AgentService (创建 + 查询 + INFT) | Agent 可创建 |
| 4/06 (日) | #8 | DecisionChainService (上链策略 + 批量) | 决策上链 |
| 4/07 (一) | #8 | DecisionChainService (验证 + 查询) | 完整服务 |

### Week 3: 4/08 — 4/14 | 联调 + 前端核心页面

| 日期 | 模块 | 任务 | 交付物 |
|------|------|------|--------|
| 4/08 (二) | #9 | 对话 API 联调 (推理→记忆→上链) | E2E 打通 |
| 4/09 (三) | #9 | 联调测试 + Bug 修复 | 稳定 API |
| 4/10 (四) | #10 | 首页 + Dashboard | 页面可访问 |
| 4/11 (五) | #10 | 创建 Agent 页面 | 能创建 |
| 4/12 (六) | #10 | ⭐ 对话核心页面 + Verified 标记 | WOW MOMENT |
| 4/13 (日) | #10 | ProofModal + 验证器页面 | 证明可查 |
| 4/14 (一) | #10 | 记忆浏览器 + 决策审计页面 | 完整功能 |

### Week 4: 4/15 — 4/22 | UI 打磨 + HK Demo Day

| 日期 | 模块 | 任务 | 交付物 |
|------|------|------|--------|
| 4/15 (二) | #10 | Agent 市场页面 | 浏览功能 |
| 4/16 (三) | #12 | UI 打磨 (动画 + 响应式) | 精美 UI |
| 4/17 (四) | #12 | UI 打磨 (空状态 + 错误处理) | 完善体验 |
| 4/18 (五) | #12 | 边缘情况修复 | 稳定版本 |
| 4/19 (六) | — | Demo 排练 + 测试数据准备 | Demo 就绪 |
| 4/20 (日) | — | Demo 排练 | 演示流畅 |
| 4/21 (一) | — | 最终调试 | 万全准备 |
| **4/22 (二)** | — | **🇭🇰 HK Demo Day** | **现场展示** |

### Week 5: 4/23 — 5/02 | 主网 + 测试

| 日期 | 模块 | 任务 | 交付物 |
|------|------|------|--------|
| 4/23-25 | — | 根据 Demo Day 反馈调整 | 优化版本 |
| 4/26-27 | #11 | 主网合约部署 | 主网地址 |
| 4/28-30 | #11 | 端到端测试 + Bug 修复 | 稳定版本 |
| 5/01-02 | #11 | 安全审查 + 性能优化 | 生产就绪 |

### Week 6: 5/03 — 5/09 | 提交材料

| 日期 | 模块 | 任务 | 交付物 |
|------|------|------|--------|
| 5/03-04 | #12 | Demo 视频录制 | YouTube 链接 |
| 5/05-06 | #12 | README + 文档 + 代码清理 | 完整文档 |
| 5/07 | #12 | Twitter 推文发布 | 推文链接 |
| 5/08 | #12 | 最终检查 + 提交 | ✅ 提交完成 |
| **5/09** | — | **⚠️ 截止日 23:59 UTC+8** | **所有材料** |

---

## 五、MVP 优先级（时间不够时的裁剪策略）

```
P0 (必须完成 — 否则不能参赛):
  ✅ 连接钱包 + 创建 Agent (铸造 INFT)
  ✅ 与 Agent 对话 (Sealed Inference)
  ✅ 每条回复显示 ✅ Verified + 证明信息
  ✅ 主网合约部署 + Explorer 链接
  ✅ Demo 视频 + README + Twitter

P1 (重要 — 直接影响获奖):
  ✅ Memory Vault 加密记忆存储 + 读取
  ✅ 证明验证器页面
  ✅ Agent 等级显示 + 动态演化
  ✅ Dashboard 仪表盘

P2 (加分 — 有更好):
  ○ Decision Chain 决策上链 (单条+批量)
  ○ Agent 市场浏览
  ○ 记忆浏览器完整功能
  ○ 决策审计日志页面

P3 (Nice to have):
  ○ Agent 搜索/标签筛选
  ○ 链上争议仲裁
  ○ 跨 Agent 记忆迁移
  ○ 高级动画效果
```

---

## 六、Python 辅助工具（uv 管理）

`scripts/` 目录下使用 `uv` 管理 Python 虚拟环境，提供以下辅助工具:

```
scripts/
├── pyproject.toml          # uv 项目配置
├── check_0g_health.py      # 0G 网络连通性检查
├── generate_test_data.py   # 生成测试数据（预置 Agent、记忆等）
├── verify_deployment.py    # 验证合约部署状态
└── export_abi.py           # 从 Hardhat artifacts 导出 ABI 到前端
```

**uv 初始化**:
```bash
cd scripts/
uv init
uv add web3 eth-abi requests
```

---

## 七、风险清单与应对

| 风险 | 概率 | 影响 | 应对方案 |
|------|------|------|----------|
| Sealed Inference API 不稳定 | 🟡 中 | 🔴 高 | 降级为普通 0G Compute 推理 + 模拟签名标记 |
| 0G Storage KV 延迟高 | 🟡 中 | 🟡 中 | 增加本地缓存层，异步写入 |
| 0G 测试网代币不足 | 🟢 低 | 🟡 中 | 提前通过水龙头多次获取 |
| 合约 gas 费过高 | 🟢 低 | 🟡 中 | 批量上链 + Optimizer 优化 |
| Demo 时网络异常 | 🟡 中 | 🔴 高 | 预录完整 Demo 视频备用 |
| 功能做不完 | 🟡 中 | 🔴 高 | 严格按 P0→P1→P2 优先级执行 |

---

## 八、需要你提供的信息

开发过程中可能需要你提供:

1. **0G 测试网私钥** — 用于合约部署和后端服务（或我帮你生成测试钱包）
2. **WalletConnect Project ID** — 用于前端钱包连接（需在 https://cloud.walletconnect.com 注册）
3. **0G 测试网代币** — 需要通过水龙头获取（我可以帮你查找水龙头地址）
4. **HK Demo Day 参加情况** — 是否参加 4/22 香港 Demo Day，影响 UI 打磨时间
5. **团队情况** — 是否有其他队友参与开发

---

## 九、目前进度（开发进度追踪）

见progress.md