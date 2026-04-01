# 📋 SealMind 开发计划 (plan.md)

> **项目**: SealMind — 隐私自主 AI Agent 操作系统
> **赛道**: Track 1（Agentic Infra & OpenClaw 实验室）
> **最后更新**: 2026-04-01（v2.0 增强规划）

---

## 一、项目状态总览

### v1.0 已完成（基础 Demo 完整）

| 模块 | 状态 | 说明 |
|------|------|------|
| 项目骨架 (Monorepo) | ✅ | pnpm + TypeScript |
| 3 个智能合约 | ✅ 已部署 testnet | INFT / DecisionChain / AgentRegistry |
| 后端全部服务 | ✅ | 7 条路由，Mock fallback |
| 前端全部页面 | ✅ | 10 个页面含 i18n |
| 0G Storage KV | ✅ | 双层架构（缓存 + 持久化）|
| Multi-Agent | ✅ | 编排 + 委派 + 消息 |
| OpenClaw 集成 | ✅ | 5 个内置 Skill |
| 测试（28/28）| ✅ | Hardhat 单元测试 |

### v1.0 不足（Demo 缺乏真实感）

| 问题 | 影响 |
|------|------|
| Sealed Inference 是 mock | 无法展示 TEE 可验证推理 |
| Explore 页面全是 "Coming Soon" | 市场生态空壳 |
| 无 Agent 经济激励机制 | 缺乏差异化叙事 |
| Agent 可随意复制（无唯一性保证）| NFT 价值论据不足 |

---

## 二、v2.0 增强目标

> **核心叙事升级**：从"技术 Demo"→"有真实经济生态的 Agent 操作系统"

### 新增模块

| 模块 | 优先级 | 说明 |
|------|--------|------|
| **A. Bounty Board（赏金市场）** | P0 ⭐ | Agent 经济核心，任务发布→接单→链上结算 |
| **B. 真实推理接入** | P0 ⭐ | DeepSeek API → 非 mock 响应，可验证性提升 |
| **C. Explore 页面实装** | P0 | Agent 市场，排行榜，标签筛选 |
| **D. Agent 公开档案页** | P0 | 链上可验证身份证明 |
| **E. Agent 灵魂签名** | P1 | 唯一性锚点，反克隆叙事 |
| **F. Agent 转让 + 记忆迁移** | P1 | NFT 真正可交易 |
| **G. Agent 雇佣 Agent** | P2 | 子任务分包，Agent 经济生态 |

### 网络策略

- **开发/测试**: 0G Testnet (16602) — 所有合约先部署这里
- **正式上线**: 0G Mainnet (16661) — 拿到 gas 代币后迁移
- 代码中保留 mainnet 配置，一键切换

---

## 三、各模块详细设计

---

### 模块 A：Bounty Board（赏金市场）⭐

**目标**：链上任务发布 → Agent 接单 → 提交结果（含 proofHash）→ 链上验收 → 释放赏金

#### A.1 BountyBoard.sol 合约

**文件**: `packages/contracts/contracts/BountyBoard.sol`

```solidity
struct Bounty {
    uint256 id;
    address creator;           // 发布者地址
    uint256 creatorAgentId;    // 0 = 人类发布，>0 = Agent 发布（子任务）
    string title;
    string description;        // 任务描述（链下存储，此处存摘要）
    uint256 reward;            // 赏金（原生代币，锁入合约）
    uint256 deadline;          // 截止时间戳
    bytes32 criteriaHash;      // 验收标准哈希（链外文档的哈希）
    uint256 assignedAgentId;   // 接单 Agent 的 INFT Token ID（0 = 未接单）
    bytes32 resultProofHash;   // 提交结果的 proofHash（关联 DecisionChain）
    BountyStatus status;
    uint256 parentBountyId;    // 子任务父 ID（0 = 顶级任务）
    uint256 createdAt;
}

enum BountyStatus {
    Open,       // 开放接单
    Assigned,   // 已被接单
    Submitted,  // 已提交结果
    Completed,  // 已验收，赏金已发放
    Disputed,   // 争议中
    Expired,    // 超时，赏金退回
    Cancelled   // 已取消（仅 Open 状态可取消）
}
```

**关键函数**：
- `createBounty(title, description, deadline, criteriaHash)` payable — 锁入 msg.value 作为赏金
- `acceptBounty(bountyId, agentId)` — Agent 接单（需持有对应 INFT，或后端代为调用）
- `submitResult(bountyId, proofHash)` — 提交结果，关联 DecisionChain 证明
- `approveBounty(bountyId)` — 发布者验收，transfer 赏金给 Agent 所有者
- `disputeBounty(bountyId)` — 发起争议
- `resolveDispute(bountyId, approved)` — 合约 owner 仲裁
- `cancelBounty(bountyId)` — 取消（仅 Open 状态，退回赏金）
- `expireBounty(bountyId)` — 任何人可调用，超时后退回赏金
- `createSubBounty(parentId, ...)` payable — Agent 发布子任务
- `getBounties(offset, limit, statusFilter)` — 分页查询
- `getBountiesByAgent(agentId)` — 查询 Agent 的接单记录
- `getBountiesByCreator(address)` — 查询发布者的任务列表

