import { Router, type Router as ExpressRouter } from "express";
import * as SubBountyService from "../services/SubBountyService.js";

const router: ExpressRouter = Router();

/**
 * POST /api/sub-bounty
 * Create a sub-bounty (Agent hires another Agent).
 *
 * Body: { parentBountyId, creatorAgentId, title, description, rewardEth, deadlineDays, callerAddress }
 */
router.post("/", async (req, res) => {
  try {
    const { parentBountyId, creatorAgentId, title, description, rewardEth, deadlineDays, callerAddress } = req.body as {
      parentBountyId?: number;
      creatorAgentId?: number;
      title?: string;
      description?: string;
      rewardEth?: string;
      deadlineDays?: number;
      callerAddress?: string;
    };

    if (!parentBountyId || !creatorAgentId || !title || !description || !rewardEth || !callerAddress) {
      res.status(400).json({ error: "parentBountyId, creatorAgentId, title, description, rewardEth, callerAddress are required" });
      return;
    }

    const result = await SubBountyService.createSubBounty({
      parentBountyId,
      creatorAgentId,
      title,
      description,
      rewardEth,
      deadlineDays: deadlineDays ?? 7,
      callerAddress,
    });

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * GET /api/sub-bounty/parent/:parentId
 * List sub-bounties for a parent bounty.
 */
router.get("/parent/:parentId", async (req, res) => {
  try {
    const parentId = parseInt(req.params.parentId, 10);
    if (isNaN(parentId)) {
      res.status(400).json({ error: "parentId must be a number" });
      return;
    }
    const subs = SubBountyService.getSubBounties(parentId);
    res.status(200).json({ success: true, data: subs });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * GET /api/sub-bounty/agent/:agentId
 * List sub-bounties created by an agent.
 */
router.get("/agent/:agentId", async (req, res) => {
  try {
    const agentId = parseInt(req.params.agentId, 10);
    if (isNaN(agentId)) {
      res.status(400).json({ error: "agentId must be a number" });
      return;
    }
    const subs = SubBountyService.getAgentSubBounties(agentId);
    res.status(200).json({ success: true, data: subs });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
