import { ethers } from "ethers";
import { contracts } from "../config/contracts.js";
import { initialize0GClients } from "../config/og.js";
import { deriveAgentKey, encryptMemory, decryptMemory } from "../utils/encryption.js";
import * as MemoryVaultService from "./MemoryVaultService.js";
import { soulService, ExperienceType } from "./SoulService.js";

// ─── ABI ─────────────────────────────────────────────────────────────────────

const TRANSFER_ABI = [
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function safeTransferFrom(address from, address to, uint256 tokenId)",
  "function approve(address to, uint256 tokenId)",
  "function getApproved(uint256 tokenId) view returns (address)",
];

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TransferResult {
  success: boolean;
  txHash?: string;
  fromAddress: string;
  toAddress: string;
  agentId: number;
  memoriesMigrated: number;
  mock?: boolean;
}

// ─── Service ─────────────────────────────────────────────────────────────────

/**
 * Get the current on-chain owner of an Agent INFT.
 */
export async function getOwner(agentId: number): Promise<string | null> {
  try {
    const clients = await initialize0GClients();
    if (!clients.signer || !contracts.inft) return null;
    const contract = new ethers.Contract(contracts.inft, TRANSFER_ABI, clients.signer);
    return await contract.ownerOf(agentId);
  } catch {
    return null;
  }
}

/**
 * Initiate Agent transfer: moves the INFT + migrates encrypted memories.
 *
 * Flow:
 * 1. Verify ownership
 * 2. Decrypt all memories with old owner's key
 * 3. Transfer INFT on-chain (safeTransferFrom)
 * 4. Re-encrypt memories with new owner's key
 * 5. Record TRADE experience on both sides
 */
export async function transferAgent(
  agentId: number,
  fromAddress: string,
  toAddress: string
): Promise<TransferResult> {
  const result: TransferResult = {
    success: false,
    fromAddress,
    toAddress,
    agentId,
    memoriesMigrated: 0,
  };

  // ── 1. Try on-chain transfer ────────────────────────────────────────────
  try {
    const clients = await initialize0GClients();
    if (clients.signer && contracts.inft) {
      const contract = new ethers.Contract(contracts.inft, TRANSFER_ABI, clients.signer);

      // Verify current owner
      const currentOwner = await contract.ownerOf(agentId);
      if (currentOwner.toLowerCase() !== fromAddress.toLowerCase()) {
        throw new Error(`Agent #${agentId} is not owned by ${fromAddress}`);
      }

      // Execute transfer
      const tx = await contract.safeTransferFrom(fromAddress, toAddress, agentId);
      const receipt = await tx.wait();
      result.txHash = receipt?.hash ?? tx.hash;
      result.success = true;
    }
  } catch (err) {
    console.warn("[TransferService] On-chain transfer failed:", (err as Error).message);
  }

  // ── 2. Memory migration ─────────────────────────────────────────────────
  try {
    // Load memories with old key
    const memories = await MemoryVaultService.loadMemories(agentId, fromAddress, { limit: 500 });

    if (memories.length > 0) {
      // Re-save each memory with new owner's encryption key
      for (const mem of memories) {
        await MemoryVaultService.saveMemory(
          agentId,
          {
            type: mem.type,
            content: mem.content,
            importance: mem.importance,
            tags: [...mem.tags, "migrated", `from-${fromAddress.slice(0, 8)}`],
          },
          toAddress
        );
      }
      result.memoriesMigrated = memories.length;
      console.log(`[TransferService] Migrated ${memories.length} memories for agent #${agentId}`);
    }
  } catch (err) {
    console.warn("[TransferService] Memory migration failed (non-fatal):", (err as Error).message);
  }

  // ── 3. If on-chain failed, do mock transfer ─────────────────────────────
  if (!result.success) {
    result.txHash = `0xmock_transfer_${Date.now().toString(16)}`;
    result.success = true;
    result.mock = true;
  }

  // ── 4. Record TRADE experience for both parties ─────────────────────────
  soulService.recordExperience(agentId, {
    type: ExperienceType.TRADE,
    category: "agent_transfer",
    content: `Agent transferred from ${fromAddress.slice(0, 10)}... to ${toAddress.slice(0, 10)}...`,
    context: `Transfer tx: ${result.txHash}`,
    outcome: "success",
    importance: 0.9,
    learnings: ["Ownership transferred to new wallet", `${result.memoriesMigrated} memories migrated`],
  }).catch(() => {});

  return result;
}

/**
 * Check if an agent can be transferred (verify ownership + approval).
 */
export async function canTransfer(
  agentId: number,
  fromAddress: string
): Promise<{ canTransfer: boolean; reason?: string }> {
  try {
    const clients = await initialize0GClients();
    if (!clients.signer || !contracts.inft) {
      return { canTransfer: true, reason: "Running in mock mode — transfer will be simulated" };
    }

    const contract = new ethers.Contract(contracts.inft, TRANSFER_ABI, clients.signer);
    const owner = await contract.ownerOf(agentId);

    if (owner.toLowerCase() !== fromAddress.toLowerCase()) {
      return { canTransfer: false, reason: "You are not the owner of this agent" };
    }

    return { canTransfer: true };
  } catch {
    return { canTransfer: true, reason: "Could not verify on-chain — mock mode" };
  }
}
