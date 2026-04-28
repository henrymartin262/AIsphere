/**
 * Chat session routes — server-side session persistence
 *
 * GET    /api/sessions/:agentId          — list sessions for agent+wallet
 * POST   /api/sessions/:agentId          — create new session
 * GET    /api/sessions/:agentId/:id      — get session with messages
 * PUT    /api/sessions/:agentId/:id      — update title
 * DELETE /api/sessions/:agentId/:id      — delete session
 * POST   /api/sessions/:agentId/:id/messages — append message
 */

import { Router } from "express";
import { randomUUID } from "crypto";
import {
  createSession,
  listSessions,
  getSession,
  updateSessionTitle,
  deleteSession,
  addMessage,
  getMessages,
} from "../db/sessions.js";

const router: Router = Router();

// GET /api/sessions/:agentId
router.get("/:agentId", (req, res) => {
  const agentId = parseInt(req.params.agentId, 10);
  const wallet = req.headers["x-wallet-address"] as string;
  if (!wallet) { res.status(401).json({ error: "Missing wallet" }); return; }
  const sessions = listSessions(agentId, wallet);
  res.json({ success: true, data: sessions });
});

// POST /api/sessions/:agentId — create session
router.post("/:agentId", (req, res) => {
  const agentId = parseInt(req.params.agentId, 10);
  const wallet = req.headers["x-wallet-address"] as string;
  if (!wallet) { res.status(401).json({ error: "Missing wallet" }); return; }
  const { title, id: clientId } = req.body as { title?: string; id?: string };
  const id = clientId ?? randomUUID();
  const now = Date.now();
  createSession({ id, agentId, walletAddress: wallet, title: title ?? "New Chat", createdAt: now, updatedAt: now });
  res.status(201).json({ success: true, data: { id } });
});

// GET /api/sessions/:agentId/:id
router.get("/:agentId/:id", (req, res) => {
  const wallet = req.headers["x-wallet-address"] as string;
  if (!wallet) { res.status(401).json({ error: "Missing wallet" }); return; }
  const session = getSession(req.params.id, wallet);
  if (!session) { res.status(404).json({ error: "Session not found" }); return; }
  res.json({ success: true, data: session });
});

// PUT /api/sessions/:agentId/:id — update title
router.put("/:agentId/:id", (req, res) => {
  const { title } = req.body as { title?: string };
  if (title) updateSessionTitle(req.params.id, title);
  res.json({ success: true });
});

// DELETE /api/sessions/:agentId/:id
router.delete("/:agentId/:id", (req, res) => {
  const wallet = req.headers["x-wallet-address"] as string;
  if (!wallet) { res.status(401).json({ error: "Missing wallet" }); return; }
  const ok = deleteSession(req.params.id, wallet);
  if (!ok) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ success: true });
});

// POST /api/sessions/:agentId/:id/messages — append message
router.post("/:agentId/:id/messages", (req, res) => {
  const { role, content, timestamp, id: msgId } = req.body as {
    role?: "user" | "assistant" | "system";
    content?: string;
    timestamp?: number;
    id?: string;
  };
  if (!role || !content) { res.status(400).json({ error: "role and content required" }); return; }
  addMessage({
    id: msgId ?? randomUUID(),
    sessionId: req.params.id,
    role,
    content,
    timestamp: timestamp ?? Date.now(),
  });
  res.status(201).json({ success: true });
});

export default router;
