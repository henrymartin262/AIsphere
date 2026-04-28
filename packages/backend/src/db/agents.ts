/**
 * agents table — DB access layer.
 * Replaces the flat agents.json file.
 */

import db from "./index.js";
import type { AgentInfo, AgentStats } from "../services/AgentService.js";

interface AgentRow {
  agent_id: number;
  owner: string;
  name: string;
  model: string;
  metadata_hash: string;
  encrypted_uri: string;
  source: string;
  soul_signature: string | null;
  stats: string;
  metadata: string;
  created_at: number;
  deleted: number;
}

function rowToAgent(row: AgentRow): AgentInfo {
  const stats = JSON.parse(row.stats || "{}") as Partial<AgentStats>;
  return {
    agentId: row.agent_id,
    owner: row.owner,
    profile: {
      name: row.name,
      model: row.model,
      metadataHash: row.metadata_hash,
      encryptedURI: row.encrypted_uri,
    },
    stats: {
      totalInferences: stats.totalInferences ?? 0,
      totalMemories: stats.totalMemories ?? 0,
      trustScore: stats.trustScore ?? 0,
      level: stats.level ?? 1,
      lastActiveAt: stats.lastActiveAt ?? row.created_at,
    },
    soulSignature: row.soul_signature ?? undefined,
    source: (row.source as "chain" | "mock") ?? "mock",
  };
}

const stmts = {
  upsert: db.prepare(`
    INSERT INTO agents (agent_id, owner, name, model, metadata_hash, encrypted_uri, source, soul_signature, stats, created_at)
    VALUES (@agentId, @owner, @name, @model, @metadataHash, @encryptedURI, @source, @soulSignature, @stats, @createdAt)
    ON CONFLICT(agent_id) DO UPDATE SET
      owner=excluded.owner, name=excluded.name, model=excluded.model,
      metadata_hash=excluded.metadata_hash, encrypted_uri=excluded.encrypted_uri,
      source=excluded.source, soul_signature=excluded.soul_signature, stats=excluded.stats
  `),
  findById: db.prepare(`SELECT * FROM agents WHERE agent_id=? AND deleted=0`),
  findByOwner: db.prepare(`SELECT * FROM agents WHERE lower(owner)=lower(?) AND deleted=0`),
  softDelete: db.prepare(`UPDATE agents SET deleted=1 WHERE agent_id=? AND lower(owner)=lower(?)`),
  updateStats: db.prepare(`UPDATE agents SET stats=? WHERE agent_id=?`),
  updateSoul: db.prepare(`UPDATE agents SET soul_signature=? WHERE agent_id=?`),
  listAll: db.prepare(`SELECT * FROM agents WHERE deleted=0`),
};

export function upsertAgent(agent: AgentInfo): void {
  stmts.upsert.run({
    agentId: agent.agentId,
    owner: agent.owner.toLowerCase(),
    name: agent.profile.name,
    model: agent.profile.model,
    metadataHash: agent.profile.metadataHash ?? "",
    encryptedURI: agent.profile.encryptedURI ?? "",
    source: agent.source ?? "mock",
    soulSignature: agent.soulSignature ?? null,
    stats: JSON.stringify(agent.stats),
    createdAt: Date.now(),
  });
}

export function getAgentById(agentId: number): AgentInfo | null {
  const row = stmts.findById.get(agentId) as AgentRow | undefined;
  return row ? rowToAgent(row) : null;
}

export function getAgentsByOwner(owner: string): AgentInfo[] {
  const rows = stmts.findByOwner.all(owner) as AgentRow[];
  return rows.map(rowToAgent);
}

export function softDeleteAgent(agentId: number, owner: string): boolean {
  const result = stmts.softDelete.run(agentId, owner);
  return result.changes > 0;
}

export function updateAgentStats(agentId: number, stats: AgentStats): void {
  stmts.updateStats.run(JSON.stringify(stats), agentId);
}

export function updateSoulSignature(agentId: number, sig: string): void {
  stmts.updateSoul.run(sig, agentId);
}

export function getAllAgents(): AgentInfo[] {
  const rows = stmts.listAll.all() as AgentRow[];
  return rows.map(rowToAgent);
}
