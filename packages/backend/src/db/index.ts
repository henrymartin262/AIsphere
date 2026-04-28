/**
 * SQLite database module — single source of truth for all persistent data.
 *
 * Tables:
 *   agents         — user-created + chain-synced agents
 *   memories       — AES-GCM encrypted memories per agent
 *   chatbots       — bot integration configs
 *   auth_nonces    — SIWE-lite nonce store (TTL 5 min)
 *   chat_sessions  — server-side conversation sessions
 *   session_messages — messages within a session
 *
 * Design:
 *   - Synchronous better-sqlite3 API (no async overhead)
 *   - WAL mode for concurrent reads
 *   - Strict foreign keys
 *   - JSON columns for flexible sub-objects (tags, stats, metadata)
 */

import Database from "better-sqlite3";
import { join } from "path";
import { mkdirSync } from "fs";

const DATA_DIR = join(process.cwd(), "data");
mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = join(DATA_DIR, "aisphere.db");

const db = new Database(DB_PATH);

// ─── Pragmas ──────────────────────────────────────────────────────────────────
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.pragma("synchronous = NORMAL");
db.pragma("cache_size = -32000"); // 32 MB page cache

// ─── Schema ───────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS agents (
    agent_id    INTEGER PRIMARY KEY,
    owner       TEXT    NOT NULL,
    name        TEXT    NOT NULL,
    model       TEXT    NOT NULL,
    metadata_hash TEXT  DEFAULT '',
    encrypted_uri TEXT  DEFAULT '',
    source      TEXT    DEFAULT 'mock',
    soul_signature TEXT DEFAULT NULL,
    stats       TEXT    DEFAULT '{}',
    metadata    TEXT    DEFAULT '{}',
    created_at  INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
    deleted     INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_agents_owner ON agents(owner);

  CREATE TABLE IF NOT EXISTS memories (
    id              TEXT    PRIMARY KEY,
    agent_id        INTEGER NOT NULL,
    owner_wallet    TEXT    NOT NULL,
    type            TEXT    NOT NULL,
    encrypted_data  TEXT    NOT NULL,
    iv              TEXT    NOT NULL,
    importance      REAL    NOT NULL DEFAULT 0.5,
    timestamp       INTEGER NOT NULL,
    tags            TEXT    NOT NULL DEFAULT '[]',
    FOREIGN KEY (agent_id) REFERENCES agents(agent_id)
  );
  CREATE INDEX IF NOT EXISTS idx_memories_agent ON memories(agent_id);
  CREATE INDEX IF NOT EXISTS idx_memories_owner ON memories(owner_wallet);
  CREATE INDEX IF NOT EXISTS idx_memories_type  ON memories(agent_id, type);

  CREATE TABLE IF NOT EXISTS chatbots (
    id              TEXT    PRIMARY KEY,
    agent_id        INTEGER NOT NULL,
    platform        TEXT    NOT NULL,
    name            TEXT    NOT NULL,
    webhook_token   TEXT    NOT NULL UNIQUE,
    bot_token       TEXT    DEFAULT NULL,
    app_id          TEXT    DEFAULT NULL,
    app_secret      TEXT    DEFAULT NULL,
    webhook_url     TEXT    NOT NULL,
    enabled         INTEGER NOT NULL DEFAULT 1,
    wallet_address  TEXT    NOT NULL,
    created_at      INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
    updated_at      INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
    message_count   INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_chatbots_wallet  ON chatbots(wallet_address);
  CREATE INDEX IF NOT EXISTS idx_chatbots_token   ON chatbots(webhook_token);

  CREATE TABLE IF NOT EXISTS auth_nonces (
    wallet_address  TEXT    NOT NULL,
    nonce           TEXT    NOT NULL,
    expires_at      INTEGER NOT NULL,
    used            INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (wallet_address, nonce)
  );

  CREATE TABLE IF NOT EXISTS chat_sessions (
    id              TEXT    PRIMARY KEY,
    agent_id        INTEGER NOT NULL,
    wallet_address  TEXT    NOT NULL,
    title           TEXT    NOT NULL DEFAULT 'New Chat',
    created_at      INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
    updated_at      INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
    FOREIGN KEY (agent_id) REFERENCES agents(agent_id)
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_agent  ON chat_sessions(agent_id, wallet_address);

  CREATE TABLE IF NOT EXISTS session_messages (
    id          TEXT    PRIMARY KEY,
    session_id  TEXT    NOT NULL,
    role        TEXT    NOT NULL CHECK(role IN ('user','assistant','system')),
    content     TEXT    NOT NULL,
    timestamp   INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_msgs_session ON session_messages(session_id, timestamp);
`);

export default db;
