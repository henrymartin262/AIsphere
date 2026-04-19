import { randomUUID } from "crypto";
import { writeFileSync, readFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { keccak256, toUtf8Bytes } from "ethers";
import { deriveAgentKey, encryptMemory, decryptMemory } from "../utils/encryption.js";
import { initialize0GClients, kvBatchWrite } from "../config/og.js";

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

// ─── File persistence helpers ─────────────────────────────────────────────────

const DATA_DIR = join(process.cwd(), "data");
const MEMORIES_FILE = join(DATA_DIR, "memories.json");

function loadStoreFromFile(): Map<number, EncryptedMemory[]> {
  try {
    if (!existsSync(MEMORIES_FILE)) return new Map();
    const raw = readFileSync(MEMORIES_FILE, "utf-8");
    const obj = JSON.parse(raw) as Record<string, EncryptedMemory[]>;
    const map = new Map<number, EncryptedMemory[]>();
    for (const [k, v] of Object.entries(obj)) {
      if (Array.isArray(v)) map.set(parseInt(k, 10), v);
    }
    console.log(`[MemoryVault] Loaded ${map.size} agents from file cache`);
    return map;
  } catch {
    return new Map();
  }
}

function persistStoreToFile(): void {
  try {
    mkdirSync(DATA_DIR, { recursive: true });
    const obj: Record<string, EncryptedMemory[]> = {};
    for (const [k, v] of store.entries()) {
      obj[String(k)] = v;
    }
    writeFileSync(MEMORIES_FILE, JSON.stringify(obj), "utf-8");
  } catch (err) {
    console.warn("[MemoryVault] File persist failed (non-fatal):", (err as Error).message);
  }
}

// ─── Dual-layer store: in-memory cache + file persistence + periodic 0G KV sync ─
// Write path:  encrypt → memory → file (sync) → mark dirty
// Sync path:   every SYNC_INTERVAL_MS, flush all dirty agents to 0G KV
// Read path:   file on startup; 0G KV hydration on first access (supplement only)

const store: Map<number, EncryptedMemory[]> = loadStoreFromFile();

// Track which agents have been hydrated from 0G KV
const hydratedAgents: Set<number> = new Set();

// Track agents with changes not yet synced to 0G KV
const dirtyAgents: Set<number> = new Set();

/** How often to batch-sync dirty agents to 0G KV (default: 1 hour) */
const SYNC_INTERVAL_MS = 60 * 60 * 1000;

/** Sync all dirty agents to 0G KV in one batch, then clear dirty set */
async function syncDirtyAgentsToKV(): Promise<void> {
  if (dirtyAgents.size === 0) return;

  const clients = await initialize0GClients();
  if (!clients.kvReady) {
    console.log("[MemoryVault] 0G KV not ready, skipping sync");
    return;
  }

  const toSync = [...dirtyAgents];
  dirtyAgents.clear();

  let synced = 0;
  for (const agentId of toSync) {
    try {
      const list = getStore(agentId);
      const streamId = getStreamId(agentId);

      // Write each memory entry
      for (const encrypted of list) {
        const kvKey = toKvKey(`memory:${encrypted.id}`);
        const kvData = new TextEncoder().encode(JSON.stringify(encrypted));
        await kvBatchWrite(clients, streamId, kvKey, kvData);
      }

      // Write updated index
      await persistIndex(clients, agentId);
      synced++;
      console.log(`[MemoryVault] Synced agent ${agentId} (${list.length} memories) to 0G KV`);
    } catch (err) {
      // Re-mark dirty so it retries next cycle
      dirtyAgents.add(agentId);
      console.warn(`[MemoryVault] 0G KV sync failed for agent ${agentId}, will retry:`, (err as Error).message);
    }
  }

  if (synced > 0) {
    console.log(`[MemoryVault] 0G KV sync complete: ${synced}/${toSync.length} agents`);
  }
}

/** Manually push a single agent's local memories to 0G KV (on-demand upload) */
export async function pushAgentToKV(agentId: number): Promise<{ synced: number }> {
  const clients = await initialize0GClients();
  if (!clients.kvReady) throw new Error("0G KV not ready");

  const list = getStore(agentId);
  const streamId = getStreamId(agentId);

  for (const encrypted of list) {
    const kvKey = toKvKey(`memory:${encrypted.id}`);
    const kvData = new TextEncoder().encode(JSON.stringify(encrypted));
    await kvBatchWrite(clients, streamId, kvKey, kvData);
  }
  await persistIndex(clients, agentId);
  dirtyAgents.delete(agentId);
  console.log(`[MemoryVault] Manual push: agent ${agentId} (${list.length} memories) → 0G KV`);
  return { synced: list.length };
}

/** Manually pull memories from 0G KV into local cache (on-demand download) */
export async function pullAgentFromKV(agentId: number): Promise<{ loaded: number }> {
  const clients = await initialize0GClients();
  if (!clients.kvReady) throw new Error("0G KV not ready");

  // Force re-hydration by clearing the hydrated flag
  hydratedAgents.delete(agentId);

  const streamId = getStreamId(agentId);
  const indexRaw = await clients.kvClient!.getValue(streamId, toKvKey("index:memories"));
  const indexBytes = indexRaw as unknown as Uint8Array | null | undefined;
  if (!indexBytes || indexBytes.length === 0) return { loaded: 0 };

  const indexStr = new TextDecoder().decode(indexBytes);
  const index = JSON.parse(indexStr) as Array<{ id: string }>;

  const localIds = new Set(getStore(agentId).map((m) => m.id));
  let loaded = 0;

  for (const entry of index) {
    if (localIds.has(entry.id)) continue;
    try {
      const memRaw = await clients.kvClient!.getValue(streamId, toKvKey(`memory:${entry.id}`));
      const memBytes = memRaw as unknown as Uint8Array | null | undefined;
      if (memBytes && memBytes.length > 0) {
        const encrypted = JSON.parse(new TextDecoder().decode(memBytes)) as EncryptedMemory;
        getStore(agentId).push(encrypted);
        loaded++;
      }
    } catch { /* skip individual failures */ }
  }

  if (loaded > 0) {
    persistStoreToFile();
    hydratedAgents.add(agentId);
    console.log(`[MemoryVault] Manual pull: loaded ${loaded} memories from 0G KV for agent ${agentId}`);
  }
  return { loaded };
}

/** Start the periodic 0G KV sync timer */
export function startKVSyncScheduler(): void {
  setInterval(() => {
    syncDirtyAgentsToKV().catch((err) =>
      console.warn("[MemoryVault] Scheduled KV sync error:", (err as Error).message)
    );
  }, SYNC_INTERVAL_MS);

  console.log(`[MemoryVault] 0G KV sync scheduled every ${SYNC_INTERVAL_MS / 60000} minutes`);
}

// ─── 0G KV Storage helpers ───────────────────────────────────────────────────

/** Deterministic stream ID per agent for 0G KV */
function getStreamId(agentId: number): string {
  return keccak256(toUtf8Bytes(`SealMind:MemoryVault:${agentId}`));
}

/** Convert a string key into Uint8Array for 0G KV operations */
function toKvKey(key: string): Uint8Array {
  return new TextEncoder().encode(key);
}

/** Persist a single encrypted memory to 0G KV Storage (fire-and-forget) */
async function persistTo0GKV(agentId: number, encrypted: EncryptedMemory): Promise<void> {
  try {
    const clients = await initialize0GClients();
    if (!clients.kvReady) {
      console.warn("[MemoryVault] 0G KV not ready, memory stored in-memory only");
      return;
    }

    const streamId = getStreamId(agentId);
    const kvKey = toKvKey(`memory:${encrypted.id}`);
    const kvData = new TextEncoder().encode(JSON.stringify(encrypted));

    const success = await kvBatchWrite(clients, streamId, kvKey, kvData);
    if (success) {
      console.log(`[MemoryVault] Persisted memory ${encrypted.id} to 0G KV (agent=${agentId})`);
    } else {
      console.warn(`[MemoryVault] Failed to persist memory ${encrypted.id} to 0G KV`);
    }

    // Also update the index (list of memory IDs for this agent)
    await persistIndex(clients, agentId);
  } catch (err) {
    console.warn("[MemoryVault] 0G KV write error (non-fatal):", (err as Error).message);
  }
}

/** Persist the memory index (all memory IDs) to 0G KV */
async function persistIndex(clients: Awaited<ReturnType<typeof initialize0GClients>>, agentId: number): Promise<void> {
  try {
    const list = getStore(agentId);
    const index = list.map((m) => ({
      id: m.id,
      type: m.type,
      importance: m.importance,
      timestamp: m.timestamp,
      tags: m.tags
    }));

    const streamId = getStreamId(agentId);
    const kvKey = toKvKey("index:memories");
    const kvData = new TextEncoder().encode(JSON.stringify(index));

    await kvBatchWrite(clients, streamId, kvKey, kvData);
  } catch (err) {
    console.warn("[MemoryVault] Index persist failed (non-fatal):", (err as Error).message);
  }
}

/** Hydrate in-memory cache from 0G KV Storage on first access */
async function hydrateFromKV(agentId: number): Promise<void> {
  if (hydratedAgents.has(agentId)) return;
  hydratedAgents.add(agentId); // Mark early to prevent re-entry

  try {
    const clients = await initialize0GClients();
    if (!clients.kvClient || !clients.kvReady) return;

    const streamId = getStreamId(agentId);

    // Try to read the index
    const indexRaw = await clients.kvClient.getValue(streamId, toKvKey("index:memories"));
    const indexBytes = indexRaw as unknown as Uint8Array | null | undefined;
    if (!indexBytes || indexBytes.length === 0) return;

    const indexStr = new TextDecoder().decode(indexBytes);
    const index = JSON.parse(indexStr) as Array<{ id: string }>;

    // Read each memory entry from 0G KV
    const localIds = new Set(getStore(agentId).map((m) => m.id));
    let loaded = 0;

    for (const entry of index) {
      if (localIds.has(entry.id)) continue; // Already in cache

      try {
        const memRaw = await clients.kvClient.getValue(streamId, toKvKey(`memory:${entry.id}`));
        const memBytes = memRaw as unknown as Uint8Array | null | undefined;
        if (memBytes && memBytes.length > 0) {
          const memStr = new TextDecoder().decode(memBytes);
          const encrypted = JSON.parse(memStr) as EncryptedMemory;
          getStore(agentId).push(encrypted);
          loaded++;
        }
      } catch {
        // Individual memory read failure — skip
      }
    }

    if (loaded > 0) {
      console.log(`[MemoryVault] Hydrated ${loaded} memories from 0G KV for agent ${agentId}`);
    }
  } catch (err) {
    console.warn("[MemoryVault] 0G KV hydration failed (using empty cache):", (err as Error).message);
  }
}

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

  // 1. Push to in-memory cache (immediate)
  getStore(agentId).push(encrypted);

  // 2. Persist to local file (sync, survives restarts)
  persistStoreToFile();

  // 3. Mark agent dirty for next 0G KV sync cycle
  dirtyAgents.add(agentId);

  return { id, agentId, ...memory, timestamp };
}

