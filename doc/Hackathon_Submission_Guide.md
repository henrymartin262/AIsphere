# SealMind — 0G APAC Hackathon 报名填写指南

> 本文档对应黑客松报名页面各字段，已填项可直接复制，未完成项标注了状态和操作建议。

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
> 200 字符以内版本（备选，如果有字数限制）：
```
Privacy-sovereign AI Agent OS on 0G Network. Encrypted memory, TEE-verifiable inference, on-chain ERC-721 identity, immutable decision audit. With Bounty Board, Agent Marketplace, Hive Mind & MCP Gateway.
```

### 项目赛道（0/4）
建议选择：
- **AI** ← 主赛道，核心是 AI Agent
- **NFT** ← Agent 身份是 ERC-721 INFT
- **Infra** ← 构建 Agent 操作系统基础设施
- **Other** ← 如果需要第4个可选

> 注意：赛道选择取决于 0G Hackathon 的 Track 分类。根据 README 标注的 "Track 1"，确认实际对应哪个即可。

### 技术标签（0/8）
建议选择：
1. **React** — 前端用了 React 18
2. **Next** — Next.js 14 App Router
3. **Web3** — RainbowKit + wagmi + 链上交互
4. **Ethers** — ethers.js v6 合约交互
5. **Node** — 后端 Express + Node.js
6. **Solidity** — 4 个智能合约
7. **Python** — scripts/ 下有 Python demo 脚本

> 第 8 个可选 TypeScript（如果有自定义标签的话），但截图中没看到 TypeScript 选项。

---

## 2. 阶段成果 Tab

### MVP 链接
⚠️ **待完成** — 需要部署前端到公网可访问的 URL。

**操作建议**：
1. **方案 A — Vercel 部署**（推荐，免费且快）：
   ```bash
   cd packages/frontend
   npx vercel --prod
   ```
   部署后获得 `https://sealmind.vercel.app` 类似的链接。
   
2. **方案 B — 本地穿透**（临时方案）：
   ```bash
   npx localtunnel --port 3000
   ```
   
3. **注意**：前端 `NEXT_PUBLIC_API_URL` 指向 `localhost:4000`，公网部署时后端也需要部署或使用隧道。后端可部署到 Railway / Render / 自有服务器。

### 项目链接（GitHub）
```
https://github.com/你的用户名/SealMind
```
⚠️ **待确认** — 请填写你实际的 GitHub 仓库地址。如果还没推送到公开仓库：
```bash
git remote -v  # 查看当前 remote
# 如果没有 remote，添加一个：
git remote add origin https://github.com/你的用户名/SealMind.git
git push -u origin main
```

### 推特链接（X）
⚠️ **待完成** — 需要创建项目推特账号或使用个人账号。

**建议操作**：
- 创建 `@SealMindAI` 或类似 handle
- 发一条介绍推文，附项目截图和 GitHub 链接
- 带上 `#0GHackathon` `#AI` `#Web3` 标签

### 钱包
需要连接与黑客松相同网络的钱包（用于领取奖励）。

当前项目使用的部署钱包地址：
```
0x30e31C6E8179f7aAb6E19B26a3F46B10E4Ce7f92
```
> ⚠️ 确认此钱包是否是你的领奖钱包。建议使用你日常的 MetaMask 钱包连接。

### 图片（0/4）
⚠️ **待完成** — 需要准备 4 张项目截图。

**尺寸要求**：`500x300` 或 `1280x720`

**建议截图内容**：
1. **首页 HeroCover** — 展示品牌和设计感（`/` 页面全屏封面）
2. **Chat 页面** — 展示 TEE 推理 + Memory Vault + Decision Chain 核心流程
3. **Dashboard 页面** — 展示 Agent 管理、统计数据、等级系统
4. **Architecture 图** — 从 README 中导出架构图，展示 0G 四层集成

**截图方法**：
```bash
# 启动项目后，浏览器打开各页面截图
# macOS: Cmd+Shift+4
# Windows: Win+Shift+S
# Linux: gnome-screenshot 或 flameshot
```

