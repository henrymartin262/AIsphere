import { ethers } from "ethers";
import { contracts, BOUNTY_BOARD_ABI } from "../config/contracts.js";
import { initialize0GClients } from "../config/og.js";

const RPC_TIMEOUT_MS = 3_000;
const BOUNTY_CACHE_TTL_MS = 30_000;

interface BountyListCache { data: { bounties: BountyInfo[]; total: number }; expiresAt: number; }
const bountyListCache: Map<string, BountyListCache> = new Map();

function withTimeout<T>(promise: Promise<T>, ms: number, label = "RPC"): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    )
  ]);
}

// ─── Types ────────────────────────────────────────────────────────────────────

export enum BountyStatus {
  Open = 0,
  Assigned = 1,
  Submitted = 2,
  Completed = 3,
  Disputed = 4,
  Expired = 5,
  Cancelled = 6
}

const STATUS_LABELS: Record<number, string> = {
  [BountyStatus.Open]: "Open",
  [BountyStatus.Assigned]: "Assigned",
  [BountyStatus.Submitted]: "Submitted",
  [BountyStatus.Completed]: "Completed",
  [BountyStatus.Disputed]: "Disputed",
  [BountyStatus.Expired]: "Expired",
  [BountyStatus.Cancelled]: "Cancelled"
};

export interface BountyInfo {
  id: number;
  creator: string;
  creatorAgentId: number;
  title: string;
  description: string;
  reward: string;        // wei as string
  rewardEth: string;     // formatted ether
  deadline: number;      // unix timestamp
  criteriaHash: string;
  assignedAgentId: number;
  assignedOwner: string;
  resultProofHash: string;
  status: BountyStatus;
  statusLabel: string;
  parentBountyId: number;
  createdAt: number;
  completedAt: number;
  isExpired: boolean;
  source?: "chain" | "mock"; // data source indicator
}

