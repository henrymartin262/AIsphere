# AIsphere 产品愿景与用户旅程设计

> 文档版本：v1.0
> 创建日期：2026-04-15
> 背景：基于 0G Network（存储 / 计算 / 链）的隐私主权 AI Agent 操作系统

---

## 一、核心定位

AIsphere 不是一个简单的 AI 聊天平台，而是 **AI Agent 的链上市民身份系统**。它解决两个核心问题：

1. **原生用户**：想要拥有一个属于自己的、运行在可验证基础设施上的 AI Agent，但不知道怎么创建和上链；
2. **迁移用户**：已经在其他平台（如 OpenClaw）拥有成熟 Agent，想要将其能力延伸到链上，获得可验证性、持久存储和 Soul 身份，而不必放弃原有工具。

---

## 二、用户分类与完整旅程

### 2.1 用户类型 A：从零创建的原生用户

**目标**：用户想在 AIsphere 上创建并使用一个全新的 AI Agent。

#### 阶段 1：准备接入

| 步骤 | 行为 | 系统处理 |
|------|------|---------|
| 1 | 连接钱包（MetaMask / WalletConnect） | 检测钱包连接的网络（0G 测试网 / 主网），自动切换到正确 Chain ID |
| 2 | 0G Compute 初始化 | 检查该钱包是否已有 0G Compute Broker 账户及余额 |
| 3a | **未质押** → 引导质押流程 | 展示推荐质押量，调起钱包签名确认，完成 `depositFund` + `transferFund` |
| 3b | **已质押** → 跳过质押 | 直接进入下一步，展示当前余额和可用模型 |
| 4 | 选择 LLM 模型 | 从 0G Compute Broker 实时拉取可用模型列表（含 TEE 认证标识） |

> **关键原则**：Storage 和 LLM 的使用费用通过用户自己钱包的 Gas 支付，AIsphere 平台不代持资产。

#### 阶段 2：创建 Agent

| 步骤 | 行为 | 系统处理 |
|------|------|---------|
| 5 | 填写 Agent 信息（名称、描述、性格、专长） | 前端表单收集，校验必填项 |
| 6 | 确认创建 | 调起钱包，签名确认 INFT（ERC-721）铸造交易 |
| 7 | 上链完成 | SealMindINFT 合约铸造，链上记录 AgentProfile；DecisionChain 初始化审计日志 |
| 8 | Soul 初始化 | 生成 Living Soul 初始状态，写入 0G Storage（用户钱包加密，仅本人可读） |

#### 阶段 3：日常使用

- 每次对话推理 → 使用 0G Compute（消耗钱包中的质押余额）
- 重要记忆自动加密后写入 0G Storage（按 importance 阈值）
- 关键决策生成链上证明，写入 DecisionChain
- Agent 等级随推理次数和信任分提升

---

### 2.2 用户类型 B：已有 Agent 的迁移用户（以 OpenClaw 为例）

**目标**：用户已在外部平台（如 OpenClaw）有一个成熟 Agent，希望将其上链，获得：
- 可验证的推理证明（TEE）
- 持久化的配置与记忆（0G Storage 云盘）
- 链上身份（Soul / INFT）
- 无需放弃原有工具

#### 设计理念：Skills 双层结构

Agent 上链能力被拆分为两种 Skill，由 AIsphere 提供给外部 Agent 调用：

```
Skills
├── 上链注册 Skill（一次性）    ← 首次上链时执行
│   ├── 钱包绑定与网络配置
│   ├── 0G Compute 质押初始化
│   ├── INFT 铸造（链上身份）
│   ├── Soul 生成（Living Soul 初始化）
│   └── 0G Storage 配置（可选：推理记录同步开关）
│
└── 链上活动 Skill（每次推理调用）    ← 后续每次推理时执行
    ├── 推理结果哈希上链（DecisionChain）
    ├── 记忆同步到 0G Storage（加密）
    └── Soul 经验值更新
```

#### 上链注册流程（首次）

1. 用户在 OpenClaw 中安装 AIsphere 上链注册 Skill
2. 运行 Skill，引导用户完成：
   - 绑定 EVM 钱包地址
   - 选择网络（测试网 / 主网）
   - 完成 0G Compute 质押（若未质押）
   - 开关：是否将历史推理记录打包同步到 0G Storage
   - 铸造 INFT，生成 Soul
