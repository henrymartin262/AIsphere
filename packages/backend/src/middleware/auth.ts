import type { NextFunction, Request, Response } from "express";
import { ethers } from "ethers";

/**
 * Wallet authentication middleware.
 *
 * Two modes:
 * 1. **Simple header mode** (Hackathon / dev): `x-wallet-address` header with valid EVM address
 * 2. **Signature mode** (production-ready): `x-wallet-address` + `x-wallet-signature` + `x-wallet-message`
 *    The signature must be produced by signing `x-wallet-message` with the claimed wallet.
 *    This prevents address spoofing.
 *
 * When `x-wallet-signature` is present, we verify it. Otherwise we fall back to simple
 * address validation (non-zero, valid checksum).
 */
export function walletAuth(req: Request, res: Response, next: NextFunction) {
  const walletAddress = req.header("x-wallet-address");

  if (!walletAddress) {
    return res.status(401).json({
      success: false,
      message: "Missing x-wallet-address header."
    });
  }

  // Validate address format
  if (!ethers.isAddress(walletAddress)) {
    return res.status(401).json({
      success: false,
      message: "Invalid wallet address format."
    });
  }

  // Reject zero address
  if (walletAddress === ethers.ZeroAddress) {
    return res.status(401).json({
      success: false,
      message: "Zero address is not allowed."
    });
  }

  // If signature is provided, verify it (SIWE-lite)
  const signature = req.header("x-wallet-signature");
  const signedMessage = req.header("x-wallet-message");

  if (signature && signedMessage) {
    try {
      const recovered = ethers.verifyMessage(signedMessage, signature);
      if (recovered.toLowerCase() !== walletAddress.toLowerCase()) {
        return res.status(401).json({
          success: false,
          message: "Wallet signature verification failed: address mismatch."
        });
      }
    } catch {
      return res.status(401).json({
        success: false,
        message: "Invalid wallet signature."
      });
    }
  }

  req.headers["x-wallet-address"] = walletAddress.toLowerCase();
  next();
}
