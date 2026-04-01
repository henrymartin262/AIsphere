import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("部署账户:", deployer.address);
  console.log("账户余额:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "A0GI");

  console.log("\n[1/1] 部署 BountyBoard...");
  const BountyBoard = await ethers.getContractFactory("BountyBoard");
  const bountyBoard = await BountyBoard.deploy();
  await bountyBoard.waitForDeployment();
  const bountyBoardAddr = await bountyBoard.getAddress();
  console.log("✅ BountyBoard 部署地址:", bountyBoardAddr);

  // 更新 deployment.json
  const rootDir = path.resolve(__dirname, "../../..");
  const deploymentPath = path.join(rootDir, "deployment.json");

  let deployment: Record<string, unknown> = {};
  if (fs.existsSync(deploymentPath)) {
    deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf-8"));
  }

  deployment.contracts = {
    ...(deployment.contracts as Record<string, unknown>),
    BountyBoard: bountyBoardAddr
  };
  deployment.updatedAt = new Date().toISOString();

  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  console.log("\n📄 deployment.json 已更新");

  // 更新 .env
  const envPath = path.join(rootDir, ".env");
  if (fs.existsSync(envPath)) {
    let existing = fs.readFileSync(envPath, "utf-8");
    // 移除旧的 BOUNTY_BOARD_ADDRESS 行
    existing = existing.replace(/\nBOUNTY_BOARD_ADDRESS=.*/g, "");
    fs.writeFileSync(envPath, existing.trimEnd() + `\nBOUNTY_BOARD_ADDRESS=${bountyBoardAddr}`);
  }
  console.log("📄 .env 已更新");

  console.log("\n🎉 BountyBoard 部署完成！");
  console.log("  BountyBoard:", bountyBoardAddr);
  console.log("  0G Explorer:", `https://chainscan-galileo.0g.ai/address/${bountyBoardAddr}`);
}

main().catch((err) => {
  console.error("部署失败:", err);
  process.exit(1);
});
