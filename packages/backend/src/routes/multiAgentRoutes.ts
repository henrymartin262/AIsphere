import { Router, type Router as ExpressRouter } from "express";
import * as MultiAgentService from "../services/MultiAgentService.js";
import * as AgentService from "../services/AgentService.js";

const router: ExpressRouter = Router();

// ─── Multi-Agent Orchestration ───────────────────────────────────────────────

/**
 * POST /api/multi-agent/orchestrate
 * Route a user query to the best agent(s), run parallel inference, aggregate results.
 *
 * Body: { message, agentIds, walletAddress, sessionId? }
 */
router.post("/orchestrate", async (req, res) => {
  try {
    const { message, agentIds, walletAddress, sessionId } = req.body as {
      message?: string;
      agentIds?: number[];
      walletAddress?: string;
      sessionId?: string;
    };

    if (!message || !walletAddress) {
      res.status(400).json({ error: "message and walletAddress are required" });
      return;
    }

    if (!agentIds || agentIds.length === 0) {
      res.status(400).json({ error: "agentIds array is required (at least 1 agent)" });
      return;
    }

    // Build available agents info
    const availableAgents = await Promise.all(
      agentIds.map(async (id) => {
        const agent = await AgentService.getAgent(id);
        return {
          agentId: id,
          name: agent?.profile.name ?? `Agent-${id}`,
          model: agent?.profile.model ?? "default",
          tags: [] as string[]
        };
      })
    );

    const result = await MultiAgentService.orchestrate(
      message,
      availableAgents,
      walletAddress,
      sessionId
    );

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Orchestration failed";
    res.status(500).json({ error: message });
  }
});

// ─── Task Delegation ─────────────────────────────────────────────────────────

/**
 * POST /api/multi-agent/delegate
 * Delegate a task from one agent to another.
 *
 * Body: { fromAgentId, toAgentId, description, walletAddress }
 */
router.post("/delegate", async (req, res) => {
  try {
    const { fromAgentId, toAgentId, description, walletAddress } = req.body as {
      fromAgentId?: number;
      toAgentId?: number;
      description?: string;
      walletAddress?: string;
    };

    if (!fromAgentId || !toAgentId || !description || !walletAddress) {
      res.status(400).json({ error: "fromAgentId, toAgentId, description, and walletAddress are required" });
      return;
    }

    const task = await MultiAgentService.delegateTask(
      fromAgentId,
      toAgentId,
      description,
      walletAddress
    );

    res.status(201).json({ success: true, data: task });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delegation failed";
    res.status(500).json({ error: message });
  }
});

/**
 * POST /api/multi-agent/tasks/:taskId/execute
 * Execute a delegated task.
 *
 * Body: { walletAddress }
 */