export interface CreateBountyParams {
  title: string;
  description: string;
  deadline: number;      // unix timestamp
  criteriaHash?: string;
  rewardWei: string;     // amount in wei
  creatorAddress: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

let mockIdCounter = 11;
const _now = () => Math.floor(Date.now() / 1000);
const mockBounties: Map<number, BountyInfo> = new Map([
  [1, {
    id: 1,
    creator: "0xA1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0",
    creatorAgentId: 0,
    title: "Analyze 0G Network Performance Metrics",
    description: "Collect and analyze latency, throughput, and reliability metrics from the 0G testnet over 24 hours. Deliver a structured report with graphs and bottleneck analysis.",
    reward: "100000000000000000",
    rewardEth: "0.1",
    deadline: _now() + 7 * 24 * 3600,
    criteriaHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
    assignedAgentId: 0,
    assignedOwner: "0x0000000000000000000000000000000000000000",
    resultProofHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
    status: BountyStatus.Open,
    statusLabel: "Open",
    parentBountyId: 0,
    createdAt: _now() - 3600,
    completedAt: 0,
    isExpired: false
  }],
  [2, {
    id: 2,
    creator: "0xB2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1",
    creatorAgentId: 0,
    title: "Write Smart Contract Integration Tests",
    description: "Write comprehensive Hardhat tests for the SealMindINFT and BountyBoard contracts, covering all state transitions, edge cases, and reentrancy guards. Target 100% branch coverage.",
    reward: "500000000000000000",
    rewardEth: "0.5",
    deadline: _now() + 3 * 24 * 3600,
    criteriaHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
    assignedAgentId: 3,
    assignedOwner: "0xC3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2",
    resultProofHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
    status: BountyStatus.Assigned,
    statusLabel: "Assigned",
    parentBountyId: 0,
    createdAt: _now() - 7200,
    completedAt: 0,
    isExpired: false
  }],
  [3, {
    id: 3,
    creator: "0xD4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E3",
    creatorAgentId: 0,
    title: "DeFi Yield Strategy Research",
    description: "Research and summarize the top 5 yield farming strategies on 0G-compatible DeFi protocols. Include APY estimates, risk ratings, and smart contract audit status for each.",
    reward: "300000000000000000",
    rewardEth: "0.3",
    deadline: _now() + 5 * 24 * 3600,
    criteriaHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
    assignedAgentId: 0,
    assignedOwner: "0x0000000000000000000000000000000000000000",
    resultProofHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
    status: BountyStatus.Open,
    statusLabel: "Open",
    parentBountyId: 0,
    createdAt: _now() - 10800,
    completedAt: 0,
    isExpired: false
  }],
  [4, {
    id: 4,
    creator: "0xE5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E3F4",
    creatorAgentId: 0,
    title: "Generate Solidity Security Audit Report",
    description: "Perform a thorough security audit of the AgentRegistry.sol contract. Identify any reentrancy risks, integer overflow/underflow issues, access control gaps, and gas optimisation opportunities.",
    reward: "800000000000000000",
    rewardEth: "0.8",
    deadline: _now() + 10 * 24 * 3600,
    criteriaHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
    assignedAgentId: 7,
    assignedOwner: "0xF6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E3F4A5",
    resultProofHash: "0xabc1230000000000000000000000000000000000000000000000000000000000",
    status: BountyStatus.Submitted,
    statusLabel: "Submitted",
    parentBountyId: 0,
    createdAt: _now() - 2 * 24 * 3600,
    completedAt: 0,
    isExpired: false
  }],
  [5, {
    id: 5,
    creator: "0xA7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E3F4A5B6",
    creatorAgentId: 0,
    title: "Build a ChatGPT Plugin for 0G Storage",
    description: "Create a ChatGPT / OpenAI-compatible plugin that allows users to read and write encrypted notes to 0G Storage KV. Must include OpenAPI spec, auth flow, and a working demo.",
    reward: "1500000000000000000",
    rewardEth: "1.5",
    deadline: _now() + 14 * 24 * 3600,
    criteriaHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
    assignedAgentId: 0,
    assignedOwner: "0x0000000000000000000000000000000000000000",
    resultProofHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
    status: BountyStatus.Open,
    statusLabel: "Open",
    parentBountyId: 0,
    createdAt: _now() - 5 * 3600,
    completedAt: 0,
    isExpired: false
  }],
  [6, {
    id: 6,
    creator: "0xB8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E3F4A5B6C7",
    creatorAgentId: 2,
    title: "Translate SealMind Whitepaper to Japanese",
    description: "Professionally translate the SealMind whitepaper (approx. 8,000 words) from English into Japanese. Maintain all technical terminology accuracy and consistent formatting.",
    reward: "200000000000000000",
    rewardEth: "0.2",
    deadline: _now() + 4 * 24 * 3600,
    criteriaHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
    assignedAgentId: 5,
    assignedOwner: "0xC9D0E1F2A3B4C5D6E7F8A9B0C1D2E3F4A5B6C7D8",
    resultProofHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
    status: BountyStatus.Assigned,
    statusLabel: "Assigned",
    parentBountyId: 0,
    createdAt: _now() - 8 * 3600,
    completedAt: 0,
    isExpired: false
  }],
  [7, {
    id: 7,
    creator: "0xD0E1F2A3B4C5D6E7F8A9B0C1D2E3F4A5B6C7D8E9",
    creatorAgentId: 0,
    title: "Create Onboarding Tutorial Video Script",
    description: "Write a detailed script (with scene notes and on-screen text cues) for a 3-minute onboarding video explaining how to create and interact with a SealMind AI Agent.",
    reward: "150000000000000000",
    rewardEth: "0.15",
    deadline: _now() + 6 * 24 * 3600,
    criteriaHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
    assignedAgentId: 0,
    assignedOwner: "0x0000000000000000000000000000000000000000",
    resultProofHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
    status: BountyStatus.Open,
    statusLabel: "Open",
    parentBountyId: 0,
    createdAt: _now() - 1 * 24 * 3600,
    completedAt: 0,
    isExpired: false
  }],
  [8, {
    id: 8,
    creator: "0xE1F2A3B4C5D6E7F8A9B0C1D2E3F4A5B6C7D8E9F0",
    creatorAgentId: 0,
    title: "Benchmark TEE Inference vs Standard API",
    description: "Run 500 identical prompts through both the 0G TeeML endpoint and the standard DeepSeek API. Record latency, cost, and output quality. Produce a Markdown comparison report.",
    reward: "600000000000000000",
    rewardEth: "0.6",
    deadline: _now() + 8 * 24 * 3600,
    criteriaHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
    assignedAgentId: 9,
    assignedOwner: "0xF2A3B4C5D6E7F8A9B0C1D2E3F4A5B6C7D8E9F0A1",
    resultProofHash: "0xdef4560000000000000000000000000000000000000000000000000000000000",
    status: BountyStatus.Completed,
    statusLabel: "Completed",
    parentBountyId: 0,
    createdAt: _now() - 5 * 24 * 3600,
    completedAt: _now() - 12 * 3600,
    isExpired: false
  }],
  [9, {
    id: 9,
    creator: "0xA3B4C5D6E7F8A9B0C1D2E3F4A5B6C7D8E9F0A1B2",
    creatorAgentId: 0,
    title: "Design SealMind Agent Marketplace UI/UX",
    description: "Create Figma mockups for a new Agent Marketplace page. Must include search, tag filters, sort options, agent cards with on-chain stats, and a detail modal. Deliver a clickable prototype.",
    reward: "1000000000000000000",
    rewardEth: "1.0",
    deadline: _now() + 12 * 24 * 3600,
    criteriaHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
    assignedAgentId: 0,
    assignedOwner: "0x0000000000000000000000000000000000000000",
    resultProofHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
    status: BountyStatus.Open,
    statusLabel: "Open",
    parentBountyId: 0,
    createdAt: _now() - 2 * 3600,
    completedAt: 0,
    isExpired: false
  }],
  [10, {
    id: 10,
    creator: "0xB4C5D6E7F8A9B0C1D2E3F4A5B6C7D8E9F0A1B2C3",
    creatorAgentId: 0,
    title: "Multi-language SDK Wrapper (Python)",
    description: "Build a Python SDK wrapper for the SealMind REST API. Must cover agent creation, chat, memory management, and decision verification. Include full docstrings, type hints, and pytest coverage ≥ 80%.",
    reward: "2000000000000000000",
    rewardEth: "2.0",
    deadline: _now() + 20 * 24 * 3600,
    criteriaHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
    assignedAgentId: 0,
    assignedOwner: "0x0000000000000000000000000000000000000000",
    resultProofHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
    status: BountyStatus.Open,
    statusLabel: "Open",
    parentBountyId: 0,
    createdAt: _now() - 30 * 60,
    completedAt: 0,
    isExpired: false
  }]
]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getBountyContract(): Promise<ethers.Contract | null> {
  if (!contracts.bountyBoard) return null;
  const clients = await initialize0GClients();
  if (!clients.signer) return null;
  return new ethers.Contract(contracts.bountyBoard, BOUNTY_BOARD_ABI, clients.signer);
}

function formatBounty(raw: {
  id: bigint;
  creator: string;
  creatorAgentId: bigint;
  title: string;
  description: string;
  reward: bigint;
  deadline: bigint;
  criteriaHash: string;
  assignedAgentId: bigint;
  assignedOwner: string;
  resultProofHash: string;
  status: number | bigint;
  parentBountyId: bigint;
  createdAt: bigint;
  completedAt: bigint;
}): BountyInfo {
  const rewardWei = raw.reward.toString();
  const rewardEth = ethers.formatEther(raw.reward);
  const status = Number(raw.status) as BountyStatus;
  const deadline = Number(raw.deadline);
  const now = Math.floor(Date.now() / 1000);
  const isExpired = deadline < now && status <= BountyStatus.Assigned;

  return {
    id: Number(raw.id),
    creator: raw.creator,
    creatorAgentId: Number(raw.creatorAgentId),
    title: raw.title,
    description: raw.description,
    reward: rewardWei,
    rewardEth,
    deadline,
    criteriaHash: raw.criteriaHash,
    assignedAgentId: Number(raw.assignedAgentId),
    assignedOwner: raw.assignedOwner,
    resultProofHash: raw.resultProofHash,
    status,
    statusLabel: STATUS_LABELS[status] ?? "Unknown",
    parentBountyId: Number(raw.parentBountyId),
    createdAt: Number(raw.createdAt),
    completedAt: Number(raw.completedAt),
    isExpired,
    source: "chain",
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export async function createBounty(
  params: CreateBountyParams
): Promise<{ bountyId: number; txHash: string; mock?: boolean }> {
  const { title, description, deadline, criteriaHash, rewardWei, creatorAddress } = params;
  const criteriaHashBytes = criteriaHash && criteriaHash.startsWith("0x")
    ? criteriaHash
    : ethers.ZeroHash;

  try {
    const contract = await getBountyContract();
    if (contract) {
      const tx = await contract.createBounty(
        title,
        description,
        BigInt(deadline),
        criteriaHashBytes,
        { value: BigInt(rewardWei) }
      );
      const receipt = await tx.wait();
      const bountyCreatedEvent = receipt.logs
        .map((log: ethers.Log) => {
          try { return contract.interface.parseLog(log); } catch { return null; }
        })
        .find((e: ethers.LogDescription | null) => e?.name === "BountyCreated");

      const bountyId = bountyCreatedEvent
        ? Number(bountyCreatedEvent.args[0])
        : Date.now();
      return { bountyId, txHash: receipt.hash };
    }
  } catch (err) {
    console.warn("[BountyService] createBounty contract call failed, falling back to mock:", err);
  }

  // Mock fallback
  const bountyId = mockIdCounter++;
  const now = Math.floor(Date.now() / 1000);
  const reward = rewardWei;
  const isExpired = deadline < now;
  const bounty: BountyInfo = {
    id: bountyId,
    creator: creatorAddress.toLowerCase(),
    creatorAgentId: 0,
    title,
    description,
    reward,
    rewardEth: ethers.formatEther(BigInt(reward)),
    deadline,
    criteriaHash: criteriaHashBytes,
    assignedAgentId: 0,
    assignedOwner: "0x0000000000000000000000000000000000000000",
    resultProofHash: "0x0000000000000000000000000000000000000000000000000000000000000000",
    status: isExpired ? BountyStatus.Expired : BountyStatus.Open,
    statusLabel: isExpired ? "Expired" : "Open",
    parentBountyId: 0,
    createdAt: now,
    completedAt: 0,
    isExpired
  };
  mockBounties.set(bountyId, bounty);
  return { bountyId, txHash: `0xmock_${Date.now().toString(16)}`, mock: true };
}

export async function acceptBounty(
  bountyId: number,
  agentId: number,
  agentOwnerAddress: string
): Promise<{ txHash: string; mock?: boolean }> {
  try {
    const contract = await getBountyContract();
    if (contract) {
      const tx = await contract.acceptBounty(BigInt(bountyId), BigInt(agentId), agentOwnerAddress);
      const receipt = await tx.wait();
      return { txHash: receipt.hash };
    }
  } catch (err) {
    console.warn("[BountyService] acceptBounty contract call failed, falling back to mock:", err);
  }

  // Mock fallback
  const bounty = mockBounties.get(bountyId);
  if (!bounty) throw new Error(`Bounty ${bountyId} not found`);
  const updated: BountyInfo = {
    ...bounty,
    status: BountyStatus.Assigned,
    statusLabel: "Assigned",
    assignedAgentId: agentId,
    assignedOwner: agentOwnerAddress.toLowerCase()
  };
  mockBounties.set(bountyId, updated);
  return { txHash: `0xmock_${Date.now().toString(16)}`, mock: true };
}

export async function submitResult(
  bountyId: number,
  agentOwnerAddress: string,
  resultProofHash: string
): Promise<{ txHash: string; mock?: boolean }> {
  try {
    const contract = await getBountyContract();
    if (contract) {
      const tx = await contract.submitResult(BigInt(bountyId), resultProofHash);
      const receipt = await tx.wait();
      return { txHash: receipt.hash };
    }
  } catch (err) {
    console.warn("[BountyService] submitResult contract call failed, falling back to mock:", err);
  }

  // Mock fallback
  const bounty = mockBounties.get(bountyId);
  if (!bounty) throw new Error(`Bounty ${bountyId} not found`);
  if (bounty.assignedOwner && bounty.assignedOwner !== "0x0000000000000000000000000000000000000000") {
    if (bounty.assignedOwner.toLowerCase() !== agentOwnerAddress.toLowerCase()) {
      throw new Error("Only the assigned agent owner can submit results");
    }
  }
  const updated: BountyInfo = {
    ...bounty,
    status: BountyStatus.Submitted,
    statusLabel: "Submitted",
    resultProofHash
  };
  mockBounties.set(bountyId, updated);
  return { txHash: `0xmock_${Date.now().toString(16)}`, mock: true };
}

export async function approveBounty(
  bountyId: number,
  creatorAddress: string
): Promise<{ txHash: string; mock?: boolean }> {
  try {
    const contract = await getBountyContract();
    if (contract) {
      const tx = await contract.approveBounty(BigInt(bountyId));
      const receipt = await tx.wait();
      // Auto-record bounty experience on-chain success
      const bounty = mockBounties.get(bountyId);
      if (bounty) autoRecordBountyExperience(bounty);
      return { txHash: receipt.hash };
    }
  } catch (err) {
    console.warn("[BountyService] approveBounty contract call failed, falling back to mock:", err);
  }

  // Mock fallback
  const bounty = mockBounties.get(bountyId);
  if (!bounty) throw new Error(`Bounty ${bountyId} not found`);
  if (bounty.creator.toLowerCase() !== creatorAddress.toLowerCase()) {
    throw new Error("Only the bounty creator can approve");
  }
  const now = Math.floor(Date.now() / 1000);
  const updated: BountyInfo = {
    ...bounty,
    status: BountyStatus.Completed,
    statusLabel: "Completed",
    completedAt: now
  };
  mockBounties.set(bountyId, updated);
  autoRecordBountyExperience(updated);
  return { txHash: `0xmock_${Date.now().toString(16)}`, mock: true };
}

// Helper: auto-record BOUNTY experience after completion (non-blocking)
function autoRecordBountyExperience(bounty: BountyInfo): void {
  if (bounty.assignedAgentId > 0) {
    soulService.recordExperience(bounty.assignedAgentId, {
      type: ExperienceType.BOUNTY,
      category: "bounty_completion",
      content: `Completed bounty: "${bounty.title}" for ${bounty.rewardEth} A0GI`,
      context: `Bounty #${bounty.id}, reward: ${bounty.rewardEth} A0GI`,
      outcome: "success",
      importance: Math.min(1, parseFloat(bounty.rewardEth) / 2),
      learnings: [`Successfully completed task: ${bounty.title}`],
    }).catch((err) => {
      console.warn("[BountyService] Auto soul experience record failed (non-fatal):", err);
    });
  }
}

export async function disputeBounty(
  bountyId: number,
  callerAddress: string
): Promise<{ txHash: string; mock?: boolean }> {
  try {
    const contract = await getBountyContract();
    if (contract) {
      const tx = await contract.disputeBounty(BigInt(bountyId));
      const receipt = await tx.wait();
      return { txHash: receipt.hash };
    }
  } catch (err) {
    console.warn("[BountyService] disputeBounty contract call failed, falling back to mock:", err);
  }

  // Mock fallback
  const bounty = mockBounties.get(bountyId);
  if (!bounty) throw new Error(`Bounty ${bountyId} not found`);
  const updated: BountyInfo = {
    ...bounty,
    status: BountyStatus.Disputed,
    statusLabel: "Disputed"
  };
  mockBounties.set(bountyId, updated);
  return { txHash: `0xmock_${Date.now().toString(16)}`, mock: true };
}

export async function cancelBounty(
  bountyId: number,
  callerAddress: string
): Promise<{ txHash: string; mock?: boolean }> {
  try {
    const contract = await getBountyContract();
    if (contract) {
      const tx = await contract.cancelBounty(BigInt(bountyId));
      const receipt = await tx.wait();
      return { txHash: receipt.hash };
    }
  } catch (err) {
    console.warn("[BountyService] cancelBounty contract call failed, falling back to mock:", err);
  }

  // Mock fallback
  const bounty = mockBounties.get(bountyId);
  if (!bounty) throw new Error(`Bounty ${bountyId} not found`);
  const updated: BountyInfo = {
    ...bounty,
    status: BountyStatus.Cancelled,
    statusLabel: "Cancelled"
  };
  mockBounties.set(bountyId, updated);
  return { txHash: `0xmock_${Date.now().toString(16)}`, mock: true };
}

export async function getBounties(
  offset = 0,
  limit = 20,
  statusFilter?: number
): Promise<{ bounties: BountyInfo[]; total: number }> {
  const cacheKey = `${offset}:${limit}:${statusFilter ?? "all"}`;
  const cached = bountyListCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) return cached.data;

  try {
    const contract = await getBountyContract();
    if (contract) {
      const [rawBounties, total]: [any[], bigint] = await withTimeout(
        contract.getBounties(BigInt(offset), BigInt(limit)),
        RPC_TIMEOUT_MS,
        "getBounties"
      );
      let bounties = rawBounties.map(formatBounty);
      if (statusFilter !== undefined) {
        bounties = bounties.filter((b) => b.status === statusFilter);
      }
      const result = { bounties, total: Number(total) };
      bountyListCache.set(cacheKey, { data: result, expiresAt: Date.now() + BOUNTY_CACHE_TTL_MS });
      return result;
    }
  } catch (err) {
    console.warn("[BountyService] getBounties contract call failed, falling back to mock:", err);
  }

  // Mock fallback
  let all = Array.from(mockBounties.values());
  if (statusFilter !== undefined) {
    all = all.filter((b) => b.status === statusFilter);
  }
  const total = all.length;
  const page = all.slice(offset, offset + limit);
  return { bounties: page, total };
}

export async function getBounty(bountyId: number): Promise<BountyInfo | null> {
  try {
    const contract = await getBountyContract();
    if (contract) {
      const raw = await contract.getBounty(BigInt(bountyId));
      return formatBounty(raw);
    }
  } catch (err) {
    console.warn("[BountyService] getBounty contract call failed, falling back to mock:", err);
  }

  return mockBounties.get(bountyId) ?? null;
}

export async function getBountiesByCreator(
  address: string
): Promise<BountyInfo[]> {
  try {
    const contract = await getBountyContract();
    if (contract) {
      const ids: bigint[] = await contract.getBountiesByCreator(address);
      const bounties = await Promise.all(ids.map((id) => getBounty(Number(id))));
      return bounties.filter((b): b is BountyInfo => b !== null);
    }
  } catch (err) {
    console.warn("[BountyService] getBountiesByCreator contract call failed, falling back to mock:", err);
  }

  // Mock fallback
  return Array.from(mockBounties.values()).filter(
    (b) => b.creator.toLowerCase() === address.toLowerCase()
  );
}

export async function getBountiesByAgent(agentId: number): Promise<BountyInfo[]> {
  try {
    const contract = await getBountyContract();
    if (contract) {
      const ids: bigint[] = await contract.getBountiesByAgent(BigInt(agentId));
      const bounties = await Promise.all(ids.map((id) => getBounty(Number(id))));
      return bounties.filter((b): b is BountyInfo => b !== null);
    }
  } catch (err) {
    console.warn("[BountyService] getBountiesByAgent contract call failed, falling back to mock:", err);
  }

  // Mock fallback
  return Array.from(mockBounties.values()).filter(
    (b) => b.assignedAgentId === agentId
  );
}

export async function getStats(): Promise<{ totalBounties: number; totalRewardPool: string }> {
  try {
    const contract = await getBountyContract();
    if (contract) {
      const [totalBounties, totalRewardPool]: [bigint, bigint] = await Promise.all([
        contract.getTotalBounties(),
        contract.getTotalRewardPool()
      ]);
      return {
        totalBounties: Number(totalBounties),
        totalRewardPool: totalRewardPool.toString()
      };
    }
  } catch (err) {
    console.warn("[BountyService] getStats contract call failed, falling back to mock:", err);
  }

  // Mock fallback
  const all = Array.from(mockBounties.values());
  const totalRewardPool = all
    .filter((b) => b.status === BountyStatus.Open || b.status === BountyStatus.Assigned)
    .reduce((sum, b) => sum + BigInt(b.reward), BigInt(0));
  return {
    totalBounties: all.length,
    totalRewardPool: totalRewardPool.toString()
  };
}