3. 注册成功后，OpenClaw Agent 获得链上身份，可在 AIsphere 平台查看其 Soul 状态和活动记录

#### 链上活动流程（日常）

- 每次 OpenClaw Agent 完成推理 → 自动调用链上活动 Skill
- Skill 将推理摘要和证明哈希异步写入 DecisionChain（非阻塞）
- 可选：将对话记录加密后同步到 0G Storage

#### 重要约束：不可售卖

迁移用户的链上 Agent（INFT）与特定外部 Agent 实例绑定，**不支持在 AIsphere 内置市场中售卖**。原因：

- 外部 Agent 的「智能」来自其原平台，链上部分仅记录活动证明，不包含完整能力
- 售卖会造成买方无法实际使用 Agent 的误导性问题
- 可在 Agent 详情页明确标注「外部迁移 Agent · 不可转让」

---

## 三、0G Storage 作为 Agent 配置云盘

### 3.1 核心类比：Agent 的 GitHub

0G Storage 对用户的感知应该类似于 **GitHub 仓库**（或加密版 iCloud）：

| 功能 | 类比 | AIsphere 实现 |
|------|------|--------------|
| 配置备份 | `git push` | Agent 配置变更 → 加密写入 0G Storage |
| 跨设备同步 | `git clone` / `git pull` | 新设备登录 → 从 0G Storage 拉取并解密恢复 |
| 历史版本 | `git log` | 每次 Soul 更新保留快照 |
| 私有仓库 | Private repo | 用户钱包私钥派生加密密钥，平台无法读取 |

### 3.2 存储内容设计

```
0G Storage Stream（per Agent）
├── soul/              # Soul 状态快照
│   ├── current.json   # 当前 Soul 状态
│   └── history/       # 历史快照
├── memory/            # 加密记忆库
│   ├── conversations/ # 对话记录
│   ├── knowledge/     # 知识条目
│   └── personality/   # 性格/偏好
└── config/            # Agent 配置
    ├── profile.json   # 基础信息
    └── skills/        # 已安装的 Skill 配置
```

### 3.3 用户价值主张

> "你的 Agent 不再绑定在某台服务器上。它的记忆、配置、成长历程——全部属于你，加密存储在 0G 去中心化网络，随时可以取回、同步、迁移。"

- ✅ **解放本地存储**：不再需要在本地保存 Agent 配置文件
- ✅ **防止平台锁定**：即使 AIsphere 下线，用户数据仍在 0G Storage 上
- ✅ **跨平台连续性**：同一个 Agent 可以在 AIsphere、OpenClaw 等多平台保持记忆连续

---

## 四、关键技术可行性问题待验证

| 问题 | 描述 | 优先级 |
|------|------|--------|
| 0G Storage 版本化支持 | 能否像 Git 一样存储多版本快照？是否支持追加写入？ | 高 |
| Compute 质押状态检测 | 如何检测用户是否已有有效质押，避免重复引导 | 高 |
| 跨平台 Skill 调用标准 | OpenClaw / 其他平台调用 AIsphere Skill 的接口规范 | 中 |
| 外部 Agent 绑定机制 | 如何防止一个链上 INFT 被多个外部 Agent 实例绑定 | 中 |
| Gas 费用估算展示 | 在用户确认前，清晰展示本次操作的预估 Gas 费用 | 中 |

---

## 五、里程碑规划建议

```
Phase 1（当前）：原生用户流程打通
  ✅ 钱包连接
  ✅ Agent 创建 + INFT 铸造
  ✅ 0G Compute 推理
  ✅ Memory Vault（基础加密存储）
  🔲 质押状态检测 + 引导流程优化

Phase 2：迁移用户支持
  🔲 上链注册 Skill 规范与实现
  🔲 链上活动 Skill（轻量级，适合外部调用）
  🔲 OpenClaw 集成示例
  🔲 外部 Agent 绑定机制

Phase 3：0G Storage 云盘体验
  🔲 配置版本化存储
  🔲 跨设备同步 UI
  🔲 存储使用量展示
  🔲 数据导出 / 迁移工具
```

---

*本文档为产品需求原始版本，后续拆解为具体 PRD 和技术设计文档。*
