import { ethers } from "ethers";
import { contracts } from "../config/contracts.js";
import { initialize0GClients, kvBatchWrite } from "../config/og.js";
import { deriveAgentKey, encryptMemory, hashContent } from "../utils/encryption.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export enum ExperienceType {
  INFERENCE    = "inference",
  BOUNTY       = "bounty",
  INTERACTION  = "interaction",
  KNOWLEDGE    = "knowledge",
  ERROR        = "error",
  TRADE        = "trade",
}

export interface AgentExperience {
  id: string;
  agentId: number;
  type: ExperienceType;
  category: string;       // e.g. "defi_analysis", "code_review"
  content: string;        // plaintext (encrypted before storage)
  context: string;        // context in which the experience arose
  outcome: "success" | "failure" | "neutral";
  importance: number;     // 0-1
  learnings: string[];    // key takeaways
  timestamp: number;
  relatedDecisionHash?: string;
}

export interface SoulState {
  currentHash: string;      // current experience hash chain head
  experienceCount: number;
  lastExperienceAt: number;
}

// ─── ABI ─────────────────────────────────────────────────────────────────────

const SOUL_ABI = [
  "function recordExperience(uint256 tokenId, bytes32 experienceHash)",
  "function getSoulState(uint256 tokenId) view returns (tuple(bytes32 currentHash, uint256 experienceCount, uint256 lastExperienceAt))",
  "function soulSignatures(uint256 tokenId) view returns (bytes32)",
  "event ExperienceRecorded(uint256 indexed tokenId, bytes32 experienceHash, bytes32 newSoulHash, uint256 experienceCount)",
];

// ─── In-memory store (fallback) ───────────────────────────────────────────────

const mockSoulStates  = new Map<number, SoulState>();
const mockExperiences = new Map<number, AgentExperience[]>();

