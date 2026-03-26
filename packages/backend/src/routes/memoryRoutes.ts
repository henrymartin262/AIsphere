import { Router, type Router as ExpressRouter } from "express";
import * as MemoryVaultService from "../services/MemoryVaultService.js";
import type { MemoryType } from "../services/MemoryVaultService.js";

const router: ExpressRouter = Router();

// GET /api/memory/:agentId?address=0x...&type=...&minImportance=...&limit=...
router.get("/:agentId", async (req, res) => {
  try {
    const agentId = parseInt(req.params.agentId, 10);
    if (isNaN(agentId)) {
      res.status(400).json({ error: "agentId must be a number" });
      return;
    }

    const { address, type, minImportance, limit } = req.query as {
      address?: string;
      type?: string;
      minImportance?: string;
      limit?: string;
    };

    if (!address) {
      res.status(400).json({ error: "address query param is required" });
      return;
    }

    const memories = await MemoryVaultService.loadMemories(agentId, address, {
      type: type as MemoryType | undefined,
      minImportance: minImportance !== undefined ? parseFloat(minImportance) : undefined,
      limit: limit !== undefined ? parseInt(limit, 10) : undefined
    });

    res.status(200).json({ success: true, data: memories });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load memories";
    res.status(500).json({ error: message });
  }
});

// POST /api/memory/:agentId — Manually add a memory
router.post("/:agentId", async (req, res) => {
  try {
    const agentId = parseInt(req.params.agentId, 10);
    if (isNaN(agentId)) {
      res.status(400).json({ error: "agentId must be a number" });
      return;
    }

    const { walletAddress, type, content, importance, tags } = req.body as {
      walletAddress?: string;
      type?: string;
      content?: string;
      importance?: number;
      tags?: string[];
    };

    if (!walletAddress || !type || !content) {
      res.status(400).json({ error: "walletAddress, type, and content are required" });
      return;
    }

    const memory = await MemoryVaultService.saveMemory(
      agentId,
      {
        type: type as MemoryType,
        content,
        importance: importance ?? 0.5,
        tags: tags ?? []
      },
      walletAddress
    );

    res.status(201).json({ success: true, data: memory });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save memory";
    res.status(500).json({ error: message });
  }
});

// DELETE /api/memory/:agentId/:memoryId
router.delete("/:agentId/:memoryId", async (req, res) => {
  try {
    const agentId = parseInt(req.params.agentId, 10);
    if (isNaN(agentId)) {
      res.status(400).json({ error: "agentId must be a number" });
      return;
    }

    const { memoryId } = req.params;
    const { walletAddress } = req.body as { walletAddress?: string };

    if (!walletAddress) {
      res.status(400).json({ error: "walletAddress is required in request body" });
      return;
    }

    const deleted = await MemoryVaultService.deleteMemory(agentId, memoryId, walletAddress);
    if (!deleted) {
      res.status(404).json({ error: `Memory ${memoryId} not found` });
      return;
    }

    res.status(200).json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete memory";
    res.status(500).json({ error: message });
  }
});

export default router;