export async function loadMemories(
  agentId: number,
  walletAddress: string,
  filter?: MemoryFilter
): Promise<Memory[]> {
  // Hydrate from 0G KV on first access for this agent
  await hydrateFromKV(agentId);

  const key = deriveAgentKey(walletAddress, agentId);
  let records = [...getStore(agentId)];

  if (filter?.type) records = records.filter((r) => r.type === filter.type);
  if (filter?.minImportance !== undefined)
    records = records.filter((r) => r.importance >= filter.minImportance!);
  if (filter?.tags?.length)
    records = records.filter((r) => filter.tags!.some((t) => r.tags.includes(t)));

  // Sort descending first to get the most recent N records, then reverse to chronological order
  records.sort((a, b) => b.timestamp - a.timestamp);
  if (filter?.limit) records = records.slice(0, filter.limit);
  records.reverse(); // oldest → newest (chat display order)

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

/**
 * Build context from personality and knowledge memories only.
 * Does NOT include conversation memories — those are session-isolated
 * and passed directly from the frontend via the history field.
 */
export async function buildPersonalityContext(agentId: number, walletAddress: string): Promise<string> {
  const memories = await loadMemories(agentId, walletAddress, {
    minImportance: 0.3,
    limit: 20
  });

  const sections: string[] = [];

  const personality = memories.filter((m) => m.type === "personality");
  if (personality.length) {
    sections.push("## Personality\n" + personality.map((m) => `- ${m.content}`).join("\n"));
  }

  const knowledge = memories.filter((m) => m.type === "knowledge");
  if (knowledge.length) {
    sections.push("## Knowledge\n" + knowledge.map((m) => `- ${m.content}`).join("\n"));
  }

  return sections.join("\n\n");
}

export async function deleteMemory(
  agentId: number,
  memoryId: string,
  walletAddress: string
): Promise<boolean> {
  // Verify wallet has access by ensuring the key can be derived
  deriveAgentKey(walletAddress, agentId);

  const list = getStore(agentId);
  const idx = list.findIndex((m) => m.id === memoryId);
  if (idx === -1) return false;
  list.splice(idx, 1);
  persistStoreToFile();

  // Mark dirty for next 0G KV sync cycle
  dirtyAgents.add(agentId);

  return true;
}
