"use client";
import { useState, useCallback } from "react";
import type { Bounty, BountyStats } from "../types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export function useBounties() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBounties = useCallback(async (offset = 0, limit = 20, status?: number) => {
    setIsLoading(true); setError(null);
    try {
      const params = new URLSearchParams({ offset: String(offset), limit: String(limit) });
      if (status !== undefined) params.set("status", String(status));
      const res = await fetch(`${API_BASE}/bounty?${params}`);
      const json = await res.json();
      if (json.success) { setBounties(json.data.bounties); setTotal(json.data.total); }
      else setError(json.error ?? "Failed to load bounties");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally { setIsLoading(false); }
  }, []);

  return { bounties, total, isLoading, error, loadBounties };
}

export function useBountyStats() {
  const [stats, setStats] = useState<BountyStats>({ totalBounties: 0, totalRewardPool: "0" });
  const [isLoading, setIsLoading] = useState(false);

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/bounty/stats`);
      const json = await res.json();
      if (json.success) setStats(json.data);
    } catch { /* ignore */ } finally { setIsLoading(false); }
  }, []);

  return { stats, isLoading, loadStats };
}

export function useCreateBounty() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBounty = useCallback(async (
    params: { title: string; description: string; deadline: number; rewardEth: string },
    walletAddress: string
  ) => {
    setIsLoading(true); setError(null);
    try {
      const rewardWei = String(Math.floor(parseFloat(params.rewardEth) * 1e18));
      const res = await fetch(`${API_BASE}/bounty`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-wallet-address": walletAddress },
        body: JSON.stringify({ ...params, rewardWei })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed to create bounty");
      return json.data as { bountyId: number; txHash: string };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed";
      setError(msg); throw e;
    } finally { setIsLoading(false); }
  }, []);

  return { createBounty, isLoading, error };
}

export function useAcceptBounty() {
  const [isLoading, setIsLoading] = useState(false);

  const acceptBounty = useCallback(async (
    bountyId: number, agentId: number, agentOwnerAddress: string
  ) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/bounty/${bountyId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-wallet-address": agentOwnerAddress },
        body: JSON.stringify({ agentId, agentOwnerAddress })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed");
      return json.data;
    } finally { setIsLoading(false); }
  }, []);

  return { acceptBounty, isLoading };
}

export function useSubmitResult() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitResult = useCallback(async (
    bountyId: number, resultProofHash: string, agentOwnerAddress: string
  ) => {
    setIsLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/bounty/${bountyId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-wallet-address": agentOwnerAddress },
        body: JSON.stringify({ resultProofHash })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed to submit result");
      return json.data;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed";
      setError(msg); throw e;
    } finally { setIsLoading(false); }
  }, []);

  return { submitResult, isLoading, error };
}

export function useCompleteBounty() {
  const [isLoading, setIsLoading] = useState(false);

  const completeBounty = useCallback(async (bountyId: number, creatorAddress: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/bounty/${bountyId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-wallet-address": creatorAddress },
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed to complete bounty");
      return json.data;
    } finally { setIsLoading(false); }
  }, []);

  return { completeBounty, isLoading };
}

export function useDisputeBounty() {
  const [isLoading, setIsLoading] = useState(false);

  const disputeBounty = useCallback(async (bountyId: number, creatorAddress: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/bounty/${bountyId}/dispute`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-wallet-address": creatorAddress },
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed to dispute bounty");
      return json.data;
    } finally { setIsLoading(false); }
  }, []);

  return { disputeBounty, isLoading };
}
