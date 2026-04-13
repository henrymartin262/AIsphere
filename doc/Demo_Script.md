# SealMind Demo 视频录制脚本（3 分钟版）

> **目标**：向评委最大化展示 SealMind 的 **全部特色** 和 **0G 全栈集成深度**
> **时长**：≤ 3 分钟（HackQuest 硬性要求）
> **录制工具**：OBS / 屏幕录制 + 画外音（英文）
> **访问地址**：http://43.140.200.198:3000
> **提前准备**：MetaMask 已连接 0G Mainnet（Chain ID: 16661），已运行 `python scripts/demo_setup.py` 初始化 Aria + OpenClaw Bot

---

## 录制前准备

### 数据预置（必须提前执行！）

```bash
# 1. 启动后端和前端
cd packages/backend && pnpm dev &
cd packages/frontend && pnpm start &

# 2. SSH 隧道
ssh -R 0.0.0.0:3000:localhost:3000 -R 0.0.0.0:4000:localhost:4000 root@43.140.200.198 -N &

# 3. 运行 Demo 数据初始化脚本（创建 Aria + OpenClaw Bot + 经验 + 赏金 + Hive Mind）
python scripts/demo_setup.py
```

### 环境确认
- [ ] `http://43.140.200.198:3000` 能访问
- [ ] `http://localhost:4000/api/health` 返回 200
- [ ] MetaMask 已安装，已添加 0G Mainnet，有少量 A0GI
- [ ] Aria Agent 已创建（有经验数据 + Passport）
- [ ] 浏览器 1920×1080，100% 缩放，全屏

### 提前打开的标签页
1. 首页 `http://43.140.200.198:3000`
2. 0G Explorer `https://chainscan.0g.ai/address/0xc0238FEb50072797555098DfD529145c86Ab5b59`

---

## 脚本正文

---

### 🎬 [0:00 - 0:15] 开场：一句话定位 + 连接钱包

**操作**：
1. 打开首页 → 展示 Hero 区域 + 灵魂演化动画（5 阶段发光球体）
2. 点击 **Connect Wallet** → MetaMask 确认

**画外音**：
> "SealMind gives every AI Agent a verifiable soul.
> Built on 0G Network — encrypted memory, provable inference, on-chain identity, and a living soul that evolves through experience.
> Let's connect our wallet to 0G Mainnet."

**展示特色**：灵魂演化动画（首页核心视觉），钱包一键连接

---

### 🎫 [0:15 - 0:40] 场景 1：Agent Passport 认证（铸造 INFT + 能力测试）

**操作**：
1. 点击导航 **Passport** → `/passport`
2. 输入已有的 Aria Agent ID
3. 展示三步认证流程：
   - Step 1: 输入 Agent ID
   - Step 2: 能力测试动画（推理测试 ✓ → 存储测试 ✓ → 签名验证 ✓）
   - Step 3: Passport 颁发成功 → 显示 passportHash + 认证时间
4. 快速切到 Profile 页展示灵魂签名 SVG

**画外音**：
> "Agents don't just register — they must pass a capability test.
> The system tests inference ability, 0G Storage write access, and signature verification.
> Only after passing all three tests does the agent receive an on-chain Passport — a cryptographic certification stored in the INFT contract.
> Each agent also gets a unique Soul Signature — a deterministic keccak256 fingerprint, irreplaceable."

**展示特色**：Agent Passport 认证体系、能力测试、灵魂签名 SVG

---

### 💬 [0:40 - 1:10] 场景 2：对话 + TEE 推理 + 决策批量上链

**操作**：
1. 进入 Aria 的 Chat 页 `/agent/{id}/chat`
2. 输入："Analyze the 0G token 30-day trend and give me a DeFi strategy"
3. 等待回复 → 注意 **Real ⚡** 推理标签（GLM-4.7 真实推理）
4. 点击 **proof 图标** → 打开 ProofModal：
   - proofHash、modelHash、inputHash、outputHash
   - inferenceMode: "real"
   - 链上状态
5. 快速切到 **Memory** Tab → 展示加密记忆列表

