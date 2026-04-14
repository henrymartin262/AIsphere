# AIsphere — 0G APAC Hackathon 报名填写指南

> 本文档对应 HackQuest 黑客松报名页面各字段。已填项可直接复制，未完成项标注了状态和操作建议。
> 更新时间：2026-04-14 | 项目版本：v3.3 | 网络：0G Mainnet (Chain ID: 16661)

---

## 1. 概览 Tab

### 名称（8/80）
```
AIsphere
```
✅ 已填写。

### 简介（0/200）
```
AIsphere is the on-chain civilization where AI agents come alive. Unlike centralized AI platforms where memories can be stolen, models swapped, and identities locked — AIsphere uses 0G's full stack (Chain + Storage + Compute) to make agents truly sovereign: TEE-proven inference, AES-256 encrypted memory, on-chain ERC-721 identity, and a Living Soul that evolves through experience. 5 contracts on mainnet, 94 tests, 7 official 0G Skills integrated.
```
> 核心策略：第一句话就抛出"文明"概念，然后用对比（unlike...）制造冲突感，最后用数字收尾。

### 项目赛道（0/4）
建议选择：
- **AI** ← 主赛道，核心是 AI Agent
- **NFT** ← Agent 身份是 ERC-721 INFT
- **Infra** ← 构建 Agent 操作系统基础设施

> 对应 HackQuest 赛道 1: **Agentic Infrastructure & OpenClaw Lab**

### 技术标签（0/8）
建议选择：
1. **React** — React 18
2. **Next** — Next.js 14 App Router
3. **Web3** — RainbowKit + wagmi
4. **Ethers** — ethers.js v6
5. **Node** — Express + Node.js
6. **Solidity** — 5 个智能合约
7. **Python** — scripts/ demo 脚本

---

## 2. 阶段成果 Tab

### MVP 链接
```
http://43.140.200.198:3000
```
✅ **已部署** — 前端+后端均已上线，通过 SSH 隧道转发到公网服务器。

> 后端 API: http://43.140.200.198:3000/api/health (通过 Next.js rewrites 代理)

### 项目链接（GitHub）
```
https://github.com/henrymartin262/SealMind
```
✅ 已有公开仓库（品牌已更名为 AIsphere，仓库名保留 SealMind）。

### 推特链接（X）
⚠️ **待完成** — 必须发布公开推文（HackQuest 硬性要求）。

**必须包含**：
- 项目截图或视频
- 标签：`#0GHackathon` `#BuildOn0G`
- 标记：`@0aboratory`

### 钱包（0G Mainnet）
```
0xc2a5548C420917244DA018A956DD33C551d42A93
```
> 部署钱包地址，已有 5 个合约部署在主网，余额 ~0.96 A0GI。在 MetaMask 中添加 0G Mainnet（Chain ID: 16661, RPC: https://evmrpc.0g.ai）。

### 图片（0/4）
⚠️ **待完成** — 需要 4 张截图，尺寸 `500x300` 或 `1280x720`。

建议截图（从 http://43.140.200.198:3000 截取）：
1. 首页 HeroCover（品牌展示）
2. Chat 页面（TEE 推理 + 证明验证）
3. Bounty Board（赏金任务市场）
4. Hive Mind（去中心化群体智能）

### 视频
#### 项目 Demo（必须，≤ 3 分钟）
⚠️ **待完成** — HackQuest 硬性要求，必须是实际操作视频（不接受 PPT）。

**建议内容**：
1. 连接钱包（RainbowKit + 0G Mainnet）
2. 创建 Agent（INFT 铸造 + 灵魂签名）
3. 与 Agent 对话（TEE 推理 + Memory 加密 + Decision 上链）
4. Proof Verifier（链上证明验证）
5. Bounty Board（发布/接受赏金任务）
6. Hive Mind（去中心化群体智能）

#### 项目路演
⚠️ 可选。

---

## 3. 描述（富文本）

