# AIsphere Scripts

## Demo Data Seeder

预置演示数据，在 Demo Day 前运行：

```bash
# 确保后端已启动
cd packages/backend && pnpm dev

# 在另一个终端运行
cd scripts
uv run python seed_demo_data.py
```

需要安装 httpx：
```bash
uv add httpx
```

## BountyBoard 部署

```bash
cd packages/contracts
# Testnet
npx hardhat run scripts/deployBounty.ts --network og-testnet
# Mainnet（拿到代币后）
npx hardhat run scripts/deployBounty.ts --network og-mainnet
```
