# 🔍 SealMind 全项目搜索报告（大小写敏感）

**搜索范围**: `/data/home/siriusyao/work/AIsphere/`  
**搜索条件**: 所有包含 "SealMind" 的文件（大小写敏感）  
**总出现次数**: ~387 次（含注释、路径、配置）  
**生成时间**: 2026-04-14

---

## 📊 分类汇总

| 分类 | 文件数 | 出现总次数 | 说明 |
|:-----|:-----:|:-------:|:-----|
| **1. Solidity 合约** | 3 | ~35 | 合约代码 + 注释 |
| **2. TypeScript/JavaScript** | 20+ | ~120 | 后端服务 + 前端页面 |
| **3. JSON 配置** | 10+ | ~50 | package.json、缓存、配置 |
| **4. Markdown 文档** | 15+ | ~180 | README、规划、分析 |
| **5. 其他** | 5+ | ~2 | Python 脚本、环境变量 |

---

## 1️⃣ Solidity 合约文件（.sol）中的出现

### 📄 `/packages/contracts/contracts/SealMindINFT.sol` ← **核心合约**（已部署到 0G Mainnet）

**地位**: ⚠️ **已部署，不能改文件名/类名**

| 行号 | 内容 | 类型 | 说明 |
|:-----|:-----|:-----|:-----|
| 9 | `@title SealMindINFT` | 注释 | Solidity 文档 |
| 10 | `@notice AI Agent 身份代币（INFT）` | 注释 | 文档字符串 |
| 13 | `contract SealMindINFT is ERC721Enumerable, Ownable, ReentrancyGuard` | 代码 | **合约定义** |
| 77 | `"SealMindINFT: not authorized operator"` | 字符串 | 错误消息 |
| 82 | `"SealMindINFT: token does not exist"` | 字符串 | 错误消息 |
| 88 | `ERC721("SealMind Agent", "SMAI")` | 代码 | **NFT 名称 + Symbol** |
| 101-103 | `"SealMindINFT: name cannot be empty"` 等 | 字符串 | 验证错误 |
| 144 | `"SealMindINFT: zero address"` | 字符串 | 验证错误 |
| 163-164 | `"SealMindINFT: already certified"` 等 | 字符串 | Passport 验证 |
| 187 | `"SealMindINFT: not certified"` | 字符串 | Passport 验证 |
| 215 | `"SealMindINFT: empty experience hash"` | 字符串 | Soul 验证 |

**关键结构体**:
- `AgentProfile` — name, model, metadataHash, encryptedURI, createdAt
- `AgentStats` — totalInferences, totalMemories, trustScore, level, lastActiveAt
- `AgentPassport` — passportHash, capabilityProof, certifiedAt, isActive *(v3.0 新增)*
- `SoulState` — currentHash, experienceCount, lastExperienceAt *(v3.0 新增)*

---

### 📄 `/packages/contracts/contracts/AgentMarketplace.sol`

| 行号 | 内容 | 说明 |
|:-----|:-----|:-----|
| 9 | `@notice Escrow-based marketplace for buying/selling SealMind Agent INFTs` | 合约文档 |

---

### 📄 `/packages/contracts/contracts/Placeholder.sol`

| 行号 | 内容 | 说明 |
|:-----|:-----|:-----|
| 5 | `string public constant NAME = "SealMind Bootstrap";` | 常量定义 |

---

## 2️⃣ TypeScript/JavaScript 文件中的出现

### 🔧 **后端服务** (`packages/backend/src/`)

#### `/services/AgentService.ts`
- **L46**: `// ─── ABI (minimal, matches SealMindINFT.sol exactly) ─────────────────────────`
- **L217**: `const streamId = keccak256(toUtf8Bytes(`SealMind:AgentMetadata:${String(metadata.name ?? "unknown")}`))`
  - 💡 0G Storage 流 ID 生成（命名约定）

#### `/services/MemoryVaultService.ts`
- **L52**: `return keccak256(toUtf8Bytes(`SealMind:MemoryVault:${agentId}`))`
  - 💡 0G Storage KV 流 ID 生成

#### `/services/SoulService.ts`
- **L100**: `const streamId = ethers.keccak256(ethers.toUtf8Bytes(`SealMind:Soul:${agentId}`))`
  - 💡 灵魂经验哈希链的 0G Storage 流 ID

#### `/services/MultiAgentService.ts`
- **L73**: `const MULTI_AGENT_STREAM = ethers.keccak256(ethers.toUtf8Bytes("SealMind:MultiAgent:Global"))`
  - 💡 Hive Mind 全局流 ID

#### `/services/HiveMindService.ts`
- **L55**: `const HIVEMIND_STREAM_ID = ethers.keccak256(ethers.toUtf8Bytes("SealMind:HiveMind:Global"))`
  - 💡 Hive Mind 全局流（重复定义，可能需要统一）

