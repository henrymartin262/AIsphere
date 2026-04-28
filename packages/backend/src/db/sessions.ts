/**
 * chat_sessions + session_messages tables — server-side conversation persistence.
 * Replaces localStorage as source of truth so sessions survive device changes.
 */

import db from "./index.js";

export interface ChatSession {
  id: string;
  agentId: number;
  walletAddress: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages?: SessionMessage[];
}

export interface SessionMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

interface SessionRow {
  id: string;
  agent_id: number;
  wallet_address: string;
  title: string;
  created_at: number;
  updated_at: number;
}

interface MessageRow {
  id: string;
  session_id: string;
  role: string;
  content: string;
  timestamp: number;
}

const stmts = {
  createSession: db.prepare(`
    INSERT INTO chat_sessions (id, agent_id, wallet_address, title, created_at, updated_at)
    VALUES (@id, @agentId, @walletAddress, @title, @createdAt, @updatedAt)
  `),
  listSessions: db.prepare(`
    SELECT * FROM chat_sessions
    WHERE agent_id=? AND lower(wallet_address)=lower(?)
    ORDER BY updated_at DESC
  `),
  getSession: db.prepare(`SELECT * FROM chat_sessions WHERE id=? AND lower(wallet_address)=lower(?)`),
  updateSessionTitle: db.prepare(`UPDATE chat_sessions SET title=?, updated_at=? WHERE id=?`),
  touchSession: db.prepare(`UPDATE chat_sessions SET updated_at=? WHERE id=?`),
  deleteSession: db.prepare(`DELETE FROM chat_sessions WHERE id=? AND lower(wallet_address)=lower(?)`),

  addMessage: db.prepare(`
    INSERT INTO session_messages (id, session_id, role, content, timestamp)
    VALUES (@id, @sessionId, @role, @content, @timestamp)
  `),
  getMessages: db.prepare(`
    SELECT * FROM session_messages WHERE session_id=? ORDER BY timestamp ASC
  `),
  getRecentMessages: db.prepare(`
    SELECT * FROM (
      SELECT * FROM session_messages WHERE session_id=? ORDER BY timestamp DESC LIMIT ?
    ) ORDER BY timestamp ASC
  `),
};

export function createSession(s: Omit<ChatSession, "messages">): void {
  stmts.createSession.run({
    id: s.id,
    agentId: s.agentId,
    walletAddress: s.walletAddress.toLowerCase(),
    title: s.title,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  });
}

export function listSessions(agentId: number, wallet: string): ChatSession[] {
  return (stmts.listSessions.all(agentId, wallet) as SessionRow[]).map((r) => ({
    id: r.id,
    agentId: r.agent_id,
    walletAddress: r.wallet_address,
    title: r.title,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export function getSession(id: string, wallet: string): ChatSession | null {
  const row = stmts.getSession.get(id, wallet) as SessionRow | undefined;
  if (!row) return null;
  const messages = (stmts.getMessages.all(id) as MessageRow[]).map((m) => ({
    id: m.id,
    sessionId: m.session_id,
    role: m.role as "user" | "assistant" | "system",
    content: m.content,
    timestamp: m.timestamp,
  }));
  return {
    id: row.id,
    agentId: row.agent_id,
    walletAddress: row.wallet_address,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    messages,
  };
}

export function updateSessionTitle(id: string, title: string): void {
  stmts.updateSessionTitle.run(title, Date.now(), id);
}

export function touchSession(id: string): void {
  stmts.touchSession.run(Date.now(), id);
}

export function deleteSession(id: string, wallet: string): boolean {
  const r = stmts.deleteSession.run(id, wallet);
  return r.changes > 0;
}

export function addMessage(m: SessionMessage): void {
  stmts.addMessage.run({
    id: m.id,
    sessionId: m.sessionId,
    role: m.role,
    content: m.content,
    timestamp: m.timestamp,
  });
  stmts.touchSession.run(Date.now(), m.sessionId);
}

export function getMessages(sessionId: string, limit?: number): SessionMessage[] {
  const rows = limit
    ? (stmts.getRecentMessages.all(sessionId, limit) as MessageRow[])
    : (stmts.getMessages.all(sessionId) as MessageRow[]);
  return rows.map((m) => ({
    id: m.id,
    sessionId: m.session_id,
    role: m.role as "user" | "assistant" | "system",
    content: m.content,
    timestamp: m.timestamp,
  }));
}