### 视频
#### 项目 Demo
⚠️ **待完成** — 需要录制 Demo 视频。

**建议内容（3-5 分钟）**：
1. 连接钱包（展示 RainbowKit）
2. 创建 Agent（展示 INFT 铸造 + 灵魂签名生成）
3. 与 Agent 对话（展示 TEE 推理 + Memory Vault 加密存储 + Decision Chain 上链）
4. 查看 Memory Explorer（展示加密记忆列表）
5. 查看 Decision Audit（展示链上决策记录 + Proof Verifier 验证）
6. Agent Marketplace / Bounty Board（展示生态功能）
7. Passport 认证流程

**录屏工具推荐**：OBS Studio / Loom / QuickTime

#### 项目路演
⚠️ **待完成** — 如果需要提交 Pitch 视频。

**建议 Pitch 结构（5 分钟内）**：
1. **Problem**（30s）：AI Agent 没有灵魂——记忆被窃取、推理不可验证、身份不归用户
2. **Solution**（1min）：SealMind 四大核心组件
3. **0G Integration**（1min）：如何深度使用 0G 的 Storage / Compute / Chain
4. **Demo**（2min）：核心流程演示
5. **Future**（30s）：主网部署 + Agent 经济体

---

## 3. 描述（富文本）

可直接复制以下内容：

```
SealMind — Privacy-Sovereign AI Agent Operating System

SealMind addresses a fundamental problem in AI: agents today have no soul. Their memories are stored on centralized servers (easily stolen), their inference cannot be verified (models can be swapped undetectably), and their identity is tied to platforms (users don't truly own them).

Built entirely on 0G Network, SealMind equips every AI Agent with four core soul components:

🔒 Sealed Mind — TEE-based verifiable inference via 0G Compute (TeeML). Every AI response comes with cryptographic proof.

🧠 Memory Vault — Client-side encrypted memories stored on 0G Storage KV. Only the owner holds the decryption key. Dual-layer: hot cache + persistent 0G KV.

🪪 Agent Identity — ERC-721 INFT on 0G Chain. Each agent has a unique Soul Signature (keccak256 hash), making it irreplaceable and ownable.

⛓️ Decision Chain — Immutable on-chain audit log. Critical decisions recorded on-chain with proofHash, verifiable by anyone.

Extended Features:
• Bounty Board — On-chain task marketplace with escrow, 7-state lifecycle, sub-bounties
• Agent Marketplace — Free trading market with pricing, tags, and trial system
• Hive Mind — Decentralized collective intelligence on 0G Storage
• Agent Passport — On-chain certification system
• Living Soul — Experience hash chain for dynamic agent evolution
• Multi-Agent Collaboration — Keyword routing, parallel orchestration, task delegation
• Agent Gateway — REST + MCP protocol for AI agent self-discovery

Tech Stack: Next.js 14, Express, Solidity 0.8.19, ethers.js v6, 0G TS SDK, RainbowKit, TailwindCSS
```

---

## 4. 本次黑客松进展

```
v3.0 Major Update:

✅ Core Infrastructure (Completed)
- 4 Solidity contracts (SealMindINFT, DecisionChain, AgentRegistry, BountyBoard) — 94/94 tests passing
- 3 contracts deployed to 0G Testnet (Chain ID: 16602)
- 12 backend services with full mock degradation
- 30+ frontend pages with modern UI

✅ 0G Deep Integration
- 0G Storage KV: AES-256-GCM encrypted Memory Vault with dual-layer cache
- 0G Compute: TEE inference with 3-layer fallback (TEE → DeepSeek → Mock)
- 0G Chain: INFT minting, Decision Chain recording, Agent Registry
- 0G Skills Integration: Provider Discovery, Compute Account, Text-to-Image, Speech-to-Text

✅ New in v3.0
- Agent Passport: On-chain certification with capability tests
- Living Soul: Experience hash chain (keccak256 chain)
- Hive Mind: Decentralized collective intelligence
- Agent Gateway: REST + MCP protocol dual-channel
- MCP Server: Compatible with Claude Desktop, Cursor

🔄 In Progress
- BountyBoard contract deployment (pending testnet gas)
- Mainnet migration (pending gas tokens)
- SealMindINFT v3.0 redeployment with Passport + Soul structs
```

