/**
 * Initialize 0G Compute Broker account (one-time setup)
 * Run: node scripts/init_compute_account.mjs
 */
import { ethers } from "ethers";
import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env");

// Parse .env manually
const env = {};
readFileSync(envPath, "utf-8").split("\n").forEach((line) => {
  const [k, ...v] = line.split("=");
  if (k && !k.startsWith("#")) env[k.trim()] = v.join("=").trim();
});

const PRIVATE_KEY = env.PRIVATE_KEY;
const TESTNET_RPC = "https://evmrpc-testnet.0g.ai";
const DEPOSIT_AMOUNT = 3; // minimum 3 A0GI to create ledger

if (!PRIVATE_KEY) {
  console.error("❌ PRIVATE_KEY not found in .env");
  process.exit(1);
}

async function main() {
  console.log("🔌 Connecting to 0G testnet...");
  const provider = new ethers.JsonRpcProvider(TESTNET_RPC);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log(`📍 Wallet: ${signer.address}`);

  // Check wallet balance
  const balance = await provider.getBalance(signer.address);
  const balanceA0GI = parseFloat(ethers.formatEther(balance));
  console.log(`💰 Wallet balance: ${balanceA0GI.toFixed(4)} A0GI`);

  if (balanceA0GI < DEPOSIT_AMOUNT + 0.1) {
    console.error(`❌ Insufficient balance. Need at least ${DEPOSIT_AMOUNT + 0.1} A0GI, have ${balanceA0GI.toFixed(4)}`);
    process.exit(1);
  }

  console.log("🔧 Creating 0G Compute Broker...");
  const broker = await createZGComputeNetworkBroker(signer);

  // Check if ledger already exists
  try {
    const ledger = await broker.ledger.getLedger();
    const existing = parseFloat(ethers.formatEther(ledger.totalBalance ?? 0n));
    console.log(`✅ Ledger already exists! Balance: ${existing.toFixed(4)} A0GI`);

    // Show providers
    const providers = await broker.ledger.getProvidersWithBalance("chatbot").catch(() => []);
    console.log(`📋 Providers: ${providers.length}`);
    providers.forEach(([addr, bal]) => {
      console.log(`  - ${addr}: ${ethers.formatEther(bal)} A0GI`);
    });
    return;
  } catch (err) {
    if (err.message?.includes("does not exist") || err.message?.includes("Account does not exist")) {
      console.log("📭 No ledger found, creating one...");
    } else {
      console.log("📭 Ledger check failed, attempting to create:", err.message);
    }
  }

  // Create ledger by depositing
  console.log(`💸 Depositing ${DEPOSIT_AMOUNT} A0GI to create ledger...`);
  try {
    await broker.ledger.depositFund(DEPOSIT_AMOUNT);
    console.log("✅ Ledger created successfully!");

    // Verify
    const ledger = await broker.ledger.getLedger();
    const newBal = parseFloat(ethers.formatEther(ledger.totalBalance ?? 0n));
    console.log(`💰 Ledger balance: ${newBal.toFixed(4)} A0GI`);

    // Now acknowledge the chatbot provider
    console.log("🤝 Discovering chatbot providers...");
    const services = await broker.inference.listService();
    const chatbotProviders = services.filter(s => Array.isArray(s) && s[1] === "chatbot");
    console.log(`📋 Found ${chatbotProviders.length} chatbot provider(s)`);

    for (const p of chatbotProviders) {
      const addr = p[0];
      const model = p[6] ?? p[3];
      console.log(`  🔗 Acknowledging provider ${addr} (${model})...`);
      try {
        await broker.inference.acknowledgeProviderSigner(addr);
        console.log(`  ✅ Acknowledged!`);
      } catch (ackErr) {
        console.log(`  ⚠️  Acknowledge failed: ${ackErr.message}`);
      }
    }

    console.log("\n🎉 Setup complete! Chat should now use TEE inference.");
  } catch (err) {
    console.error("❌ Failed to create ledger:", err.message);
    process.exit(1);
  }
}

main().catch(console.error);
