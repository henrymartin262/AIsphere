import { Router, type Router as ExpressRouter } from "express";
import * as AgentService from "../services/AgentService.js";
import { hiveMindService } from "../services/HiveMindService.js";

const router: ExpressRouter = Router();

// GET /api/explore/agents?offset=0&limit=20&tag=defi — Browse public agents
router.get("/agents", async (req, res) => {
  try {
    const { offset, limit } = req.query as { offset?: string; limit?: string; tag?: string };
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

// GET /api/explore/stats — Network-wide statistics
// Uses a small page (limit=20) to avoid slow RPC — total comes from the paginated response
router.get("/stats", async (req, res) => {
  try {
    // Reuse the cached first-page result — avoids a second slow RPC call
    const agentResult = await AgentService.listPublicAgents(0, 20);
    const totalAgents = agentResult.total;
    const totalInferences = agentResult.agents.reduce(
      (sum, a) => sum + (a.stats?.totalInferences ?? 0),
      0
    );
    const hiveMindStats = hiveMindService.getStats();
    const hiveMindContributions = hiveMindStats.totalContributions ?? 0;
    res.json({ success: true, data: { totalAgents, totalInferences, totalBounties: 0, hiveMindContributions } });
  } catch (_err) {
    res.json({ success: true, data: { totalAgents: 0, totalInferences: 0, totalBounties: 0, hiveMindContributions: 0 } });
  }
});

export default router;
