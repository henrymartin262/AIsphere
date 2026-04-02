import { Router, type Router as ExpressRouter } from "express";
import * as ComputeAccountService from "../services/ComputeAccountService.js";

const router: ExpressRouter = Router();

// GET /api/compute/account — Get account balance and ledger info
router.get("/account", async (_req, res) => {
  try {
    const data = await ComputeAccountService.getAccountInfo();
    res.status(200).json({ success: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch account info";
    res.status(500).json({ success: false, error: message });
  }
});

// GET /api/compute/providers — Get available provider list with TEE status
router.get("/providers", async (_req, res) => {
  try {
    const data = await ComputeAccountService.listProviders();
    res.status(200).json({ success: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch providers";
    res.status(500).json({ success: false, error: message });
  }
});

// POST /api/compute/deposit — Deposit funds into compute ledger
// Body: { amount: string }  — amount in A0GI, e.g. "1.5"
router.post("/deposit", async (req, res) => {
  try {
    const { amount } = req.body as { amount?: string };

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      res.status(400).json({ success: false, error: "amount must be a positive number string (A0GI)" });
      return;
    }

    const data = await ComputeAccountService.depositFund(amount);
    res.status(200).json({ success: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Deposit failed";
    res.status(500).json({ success: false, error: message });
  }
});

// POST /api/compute/transfer — Transfer funds to a provider
// Body: { providerAddress: string, serviceType: string, amount: string }
router.post("/transfer", async (req, res) => {
  try {
    const { providerAddress, serviceType, amount } = req.body as {
      providerAddress?: string;
      serviceType?: string;
      amount?: string;
    };

    if (!providerAddress) {
      res.status(400).json({ success: false, error: "providerAddress is required" });
      return;
    }
    if (!serviceType) {
      res.status(400).json({ success: false, error: "serviceType is required" });
      return;
    }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      res.status(400).json({ success: false, error: "amount must be a positive number string (A0GI)" });
      return;
    }

    const data = await ComputeAccountService.transferToProvider(providerAddress, serviceType, amount);
    res.status(200).json({ success: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Transfer failed";
    res.status(500).json({ success: false, error: message });
  }
});

// POST /api/compute/refund/initiate — Initiate a refund (24h settlement period)
// Body: { amount: string }
router.post("/refund/initiate", async (req, res) => {
  try {
    const { amount } = req.body as { amount?: string };

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      res.status(400).json({ success: false, error: "amount must be a positive number string (A0GI)" });
      return;
    }

    const data = await ComputeAccountService.initiateRefund(amount);
    res.status(200).json({ success: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Refund initiation failed";
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
