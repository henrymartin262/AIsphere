import { Router, type Router as ExpressRouter } from "express";
import * as DecisionChainService from "../services/DecisionChainService.js";

const router: ExpressRouter = Router();

// NOTE: /verify must come BEFORE /:agentId to avoid Express matching "verify" as agentId
// POST /api/decisions/verify — Verify a proof hash
router.post("/verify", async (req, res) => {
  try {
    const { proofHash } = req.body as { proofHash?: string };
    if (!proofHash) {
      res.status(400).json({ error: "proofHash is required" });
      return;
    }

    const verified = await DecisionChainService.verifyProof(proofHash);
    res.status(200).json({ success: true, data: { proofHash, verified } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Verification failed";
    res.status(500).json({ error: message });
  }
});

// GET /api/decisions/:agentId/stats — Decision statistics
router.get("/:agentId/stats", async (req, res) => {
  try {
    const agentId = parseInt(req.params.agentId, 10);
    if (isNaN(agentId)) {
      res.status(400).json({ error: "agentId must be a number" });
      return;
    }

    const stats = await DecisionChainService.getDecisionStats(agentId);
    res.status(200).json({ success: true, data: stats });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get stats";
    res.status(500).json({ error: message });
  }
});

// GET /api/decisions/:agentId?page=1&limit=20 — Paginated decision history
router.get("/:agentId", async (req, res) => {
  try {
    const agentId = parseInt(req.params.agentId, 10);
    if (isNaN(agentId)) {
      res.status(400).json({ error: "agentId must be a number" });
      return;
    }

    const { page, limit } = req.query as { page?: string; limit?: string };
    const result = await DecisionChainService.getDecisionList(
      agentId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20
    );

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch decisions";
    res.status(500).json({ error: message });
  }
});

export default router;