---

## 5. 融资状态

```
No funding. This is a hackathon project built from scratch.
```
> 如果你有其他融资情况请如实填写。

---

## 6. 部署详情

### 生态已部署
选择：**0G Network**（或对应的生态选项）

### 测试网/主网
选择：**测试网**

### 合约地址与部署链接

```
Network: 0G Newton Testnet (Chain ID: 16602)
Deployed: 2026-03-26

Contracts:
1. SealMindINFT (ERC-721 INFT):
   Address: 0x1f29Bd4E0426222a78Ce0D484677A672DF3E8fa6
   Explorer: https://chainscan-newton.0g.ai/address/0x1f29Bd4E0426222a78Ce0D484677A672DF3E8fa6

2. DecisionChain (Audit Log):
   Address: 0x354306105a61505EB9a01A142E9fCA537E102EC2
   Explorer: https://chainscan-newton.0g.ai/address/0x354306105a61505EB9a01A142E9fCA537E102EC2

3. AgentRegistry (Agent Directory):
   Address: 0x127b73133c9Ba241dE1d1ADdc366c686fd499c02
   Explorer: https://chainscan-newton.0g.ai/address/0x127b73133c9Ba241dE1d1ADdc366c686fd499c02

4. BountyBoard (Task Marketplace):
   Code complete, deployment pending (need testnet gas)

Deployer Wallet: 0x30e31C6E8179f7aAb6E19B26a3F46B10E4Ce7f92
```

---

## 7. 团队 Tab

⚠️ **待填写** — 需要你补充团队成员信息。

建议格式：
- 成员姓名
- 角色（Full-stack / Smart Contract / Frontend / Backend / Design）
- GitHub / Twitter / LinkedIn 链接

---

## 📋 待办清单（按优先级）

| 优先级 | 项目 | 状态 | 说明 |
|--------|------|------|------|
| 🔴 P0 | GitHub 仓库公开 | ❌ 待确认 | 填写"项目链接"必须 |
| 🔴 P0 | MVP 链接（前端部署公网） | ❌ 待完成 | 评委需要能访问 |
| 🔴 P0 | 项目截图 4 张 | ❌ 待完成 | 报名必填 |
| 🟡 P1 | Demo 视频录制 | ❌ 待完成 | 展示核心流程 |
| 🟡 P1 | 推特账号 & 推文 | ❌ 待完成 | 提升曝光 |
| 🟡 P1 | BountyBoard 合约部署 | ❌ 待完成 | 需要 testnet gas |
| 🟡 P1 | SealMindINFT v3.0 重新部署 | ❌ 待完成 | Passport+Soul 函数上链 |
| 🟢 P2 | 后端部署公网 | ❌ 待完成 | MVP 链接的后端依赖 |
| 🟢 P2 | Pitch 视频 | ❌ 待完成 | 如果有路演环节 |
| 🟢 P2 | 团队信息填写 | ❌ 待填写 | 报名页面"团队"Tab |

---

## 🔗 快捷链接

| 资源 | 链接 |
|------|------|
| 0G Testnet Explorer | https://chainscan-newton.0g.ai |
| 0G Testnet RPC | https://16602.rpc.thirdweb.com |
| 0G Testnet Faucet | https://faucet.0g.ai |
| 0G 官方文档 | https://docs.0g.ai |
| RainbowKit 文档 | https://www.rainbowkit.com |
| Vercel 部署 | https://vercel.com/new |

---

> 📝 本文档生成时间：2026-04-07，基于项目 v3.0 代码和报名页面截图。