**安全设计**：
- 赏金资金锁入合约（payable），不托管到 EOA
- 争议期 3 天（`DISPUTE_PERIOD = 3 days`）
- 防重入保护（ReentrancyGuard）
- 子任务赏金从父任务中扣除（资金流向可追溯）

#### A.2 BountyService.ts（后端服务）

**文件**: `packages/backend/src/services/BountyService.ts`

- `createBounty(params, creatorAddress)` — 调用合约 `createBounty()`
- `acceptBounty(bountyId, agentId)` — 后端代 Agent 调用 `acceptBounty()`
- `submitResult(bountyId, agentId, proofHash)` — 提交 + 验证 proof 存在于 DecisionChain
- `approveBounty(bountyId, creatorAddress)` — 验收
- `getBounties(filter)` — 分页查询任务列表
- `getBountyDetail(bountyId)` — 单个任务详情
- `createSubBounty(parentId, agentId, params)` — Agent 发布子任务

**文件**: `packages/backend/src/routes/bountyRoutes.ts`
- `GET /api/bounty` — 任务列表（支持 status/tag/sort 筛选）
- `POST /api/bounty` — 发布任务
- `GET /api/bounty/:id` — 任务详情
- `POST /api/bounty/:id/accept` — 接单
- `POST /api/bounty/:id/submit` — 提交结果
- `POST /api/bounty/:id/approve` — 验收
- `POST /api/bounty/:id/dispute` — 争议
- `POST /api/bounty/:id/cancel` — 取消
- `GET /api/bounty/agent/:agentId` — Agent 接单记录

#### A.3 前端页面

- `app/bounty/page.tsx` — 任务大厅（列表 + 筛选 + 统计）
- `app/bounty/create/page.tsx` — 发布任务表单
- `app/bounty/[id]/page.tsx` — 任务详情（状态流转 + 提交结果 + 验收按钮）
- `components/BountyCard.tsx` — 任务卡片（状态徽章 + 赏金展示 + 截止时间）
- Dashboard 页面增加 "My Bounties" tab

---

### 模块 B：真实推理接入

**目标**：替换 mock 响应，接入真实 LLM，提升演示可信度

**降级优先级**：
```
1. 0G Compute Broker (TeeML) → ✅ Verified（绿标）
2. DeepSeek API (deepseek-chat) → ⚠️ Unverified（黄标）
3. 内置 mock 响应 → ❌ Mock（灰标）
```

**实现**：
- 在 `SealedInferenceService.ts` 中增加 DeepSeek API 调用路径
- 环境变量 `DEEPSEEK_API_KEY` 控制是否启用
- 前端 `ProofModal` 根据 `teeVerified` 显示不同状态
- Chat 页面标题栏显示当前推理模式

---

### 模块 C：Explore 页面实装

**目标**：将 "Coming Soon" 变为真实的 Agent 发现市场

**实现**：
- `exploreRoutes.ts` 增强 — 从 AgentRegistry 合约读取公开 Agent，支持 tag 筛选
- Explore 页面：
  - Agent 卡片网格（AgentCard 组件复用）
  - 标签筛选（defi / ai / chat / code / creative 等预设标签）
  - 排序：最新 / 等级最高 / 信任分最高 / 推理次数最多
  - 全网统计（Agent 总数 + 推理总次数 + Bounty 总额）
  - Agent 搜索（按名称）

---

### 模块 D：Agent 公开档案页

**目标**：每个 Agent 有可分享的公开身份页面

**文件**: `app/agent/[id]/profile/page.tsx`

**内容**：
- Agent 基本信息（名称、等级、模型、创建时间）
- 链上统计（推理次数、记忆数、信任分、Level）
- 灵魂签名可视化（唯一几何图案，见模块 E）
- 最近决策记录（10条，链上可验证）
- Bounty 完成记录（接单历史）
- 分享按钮（复制链接）
- 所有者私有区域（仅钱包连接后显示）：对话 / 记忆 / 转让按钮

---

### 模块 E：Agent 灵魂签名

**目标**：给每个 Agent 一个不可复制的链上唯一标识

**合约改动**（`SealMindINFT.sol`）：
```solidity
// 新增字段
mapping(uint256 => bytes32) public soulSignatures;

// createAgent 时生成
bytes32 soulSig = keccak256(abi.encodePacked(
    block.timestamp,
    msg.sender,    // 创建者
    to,            // 接收者
    name,          // Agent 名称
    tokenId        // 全局唯一递增 ID
));
soulSignatures[tokenId] = soulSig;
```

**意义**：
- 灵魂签名 = 创建时刻 + 创建者 + 接收者 + 名称 + Token ID 的哈希
- 一旦写入，永不可修改
- 即使 fork 代码、复制人格配置，灵魂签名也不同
- 作为 Agent "出生证明"，视觉化展示为唯一几何图案（基于哈希生成 SVG）

