import { ethers } from "ethers";
import { contracts, BOUNTY_BOARD_ABI } from "../config/contracts.js";
import { initialize0GClients } from "../config/og.js";
import { hashContent } from "../utils/encryption.js";
import { soulService, ExperienceType } from "./SoulService.js";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SubBountyInfo {
  id: number;
  parentBountyId: number;
  creatorAgentId: number;
  title: string;
  description: string;
  reward: string;
  deadline: number;
  status: number;
  createdAt: number;
}

// ─── In-memory store ─────────────────────────────────────────────────────────

let nextMockSubId = 2000;
const mockSubBounties = new Map<number, SubBountyInfo>();

// ─── Service ─────────────────────────────────────────────────────────────────

/**
 * Agent creates a sub-bounty (hiring another agent for a sub-task).
 */
export async function createSubBounty(params: {
  parentBountyId: number;
  creatorAgentId: number;
  title: string;
  description: string;
  rewardEth: string;
  deadlineDays: number;
  callerAddress: string;
}): Promise<{ subBountyId: number; txHash: string; mock?: boolean }> {
  const deadline = Math.floor(Date.now() / 1000) + params.deadlineDays * 86400;
  const criteriaHash = hashContent(`${params.title}:${params.description}`);

  // Try on-chain
  try {
    const clients = await initialize0GClients();
    if (clients.signer && contracts.bountyBoard) {
      const contract = new ethers.Contract(contracts.bountyBoard, BOUNTY_BOARD_ABI, clients.signer);
      const tx = await contract.createSubBounty(
        params.parentBountyId,
        params.title,
        params.description,
        deadline,
        criteriaHash,
        params.creatorAgentId,
        { value: ethers.parseEther(params.rewardEth) }
      );
      const receipt = await tx.wait();
      // Parse event to get sub-bounty ID
      const subId = Number(receipt?.logs?.[0]?.topics?.[2] ?? nextMockSubId++);

      // Record experience
      soulService.recordExperience(params.creatorAgentId, {
        type: ExperienceType.INTERACTION,
        category: "agent_hiring",
        content: `Created sub-bounty "${params.title}" for ${params.rewardEth} A0GI under parent #${params.parentBountyId}`,
        context: `SubBounty creation, parent: ${params.parentBountyId}`,
        outcome: "success",
        importance: 0.7,
        learnings: ["Delegated sub-task to agent marketplace via on-chain sub-bounty"],
      }).catch(() => {});

      return { subBountyId: subId, txHash: receipt?.hash ?? tx.hash };
    }
  } catch (err) {
    console.warn("[SubBountyService] On-chain createSubBounty failed:", (err as Error).message);
  }

  // Mock fallback
  const subId = nextMockSubId++;
  const sub: SubBountyInfo = {
    id: subId,
    parentBountyId: params.parentBountyId,
    creatorAgentId: params.creatorAgentId,
    title: params.title,
    description: params.description,
    reward: params.rewardEth,
    deadline,
    status: 0,
    createdAt: Math.floor(Date.now() / 1000),
  };
  mockSubBounties.set(subId, sub);

  soulService.recordExperience(params.creatorAgentId, {
    type: ExperienceType.INTERACTION,
    category: "agent_hiring",
    content: `Created sub-bounty "${params.title}" (mock) under parent #${params.parentBountyId}`,
    context: `SubBounty creation (mock)`,
    outcome: "neutral",
    importance: 0.5,
    learnings: ["Sub-bounty created in mock mode"],
  }).catch(() => {});

  return { subBountyId: subId, txHash: `0xmock_sub_${Date.now().toString(16)}`, mock: true };
}

/**
 * List sub-bounties for a parent bounty.
 */
export function getSubBounties(parentBountyId: number): SubBountyInfo[] {
  return [...mockSubBounties.values()].filter(s => s.parentBountyId === parentBountyId);
}

/**
 * List sub-bounties created by an agent.
 */
export function getAgentSubBounties(agentId: number): SubBountyInfo[] {
  return [...mockSubBounties.values()].filter(s => s.creatorAgentId === agentId);
}
