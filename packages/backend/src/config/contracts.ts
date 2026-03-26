import { env } from "./index.js";

export const contracts = {
  inft: env.INFT_ADDRESS || "",
  decisionChain: env.DECISION_CHAIN_ADDRESS || "",
  registry: env.REGISTRY_ADDRESS || ""
} as const;
