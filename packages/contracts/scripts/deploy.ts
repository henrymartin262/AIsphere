import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("部署账户:", deployer.address);
  console.log("账户余额:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "OG");

  // ==================== 1. 部署 DecisionChain ====================
  console.log("\n[1/3] 部署 DecisionChain...");
  const DecisionChain = await ethers.getContractFactory("DecisionChain");
  const decisionChain = await DecisionChain.deploy();
  await decisionChain.waitForDeployment();
  const decisionChainAddr = await decisionChain.getAddress();
  console.log("✅ DecisionChain 部署地址:", decisionChainAddr);

  // ==================== 2. 部署 SealMindINFT ====================
  console.log("\n[2/3] 部署 SealMindINFT...");
  const SealMindINFT = await ethers.getContractFactory("SealMindINFT");
  const inft = await SealMindINFT.deploy();
  await inft.waitForDeployment();
  const inftAddr = await inft.getAddress();
  console.log("✅ SealMindINFT 部署地址:", inftAddr);

  // ==================== 3. 部署 AgentRegistry ====================
  console.log("\n[3/3] 部署 AgentRegistry...");
  const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
  const registry = await AgentRegistry.deploy(inftAddr);
  await registry.waitForDeployment();
  const registryAddr = await registry.getAddress();
  console.log("✅ AgentRegistry 部署地址:", registryAddr);

  // ==================== 4. 权限配置 ====================
  console.log("\n[权限配置] 授权后端钱包...");
  const backendWallet = process.env.BACKEND_WALLET_ADDRESS || deployer.address;
  if (backendWallet !== deployer.address) {
    const tx = await decisionChain.addRecorder(backendWallet);
    await tx.wait();
    console.log("✅ 已授权后端钱包:", backendWallet);
  } else {
    console.log("✅ 部署者即后端钱包，已默认授权:", deployer.address);
  }

  const inftTx = await inft.authorizeOperator(backendWallet);
  await inftTx.wait();
  console.log("✅ 已授权 INFT 操作员:", backendWallet);

  // ==================== 5. 保存部署信息 ====================
  const networkInfo = await ethers.provider.getNetwork();
  const deployment = {
    network: networkInfo.name,
    chainId: Number(networkInfo.chainId),
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      DecisionChain: decisionChainAddr,
      SealMindINFT: inftAddr,
      AgentRegistry: registryAddr,
    }
  };

  const rootDir = path.resolve(__dirname, "../../..");
  const deploymentPath = path.join(rootDir, "deployment.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  console.log("\n📄 部署信息已保存:", deploymentPath);

  const envPath = path.join(rootDir, ".env");
  const envLines = [
    "",
    "# ===== 合约地址（由 deploy.ts 自动生成）=====",
    `INFT_ADDRESS=${inftAddr}`,
    `DECISION_CHAIN_ADDRESS=${decisionChainAddr}`,
    `REGISTRY_ADDRESS=${registryAddr}`,
  ].join("\n");

  if (fs.existsSync(envPath)) {
    let existing = fs.readFileSync(envPath, "utf-8");
    // 移除旧的合约地址段
    existing = existing.replace(/\n# ===== 合约地址[\s\S]*?(?=\n#|\n[A-Z_]+=(?!.*ADDRESS)|$)/g, "");
    fs.writeFileSync(envPath, existing.trimEnd() + envLines);
  } else {
    fs.writeFileSync(envPath, envLines.trimStart());
  }
  console.log("📄 .env 已更新合约地址");

  console.log("\n🎉 部署完成！");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  DecisionChain :", decisionChainAddr);
  console.log("  SealMindINFT  :", inftAddr);
  console.log("  AgentRegistry :", registryAddr);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main().catch((err) => {
  console.error("部署失败:", err);
  process.exit(1);
});
