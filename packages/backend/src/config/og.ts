import { ethers } from "ethers";
import { env } from "./index.js";

export interface ZeroGClients {
  providerUrl: string;
  storageIndexerUrl: string;
  kvNodeUrl: string;
  brokerStatus: "bootstrap" | "ready" | "unavailable";
  provider?: ethers.JsonRpcProvider;
  signer?: ethers.Wallet;
}

let cachedClients: ZeroGClients | null = null;

export async function initialize0GClients(): Promise<ZeroGClients> {
  if (cachedClients) {
    return cachedClients;
  }

  let provider: ethers.JsonRpcProvider | undefined;
  let signer: ethers.Wallet | undefined;
  let brokerStatus: ZeroGClients["brokerStatus"] = "bootstrap";

  try {
    provider = new ethers.JsonRpcProvider(env.RPC_URL);
    // Quick connectivity check — don't crash if it fails
    await provider.getNetwork().catch(() => {
      console.warn("[0G] RPC unreachable, running in offline mode");
      provider = undefined;
    });

    if (provider && env.PRIVATE_KEY) {
      signer = new ethers.Wallet(env.PRIVATE_KEY, provider);
    }

    brokerStatus = provider ? "ready" : "unavailable";
  } catch (err) {
    console.warn("[0G] Failed to initialise provider:", err);
    brokerStatus = "unavailable";
  }

  cachedClients = {
    providerUrl: env.RPC_URL,
    storageIndexerUrl: env.STORAGE_INDEXER_URL,
    kvNodeUrl: env.KV_NODE_URL,
    brokerStatus,
    provider,
    signer
  };

  // 0G KV client placeholder — wire up @0gfoundation/0g-ts-sdk KvClient here
  // when deploying to production:
  //   import { KvClient } from "@0gfoundation/0g-ts-sdk";
  //   cachedClients.kvClient = new KvClient(env.KV_NODE_URL);

  return cachedClients;
}
