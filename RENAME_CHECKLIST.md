# 🔄 SealMind 重命名检查清单

如果要重命名项目，使用此清单确保不遗漏任何内容。

---

## 🚫 **禁止改名**（已部署到链上）

- [ ] ❌ `SealMindINFT.sol` — 合约文件名
- [ ] ❌ `contract SealMindINFT` — 合约类名（已部署）
- [ ] ❌ `ERC721("SealMind Agent", "SMAI")` — NFT 名称 + Symbol
- [ ] ❌ 已部署合约地址（Testnet/Mainnet）
- [ ] ❌ 合约中的错误消息字符串 (e.g., `"SealMindINFT: not authorized"`)

---

## ✅ **必须改名**（保持品牌一致性）

### 📝 核心文档
- [ ] `CLAUDE.md` L9-10, L84, L113
- [ ] `README.md` L145, L182-183, L502, L525
- [ ] `README_CN.md` (同步更新)
- [ ] `PROGRESS.md` (全部)
- [ ] `PLAN.md` (全部)
- [ ] `EXPLORATION_SUMMARY.md` (全部)
- [ ] `IMPLEMENTATION_ROADMAP.md` (全部)
- [ ] `.env.example` L2 注释

### 📋 设计文档
- [ ] `/doc/Competitor_Analysis.md`
- [ ] `/doc/SealMind_Competitive_Strategy.md`
- [ ] `/doc/Demo_Script.md`

### 📦 配置文件
- [ ] `package.json` (all packages)
  - [ ] `packages/backend/package.json` — `@sealmind/backend`
  - [ ] `packages/frontend/package.json` — `@sealmind/frontend`
  - [ ] `packages/contracts/package.json` — `@sealmind/contracts`

### 🔧 脚本
- [ ] `scripts/demo_setup.py` L3, L12, L38, L117

---

## ⚠️ **需谨慎改名**（考虑向后兼容）

### 🔐 密钥 + 流 ID 约定

这些影响现有数据访问，改名需要迁移策略：

#### `/packages/backend/src/utils/encryption.ts`
```
L9:  const SERVER_SECRET = process.env.ENCRYPTION_SECRET ?? "SealMind:ServerSecret:v3:0G-Hackathon-2026"
L22: const info = `SealMind:AgentKey:${...}`
```
- [ ] **选项 A**: 保持原样，环境变量 `ENCRYPTION_SECRET` 覆盖
- [ ] **选项 B**: 改为新名字，但需要密钥迁移逻辑

#### 0G Storage 流 ID（多个服务）
```
packages/backend/src/services/AgentService.ts L217
packages/backend/src/services/MemoryVaultService.ts L52
packages/backend/src/services/SoulService.ts L100
packages/backend/src/services/MultiAgentService.ts L73
packages/backend/src/services/HiveMindService.ts L55
```
- [ ] 所有流 ID 都使用 `keccak256(toUtf8Bytes("SealMind:..."))`
- [ ] **改名风险**: 新创建的 Agent 会用新 Stream ID，旧数据需要迁移
- [ ] **建议**: 创建迁移脚本，或在环境变量中保留旧前缀

---

## 🟢 **可安全改名**（无功能影响）

### 前端 UI 文本
- [ ] `packages/frontend/lib/i18n.ts` L41 中文描述
- [ ] `packages/frontend/lib/wagmiConfig.ts` L73 `appName`
- [ ] `packages/frontend/app/agent/[id]/soul/page.tsx` L384 描述文本
- [ ] `packages/frontend/app/openclaw/page.tsx` 多处页面文本

### 后端描述文本
- [ ] `packages/backend/src/routes/gatewayRoutes.ts` API 描述
- [ ] `packages/backend/src/services/BountyService.ts` 赏金任务描述
- [ ] `packages/backend/src/services/SealedInferenceService.ts` L211 系统 prompt

### 临时文件（可删除）
- [ ] `/.tmp/sealmind-health.json`
- [ ] `/.tmp/sealmind_exploration_summary.md`

---

## 📊 改名影响矩阵

| 文件/位置 | 改名复杂度 | 必须改 | 建议改 | 可选改 | 禁止改 |
|:---------|:--------:|:-----:|:-----:|:-----:|:-----:|
| Solidity 合约 | ❌ 极高 | | | | ✅ |
| 合约名 + Symbol | ❌ 极高 | | | | ✅ |
| package.json | 🟢 低 | ✅ | | | |
| 文档 (README/PLAN) | 🟢 低 | ✅ | | | |
| 前端 UI 文本 | 🟢 低 | ✅ | | | |
| 流 ID 前缀 | 🟡 中 | | ✅ | | |
| 密钥生成 | 🟡 中 | | ✅ | | |
| 临时文件 | 🟢 低 | | | ✅ | |
| 缓存文件 | 🟢 低 | | | ✅ | |

---

## 🚀 建议的改名顺序

### 第 1 阶段：文档 + 配置（无风险）
```bash
1. 更新所有 .md 文件
2. 更新 package.json 中的包名
3. 更新 .env.example
4. 更新前端 i18n 文本
```

### 第 2 阶段：后端服务（需测试）
```bash
1. 评估流 ID 改名影响
2. 决定是否保持向后兼容
3. 如改名，创建数据迁移脚本
4. 更新流 ID 前缀
5. 运行集成测试
```

### 第 3 阶段：合约（禁止改名）
```bash
❌ 不改 — SealMindINFT 已部署到 0G Mainnet
✅ 保持原样，保留链上历史
```

---

## 💾 改名后验证清单

改名完成后，按以下清单验证：

- [ ] 所有文档链接有效（检查相对链接）
- [ ] npm/yarn install 无报错
- [ ] `pnpm build` 编译成功
- [ ] 后端启动成功（检查日志无 "SealMind" 硬编码值）
- [ ] 前端页面显示新名字（检查 UI 文本）
- [ ] 钱包连接成功（Wagmi appName 显示正确）
- [ ] API Gateway `/discover` 端点返回正确的 platform 名称
- [ ] 0G Storage KV 可以正常读写（验证流 ID）
- [ ] 现有 Agent 数据仍可访问（如改了流 ID，需迁移）

---

## 🔗 相关资源

- 完整搜索报告: `SEALMIND_SEARCH_REPORT.md`
- 项目指导: `CLAUDE.md`
- 开发计划: `PLAN.md`
- 进度追踪: `PROGRESS.md`