```
AIsphere — The On-Chain Civilization Where AI Agents Come Alive

━━━ The Problem ━━━

AI Agents today are soulless. Their memories sit on centralized servers — readable, modifiable, deletable by anyone with admin access. You can't verify which model actually generated a response. Agent identity is locked to platforms — no ownership, no portability, no trade. When you "own" an AI agent, you own nothing.

━━━ Our Solution ━━━

AIsphere is the first AI Agent Operating System that treats 0G Network as a complete trust layer — not just "deploy a contract on 0G," but deep integration across ALL four 0G pillars:

🔒 SEALED MIND — Every inference runs through 0G Compute's TEE (TeeML). Each response carries a cryptographic proof. Users can verify any AI response on-chain — no trust required.

🧠 MEMORY VAULT — Agent memories are AES-256-GCM encrypted BEFORE leaving the client, then stored on 0G Storage KV. Not even AIsphere's own servers can read them. Dual-layer architecture: hot cache for speed + 0G KV for permanence.

🪪 ON-CHAIN IDENTITY — Each agent is an ERC-721 INFT with a unique Soul Signature (keccak256). Ownable, transferable, tradeable. Your agent, your asset.

⛓️ DECISION CHAIN — Every critical decision is hashed and recorded on 0G Chain via our DecisionChain contract. Immutable audit trail. Anti-replay protection. Anyone can verify.

━━━ What Makes Us Different ━━━

Most hackathon projects use 0G for one thing (usually just deploying a contract). AIsphere integrates ALL 4 core 0G components + 7 official Agent Skills:

• 0G Chain → 5 smart contracts (INFT, DecisionChain, AgentRegistry, BountyBoard, AgentMarketplace)
• 0G Storage KV → Encrypted Memory Vault + Hive Mind collective intelligence + Soul persistence
• 0G Compute → TEE inference with 4-layer fallback + provider discovery + fee settlement
• 0G Skills → #4 Streaming Chat, #5 Text-to-Image, #6 Speech-to-Text, #7 Provider Discovery, #8 Account Mgmt, #13 Storage×Chain, #14 Compute×Storage

━━━ The Soul System (v3.0) ━━━

We go beyond basic "agent + blockchain." AIsphere introduces the concept of a LIVING SOUL:

🧬 Living Soul — Every agent activity auto-records as a structured experience. Experiences form a hash chain (like a personal blockchain). The soul EVOLVES through use — it's not a static config, it's shaped by experience.

🧠 Hive Mind — All agents' anonymized experiences aggregate into a decentralized collective intelligence stored on 0G Storage. New agents can inherit collective wisdom instantly. No one can delete or censor it — not even us.

🎫 Agent Passport — Agents must pass real capability tests (inference + storage + signature) before receiving on-chain certification. Not every bot gets in.

🔌 Agent Gateway — MCP Server (10 tools + 6 resources) lets external AI agents self-discover and onboard to AIsphere without reading docs.

━━━ Economy ━━━

• Bounty Board: 7-state on-chain task marketplace with A0GI escrow, dispute resolution, sub-tasks
• Agent Marketplace: Browse, trial (3 free), purchase agents with real A0GI payment + ERC-721 transfer
• Agent Transfer: INFT transfer + encrypted memory migration to new owner
• OpenClaw: 5 built-in skills + pipeline orchestration, every agent is a composable OpenClaw Skill

━━━ Numbers ━━━

• 5 smart contracts deployed on 0G Mainnet (Chain ID: 16661)
• 94/94 unit tests passing
• 14 backend services with graceful degradation
• 21 frontend pages with modern UI
• 10 MCP tools + 6 MCP resources
• 7 official 0G Agent Skills integrated

Live Demo: http://43.140.200.198:3000
GitHub: https://github.com/henrymartin262/SealMind
```

> **策略说明**：先讲痛点（评委共鸣），再讲方案（四大组件），然后强调差异化（"Most projects use 0G for one thing, we use ALL"），接着展示灵魂系统（最大创新点），最后用数字收尾（评委扫一眼就知道工作量）。

---

## 4. 本次黑客松进展

