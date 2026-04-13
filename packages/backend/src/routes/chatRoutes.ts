import { Router, type Router as ExpressRouter } from "express";
import * as MemoryVaultService from "../services/MemoryVaultService.js";
import * as SealedInferenceService from "../services/SealedInferenceService.js";
import * as DecisionChainService from "../services/DecisionChainService.js";
import { soulService } from "../services/SoulService.js";
import { ExperienceType } from "../services/SoulService.js";
import { initialize0GClients } from "../config/og.js";
import { contracts } from "../config/contracts.js";
import { ethers } from "ethers";

const router: ExpressRouter = Router();

const INFT_ABI = [
  "function recordInference(uint256 tokenId, uint256 trustDelta)"
];

async function recordInferenceOnChain(agentId: number): Promise<void> {
  try {
    if (!contracts.inft) return;
    const clients = await initialize0GClients();
    if (!clients.signer) return;
    const contract = new ethers.Contract(contracts.inft, INFT_ABI, clients.signer);
    const tx = await contract.recordInference(agentId, 10); // +10 trust per inference
    await tx.wait();
    console.log(`[Chat] recordInference agentId=${agentId} ok`);
  } catch (err) {
    console.warn(`[Chat] recordInference failed (non-fatal):`, (err as Error).message);
  }
}

// POST /api/chat/:agentId — Core inference flow
router.post("/:agentId", async (req, res) => {
  try {
    const agentId = parseInt(req.params.agentId, 10);
    if (isNaN(agentId)) {
      res.status(400).json({ error: "agentId must be a number" });
      return;
    }

    const { message, walletAddress, model } = req.body as {
      message?: string;
      walletAddress?: string;
      model?: string;
    };

    if (!message || !walletAddress) {
      res.status(400).json({ error: "message and walletAddress are required" });
      return;
    }

    // 1. Build context from prior memories
    const context = await MemoryVaultService.buildContext(agentId, walletAddress);

    // 2. Run sealed inference
    const { response, proof } = await SealedInferenceService.inference(
      agentId,
      message,
      context,
      model
    );

    // 3. Persist conversation memories (fire-and-forget style, non-blocking)
    const userMemoryPromise = MemoryVaultService.saveMemory(
      agentId,
      {
        type: "conversation",
        content: `User: ${message}`,
        importance: 0.5,
        tags: ["conversation"]
      },
      walletAddress
    );

    const agentMemoryPromise = MemoryVaultService.saveMemory(
      agentId,
      {
        type: "conversation",
        content: `Agent: ${response}`,
        importance: 0.5,
        tags: ["conversation"]
      },
      walletAddress
    );

    // 4. Record decision with importance based on proof verification
    // TEE verified → immediate on-chain (4); Real LLM → batch queue (3); Mock → local only (2)
    const importance = proof.teeVerified ? 4 : proof.inferenceMode === "real" ? 3 : 2;
    const decisionPromise = DecisionChainService.recordDecision(agentId, proof, importance);

    await Promise.all([userMemoryPromise, agentMemoryPromise, decisionPromise]);

    // 5. Record inference on INFT contract (non-blocking, updates level/stats)
    recordInferenceOnChain(agentId).catch(() => {});

    // 6. Auto-record INFERENCE experience for Living Soul (non-blocking)
    soulService.recordExperience(agentId, {
      type: ExperienceType.INFERENCE,
      category: "general_inference",
      content: `Processed inference request: "${message.slice(0, 100)}"`,
      context: `Chat with agent #${agentId}, mode: ${proof.inferenceMode}`,
      outcome: proof.teeVerified ? "success" : "neutral",
      importance: proof.teeVerified ? 0.8 : 0.5,
      learnings: [`Inference completed via ${proof.inferenceMode} mode`],
      relatedDecisionHash: proof.proofHash,
    }).catch((err) => {
      console.warn("[Chat] Auto soul experience record failed (non-fatal):", err);
    });

    res.status(200).json({
      success: true,
      data: {
        response,
        proof: {
          proofHash: proof.proofHash,
          teeVerified: proof.teeVerified,
          timestamp: proof.timestamp,
          inferenceMode: proof.inferenceMode
        }
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Inference failed";
    res.status(500).json({ error: message });
  }
});

// GET /api/chat/:agentId/history — Load conversation history
router.get("/:agentId/history", async (req, res) => {
  try {
    const agentId = parseInt(req.params.agentId, 10);
    if (isNaN(agentId)) {
      res.status(400).json({ error: "agentId must be a number" });
      return;
    }

    const { walletAddress, limit } = req.query as {
      walletAddress?: string;
      limit?: string;
    };

    if (!walletAddress) {
      res.status(400).json({ error: "walletAddress query param is required" });
      return;
    }

    const memories = await MemoryVaultService.loadMemories(agentId, walletAddress, {
      type: "conversation",
      limit: limit ? parseInt(limit, 10) : 50
    });

    res.status(200).json({ success: true, data: memories });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load history";
    res.status(500).json({ error: message });
  }
});

export default router;
