import type { NextFunction, Request, Response } from "express";
import { ethers } from "ethers";
import jwt from "jsonwebtoken";
import { env } from "../config/index.js";

const JWT_SECRET = env.JWT_SECRET ?? "AIsphere:JWTSecret:dev-fallback-change-in-prod";

/**
 * Wallet authentication middleware.
 *
 * Three modes (in priority order):
 *
 * 1. **JWT Bearer mode** (production): `Authorization: Bearer <jwt>`
 *    JWT was issued by /api/auth/verify after wallet signature. Most secure —
 *    wallet address extracted from verified token, cannot be spoofed.
 *
 * 2. **Signature mode** (legacy): `x-wallet-address` + `x-wallet-signature` + `x-wallet-message`
 *    Verifies the signature was produced by the claimed wallet.
 *
 * 3. **Simple header mode** (dev/hackathon fallback): `x-wallet-address` only
 *    No cryptographic verification — accepts any valid EVM address.
 *    Still useful for internal service calls and local dev.
 *
 * In all cases, `req.headers["x-wallet-address"]` is set to the authenticated
 * lowercase wallet address so downstream handlers can read it uniformly.
 */
export function walletAuth(req: Request, res: Response, next: NextFunction) {
  // ── Mode 1: JWT Bearer ────────────────────────────────────────────────────
  const authHeader = req.header("Authorization") ?? req.header("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { wallet: string };
      if (!payload.wallet || !ethers.isAddress(payload.wallet)) {
        return res.status(401).json({ success: false, message: "Invalid JWT payload." });
      }
      // Inject wallet address for downstream handlers
      req.headers["x-wallet-address"] = payload.wallet.toLowerCase();
      return next();
    } catch {
      return res.status(401).json({ success: false, message: "Invalid or expired JWT." });
    }
  }

  // ── Mode 2 & 3: x-wallet-address header ──────────────────────────────────
  const walletAddress = req.header("x-wallet-address");

  if (!walletAddress) {
    return res.status(401).json({
      success: false,
      message: "Missing authentication. Provide Authorization: Bearer <jwt> or x-wallet-address header."
    });
  }

  if (!ethers.isAddress(walletAddress)) {
    return res.status(401).json({ success: false, message: "Invalid wallet address format." });
  }

  if (walletAddress === ethers.ZeroAddress) {
    return res.status(401).json({ success: false, message: "Zero address is not allowed." });
  }

  // Mode 2: verify signature if provided
  const signature = req.header("x-wallet-signature");
  const signedMessage = req.header("x-wallet-message");
  if (signature && signedMessage) {
    try {
      const recovered = ethers.verifyMessage(signedMessage, signature);
      if (recovered.toLowerCase() !== walletAddress.toLowerCase()) {
        return res.status(401).json({ success: false, message: "Wallet signature verification failed." });
      }
    } catch {
      return res.status(401).json({ success: false, message: "Invalid wallet signature." });
    }
  }

  req.headers["x-wallet-address"] = walletAddress.toLowerCase();
  next();
}