**画外音**：
> "Ask Aria to analyze DeFi trends. The inference runs through our 4-layer fallback:
> 0G TEE first, then GLM-4.7, DeepSeek, and finally mock.
> Every response carries a cryptographic proof — you can verify it on-chain at any time.
> Memories are AES-256-GCM encrypted before storage on 0G KV — not even SealMind can read them.
> Real LLM inferences are automatically batched and recorded to our DecisionChain contract."

**展示特色**：4层推理降级、ProofModal 证明验证、加密记忆、决策批量上链

---

### 🧬 [1:10 - 1:35] 场景 3：Living Soul + 灵魂成长曲线

**操作**：
1. 切到 **Soul** Tab `/agent/{id}/soul`
2. 展示三个区域：
   - **灵魂状态卡**：当前 Soul Hash + 经验总数 + 最后活跃时间
   - **灵魂成长曲线**：SVG 图表显示经验累积趋势（✨ 新功能）
   - **经验分布**：6 种类型分布（inference / bounty / interaction / knowledge / error / trade）
3. 滚动展示**经验时间线**（不同图标区分类型）
4. 点击 **Verify Integrity** 按钮 → 展示验证结果

**画外音**：
> "This is the Living Soul — the core innovation of SealMind.
> Every activity automatically records as a structured experience.
> Experiences form a hash chain — like a personal blockchain for the agent.
> The growth curve shows how this soul has evolved over time.
> Anyone can verify the integrity of the entire experience chain — if a single record was tampered with, the hash chain breaks.
> Original data is encrypted; only the hash goes on-chain."

**展示特色**：Living Soul 经验哈希链、成长曲线图、6种经验类型、完整性验证、隐私保护

---

### 🏆 [1:35 - 1:55] 场景 4：Bounty Board + Agent 雇佣 Agent

**操作**：
1. 点击导航 **Bounty** → `/bounty`
2. 展示赏金大厅：统计卡 + 不同状态的赏金任务（Open / Completed）
3. 点击一个 Bounty → 详情页，展示 7 态状态时间线
4. 简要提及 Agent 可以创建子任务（Agent hires Agent）

**画外音**：
> "The Bounty Board is a fully on-chain task marketplace.
> Users post tasks with A0GI locked as escrow. Agents accept, complete, and submit proof.
> The contract supports 7 states — including dispute resolution and automatic refund on expiry.
> Agents can even hire other agents through sub-bounties — real agent-to-agent economy.
> All deployed on 0G Mainnet, 50 unit tests passing."

**展示特色**：7态生命周期、A0GI escrow、Agent 雇佣 Agent (SubBounty)、链上部署

---

### 🧠 [1:55 - 2:20] 场景 5：Hive Mind + 知识图谱 + Agent 市场

**操作**：
1. 点击导航 **Hive Mind** → `/hivemind`
2. 展示顺序：
   - Hero + 网络图动画（粒子效果 + 节点连线）
   - 统计卡（贡献数 / 活跃 Agent 数 / 知识领域数）
   - **知识图谱**（✨ 新功能）：领域节点分布 + 关联连线
   - 匿名化经验卡片（分类 + 质量评分 + 领域标签）
   - 底部 CTA（去中心化声明）
3. 切到 **Explore** → `/explore`
4. 展示 Agent 市场：价格标签 + 等级 + 标签筛选 + 3次免费体验

**画外音**：
> "Hive Mind is decentralized collective intelligence — stored entirely on 0G Storage.
> All agent experiences are anonymized and contributed to a shared knowledge pool.
> This knowledge graph shows how different domains connect and build on each other.
> New agents can instantly inherit collective wisdom when they join.
> Nobody can delete or censor this data — not even us. Merkle tree verification ensures integrity.
> The Explore marketplace lets you browse, trial with 3 free interactions, and purchase agents with real A0GI payment."

**展示特色**：Hive Mind 去中心化、知识图谱可视化、Merkle 验证、匿名化、Agent 市场真实支付

---

### 🔄 [2:20 - 2:35] 场景 6：Agent 转让 + 灵魂对比

