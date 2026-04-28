/**
 * One-time migration: JSON files → SQLite
 * Run once after deploying the SQLite upgrade:
 *   npx tsx scripts/migrate-json-to-sqlite.ts
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";
import Database from "better-sqlite3";
import { mkdirSync } from "fs";

const DATA_DIR = join(process.cwd(), "data");
const DB_PATH = join(DATA_DIR, "aisphere.db");

// ── Open DB (schema already created by src/db/index.ts on first import) ──────
// Import the db module to ensure schema is applied
import "../src/db/index.js";

const db = new Database(DB_PATH);
db.pragma("foreign_keys = OFF"); // disable during migration, re-enable after

let agentsMigrated = 0;
let memoriesMigrated = 0;
let chatbotsMigrated = 0;

// ── Migrate agents.json ───────────────────────────────────────────────────────
const agentsFile = join(DATA_DIR, "agents.json");
if (existsSync(agentsFile)) {
  const raw = readFileSync(agentsFile, "utf-8");
  const obj = JSON.parse(raw) as Record<string, {
    agentId: number; owner: string;
    profile: { name: string; model: string; metadataHash?: string; encryptedURI?: string };
    stats: Record<string, unknown>; source?: string; soulSignature?: string;
  }>;

  const insert = db.prepare(`
    INSERT OR IGNORE INTO agents
      (agent_id, owner, name, model, metadata_hash, encrypted_uri, source, soul_signature, stats, created_at)
    VALUES
      (@agentId, @owner, @name, @model, @metadataHash, @encryptedUri, @source, @soulSig, @stats, @createdAt)
  `);

  db.transaction(() => {
    for (const agent of Object.values(obj)) {
      insert.run({
        agentId: agent.agentId,
        owner: agent.owner.toLowerCase(),
        name: agent.profile.name,
        model: agent.profile.model,
        metadataHash: agent.profile.metadataHash ?? "",
        encryptedUri: agent.profile.encryptedURI ?? "",
        source: agent.source ?? "chain",
        soulSig: agent.soulSignature ?? null,
        stats: JSON.stringify(agent.stats ?? {}),
        createdAt: Date.now(),
      });
      agentsMigrated++;
    }
  })();
  console.log(`✅ Migrated ${agentsMigrated} agents from agents.json`);
} else {
  console.log("ℹ️  agents.json not found, skipping");
}

// ── Migrate memories.json ─────────────────────────────────────────────────────
const memoriesFile = join(DATA_DIR, "memories.json");
if (existsSync(memoriesFile)) {
  const raw = readFileSync(memoriesFile, "utf-8");
  const obj = JSON.parse(raw) as Record<string, Array<{
    id: string; agentId: number; type: string;
    encryptedData: string; iv: string; importance: number;
    timestamp: number; tags: string[];
  }>>;

  const insert = db.prepare(`
    INSERT OR IGNORE INTO memories
      (id, agent_id, owner_wallet, type, encrypted_data, iv, importance, timestamp, tags)
    VALUES
      (@id, @agentId, @ownerWallet, @type, @encryptedData, @iv, @importance, @timestamp, @tags)
  `);

  db.transaction(() => {
    for (const [agentIdStr, mems] of Object.entries(obj)) {
      for (const m of mems) {
        if (!m.id || !m.encryptedData) continue;
        insert.run({
          id: m.id,
          agentId: parseInt(agentIdStr, 10),
          ownerWallet: "",  // wallet not stored in old format; will be derived on read
          type: m.type ?? "conversation",
          encryptedData: m.encryptedData,
          iv: m.iv,
          importance: m.importance ?? 0.5,
          timestamp: m.timestamp ?? Date.now(),
          tags: JSON.stringify(m.tags ?? []),
        });
        memoriesMigrated++;
      }
    }
  })();
  console.log(`✅ Migrated ${memoriesMigrated} memories from memories.json`);
} else {
  console.log("ℹ️  memories.json not found, skipping");
}

// ── Migrate chatbots.json ─────────────────────────────────────────────────────
const chatbotsFile = join(DATA_DIR, "chatbots.json");
if (existsSync(chatbotsFile)) {
  const raw = readFileSync(chatbotsFile, "utf-8");
  const obj = JSON.parse(raw) as Record<string, {
    id: string; agentId: number; platform: string; name: string;
    webhookToken: string; botToken?: string; appId?: string; appSecret?: string;
    webhookUrl: string; enabled: boolean; walletAddress: string;
    createdAt: number; updatedAt: number; messageCount: number;
  }>;

  const insert = db.prepare(`
    INSERT OR IGNORE INTO chatbots
      (id, agent_id, platform, name, webhook_token, bot_token, app_id, app_secret,
       webhook_url, enabled, wallet_address, created_at, updated_at, message_count)
    VALUES
      (@id, @agentId, @platform, @name, @webhookToken, @botToken, @appId, @appSecret,
       @webhookUrl, @enabled, @walletAddress, @createdAt, @updatedAt, @messageCount)
  `);

  db.transaction(() => {
    for (const bot of Object.values(obj)) {
      insert.run({
        id: bot.id, agentId: bot.agentId, platform: bot.platform, name: bot.name,
        webhookToken: bot.webhookToken, botToken: bot.botToken ?? null,
        appId: bot.appId ?? null, appSecret: bot.appSecret ?? null,
        webhookUrl: bot.webhookUrl, enabled: bot.enabled ? 1 : 0,
        walletAddress: bot.walletAddress.toLowerCase(),
        createdAt: bot.createdAt, updatedAt: bot.updatedAt,
        messageCount: bot.messageCount ?? 0,
      });
      chatbotsMigrated++;
    }
  })();
  console.log(`✅ Migrated ${chatbotsMigrated} chatbots from chatbots.json`);
} else {
  console.log("ℹ️  chatbots.json not found, skipping");
}

console.log("\n🎉 Migration complete!");
console.log(`   Agents: ${agentsMigrated}, Memories: ${memoriesMigrated}, Chatbots: ${chatbotsMigrated}`);
console.log("   You can now safely backup (not delete) the JSON files.");