#### `/services/SealedInferenceService.ts`
- **L211**: `content: context || "You are a helpful AI agent on SealMind, a privacy-sovereign AI Agent OS built on 0G Network."`
  - 💡 推理系统 prompt

#### `/services/BountyService.ts`
- **L104**: `description: "Write comprehensive Hardhat tests for the SealMindINFT and BountyBoard contracts..."`
- **L183-184**: `title: "Translate SealMind Whitepaper to Japanese"`
- **L204**: `description: "...onboarding video explaining how to create and interact with a SealMind AI Agent."`
- **L243**: `title: "Design SealMind Agent Marketplace UI/UX"`
- **L264**: `description: "Build a Python SDK wrapper for the SealMind REST API..."`
  - 💡 赏金任务样本数据

#### `/services/OpenClawService.ts`
- **L147**: `Register a SealMind agent as an OpenClaw agent with capabilities.`
- **L226**: `Routes through SealMind's inference/memory/decision pipeline.`
- **L238**: `// Resolve SealMind token ID`

#### `/utils/encryption.ts`
- **L9**: `const SERVER_SECRET = process.env.ENCRYPTION_SECRET ?? "SealMind:ServerSecret:v3:0G-Hackathon-2026"`
  - ⚠️ 硬编码的加密默认密钥（开发用，生产应改为环境变量）
