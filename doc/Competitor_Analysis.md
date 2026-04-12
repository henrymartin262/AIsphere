# 0G APAC Hackathon 2026 — 竞品深度分析报告

> 数据采集时间：2026-04-12 | 来源：HackQuest 项目展示页
> 分析视角：以 SealMind 为基准，全面分析同赛道竞品

---

## 一、赛事概览

| 项目 | 内容 |
|:-----|:-----|
| **赛事名称** | 0G APAC Hackathon 2026 |
| **总奖池** | $150,000 USD |
| **提交截止** | 2026-05-16 |
| **结果公布** | 2026-05-29 |
| **5大赛道** | Agent Infrastructure、Verifiable Finance、Agentic Economy、Web 4.0 Open Innovation、Privacy & Sovereign Infrastructure |

### 奖项设置

| 奖项 | 金额 |
|:-----|:-----|
| 🥇 第1名 | $45,000 |
| 🥈 第2名 | $35,000 |
| 🥉 第3名 | $20,000 |
| 优秀奖 ×10 | 每名 $3,700 |
| 社区奖 ×10 | 每名 $1,300 |

---

## 二、参赛项目全景（12 个项目）

| # | 项目 | 赞数 | 赛道定位 | 技术栈 | 队长 |
|:--|:-----|:-----|:---------|:-------|:-----|
| 1 | **LocalHero** | 9,769 | Gaming/NFT/AI/DAO | Node/Vue/Next/Solidity | Thomas bihary |
| 2 | **MindVault** | 8,320 | DeFi/NFT/Infra/AI | Next.js/TypeScript/Solidity | Nidhi Singh |
| 3 | **0G Chain Web3 Learning Toolset** | 7,869 | DeFi | Python/Web3 | Yubo Chen |
| 4 | **Memo** | 7,711 | DeFi/AI | Web3 | Ayush Mukherjee |
| 5 | **Ghast AI** | 7,215 | AI | Web3 | wang peng |
| 6 | **VeraSignal** | 6,720 | Infra/Other/AI | Next.js 15/Solidity | Niko Bash |
| 7 | **áafsafsa** | 4,829 | NFT/Gaming/RWA | React | Lee aaaa |
| 8 | **AgentPay** | 1,241 | AI/Infra/DAO/Other | Next/Solidity/0G Storage | Akanimoh Johnson |
| 9 | **GEM** | 412 | SocialFi/DAO/NFT | Next.js | Thomas bihary |
| 10 | **TrustFolio** | 237 | NFT/Infra/AI/SocialFi | Next.js 14/Hardhat | Zax Raider |
| 11 | **Coal** | 144 | AI/DeFi/Infra | Next.js/Solidity | Emmanuel Haankwenda |
| 12 | **Orbit AI** | 140 | AI/Infra/RWA/Other | Python | Gus Liu |

> **注意**：赞数可能存在刷票现象（如 LocalHero 9769 赞但项目完成度一般），评审更看重技术深度和 0G 集成质量。

---

## 三、核心竞品深度分析

### 3.1 MindVault — ⚠️ 最直接竞品（威胁等级：🔴 高）

| 维度 | MindVault | SealMind |
|:-----|:----------|:---------|
| **点赞数** | 8,320 | — |
| **核心定位** | AI Agent 记忆与身份层 | 隐私自主 AI Agent 操作系统 |
| **记忆系统** | Merkle 验证 JSON + 跨会话恢复 | AES-256-GCM 加密 + 0G KV 双层 |
| **TEE 推理** | ✅ TEE Sealed Inference | ✅ TEE 3层降级（TEE→Direct→Mock） |
| **Agent 身份** | ERC-7857 INFT | ERC-721 INFT + Soul Signature |
| **智能合约** | 3个（INFT + MemoryRegistry + Marketplace） | 4个（INFT + DecisionChain + Registry + BountyBoard） |
| **测试覆盖** | 未公开具体数量 | 94 个单元测试 |
| **记忆高级特性** | 语义检索(TF-IDF)、冲突解决、跨 Agent 共享 | Living Soul 经验链、Hive Mind 集体智慧 |
| **OpenClaw** | 3个工具 + auto-persist 钩子 | 完整 Skill 引擎 + Pipeline |
| **市场** | Agent Marketplace（上架/购买/下架） | Agent Marketplace + BountyBoard 赏金市场 |
| **团队** | 单人 | 单人 |
| **融资** | 自筹，积极寻求融资 | 自筹 |