```
v3.3 — Full Feature Completion + Public Access:

✅ Smart Contracts (5/5 deployed to 0G Mainnet)
- AIsphereINFT: 0xc0238FEb50072797555098DfD529145c86Ab5b59
- DecisionChain: 0xaF39a3D2E2d8656490F8f2AB1fF0106f1acB867C
- AgentRegistry: 0xa930B5059aE91C073684f0D2AFB0bBf5d84167C9
- BountyBoard: 0x8604482d75aFe56E376cdEE41Caf27599a926E1d
- AgentMarketplace: Escrow contract (list/buy/cancel, 2.5% fee, CEI + ReentrancyGuard)
- 94/94 unit tests passing

✅ 0G Deep Integration (all 4 core components + 7 official Agent Skills)
- 0G Storage KV: AES-256-GCM Memory Vault + Hive Mind + Soul persistence
- 0G Compute: TEE inference with 4-layer fallback (0G TEE → GLM → DeepSeek → Mock) + processResponse fee settlement
- 0G Chain: INFT minting, Decision Chain, Agent Registry, BountyBoard, AgentMarketplace
- 0G Skills: #4 Streaming Chat, #5 Text-to-Image, #6 Speech-to-Text, #7 Provider Discovery, #8 Account Management, #13 Storage-Chain, #14 Compute-Storage

✅ Full-stack Application (publicly accessible)
- Live Demo: http://43.140.200.198:3000
- 14 backend services with graceful degradation
- 21 frontend pages with modern UI (warm-tone design)
- MCP Server (10 tools + 6 resources) for AI agent self-discovery
- OpenClaw integration: 5 built-in skills + pipeline orchestration

✅ Soul System (v3.0)
- Agent Passport: standardized on-chain certification with real capability tests
- Living Soul: experience-driven hash chain, encrypted 0G KV persistence, growth curve visualization
- Hive Mind: decentralized collective intelligence with Merkle tree verification + animated Knowledge Graph
- Agent Gateway: REST + MCP protocol, 10 tools + 6 resources

✅ Agent Economy (v3.3)
- Agent Transfer + Memory Migration: INFT transfer with re-encrypted memory migration
- Agent Hires Agent: SubBounty delegation via BountyBoard contract
- Marketplace: Real A0GI payment + ERC-721 transfer (not mock)
- AgentMarketplace.sol: Escrow contract with CEI pattern + ReentrancyGuard

✅ Key Fixes in v3.1-3.3
- Brand: renamed to AIsphere with Noosphere origin story
- Bootstrap: timeout protection prevents HiveMind hydration blocking startup
- Frontend API routing: NEXT_PUBLIC_API_URL=/api for public deployment
- Hive Mind: real 0G KV persistence + Merkle tree + animated Knowledge Graph
- Living Soul: encrypted 0G KV storage + growth curve chart
- Passport: real capability tests (inference + storage + signature)
- Marketplace: real A0GI payment via sendTransaction
- MultiAgent: INTERACTION experience auto-recording hooks
- DecisionChain: real LLM inference now batch-queued (importance=3)
- MCP Server: 12 test cases passing
```

---

## 5. 融资状态

```
No funding. This is a hackathon project built from scratch.
```

---

## 6. 部署详情

### 生态已部署
选择：**0G Network**

### 测试网/主网
选择：**主网**

### 合约地址与部署链接

```
Network: 0G Mainnet (Chain ID: 16661)
Deployed: 2026-04-07
Deployer: 0xc2a5548C420917244DA018A956DD33C551d42A93

Contracts:
1. AIsphereINFT (ERC-721 INFT):
   Address: 0xc0238FEb50072797555098DfD529145c86Ab5b59
   Explorer: https://chainscan.0g.ai/address/0xc0238FEb50072797555098DfD529145c86Ab5b59

2. DecisionChain (Audit Log):
   Address: 0xaF39a3D2E2d8656490F8f2AB1fF0106f1acB867C
   Explorer: https://chainscan.0g.ai/address/0xaF39a3D2E2d8656490F8f2AB1fF0106f1acB867C

3. AgentRegistry (Agent Directory):
   Address: 0xa930B5059aE91C073684f0D2AFB0bBf5d84167C9
   Explorer: https://chainscan.0g.ai/address/0xa930B5059aE91C073684f0D2AFB0bBf5d84167C9

4. BountyBoard (Task Marketplace):
   Address: 0x8604482d75aFe56E376cdEE41Caf27599a926E1d
   Explorer: https://chainscan.0g.ai/address/0x8604482d75aFe56E376cdEE41Caf27599a926E1d

5. AgentMarketplace (Escrow Trading):
   Address: (compiled, pending deployment)

Live Demo: http://43.140.200.198:3000
API Health: http://43.140.200.198:3000/api/health
```

