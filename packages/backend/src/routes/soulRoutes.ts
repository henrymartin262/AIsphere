import { Router, Request, Response } from "express";
import { soulService, ExperienceType } from "../services/SoulService.js";

const router = Router();

/**
 * GET /api/soul/:agentId
 * Get current soul state (hash chain head + experience count)
 */
router.get("/:agentId", async (req: Request, res: Response) => {
  try {
    const agentId = Number(req.params.agentId);
    const state = await soulService.getSoulState(agentId);
    res.json({ success: true, data: state });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/soul/:agentId/history
 * Get experience history (decrypted, from local store)
 */
router.get("/:agentId/history", async (req: Request, res: Response) => {
  try {
    const agentId = Number(req.params.agentId);
    const type    = req.query.type as ExperienceType | undefined;
    const limit   = Number(req.query.limit  ?? 20);
    const offset  = Number(req.query.offset ?? 0);

    const experiences = await soulService.getExperienceHistory(agentId, { type, limit, offset });
    res.json({ success: true, data: experiences, total: experiences.length });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/soul/:agentId/digest
 * Export anonymized soul digest (no raw content)
 */
router.get("/:agentId/digest", async (req: Request, res: Response) => {
  try {
    const agentId = Number(req.params.agentId);
    const digest = await soulService.exportSoulDigest(agentId);
    res.json({ success: true, data: digest });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/soul/:agentId/verify
 * Verify soul integrity (re-compute hash chain)
 */
router.get("/:agentId/verify", async (req: Request, res: Response) => {
  try {
    const agentId = Number(req.params.agentId);
    const result = await soulService.verifySoulIntegrity(agentId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/soul/:agentId/experience
 * Manually record an experience (usually called internally by other services)
 */
router.post("/:agentId/experience", async (req: Request, res: Response) => {
  try {
    const agentId = Number(req.params.agentId);
    const { type, category, content, context, outcome, importance, learnings, relatedDecisionHash } = req.body;

    if (!type || !content) {
      return res.status(400).json({ success: false, error: "type and content are required" });
    }

    const result = await soulService.recordExperience(agentId, {
      type: type as ExperienceType,
      category: category ?? type,
      content,
      context: context ?? "",
      outcome: outcome ?? "neutral",
      importance: importance ?? 0.5,
      learnings: learnings ?? [],
      relatedDecisionHash,
    });

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
