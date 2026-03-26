"use client";

import { useState, useEffect, useCallback } from "react";
import { apiGet } from "../lib/api";
import type { Decision, DecisionStats } from "../types";

interface DecisionsResponse {
  decisions?: Decision[];
  total?: number;
}

interface StatsResponse {
  stats?: DecisionStats;
  total?: number;
  onChain?: number;
  batched?: number;
  local?: number;
}

const LIMIT = 20;

export function useDecisions(agentId: string, page = 1) {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<DecisionStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(page);

  const fetchDecisions = useCallback(async (p: number) => {
    if (!agentId) {
      setDecisions([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [decisionsData, statsData] = await Promise.all([
        apiGet<DecisionsResponse | Decision[]>(`/decisions/${agentId}`, {
          page: String(p),
          limit: String(LIMIT),
        }),
        apiGet<StatsResponse>(`/decisions/${agentId}/stats`),
      ]);

      const items: Decision[] = Array.isArray(decisionsData)
        ? decisionsData
        : (decisionsData as DecisionsResponse).decisions ?? [];
      const totalCount: number = Array.isArray(decisionsData)
        ? items.length
        : (decisionsData as DecisionsResponse).total ?? items.length;

      setDecisions(items);
      setTotal(totalCount);

      if ((statsData as StatsResponse).stats) {
        setStats((statsData as StatsResponse).stats!);
      } else {
        const s = statsData as StatsResponse;
        setStats({
          total: s.total ?? 0,
          onChain: s.onChain ?? 0,
          batched: s.batched ?? 0,
          local: s.local ?? 0,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch decisions");
      setDecisions([]);
    } finally {
      setIsLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetchDecisions(currentPage);
  }, [fetchDecisions, currentPage]);

  const nextPage = useCallback(() => {
    if (currentPage * LIMIT < total) {
      setCurrentPage((p) => p + 1);
    }
  }, [currentPage, total]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage((p) => p - 1);
    }
  }, [currentPage]);

  return {
    decisions,
    total,
    stats,
    isLoading,
    error,
    currentPage,
    totalPages: Math.ceil(total / LIMIT),
    nextPage,
    prevPage,
  };
}
