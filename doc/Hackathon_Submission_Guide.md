# SealMind — 0G APAC Hackathon 报名填写指南

> 本文档对应 HackQuest 黑客松报名页面各字段。已填项可直接复制，未完成项标注了状态和操作建议。
> 更新时间：2026-04-07 | 项目版本：v3.2 | 网络：0G Mainnet (Chain ID: 16661)

---

## 1. 概览 Tab

### 名称（8/80）
```
SealMind
```
✅ 已填写。

### 简介（0/200）
```
SealMind is a privacy-sovereign AI Agent OS built entirely on 0G Network. It gives every AI agent a soul — encrypted memory (0G Storage KV), verifiable TEE inference (0G Compute), on-chain identity (ERC-721 INFT), and immutable decision audit (0G Chain). Features include Bounty Board, Agent Marketplace, Hive Mind collective intelligence, and MCP-compatible Agent Gateway.
```

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
6. **Solidity** — 4 个智能合约
7. **Python** — scripts/ demo 脚本

---

## 2. 阶段成果 Tab

### MVP 链接
⚠️ **待完成** — 需要部署前端到公网。

**方案 A — Vercel 部署**（推荐）：
```bash
cd packages/frontend && npx vercel --prod
```
> 注意：后端也需部署（Railway / Render），并更新 `NEXT_PUBLIC_API_URL`。

### 项目链接（GitHub）
```
https://github.com/henrymartin262/SealMind
```
✅ 已有公开仓库。

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
> 部署钱包地址，已有 4 个合约部署在主网。在 MetaMask 中添加 0G Mainnet（Chain ID: 16661, RPC: https://evmrpc.0g.ai）。

### 图片（0/4）
⚠️ **待完成** — 需要 4 张截图，尺寸 `500x300` 或 `1280x720`。

建议截图：
1. 首页 HeroCover（品牌展示）
2. Chat 页面（TEE 推理 + 证明验证）
3. Bounty Board（赏金任务市场）
4. Agent Marketplace（交易市场）

### 视频
#### 项目 Demo（必须，≤ 3 分钟）
⚠️ **待完成** — HackQuest 硬性要求，必须是实际操作视频（不接受 PPT）。

**建议内容**：
1. 连接钱包（RainbowKit + 0G Mainnet）
2. 创建 Agent（INFT 铸造 + 灵魂签名）
3. 与 Agent 对话（TEE 推理 + Memory 加密 + Decision 上链）
4. Proof Verifier（链上证明验证）
5. Bounty Board（发布/接受赏金任务）
6. Agent Marketplace（浏览/购买 Agent）

#### 项目路演
⚠️ 可选。

---

## 3. 描述（富文本）

```
SealMind — Privacy-Sovereign AI Agent Operating System

SealMind addresses a fundamental problem in AI: agents today have no soul. Their memories are stored on centralized servers (easily stolen), their inference cannot be verified (models can be swapped undetectably), and their identity is tied to platforms (users don't truly own them).

Built entirely on 0G Network, SealMind equips every AI Agent with four core soul components:

🔒 Sealed Mind — TEE-based verifiable inference via 0G Compute (TeeML). Every AI response comes with cryptographic proof.

🧠 Memory Vault — Client-side encrypted memories stored on 0G Storage KV with AES-256-GCM. Only the owner holds the decryption key. Dual-layer: hot cache + persistent 0G KV.

🪪 Agent Identity — ERC-721 INFT on 0G Chain. Each agent has a unique Soul Signature (keccak256 hash), making it irreplaceable and ownable.

⛓️ Decision Chain — Immutable on-chain audit log. Critical decisions recorded on-chain with proofHash, verifiable by anyone.

Extended Features:
• Bounty Board — On-chain task marketplace with escrow, 7-state lifecycle, dispute resolution
• Agent Marketplace — Trading market with ERC-721 safeTransferFrom, tags, and trial system
• Hive Mind — Decentralized collective intelligence with Merkle tree verification on 0G Storage
• Agent Passport — On-chain certification with real capability tests
• Living Soul — Experience hash chain with encrypted 0G KV persistence
• Multi-Agent Collaboration — Keyword routing, parallel orchestration, 0G KV persistence
• Agent Gateway — REST + MCP protocol for AI agent self-discovery

Tech Stack: Next.js 14, Express, Solidity 0.8.26, ethers.js v6, 0G TS SDK ^1.2.1, OpenZeppelin 5.x, RainbowKit, TailwindCSS

All 4 smart contracts deployed on 0G Mainnet (Chain ID: 16661). 94/94 unit tests passing.
```

