import { ethers } from "ethers";
import { KvClient, Indexer, Batcher, getFlowContract } from "@0gfoundation/0g-ts-sdk";
import type { StorageNode } from "@0gfoundation/0g-ts-sdk";
import { env } from "./index.js";

export interface ZeroGClients {
  providerUrl: string;
  storageIndexerUrl: string;
  kvNodeUrl: string;
  brokerStatus: "bootstrap" | "ready" | "unavailable";
  provider?: ethers.JsonRpcProvider;
  signer?: ethers.Wallet;
  kvClient?: KvClient;
  storageNodes?: StorageNode[];
  kvReady: boolean;
}

let cachedClients: ZeroGClients | null = null;

export async function initialize0GClients(): Promise<ZeroGClients> {
  if (cachedClients) {
    return cachedClients;
  }

  let provider: ethers.JsonRpcProvider | undefined;
  let signer: ethers.Wallet | undefined;
  let brokerStatus: ZeroGClients["brokerStatus"] = "bootstrap";
  let kvClient: KvClient | undefined;
  let storageNodes: StorageNode[] | undefined;
  let kvReady = false;

  // ── 1. RPC provider + signer ──────────────────────────────────────────────
  try {
    provider = new ethers.JsonRpcProvider(env.RPC_URL);
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

  // ── 2. KV read client (always try — doesn't need a signer) ────────────────
  try {
    kvClient = new KvClient(env.KV_NODE_URL);
    console.log("[0G KV] KvClient initialised →", env.KV_NODE_URL);
  } catch (err) {
    console.warn("[0G KV] Failed to create KvClient:", err);
  }

  // ── 3. Storage nodes (needed for writes via Batcher) ─────────────────────
  if (signer) {
    try {
      const indexer = new Indexer(env.STORAGE_INDEXER_URL);
      const [nodes, err] = await indexer.selectNodes(1);
      if (err || !nodes.length) {
        console.warn("[0G KV] Could not select storage nodes:", err?.message);
      } else {
        storageNodes = nodes;
        console.log("[0G KV] Storage nodes selected:", nodes.length);
        kvReady = true;
      }
    } catch (err) {
      console.warn("[0G KV] Failed to select storage nodes:", err);
    }
  } else {
    console.warn("[0G KV] No signer — KV writes will be unavailable (read-only or memory fallback)");
    // KV reads still work without a signer
    kvReady = !!kvClient;
  }

  cachedClients = {
    providerUrl: env.RPC_URL,
    storageIndexerUrl: env.STORAGE_INDEXER_URL,
    kvNodeUrl: env.KV_NODE_URL,
    brokerStatus,
    provider,
    signer,
    kvClient,
    storageNodes,
    kvReady
  };

  console.log(
    `[0G] Clients ready — broker:${brokerStatus} kv:${kvReady ? "ready" : "unavailable"}`
  );

  return cachedClients;
}

// ── Write helper: use Batcher to commit KV data to 0G storage ────────────────
export async function kvBatchWrite(
  clients: ZeroGClients,
  streamId: string,
  key: Uint8Array,
  data: Uint8Array
): Promise<boolean> {
  const { storageNodes, signer, providerUrl, kvClient } = clients;

  if (!storageNodes?.length || !signer) {
    return false;
  }

  try {
    // Determine current stream version (for optimistic concurrency)
    let version = 0;
    if (kvClient) {
      try {
        const last = await kvClient.getLast(streamId, 0, 1);
        if (last?.version !== undefined) {
          version = last.version + 1;
        }
      } catch {
        // Stream might be empty — version=0 is fine
      }
    }

    // Resolve flow contract address from storage node status
    const status = await storageNodes[0].getStatus();
    const flow = getFlowContract(status.networkIdentity.flowAddress, signer as any);

    // Build and submit the batch
    const batcher = new Batcher(version, storageNodes, flow, providerUrl);
    batcher.streamDataBuilder.set(streamId, key, data);

    const [, err] = await batcher.exec();
    if (err) throw err;

    return true;
  } catch (err) {
    console.warn("[0G KV] Batch write failed:", (err as Error).message ?? err);
    return false;
  }
}