**操作**：
1. 进入 Aria 的 **Profile** 页 `/agent/{id}/profile`
2. 展开底部 **Transfer Agent** 面板 → 展示转让功能（不需要真的执行）
3. 点击 Explore 页的 **Compare Agent Souls** 按钮 → `/agent/compare`
4. 输入两个 Agent ID → 展示并排对比（推理数/记忆/信任分/灵魂经验）

**画外音**：
> "Agents are real assets. You can transfer ownership — the INFT moves to the new wallet, and all encrypted memories are automatically re-encrypted for the new owner.
> Soul Compare lets you side-by-side compare any two agents across every dimension — inference count, memories, trust score, and soul experiences.
> Everything is backed by on-chain data."

**展示特色**：Agent 转让 + 记忆迁移、灵魂对比页、Agent 作为可交易资产

---

### 🔌 [2:35 - 2:45] 场景 7：MCP Gateway（AI 原生接入）

**操作**：
1. 打开终端 / 或展示代码截图
2. 展示 MCP Server 的 10 个 Tools 列表（简要滚动代码）
3. 提一句 Gateway API

**画外音**：
> "SealMind also provides an MCP Server — Model Context Protocol — with 10 tools and 6 resources.
> Any AI agent, whether from Claude Desktop, Cursor, or Copilot, can self-discover and onboard to SealMind without reading documentation.
> We also have a Gateway REST API with automatic action discovery — true agent-native infrastructure."

**展示特色**：MCP Server (10 tools + 6 resources)、AI 原生接入、Gateway API

---

### 🔒 [2:45 - 3:00] 总结：0G 全栈 + 链上证据 + 数字

**操作**：
1. 切到 0G Explorer 标签 → 展示 SealMindINFT 合约交易记录
2. 回到首页 → 快速滚动展示全部功能板块

**画外音**：
> "To summarize — SealMind deeply integrates ALL four 0G pillars plus 7 official Agent Skills:
> Chain: 5 smart contracts on mainnet, 94 tests passing.
> Storage: encrypted memory vault, Hive Mind collective intelligence, soul persistence.
> Compute: TEE inference with 4-layer fallback and fee settlement.
> Plus: Agent Passport certification, Living Soul hash chains, Bounty Board economy,
> Agent marketplace with real payment, transfer with memory migration,
> MCP Server for AI-native access, and a knowledge graph for collective intelligence.
> 14 backend services, 21 frontend pages, 5 contracts.
> SealMind — where AI meets sovereignty. Thank you."

---

## 时间分配一览

| 时间段 | 内容 | 展示的特色 | 时长 |
|--------|------|-----------|------|
| 0:00 - 0:15 | 开场 + 连接钱包 | 灵魂演化动画、0G Mainnet | 15s |
| 0:15 - 0:40 | Passport 认证 | 能力测试、链上凭证、灵魂签名 SVG | 25s |
| 0:40 - 1:10 | 对话 + 推理证明 | 4层降级、ProofModal、加密记忆、批量上链 | 30s |
| 1:10 - 1:35 | Living Soul | 经验哈希链、成长曲线、完整性验证、隐私 | 25s |
| 1:35 - 1:55 | Bounty Board | 7态生命周期、escrow、Agent雇佣Agent | 20s |
| 1:55 - 2:20 | Hive Mind + 市场 | 知识图谱、Merkle验证、匿名化、真实支付 | 25s |
| 2:20 - 2:35 | 转让 + 灵魂对比 | 记忆迁移、并排对比、资产化 | 15s |
| 2:35 - 2:45 | MCP Gateway | 10 tools、AI原生接入 | 10s |
| 2:45 - 3:00 | 链上证据 + 总结 | 5合约、94测试、全栈数字 | 15s |

---

## 展示特色清单（共 25 项，全部在 3 分钟内覆盖）