#### MindVault 亮点
- **语义记忆检索**：基于 TF-IDF 关键词重叠，选前20条最相关记忆注入上下文
- **冲突解决**：自动检测事实矛盾（如"搬到东京"vs"住在柏林"），新事实覆盖旧事实
- **跨 Agent 记忆共享**：一个 Agent 可导入另一个 Agent 的知识
- **6个前端 Tab**：Dashboard / Chat / Marketplace / OpenClaw / Privacy / Architecture
- **声称"无外部 AI API"**：所有推理通过 0G Compute 运行

#### MindVault 弱点
- **缺少赏金系统**：没有 BountyBoard 等任务市场
- **缺少 Passport 认证**：Agent 无准入门槛
- **缺少经验系统**：没有 Living Soul / Hive Mind 概念
- **缺少 MCP 协议**：无标准化 Agent 接入网关
- **缺少 AI Media**：无文生图/语音转文字能力
- **ERC-7857 vs ERC-721**：使用了尚未广泛采用的 ERC-7857 标准
- **合约数量少**：3个 vs SealMind 的4个

---

### 3.2 VeraSignal — 可验证 DeFi 预言机（威胁等级：🟡 中）

| 维度 | 详情 |
|:-----|:-----|
| **点赞数** | 6,720 |
| **核心定位** | 可验证市场情报预言机（Verifiable Market Intelligence Oracle） |
| **解决问题** | DeFi 分析系统的 AI 推理无法证明未被操纵 |
| **技术栈** | Next.js 15 / Node.js / Solidity / Ethers |
| **队长** | Niko Bash（独立开发者，自举） |

#### 0G 集成（3层）
| 组件 | 用途 |
|:-----|:-----|
| **0G Compute (TEE)** | 钱包分类 AI 在 TEE 安全区运行，GPT-OSS-120b 模型 |
| **0G Chain** | `VeraSignalOracle.sol` 主网部署，信号发布+TEE证明哈希上链 |
| **0G Storage KV** | 历史热力图快照持久化，每5分钟一次 |

#### 亮点
- **测试最充分**：70项测试（37 Jest + 33 Playwright E2E）
- **主网合约活跃**：37笔确认交易
- **TEE 证明链完整**：每个发布的信号携带 `teeProofHash` (keccak256)
- **前端丰富**：TeeProofBadge、OracleFeed、HistoryPlayback、WalletLookup、D3热力图

#### 弱点
- **赛道不同**：专注 DeFi 预言机，不做 Agent 操作系统
- **功能窄**：仅做市场情报验证，无记忆/身份/市场等
- **与 SealMind 不直接竞争**：除非评审看整体创新性

---

### 3.3 Coal — 0G 集成最深的项目（威胁等级：🟡 中）

| 维度 | 详情 |
|:-----|:-----|
| **点赞数** | 144 |
| **核心定位** | Agent 经济商业平台（Commerce platform for agent economy） |
| **解决问题** | AI Agent 缺乏原生支付和商业基础设施 |
| **技术栈** | Next.js / React / Solidity / Ethers / Node.js |
| **队长** | Emmanuel Haankwenda |
| **融资** | 自筹（MNEE 黑客松第一名奖金资助） |

#### 0G 集成（全部5组件 — 唯一一个）
| 组件 | 用途 |
|:-----|:-----|
| **0G Storage** | 不可变支付收据、AES-256-GCM 加密商家记忆 |
| **0G Chain** | CoalReceiptAnchor V2 合约，锚定 SHA-256 收据哈希 |
| **0G Compute** | 商业查询 AI（商家记忆查找/策略评估/产品路由）+ TEE 证明 |
| **0G KV** | 实时状态层（商家资料/记忆指针/付费墙清单） |
| **0G DA** | gRPC 事件流管道（6种事件类型），专用新加坡 EC2 sidecar |

