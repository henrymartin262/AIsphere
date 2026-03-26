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
  try {
    const contract = await getContract();
    if (contract) {
      const [owner, profile, stats] = await contract.getAgentInfo(agentId);
      return {
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
    }
  } catch (err) {
    console.warn("[AgentService] getAgentInfo failed, using mock:", err);
  }

  return mockAgents.get(agentId) ?? null;
}

export async function getAgentsByOwner(address: string): Promise<AgentInfo[]> {
  try {
    const contract = await getContract();
    if (contract) {
      const ids: bigint[] = await contract.getAgentsByOwner(address);
      const infos = await Promise.all(ids.map((id) => getAgent(Number(id))));
      return infos.filter((a): a is AgentInfo => a !== null);
    }
  } catch (err) {
    console.warn("[AgentService] getAgentsByOwner failed, using mock:", err);
  }

  // Mock fallback: return all mock agents owned by address
  return Array.from(mockAgents.values()).filter(
    (a) => a.owner.toLowerCase() === address.toLowerCase()
  );
}

export async function listPublicAgents(
  offset = 0,
  limit = 20
): Promise<{ agents: AgentInfo[]; total: number }> {
  // In production this would call an AgentRegistry contract.
  // For MVP, return all known mock agents paginated.
  const all = Array.from(mockAgents.values());
  const page = all.slice(offset, offset + limit);
  return { agents: page, total: all.length };
}
