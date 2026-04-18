"use client";

import { useState, useEffect, useCallback } from "react";
import { apiGet } from "../lib/api";
import type { MemoryItem } from "../types";

interface MemoryResponse {
  memories?: MemoryItem[];
}

export function useMemory(agentId?: string, address?: string) {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMemories = useCallback(async () => {
    if (!agentId) {
      setMemories([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const params = address ? { address: address.toLowerCase() } : undefined;
      const data = await apiGet<MemoryResponse | MemoryItem[]>(`/memory/${agentId}`, params);
      const items: MemoryItem[] = Array.isArray(data)
        ? data
        : (data as MemoryResponse).memories ?? [];
      setMemories(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch memories");
      // Don't clear existing memories on error — keep showing stale data
    } finally {
      setIsLoading(false);
    }
  }, [agentId, address]);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  return { memories, isLoading, error, refetch: fetchMemories };
}
