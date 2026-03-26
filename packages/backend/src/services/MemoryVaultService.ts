import { randomUUID } from "crypto";
import { deriveAgentKey, encryptMemory, decryptMemory } from "../utils/encryption.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MemoryType = "conversation" | "knowledge" | "personality" | "skill" | "decision";

export interface Memory {
  id: string;
  agentId: number;
  type: MemoryType;
  content: string;
  importance: number; // 0–1
  timestamp: number;
  tags: string[];
}

export interface MemoryFilter {
  type?: MemoryType;
  minImportance?: number;
  tags?: string[];
  limit?: number;
}

interface EncryptedMemory {
  id: string;
  agentId: number;
  type: MemoryType;
  encryptedData: string;
  iv: string;
  importance: number;
  timestamp: number;
  tags: string[];
}

// ─── In-memory store (MVP) ────────────────────────────────────────────────────
// Replace with 0G KV writes:
//   import { KvClient } from "@0gfoundation/0g-ts-sdk";
//   await kvClient.set(streamId, key, value);
//   const raw = await kvClient.get(streamId, key);

const store: Map<number, EncryptedMemory[]> = new Map();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStore(agentId: number): EncryptedMemory[] {
  if (!store.has(agentId)) store.set(agentId, []);
  return store.get(agentId)!;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export async function saveMemory(
  agentId: number,
  memory: Omit<Memory, "id" | "agentId" | "timestamp">,
  walletAddress: string
): Promise<Memory> {
  const key = deriveAgentKey(walletAddress, agentId);
  const id = randomUUID();
  const timestamp = Date.now();
  const { encryptedData, iv } = encryptMemory(memory.content, key);

  const encrypted: EncryptedMemory = {
    id,
    agentId,
    type: memory.type,
    encryptedData,
    iv,
    importance: memory.importance,
    timestamp,
    tags: memory.tags ?? []
  };

  getStore(agentId).push(encrypted);

  return { id, agentId, ...memory, timestamp };
}

export async function loadMemories(
  agentId: number,
  walletAddress: string,
  filter?: MemoryFilter
): Promise<Memory[]> {
  const key = deriveAgentKey(walletAddress, agentId);
  let records = [...getStore(agentId)];

  if (filter?.type) records = records.filter((r) => r.type === filter.type);
  if (filter?.minImportance !== undefined)
    records = records.filter((r) => r.importance >= filter.minImportance!);
  if (filter?.tags?.length)
    records = records.filter((r) => filter.tags!.some((t) => r.tags.includes(t)));

  records.sort((a, b) => b.timestamp - a.timestamp);
  if (filter?.limit) records = records.slice(0, filter.limit);

  return records.map((r) => {
    try {
      const content = decryptMemory(r.encryptedData, r.iv, key);
      return {
        id: r.id,
        agentId: r.agentId,
        type: r.type,
        content,
        importance: r.importance,
        timestamp: r.timestamp,
        tags: r.tags
      };
    } catch {
      return {
        id: r.id,
        agentId: r.agentId,
        type: r.type,
        content: "[decryption failed]",
        importance: r.importance,
        timestamp: r.timestamp,
        tags: r.tags
      };
    }
  });
}

export async function buildContext(agentId: number, walletAddress: string): Promise<string> {
  const memories = await loadMemories(agentId, walletAddress, {
    minImportance: 0.3,
    limit: 20
  });

  if (memories.length === 0) {
    return "No prior context available.";
  }

  const sections: string[] = [];

  const personality = memories.filter((m) => m.type === "personality");
  if (personality.length) {
    sections.push("## Personality\n" + personality.map((m) => `- ${m.content}`).join("\n"));
  }

  const knowledge = memories.filter((m) => m.type === "knowledge");
  if (knowledge.length) {
    sections.push("## Knowledge\n" + knowledge.map((m) => `- ${m.content}`).join("\n"));
  }

  const conversations = memories
    .filter((m) => m.type === "conversation")
    .slice(0, 10)
    .reverse();
  if (conversations.length) {
    sections.push(
      "## Recent Conversation\n" + conversations.map((m) => m.content).join("\n")
    );
  }

  return sections.join("\n\n");
}

export async function deleteMemory(
  agentId: number,
  memoryId: string,
  walletAddress: string
): Promise<boolean> {
  // Verify wallet has access by ensuring the key can be derived (MVP: any wallet can delete)
  deriveAgentKey(walletAddress, agentId);

  const list = getStore(agentId);
  const idx = list.findIndex((m) => m.id === memoryId);
  if (idx === -1) return false;
  list.splice(idx, 1);
  return true;
}
