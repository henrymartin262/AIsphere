/**
 * memories table — DB access layer.
 * Replaces the flat memories.json file.
 * Content is stored AES-GCM encrypted — only decryptable by correct wallet+agentId key.
 */

import db from "./index.js";
import type { MemoryType } from "../services/MemoryVaultService.js";

export interface EncryptedMemoryRow {
  id: string;
  agentId: number;
  ownerWallet: string;
  type: MemoryType;
  encryptedData: string;
  iv: string;
  importance: number;
  timestamp: number;
  tags: string[];
}

interface DbRow {
  id: string;
  agent_id: number;
  owner_wallet: string;
  type: string;
  encrypted_data: string;
  iv: string;
  importance: number;
  timestamp: number;
  tags: string;
}

function rowToMem(r: DbRow): EncryptedMemoryRow {
  return {
    id: r.id,
    agentId: r.agent_id,
    ownerWallet: r.owner_wallet,
    type: r.type as MemoryType,
    encryptedData: r.encrypted_data,
    iv: r.iv,
    importance: r.importance,
    timestamp: r.timestamp,
    tags: JSON.parse(r.tags || "[]") as string[],
  };
}

const stmts = {
  insert: db.prepare(`
    INSERT OR IGNORE INTO memories
      (id, agent_id, owner_wallet, type, encrypted_data, iv, importance, timestamp, tags)
    VALUES
      (@id, @agentId, @ownerWallet, @type, @encryptedData, @iv, @importance, @timestamp, @tags)
  `),
  findByAgent: db.prepare(`
    SELECT * FROM memories WHERE agent_id=? ORDER BY timestamp DESC
  `),
  findByAgentAndType: db.prepare(`
    SELECT * FROM memories WHERE agent_id=? AND type=? ORDER BY timestamp DESC
  `),
  findByAgentAndWallet: db.prepare(`
    SELECT * FROM memories WHERE agent_id=? AND lower(owner_wallet)=lower(?) ORDER BY timestamp DESC
  `),
  deleteById: db.prepare(`DELETE FROM memories WHERE id=? AND agent_id=?`),
  countByAgent: db.prepare(`SELECT COUNT(*) as cnt FROM memories WHERE agent_id=?`),
  deleteAllForAgent: db.prepare(`DELETE FROM memories WHERE agent_id=?`),
};

export function insertMemory(m: EncryptedMemoryRow): void {
  stmts.insert.run({
    id: m.id,
    agentId: m.agentId,
    ownerWallet: m.ownerWallet.toLowerCase(),
    type: m.type,
    encryptedData: m.encryptedData,
    iv: m.iv,
    importance: m.importance,
    timestamp: m.timestamp,
    tags: JSON.stringify(m.tags),
  });
}

export function getMemoriesForAgent(agentId: number): EncryptedMemoryRow[] {
  return (stmts.findByAgent.all(agentId) as DbRow[]).map(rowToMem);
}

export function getMemoriesForAgentByWallet(agentId: number, wallet: string): EncryptedMemoryRow[] {
  return (stmts.findByAgentAndWallet.all(agentId, wallet) as DbRow[]).map(rowToMem);
}

export function deleteMemoryById(id: string, agentId: number): boolean {
  const r = stmts.deleteById.run(id, agentId);
  return r.changes > 0;
}

export function countMemoriesForAgent(agentId: number): number {
  const row = stmts.countByAgent.get(agentId) as { cnt: number };
  return row.cnt;
}

export function replaceAllMemoriesForAgent(agentId: number, rows: EncryptedMemoryRow[]): void {
  const del = stmts.deleteAllForAgent;
  const ins = stmts.insert;
  db.transaction(() => {
    del.run(agentId);
    for (const m of rows) {
      ins.run({
        id: m.id,
        agentId: m.agentId,
        ownerWallet: m.ownerWallet.toLowerCase(),
        type: m.type,
        encryptedData: m.encryptedData,
        iv: m.iv,
        importance: m.importance,
        timestamp: m.timestamp,
        tags: JSON.stringify(m.tags),
      });
    }
  })();
}
