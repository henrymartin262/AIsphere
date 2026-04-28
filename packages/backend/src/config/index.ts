import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv({ path: "../../.env" });
loadEnv({ path: "../../.env.local" });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  RPC_URL: z.string().url().default("https://evmrpc.0g.ai"),
  CHAIN_ID: z.coerce.number().default(16661),
  STORAGE_INDEXER_URL: z.string().url().default("https://indexer-storage-testnet-turbo.0g.ai"),
  KV_NODE_URL: z.string().url().default("http://3.101.147.150:6789"),
  PRIVATE_KEY: z.string().optional(),
  DEPLOYER_PRIVATE_KEY: z.string().optional(),
  INFT_ADDRESS: z.string().optional(),
  DECISION_CHAIN_ADDRESS: z.string().optional(),
  REGISTRY_ADDRESS: z.string().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),
  DEEPSEEK_BASE_URL: z.string().url().default("https://api.deepseek.com"),
  GLM_API_KEY: z.string().optional(),
  GLM_BASE_URL: z.string().url().default("https://open.bigmodel.cn/api/paas/v4"),
  GLM_MODEL: z.string().default("GLM-4.7"),
  BOUNTY_BOARD_ADDRESS: z.string().optional(),
  ENCRYPTION_SECRET: z.string().optional(),
  CLAWHUB_TOKEN: z.string().optional(),
  JWT_SECRET: z.string().optional(),
});

export const env = envSchema.parse(process.env);
