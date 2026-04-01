import { Router, type Router as ExpressRouter } from "express";
import { walletAuth } from "../middleware/auth.js";
import * as BountyService from "../services/BountyService.js";

const router: ExpressRouter = Router();

// GET /api/bounty — List bounties with optional pagination and status filter
router.get("/", async (req, res) => {
  try {
    const offset = parseInt((req.query.offset as string) || "0", 10);
    const limit = parseInt((req.query.limit as string) || "20", 10);
    const statusParam = req.query.status as string | undefined;
    const statusFilter = statusParam !== undefined && statusParam !== ""
      ? parseInt(statusParam, 10)
      : undefined;

    const result = await BountyService.getBounties(offset, limit, statusFilter);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch bounties";
    res.status(500).json({ error: message });
  }
});

// GET /api/bounty/stats — Global stats
router.get("/stats", async (_req, res) => {
  try {
    const stats = await BountyService.getStats();
    res.status(200).json({ success: true, data: stats });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch stats";
    res.status(500).json({ error: message });
  }
});

// GET /api/bounty/creator/:address — Bounties by creator address
router.get("/creator/:address", async (req, res) => {
  try {
    const { address } = req.params;
    const bounties = await BountyService.getBountiesByCreator(address);
    res.status(200).json({ success: true, data: bounties });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch bounties by creator";
    res.status(500).json({ error: message });
  }
});

// GET /api/bounty/agent/:agentId — Bounties assigned to an agent
router.get("/agent/:agentId", async (req, res) => {
  try {
    const agentId = parseInt(req.params.agentId, 10);
    if (isNaN(agentId)) {
      res.status(400).json({ error: "agentId must be a number" });
      return;
    }
    const bounties = await BountyService.getBountiesByAgent(agentId);
    res.status(200).json({ success: true, data: bounties });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch bounties by agent";
    res.status(500).json({ error: message });
  }
});

// GET /api/bounty/:id — Get a single bounty
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "id must be a number" });
      return;
    }
    const bounty = await BountyService.getBounty(id);
    if (!bounty) {
      res.status(404).json({ error: `Bounty ${id} not found` });
      return;
    }
    res.status(200).json({ success: true, data: bounty });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch bounty";
    res.status(500).json({ error: message });
  }
});

// POST /api/bounty — Create a new bounty (requires auth)
router.post("/", walletAuth, async (req, res) => {
  try {
    const creatorAddress = req.headers["x-wallet-address"] as string;
    const { title, description, deadline, rewardWei, criteriaHash } = req.body as {
      title?: string;
      description?: string;
      deadline?: number;
      rewardWei?: string;
      criteriaHash?: string;
    };

    if (!title || !description || !deadline || !rewardWei) {
      res.status(400).json({ error: "title, description, deadline, and rewardWei are required" });
      return;
    }

    const result = await BountyService.createBounty({
      title,
      description,
      deadline,
      rewardWei,
      criteriaHash,
      creatorAddress
    });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create bounty";
    res.status(500).json({ error: message });
  }
});

// POST /api/bounty/:id/accept — Accept a bounty (requires auth)
router.post("/:id/accept", walletAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "id must be a number" });
      return;
    }
    const { agentId, agentOwnerAddress } = req.body as {
      agentId?: number;
      agentOwnerAddress?: string;
    };
    if (agentId === undefined || !agentOwnerAddress) {
      res.status(400).json({ error: "agentId and agentOwnerAddress are required" });
      return;
    }

    const result = await BountyService.acceptBounty(id, agentId, agentOwnerAddress);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to accept bounty";
    res.status(500).json({ error: message });
  }
});

// POST /api/bounty/:id/submit — Submit result (requires auth)
router.post("/:id/submit", walletAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "id must be a number" });
      return;
    }
    const submitterAddress = req.headers["x-wallet-address"] as string;
    const { resultProofHash } = req.body as { resultProofHash?: string };
    if (!resultProofHash) {
      res.status(400).json({ error: "resultProofHash is required" });
      return;
    }

    const result = await BountyService.submitResult(id, submitterAddress, resultProofHash);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to submit result";
    res.status(500).json({ error: message });
  }
});

// POST /api/bounty/:id/approve — Approve bounty (requires auth)
router.post("/:id/approve", walletAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "id must be a number" });
      return;
    }
    const approverAddress = req.headers["x-wallet-address"] as string;
    const result = await BountyService.approveBounty(id, approverAddress);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to approve bounty";
    res.status(500).json({ error: message });
  }
});

// POST /api/bounty/:id/dispute — Dispute bounty (requires auth)
router.post("/:id/dispute", walletAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "id must be a number" });
      return;
    }
    const callerAddress = req.headers["x-wallet-address"] as string;
    const result = await BountyService.disputeBounty(id, callerAddress);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to dispute bounty";
    res.status(500).json({ error: message });
  }
});

// POST /api/bounty/:id/cancel — Cancel bounty (requires auth)
router.post("/:id/cancel", walletAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "id must be a number" });
      return;
    }
    const callerAddress = req.headers["x-wallet-address"] as string;
    const result = await BountyService.cancelBounty(id, callerAddress);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to cancel bounty";
    res.status(500).json({ error: message });
  }
});

export default router;
