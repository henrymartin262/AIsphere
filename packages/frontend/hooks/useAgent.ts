"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { apiGet, apiPost, setApiWalletAddress } from "../lib/api";
import type { Agent } from "../types";

interface CreateAgentPayload {
  name: string;
  model: string;
  description?: string;
  personality?: string;
  ownerAddress: string;
}

interface CreateAgentResponse {
  agentId: number;
  txHash?: string;
}

// ─── Global in-memory cache (persists across component mounts) ────────────────
const agentCache = new Map<string, { data: Agent; expiresAt: number }>();
const agentsCache = new Map<string, { data: Agent[]; expiresAt: number }>();
const CACHE_TTL = 30_000; // 30s

function getCachedAgent(key: string): Agent | null {
  const entry = agentCache.get(key);
  if (entry && Date.now() < entry.expiresAt) return entry.data;
  return null;
}
function getCachedAgents(key: string): Agent[] | null {
  const entry = agentsCache.get(key);
  if (entry && Date.now() < entry.expiresAt) return entry.data;
  return null;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useAgents(ownerAddress?: string) {
  const [agents, setAgents] = useState<Agent[]>(() => {
    if (!ownerAddress) return [];
    return getCachedAgents(ownerAddress) ?? [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  const fetchAgents = useCallback(async (force = false) => {
    if (!ownerAddress) { setAgents([]); return; }

    // Return cache if fresh and not forced
    if (!force) {
      const cached = getCachedAgents(ownerAddress);
      if (cached) { setAgents(cached); return; }
    }

    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      // Ensure wallet address is set before request (WalletSync may not have fired yet)
      setApiWalletAddress(ownerAddress);
      const data = await apiGet<Agent[]>(`/agents/owner/${ownerAddress}`);
      const list = Array.isArray(data) ? data : [];
      agentsCache.set(ownerAddress, { data: list, expiresAt: Date.now() + CACHE_TTL });
      setAgents(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch agents");
      setAgents([]);
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  }, [ownerAddress]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  return { agents, isLoading, error, refetch: () => fetchAgents(true) };
}

export function useAgent(agentId?: string) {
  const [agent, setAgent] = useState<Agent | null>(() => {
    if (!agentId) return null;
    return getCachedAgent(agentId);
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  const fetchAgent = useCallback(async (force = false) => {
    if (!agentId) { setAgent(null); return; }

    // Return cache if fresh and not forced
    if (!force) {
      const cached = getCachedAgent(agentId);
      if (cached) { setAgent(cached); return; }
    }

    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiGet<Agent>(`/agents/${agentId}`);
      if (data) {
        agentCache.set(agentId, { data, expiresAt: Date.now() + CACHE_TTL });
        setAgent(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch agent");
      setAgent(null);
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  }, [agentId]);

  useEffect(() => {
    fetchAgent();
  }, [fetchAgent]);

  return { agent, isLoading, error, refetch: () => fetchAgent(true) };
}

export function useCreateAgent() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAgent = useCallback(
    async (payload: CreateAgentPayload): Promise<CreateAgentResponse | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiPost<CreateAgentResponse>("/agents", payload);
        // Invalidate owner cache so dashboard refreshes
        if (payload.ownerAddress) agentsCache.delete(payload.ownerAddress);
        return data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create agent");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { createAgent, isLoading, error };
}