---

## 4. 本次黑客松进展

```
v3.2 — Full Mainnet Deployment:

✅ Smart Contracts (4/4 deployed to 0G Mainnet)
- SealMindINFT: 0xc0238FEb50072797555098DfD529145c86Ab5b59
- DecisionChain: 0xaF39a3D2E2d8656490F8f2AB1fF0106f1acB867C
- AgentRegistry: 0xa930B5059aE91C073684f0D2AFB0bBf5d84167C9
- BountyBoard: 0x8604482d75aFe56E376cdEE41Caf27599a926E1d
- 94/94 unit tests passing

✅ 0G Deep Integration (all 4 core components)
- 0G Storage KV: AES-256-GCM Memory Vault + Hive Mind + Soul persistence
- 0G Compute: TEE inference with 3-layer fallback + processResponse fee settlement
- 0G Chain: INFT minting, Decision Chain, Agent Registry, BountyBoard
- 0G Skills: #4 Streaming Chat, #5 Text-to-Image, #6 Speech-to-Text, #7 Provider Discovery, #8 Account Management, #13 Storage-Chain, #14 Compute-Storage

✅ Full-stack Application
- 12 backend services with graceful degradation
- 30+ frontend pages with modern UI
- MCP Server for AI agent self-discovery
- 5 real Agents minted on mainnet

✅ Key Fixes in v3.1-3.2
- Hive Mind: real 0G KV persistence + Merkle tree verification
- Living Soul: encrypted 0G KV storage (was placeholder)
- Passport: real capability tests (inference + storage + signature, ALL must pass)
- Marketplace: real ERC-721 safeTransferFrom (was setTimeout mock)
- MultiAgent: 0G KV persistence for sessions/tasks
- TrustScore: formula-based calculation (was hardcoded)
- ComputeAccount: BigInt precision fix (ethers.formatEther/parseEther)
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
1. SealMindINFT (ERC-721 INFT):
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
| 🔴 P0 | MVP 链接（前端+后端部署公网） | ❌ 待完成 | 评委需要能访问 |
| 🔴 P0 | 项目截图 4 张 | ❌ 待完成 | 报名必填 |
| 🟡 P1 | 后端部署公网 | ❌ 待完成 | Railway / Render |
| 🟡 P1 | 团队信息填写 | ❌ 待填写 | 报名页面"团队"Tab |
| 🟢 P2 | Pitch 视频 | ❌ 可选 | 如果有路演环节 |

---

## 📊 评审标准（来自 HackQuest）

| 维度 | 权重 | 我们的优势 |
|------|------|-----------|
| **0G 技术集成深度** | 高 | 4 个 0G 组件全集成 + 7 个官方 Skills |
| **技术实现完整性** | 高 | 4 合约主网部署 + 94 测试 + 12 服务 |
| **产品价值与市场潜力** | 中 | AI Agent 隐私+自主权是真实痛点 |
| **UX + Demo 质量** | 高 | 30+ 页面 + 现代 UI，**需录视频** |
| **团队能力与文档** | 中 | README 完整，需补团队信息 |

---

## 🔗 快捷链接

| 资源 | 链接 |
|------|------|
| 0G Mainnet Explorer | https://chainscan.0g.ai |
| 0G Mainnet RPC | https://evmrpc.0g.ai |
| 0G 官方文档 | https://docs.0g.ai |
| HackQuest 报名 | https://www.hackquest.io/zh-cn/hackathons/0G-APAC-Hackathon |
| GitHub | https://github.com/henrymartin262/SealMind |

---

> 截止日期：2026-05-09 23:59 (UTC+8)
