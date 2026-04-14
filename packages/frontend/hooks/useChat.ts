"use client";

import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { apiPost, apiGet, setApiWalletAddress, getApiWalletAddress, CHAT_TIMEOUT } from "../lib/api";
import type { ChatMessage, InferenceProof } from "../types";

interface RawMessage {
  id?: string;
  role?: "user" | "assistant";
  type?: string;
  content: string;
  timestamp?: number;
  proof?: InferenceProof;
}

interface ChatResponse {
  response?: string;  // backend returns "response"
  reply?: string;     // fallback
  proof?: InferenceProof & { proofHash?: string; teeVerified?: boolean };
  messageId?: string;
}

export function useChat(agentId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { address } = useAccount();

  const walletAddress = address ?? "";

  const loadHistory = useCallback(async () => {
    if (!agentId) return;
    // Skip loading history if no wallet connected — not an error
    if (!walletAddress) return;
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = { walletAddress };

      const data = await apiGet<RawMessage[]>(`/chat/${agentId}/history`, params);
      const rawMessages: RawMessage[] = Array.isArray(data) ? data : [];

      const normalized: ChatMessage[] = rawMessages.map((m, i) => {
        // backend stores "User: ..." and "Agent: ..." in content
        const isAgent = m.content?.startsWith("Agent:") || m.type === "conversation" && m.content?.startsWith("Agent:");
        const role: "user" | "assistant" = m.role ?? (isAgent ? "assistant" : "user");
        const content = m.content?.replace(/^(User:|Agent:)\s*/, "") ?? m.content;
        return {
          id: m.id ?? `history-${i}-${Date.now()}`,
          role,
          content,
          timestamp: m.timestamp ?? Date.now(),
          proof: m.proof,
        };
      });
      setMessages(normalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setIsLoading(false);
    }
  }, [agentId, walletAddress]);

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
        // Use a demo address if wallet not connected (for free trial)
        const effectiveWallet = walletAddress || "0x0000000000000000000000000000000000000001";
        // Temporarily set the wallet address in API headers so walletAuth passes
        const prevWallet = getApiWalletAddress();
        if (!prevWallet) setApiWalletAddress(effectiveWallet);

        const data = await apiPost<ChatResponse>(`/chat/${agentId}`, {
          message: content,
          importance,
          walletAddress: effectiveWallet,
        }, CHAT_TIMEOUT);

        // Restore previous wallet address
        if (!prevWallet) setApiWalletAddress(prevWallet);

        // backend returns { response, proof } — support both "response" and "reply"
        const replyText = data.response ?? data.reply ?? "(no response)";

        const assistantMsg: ChatMessage = {
          id: data.messageId ?? `assistant-${Date.now()}`,
          role: "assistant",
          content: replyText,
          timestamp: Date.now(),
          proof: data.proof ? {
            proofHash: data.proof.proofHash ?? "",
            modelHash: data.proof.modelHash ?? "",
            inputHash: data.proof.inputHash ?? "",
            outputHash: data.proof.outputHash ?? "",
            teeVerified: data.proof.teeVerified ?? false,
            onChain: data.proof.onChain ?? false,
            txHash: data.proof.txHash,
            timestamp: data.proof.timestamp ?? Date.now(),
          } : undefined,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send message");
        setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
      } finally {
        setIsLoading(false);
      }
    },
    [agentId, walletAddress]
  );

  return { messages, sendMessage, isLoading, error, loadHistory };
}