- **L22**: `const info = `SealMind:AgentKey:${String(walletAddress).toLowerCase()}:${agentId}`
  - 💡 HKDF info 字符串用于密钥推导

#### `/routes/gatewayRoutes.ts`
- **L13**: `description: "Register and certify a new AI agent on SealMind..."`
- **L29**: `description: "Send a message to a SealMind agent with verifiable TEE inference."`
- **L37**: `description: "Post a task bounty on SealMind on-chain marketplace..."`
- **L101**: `description: "Browse public agents on the SealMind marketplace."`
- **L152**: `Return all available SealMind actions (self-discovery for agents)`
- **L158**: `platform: "SealMind"`
  - 💡 网关 API 自动发现端点

#### `/routes/openclawRoutes.ts`
- **L26**: `Register a SealMind agent as an OpenClaw agent.`

---

### 🎨 **前端页面** (`packages/frontend/`)

#### `/lib/wagmiConfig.ts`
- **L73**: `appName: "SealMind"`
  - 💡 Wagmi 钱包连接器配置

#### `/lib/i18n.ts`
- **L41**: `dash_connect_desc: "连接钱包后即可查看和管理你的 SealMind AI Agent"`
  - 💡 国际化文本

#### `/app/agent/[id]/soul/page.tsx`
- **L384**: `recorded on-chain. Even SealMind cannot see the original data.`
  - 💡 灵魂页面英文描述

#### `/app/openclaw/page.tsx`
- **L118-119**: `"Register SealMind Agents as OpenClaw Skills..."`
- **L192**: `"SealMind native capabilities exposed as OpenClaw Skills"`
- **L224**: `"How OpenClaw integrates with SealMind"`
- **L236**: `│      SealMind Core     │` (ASCII 图表)
- **L292**: `"Register your SealMind Agent as an OpenClaw agent..."`
- **L296**: `<label className="text-sm font-medium text-slate-600">SealMind Token ID</label>`
  - 💡 OpenClaw 集成页面

---

### 📝 **其他 TS/TSX 文件**

#### `/packages/frontend/.next/types/app/` (自动生成)
多个文件注释行引用了旧路径 `/SealMind/packages/frontend/...`（这是 Next.js 缓存生成的，可忽略）

---

## 3️⃣ JSON 配置文件中的出现

### 📦 `package.json` 文件

#### `/packages/backend/package.json`
```json
{
  "name": "@sealmind/backend",
  "version": "0.1.0",
  ...
}
```

#### `/packages/frontend/package.json`
```json
{
  "name": "@sealmind/frontend",
  "version": "0.1.0",
  ...
}
```

#### `/packages/contracts/package.json`
```json
{
  "name": "@sealmind/contracts",
  "version": "0.1.0",
  ...
}
```

#### `/pnpm-workspace.yaml`
- 定义工作区包

---

### 🗂️ **缓存 + 状态文件**

#### `/packages/contracts/cache/solidity-files-cache.json`
- **L4, 41, 78, 115**: 文件路径缓存（包含 `SealMind` 目录名）
- **L118**: `"sourceName": "contracts/SealMindINFT.sol"`
- **L153**: `"SealMindINFT"` (编译器输出)

#### `/packages/contracts/.omc/state/last-tool-error.json`
- 错误日志中的目录路径（`/data/home/siriusyao/work/SealMind/...`）

#### `/packages/frontend/.omc/state/last-tool-error.json`
- 错误日志中的目录路径

---

## 4️⃣ Markdown 文档中的出现

### 📚 **核心文档** (根目录)

#### `/CLAUDE.md` (项目指导文档)
- **L9**: `SealMind is a **privacy-sovereign AI Agent operating system** built on [0G Network](https://0g.ai)`
- **L10**: `- **INFT** — On-chain ERC-721 identity (SealMindINFT.sol)`
- **L84**: `| SealMindINFT | 0x1f29Bd4E0426222a78Ce0D484677A672DF3E8fa6 |` (Testnet)
- **L113**: `- **SealMindINFT** — ERC721Enumerable with AgentProfile + AgentStats structs...`
  - 💡 **完整的项目概述** — 这是 Claude 代码的主要参考

#### `/README.md`
- **L145**: `| ![](https://img.shields.io/badge/-SealMindINFT-8B5CF6?style=flat-square) | ... | Agent Identity (ERC-721) + Passport + Living Soul |`
- **L182**: `git clone https://github.com/henrymartin262/SealMind.git`
- **L183**: `cd SealMind`
- **L502**: `| ![](https://img.shields.io/badge/-SealMindINFT-8B5CF6?style=flat-square) | 28 | Creation, minting, soul signature, levels, passport, living soul |`
- **L525**: `<a href="https://github.com/henrymartin262/SealMind"><img src="...` (GitHub 徽章)

#### `/README_CN.md`
- 中文版 README（类似结构）

#### `/PROGRESS.md` (进度跟踪)
- **L29**: `**1.1 SealMindINFT.sol — Agent 身份 INFT**`
- **L61**: `- SealMindINFT: 0x1f29Bd4E0426222a78Ce0D484677A672DF3E8fa6` (Testnet)
- **L197**: `- [x] SealMindINFT.sol 添加 soulSignatures mapping`
- **L206**: `- [x] 重新部署 SealMindINFT 到 0G Mainnet（含新字段）`
- **L255**: `- [x] SealMindINFT.sol 新增 AgentPassport 结构体`
- **L284**: `- [x] SealMindINFT.sol 新增 SoulState 结构体`
- **L485**: `- **合约扩展（SealMindINFT.sol v3.0）**：新增 AgentPassport + SoulState...`
- **L521**: `- **SealMindINFT（含 Soul/Passport 扩展）**: 0xc0238FEb50072797555098DfD529145c86Ab5b59` (Mainnet)

---

### 📋 **规划文档**

#### `/PLAN.md` (详细开发计划)
- **L1**: `# 📋 SealMind 开发计划 (PLAN.md)`
- **L3**: `> **项目**: SealMind — 隐私自主 AI Agent 操作系统`
- 多次提及功能模块、合约扩展、服务设计
- **L670**: `packages/contracts/contracts/SealMindINFT.sol — 扩展 Passport + SoulState（原地修改）`

#### `/IMPLEMENTATION_ROADMAP.md`
- **L1**: `# 🚀 SealMind Implementation Roadmap`
- **L6**: `- [ ] **Task 1.1:** Design & write SealMindINFT.sol`
- **L26**: `Deployment order: DecisionChain → SealMindINFT → AgentRegistry`

#### `/EXPLORATION_SUMMARY.md` (探索总结)
- **L1**: `# 🧠 SealMind Project - Comprehensive Exploration Summary`
- **L12**: `SealMind provides AI Agents with four core capabilities:`
- 详细的架构说明、流程图、实现细节

---

### 📊 **竞品分析** (`/doc/`)

#### `/doc/Competitor_Analysis.md`
- **L4**: `> 分析视角：以 SealMind 为基准，全面分析同赛道竞品`
- **多次对比** SealMind vs MindVault、VeraSignal、Coal 等
- **L257**: `| **SealMind** | ✅ | ✅ 双层 | ✅ 3层降级 | ✅ 主网 | — | ✅ ERC-721 | 4 | 94 |`
- **L323-331**: 评审维度评分表（0G 集成、测试覆盖、UI/UX 等）

#### `/doc/SealMind_Competitive_Strategy.md`
- **L1**: `# SealMind 竞争优势与差异化策略`

#### `/doc/Demo_Script.md` (3 分钟演示脚本)
- **L1**: `# SealMind Demo 视频录制脚本（3 分钟版）`
- **L51**: `"SealMind gives every AI Agent a verifiable soul."`
- 详细的演示步骤和说辞

---

### 🔧 **配置 + 其他**

#### `/.env.example`
- **L2**: `# SealMind 环境变量配置`
- 列出所需的环境变量（PRIVATE_KEY、合约地址等）

#### `/scripts/demo_setup.py`
- **L3**: `SealMind Demo Setup Script`
- **L12**: `cd SealMind && python scripts/demo_setup.py [--api http://localhost:4000]`
- **L38**: `print("🎬 SealMind Demo Setup Script")`
- **L117**: `{"title": "...Smart Contract Security Audit...", "description": "Review the SealMind INFT contract..."}`

---

## 5️⃣ 其他文件中的出现

### 🐍 `/scripts/demo_setup.py`
- 演示脚本，设置赏金任务样本数据

### 💾 `/.env.example`
- 环境变量模板

### 🗂️ `/.tmp/` (临时文件)
- `sealmind-health.json`, `sealmind_exploration_summary.md`（可删除）

---

## 📋 改名影响评估

### ✅ **安全改名** (不影响功能)

这些出现 **不涉及核心功能**，改名不会破坏代码：

| 位置 | 类型 | 改名风险 |
|:-----|:-----|:--------|
| 文档 (README, PLAN, PROGRESS) | 📝 | ✅ 低 — 仅影响可读性 |
| 前端 UI 文本 + i18n | 🎨 | ✅ 低 — 纯文本/UI |
| 赏金任务描述 | 📌 | ✅ 低 — 样本数据 |
| Python 脚本注释 | 🐍 | ✅ 低 — 仅文档字符串 |
| 后端错误消息字符串 | 🔧 | ✅ 低 — 仅日志输出 |
| 0G Storage 流 ID 命名约定 | 🔗 | ⚠️ **中** — 见下 |

---

### ⚠️ **需谨慎改名** (可能影响新功能)

| 位置 | 类型 | 影响 | 建议 |
|:-----|:-----|:-----|:-----|
| `/utils/encryption.ts` L9, L22 | 🔐 | 密钥推导使用 "SealMind" 字符串 | 若改名，需同时更新 HKDF info 参数（影响现有加密密钥解密）|
| 0G Storage 流 ID | 🔗 | `keccak256(toUtf8Bytes("SealMind:MemoryVault:..."))` | 若改名，新创建的 Agent 会用新 Stream ID，但旧数据访问受阻 |
| Wagmi `appName` | 🔌 | 钱包连接器配置 | ✅ 安全 — 仅影响钱包 UI 显示 |

---

### 🚫 **不能改名** (已部署 + 链上数据)

| 位置 | 原因 | 后果 |
|:-----|:-----|:-----|
| **`SealMindINFT` 合约名** | ✅ 已部署到 0G Mainnet | 改名 = 新合约，旧 NFT 无法识别 |
| **`SealMind Agent` NFT Name** | ✅ 已铸造的 NFT 包含此名称 | 改名 = 合约 redeployment |
| **`SMAI` 符号** | ✅ 公开列表中登记的符号 | 改名 = 需更新所有交易所 |
| **已部署合约地址** | ✅ 用户钱包中持有 | 无法改变 |

---

## 🎯  重命名方案建议

### 场景 1: **仅改项目英文名** (如 SealMind → MyAgentOS)

**受影响的文件**:

```bash
# 必须改
CLAUDE.md                          # L9-10
README.md                          # L145, 182-183, 502, 525
PROGRESS.md                        # 全部
PLAN.md                            # 全部
.env.example                       # L2

# 应该改（保持一致性）
scripts/demo_setup.py              # L3, 12, 38
doc/*.md                           # 全部
packages/frontend/lib/i18n.ts      # L41

# 可选改（改进代码质量）
packages/backend/src/utils/encryption.ts  # L9 默认值、L22 info 字符串
packages/backend/src/services/*.ts        # 流 ID 约定（"SealMind:*"）
packages/frontend/lib/wagmiConfig.ts      # L73 appName
```

**操作步骤**:
1. 更新所有文档中的项目名称
2. 如改密钥约定，需考虑向后兼容（环境变量覆盖）
3. **不动合约** — 保持 `SealMindINFT` 原样
4. 建议保留 0G Storage 流 ID 约定不变（已有数据依赖）

---

### 场景 2: **改中文名称** (如 隐私自主 AI Agent 操作系统 → 其他描述)

**仅影响**:
- `/PLAN.md`, `/PROGRESS.md`, `/README_CN.md`
- `/doc/*.md` (全中文文档)
- 前端中文 i18n 文本

**风险**: ✅ 低 — 完全独立的语言层

---

## 📌 总结

| 分类 | 安全性 | 改名复杂度 |
|:-----|:-----:|:-------:|
| **Solidity 合约** | 🚫 | ❌ 极高 — 勿改 |
| **后端 TS** | ⚠️ | 🟡 中 — 流 ID、密钥需协调 |
| **前端 TSX** | ✅ | 🟢 低 — 仅文本替换 |
| **JSON 配置** | ✅ | 🟢 低 — 包名可改，功能无碍 |
| **Markdown 文档** | ✅ | 🟢 低 — 纯文本 |
| **Python 脚本** | ✅ | 🟢 低 — 演示脚本 |

