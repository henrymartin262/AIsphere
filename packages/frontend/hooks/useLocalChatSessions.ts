"use client";

import { useState, useEffect } from "react";
import type { ChatMessage } from "../types";

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

/**
 * Read chat sessions for an agent from localStorage.
 * Returns only sessions with ≥1 message, sorted by updatedAt desc.
 */
export function useLocalChatSessions(agentId: string): ChatSession[] {
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  useEffect(() => {
    if (!agentId || typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(`aisphere:sessions:${agentId}`);
      if (!raw) return;
      const parsed: ChatSession[] = JSON.parse(raw);
      setSessions(
        parsed
          .filter((s) => s.messages && s.messages.length > 0)
          .sort((a, b) => b.updatedAt - a.updatedAt)
      );
    } catch {
      setSessions([]);
    }
  }, [agentId]);

  return sessions;
}
