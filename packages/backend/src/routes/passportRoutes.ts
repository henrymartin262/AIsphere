import { Router, Request, Response } from "express";
import { passportService } from "../services/PassportService.js";

const router = Router();

/**
 * POST /api/passport/register
 * Full registration: run capability test + certify agent
 */
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { agentId, ownerAddress } = req.body;
    if (!agentId || isNaN(Number(agentId))) {
      return res.status(400).json({ success: false, error: "agentId is required" });
    }

    const result = await passportService.fullRegistration(Number(agentId), ownerAddress);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/passport/:agentId/test
 * Run capability test only (without certifying)
 */
router.post("/:agentId/test", async (req: Request, res: Response) => {
  try {
    const agentId = Number(req.params.agentId);
    const { ownerAddress } = req.body;

    const result = await passportService.runCapabilityTest(agentId, ownerAddress);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/passport/:agentId/certify
 * Certify agent with a pre-computed capability proof
 */
router.post("/:agentId/certify", async (req: Request, res: Response) => {
  try {
    const agentId = Number(req.params.agentId);
    const { capabilityProof } = req.body;

    if (!capabilityProof) {
      return res.status(400).json({ success: false, error: "capabilityProof is required" });
    }

    const result = await passportService.certifyAgent(agentId, capabilityProof);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/passport/:agentId
 * Get passport status
 */
router.get("/:agentId", async (req: Request, res: Response) => {
  try {
    const agentId = Number(req.params.agentId);
    const status = await passportService.getPassport(agentId);
    res.json({ success: true, data: status });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/passport/:agentId/verify
 * Verify passport validity (used by other agents to authenticate)
 */
router.get("/:agentId/verify", async (req: Request, res: Response) => {
  try {
    const agentId = Number(req.params.agentId);
    const result = await passportService.verifyPassport(agentId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/passport/:agentId/revoke
 * Revoke a passport (admin)
 */
router.post("/:agentId/revoke", async (req: Request, res: Response) => {
  try {
    const agentId = Number(req.params.agentId);
    const result = await passportService.revokePassport(agentId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
