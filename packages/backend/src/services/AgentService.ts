import { ethers } from "ethers";
import { contracts } from "../config/contracts.js";
import { initialize0GClients, kvBatchWrite } from "../config/og.js";
import { hashContent } from "../utils/encryption.js";
import { writeFileSync, readFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

// ─── User-created agent file persistence ─────────────────────────────────────
// Agents created by real users are persisted here and take priority over mock data.

const DATA_DIR = join(process.cwd(), "data");
const AGENTS_FILE = join(DATA_DIR, "agents.json");

function loadUserAgents(): Map<number, AgentInfo> {
  try {
    if (!existsSync(AGENTS_FILE)) return new Map();
    const raw = readFileSync(AGENTS_FILE, "utf-8");
    const obj = JSON.parse(raw) as Record<string, AgentInfo>;
    const map = new Map<number, AgentInfo>();
    for (const [k, v] of Object.entries(obj)) {
      map.set(parseInt(k, 10), v);
    }
    console.log(`[AgentService] Loaded ${map.size} user agents from file`);
    return map;
  } catch {
    return new Map();
  }
}

function persistUserAgents(): void {
  try {
    mkdirSync(DATA_DIR, { recursive: true });
    const obj: Record<string, AgentInfo> = {};
    for (const [k, v] of userAgents.entries()) {
      obj[String(k)] = v;
    }
    writeFileSync(AGENTS_FILE, JSON.stringify(obj, null, 2), "utf-8");
  } catch (err) {
    console.warn("[AgentService] Agent file persist failed:", (err as Error).message);
  }
}

/** User-created agents — loaded from file on startup, takes priority over mock data */
const userAgents: Map<number, AgentInfo> = loadUserAgents();

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AgentProfile {
  name: string;
  model: string;
  metadataHash: string;
  encryptedURI: string;
  tags?: string[];
}

export interface AgentStats {
  totalInferences: number;
  totalMemories: number;
  trustScore: number;
  level: number;
  lastActiveAt: number;
}

export interface AgentInfo {
  agentId: number;
  owner: string;
  profile: AgentProfile;
  stats: AgentStats;
  soulSignature?: string;  // bytes32 hex string
  price?: string;          // listing price in A0GI (e.g. "0.5")
  source?: "chain" | "mock"; // data source indicator
}

export interface CreateAgentParams {
  name: string;
  model: string;
  metadata?: Record<string, unknown>;
  walletAddress: string;
}

export interface CreateAgentResult {
  agentId: number;
  txHash: string;
  mock?: boolean;
}

// ─── ABI (minimal, matches SealMindINFT.sol exactly) ─────────────────────────

const INFT_ABI = [
  "function createAgent(string name, string model, string metadataHash, string encryptedURI, address to) returns (uint256)",
  "function getAgentInfo(uint256 tokenId) view returns (address owner, tuple(string name, string model, string metadataHash, string encryptedURI, uint256 createdAt) profile, tuple(uint256 totalInferences, uint256 totalMemories, uint256 trustScore, uint8 level, uint256 lastActiveAt) stats)",
  "function getAgentsByOwner(address owner) view returns (uint256[])",
  "function recordInference(uint256 tokenId, uint256 trustDelta)",
  "event AgentCreated(uint256 indexed tokenId, address indexed owner, string name, string model, uint256 timestamp)",
  "function getSoulSignature(uint256 tokenId) view returns (bytes32)",
  "event SoulSignatureGenerated(uint256 indexed tokenId, bytes32 soulSignature)"
];

// ─── Mock data counter (in-process for MVP) ───────────────────────────────────

let mockIdCounter = 11;
const _ts = () => Math.floor(Date.now() / 1000);
const mockAgents: Map<number, AgentInfo> = new Map([
  [1, {
    agentId: 1,
    owner: "0xA1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0",
    profile: { name: "Aria", model: "deepseek-v3", metadataHash: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b", encryptedURI: "", tags: ["chat", "ai", "creative"] } as any,
    stats: { totalInferences: 312, totalMemories: 47, trustScore: 91, level: 4, lastActiveAt: _ts() - 600 },
    soulSignature: "0xariasoulsig0000000000000000000000000000000000000000000000000001",
    price: "1.2"
  }],
  [2, {
    agentId: 2,
    owner: "0xB2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1",
    profile: { name: "Kira", model: "deepseek-v3", metadataHash: "0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c", encryptedURI: "", tags: ["code", "ai"] } as any,
    stats: { totalInferences: 187, totalMemories: 31, trustScore: 78, level: 3, lastActiveAt: _ts() - 1800 },
    soulSignature: "0xkirasoulsig0000000000000000000000000000000000000000000000000002",
    price: "0.5"
  }],
  [3, {
    agentId: 3,
    owner: "0xC3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2",
    profile: { name: "Orion", model: "qwen-2.5-72b", metadataHash: "0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d", encryptedURI: "", tags: ["defi", "ai", "code"] } as any,
    stats: { totalInferences: 524, totalMemories: 89, trustScore: 96, level: 5, lastActiveAt: _ts() - 120 },
    soulSignature: "0xorionsoulsig000000000000000000000000000000000000000000000000003",
    price: "3.0"
  }],
  [4, {
    agentId: 4,
    owner: "0xD4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E3",
    profile: { name: "Nova", model: "deepseek-v3", metadataHash: "0x4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e", encryptedURI: "", tags: ["chat", "creative"] } as any,
    stats: { totalInferences: 98, totalMemories: 14, trustScore: 55, level: 2, lastActiveAt: _ts() - 7200 },
    soulSignature: "0xnovasoulsig0000000000000000000000000000000000000000000000000004",
    price: "0.2"
  }],
  [5, {
    agentId: 5,
    owner: "0xE5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E3F4",
    profile: { name: "Sage", model: "qwen-2.5-72b", metadataHash: "0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f", encryptedURI: "", tags: ["defi", "chat", "ai"] } as any,
    stats: { totalInferences: 433, totalMemories: 62, trustScore: 88, level: 4, lastActiveAt: _ts() - 300 },
    soulSignature: "0xsagesoulsig0000000000000000000000000000000000000000000000000005",
    price: "1.8"
  }],
  [6, {
    agentId: 6,
    owner: "0xF6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E3F4A5",
    profile: { name: "Cipher", model: "deepseek-v3", metadataHash: "0x6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a", encryptedURI: "", tags: ["code", "defi"] } as any,
    stats: { totalInferences: 271, totalMemories: 40, trustScore: 83, level: 3, lastActiveAt: _ts() - 900 },
    soulSignature: "0xciphersoulsig00000000000000000000000000000000000000000000000006",
    price: "0.8"
  }],
  [7, {
    agentId: 7,
    owner: "0xA7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E3F4A5B6",
    profile: { name: "Echo", model: "deepseek-v3", metadataHash: "0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b", encryptedURI: "", tags: ["chat"] } as any,
    stats: { totalInferences: 45, totalMemories: 8, trustScore: 32, level: 1, lastActiveAt: _ts() - 86400 },
    soulSignature: "0xechosoulsig0000000000000000000000000000000000000000000000000007",
    price: "0.1"
  }],
  [8, {
    agentId: 8,
    owner: "0xB8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E3F4A5B6C7",
    profile: { name: "Flux", model: "qwen-2.5-72b", metadataHash: "0x8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c", encryptedURI: "", tags: ["creative", "ai", "chat"] } as any,
    stats: { totalInferences: 156, totalMemories: 25, trustScore: 67, level: 2, lastActiveAt: _ts() - 3600 },
    soulSignature: "0xfluxsoulsig0000000000000000000000000000000000000000000000000008",
    price: "0.35"
  }],
  [9, {
    agentId: 9,
    owner: "0xC9D0E1F2A3B4C5D6E7F8A9B0C1D2E3F4A5B6C7D8",
    profile: { name: "Vega", model: "deepseek-v3", metadataHash: "0x9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d", encryptedURI: "", tags: ["defi", "code", "ai"] } as any,
    stats: { totalInferences: 389, totalMemories: 55, trustScore: 92, level: 4, lastActiveAt: _ts() - 450 },
    soulSignature: "0xvegasoulsig0000000000000000000000000000000000000000000000000009",
    price: "2.5"
  }],
  [10, {
    agentId: 10,
    owner: "0xD0E1F2A3B4C5D6E7F8A9B0C1D2E3F4A5B6C7D8E9",
    profile: { name: "Lyra", model: "qwen-2.5-72b", metadataHash: "0x0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e", encryptedURI: "", tags: ["creative", "chat", "ai", "defi"] } as any,
    stats: { totalInferences: 612, totalMemories: 103, trustScore: 99, level: 5, lastActiveAt: _ts() - 60 },
    soulSignature: "0xlyrasoulsig000000000000000000000000000000000000000000000000000a",
    price: "5.0"
  }]
]);

// ─── TTL Cache (avoid repeated RPC calls) ─────────────────────────────────────
const CACHE_TTL_MS = 60_000; // 60 seconds
const RPC_TIMEOUT_MS = 8_000; // 8s max for any single RPC call — fallback to mock if exceeded

interface CacheEntry { data: AgentInfo; expiresAt: number; }
const agentCache: Map<number, CacheEntry> = new Map();
const ownerCache: Map<string, { ids: number[]; expiresAt: number }> = new Map();

// List-level cache: cache the full paginated result so repeated loads are instant
interface ListCacheEntry { data: { agents: AgentInfo[]; total: number }; expiresAt: number; }
const listCache: Map<string, ListCacheEntry> = new Map();

/**
 * Compute trust score from real stats instead of hardcoding.
 * Formula: min(100, inference_factor + memory_factor + level_factor)
 *   - inference_factor: min(40, totalInferences * 0.1)
 *   - memory_factor:    min(30, totalMemories * 0.5)
 *   - level_factor:     level * 6
 */
function computeTrustScore(stats: { totalInferences: number; totalMemories: number; level: number }): number {
  const inferenceFactor = Math.min(40, stats.totalInferences * 0.1);
  const memoryFactor    = Math.min(30, stats.totalMemories * 0.5);
  const levelFactor     = stats.level * 6;
  return Math.min(100, Math.round(inferenceFactor + memoryFactor + levelFactor));
}

/** Wraps a promise with a hard timeout — rejects if not resolved in time */
function withTimeout<T>(promise: Promise<T>, ms: number, label = "RPC"): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    )
  ]);
}

