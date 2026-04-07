/**
 * 0G Mainnet 专用部署脚本
 * 硬编码 0G Mainnet RPC，绝不连接其他网络
 * 放在 backend 目录下运行以使用 ethers 依赖
 */
import { ethers } from "ethers";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ⚠️ 硬编码 0G Mainnet，不从 .env 读取 RPC
const OG_MAINNET_RPC = "https://evmrpc.0g.ai";
const OG_MAINNET_CHAIN_ID = 16661;

// 加载 .env
const envPath = resolve(__dirname, "../../.env");
if (existsSync(envPath)) {
  const lines = readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
if (!PRIVATE_KEY) {
  console.error("❌ DEPLOYER_PRIVATE_KEY 未设置");
  process.exit(1);
}

function loadArtifact(name) {
  const p = resolve(__dirname, `../../contracts/artifacts/contracts/${name}.sol/${name}.json`);
  return JSON.parse(readFileSync(p, "utf-8"));
}

async function main() {
  console.log("🔗 连接 0G Mainnet RPC:", OG_MAINNET_RPC);
  const provider = new ethers.JsonRpcProvider(OG_MAINNET_RPC);

  // ====== 安全校验：确认是 0G Mainnet ======
  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);
  console.log("  Chain ID:", chainId);
  if (chainId !== OG_MAINNET_CHAIN_ID) {
    console.error(`❌ 安全中断！期望 Chain ID ${OG_MAINNET_CHAIN_ID}，实际 ${chainId}`);
    console.error("   这不是 0G Mainnet，已停止部署以保护你的资产。");
    process.exit(1);
  }
  console.log("✅ 确认连接 0G Mainnet (Chain ID: 16661)");

  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  console.log("部署账户:", wallet.address);
  const balance = await provider.getBalance(wallet.address);
  const balanceEth = ethers.formatEther(balance);
  console.log("账户余额:", balanceEth, "A0GI");

  if (parseFloat(balanceEth) < 0.05) {
    console.error("❌ 余额不足 0.05 A0GI，可能不够部署 3 个合约 + 权限设置");
    process.exit(1);
  }

  // ==================== 1. 部署 DecisionChain ====================
  console.log("\n[1/3] 部署 DecisionChain...");
  const dcArtifact = loadArtifact("DecisionChain");
  const dcFactory = new ethers.ContractFactory(dcArtifact.abi, dcArtifact.bytecode, wallet);
  const decisionChain = await dcFactory.deploy();
  console.log("  tx:", decisionChain.deploymentTransaction()?.hash);
  await decisionChain.waitForDeployment();
  const decisionChainAddr = await decisionChain.getAddress();
  console.log("✅ DecisionChain:", decisionChainAddr);

  // ==================== 2. 部署 SealMindINFT ====================
  console.log("\n[2/3] 部署 SealMindINFT...");
  const inftArtifact = loadArtifact("SealMindINFT");
  const inftFactory = new ethers.ContractFactory(inftArtifact.abi, inftArtifact.bytecode, wallet);
  const inft = await inftFactory.deploy();
  console.log("  tx:", inft.deploymentTransaction()?.hash);
  await inft.waitForDeployment();
  const inftAddr = await inft.getAddress();
  console.log("✅ SealMindINFT:", inftAddr);

  // ==================== 3. 部署 AgentRegistry ====================
  console.log("\n[3/3] 部署 AgentRegistry...");
  const regArtifact = loadArtifact("AgentRegistry");
  const regFactory = new ethers.ContractFactory(regArtifact.abi, regArtifact.bytecode, wallet);
  const registry = await regFactory.deploy(inftAddr);
  console.log("  tx:", registry.deploymentTransaction()?.hash);
  await registry.waitForDeployment();
  const registryAddr = await registry.getAddress();
  console.log("✅ AgentRegistry:", registryAddr);

  // ==================== 4. 权限配置 ====================
  console.log("\n[权限配置] 授权部署钱包为操作员...");
  const inftContract = new ethers.Contract(inftAddr, inftArtifact.abi, wallet);
  const tx1 = await inftContract.authorizeOperator(wallet.address);
  await tx1.wait();
  console.log("✅ INFT 操作员已授权:", wallet.address);
  console.log("✅ DecisionChain recorder 已默认授权（deployer）:", wallet.address);

  // ==================== 5. 保存部署信息 ====================
  const deployment = {
    network: "og-mainnet",
    chainId: OG_MAINNET_CHAIN_ID,
    deployedAt: new Date().toISOString(),
    deployer: wallet.address,
    contracts: {
      DecisionChain: decisionChainAddr,
      SealMindINFT: inftAddr,
      AgentRegistry: registryAddr,
    }
  };

  const rootDir = resolve(__dirname, "../..");
  const deploymentPath = resolve(rootDir, "deployment.json");
  writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  console.log("\n📄 部署信息已保存:", deploymentPath);

  // 查询最终余额
  const finalBalance = await provider.getBalance(wallet.address);
  const cost = parseFloat(balanceEth) - parseFloat(ethers.formatEther(finalBalance));
  console.log("💰 部署总花费:", cost.toFixed(6), "A0GI");
  console.log("💰 剩余余额:", ethers.formatEther(finalBalance), "A0GI");

  console.log("\n🎉 0G Mainnet 部署完成！");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  DecisionChain :", decisionChainAddr);
  console.log("  SealMindINFT  :", inftAddr);
  console.log("  AgentRegistry :", registryAddr);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  Explorer: https://chainscan.0g.ai/address/${inftAddr}`);
  console.log("\n⚠️ 请手动更新 .env 中的合约地址为以上主网地址");
}

main().catch((err) => {
  console.error("❌ 部署失败:", err.message);
  process.exit(1);
});
