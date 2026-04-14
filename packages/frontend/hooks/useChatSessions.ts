"use client";

import { useState, useCallback, useEffect } from "react";
import type { ChatMessage } from "../types";

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

const SESSION_KEY = (agentId: string) => `aisphere:sessions:${agentId}`;
const MAX_SESSIONS = 50;

function loadSessions(agentId: string): ChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SESSION_KEY(agentId));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveSessions(agentId: string, sessions: ChatSession[]) {
  localStorage.setItem(SESSION_KEY(agentId), JSON.stringify(sessions.slice(0, MAX_SESSIONS)));
}

function createSession(): ChatSession {
  return {
    id: `s_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title: "New Chat",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
  };
}

export function useChatSessions(agentId: string) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    if (!agentId) return;
    const stored = loadSessions(agentId);
    if (stored.length > 0) {
      setSessions(stored);
      setActiveSessionId(stored[0].id); // most recent first
    } else {
      const s = createSession();
      setSessions([s]);
      setActiveSessionId(s.id);
    }
  }, [agentId]);

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;

  // Update messages in current session
  const updateSessionMessages = useCallback((sessionId: string, messages: ChatMessage[]) => {
    setSessions((prev) => {
      const next = prev.map((s) => {
        if (s.id !== sessionId) return s;
        const title = messages.find((m) => m.role === "user")?.content?.slice(0, 40) ?? s.title;
        return { ...s, messages, title: title || s.title, updatedAt: Date.now() };
      });
      // Sort by updatedAt desc so most recent is first
      next.sort((a, b) => b.updatedAt - a.updatedAt);
      saveSessions(agentId, next);
      return next;
    });
  }, [agentId]);

  // Create a new session
  const newSession = useCallback(() => {
    const s = createSession();
    setSessions((prev) => {
      const next = [s, ...prev];
      saveSessions(agentId, next);
      return next;
    });
    setActiveSessionId(s.id);
    return s;
  }, [agentId]);

  // Delete a session
  const deleteSession = useCallback((sessionId: string) => {
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== sessionId);
      saveSessions(agentId, next);
      // If deleted was active, switch to next
      if (sessionId === activeSessionId) {
        const newActive = next[0] ?? createSession();
        if (next.length === 0) {
          saveSessions(agentId, [newActive]);
          return [newActive];
        }
        setActiveSessionId(newActive.id);
      }
      return next;
    });
  }, [agentId, activeSessionId]);

  const switchSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
  }, []);

  return {
    sessions,
    activeSession,
    activeSessionId,
    updateSessionMessages,
    newSession,
    deleteSession,
    switchSession,
  };
}
