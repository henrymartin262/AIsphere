import { config as loadEnv } from "dotenv";
import "@nomicfoundation/hardhat-toolbox";
import type { HardhatUserConfig } from "hardhat/config";

loadEnv({ path: "../../.env" });
loadEnv({ path: "../../.env.local" });

const accounts =
  process.env.DEPLOYER_PRIVATE_KEY && process.env.DEPLOYER_PRIVATE_KEY.length > 0
    ? [process.env.DEPLOYER_PRIVATE_KEY]
    : [];

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  solidity: {
    version: "0.8.26",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      evmVersion: "cancun"
    }
  },
  networks: {
    hardhat: {},
    "og-testnet": {
      url: process.env.RPC_URL || "https://evmrpc-testnet.0g.ai",
      chainId: Number(process.env.CHAIN_ID || 16602),
      accounts,
      timeout: 120000,
      httpHeaders: { "Connection": "keep-alive" }
    },
    "og-mainnet": {
      url: "https://evmrpc.0g.ai",
      chainId: 16661,
      accounts
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};

export default config;
