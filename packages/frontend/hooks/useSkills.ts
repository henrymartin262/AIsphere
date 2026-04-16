"use client";

import { useState, useEffect, useCallback } from "react";
import { apiGet, setApiWalletAddress } from "../lib/api";

export interface SkillData {
  name: string;
  description: string;
  language: string;
  code: string;
  enabled: boolean;
  version: string;
  author: string;
}

export interface SkillItem {
  id: string;
  agentId: number;
  skill: SkillData;
  timestamp: number;
  tags: string[];
}

interface SkillsResponse {
  skills?: SkillItem[];
}

export function useSkills(agentId: string, address: string) {
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSkills = useCallback(async () => {
    if (!agentId) {
      setSkills([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      if (address) setApiWalletAddress(address);
      const params = address ? { address: address.toLowerCase() } : undefined;
      const data = await apiGet<SkillsResponse | SkillItem[]>(
        `/skills/${agentId}`,
        params
      );
      const items: SkillItem[] = Array.isArray(data)
        ? data
        : (data as SkillsResponse).skills ?? [];
      setSkills(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch skills");
      setSkills([]);
    } finally {
      setIsLoading(false);
    }
  }, [agentId, address]);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  return { skills, isLoading, error, refetch: fetchSkills };
}