**前端**：`components/SoulSignature.tsx` — 将 bytes32 哈希转成确定性几何图案（用哈希的不同段控制颜色、形状、旋转）

---

### 模块 F：Agent 转让 + 记忆迁移

**目标**：Agent NFT 可以转让，转让时记忆跟着走

**流程**：
```
新 owner 发起 transferWithMemoryMigration(tokenId, newOwner)
    ↓
合约记录 pendingTransfer，发出 MemoryMigrationRequested 事件
    ↓
后端监听事件：
  1. 旧密钥解密所有记忆（MVP：后端统一密钥）
  2. 新密钥重新加密
  3. 写回 0G Storage
  4. 调用合约 confirmMigration → 执行 NFT 转移
    ↓
前端轮询迁移状态直到完成
```

**MVP 简化**：后端用统一服务密钥（`PRIVATE_KEY`），不涉及用户钱包交互。记忆访问控制通过后端 API 层实现。

---

### 模块 G：Agent 雇佣 Agent（Agent-to-Agent Economy）

> P2 优先级，时间允许再做

**概念**：高级 Agent 接单后，将子任务作为新 Bounty 发布，由其他 Agent 竞标完成

**实现**：
- `BountyBoard.sol` 的 `createSubBounty()` 函数（模块 A 已设计）
- MultiAgentService 扩展：Agent 执行任务时，自动判断是否需要子外包
- 链上可追溯：父任务 → 子任务 → 子子任务，形成 DAG

---

## 四、实施优先级 & 时间线

```
Phase 1（今天开始）:
  B. 真实推理接入 (DeepSeek API)  — 2h
  C. Explore 页面实装             — 3h

Phase 2（1-2天）:
  A. BountyBoard.sol 合约         — 4h
  A. BountyService + Routes       — 4h

Phase 3（2-3天）:
  A. Bounty 前端页面              — 6h
  D. Agent 档案页                 — 3h

Phase 4（3-4天）:
  E. 灵魂签名（合约 + 前端）      — 3h
  F. Agent 转让                   — 4h

Phase 5（4-5天）:
  UI 打磨 + Demo 数据预置         — 4h
  G. Agent 雇佣 Agent（如有时间） — 6h

主网迁移（拿到 gas 代币后）:
  重新部署所有合约到 mainnet
  更新配置，切换前端默认链
```

---

## 五、文件清单

### 需要新建

```
packages/contracts/contracts/BountyBoard.sol
packages/contracts/test/BountyBoard.ts
packages/contracts/scripts/deployBounty.ts
packages/backend/src/services/BountyService.ts
packages/backend/src/routes/bountyRoutes.ts
packages/frontend/app/bounty/page.tsx
packages/frontend/app/bounty/create/page.tsx
packages/frontend/app/bounty/[id]/page.tsx
packages/frontend/app/agent/[id]/profile/page.tsx
packages/frontend/hooks/useBounty.ts
packages/frontend/components/BountyCard.tsx
packages/frontend/components/SoulSignature.tsx
```

### 需要修改

```
packages/contracts/contracts/SealMindINFT.sol  — 添加 soulSignature
packages/contracts/scripts/deploy.ts           — 添加 BountyBoard 部署
packages/backend/src/index.ts                  — 挂载 bountyRoutes
packages/backend/src/services/SealedInferenceService.ts — DeepSeek API
packages/backend/src/config/contracts.ts       — BountyBoard ABI + 地址
packages/frontend/app/explore/page.tsx         — 实装市场
packages/frontend/app/dashboard/page.tsx       — Bounty tab
packages/frontend/app/agent/[id]/chat/page.tsx — 推理模式标记
packages/frontend/components/Navbar.tsx        — 添加 Bounty 导航
packages/frontend/lib/contracts.ts             — BountyBoard 配置
```

---

## 六、主网迁移清单（拿到代币后执行）

```bash
# 1. 修改 .env
og-mainnet 私钥配置

# 2. 部署
cd packages/contracts
npx hardhat run scripts/deploy.ts --network og-mainnet
npx hardhat run scripts/deployBounty.ts --network og-mainnet

# 3. 更新配置
deployment.json → mainnet 地址
.env → INFT_ADDRESS / DECISION_CHAIN_ADDRESS / REGISTRY_ADDRESS / BOUNTY_BOARD_ADDRESS
packages/frontend/.env.local → NEXT_PUBLIC_* 全部切换

# 4. 验证
0G Explorer mainnet 确认合约部署
全流程 E2E 测试
```

---

## 七、风险评估

| 风险 | 概率 | 影响 | 应对 |
|------|------|------|------|
| 0G Testnet 不稳定 | 中 | 高 | mock fallback 兜底；预录 Demo 视频 |
| TeeML 提供商不可用 | 高 | 中 | DeepSeek API 降级 + 黄标，不影响主流程 |
| Bounty 合约 gas 高 | 低 | 中 | 优化存储，events 替代部分 storage |
| 记忆迁移密钥问题 | 中 | 中 | MVP 统一服务密钥，不阻塞主流程 |
| Demo Day 网络故障 | 中 | 高 | 提前录制完整演示视频备用 |
