import { ethers } from "ethers";
import { contracts } from "../config/contracts.js";
import { initialize0GClients } from "../config/og.js";
import type { InferenceProof } from "./SealedInferenceService.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Decision {
  id: string;
  agentId: number;
  inputHash: string;
  outputHash: string;
  modelHash: string;
  importance: number;
  timestamp: number;
  onChain: boolean;
  txHash?: string;
  proofHash: string;
}

export interface DecisionStats {
  total: number;
  onChain: number;
  batched: number;
  local: number;
}

// ─── ABI (minimal) ────────────────────────────────────────────────────────────

const DECISION_CHAIN_ABI = [
  "function recordDecision(uint256 agentId, bytes32 inputHash, bytes32 outputHash, bytes32 modelHash, uint8 importance) returns (bytes32)",
  "function verifyProof(bytes32 proofHash) view returns (bool)",
  "function getDecisionCount(uint256 agentId) view returns (uint256)",
  "function getRecentDecisions(uint256 agentId, uint256 page, uint256 limit) view returns (tuple(bytes32 inputHash, bytes32 outputHash, bytes32 modelHash, uint8 importance, uint256 timestamp)[] decisions, uint256 total)"
];

// ─── In-memory store ──────────────────────────────────────────────────────────

const decisionStore: Map<number, Decision[]> = new Map();
const batchQueue: Decision[] = [];
const BATCH_SIZE = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDecisions(agentId: number): Decision[] {
  if (!decisionStore.has(agentId)) decisionStore.set(agentId, []);
  return decisionStore.get(agentId)!;
}

async function getContract(): Promise<ethers.Contract | null> {
  if (!contracts.decisionChain) return null;
  const clients = await initialize0GClients();
  if (!clients.signer) return null;
  return new ethers.Contract(contracts.decisionChain, DECISION_CHAIN_ABI, clients.signer);
}

async function submitToChain(
  decision: Decision
): Promise<{ txHash: string } | null> {
  try {
    const contract = await getContract();
    if (!contract) return null;

    const tx = await contract.recordDecision(
      decision.agentId,
      ethers.getBytes(decision.inputHash),
      ethers.getBytes(decision.outputHash),
      ethers.getBytes(decision.modelHash),
      decision.importance
    );
    const receipt = await tx.wait();
    return { txHash: receipt.hash };
  } catch (err) {
    console.warn("[DecisionChain] recordDecision failed:", err);
    return null;
  }
}

async function flushBatch(): Promise<void> {
  const toFlush = batchQueue.splice(0, batchQueue.length);
  for (const decision of toFlush) {
    const result = await submitToChain(decision);
    if (result) {
      decision.onChain = true;
      decision.txHash = result.txHash;
    }
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export async function recordDecision(
  agentId: number,
  proof: InferenceProof,
  importance: number
): Promise<Decision> {
  const decision: Decision = {
    id: proof.proofHash,
    agentId,
    inputHash: proof.inputHash,
    outputHash: proof.outputHash,
    modelHash: proof.modelHash,
    importance,
    timestamp: proof.timestamp,
    onChain: false,
    proofHash: proof.proofHash
  };

  getDecisions(agentId).unshift(decision);

  if (importance >= 4) {
    // High importance: submit immediately
    const result = await submitToChain(decision);
    if (result) {
      decision.onChain = true;
      decision.txHash = result.txHash;
    }
  } else if (importance === 3) {
    // Medium importance: queue for batch
    batchQueue.push(decision);
    if (batchQueue.length >= BATCH_SIZE) {
      await flushBatch();
    }
  }
  // importance <= 2: local only

  return decision;
}

export async function verifyProof(proofHash: string): Promise<boolean> {
  try {
    const contract = await getContract();
    if (contract) {
      return await contract.verifyProof(ethers.getBytes(proofHash));
    }
  } catch (err) {
    console.warn("[DecisionChain] verifyProof failed:", err);
  }

  // Fallback: check in-memory store
  for (const decisions of decisionStore.values()) {
    if (decisions.some((d) => d.proofHash === proofHash)) return true;
  }
  return false;
}

export async function getDecisionList(
  agentId: number,
  page = 1,
  limit = 20
): Promise<{ decisions: Decision[]; total: number; page: number; limit: number }> {
  try {
    const contract = await getContract();
    if (contract) {
      const [chainDecisions, total] = await contract.getRecentDecisions(agentId, page, limit);
      const decisions: Decision[] = chainDecisions.map(
        (d: {
          inputHash: Uint8Array;
          outputHash: Uint8Array;
          modelHash: Uint8Array;
          importance: bigint;
          timestamp: bigint;
        }) => ({
          id: ethers.hexlify(d.inputHash),
          agentId,
          inputHash: ethers.hexlify(d.inputHash),
          outputHash: ethers.hexlify(d.outputHash),
          modelHash: ethers.hexlify(d.modelHash),
          importance: Number(d.importance),
          timestamp: Number(d.timestamp) * 1000,
          onChain: true,
          proofHash: ethers.hexlify(d.inputHash)
        })
      );
      return { decisions, total: Number(total), page, limit };
    }
  } catch (err) {
    console.warn("[DecisionChain] getRecentDecisions failed, using local:", err);
  }

  const all = getDecisions(agentId);
  const offset = (page - 1) * limit;
  return {
    decisions: all.slice(offset, offset + limit),
    total: all.length,
    page,
    limit
  };
}

export async function getDecisionStats(agentId: number): Promise<DecisionStats> {
  const local = getDecisions(agentId);
  const onChain = local.filter((d) => d.onChain).length;
  const batched = batchQueue.filter((d) => d.agentId === agentId).length;
  return {
    total: local.length,
    onChain,
    batched,
    local: local.length - onChain - batched
  };
}
