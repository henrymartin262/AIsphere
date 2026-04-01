import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv({ path: "../../.env" });
loadEnv({ path: "../../.env.local" });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  RPC_URL: z.string().url().default("https://evmrpc-testnet.0g.ai"),
  CHAIN_ID: z.coerce.number().default(16602),
  STORAGE_INDEXER_URL: z.string().url().default("https://indexer-storage-testnet-turbo.0g.ai"),
  KV_NODE_URL: z.string().url().default("http://3.101.147.150:6789"),
  PRIVATE_KEY: z.string().optional(),
  DEPLOYER_PRIVATE_KEY: z.string().optional(),
  INFT_ADDRESS: z.string().optional(),
  DECISION_CHAIN_ADDRESS: z.string().optional(),
  REGISTRY_ADDRESS: z.string().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),
  DEEPSEEK_BASE_URL: z.string().url().default("https://api.deepseek.com"),
  BOUNTY_BOARD_ADDRESS: z.string().optional(),
});

export const env = envSchema.parse(process.env);