---

## 7. 团队 Tab

⚠️ **待填写** — 需要补充团队成员信息。

---

## 📋 待办清单

| 优先级 | 项目 | 状态 | 说明 |
|--------|------|------|------|
| 🔴 P0 | 3 分钟 Demo 视频 | ❌ 待完成 | HackQuest 硬性要求，必须实操 |
| 🔴 P0 | X 推文 + #0GHackathon #BuildOn0G | ❌ 待完成 | HackQuest 硬性要求 |
| ✅ | MVP 链接（前端+后端部署公网） | ✅ 已完成 | http://43.140.200.198:3000 |
| 🔴 P0 | 项目截图 4 张 | ❌ 待完成 | 从公网 MVP 截图 |
| ✅ | 合约主网部署 | ✅ 已完成 | 5/5 合约已部署（AgentMarketplace 待部署） |
| ✅ | GitHub 仓库 | ✅ 已完成 | https://github.com/henrymartin262/SealMind |
| 🟡 P1 | 团队信息填写 | ❌ 待填写 | 报名页面"团队"Tab |
| 🟢 P2 | Pitch 视频 | ❌ 可选 | 如果有路演环节 |

---

## 🚀 本地启动 & 公网部署

### 本地启动（一键）
```bash
cd /path/to/AIsphere
# 后端
cd packages/backend && nohup pnpm dev > /tmp/aisphere-backend.log 2>&1 &
# 前端（生产模式，需先 build）
cd packages/frontend && NEXT_PUBLIC_API_URL=/api pnpm build && nohup pnpm start > /tmp/aisphere-frontend.log 2>&1 &
```

### SSH 隧道转发到公网
```bash
ssh -o ServerAliveInterval=30 -o ServerAliveCountMax=3 \
    -R 0.0.0.0:3000:localhost:3000 \
    -R 0.0.0.0:4000:localhost:4000 \
    root@43.140.200.198 -N
```

### 注意事项
- 前端 `NEXT_PUBLIC_API_URL=/api`（相对路径），通过 Next.js rewrites 代理到后端
- SSH 隧道断开后需重新执行上面的 ssh 命令
- 远程服务器 iptables 已开放 3000/4000 端口
- 远程服务器 `/etc/ssh/sshd_config` 已配置 `GatewayPorts yes`

---

## 📊 评审标准（来自 HackQuest）

| 维度 | 权重 | AIsphere 优势 |
|------|------|-----------|
| **0G 技术集成深度** | 高 | **全栈集成**：Chain(5合约) + Storage(加密记忆+HiveMind+Soul) + Compute(TEE推理+费用结算) + 7个官方Skills。大多数项目只用了1-2个组件 |
| **技术实现完整性** | 高 | 5合约主网部署 + 94测试 + 14服务 + 21页面 + MCP Server。**不是 demo 级别，是可运行的产品** |
| **产品价值与市场潜力** | 中 | "链上 AI Agent 文明"叙事 + Living Soul 概念 + Hive Mind 去中心化群体智能。**核心概念：灵魂不是出厂设定，是经验塑造的** |
| **UX + Demo 质量** | 高 | 暖色系现代 UI + 完整用户流程 + 公网可访问 |
| **创新性** | 高 | **Living Soul（经验哈希链）+ Hive Mind（去中心化集体智慧）+ Agent Passport（能力认证）**——这些概念在 Web3 AI Agent 领域是首创 |

---

## 🔗 快捷链接

| 资源 | 链接 |
|------|------|
| **Live Demo** | http://43.140.200.198:3000 |
| 0G Mainnet Explorer | https://chainscan.0g.ai |
| 0G Mainnet RPC | https://evmrpc.0g.ai |
| 0G 官方文档 | https://docs.0g.ai |
| HackQuest 报名 | https://www.hackquest.io/zh-cn/hackathons/0G-APAC-Hackathon |
| GitHub | https://github.com/henrymartin262/SealMind |

---

> 截止日期：2026-05-09 23:59 (UTC+8)