#### 亮点
- **0G 集成最全面**：全部5个组件都有实质性集成
- **真实商业功能**：产品管理、托管结账、支付链接、订阅、付费墙、收入分配
- **x402 协议**：AI Agent 自主购买标准（HTTP 402 握手）
- **ERC-3009 无 Gas 支付**：Agent 离线签名，平台承担 Gas
- **实时健康检查**：`api.usecoal.xyz/api/0g/health` 返回5组件状态
- **已有真实用户**：活跃商家 "Saint" 有真实产品
- **3步可验证证明链**：Base 交易→0G Storage 收据→0G Chain 锚定
- **之前获奖**：MNEE 黑客松第一名

#### 弱点
- **赞数极低**（144），社区关注度不足
- **偏商业基础设施**：不做 Agent 身份/记忆/推理验证
- **不做 AI Agent 操作系统**：功能定位不同
- **依赖 Base 链做支付**：部分功能不在 0G 生态内

---

### 3.4 AgentPay — Agent 微支付协议（威胁等级：🟢 低-中）

| 维度 | 详情 |
|:-----|:-----|
| **点赞数** | 1,241 |
| **核心定位** | 面向自主 AI Agent 的链上微支付和结算协议 |
| **技术栈** | Next / Solidity / Ethers / 0G Storage |
| **队长** | Akanimoh Johnson |

#### 0G 集成（4层）
| 组件 | 用途 |
|:-----|:-----|
| **0G Chain** | AgentRegistry + PaymentRouter + SplitVault 主网部署 |
| **0G Storage** | 发票记录和支付历史持久化 |
| **0G Compute** | 动态定价预言机（AI 实时定价） |
| **0G Agent ID** | 自托管钱包与可验证 Agent 身份绑定 |

#### 核心功能
- 自托管 Agent 钱包
- 亚美分级别微支付
- 条件释放托管（任务完成自动放款）
- AI 动态定价预言机
- 多方收益分配（SplitVault）
- TypeScript SDK

#### 与 SealMind 对比
- **互补关系**：AgentPay 做支付，SealMind 做操作系统，理论上可以集成
- **BountyBoard 重叠**：SealMind 的 BountyBoard 有类似的任务-支付流程
- **不做记忆/身份**：定位更窄

---

### 3.5 TrustFolio — AI 声誉协议（威胁等级：🟢 低）

| 维度 | 详情 |
|:-----|:-----|
| **点赞数** | 237 |
| **核心定位** | AI 驱动的链上声誉与技能验证协议 |
| **技术栈** | Next.js 14 / TypeScript / Tailwind / RainbowKit / wagmi / Hardhat |
| **队长** | Zax Raider（独立开发者 + AI 助手 "Zaxxie"） |

#### 0G 集成（3+1层）
| 组件 | 用途 |
|:-----|:-----|
| **0G Storage** | 作品集文件、用户资料、验证证明、INFT 元数据 |
| **0G Compute** | AI 分析评分（原创性/质量/复杂度/真实性） |
| **0G Chain** | SoulBound + INFT + Marketplace + HiringEscrow（4个合约） |
| **0G DA** | 跨链凭证（未来路线图） |

#### 亮点
- **完整4阶段路线图全部完成**：基础→AI验证→市场→规模化
- **丰富的合约体系**：4个已部署 + 7个规划中
- **招聘场景**：HiringEscrow 托管合约（7天争议期）
- **$TRUST 代币经济**：质押 8% APY
- **评分等级系统**：Diamond/Gold/Silver/Bronze
- **已部署自定义域名**：trustfolio.space

#### 弱点
- **偏人类声誉**：验证人的技能，不是 Agent 的能力
- **与 SealMind 定位差异大**：SealMind 做 Agent OS，TrustFolio 做人类简历验证
- **代币经济过于复杂**：对黑客松项目来说可能显得不聚焦

---

### 3.6 LocalHero — 现实世界任务平台（威胁等级：🟢 低）

| 维度 | 详情 |
|:-----|:-----|
| **点赞数** | 9,769（最高） |
| **核心定位** | 现实世界行动证明平台（Proof of Action） |
| **技术栈** | Node / Vue / Next / Solidity |
| **队长** | Thomas bihary（同时参赛 GEM 和 LocalHero） |

