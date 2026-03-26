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
  totalDecisions: number;
  lastActive: number;
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

// ─── ABI (minimal) ────────────────────────────────────────────────────────────

const INFT_ABI = [
  "function createAgent(string name, string model, bytes32 metadataHash, string encryptedURI, address to) returns (uint256)",
  "function getAgentInfo(uint256 tokenId) view returns (address owner, tuple(string name, string model, bytes32 metadataHash, string encryptedURI) profile, tuple(uint256 totalDecisions, uint256 lastActive) stats)",
  "function getAgentsByOwner(address owner) view returns (uint256[])"
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
        ethers.getBytes(metadataHash),
        "",
        walletAddress
      );
      const receipt = await tx.wait();
      // The token ID is typically emitted in a Transfer event (ERC-721)
      const transferEvent = receipt.logs
        .map((log: ethers.Log) => {
          try {
            return contract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((e: ethers.LogDescription | null) => e?.name === "Transfer");

      const agentId = transferEvent ? Number(transferEvent.args[2]) : Date.now();
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
    stats: { totalDecisions: 0, lastActive: Date.now() }
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
          metadataHash: ethers.hexlify(profile.metadataHash),
          encryptedURI: profile.encryptedURI
        },
        stats: {
          totalDecisions: Number(stats.totalDecisions),
          lastActive: Number(stats.lastActive)
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
