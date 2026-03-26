"use client";

import { useState, useCallback } from "react";
import { apiPost, apiGet } from "../lib/api";
import type { ChatMessage, InferenceProof } from "../types";

interface RawMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
  proof?: InferenceProof;
}

interface ChatResponse {
  reply: string;
  proof?: InferenceProof;
  messageId?: string;
}

interface HistoryResponse {
  messages?: RawMessage[];
}

export function useChat(agentId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!agentId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiGet<HistoryResponse | RawMessage[]>(
        `/chat/${agentId}/history`
      );
      const rawMessages: RawMessage[] = Array.isArray(data)
        ? data
        : (data as HistoryResponse).messages ?? [];

      const normalized: ChatMessage[] = rawMessages.map((m, i) => ({
        id: m.id ?? `history-${i}-${Date.now()}`,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp ?? Date.now(),
        proof: m.proof,
      }));
      setMessages(normalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setIsLoading(false);
    }
  }, [agentId]);

  const sendMessage = useCallback(
    async (content: string, importance = 3): Promise<void> => {
      if (!content.trim() || !agentId) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setError(null);

      try {
        const data = await apiPost<ChatResponse>(`/chat/${agentId}`, {
          message: content,
          importance,
        });

        const assistantMsg: ChatMessage = {
          id: data.messageId ?? `assistant-${Date.now()}`,
          role: "assistant",
          content: data.reply,
          timestamp: Date.now(),
          proof: data.proof,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send message");
        // Remove the optimistically added user message on error
        setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
      } finally {
        setIsLoading(false);
      }
    },
    [agentId]
  );

  return { messages, sendMessage, isLoading, error, loadHistory };
}