#### 特点
- 受 Pokémon GO 启发：完成现实任务（种树/帮助邻居）→ AI 验证→上链→奖励
- 赞数最高但完成度一般（AI 验证层仍在早期，0G 架构仍在规划中）
- 0G 集成仅停留在设计阶段，尚未深度实现

#### 与 SealMind 关系
- **完全不同赛道**：LocalHero 做现实世界游戏化，SealMind 做 AI Agent OS
- **不构成竞争**

---

### 3.7 其他项目简析

| 项目 | 赞 | 评估 |
|:-----|:---|:-----|
| **0G Chain Web3 Learning Toolset** | 7,869 | 个人学习项目，仅有基础链交互工具，技术深度低，**不构成竞争** |
| **Memo** | 7,711 | 多智能体编排系统，信息披露不足无法深入分析，**潜在关注** |
| **Ghast AI** | 7,215 | Web3 原生 AI 助手 + 首个去中心化 OpenClaw，信息不足，**需持续关注** |
| **áafsafsa** | 4,829 | 疑似测试项目（名称无意义），React 技术栈，**不构成竞争** |
| **GEM** | 412 | 去中心化直播平台，SocialFi 方向，**不构成竞争** |
| **Orbit AI** | 140 | 卫星+轨道 AI 云概念，信息不足，**不构成竞争** |

---

## 四、0G 集成深度对比矩阵

| 项目 | Storage | Storage KV | Compute (TEE) | Chain | DA | INFT | 合约数 | 测试数 |
|:-----|:--------|:-----------|:---------------|:------|:---|:-----|:-------|:-------|
| **SealMind** | ✅ | ✅ 双层 | ✅ 3层降级 | ✅ 主网 | — | ✅ ERC-721 | 4 | 94 |
| **MindVault** | ✅ Merkle | ✅ | ✅ | ✅ 主网 | — | ✅ ERC-7857 | 3 | 未公开 |
| **VeraSignal** | — | ✅ | ✅ | ✅ 主网 | — | — | 1 | 70 |
| **Coal** | ✅ | ✅ | ✅ | ✅ 主网 | ✅ gRPC | — | 1 | 未公开 |
| **AgentPay** | ✅ | — | ✅ | ✅ 主网 | — | — | 3 | 未公开 |
| **TrustFolio** | ✅ | — | ✅ | ✅ | 路线图 | ✅ ERC-7857 | 4(+7规划) | 未公开 |
| **LocalHero** | 规划中 | — | — | 规划中 | — | — | 0 | 0 |

---

## 五、功能覆盖对比矩阵

| 功能 | SealMind | MindVault | VeraSignal | Coal | AgentPay | TrustFolio |
|:-----|:---------|:----------|:-----------|:-----|:---------|:-----------|
| **Agent 记忆** | ✅ AES加密+双层 | ✅ Merkle+语义 | — | 商家记忆 | — | — |
| **TEE 推理** | ✅ 3层降级 | ✅ | ✅ | ✅ | ✅ 定价 | ✅ 评分 |
| **Agent 身份 INFT** | ✅ | ✅ | — | — | — | ✅ |
| **决策审计链** | ✅ DecisionChain | — | ✅ Oracle | ✅ 收据锚定 | — | — |
| **任务/赏金市场** | ✅ BountyBoard | — | — | — | ✅ 条件托管 | ✅ HiringEscrow |
| **Agent 交易市场** | ✅ | ✅ | — | — | — | ✅ |
| **Soul Signature** | ✅ | — | — | — | — | ✅ SoulBound |
| **Passport 认证** | ✅ | — | — | — | — | — |
| **Living Soul** | ✅ 经验哈希链 | — | — | — | — | — |
| **Hive Mind** | ✅ 集体智慧 | — | — | — | — | — |
| **MCP Gateway** | ✅ | — | — | — | — | — |
| **Multi-Agent** | ✅ 编排/委托/握手 | — | — | — | — | — |
| **OpenClaw** | ✅ Skill+Pipeline | ✅ 3工具 | — | — | — | — |
| **AI Media** | ✅ Flux+Whisper | — | — | — | — | — |
| **微支付** | — | — | — | ✅ x402 | ✅ SDK | — |
| **DeFi 预言机** | — | — | ✅ | — | — | — |
| **Token 经济** | — | — | — | — | — | ✅ $TRUST |