function genId(): string {
  return `exp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function computeExperienceHash(exp: AgentExperience): string {
  return hashContent(`${exp.type}:${exp.category}:${exp.outcome}:${exp.importance}:${exp.timestamp}`);
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class SoulService {
  private inftContract: ethers.Contract | null = null;

  async init() {
    try {
      const clients = await initialize0GClients();
      if (clients?.signer && contracts.inft) {
        this.inftContract = new ethers.Contract(contracts.inft, SOUL_ABI, clients.signer);
      }
    } catch {
      console.warn("[SoulService] Running in mock mode");
    }
  }

  /**
   * Record a new experience for an agent.
   * Encrypts the full content in 0G Storage and only posts the hash on-chain.
   */
  async recordExperience(
    agentId: number,
    experienceData: Omit<AgentExperience, "id" | "agentId" | "timestamp">
  ): Promise<{ experienceId: string; experienceHash: string; newSoulHash?: string; txHash?: string; mock?: boolean }> {

    const experience: AgentExperience = {
      ...experienceData,
      id: genId(),
      agentId,
      timestamp: Math.floor(Date.now() / 1000),
    };

    // Build deterministic hash from key fields (not from content — privacy)
    const experienceHash = computeExperienceHash(experience);

    // Try to store encrypted experience in 0G KV
    try {
      const clients = await initialize0GClients();
      if (clients?.kvReady) {
        const key = deriveAgentKey("soul-service", agentId);
        const { encryptedData, iv } = encryptMemory(JSON.stringify(experience), key);
        const streamId = ethers.keccak256(ethers.toUtf8Bytes(`SealMind:Soul:${agentId}`));
        const kvKey = new TextEncoder().encode(`soul:experience:${experience.id}`);
        const kvData = new TextEncoder().encode(JSON.stringify({ encryptedData, iv, experienceHash }));

        // Fire-and-forget — don't block on storage write
        kvBatchWrite(clients, streamId, kvKey, kvData)
          .then(ok => {
            if (ok) console.log(`[SoulService] Experience ${experience.id} persisted to 0G KV`);
          })
          .catch(err => console.warn("[SoulService] 0G KV write failed:", err));

        // Also persist the experience index
        const indexKey = new TextEncoder().encode("soul:experience_index");
        const allExps = mockExperiences.get(agentId) ?? [];
        const index = [...allExps, experience].map(e => ({ id: e.id, type: e.type, timestamp: e.timestamp }));
        const indexData = new TextEncoder().encode(JSON.stringify(index));
        kvBatchWrite(clients, streamId, indexKey, indexData).catch(() => {});
      }
    } catch { /* non-critical */ }

    // Store in mock map always (for retrieval)
    const list = mockExperiences.get(agentId) ?? [];
    list.push(experience);
    mockExperiences.set(agentId, list);

    // Post hash on-chain (or update mock soul state)
    let newSoulHash: string | undefined;
    let txHash: string | undefined;
    let mock = true;

    if (this.inftContract) {
      try {
        const tx = await this.inftContract.recordExperience(agentId, experienceHash);
        const receipt = await tx.wait();
        txHash = receipt?.hash ?? tx.hash;
        mock = false;

        // Read updated soul state
        const state = await this.inftContract.getSoulState(agentId);
        newSoulHash = state.currentHash;
      } catch (err) {
        console.warn("[SoulService] On-chain recordExperience failed:", err);
      }
    }

    if (mock) {
      // Simulate hash chain locally
      const prev = mockSoulStates.get(agentId);
      const prevHash = prev?.currentHash ?? ethers.keccak256(ethers.toUtf8Bytes(`soul-init-${agentId}`));
      newSoulHash = ethers.keccak256(
        ethers.solidityPacked(["bytes32", "bytes32"], [prevHash, experienceHash])
      );
      mockSoulStates.set(agentId, {
        currentHash: newSoulHash,
        experienceCount: (prev?.experienceCount ?? 0) + 1,
        lastExperienceAt: experience.timestamp,
      });
      txHash = `mock-exp-${agentId}-${experience.id}`;
    }

    return { experienceId: experience.id, experienceHash, newSoulHash, txHash, mock };
  }

  /**
   * Get current soul state (chain head) for an agent
   */
  async getSoulState(agentId: number): Promise<SoulState> {
    if (this.inftContract) {
      try {
        const s = await this.inftContract.getSoulState(agentId);
        return {
          currentHash:      s.currentHash,
          experienceCount:  Number(s.experienceCount),
          lastExperienceAt: Number(s.lastExperienceAt),
        };
      } catch { /* fallthrough */ }
    }

    return mockSoulStates.get(agentId) ?? {
      currentHash: ethers.keccak256(ethers.toUtf8Bytes(`soul-init-${agentId}`)),
      experienceCount: 0,
      lastExperienceAt: Math.floor(Date.now() / 1000),
    };
  }

  /**
   * Return decrypted experience history (from mock/local store)
   */
  async getExperienceHistory(
    agentId: number,
    options: { type?: ExperienceType; limit?: number; offset?: number } = {}
  ): Promise<AgentExperience[]> {
    let list = mockExperiences.get(agentId) ?? [];

    if (options.type) list = list.filter(e => e.type === options.type);

    // Sort descending by timestamp
    list = [...list].sort((a, b) => b.timestamp - a.timestamp);

    const offset = options.offset ?? 0;
    const limit  = options.limit  ?? 50;
    return list.slice(offset, offset + limit);
  }

  /**
   * Export an anonymized soul digest (no raw content, just stats + categories)
   */
  async exportSoulDigest(agentId: number): Promise<{
    agentId: number;
    soulState: SoulState;
    experienceCount: number;
    categoryCounts: Record<string, number>;
    outcomeCounts: { success: number; failure: number; neutral: number };
    topLearnings: string[];
  }> {
    const soulState = await this.getSoulState(agentId);
    const experiences = await this.getExperienceHistory(agentId, { limit: 500 });

    const categoryCounts: Record<string, number> = {};
    const outcomeCounts = { success: 0, failure: 0, neutral: 0 };
    const allLearnings: string[] = [];

    for (const exp of experiences) {
      categoryCounts[exp.category] = (categoryCounts[exp.category] ?? 0) + 1;
      outcomeCounts[exp.outcome]++;
      allLearnings.push(...exp.learnings);
    }

    // Top learnings: deduplicated, most frequent
    const learningFreq: Record<string, number> = {};
    for (const l of allLearnings) {
      learningFreq[l] = (learningFreq[l] ?? 0) + 1;
    }
    const topLearnings = Object.entries(learningFreq)
      .sort(([,a],[,b]) => b - a)
      .slice(0, 5)
      .map(([k]) => k);

    return {
      agentId,
      soulState,
      experienceCount: experiences.length,
      categoryCounts,
      outcomeCounts,
      topLearnings,
    };
  }

  /**
   * Verify soul integrity by re-computing the hash chain from stored experiences
   */
  async verifySoulIntegrity(agentId: number): Promise<{
    valid: boolean;
    computedHash: string;
    onChainHash: string;
    experienceCount: number;
  }> {
    const onChainState = await this.getSoulState(agentId);
    const experiences  = await this.getExperienceHistory(agentId, { limit: 1000 });

    // Re-compute chain from scratch
    let currentHash = ethers.keccak256(ethers.toUtf8Bytes(`soul-init-${agentId}`));
    const sorted = [...experiences].sort((a, b) => a.timestamp - b.timestamp);

    for (const exp of sorted) {
      const expHash = computeExperienceHash(exp);
      currentHash = ethers.keccak256(
        ethers.solidityPacked(["bytes32", "bytes32"], [currentHash, expHash])
      );
    }

    return {
      valid: currentHash === onChainState.currentHash || experiences.length === 0,
      computedHash: currentHash,
      onChainHash: onChainState.currentHash,
      experienceCount: sorted.length,
    };
  }
}

export const soulService = new SoulService();
