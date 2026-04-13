import { Router, type Router as ExpressRouter } from "express";
import * as TransferService from "../services/TransferService.js";

const router: ExpressRouter = Router();

/**
 * GET /api/transfer/:agentId/check
 * Check if an agent can be transferred.
 */
router.get("/:agentId/check", async (req, res) => {
  try {
    const agentId = parseInt(req.params.agentId, 10);
    if (isNaN(agentId)) {
      res.status(400).json({ error: "agentId must be a number" });
      return;
    }

    const walletAddress = req.query.walletAddress as string;
    if (!walletAddress) {
      res.status(400).json({ error: "walletAddress query param is required" });
      return;
    }

    const result = await TransferService.canTransfer(agentId, walletAddress);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * POST /api/transfer/:agentId
 * Transfer an agent to a new owner + migrate memories.
 *
 * Body: { fromAddress, toAddress }
 */
router.post("/:agentId", async (req, res) => {
  try {
    const agentId = parseInt(req.params.agentId, 10);
    if (isNaN(agentId)) {
      res.status(400).json({ error: "agentId must be a number" });
      return;
    }

    const { fromAddress, toAddress } = req.body as {
      fromAddress?: string;
      toAddress?: string;
    };

    if (!fromAddress || !toAddress) {
      res.status(400).json({ error: "fromAddress and toAddress are required" });
      return;
    }

    const result = await TransferService.transferAgent(agentId, fromAddress, toAddress);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

/**
 * GET /api/transfer/:agentId/owner
 * Get current on-chain owner of an agent.
 */
router.get("/:agentId/owner", async (req, res) => {
  try {
    const agentId = parseInt(req.params.agentId, 10);
    if (isNaN(agentId)) {
      res.status(400).json({ error: "agentId must be a number" });
      return;
    }

    const owner = await TransferService.getOwner(agentId);
    res.status(200).json({ success: true, data: { agentId, owner } });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
