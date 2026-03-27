import { ethers } from "ethers";
import { contracts } from "../config/contracts.js";
import { initialize0GClients } from "../config/og.js";
import { hashContent } from "../utils/encryption.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AgentProfile {
  name: string;
  model: string;
  metadataHash: string;
  encryptedURI: string;
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
  "event AgentCreated(uint256 indexed tokenId, address indexed owner, string name, string model, uint256 timestamp)"
];

// ─── Mock data counter (in-process for MVP) ───────────────────────────────────

let mockIdCounter = 1;
const mockAgents: Map<number, AgentInfo> = new Map();

// ─── TTL Cache (avoid repeated RPC calls) ─────────────────────────────────────
const CACHE_TTL_MS = 30_000; // 30 seconds
interface CacheEntry { data: AgentInfo; expiresAt: number; }
const agentCache: Map<number, CacheEntry> = new Map();
const ownerCache: Map<string, { ids: number[]; expiresAt: number }> = new Map();

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

// ─── Service ──────────────────────────────────────────────────────────────────

export async function createAgent(params: CreateAgentParams): Promise<CreateAgentResult> {
  const { name, model, metadata = {}, walletAddress } = params;
  const metadataJson = JSON.stringify({ ...metadata, name, model });
  const metadataHash = hashContent(metadataJson);

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
    stats: { totalInferences: 0, totalMemories: 0, trustScore: 0, level: 1, lastActiveAt: Date.now() }
  };
  mockAgents.set(agentId, agent);
  return { agentId, txHash: `0xmock_${Date.now().toString(16)}`, mock: true };
}

export async function getAgent(agentId: number): Promise<AgentInfo | null> {
  // Check cache first
  const cached = getCachedAgent(agentId);
  if (cached) return cached;

  try {
    const contract = await getContract();
    if (contract) {
      const [owner, profile, stats] = await contract.getAgentInfo(agentId);
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
          trustScore: Number(stats.trustScore),
          level: Number(stats.level),
          lastActiveAt: Number(stats.lastActiveAt)
        }
      };
      setCachedAgent(agentId, result);
      return result;
    }
  } catch (err) {
    console.warn("[AgentService] getAgentInfo failed, using mock:", err);
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
      const ids: bigint[] = await contract.getAgentsByOwner(address);
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
  // Try on-chain AgentRegistry first
  try {
    const registryContract = await getRegistryContract();
    if (registryContract) {
      const [ids, total]: [bigint[], bigint] = await registryContract.getPublicAgents(offset, limit);
      const numIds = ids.map(Number);
      const infos = await Promise.all(numIds.map((id) => getAgent(id)));
      const agents = infos.filter((a): a is AgentInfo => a !== null);
      return { agents, total: Number(total) };
    }
  } catch (err) {
    console.warn("[AgentService] AgentRegistry.getPublicAgents failed, falling back to mock:", err);
  }

  // Fallback: return all known mock agents paginated
  const all = Array.from(mockAgents.values());
  const page = all.slice(offset, offset + limit);
  return { agents: page, total: all.length };
}
