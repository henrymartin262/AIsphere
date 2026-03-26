import { Router, type Router as ExpressRouter } from "express";
import * as AgentService from "../services/AgentService.js";

const router: ExpressRouter = Router();

// GET /api/explore/agents?offset=0&limit=20 — Browse public agents
router.get("/agents", async (req, res) => {
  try {
    const { offset, limit } = req.query as { offset?: string; limit?: string };
    const result = await AgentService.listPublicAgents(
      offset ? parseInt(offset, 10) : 0,
      limit ? parseInt(limit, 10) : 20
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch public agents";
    res.status(500).json({ error: message });
  }
});

export default router;
