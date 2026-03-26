export const contracts = {
  inftAddress: process.env.NEXT_PUBLIC_INFT_ADDRESS || "",
  decisionChainAddress: process.env.NEXT_PUBLIC_DECISION_CHAIN_ADDRESS || "",
  registryAddress: process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || ""
} as const;
