import type { NextFunction, Request, Response } from "express";

/**
 * Global error handler.
 * In production mode: only returns generic error messages to prevent internal info leakage.
 * In development mode: returns full error details for debugging.
 */
export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error("Unhandled backend error:", error);

  const isDev = process.env.NODE_ENV !== "production";
  const internalMessage = error instanceof Error ? error.message : "Internal server error";

  res.status(500).json({
    success: false,
    message: isDev ? internalMessage : "Internal server error. Please try again later.",
    ...(isDev && error instanceof Error && { stack: error.stack }),
  });
}