---

## 六、赞数分析与社区热度

```
LocalHero      ████████████████████████████████████████████████  9,769
MindVault      ██████████████████████████████████████████        8,320
0G Learning    ███████████████████████████████████████           7,869
Memo           ██████████████████████████████████████            7,711
Ghast AI       █████████████████████████████████████             7,215
VeraSignal     █████████████████████████████████                 6,720
áafsafsa       ████████████████████████                          4,829
AgentPay       ██████                                            1,241
GEM            ██                                                  412
TrustFolio     █                                                   237
Coal           █                                                   144
Orbit AI       █                                                   140
```

> **重要提醒**：赞数≠项目质量。从截图可见，部分高赞项目（如 áafsafsa、0G Learning Toolset）技术深度明显不足。评审更看重 0G 集成深度、代码质量、创新性和演示效果。

---

## 七、关键发现与洞察

### 7.1 赛场格局

1. **真正有竞争力的项目约 5-6 个**：SealMind、MindVault、VeraSignal、Coal、AgentPay、TrustFolio
2. **高赞项目不一定高质量**：LocalHero (9769赞) 0G集成仍在规划阶段
3. **独立开发者居多**：大部分项目为单人开发，说明工程量差距不大
4. **MindVault 是最需要警惕的对手**：功能重叠度最高

### 7.2 评审可能关注点

| 评审维度 | 权重预估 | SealMind 表现 |
|:---------|:---------|:-------------|
| **0G 集成深度** | 高 | ✅ 4组件深度集成 + 7个官方 Skill |
| **代码质量** | 高 | ✅ 94个测试，TypeScript 全栈 |
| **创新性** | 高 | ✅ Living Soul/Hive Mind/MCP Gateway 独创 |
| **演示效果** | 高 | ✅ 30+页面，完整 WOW moment |
| **主网部署** | 中 | ✅ 4个合约已部署主网 |
| **社区投票** | 低-中 | ⚠️ 赞数未知，需要推广 |

### 7.3 SealMind 独有优势（无竞品覆盖）

1. **🧬 Living Soul**：经验驱动的动态灵魂，哈希链上链，无竞品有
2. **🧠 Hive Mind**：去中心化集体智慧，匿名经验永久存储，无竞品有
3. **🎫 Agent Passport**：标准化链上认证，Agent 准入门槛，无竞品有
4. **🔌 MCP Gateway**：标准协议 Agent 自发现和接入，无竞品有
5. **🤖 Multi-Agent 协作**：编排/委托/握手/会话管理，完整度最高
6. **🎨 AI Media (Skills #5/#6)**：文生图(Flux) + 语音转文字(Whisper)，无竞品有
7. **💰 0G Compute Account (Skill #8)**：完整的计算账户生命周期管理
8. **📊 94个单元测试**：公开的最高测试覆盖率

---

## 八、威胁评估总结

| 威胁等级 | 项目 | 原因 |
|:---------|:-----|:-----|
| 🔴 **高** | MindVault | 功能高度重叠（记忆+身份+TEE+市场），赞数高，语义检索是亮点 |
| 🟡 **中** | VeraSignal | 测试覆盖最好(70项)，TEE证明链完整，但赛道不同 |
| 🟡 **中** | Coal | 0G集成最全(5组件)，有真实用户，但赞数低 |
| 🟢 **低** | AgentPay | 功能定位不同（支付协议），互补关系大于竞争 |
| 🟢 **低** | TrustFolio | 偏人类声誉验证，与 Agent OS 定位差异大 |
| ⚪ **无** | 其余6个 | 技术深度不足或赛道完全不同 |

---

*报告完毕 — 下一步：参见 [SealMind_Competitive_Strategy.md](./SealMind_Competitive_Strategy.md) 获取差异化策略建议*