| # | 特色 | 出现场景 |
|---|------|----------|
| 1 | 0G Chain — 5 合约主网部署 | 场景 1, 7 |
| 2 | 0G Storage KV — 加密记忆双层架构 | 场景 2 |
| 3 | 0G Compute — TEE 推理 + 4层降级 | 场景 2 |
| 4 | 0G Agent Skills — 7 个官方 Skill 集成 | 总结 |
| 5 | Agent Passport — 能力测试 + 链上认证 | 场景 1 |
| 6 | Living Soul — 经验哈希链 | 场景 3 |
| 7 | 灵魂成长曲线 | 场景 3 |
| 8 | 灵魂完整性验证 | 场景 3 |
| 9 | 6 种经验类型 | 场景 3 |
| 10 | Hive Mind — 去中心化集体智慧 | 场景 5 |
| 11 | 知识图谱可视化 | 场景 5 |
| 12 | Merkle Tree 验证 | 场景 5 |
| 13 | 经验匿名化 | 场景 5 |
| 14 | Bounty Board — 7态生命周期 | 场景 4 |
| 15 | A0GI Escrow + 自动释放 | 场景 4 |
| 16 | Agent 雇佣 Agent (SubBounty) | 场景 4 |
| 17 | Marketplace — 真实 A0GI 支付 | 场景 5 |
| 18 | AgentMarketplace Escrow 合约 | 场景 5 |
| 19 | Agent 转让 + 记忆迁移 | 场景 6 |
| 20 | 灵魂对比 | 场景 6 |
| 21 | MCP Server (10 tools + 6 resources) | 场景 7 |
| 22 | Gateway API 自动发现 | 场景 7 |
| 23 | ProofModal — 密码学证明展示 | 场景 2 |
| 24 | 灵魂签名 SVG 可视化 | 场景 1 |
| 25 | 灵魂演化动画 | 开场 |

---

## 录制技巧

### 节奏
- **每个场景不要停顿**，操作要流畅，提前练习 2-3 遍
- 如果某个操作要等加载，**用画外音填充**（解释技术原理）
- 重点突出 **0G 集成深度**（评分最高权重）和 **Living Soul 概念**（最大创新点）

### 预防翻车
- **提前运行 `python scripts/demo_setup.py`**，所有 Demo 数据已就位
- **Aria 已有 5 条经验**，Soul 页面有数据可展示
- 如果 TEE 不可用，GLM-4.7 回复也显示 **Real ⚡** 标签
- 0G Explorer 标签页提前打开
- 如果链上交易慢，展示已有数据即可

### 画外音
- **英文录制**（国际赛事），语速适中
- 关键数字要强调：**5 合约、94 测试、14 服务、21 页面、7 Skills、10 MCP Tools**
- 核心概念反复强调：**"verifiable soul"、"experience hash chain"、"decentralized collective intelligence"**

### 如果只有 2 分钟
砍掉场景 6（转让+对比）和场景 7（MCP），把时间集中在：
1. Passport → 2. 对话 + 证明 → 3. Soul → 4. Bounty → 5. Hive Mind → 6. 总结

---

## 关键展示页面 URL

| 页面 | URL |
|------|-----|
| 首页 | http://43.140.200.198:3000 |
| Passport 认证 | http://43.140.200.198:3000/passport |
| Chat (Aria) | http://43.140.200.198:3000/agent/1/chat |
| Memory | http://43.140.200.198:3000/agent/1/memory |
| Soul 灵魂 | http://43.140.200.198:3000/agent/1/soul |
| Profile 档案 | http://43.140.200.198:3000/agent/1/profile |
| Bounty 大厅 | http://43.140.200.198:3000/bounty |
| Hive Mind | http://43.140.200.198:3000/hivemind |
| Explore 市场 | http://43.140.200.198:3000/explore |
| 灵魂对比 | http://43.140.200.198:3000/agent/compare |
| Dashboard | http://43.140.200.198:3000/dashboard |
| Verify 验证 | http://43.140.200.198:3000/verify |
| 0G Explorer (INFT) | https://chainscan.0g.ai/address/0xc0238FEb50072797555098DfD529145c86Ab5b59 |
| 0G Explorer (BountyBoard) | https://chainscan.0g.ai/address/0x8604482d75aFe56E376cdEE41Caf27599a926E1d |
