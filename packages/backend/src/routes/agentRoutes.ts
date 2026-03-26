import { Router, type Router as ExpressRouter } from "express";
import * as AgentService from "../services/AgentService.js";

const router: ExpressRouter = Router();

// POST /api/agents — Create a new agent (mint INFT)
router.post("/", async (req, res) => {
  try {
    const { name, model, metadata, walletAddress } = req.body as {
      name?: string;
      model?: string;
      metadata?: Record<string, unknown>;
      walletAddress?: string;
    };

    if (!name || !model || !walletAddress) {
      res.status(400).json({ error: "name, model, and walletAddress are required" });
      return;
    }

    const result = await AgentService.createAgent({ name, model, metadata, walletAddress });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create agent";
    res.status(500).json({ error: message });
  }
});

// GET /api/agents/owner/:address — Get all agents by owner
router.get("/owner/:address", async (req, res) => {
  try {
    const { address } = req.params;
    const agents = await AgentService.getAgentsByOwner(address);
    res.status(200).json({ success: true, data: agents });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch agents";
    res.status(500).json({ error: message });
  }
});

// GET /api/agents/:agentId — Get a single agent by ID
router.get("/:agentId", async (req, res) => {
  try {
    const agentId = parseInt(req.params.agentId, 10);
    if (isNaN(agentId)) {
      res.status(400).json({ error: "agentId must be a number" });
      return;
    }

    const agent = await AgentService.getAgent(agentId);
    if (!agent) {
      res.status(404).json({ error: `Agent ${agentId} not found` });
      return;
    }

    res.status(200).json({ success: true, data: agent });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch agent";
    res.status(500).json({ error: message });
  }
});

export default router;
