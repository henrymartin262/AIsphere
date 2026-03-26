import type { NextFunction, Request, Response } from "express";

export function walletAuth(req: Request, res: Response, next: NextFunction) {
  const walletAddress = req.header("x-wallet-address");

  if (!walletAddress) {
    return res.status(401).json({
      success: false,
      message: "Missing x-wallet-address header. Signature validation will be implemented in module #2."
    });
  }

  req.headers["x-wallet-address"] = walletAddress.toLowerCase();
  next();
}
