# SealMind — 隐私自主 AI Agent 操作系统

> 让每一次 AI 决策都可链上验证。赋予你的 AI Agent 灵魂：加密记忆 + 可证明推理 + 区块链身份。

![Built on 0G](https://img.shields.io/badge/构建于-0G%20Network-blue?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square)
![Solidity](https://img.shields.io/badge/Solidity-0.8.19-282828?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-14-000?style=flat-square)
![Hackathon](https://img.shields.io/badge/0G%20Hackathon-Track%201-FF6B6B?style=flat-square)

> 📖 [English Version](./README.md)

---

## 📖 项目概述

SealMind 是一个隐私自主的 AI Agent 操作系统，解决了一个根本问题：**当今的 AI Agent 没有灵魂**。

### 问题所在

| 挑战 | 当前现状 | 后果 |
|------|---------|------|
| **无记忆隐私** | Agent 记忆存储在中心化服务器 | 平台运营方可随意读取、修改或删除 |
| **推理不可验证** | 用户无法确认是哪个模型生成了回复 | 可以悄无声息地替换模型，破坏信任 |
| **没有身份所有权** | Agent 身份绑定在平台上 | 用户无法拥有、转让或交易自己的 Agent |

### SealMind 的解决方案

SealMind 为每个 AI Agent 配备**四大核心灵魂组件**：

- **🔒 密封推理** — 基于 TEE 的可验证推理，附带密码学证明
- **🧠 记忆金库** — 客户端加密的去中心化记忆（0G Storage KV）
- **🪪 Agent 身份** — 链上 INFT（ERC-721）代币，拥有所有权
- **⛓️ 决策链** — 所有决策的不可篡改链上审计日志

全部由 **0G Network** 提供支持——唯一能无缝整合存储、计算（TEE）、链和身份标准的基础设施。

---

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                          SealMind                                │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              前端（Next.js 14 + RainbowKit）                 │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐   │ │
│  │  │  Agent   │ │  记忆    │ │  决策    │ │   Agent    │   │ │
│  │  │  创建    │ │  浏览器  │ │  审计    │ │   市场     │   │ │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬──────┘   │ │
│  └───────┼────────────┼────────────┼─────────────┼───────────┘ │
│          │            │            │             │              │
│  ┌───────▼────────────▼────────────▼─────────────▼────────────┐ │
│  │          后端 API（Express + 0G SDK）                        │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌───────────────────┐   │ │
│  │  │   Agent     │ │    记忆     │ │    推理服务        │   │ │
│  │  │   服务      │ │    服务     │ │   （TEE 密封）     │   │ │
│  │  └──────┬──────┘ └──────┬──────┘ └────────┬──────────┘   │ │
│  │  ┌──────┴──────┐ ┌──────┴──────┐ ┌────────┴──────────┐   │ │
│  │  │ 多Agent协作 │ │  OpenClaw   │ │    决策链         │   │ │
│  │  │ 路由+转交   │ │  技能+流水线│ │    服务           │   │ │
│  │  └──────┬──────┘ └──────┬──────┘ └────────┬──────────┘   │ │
│  └─────────┼───────────────┼─────────────────┼────────────────┘ │
│            │               │                 │                  │
│  ┌─────────▼────┐  ┌──────▼──────┐  ┌──────▼─────────────┐   │
│  │  0G Chain    │  │ 0G Storage  │  │  0G Compute        │   │
│  │ · INFT       │  │ · 记忆      │  │  （密封 TEE）       │   │
│  │ · 决策链     │  │ · KV Store  │  │  · 可验证推理       │   │
│  │ · 注册表     │  │ · Merkle树  │  │                    │   │
│  └──────────────┘  └─────────────┘  └───────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 核心数据流

```
用户创建 Agent
     ↓
① INFT 铸造（0G Chain）← Agent 获得链上身份 + Token ID
     ↓
② 记忆金库初始化（0G Storage）← 创建加密 KV 流
     ↓
③ 用户与 Agent 对话
     ↓
④ 密封推理（0G Compute TEE）← 加载记忆 → TEE 推理 → 签名证明
     ↓
⑤ 返回回复 + 证明
     ├──→ 更新记忆（0G Storage）：客户端加密新记忆 → 写入 KV Store
     └──→ 链上记录（0G Chain）：推理哈希 + 模型签名 → 决策链
```

---

## ✨ 核心功能

| 功能 | 描述 | 使用的 0G 组件 |
|------|------|--------------|
| **🔒 密封推理** | AI 推理在 Intel TDX TEE 中执行，附带密码学证明。每条回复均可验证。 | 0G Compute（TeeML）|
| **🧠 记忆金库** | 客户端加密记忆存储于 0G Storage KV。双层架构：热缓存 + 0G KV 持久化。只有所有者持有解密密钥。 | 0G Storage KV + 0G Indexer |
| **🪪 Agent 身份** | 0G Chain 上的 ERC-721 INFT 标准代币。Agent 所有权可转让和交易。 | 0G Chain（EVM）+ INFT 标准 |
| **⛓️ 决策链** | 不可篡改的审计日志。重要决策上链，低重要性存入 0G Storage。 | 0G Chain + 0G Storage |
| **🤖 多 Agent 协作** | Agent 间消息传递、任务委派、并行编排、会话转交和协作会话管理。 | 内置 + 0G Compute |
| **🔗 OpenClaw 集成** | 将 Agent 注册为 OpenClaw 技能，技能流水线、任务队列和网关配置。 | OpenClaw + 0G Compute |
| **📊 信任评分** | Agent 声誉由推理验证率和记忆质量计算。链上等级实时反映。 | 0G Chain 智能合约 |
| **🎓 等级系统** | Agent 根据推理次数和质量获得等级（1-5 级）。每个等级解锁新功能。 | 0G Chain 智能合约 |

---

## 🛠️ 技术栈

| 层级 | 技术 | 版本 | 用途 |
|------|-----|------|------|
| **前端** | Next.js | 14 | SSR + App Router |
| | TypeScript | 5.x | 类型安全 |
| | TailwindCSS | 3.x | UI 样式 |
| | RainbowKit | latest | 钱包连接 |
| | wagmi | v2 | Ethereum Hooks |
| **后端** | Node.js | 18+ | 运行时 |
| | Express | 4.x | HTTP 服务器 |
| | ethers.js | v6 | 链上交互 |
| **0G 集成** | @0gfoundation/0g-ts-sdk | ^0.3.3 | Storage + KV |
| | @0glabs/0g-serving-broker | ^0.6.5 | Compute（TEE）|
| **智能合约** | Solidity | ^0.8.19 | 合约代码 |
| | Hardhat | latest | 编译/测试/部署 |
| | OpenZeppelin | 4.x | 合约标准库 |
| **AI 模型** | DeepSeek V3.1 | — | 主要模型（TeeML）|
| | Qwen 2.5 VL 72B | — | 备用模型 |

---

## 🌐 0G Network 集成深度说明

SealMind 集成了 **0G 的四大核心组件**，构建完整的 Agent 基础设施：

### 1. 0G Storage KV — 加密记忆金库

- **功能**：使用客户端加密存储 Agent 记忆
- **实现方式**：
  - Agent 所有者通过钱包签名 + Agent ID 派生加密密钥
  - 记忆在存储前使用 AES-256-GCM 加密
  - 双层架构：内存热缓存 + 0G KV 持久化
  - 写入路径：加密 → 推入缓存 → 异步通过 `kvBatchWrite` 持久化
  - 读取路径：首次访问从 0G KV 水化 → 后续从缓存服务
  - 优雅降级：0G KV 不可用时回退为纯内存模式
  - 只有密钥持有者才能解密
- **接口**：`KvClient.getValue()` / 使用 Batcher 批量写入
- **节点发现**：通过 0G Storage Indexer 自动选择最优节点
- **优势**：PB 级存储容量 + 零知识隐私保护 + 跨重启持久化

### 2. 0G Compute（密封推理）— 可验证 AI

- **功能**：在 Intel TDX TEE 中执行 AI 推理，并生成密码学证明
- **实现方式**：
  - Agent 提示词通过 0G Compute Broker 发送给 TeeML 提供商
  - DeepSeek V3.1 / Qwen 模型在 TEE 内运行
  - 输出使用 TEE 硬件密钥签名（远程证明）
- **接口**：`broker.listServices()` → `broker.processResponse()`
- **证明内容**：模型哈希、输入哈希、输出哈希、TEE 签名、远程证明
- **优势**：任何人（包括平台方）都无法看到推理内部过程，防篡改

### 3. 0G Chain（EVM）— 智能合约

- **功能**：部署身份 NFT 并记录决策审计轨迹
- **已部署合约**：
  - **SealMindINFT**：Agent 身份 ERC-721 INFT
  - **DecisionChain**：链上存储推理证明
  - **AgentRegistry**：支持搜索的全局 Agent 注册表
- **链上追踪数据**：
  - 总推理次数、记忆数量、信任分、等级、最后活跃时间
- **优势**：去中心化所有权 + 透明度 + 智能合约治理

### 4. INFT 标准（ERC-7857）— Agent 身份

- **功能**：通过 INFT 代币实现 Agent 所有权
- **特性**：
  - 不可变的元数据哈希用于验证
  - 加密 URI 用于访问 Agent 配置
  - 后端服务的操作员授权机制
  - 等级成长与链上统计绑定
- **转让安全**：转让时验证元数据完整性，撤销操作员权限
- **优势**：Agent 是可交易资产，所有权可验证且可迁移

---

## 📋 智能合约（0G 测试网）

所有合约已在 0G 测试网（Chain ID: 16602）部署并验证。

| 合约 | 地址 | 浏览器链接 |
|------|------|-----------|
| **SealMindINFT** | `0x1f29Bd4E0426222a78Ce0D484677A672DF3E8fa6` | [查看](https://chainscan-galileo.0g.ai/address/0x1f29Bd4E0426222a78Ce0D484677A672DF3E8fa6) |
| **DecisionChain** | `0x354306105a61505EB9a01A142E9fCA537E102EC2` | [查看](https://chainscan-galileo.0g.ai/address/0x354306105a61505EB9a01A142E9fCA537E102EC2) |
| **AgentRegistry** | `0x127b73133c9Ba241dE1d1ADdc366c686fd499c02` | [查看](https://chainscan-galileo.0g.ai/address/0x127b73133c9Ba241dE1d1ADdc366c686fd499c02) |

**测试结果**：✅ 28/28 单元测试全部通过（INFT、DecisionChain、Registry）

**测试网浏览器**：https://chainscan-galileo.0g.ai

---

## 🚀 快速开始

### 前置要求

- **Node.js** v20+（[下载](https://nodejs.org)）
- **pnpm** v8+，安装命令：`npm install -g pnpm`
- **MetaMask** 或兼容的 Web3 钱包

### 安装

```bash
# 克隆仓库
git clone https://github.com/henrymartin262/SealMind.git
cd SealMind

# 安装依赖（monorepo）
pnpm install

# 复制并配置环境变量
cp .env.example .env

# 需要填写的关键变量：
# - PRIVATE_KEY（后端钱包私钥，用于 0G 交易）
# - RPC_URL（测试网默认保持不变即可）
# - 合约地址（部署后自动填写）
```

### 本地运行

#### 1️⃣ 后端（端口 4000）

```bash
cd packages/backend

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 健康检查
curl http://localhost:4000/api/health
```

#### 2️⃣ 前端（端口 3000）

```bash
cd packages/frontend

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 打开浏览器
open http://localhost:3000
```

#### 3️⃣ 智能合约（可选——已部署）

```bash
cd packages/contracts

# 编译
pnpm compile

# 运行测试（28/28 通过）
pnpm test

# 部署到测试网（如需重新部署）
npx hardhat run scripts/deploy.ts --network og-testnet
```

### 使用流程

1. **打开前端**：http://localhost:3000
2. **连接钱包**：点击"连接" → 选择 MetaMask → 添加 0G 测试网（自动添加）
3. **创建 Agent**：填写表单（名称、模型、人格设定）→ 签名交易 → 铸造 INFT
4. **与 Agent 对话**：发送消息 → 获得 TEE 验证回复 → 查看证明
5. **查看记忆**：记忆浏览器按类型展示加密记忆
6. **审计决策**：查看带时间戳的链上审计轨迹

---

## 📁 项目结构

```
SealMind/
│
├── packages/
│   │
│   ├── contracts/                    # 📜 智能合约（Hardhat）
│   │   ├── contracts/
│   │   │   ├── SealMindINFT.sol      # Agent 身份 INFT（ERC-721）
│   │   │   ├── DecisionChain.sol     # 推理审计日志
│   │   │   └── AgentRegistry.sol     # 全局 Agent 注册表
│   │   ├── scripts/
│   │   │   └── deploy.ts             # 部署脚本
│   │   ├── test/
│   │   │   ├── SealMindINFT.test.ts  # 10 个测试 ✅
│   │   │   ├── DecisionChain.test.ts # 7 个测试 ✅
│   │   │   └── AgentRegistry.test.ts # 7 个测试 ✅
│   │   ├── hardhat.config.ts         # 0G 测试网 + 主网配置
│   │   └── package.json
│   │
│   ├── backend/                      # 🖥️ Express API 服务器
│   │   ├── src/
│   │   │   ├── index.ts              # Express 入口
│   │   │   ├── config/
│   │   │   │   ├── index.ts          # 环境变量配置
│   │   │   │   ├── contracts.ts      # 合约 ABI
│   │   │   │   └── og.ts             # 0G SDK 初始化
│   │   │   ├── routes/
│   │   │   │   ├── agentRoutes.ts    # POST/GET /api/agents/*
│   │   │   │   ├── chatRoutes.ts     # POST /api/chat/*
│   │   │   │   ├── memoryRoutes.ts   # GET/POST /api/memory/*
│   │   │   │   ├── decisionRoutes.ts # GET /api/decisions/*
│   │   │   │   ├── multiAgentRoutes.ts  # 多 Agent 协作
│   │   │   │   └── openclawRoutes.ts    # OpenClaw 集成
│   │   │   ├── services/
│   │   │   │   ├── AgentService.ts           # Agent 生命周期管理
│   │   │   │   ├── SealedInferenceService.ts # TEE 推理服务
│   │   │   │   ├── MemoryVaultService.ts     # 加密记忆服务（0G KV）
│   │   │   │   ├── DecisionChainService.ts   # 决策记录服务
│   │   │   │   ├── MultiAgentService.ts      # 多 Agent 编排服务
│   │   │   │   └── OpenClawService.ts        # OpenClaw 技能引擎
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts           # 钱包签名验证
│   │   │   │   └── errorHandler.ts   # 统一错误处理
│   │   │   └── utils/
│   │   │       └── encryption.ts     # AES-256-GCM 工具
│   │   ├── .env.example              # 环境变量模板
│   │   └── package.json
│   │
│   └── frontend/                     # 🌐 Next.js 前端
│       ├── app/
│       │   ├── page.tsx              # 首页
│       │   ├── layout.tsx            # 全局布局（RainbowKit Provider）
│       │   ├── dashboard/
│       │   │   └── page.tsx          # 我的 Agent 仪表盘
│       │   ├── agent/
│       │   │   ├── create/page.tsx   # 创建 Agent 表单
│       │   │   └── [id]/
│       │   │       ├── chat/page.tsx          # ⭐ 对话（WOW 时刻）
│       │   │       ├── memory/page.tsx        # 记忆浏览器
│       │   │       ├── decisions/page.tsx     # 决策审计轨迹
│       │   │       └── layout.tsx             # Agent 子页面布局
│       │   ├── multi-agent/page.tsx  # 🤖 多 Agent 协作中心
│       │   ├── openclaw/page.tsx     # 🔗 OpenClaw 技能管理
│       │   ├── explore/page.tsx      # Agent 市场
│       │   └── verify/page.tsx       # 证明验证器
│       ├── components/
│       │   ├── AgentCard.tsx         # Agent 卡片（含等级徽章）
│       │   ├── ChatMessage.tsx       # 聊天消息 + ✅ 验证徽章
│       │   ├── ProofModal.tsx        # 证明详情弹窗
│       │   ├── Navbar.tsx            # 导航栏 + 语言切换 + 钱包连接
│       │   └── ...                   # 其他 UI 组件
│       ├── hooks/
│       │   ├── useAgent.ts           # Agent 数据 Hook
│       │   ├── useChat.ts            # 对话 Hook
│       │   ├── useVerify.ts          # 证明验证 Hook
│       │   ├── useMemory.ts          # 记忆管理 Hook
│       │   └── useDecisions.ts       # 决策查询 Hook
│       ├── lib/
│       │   ├── wagmiConfig.ts        # wagmi + RainbowKit 配置
│       │   ├── contracts.ts          # 合约 ABI + 地址
│       │   ├── api.ts                # API 客户端工具
│       │   └── i18n.ts               # 中英文翻译（双语支持）
│       ├── contexts/
│       │   └── LangContext.tsx       # 全局语言切换 Context
│       ├── types/index.ts            # TypeScript 类型定义
│       └── package.json
│
├── doc/
│   └── SealMind_Implementation.md    # 技术设计文档
│
├── .env.example                      # 全局环境变量模板
├── deployment.json                   # 已部署合约地址
├── package.json                      # Monorepo 根配置
├── pnpm-workspace.yaml               # pnpm workspace 配置
├── README.md                         # 英文文档
└── README_CN.md                      # 中文文档（本文件）
```

---

## 🔌 API 端点

### Agent 管理

```
POST   /api/agents                    # 创建 Agent → 铸造 INFT + 初始化记忆
GET    /api/agents/:agentId           # 获取 Agent 信息
GET    /api/agents/owner/:address     # 获取某地址的所有 Agent
GET    /api/explore/agents            # 浏览公开 Agent（分页）
```

### 对话（核心功能）

```
POST   /api/chat/:agentId             # 与 Agent 对话
  请求体：{ "message": "...", "importance": 1-5 }
  响应：  { "response": "...", "proof": {...}, "agentStats": {...} }

GET    /api/chat/:agentId/history     # 获取对话历史
```

### 记忆管理

```
GET    /api/memory/:agentId           # 获取记忆列表
POST   /api/memory/:agentId           # 手动添加记忆
DELETE /api/memory/:agentId/:id       # 删除记忆
```

### 决策审计

```
GET    /api/decisions/:agentId        # 获取决策历史
POST   /api/decisions/verify          # 验证证明哈希
GET    /api/decisions/stats/:agentId  # 获取决策统计
```

### 多 Agent 协作

```
POST   /api/multi-agent/orchestrate         # 将查询路由到最佳 Agent，并行推理
POST   /api/multi-agent/delegate            # Agent 间任务委派
POST   /api/multi-agent/tasks/:id/execute   # 执行委派任务
GET    /api/multi-agent/tasks/:id           # 获取任务详情
GET    /api/multi-agent/agents/:id/tasks    # 列出 Agent 的任务
POST   /api/multi-agent/messages            # 发送 Agent 间消息
GET    /api/multi-agent/agents/:id/messages # 获取 Agent 收件箱
POST   /api/multi-agent/handoff             # Agent 间会话转交
POST   /api/multi-agent/sessions            # 创建协作会话
GET    /api/multi-agent/sessions/:id        # 获取会话详情
GET    /api/multi-agent/sessions            # 列出钱包的会话
```

### OpenClaw 集成

```
GET    /api/openclaw/status                 # 集成状态
POST   /api/openclaw/agents                 # 注册 Agent 到 OpenClaw
GET    /api/openclaw/agents                 # 列出 OpenClaw Agent
GET    /api/openclaw/agents/:agentId        # 获取 OpenClaw Agent
GET    /api/openclaw/skills                 # 列出所有技能（内置 + 自定义）
POST   /api/openclaw/skills                 # 注册自定义技能
POST   /api/openclaw/skills/:id/execute     # 在 Agent 上执行技能
POST   /api/openclaw/tasks                  # 提交任务到编排队列
GET    /api/openclaw/tasks/:taskId          # 获取任务详情
GET    /api/openclaw/config                 # 生成网关配置
POST   /api/openclaw/pipelines              # 创建技能流水线
```

---

## 🎯 Demo 流程（3 分钟）

**[0:00-0:30]** 开场介绍
- "你信任你的 AI 吗？SealMind 让每一次 AI 决策都可链上验证。"
- 展示首页 + 全网统计数据

**[0:30-1:15]** 创建 Agent
- 连接钱包 → 填写表单（名称/模型/人格设定）→ 签名 → INFT 铸造
- 打开 0G Explorer 展示链上交易

**[1:15-2:30]** ⭐ **WOW 时刻** — 可验证对话
- 发送消息："分析一下 0G 代币的近期趋势"
- AI 回复旁显示 ✅ Verified 徽章
- 点击徽章 → 证明弹窗显示：
  - 模型：DeepSeek V3.1 ✓
  - TEE：Intel TDX ✓
  - 链上交易：[0G Explorer 链接]
- 跳转验证器页面 → 粘贴 proofHash → ✅ 验证通过

**[2:30-2:55]** 记忆演示
- 打开记忆浏览器 → 展示加密记忆
- 手动添加知识 → 再次对话 → Agent 使用了新知识
- "记忆经过客户端加密，存储在 0G Storage，只有所有者能解密"

**[2:55-3:00]** 总结
- 展示架构图
- "四个 0G 组件——Storage 用于记忆，Compute 用于推理，Chain 用于决策，INFT 用于身份"

---

## 🔐 安全设计

### 威胁模型与应对措施

| 威胁 | 应对措施 |
|------|---------|
| **私钥泄露** | `.env` 永不提交；使用 CI/CD 密钥管理 |
| **记忆泄露** | AES-256-GCM 加密；密文在无密钥情况下不可读 |
| **密钥暴力破解** | 来自钱包签名 + 盐的 256 位密钥空间 |
| **推理被截获** | TEE 执行 + 远程证明 |
| **合约未授权访问** | `onlyOwner`、`onlyAuthorized`、`ReentrancyGuard` |
| **证明重放攻击** | `proofExists` 去重 + 时间戳验证 |
| **中间人攻击** | TEE 证明验证 + 端对端哈希 |

### 密钥管理分层

```
第一层：用户钱包私钥（用户完全控制）
第二层：后端私钥（环境变量，永不提交代码）
第三层：Agent 加密密钥（运行时派生，不持久化）
第四层：会话密钥（由 Broker 管理，临时使用）
```

---

## 📊 部署状态

| 环境 | 状态 | Chain ID | RPC 地址 |
|-----|------|----------|---------|
| **0G 测试网** | ✅ 运行中 | 16602 | https://evmrpc-testnet.0g.ai |
| **0G 主网** | 🚧 待部署 | 16661 | https://evmrpc.0g.ai |

### 已部署合约（测试网）

✅ **SealMindINFT**：[0x1f29Bd4E0426222a78Ce0D484677A672DF3E8fa6](https://chainscan-galileo.0g.ai/address/0x1f29Bd4E0426222a78Ce0D484677A672DF3E8fa6)
✅ **DecisionChain**：[0x354306105a61505EB9a01A142E9fCA537E102EC2](https://chainscan-galileo.0g.ai/address/0x354306105a61505EB9a01A142E9fCA537E102EC2)
✅ **AgentRegistry**：[0x127b73133c9Ba241dE1d1ADdc366c686fd499c02](https://chainscan-galileo.0g.ai/address/0x127b73133c9Ba241dE1d1ADdc366c686fd499c02)

---

## 🧪 测试

### 运行所有测试

```bash
cd packages/contracts

# 智能合约测试（28/28 通过）
pnpm test
```

**测试覆盖**：
- ✅ INFT 创建、铸造、等级成长（10 个测试）
- ✅ 决策记录、验证、批量操作（7 个测试）
- ✅ 注册表搜索、可见性控制（7 个测试）
- ✅ 加密/解密全流程
- ✅ 端到端对话流程（使用 0G 服务 Mock）

---

## 🤝 贡献指南

欢迎贡献！请遵循以下流程：

1. Fork 仓库
2. 创建功能分支：`git checkout -b feat/你的功能`
3. 按照 TypeScript/Solidity 最佳实践进行修改
4. 为新功能编写测试
5. 提交 Pull Request

---

## 📜 开源协议

MIT

---

## 🔗 相关链接

- **GitHub**：https://github.com/henrymartin262/SealMind
- **0G Network**：https://0g.ai
- **0G 测试网浏览器**：https://chainscan-galileo.0g.ai
- **0G 主网浏览器**：https://chainscan.0g.ai
- **黑客松官网**：0G APAC Hackathon 2026（截止日期：2026年5月9日）

---

## 👥 团队

- **项目负责人**：Sirius Yao

---

## 💬 问题与支持

如有问题或 Bug：
- 提交 [GitHub Issue](https://github.com/siriusyao/SealMind/issues)
- Discord：[0G 社区](https://discord.gg/0g)

---

**最后更新**：2026-03-27
**版本**：1.1
**状态**：🟢 已就绪（测试网）
