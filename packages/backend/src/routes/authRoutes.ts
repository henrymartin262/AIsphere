/**
 * Auth routes — SIWE-lite wallet authentication
 *
 * POST /api/auth/nonce   — get a one-time nonce for signing
 * POST /api/auth/verify  — verify signed nonce, return JWT
 * GET  /api/auth/me      — decode JWT and return wallet info
 *
 * JWT payload: { wallet: string, iat, exp }
 * JWT TTL: 7 days
 */

import { Router } from "express";
import { ethers } from "ethers";
import jwt from "jsonwebtoken";
import { createNonce, consumeNonce } from "../db/auth.js";
import { env } from "../config/index.js";

const router: Router = Router();

const JWT_SECRET = env.JWT_SECRET ?? "AIsphere:JWTSecret:dev-fallback-change-in-prod";
const JWT_TTL = "7d";

// POST /api/auth/nonce
router.post("/nonce", (req, res) => {
  const { wallet } = req.body as { wallet?: string };
  if (!wallet || !ethers.isAddress(wallet)) {
    res.status(400).json({ success: false, error: "Valid wallet address required" });
    return;
  }
  const nonce = createNonce(wallet);
  const message = `Sign this message to authenticate with AIsphere.\n\nWallet: ${wallet.toLowerCase()}\nNonce: ${nonce}\n\nThis request will not trigger a blockchain transaction or cost any gas fees.`;
  res.json({ success: true, data: { nonce, message } });
});

// POST /api/auth/verify
router.post("/verify", (req, res) => {
  const { wallet, signature, message } = req.body as {
    wallet?: string; signature?: string; message?: string;
  };
  if (!wallet || !signature || !message) {
    res.status(400).json({ success: false, error: "wallet, signature, and message are required" });
    return;
  }
  if (!ethers.isAddress(wallet)) {
    res.status(400).json({ success: false, error: "Invalid wallet address" });
    return;
  }

  // Extract nonce from message
  const nonceMatch = message.match(/Nonce: ([a-f0-9]+)/);
  if (!nonceMatch) {
    res.status(400).json({ success: false, error: "Nonce not found in message" });
    return;
  }
  const nonce = nonceMatch[1];

  // Verify the nonce exists and hasn't been used
  const nonceValid = consumeNonce(wallet, nonce);
  if (!nonceValid) {
    res.status(401).json({ success: false, error: "Invalid or expired nonce" });
    return;
  }

  // Verify signature
  try {
    const recovered = ethers.verifyMessage(message, signature);
    if (recovered.toLowerCase() !== wallet.toLowerCase()) {
      res.status(401).json({ success: false, error: "Signature verification failed" });
      return;
    }
  } catch {
    res.status(401).json({ success: false, error: "Invalid signature" });
    return;
  }

  // Issue JWT
  const token = jwt.sign({ wallet: wallet.toLowerCase() }, JWT_SECRET, { expiresIn: JWT_TTL });
  res.json({ success: true, data: { token, wallet: wallet.toLowerCase() } });
});

// GET /api/auth/me — verify JWT and return wallet
router.get("/me", (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    res.status(401).json({ success: false, error: "No token provided" });
    return;
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { wallet: string };
    res.json({ success: true, data: { wallet: payload.wallet } });
  } catch {
    res.status(401).json({ success: false, error: "Invalid or expired token" });
  }
});

export default router;
