/**
 * 独立部署脚本 — 使用 Node.js 原生 https + ethers.js v6
 * 绕过 Hardhat 的 undici 网络层（在某些服务器环境有连接超时问题）
 */
import { ethers } from "ethers";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// 加载 .env
const envPath = resolve(__dirname, "../../../.env");
if (existsSync(envPath)) {
  const lines = readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

const RPC_URL = process.env.RPC_URL || "https://evmrpc-testnet.0g.ai";
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error("❌ DEPLOYER_PRIVATE_KEY 未设置");
  process.exit(1);
}

// 读取合约 artifact
function loadArtifact(name) {
  const p = resolve(__dirname, `../artifacts/contracts/${name}.sol/${name}.json`);
  return JSON.parse(readFileSync(p, "utf-8"));
}

async function main() {
  console.log("🔗 连接 RPC:", RPC_URL);
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log("部署账户:", wallet.address);
  const balance = await provider.getBalance(wallet.address);
  console.log("账户余额:", ethers.formatEther(balance), "OG");

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
  console.log("\n[权限配置] 授权后端钱包为操作员...");
  const inftContract = new ethers.Contract(inftAddr, inftArtifact.abi, wallet);
  const tx1 = await inftContract.authorizeOperator(wallet.address);
  await tx1.wait();
  console.log("✅ INFT 操作员已授权:", wallet.address);

  const dcContract = new ethers.Contract(decisionChainAddr, dcArtifact.abi, wallet);
  // deployer 已默认是 recorder，无需再次添加
  console.log("✅ DecisionChain recorder 已默认授权（deployer）:", wallet.address);

  // ==================== 5. 保存部署信息 ====================
  const network = await provider.getNetwork();
  const deployment = {
    network: "og-testnet",
    chainId: Number(network.chainId),
    deployedAt: new Date().toISOString(),
    deployer: wallet.address,
    contracts: {
      DecisionChain: decisionChainAddr,
      SealMindINFT: inftAddr,
      AgentRegistry: registryAddr,
    }
  };

  const rootDir = resolve(__dirname, "../../..");
  const deploymentPath = resolve(rootDir, "deployment.json");
  writeFileSync(deploymentPath, JSON.stringify(deployment, null, 2));
  console.log("\n📄 部署信息已保存:", deploymentPath);

  // 更新 .env
  let envContent = readFileSync(envPath, "utf-8");
  // 移除旧合约地址
  envContent = envContent
    .replace(/^INFT_ADDRESS=.*$/m, `INFT_ADDRESS=${inftAddr}`)
    .replace(/^DECISION_CHAIN_ADDRESS=.*$/m, `DECISION_CHAIN_ADDRESS=${decisionChainAddr}`)
    .replace(/^REGISTRY_ADDRESS=.*$/m, `REGISTRY_ADDRESS=${registryAddr}`)
    .replace(/^NEXT_PUBLIC_INFT_ADDRESS=.*$/m, `NEXT_PUBLIC_INFT_ADDRESS=${inftAddr}`)
    .replace(/^NEXT_PUBLIC_DECISION_CHAIN_ADDRESS=.*$/m, `NEXT_PUBLIC_DECISION_CHAIN_ADDRESS=${decisionChainAddr}`)
    .replace(/^NEXT_PUBLIC_REGISTRY_ADDRESS=.*$/m, `NEXT_PUBLIC_REGISTRY_ADDRESS=${registryAddr}`);
  writeFileSync(envPath, envContent);
  console.log("📄 .env 合约地址已更新");

  console.log("\n🎉 部署完成！");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  DecisionChain :", decisionChainAddr);
  console.log("  SealMindINFT  :", inftAddr);
  console.log("  AgentRegistry :", registryAddr);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  0G Explorer: https://chainscan-galileo.0g.ai/address/${inftAddr}`);
}

main().catch((err) => {
  console.error("❌ 部署失败:", err.message);
  process.exit(1);
});