router.post("/tasks/:taskId/execute", async (req, res) => {
  try {
    const { taskId } = req.params;
    const { walletAddress } = req.body as { walletAddress?: string };

    if (!walletAddress) {
      res.status(400).json({ error: "walletAddress is required" });
      return;
    }

    const task = await MultiAgentService.executeTask(taskId, walletAddress);
    res.status(200).json({ success: true, data: task });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Task execution failed";
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/multi-agent/tasks/:taskId
 * Get task details.
 */
router.get("/tasks/:taskId", async (req, res) => {
  try {
    const task = await MultiAgentService.getTask(req.params.taskId);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    res.status(200).json({ success: true, data: task });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get task";
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/multi-agent/agents/:agentId/tasks
 * List tasks for a specific agent.
 */
router.get("/agents/:agentId/tasks", async (req, res) => {
  try {
    const agentId = parseInt(req.params.agentId, 10);
    if (isNaN(agentId)) {
      res.status(400).json({ error: "agentId must be a number" });
      return;
    }

    const agentTasks = await MultiAgentService.listAgentTasks(agentId);
    res.status(200).json({ success: true, data: agentTasks });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list tasks";
    res.status(500).json({ error: message });
  }
});

// ─── Agent Messaging ─────────────────────────────────────────────────────────

/**
 * POST /api/multi-agent/messages
 * Send a message between agents.
 *
 * Body: { fromAgentId, toAgentId, type, content, taskId? }
 */
router.post("/messages", async (req, res) => {
  try {
    const { fromAgentId, toAgentId, type, content, taskId } = req.body as {
      fromAgentId?: number;
      toAgentId?: number;
      type?: string;
      content?: string;
      taskId?: string;
    };

    if (!fromAgentId || !toAgentId || !type || !content) {
      res.status(400).json({ error: "fromAgentId, toAgentId, type, and content are required" });
      return;
    }

    const validTypes = ["request", "response", "delegate", "broadcast", "handoff"];
    if (!validTypes.includes(type)) {
      res.status(400).json({ error: `type must be one of: ${validTypes.join(", ")}` });
      return;
    }

    const message = await MultiAgentService.sendMessage(
      fromAgentId,
      toAgentId,
      type as MultiAgentService.MessageType,
      content,
      taskId
    );

    res.status(201).json({ success: true, data: message });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Failed to send message";
    res.status(500).json({ error: errMsg });
  }
});

/**
 * GET /api/multi-agent/agents/:agentId/messages
 * Get messages for a specific agent (inbox).
 */
router.get("/agents/:agentId/messages", async (req, res) => {
  try {
    const agentId = parseInt(req.params.agentId, 10);
    if (isNaN(agentId)) {
      res.status(400).json({ error: "agentId must be a number" });
      return;
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const messages = await MultiAgentService.getMessages(agentId, limit);
    res.status(200).json({ success: true, data: messages });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get messages";
    res.status(500).json({ error: message });
  }
});

// ─── Agent Handoff ───────────────────────────────────────────────────────────

/**
 * POST /api/multi-agent/handoff
 * Transfer conversation from one agent to another.
 *
 * Body: { fromAgentId, toAgentId, reason, walletAddress }
 */
router.post("/handoff", async (req, res) => {
  try {
    const { fromAgentId, toAgentId, reason, walletAddress } = req.body as {
      fromAgentId?: number;
      toAgentId?: number;
      reason?: string;
      walletAddress?: string;
    };

    if (!fromAgentId || !toAgentId || !reason || !walletAddress) {
      res.status(400).json({ error: "fromAgentId, toAgentId, reason, and walletAddress are required" });
      return;
    }

    const message = await MultiAgentService.handoff(
      fromAgentId,
      toAgentId,
      reason,
      walletAddress
    );

    res.status(200).json({ success: true, data: message });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Handoff failed";
    res.status(500).json({ error: errMsg });
  }
});

// ─── Collaboration Sessions ──────────────────────────────────────────────────

/**
 * POST /api/multi-agent/sessions
 * Create a collaboration session.
 *
 * Body: { name, agentIds, walletAddress }
 */
router.post("/sessions", async (req, res) => {
  try {
    const { name, agentIds, walletAddress } = req.body as {
      name?: string;
      agentIds?: number[];
      walletAddress?: string;
    };

    if (!name || !agentIds || !walletAddress) {
      res.status(400).json({ error: "name, agentIds, and walletAddress are required" });
      return;
    }

    const session = await MultiAgentService.createSession(name, agentIds, walletAddress);
    res.status(201).json({ success: true, data: session });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create session";
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/multi-agent/sessions/:sessionId
 * Get session details.
 */
router.get("/sessions/:sessionId", async (req, res) => {
  try {
    const session = await MultiAgentService.getSession(req.params.sessionId);
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    res.status(200).json({ success: true, data: session });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get session";
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/multi-agent/sessions?walletAddress=xxx
 * List sessions for a wallet.
 */
router.get("/sessions", async (req, res) => {
  try {
    const { walletAddress } = req.query as { walletAddress?: string };
    if (!walletAddress) {
      res.status(400).json({ error: "walletAddress query param is required" });
      return;
    }

    const sessionList = await MultiAgentService.listSessions(walletAddress);
    res.status(200).json({ success: true, data: sessionList });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list sessions";
    res.status(500).json({ error: message });
  }
});

export default router;
