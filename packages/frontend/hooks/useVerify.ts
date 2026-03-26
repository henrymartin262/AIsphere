"use client";

import { useState, useCallback } from "react";
import { apiPost } from "../lib/api";
import type { VerifyResult } from "../types";

export function useVerify() {
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verify = useCallback(async (proofHash: string): Promise<VerifyResult | null> => {
    if (!proofHash.trim()) return null;
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await apiPost<VerifyResult>("/decisions/verify", { proofHash });
      setResult(data);
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Verification failed";
      setError(msg);
      const failResult: VerifyResult = { valid: false, error: msg };
      setResult(failResult);
      return failResult;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { verify, result, isLoading, error };
}
