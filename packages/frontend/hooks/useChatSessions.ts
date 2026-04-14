"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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

function makeId() {
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function createSession(): ChatSession {
  return {
    id: makeId(),
    title: "New Chat",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [],
  };
}

export function useChatSessions(agentId: string) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Ref always holds the latest activeSessionId — prevents stale closure in auto-save
  const activeSessionIdRef = useRef<string | null>(null);
  // Flag: true while switching sessions — blocks auto-save to prevent bleeding
  const switchingRef = useRef(false);

  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  // Load from localStorage on mount
  useEffect(() => {
    if (!agentId) return;
    const stored = loadSessions(agentId);
    if (stored.length > 0) {
      setSessions(stored);
      setActiveSessionId(stored[0].id);
      activeSessionIdRef.current = stored[0].id;
    } else {
      const s = createSession();
      setSessions([s]);
      setActiveSessionId(s.id);
      activeSessionIdRef.current = s.id;
    }
  }, [agentId]);

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;

  // Auto-save messages to the session they belong to.
  // Uses ref (not stale closure) so switching sessions can't pollute new session.
  const updateSessionMessages = useCallback((sessionId: string, messages: ChatMessage[]) => {
    // Guard: don't save if we're in the middle of a session switch
    if (switchingRef.current) return;
    // Guard: only save if sessionId matches the current active session
    if (sessionId !== activeSessionIdRef.current) return;

    setSessions((prev) => {
      const next = prev.map((s) => {
        if (s.id !== sessionId) return s;
        const firstUserMsg = messages.find((m) => m.role === "user")?.content?.slice(0, 40);
        const title = firstUserMsg || s.title;
        return { ...s, messages, title, updatedAt: Date.now() };
      });
      next.sort((a, b) => b.updatedAt - a.updatedAt);
      saveSessions(agentId, next);
      return next;
    });
  }, [agentId]);

  // Create a new session
  const newSession = useCallback(() => {
    switchingRef.current = true;
    const s = createSession();
    setSessions((prev) => {
      const next = [s, ...prev];
      saveSessions(agentId, next);
      return next;
    });
    setActiveSessionId(s.id);
    activeSessionIdRef.current = s.id;
    // Unblock auto-save after React has flushed
    setTimeout(() => { switchingRef.current = false; }, 100);
    return s;
  }, [agentId]);

  // Switch to existing session
  const switchSession = useCallback((sessionId: string) => {
    switchingRef.current = true;
    setActiveSessionId(sessionId);
    activeSessionIdRef.current = sessionId;
    setTimeout(() => { switchingRef.current = false; }, 100);
  }, []);

  // Rename a session
  const renameSession = useCallback((sessionId: string, title: string) => {
    setSessions((prev) => {
      const next = prev.map((s) => s.id === sessionId ? { ...s, title: title.trim() || s.title } : s);
      saveSessions(agentId, next);
      return next;
    });
  }, [agentId]);

  // Delete a session
  const deleteSession = useCallback((sessionId: string) => {
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== sessionId);
      if (next.length === 0) {
        const fresh = createSession();
        saveSessions(agentId, [fresh]);
        setActiveSessionId(fresh.id);
        activeSessionIdRef.current = fresh.id;
        return [fresh];
      }
      saveSessions(agentId, next);
      if (sessionId === activeSessionIdRef.current) {
        setActiveSessionId(next[0].id);
        activeSessionIdRef.current = next[0].id;
      }
      return next;
    });
  }, [agentId]);

  return {
    sessions,
    activeSession,
    activeSessionId,
    updateSessionMessages,
    newSession,
    switchSession,
    renameSession,
    deleteSession,
  };
}
