"use client";

import { useState, useEffect, useCallback } from "react";
import { apiGet, apiPost } from "../lib/api";
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

export function useAgents(ownerAddress?: string) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    if (!ownerAddress) {
      setAgents([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiGet<Agent[]>(`/agents/owner/${ownerAddress}`);
      setAgents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch agents");
      setAgents([]);
    } finally {
      setIsLoading(false);
    }
  }, [ownerAddress]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  return { agents, isLoading, error, refetch: fetchAgents };
}

export function useAgent(agentId?: string) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAgent = useCallback(async () => {
    if (!agentId) {
      setAgent(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiGet<Agent>(`/agents/${agentId}`);
      setAgent(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch agent");
      setAgent(null);
    } finally {
      setIsLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchAgent();
  }, [fetchAgent]);

  return { agent, isLoading, error, refetch: fetchAgent };
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
