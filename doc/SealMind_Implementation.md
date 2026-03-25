# 🧠 SealMind — 隐私自主 AI Agent 操作系统

## 技术实现方案 v2.0

> **一句话描述**：AI Agent 的可验证"灵魂容器"——让 Agent 拥有隐私保护的记忆、可验证的推理、自主的经济身份
>
> **参赛赛道**：Track 1（Agentic Infra & OpenClaw 实验室）
>
> **0G 集成组件**：Storage + Compute (Sealed Inference) + Chain + INFT (Agent ID) — 共 4 大核心组件

---

## 目录

- [一、项目愿景与背景](#一项目愿景与背景)
- [二、系统架构总览](#二系统架构总览)
- [三、核心模块详细设计](#三核心模块详细设计)
- [四、智能合约设计](#四智能合约设计)
- [五、后端服务设计](#五后端服务设计)
- [六、前端 UI 设计](#六前端-ui-设计)
- [七、技术栈与依赖](#七技术栈与依赖)
- [八、项目结构](#八项目结构)
- [九、0G 集成详解](#九0g-集成详解)
- [十、Demo 场景设计](#十demo-场景设计)
- [十一、安全设计](#十一安全设计)
- [十二、开发计划与里程碑](#十二开发计划与里程碑)
- [十三、部署方案](#十三部署方案)

---

## 一、项目愿景与背景

### 1.1 问题：AI Agent 的"灵魂"缺失

| 问题 | 现状 | 后果 |
|------|------|------|
| **记忆不可控** | Agent 记忆存储在中心化服务器 | 平台方可随时读取、篡改或删除 |
| **推理不可验证** | 用户无法确认 AI 的回答来自哪个模型 | 无法建立信任，容易被"偷换模型" |
| **身份不可拥有** | Agent 身份依附于平台 | 用户无法拥有、转让或交易自己的 Agent |

### 1.2 解决方案

SealMind 为每个 AI Agent 提供四大能力：

- 🔒 **Sealed Mind**：TEE 硬件密室中推理，每次生成密码学签名证明
- 🧠 **Memory Vault**：客户端加密的去中心化记忆库，只有所有者可解密
- 🪪 **Agent Identity**：基于 ERC-7857 标准的链上身份（INFT）
- ⛓️ **Decision Chain**：不可篡改的链上决策审计日志

### 1.3 核心叙事

> "如果 AI Agent 是 Web 4.0 的'数字公民'，那它需要一个不可篡改的灵魂——隐私记忆 + 可验证推理 + 链上身份。SealMind 用 0G 的全栈能力构建了这个灵魂容器。"

### 1.4 为什么选择 0G？

| 0G 组件 | 在 SealMind 中的角色 | 不可替代性 |
|---------|---------------------|-----------|
| **0G Compute (Sealed Inference)** | TEE 推理 + 密码学签名 | 唯一支持 TeeML 可验证推理的去中心化 GPU 市场 |
| **0G Storage** | 加密记忆存储 | PB 级去中心化存储 + KV Store + Merkle 验证 |
| **0G Chain** | 合约部署 + 决策上链 | 11,000 TPS EVM L1，亚秒级终局 |
| **INFT (ERC-7857)** | Agent 身份代币化 | 0G 原生标准，支持加密元数据安全转移 |

---

## 二、系统架构总览

### 2.1 高层架构

```
┌─────────────────────────────────────────────────────────────┐
│                        SealMind                              │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    Frontend (Next.js)                     │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │ │
│  │  │ Agent    │ │ Memory   │ │ Decision │ │   Agent    │ │ │
│  │  │ Creation │ │ Explorer │ │ Audit    │ │ Marketplace│ │ │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬──────┘ │ │
│  └───────┼────────────┼────────────┼─────────────┼────────┘ │
│          │            │            │             │           │
│  ┌───────▼────────────▼────────────▼─────────────▼────────┐ │
│  │                Backend API (Node.js/Express)            │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌───────────────────┐ │ │
│  │  │ Agent       │ │ Memory      │ │ Inference         │ │ │
│  │  │ Service     │ │ Service     │ │ Service           │ │ │
│  │  └──────┬──────┘ └──────┬──────┘ └────────┬──────────┘ │ │
│  └─────────┼───────────────┼─────────────────┼────────────┘ │
│            │               │                 │              │
│  ┌─────────▼───┐  ┌───────▼──────┐  ┌───────▼───────────┐  │
│  │  0G Chain   │  │  0G Storage  │  │  0G Compute       │  │
│  │ · INFT 合约 │  │ · 加密记忆   │  │  (Sealed Inference)│  │
│  │ · 决策链合约│  │ · KV Store   │  │  · TEE 推理       │  │
│  │ · 注册表   │  │ · Merkle 证明│  │  · TeeML 验证     │  │
│  └─────────────┘  └──────────────┘  └───────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 核心数据流

```
用户创建 Agent
     │
     ▼
① 铸造 INFT (0G Chain) ← Agent 获得链上身份 + Token ID
     ▼
② 初始化记忆库 (0G Storage) ← 创建加密 KV Stream
     ▼
③ 用户与 Agent 对话
     ▼
④ Sealed Inference (0G Compute TEE) ← 加载记忆 → TEE 推理 → 签名证明
     ▼
⑤ 返回结果 + 证明
     │
     ├──→ 更新记忆 (0G Storage): 客户端加密新记忆 → 写入 KV Store
     └──→ 上链证明 (0G Chain): 推理哈希 + 模型签名 → Decision Chain 合约
```

### 2.3 模块交互关系矩阵

```
                  Sealed Mind    Memory Vault    Agent Identity    Decision Chain
                  ─────────────  ──────────────  ────────────────  ──────────────
Sealed Mind       ──             读取记忆作为     更新推理次数        写入推理证明
                                 推理上下文       触发等级检查

Memory Vault      推理结果写回   ──               关联 Token ID      ──
                  为新记忆                        作为存储索引

Agent Identity    ──             提供密钥派生     ──                 授权记录权限
                                 的 agentId

Decision Chain    ──             ──               更新链上统计       ──
```

---

## 三、核心模块详细设计

### 3.1 Sealed Mind — 隐私推理引擎

#### 3.1.1 技术原理

```
┌──────────────────────────────────────────┐
│         TEE (Intel TDX + NVIDIA H100)     │
│                                           │
│  输入: [加密 prompt + 加密记忆上下文]      │
│         │                                 │
│         ▼                                 │
│  ┌─────────────────┐                      │
│  │  AI 模型推理     │  DeepSeek V3.1      │
│  │  (隔离执行)      │  / Qwen 2.5         │
│  └────────┬────────┘                      │
│           │                               │
│           ▼                               │
│  ┌─────────────────┐                      │
│  │  TeeML 签名     │                      │
│  │  · 模型哈希      │                      │
│  │  · 输入哈希      │                      │
│  │  · 输出哈希      │                      │
│  │  · 时间戳        │                      │
│  │  · TEE 远程证明  │                      │
│  └────────┬────────┘                      │
│           │                               │
│  输出: [推理结果 + 签名证明]               │
└───────────┼───────────────────────────────┘
            ▼
    任何人可验证: "这个回答确实来自 DeepSeek V3.1，
     输入数据未泄露，结果未被篡改"
```

#### 3.1.2 推理服务完整流程

推理引擎 `SealedInferenceService` 是系统核心，负责与 0G Compute 的 TEE 提供商交互，执行可验证推理。

**初始化阶段：**

1. 通过 `ethers.js` 创建 JSON-RPC Provider 连接 0G 链
2. 使用项目私钥创建 Wallet Signer
3. 调用 `@0glabs/0g-serving-broker` 的 `createBroker()` 创建计算代理
4. 调用 `broker.initialize()` 完成初始化，注册到 0G Compute 网络

**推理执行流程（6 步）：**

| 步骤 | 操作 | 技术细节 |
|------|------|----------|
| **Step 1** | 构建系统提示词 | 将 Agent 人格设定 + 记忆上下文拼接为 system prompt，格式：`[Personality]\n...\n[Knowledge]\n...\n[Recent]\n...` |
| **Step 2** | 发现 TeeML 提供商 | 调用 `broker.listServices()` 获取可用服务列表，筛选条件：`model === 'deepseek-v3.1'` 且 `verifiability === 'TeeML'` |
| **Step 3** | 确认提供商 + 充值 | 调用 `broker.acknowledgeProviderIfNeeded(address)` 确认提供商；调用 `broker.ensureFundsForProvider(address, 1.0)` 确保有足够资金 |
| **Step 4** | 生成认证头 + 发送请求 | 调用 `broker.getRequestHeaders(address, prompt)` 生成认证头；以 **OpenAI 兼容格式** 发送 POST 请求到提供商 URL |
| **Step 5** | 处理响应 + 提取签名 | 调用 `broker.processResponse(address, data, chatId)` 处理响应，提取 TEE 签名和远程证明 |
| **Step 6** | 构建推理证明 | 使用 `keccak256` 分别哈希模型名、输入、输出，连同签名和时间戳组成完整证明 |

**请求格式（OpenAI 兼容）：**

```
POST {provider_url}
Headers: Content-Type: application/json + broker 生成的认证头
Body: {
  model: "deepseek-v3.1",
  messages: [
    { role: "system", content: "<系统提示词+记忆上下文>" },
    { role: "user", content: "<用户输入>" }
  ],
  temperature: 0.7,
  max_tokens: 2048
}
```

**推理证明数据结构：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `modelHash` | bytes32 | `keccak256("deepseek-v3.1")` — 模型标识哈希 |
| `inputHash` | bytes32 | `keccak256(用户输入)` — 输入哈希（不暴露原文） |
| `outputHash` | bytes32 | `keccak256(推理结果)` — 输出哈希 |
| `signature` | string | TEE 硬件签名，由 `processResponse` 返回 |
| `timestamp` | uint64 | 推理发生时的 Unix 时间戳 |
| `teeAttestation` | string | TEE 远程证明，可链下独立验证 |

#### 3.1.3 降级策略

| 场景 | 降级方案 |
|------|----------|
| DeepSeek V3.1 不可用 | 自动切换到 Qwen 2.5 VL 72B |
| 所有 TeeML 提供商离线 | 切换到普通推理模式，标记为 `verifiability: "None"`，UI 显示 ⚠️ 黄色未验证标记 |
| 推理超时（>30s） | 返回超时错误 + 自动重试 1 次 |

---

### 3.2 Memory Vault — 加密记忆库

#### 3.2.1 记忆数据模型

每条记忆包含以下字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string (UUID) | 记忆唯一标识 |
| `agentId` | number | 对应 INFT Token ID |
| `type` | enum | 五种类型：`conversation`（对话）/ `knowledge`（知识）/ `personality`（人格）/ `skill`（技能）/ `decision`（决策） |
| `content` | string | 明文内容（加密前） |
| `importance` | number | 重要性评分 0-1，用于排序和筛选 |
| `timestamp` | number | 创建时间戳 |
| `tags` | string[] | 标签数组，用于分类检索 |

#### 3.2.2 加密方案

```
Agent 所有者钱包
     │
     ▼
  1. 签名确定性消息: "SealMind:MemoryVault:AgentKey:{agentId}"
     │
     ▼
  2. SHA-256 哈希签名结果 → 得到 256-bit Agent 专用密钥
     │
     ▼
  3. 每条记忆独立加密:
     ├── 随机生成 16 字节 IV (Initialization Vector)
     ├── AES-256-GCM 加密 (密钥 + IV + 明文 → 密文 + AuthTag)
     └── 存储格式: { encryptedData, iv, dataHash, timestamp }
     │
     ▼
  4. 写入 0G Storage KV Store
     ├── Stream ID = keccak256(encode("SealMind:MemoryVault", agentId))
     └── Key = "memory:{uuid}"
```

**密钥派生的安全特性：**

- 使用钱包私钥签名确定性消息，只有持有钱包私钥的人才能派生出相同的密钥
- `agentId` 作为 salt，确保同一钱包下不同 Agent 有不同的加密密钥
- AES-256-GCM 提供认证加密，保证机密性 + 完整性 + 真实性

#### 3.2.3 存储实现细节

**写入流程：**

1. 将记忆对象 JSON 序列化为明文
2. 生成随机 IV → AES-256-GCM 加密 → 得到密文 + AuthTag
3. 计算明文的 keccak256 哈希（用于完整性验证）
4. 通过 0G Storage SDK 的 `Indexer` 选择存储节点
5. 使用 `Batcher` 将加密数据写入 KV Store
6. 同时更新记忆索引（`key = "index:memories"`），将新记忆的 id + timestamp + type 追加到索引

**读取流程：**

1. 从索引获取记忆条目列表
2. 通过 `KvClient.getValue()` 按 key 读取每条加密记忆
3. 解析 JSON，提取 encryptedData 和 iv
4. 拆分 encryptedData 为密文和 AuthTag
5. AES-256-GCM 解密 → 得到明文 → 反序列化为记忆对象

**上下文构建策略（为推理服务准备）：**

```
加载最近 50 条记忆
     │
     ├── 筛选 type = "personality" → 拼接为 [Personality] 块 (全部)
     │
     ├── 筛选 type = "knowledge"  → 取最新 5 条 → 拼接为 [Knowledge] 块
     │
     └── 筛选 type = "conversation" → 取最新 10 条 → 拼接为 [Recent] 块
     │
     ▼
  返回 string[] 数组，传入推理引擎的系统提示词
```

#### 3.2.4 记忆管理机制

| 机制 | 说明 |
|------|------|
| **容量限制** | 每个 Agent 最多存储 10,000 条记忆 |
| **自动清理** | 当超过容量时，删除 `importance < 0.3` 且 `age > 30 天` 的记忆 |
| **重要性评估** | 对话记忆默认 importance = 0.5；知识和人格记忆默认 importance = 0.8；用户可手动调整 |
| **记忆去重** | 写入前计算内容哈希，若已存在相同哈希则跳过 |

---

### 3.3 Agent Identity — 链上身份系统 (INFT)

#### 3.3.1 Agent 属性模型

**静态属性（铸造时设定，不可变）：**

| 属性 | 类型 | 说明 |
|------|------|------|
| `name` | string | Agent 名称 |
| `description` | string | Agent 描述 |
| `model` | string | 默认 AI 模型（如 "deepseek-v3.1"） |
| `personality` | string | 人格设定 |
| `creator` | address | 创建者钱包地址 |

**动态属性（链上自动更新）：**

| 属性 | 类型 | 说明 | 更新时机 |
|------|------|------|----------|
| `totalInferences` | uint64 | 累计推理次数 | 每次推理后 |
| `totalMemories` | uint64 | 记忆总数 | 每次写入记忆后 |
| `trustScore` | uint16 | 信任评分 (0-10000，精度 0.01) | 根据验证通过率计算 |
| `level` | uint8 | 等级 (1-5) | 推理次数达到阈值时 |
| `lastActiveAt` | uint64 | 最后活跃时间 | 每次推理后 |
| `createdAt` | uint64 | 创建时间 | 铸造时 |

#### 3.3.2 等级演化机制

```
Level 1 (Newborn)  ─── 0 次推理
     │ ► 100 次推理 + 50 条记忆
     ▼
Level 2 (Learner)  ─── 解锁自定义技能标签
     │ ► 500 次推理 + 200 条记忆
     ▼
Level 3 (Skilled)  ─── 解锁 Agent 市场展示
     │ ► 2000 次推理 + 1000 条记忆 + 信任 > 80
     ▼
Level 4 (Expert)   ─── 解锁高级功能（批量推理、多模态）
     │ ► 10000 次推理 + 5000 条记忆 + 信任 > 95
     ▼
Level 5 (Master)   ─── 解锁创作者收益分成
```

#### 3.3.3 INFT 转让安全机制

基于 ERC-7857 标准，Agent INFT 转让时：

1. **元数据哈希验证**：转让前后比对 `metadataHash`，确保加密元数据完整转移
2. **加密 URI 更新**：新所有者需要用自己的钱包重新加密存储 URI
3. **操作员权限清空**：转让时自动清除所有 `authorizedOperators`
4. **记忆密钥迁移**：旧所有者需要在转让前导出记忆密钥包，新所有者用自己的钱包重新加密

---

### 3.4 Verifiable Decision Chain — 可验证决策链

#### 3.4.1 上链策略（智能选择，节省 gas）

```
所有推理结果
     │
     ├─ importance >= 4 ──→ 🔴 立即上链 (关键决策)
     │                      每次独立交易，确保立即可验证
     │
     ├─ importance == 3 ──→ 🟡 批量上链 (一般决策)
     │                      累积 10 条后打包为一笔交易
     │                      大幅降低单条 gas 成本
     │
     └─ importance <= 2 ──→ 🟢 仅存 0G Storage (日常对话)
                            不上链但存储在去中心化存储中
                            可追溯但不产生 gas 费用
```

#### 3.4.2 链上记录数据结构

| 字段 | 类型 | 说明 |
|------|------|------|
| `agentId` | uint256 | Agent INFT Token ID |
| `inputHash` | bytes32 | 用户输入的 keccak256 哈希（不暴露原文） |
| `outputHash` | bytes32 | AI 回复的 keccak256 哈希 |
| `modelHash` | bytes32 | 使用模型的 keccak256 哈希 |
| `proofHash` | bytes32 | 综合证明哈希 = keccak256(inputHash + outputHash + modelHash + timestamp) |
| `timestamp` | uint64 | 记录时间 |
| `importance` | uint8 | 重要性等级 1-5 |

#### 3.4.3 验证机制

**链上验证**：任何人都可以调用合约的 `verifyProof(proofHash)` 方法验证某条推理是否已上链。

**完整验证流程：**

```
用户提供 proofHash
     │
     ▼
① 查询合约: verifyProof(proofHash) → true/false
     │
     ├─ true → 找到链上记录
     │         │
     │         ▼
     │    ② 提取 Decision 结构体所有字段
     │         │
     │         ▼
     │    ③ 用户可自行验证:
     │       · keccak256(自己记得的输入) == inputHash ?
     │       · keccak256(收到的回复) == outputHash ?
     │       · 时间戳是否合理 ?
     │
     └─ false → 该推理未上链（可能是低重要性或 0G Storage 记录）
```

#### 3.4.4 批量上链优化

- 将 10 条中等重要性的推理打包为一笔交易
- 计算 `batchHash = keccak256(proofHash1 + proofHash2 + ... + proofHash10)`
- 单条 gas 成本降低约 60%
- 触发 `BatchDecisionsRecorded` 事件，包含总条数和 batchHash

---

## 四、智能合约设计

### 4.1 合约架构

```
┌──────────────────────────────────────────────────────┐
│                 SealMind 合约体系                      │
│                                                       │
│  ┌──────────────────┐                                 │
│  │  AgentRegistry   │  Agent 注册表                    │
│  │  ─────────────   │  · 管理全局 Agent 列表           │
│  │  · 记录所有已创建│  · 提供搜索/浏览接口             │
│  │    Agent 的索引  │  · 管理白名单/黑名单             │
│  └────────┬─────────┘                                 │
│           │ 引用                                      │
│  ┌────────▼─────────┐      ┌──────────────────────┐  │
│  │  SealMindINFT    │      │  DecisionChain       │  │
│  │  ─────────────   │      │  ─────────────       │  │
│  │  · ERC721 标准   │ ←──→ │  · 存储决策记录      │  │
│  │  · Agent 属性    │ 授权  │  · 批量上链          │  │
│  │  · 等级系统      │      │  · 证明验证          │  │
│  │  · 操作员权限    │      │  · 审计查询          │  │
│  └──────────────────┘      └──────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### 4.2 SealMindINFT 合约详细设计

**继承关系**：`ERC721Enumerable` + `Ownable` + `ReentrancyGuard`

**代币名称**：`SealMind Agent`（符号：`SMIND`）

**核心存储：**

| 存储映射 | Key → Value | 说明 |
|---------|-------------|------|
| `agentStats` | tokenId → AgentStats 结构体 | Agent 动态统计数据 |
| `agentProfiles` | tokenId → AgentProfile 结构体 | Agent 基本信息 |
| `agentSkills` | tokenId → string[] | Agent 技能列表 |
| `authorizedOperators` | tokenId → address → bool | 授权操作员 |

**AgentProfile 结构体字段：**
- `name`：Agent 名称
- `model`：默认 AI 模型
- `metadataHash`：完整元数据的 keccak256 哈希
- `encryptedURI`：指向 0G Storage 中加密元数据的 URI

**核心函数：**

| 函数 | 权限 | 功能 |
|------|------|------|
| `createAgent(name, model, encryptedURI, metadataHash)` | 任何人 | 铸造 INFT + 初始化 Profile + Stats（初始信任分 50.00，等级 1） |
| `recordInference(tokenId)` | Owner / 授权操作员 / DecisionChain | 推理次数+1，更新活跃时间，检查等级提升 |
| `authorizeOperator(tokenId, operator)` | 仅 Owner | 授权后端服务地址操作该 Agent |
| `getAgentInfo(tokenId)` | 公开查询 | 返回 Profile + Stats + Skills |
| `getAgentsByOwner(address)` | 公开查询 | 返回该地址拥有的所有 Agent Token ID |

**等级检查逻辑：**

- 推理次数阈值：`[0, 100, 500, 2000, 10000]` 对应 Level 1-5
- 每次 `recordInference` 后，从高到低遍历阈值
- 一旦推理次数 ≥ 某阈值且当前等级更低，立即升级
- 升级时触发 `AgentStatsUpdated` 事件

### 4.3 DecisionChain 合约详细设计

**核心存储：**

| 存储映射 | Key → Value | 说明 |
|---------|-------------|------|
| `decisions` | agentId → Decision[] | 每个 Agent 的决策数组 |
| `proofExists` | proofHash → bool | 证明去重表 |
| `authorizedRecorders` | address → bool | 授权记录者 |

**核心函数：**

| 函数 | 权限 | 功能 |
|------|------|------|
| `addRecorder(address)` | 仅合约 Owner | 添加授权记录者（后端服务地址） |
| `recordDecision(agentId, inputHash, outputHash, modelHash, importance)` | 授权记录者 | 记录单条决策，计算 proofHash，防重复 |
| `recordBatchDecisions(agentId, inputHashes[], outputHashes[], modelHashes[], importances[])` | 授权记录者 | 批量记录决策，遍历数组，跳过已存在的 proof |
| `verifyProof(proofHash)` | 公开 | 验证某证明是否存在 |
| `getDecisionCount(agentId)` | 公开 | 获取某 Agent 决策总数 |
| `getDecision(agentId, index)` | 公开 | 按索引获取具体决策 |
| `getRecentDecisions(agentId, count)` | 公开 | 获取最近 N 条决策 |

**ProofHash 计算方式**：`keccak256(abi.encodePacked(inputHash, outputHash, modelHash, timestamp))`

**安全保障：**
- `require(!proofExists[proofHash], "Duplicate")` — 防止重复提交
- `require(authorizedRecorders[msg.sender])` — 仅授权地址可写入
- 批量函数自动跳过已存在的 proof，不回滚

### 4.4 AgentRegistry 合约设计

**职责：** 全局 Agent 注册表，提供搜索和浏览能力

| 函数 | 功能 |
|------|------|
| `registerAgent(tokenId, tags[])` | Agent 创建后注册到全局表 |
| `getAgentsByTag(tag)` | 按标签搜索 Agent |
| `getPublicAgents(offset, limit)` | 分页获取公开 Agent |
| `setVisibility(tokenId, isPublic)` | 设置是否在市场可见 |

---

## 五、后端服务设计

### 5.1 API 端点总览

```
Base URL: http://localhost:4000/api

┌─ Agent 管理 ──────────────────────────────────────────────────┐
│  POST   /agents                  → 创建 Agent                 │
│         流程: 铸造 INFT + 初始化记忆库 + 注册到 Registry       │
│  GET    /agents/:agentId         → 获取 Agent 详情             │
│  GET    /agents/owner/:address   → 获取某地址下所有 Agent       │
└───────────────────────────────────────────────────────────────┘

┌─ 对话 (核心) ─────────────────────────────────────────────────┐
│  POST   /chat/:agentId           → 与 Agent 对话              │
│         流程: 加载记忆 → Sealed Inference → 存记忆 → 上链      │
│  GET    /chat/:agentId/history   → 获取对话历史                │
└───────────────────────────────────────────────────────────────┘

┌─ 记忆管理 ────────────────────────────────────────────────────┐
│  GET    /memory/:agentId         → 获取 Agent 记忆列表         │
│  POST   /memory/:agentId         → 手动添加记忆               │
└───────────────────────────────────────────────────────────────┘

┌─ 决策审计 ────────────────────────────────────────────────────┐
│  GET    /decisions/:agentId      → 获取决策历史                │
│  POST   /decisions/verify        → 验证决策证明               │
└───────────────────────────────────────────────────────────────┘

┌─ 浏览与发现 ──────────────────────────────────────────────────┐
│  GET    /explore/agents          → 浏览公开 Agent              │
└───────────────────────────────────────────────────────────────┘
```

### 5.2 核心服务模块

#### AgentService — Agent 生命周期管理

| 方法 | 功能 |
|------|------|
| `createAgent(params)` | 1) 调用 INFT 合约铸造 Token；2) 在 0G Storage 创建 KV Stream；3) 写入初始记忆（人格设定） |
| `getAgent(agentId)` | 查询合约获取 Profile + Stats + Skills |
| `getAgentsByOwner(address)` | 链上查询该地址的所有 Token ID，逐一获取详情 |

#### SealedInferenceService — 可验证推理

（详见 3.1.2 推理服务完整流程）

| 方法 | 功能 |
|------|------|
| `initialize()` | 创建 0G Compute Broker 并初始化 |
| `inference(agentId, prompt, memoryContext)` | 执行 TEE 推理，返回结果 + 证明 |

#### MemoryVaultService — 加密记忆

（详见 3.2 Memory Vault）

| 方法 | 功能 |
|------|------|
| `deriveAgentKey(signer, agentId)` | 从钱包派生 Agent 专用加密密钥 |
| `saveMemory(agentId, memory, key)` | 加密 + 存入 0G Storage |
| `loadMemories(agentId, key, limit)` | 从 0G Storage 加载 + 解密 |
| `buildContext(agentId, key)` | 构建推理用的记忆上下文 |

#### DecisionChainService — 决策上链

| 方法 | 功能 |
|------|------|
| `recordDecision(agentId, proof, importance)` | 根据 importance 决定立即上链 or 加入批量队列 |
| `flushBatch(agentId)` | 将批量队列中的决策打包上链 |
| `verifyProof(proofHash)` | 调用合约验证证明 |
| `getDecisions(agentId, page, limit)` | 分页获取链上决策 |

### 5.3 核心对话接口详细流程

**POST /api/chat/:agentId**

```
请求: { "message": "分析 0G 代币走势", "importance": 3 }
     │
     ▼
1. 参数校验: agentId 存在 + message 非空 + importance 1-5
     │
     ▼
2. MemoryVaultService.deriveAgentKey(signer, agentId)
   → 派生加密密钥
     │
     ▼
3. MemoryVaultService.buildContext(agentId, key)
   → 加载解密记忆，构建上下文 string[]
     │
     ▼
4. SealedInferenceService.inference(agentId, message, context)
   → TEE 推理 → 返回 { response, proof }
     │
     ▼
5. MemoryVaultService.saveMemory(agentId, 新对话记忆, key)
   → 加密存储本次对话
     │
     ▼
6. DecisionChainService.recordDecision(agentId, proof, importance)
   → importance >= 4: 立即上链
   → importance == 3: 加入批量队列
   → importance <= 2: 仅存 0G Storage
     │
     ▼
7. INFT 合约.recordInference(agentId)
   → 更新推理计数 + 检查升级
     │
     ▼
返回响应:
{
  "response": "根据我的分析...",
  "proof": {
    "proofHash": "0xdef0...1234",
    "modelHash": "0x5678...9abc",
    "teeSignature": "0x...",
    "onChain": true,
    "txHash": "0x1111...2222",
    "explorerUrl": "https://chainscan-galileo.0g.ai/tx/0x1111...2222"
  },
  "agentStats": {
    "totalInferences": 43,
    "level": 1,
    "trustScore": 50.00
  }
}
```

---

## 六、前端 UI 设计

### 6.1 页面规划

| 路由 | 页面 | 核心功能 |
|------|------|----------|
| `/` | 首页 | 产品介绍 + 全网统计（Agent 数、推理次数、验证次数） |
| `/dashboard` | 仪表盘 | 我的 Agent 列表（卡片式），每个卡片显示等级徽章、推理次数、最后活跃 |
| `/agent/create` | 创建 Agent | 表单：名称 + 描述 + 模型选择 + 人格设定 → 钱包签名 → 铸造 INFT |
| `/agent/:id/chat` | **对话（核心页面）** | 聊天界面 + 每条回复旁 ✓ Verified 标记 + 证明弹窗 |
| `/agent/:id/memory` | 记忆浏览器 | 分类展示记忆（对话/知识/人格/技能/决策），支持搜索和筛选 |
| `/agent/:id/decisions` | 决策审计 | 决策时间线，每条显示 importance 等级 + 链上状态 + Explorer 链接 |
| `/explore` | Agent 市场 | 浏览公开 Agent，按等级/标签/热度排序 |
| `/verify` | 验证器 | 输入 proofHash → 显示验证结果 + 完整决策详情 |

### 6.2 核心 UI 交互设计

**对话页面 WOW MOMENT：**

```
┌──────────────────────────────────────────────────────┐
│  🧠 Agent #42 — SealBot                  Level 3 ⭐⭐⭐ │
│  ────────────────────────────────────────────────────── │
│                                                        │
│  👤 User: 分析 0G 代币走势                              │
│                                                        │
│  🤖 SealBot:                                           │
│  根据我的分析，0G 代币在过去...                          │
│                                    ✅ Verified ← 点击  │
│                                                        │
│  ┌ 点击后展开证明卡片 ──────────────────────────────┐   │
│  │ 🔐 Inference Proof                              │   │
│  │ ───────────────────                             │   │
│  │ Model:     DeepSeek V3.1  ✓                     │   │
│  │ TEE:       Intel TDX      ✓                     │   │
│  │ Proof:     0xdef0...1234                        │   │
│  │ Time:      2026-03-24 14:30:22                  │   │
│  │ Chain TX:  0x1111...2222                        │   │
│  │                                                 │   │
│  │ [🔗 View on 0G Explorer]  [📋 Copy Proof Hash] │   │
│  └─────────────────────────────────────────────────┘   │
│                                                        │
│  ┌──────────────────────────────────────┐ [Send]       │
│  │ 输入消息...                          │              │
│  └──────────────────────────────────────┘              │
└──────────────────────────────────────────────────────┘
```

**Agent 卡片组件：**

```
┌────────────────────────────┐
│  🧠 SealBot           ⭐⭐⭐ │
│  ─────────────────────      │
│  DeepSeek V3.1              │
│                             │
│  📊 推理: 543 次            │
│  🧠 记忆: 128 条            │
│  🛡️ 信任: 85.20            │
│                             │
│  📌 #crypto #analysis       │
│                             │
│  [💬 Chat] [🔍 Details]     │
└────────────────────────────┘
```

### 6.3 钱包连接方案

- 使用 **RainbowKit** + **wagmi v2** 实现钱包连接
- 支持 MetaMask、WalletConnect、Coinbase Wallet
- 自动添加 0G 网络配置（Chain ID: 16602/16661）
- 所有需要签名的操作（创建 Agent、授权操作员、加密密钥派生）通过 wagmi hooks 调用

---

## 七、技术栈与依赖

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| **前端** | Next.js | 14 | SSR + App Router |
| | TypeScript | 5.x | 类型安全 |
| | TailwindCSS | 3.x | UI 样式 |
| | RainbowKit | latest | 钱包连接 UI |
| | wagmi | v2 | 以太坊交互 hooks |
| **后端** | Node.js | 18+ | 运行时 |
| | Express | 4.x | HTTP 服务器 |
| | ethers.js | v6 | 链上交互 |
| **0G SDK** | @0gfoundation/0g-ts-sdk | ^0.3.3 | Storage + KV Store |
| | @0glabs/0g-serving-broker | ^0.6.5 | Compute (Sealed Inference) |
| **合约** | Solidity | ^0.8.19 | 智能合约 |
| | Hardhat | latest | 编译/测试/部署 |
| | OpenZeppelin | 4.x | 合约标准库 |
| **AI 模型** | DeepSeek V3.1 | — | 主力推理模型 (TeeML) |
| | Qwen 2.5 VL 72B | — | 备选模型 |

**合约编译配置：** `evmVersion: "cancun"` + `optimizer: enabled, runs: 200`

---

## 八、项目结构

```
sealmind/
│
├── packages/
│   │
│   ├── contracts/                         # 📜 智能合约包
│   │   ├── contracts/
│   │   │   ├── SealMindINFT.sol           # Agent 身份 INFT 合约 (ERC721)
│   │   │   ├── DecisionChain.sol          # 决策链合约
│   │   │   └── AgentRegistry.sol          # Agent 注册表
│   │   ├── scripts/
│   │   │   └── deploy.ts                  # 部署脚本
│   │   ├── test/                          # 合约测试
│   │   └── hardhat.config.ts              # Hardhat 配置 (0G 网络)
│   │
│   ├── backend/                           # 🖥️ 后端服务包
│   │   ├── src/
│   │   │   ├── index.ts                   # 入口 (Express 启动 + 0G 初始化)
│   │   │   ├── routes/
│   │   │   │   ├── agentRoutes.ts         # /api/agents/*
│   │   │   │   ├── chatRoutes.ts          # /api/chat/*
│   │   │   │   ├── memoryRoutes.ts        # /api/memory/*
│   │   │   │   └── decisionRoutes.ts      # /api/decisions/*
│   │   │   ├── services/
│   │   │   │   ├── AgentService.ts        # Agent 生命周期管理
│   │   │   │   ├── SealedInferenceService.ts  # TEE 推理引擎
│   │   │   │   ├── MemoryVaultService.ts  # 加密记忆管理
│   │   │   │   └── DecisionChainService.ts # 决策上链管理
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts                # 钱包签名验证
│   │   │   │   └── errorHandler.ts        # 统一错误处理
│   │   │   └── utils/
│   │   │       └── encryption.ts          # 加密工具函数
│   │   ├── .env.example                   # 环境变量模板
│   │   └── package.json
│   │
│   └── frontend/                          # 🌐 前端应用包
│       ├── app/                           # Next.js App Router
│       │   ├── page.tsx                   # 首页
│       │   ├── layout.tsx                 # 全局布局 (RainbowKit Provider)
│       │   ├── dashboard/
│       │   │   └── page.tsx               # 仪表盘 — 我的 Agent 列表
│       │   ├── agent/
│       │   │   ├── create/page.tsx        # 创建 Agent
│       │   │   └── [id]/
│       │   │       ├── chat/page.tsx      # ⭐ 对话核心页面
│       │   │       ├── memory/page.tsx    # 记忆浏览器
│       │   │       └── decisions/page.tsx # 决策审计日志
│       │   ├── explore/page.tsx           # Agent 市场
│       │   └── verify/page.tsx            # 证明验证器
│       ├── components/
│       │   ├── AgentCard.tsx              # Agent 卡片组件
│       │   ├── ChatMessage.tsx            # 聊天消息 + ✅ Verified 标记
│       │   ├── ProofModal.tsx             # 证明详情弹窗
│       │   ├── MemoryBrowser.tsx          # 记忆浏览器组件
│       │   └── DecisionTimeline.tsx       # 决策时间线组件
│       ├── hooks/
│       │   ├── useAgent.ts               # Agent 数据 hooks
│       │   ├── useChat.ts                # 对话 hooks
│       │   └── useVerify.ts              # 验证 hooks
│       ├── lib/
│       │   ├── contracts.ts              # 合约 ABI + 地址
│       │   └── wagmiConfig.ts            # wagmi + 0G 网络配置
│       └── package.json
│
├── .env.example                          # 全局环境变量模板
├── package.json                          # monorepo 根配置
└── README.md                             # 项目说明
```

---

## 九、0G 集成详解

### 9.1 网络配置

| 配置项 | 测试网值 | 主网值 |
|--------|---------|--------|
| RPC URL | `https://evmrpc-testnet.0g.ai` | `https://evmrpc.0g.ai` |
| Chain ID | 16602 | 16661 |
| Storage Indexer | `https://indexer-storage-testnet-turbo.0g.ai` | 主网 URL |
| KV Node | `http://3.101.147.150:6789` | 主网 KV 节点 |
| Explorer | `https://chainscan-galileo.0g.ai` | `https://chainscan.0g.ai` |

### 9.2 初始化流程

后端服务启动时需要初始化 4 个 0G 连接：

```
服务启动
     │
     ▼
1. 创建 ethers JsonRpcProvider → 连接 0G Chain
     │
     ▼
2. 创建 ethers Wallet → 用项目私钥签名交易
     │
     ▼
3. 创建 Storage Indexer 实例 → 用于选择存储节点
     │
     ▼
4. 创建 KV Client 实例 → 用于读写 KV Store
     │
     ▼
5. 创建 Compute Broker 实例 → 用于 TEE 推理
   └── broker.initialize() → 注册到 0G Compute 网络
     │
     ▼
✅ 所有组件就绪，开始接收请求
```

### 9.3 四大组件集成点对照

| SealMind 操作 | 0G 组件 | SDK 方法 | 时机 |
|--------------|---------|----------|------|
| 创建 Agent | 0G Chain | ethers 合约调用 `createAgent()` | 用户点击创建 |
| 初始化记忆库 | 0G Storage | Batcher + KV Stream 写入 | 创建 Agent 后 |
| 保存记忆 | 0G Storage | Indexer.selectNodes() → Batcher.exec() | 每次对话后 |
| 读取记忆 | 0G Storage | KvClient.getValue() | 推理前 |
| TEE 推理 | 0G Compute | broker.listServices() → fetch → broker.processResponse() | 用户发消息 |
| 记录决策 | 0G Chain | ethers 合约调用 `recordDecision()` | 推理后 |
| 批量记录 | 0G Chain | ethers 合约调用 `recordBatchDecisions()` | 累积 10 条后 |
| 验证证明 | 0G Chain | ethers 合约调用 `verifyProof()` | 用户点击验证 |
| 升级等级 | 0G Chain | ethers 合约调用 `recordInference()` | 推理后 |

---

## 十、Demo 场景设计 (3 分钟)

### 10.1 Demo 脚本

```
[0:00-0:20] 开场
  "你信任你的 AI 吗？SealMind 让每句 AI 回复都可在链上验证。"
  展示: 首页 + 全网统计

[0:20-1:00] 创建 Agent
  操作: 连接钱包 → 填写名称/模型/人格 → 点击创建
  展示: MetaMask 弹窗签名 → 加载动画 → INFT 铸造成功
  亮点: 打开 0G Explorer 展示链上交易

[1:00-2:00] 🎯 WOW MOMENT — 可验证对话
  操作: 进入对话页面 → 发送 "分析 0G 代币走势"
  展示:
    · AI 回复旁显示绿色 ✅ Verified 标记
    · 点击 ✅ → 证明卡片弹出（模型哈希 + TEE 签名 + 链上交易）
    · 点击 "View on 0G Explorer" → 链上可查
    · 切换到验证器页面 → 输入 proofHash → ✅ 验证通过
  台词: "这个回答确实来自 DeepSeek V3.1，在 TEE 中执行，未泄露任何数据"

[2:00-2:30] 记忆演示
  操作: 打开记忆浏览器 → 展示加密存储的记忆 → 手动添加知识
  展示: 再次对话 → Agent 使用新增的知识回答
  台词: "记忆客户端加密，存在 0G Storage 上，只有所有者能解密"

[2:30-3:00] 总结
  展示: 架构图 + 0G 组件高亮
  台词: "4 大 0G 组件深度集成——Storage 存记忆，Compute 做推理，
        Chain 记决策，INFT 定身份。为 AI Agent 构建可验证的灵魂。"
```

### 10.2 Demo 防灾预案

| 风险 | 预案 |
|------|------|
| TEE 推理超时 | 预先录制一段完整对话作为视频备份 |
| 链上交易卡住 | 预先在测试网部署好，提前上链几条数据 |
| 钱包连接失败 | 准备已连接好的浏览器页面截图/录屏 |
| 0G Storage 节点不可用 | 使用 mock 记忆数据展示加密/解密流程 |

---

## 十一、安全设计

### 11.1 威胁模型与防护

| 威胁 | 攻击场景 | 防护措施 |
|------|----------|----------|
| **私钥泄露** | 代码中硬编码私钥 | `.env` 不提交 Git + CI/CD 环境变量注入 |
| **记忆泄露** | 攻击者从 0G Storage 读取数据 | AES-256-GCM 客户端加密，无密钥只能读到密文 |
| **密钥被破解** | 暴力破解加密密钥 | 钱包签名 + SHA-256 派生，256-bit 密钥空间 |
| **推理窃取** | 监听推理过程获取用户输入 | Sealed Inference 在 TEE 中执行，内存加密 |
| **合约越权** | 非授权地址调用敏感函数 | `onlyOwner` + `onlyAuthorized` + `ReentrancyGuard` |
| **链上隐私** | 通过链上数据还原输入内容 | 链上仅存哈希值，不含明文 |
| **重放攻击** | 重复提交旧的推理证明 | `proofExists` 去重表 + 时间戳验证 |
| **中间人攻击** | 篡改推理请求/响应 | TEE 远程证明 + 端到端哈希校验 |

### 11.2 密钥管理方案

```
┌─ 密钥层级 ───────────────────────────────────────────┐
│                                                       │
│  Layer 1: 用户钱包私钥                                │
│           └── 用户自行保管，系统不接触                  │
│                                                       │
│  Layer 2: 项目后端私钥 (PRIVATE_KEY)                   │
│           └── 仅存 .env / 环境变量                     │
│           └── 用于: 合约交互 + 0G SDK 初始化            │
│                                                       │
│  Layer 3: Agent 专用加密密钥 (派生)                    │
│           └── 运行时派生，不持久化                      │
│           └── 派生路径: 钱包签名 → SHA-256              │
│           └── 用于: 记忆加密/解密                       │
│                                                       │
│  Layer 4: 会话级密钥 (每次推理)                        │
│           └── broker 自动管理的认证头                   │
│           └── 用于: 与 TEE 提供商通信                   │
└───────────────────────────────────────────────────────┘
```

---

## 十二、开发计划 (6 周)

### Week 1: 3/24 — 3/30 | 项目骨架 + 基础设施

| 天 | 任务 | 交付物 |
|----|------|--------|
| Day 1-2 | monorepo 初始化 + 依赖安装 + 0G SDK 集成验证 | 项目能编译运行 |
| Day 3-4 | SealMindINFT + DecisionChain + AgentRegistry 合约编写 | 合约代码 + 单元测试 |
| Day 5 | 合约部署到 0G Testnet + 验证 | 合约地址 + Explorer 链接 |
| Day 6-7 | 后端骨架 (Express + 路由 + 0G 初始化) | 后端能启动 + 健康检查 |
| **📋** | **Online Checkpoint 提交 (3/25)** | **项目名 + 描述 + 赛道** |

### Week 2: 3/31 — 4/06 | 推理 + 存储

| 天 | 任务 | 交付物 |
|----|------|--------|
| Day 1-2 | SealedInferenceService 实现 + TeeML 调试 | 能调用 TEE 推理并获得签名 |
| Day 3-4 | MemoryVaultService 实现 + 加密测试 | 能加密写入/解密读取 0G Storage |
| Day 5-6 | Agent 创建全流程联调 (铸造 INFT + 初始化记忆) | 创建 Agent E2E 打通 |
| Day 7 | DecisionChainService + 上链测试 | 决策能上链 + 可查询 |

### Week 3: 4/07 — 4/13 | 集成 + 前端

| 天 | 任务 | 交付物 |
|----|------|--------|
| Day 1-2 | 完整对话流程联调 (推理 → 存记忆 → 上链) | 核心流程 E2E 打通 |
| Day 3-4 | 前端框架搭建 + 钱包连接 + Agent 创建页面 | 能创建 Agent |
| Day 5-6 | 对话页面 + ✅ Verified 标记 + 证明弹窗 | ⭐ 核心 WOW MOMENT |
| Day 7 | 记忆浏览器 + 决策审计页面 | 完整功能 |

### Week 4: 4/14 — 4/22 | UI 打磨 + HK Demo Day

| 天 | 任务 | 交付物 |
|----|------|--------|
| Day 1-3 | UI/UX 精细打磨 + 动画效果 + 响应式 | 美观的界面 |
| Day 4-5 | Agent 浏览/市场页面 + 验证器页面 | 完整页面 |
| Day 6-7 | Demo 排练 + 边缘情况修复 | 稳定可演示 |
| **🇭🇰** | **4/22 香港 Demo Day** | **现场演示** |

### Week 5: 4/23 — 5/02 | 测试 + 主网

| 天 | 任务 | 交付物 |
|----|------|--------|
| Day 1-3 | 端到端测试 + Bug 修复 | 稳定版本 |
| Day 4-5 | 主网合约部署 + 数据迁移 | 主网合约地址 |
| Day 6-7 | 性能优化 + 压力测试 | 生产就绪 |

### Week 6: 5/03 — 5/09 | 提交

| 天 | 任务 | 交付物 |
|----|------|--------|
| Day 1-2 | Demo 视频录制 (≤3 分钟) | YouTube/Loom 链接 |
| Day 3-4 | README + 架构图 + 部署文档 | 完整文档 |
| Day 5-6 | 代码清理 + GitHub 仓库整理 | 公开仓库 |
| Day 7 | Twitter 推文 + 最终提交 | ✅ 提交完毕 |
| **📤** | **5/09 23:59 提交截止** | **所有材料** |

---

## 十三、部署方案

### 13.1 合约部署

**部署顺序（有依赖关系）：**

```
1. 部署 DecisionChain 合约 → 获得 decisionChainAddress
     │
     ▼
2. 部署 SealMindINFT 合约 (构造函数传入 decisionChainAddress)
   → 获得 inftAddress
     │
     ▼
3. 部署 AgentRegistry 合约 (传入 inftAddress)
   → 获得 registryAddress
     │
     ▼
4. 配置权限:
   ├── DecisionChain.addRecorder(后端服务地址)
   └── SealMindINFT.authorizeOperator (全局操作员设置)
```

**网络配置要点：**
- Solidity 版本: `^0.8.19`
- EVM 版本: `cancun`
- 优化: 开启, runs = 200
- 测试网 Chain ID: 16602，主网 Chain ID: 16661

### 13.2 后端部署

```
环境准备:
├── Node.js 18+
├── 配置 .env (RPC_URL, CHAIN_ID, PRIVATE_KEY, STORAGE_INDEXER, KV_NODE_URL)
├── 配置合约地址 (INFT_ADDRESS, DECISION_CHAIN_ADDRESS, REGISTRY_ADDRESS)
└── 确保钱包有足够 0G 测试币 (用于 gas)

启动顺序:
1. npm install                    # 安装依赖
2. 检查 0G 连接健康               # RPC + Storage + KV + Compute 四个组件
3. npm run dev                    # 启动开发服务器 (端口 4000)
```

### 13.3 前端部署

```
环境准备:
├── 配置 NEXT_PUBLIC_API_URL (后端地址)
├── 配置 NEXT_PUBLIC_CHAIN_ID (16602 或 16661)
├── 配置 NEXT_PUBLIC_INFT_ADDRESS (INFT 合约地址)
├── 配置 NEXT_PUBLIC_DECISION_CHAIN_ADDRESS (决策链合约地址)
└── 配置 WalletConnect Project ID (用于钱包连接)

启动:
1. npm install
2. npm run dev                    # 开发模式 (端口 3000)
3. npm run build && npm start     # 生产模式
```

### 13.4 一键启动顺序

```
# 1. 编译 + 部署合约
cd packages/contracts
npx hardhat compile
npx hardhat run scripts/deploy.ts --network og-testnet

# 2. 启动后端 (另一个终端)
cd packages/backend
npm run dev

# 3. 启动前端 (另一个终端)
cd packages/frontend
npm run dev
```

---

## 附录：提交 Checklist

- [ ] **项目名称**: SealMind
- [ ] **一句话描述**: AI Agent 的可验证灵魂容器——集成 0G Storage + Compute + Chain + INFT
- [ ] **GitHub Repo**: 公开，有实质性 commit
- [ ] **0G 主网合约地址**: SealMindINFT + DecisionChain + AgentRegistry
- [ ] **0G Explorer 链接**: 显示链上活动
- [ ] **Demo 视频**: ≤3 分钟，YouTube/Loom
- [ ] **README.md**: 架构图 + 0G 组件说明 + 部署步骤
- [ ] **Twitter**: #0GHackathon #BuildOn0G @0G_labs @0g_CN @HackQuest_

---

> 📝 文档版本: v2.0 | 更新日期: 2026-03-24 | 变更: 移除所有代码，聚焦架构设计与实施细节
