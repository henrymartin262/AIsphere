"use client";

/**
 * useAuth — SIWE-lite wallet authentication hook
 *
 * Flow:
 *   1. wallet connects → check localStorage for valid JWT
 *   2. if no valid JWT → request nonce → ask wallet to sign → POST /auth/verify → store JWT
 *   3. on success: JWT stored in localStorage + api.ts updated to send Bearer token
 *
 * JWT stored under key: `aisphere:jwt:{walletAddress}`
 */

import { useState, useEffect, useCallback } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { setApiJwt, setApiWalletAddress } from "../lib/api";

const JWT_KEY = (wallet: string) => `aisphere:jwt:${wallet.toLowerCase()}`;
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

function buildUrl(path: string) {
  const base = `${API_BASE}${path}`;
  if (base.startsWith("http")) return base;
  return typeof window !== "undefined"
    ? `${window.location.origin}${base}`
    : `http://localhost:4000${base}`;
}

function getStoredJwt(wallet: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(JWT_KEY(wallet));
    if (!raw) return null;
    // Decode JWT expiry (payload.exp) without a library
    const payload = JSON.parse(atob(raw.split(".")[1]));
    if (payload.exp && Date.now() / 1000 > payload.exp - 60) {
      localStorage.removeItem(JWT_KEY(wallet));
      return null;
    }
    return raw;
  } catch {
    return null;
  }
}

function storeJwt(wallet: string, token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(JWT_KEY(wallet), token);
}

export type AuthStatus = "idle" | "signing" | "authenticated" | "error";

export function useAuth() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [status, setStatus] = useState<AuthStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(async (wallet: string) => {
    setStatus("signing");
    setError(null);
    try {
      // 1. Get nonce from backend
      const nonceRes = await fetch(buildUrl("/auth/nonce"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet }),
      });
      const nonceData = await nonceRes.json() as { success: boolean; data?: { nonce: string; message: string } };
      if (!nonceData.success || !nonceData.data) throw new Error("Failed to get nonce");

      const { message } = nonceData.data;

      // 2. Sign with wallet
      const signature = await signMessageAsync({ message });

      // 3. Verify signature → get JWT
      const verifyRes = await fetch(buildUrl("/auth/verify"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet, signature, message }),
      });
      const verifyData = await verifyRes.json() as { success: boolean; data?: { token: string } };
      if (!verifyData.success || !verifyData.data?.token) throw new Error("Signature verification failed");

      const { token } = verifyData.data;
      storeJwt(wallet, token);
      setApiJwt(token);
      setApiWalletAddress(wallet);
      setStatus("authenticated");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      // User rejected signature — not a hard error, fall back gracefully
      if (msg.includes("rejected") || msg.includes("denied") || msg.includes("cancel")) {
        setStatus("idle");
      } else {
        setError(msg);
        setStatus("error");
      }
    }
  }, [signMessageAsync]);

  // On wallet connect: check for existing JWT or trigger sign-in
  useEffect(() => {
    if (!isConnected || !address) {
      setStatus("idle");
      setApiJwt(null);
      return;
    }

    const stored = getStoredJwt(address);
    if (stored) {
      setApiJwt(stored);
      setApiWalletAddress(address);
      setStatus("authenticated");
      return;
    }

    // Auto sign-in when wallet connects
    void signIn(address);
  }, [address, isConnected, signIn]);

  return { status, error, signIn: address ? () => signIn(address) : undefined, isAuthenticated: status === "authenticated" };
}
