import { Router, Request, Response } from "express";
import { hiveMindService } from "../services/HiveMindService.js";

const router = Router();

/**
 * GET /api/hivemind/stats
 * Global Hive Mind statistics
 */
router.get("/stats", (_req: Request, res: Response) => {
  try {
    const stats = hiveMindService.getStats();
    res.json({ success: true, data: stats });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/hivemind/categories
 * Available experience categories
 */
router.get("/categories", (_req: Request, res: Response) => {
  try {
    const categories = hiveMindService.getCategories();
    res.json({ success: true, data: categories });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/hivemind/query
 * Query contributions by category/domain
 */
router.get("/query", (req: Request, res: Response) => {
  try {
    const categories = req.query.categories
      ? String(req.query.categories).split(",")
      : undefined;
    const domains = req.query.domains
      ? String(req.query.domains).split(",")
      : undefined;
    const limit  = Number(req.query.limit  ?? 20);
    const offset = Number(req.query.offset ?? 0);

    const result = hiveMindService.queryHiveMind({ categories, domains, limit, offset });
    res.json({ success: true, data: result.contributions, total: result.total });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/hivemind/contribute
 * Contribute an anonymized experience
 */
router.post("/contribute", async (req: Request, res: Response) => {
  try {
    const { agentId, experienceType, category, content, outcome, soulHash, relatedHash } = req.body;

    if (!agentId || !experienceType || !content || !soulHash) {
      return res.status(400).json({
        success: false,
        error: "agentId, experienceType, content, and soulHash are required",
      });
    }

    const result = await hiveMindService.contributeExperience({
      agentId: Number(agentId),
      experienceType,
      category,
      content,
      outcome: outcome ?? "neutral",
      soulHash,
      relatedHash,
    });

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/hivemind/connect/:agentId
 * Agent connects to Hive Mind — returns starter experience pack
 */
router.post("/connect/:agentId", async (req: Request, res: Response) => {
  try {
    const agentId = Number(req.params.agentId);
    const domains: string[] = req.body.domains ?? [];

    const result = await hiveMindService.connectToHiveMind(agentId, domains);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/hivemind/verify/:id
 * Verify a specific contribution with Merkle proof
 */
router.get("/verify/:id", (req: Request, res: Response) => {
  try {
    const result = hiveMindService.verifyContribution(req.params.id);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/hivemind/merkle-root
 * Get the current Merkle root of the Hive Mind
 */
router.get("/merkle-root", (_req: Request, res: Response) => {
  try {
    const root = hiveMindService.getMerkleRoot();
    res.json({ success: true, data: { merkleRoot: root } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