function getCachedAgent(agentId: number): AgentInfo | null {
  const entry = agentCache.get(agentId);
  if (entry && Date.now() < entry.expiresAt) return entry.data;
  return null;
}
function setCachedAgent(agentId: number, data: AgentInfo) {
  agentCache.set(agentId, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}
export function invalidateAgentCache(agentId: number) {
  agentCache.delete(agentId);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getContract(): Promise<ethers.Contract | null> {
  if (!contracts.inft) return null;
  const clients = await initialize0GClients();
  if (!clients.signer) return null;
  return new ethers.Contract(contracts.inft, INFT_ABI, clients.signer);
}

// ─── 0G Storage metadata upload ───────────────────────────────────────────────

async function uploadMetadataTo0G(metadata: Record<string, unknown>): Promise<string> {
  try {
    const clients = await initialize0GClients();
    const metadataStr = JSON.stringify(metadata);
    const { keccak256, toUtf8Bytes } = ethers;
    const metadataHash = keccak256(toUtf8Bytes(metadataStr));

    if (!clients.kvReady || !clients.signer) {
      console.warn("[AgentService] 0G KV not ready, using local keccak256 hash");
      return metadataHash;
    }

    // Persist metadata to 0G KV storage asynchronously
    const streamId = keccak256(toUtf8Bytes(`SealMind:AgentMetadata:${String(metadata.name ?? "unknown")}`));
    const key = new TextEncoder().encode(`metadata:${metadataHash}`);
    const data = new TextEncoder().encode(metadataStr);

    // Fire-and-forget — don't block agent creation on storage write
    kvBatchWrite(clients, streamId, key, data).then((ok) => {
      if (ok) {
        console.log(`[AgentService] Metadata persisted to 0G KV, hash: ${metadataHash}`);
      } else {
        console.warn("[AgentService] 0G KV write returned false (nodes unavailable)");
      }
    }).catch((err: unknown) => {
      console.warn("[AgentService] 0G KV write error:", err);
    });

    console.log(`[AgentService] Metadata hash computed, 0G KV write initiated: ${metadataHash}`);
    return metadataHash;
  } catch (err) {
    console.warn("[AgentService] uploadMetadataTo0G failed, falling back to local hash:", err);
    const { keccak256, toUtf8Bytes } = ethers;
    return keccak256(toUtf8Bytes(JSON.stringify(metadata)));
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export async function createAgent(params: CreateAgentParams): Promise<CreateAgentResult> {
  const { name, model, metadata = {}, walletAddress } = params;
  const fullMetadata = { ...metadata, name, model };
  const metadataHash = await uploadMetadataTo0G(fullMetadata);

  try {
    const contract = await getContract();
    if (contract) {
      const tx = await contract.createAgent(
        name,
        model,
        metadataHash,   // string (keccak256 hex)
        "",             // encryptedURI (empty for now)
        walletAddress
      );
      const receipt = await tx.wait();
      // Parse AgentCreated event to get tokenId
      const agentCreatedEvent = receipt.logs
        .map((log: ethers.Log) => {
          try { return contract.interface.parseLog(log); } catch { return null; }
        })
        .find((e: ethers.LogDescription | null) => e?.name === "AgentCreated");

      const agentId = agentCreatedEvent ? Number(agentCreatedEvent.args[0]) : Date.now();
      // Persist on-chain created agent so it survives backend restarts
      const chainAgent: AgentInfo = {
        agentId,
        owner: walletAddress,
        profile: { name, model, metadataHash, encryptedURI: "" },
        stats: { totalInferences: 0, totalMemories: 0, trustScore: computeTrustScore({ totalInferences: 0, totalMemories: 0, level: 1 }), level: 1, lastActiveAt: Date.now() },
        source: "chain",
      };
      userAgents.set(agentId, chainAgent);
      persistUserAgents();
      return { agentId, txHash: receipt.hash };
    }
  } catch (err) {
    console.warn("[AgentService] Contract call failed, falling back to mock:", err);
  }

  // Mock fallback
  const agentId = mockIdCounter++;
  const agent: AgentInfo = {
    agentId,
    owner: walletAddress,
    profile: { name, model, metadataHash, encryptedURI: "" },
    stats: { totalInferences: 0, totalMemories: 0, trustScore: computeTrustScore({ totalInferences: 0, totalMemories: 0, level: 1 }), level: 1, lastActiveAt: Date.now() },
    source: "mock",
  };
  // Save to userAgents so this agent survives restarts and isn't overwritten by hardcoded mocks
  userAgents.set(agentId, agent);
  mockAgents.set(agentId, agent);
  persistUserAgents();
  return { agentId, txHash: `0xmock_${Date.now().toString(16)}`, mock: true };
}

export async function getAgent(agentId: number): Promise<AgentInfo | null> {
  // Check cache first
  const cached = getCachedAgent(agentId);
  if (cached) return cached;

  try {
    const contract = await getContract();
    if (contract) {
      const [owner, profile, stats] = await withTimeout(
        contract.getAgentInfo(agentId),
        RPC_TIMEOUT_MS,
        `getAgentInfo(${agentId})`
      );
      const result: AgentInfo = {
        agentId,
        owner,
        profile: {
          name: profile.name,
          model: profile.model,
          metadataHash: profile.metadataHash,
          encryptedURI: profile.encryptedURI
        },
        stats: {
          totalInferences: Number(stats.totalInferences),
          totalMemories: Number(stats.totalMemories),
          trustScore: Number(stats.trustScore) || computeTrustScore({
            totalInferences: Number(stats.totalInferences),
            totalMemories: Number(stats.totalMemories),
            level: Number(stats.level)
          }),
          level: Number(stats.level),
          lastActiveAt: Number(stats.lastActiveAt)
        },
        source: "chain",
      };
      // 尝试读取灵魂签名
      try {
        const sig = await contract.getSoulSignature(agentId);
        result.soulSignature = sig;
      } catch {
        // 旧版合约可能没有此函数，忽略
      }
      setCachedAgent(agentId, result);
      return result;
    }
  } catch (err) {
    console.warn("[AgentService] getAgentInfo failed, using mock:", err);
  }

  // User-created agents take priority over hardcoded mock data
  const userAgent = userAgents.get(agentId);
  if (userAgent) {
    setCachedAgent(agentId, userAgent);
    return userAgent;
  }

  const mock = mockAgents.get(agentId) ?? null;
  if (mock) setCachedAgent(agentId, mock);
  return mock;
}

export async function getAgentsByOwner(address: string): Promise<AgentInfo[]> {
  // Check owner cache
  const ownerEntry = ownerCache.get(address.toLowerCase());
  if (ownerEntry && Date.now() < ownerEntry.expiresAt) {
    const infos = await Promise.all(ownerEntry.ids.map((id) => getAgent(id)));
    return infos.filter((a): a is AgentInfo => a !== null);
  }

  try {
    const contract = await getContract();
    if (contract) {
      const ids: bigint[] = await withTimeout(
        contract.getAgentsByOwner(address),
        RPC_TIMEOUT_MS,
        "getAgentsByOwner"
      );
      const numIds = ids.map(Number);
      ownerCache.set(address.toLowerCase(), { ids: numIds, expiresAt: Date.now() + CACHE_TTL_MS });
      const infos = await Promise.all(numIds.map((id) => getAgent(id)));
      return infos.filter((a): a is AgentInfo => a !== null);
    }
  } catch (err) {
    console.warn("[AgentService] getAgentsByOwner failed, using mock:", err);
  }

  // Mock fallback
  return Array.from(mockAgents.values()).filter(
    (a) => a.owner.toLowerCase() === address.toLowerCase()
  );
}

// ─── Delete Agent (mock only — on-chain NFTs can't be burned by this service) ──

const deletedAgentIds: Set<number> = new Set();

export async function deleteAgent(agentId: number, walletAddress: string): Promise<void> {
  // For on-chain agents: mark as deleted in local set (INFT burn requires owner tx)
  // For mock agents: remove from map
  const agent = mockAgents.get(agentId);
  if (agent) {
    if (agent.owner.toLowerCase() !== walletAddress.toLowerCase()) {
      throw new Error("Not authorized: you don't own this agent");
    }
    mockAgents.delete(agentId);
    invalidateAgentCache(agentId);
    ownerCache.delete(walletAddress.toLowerCase());
    return;
  }
  // For chain agents: add to deleted set and clear cache so it won't show up
  deletedAgentIds.add(agentId);
  invalidateAgentCache(agentId);
  ownerCache.delete(walletAddress.toLowerCase());
}

export function isDeleted(agentId: number): boolean {
  return deletedAgentIds.has(agentId);
}

// ─── Registry ABI (minimal, matches AgentRegistry.sol) ────────────────────────

const REGISTRY_ABI = [
  "function getPublicAgents(uint256 offset, uint256 limit) view returns (uint256[] result, uint256 total)",
  "function getTotalAgents() view returns (uint256)",
];

async function getRegistryContract(): Promise<ethers.Contract | null> {
  if (!contracts.registry) return null;
  const clients = await initialize0GClients();
  if (!clients.signer) return null;
  return new ethers.Contract(contracts.registry, REGISTRY_ABI, clients.signer);
}

export async function listPublicAgents(
  offset = 0,
  limit = 20
): Promise<{ agents: AgentInfo[]; total: number }> {
  // Check list-level cache first
  const cacheKey = `${offset}:${limit}`;
  const cached = listCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  // Try on-chain AgentRegistry first — with strict timeout
  try {
    const registryContract = await getRegistryContract();
    if (registryContract) {
      const [ids, total]: [bigint[], bigint] = await withTimeout(
        registryContract.getPublicAgents(offset, limit),
        RPC_TIMEOUT_MS,
        "getPublicAgents"
      );
      const numIds = ids.map(Number);
      if (numIds.length > 0) {
        // Fetch agent details with per-item timeout, collect all in parallel
        const infos = await Promise.all(numIds.map((id) => getAgent(id)));
        const agents = infos.filter((a): a is AgentInfo => a !== null).map((a) => {
          // Enrich chain agents with mock display data (tags, price) if available
          const mock = mockAgents.get(a.agentId);
          if (mock) {
            if (!a.profile.tags?.length && mock.profile.tags?.length) {
              a.profile.tags = mock.profile.tags;
            }
            if (!a.price && mock.price) a.price = mock.price;
          }
          // Default tags based on model if still none
          if (!a.profile.tags?.length) {
            a.profile.tags = ["ai", "chat"];
          }
          if (!a.price) a.price = "0.5";
          return a;
        });
        const result = { agents, total: Number(total) };
        listCache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
        return result;
      }
    }
  } catch (err) {
    console.warn("[AgentService] AgentRegistry.getPublicAgents failed, falling back to mock:", err);
  }

  // Fallback: return all known mock agents paginated
  const all = Array.from(mockAgents.values());
  const page = all.slice(offset, offset + limit);
  const result = { agents: page, total: all.length };
  listCache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
  return result;
}
