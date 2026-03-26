"use client";

import { useState } from "react";
import type { ChatMessage as ChatMessageType } from "../types";
import { ProofModal } from "./ProofModal";

interface ChatMessageProps {
  message: ChatMessageType;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [showProof, setShowProof] = useState(false);
  const isUser = message.role === "user";

  return (
    <>
      <div
        className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
      >
        {/* Avatar */}
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
            isUser
              ? "bg-cyan-400/20 text-cyan-300 border border-cyan-400/30"
              : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
          }`}
        >
          {isUser ? "我" : "AI"}
        </div>

        {/* Bubble */}
        <div className={`flex max-w-[75%] flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
          <div
            className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              isUser
                ? "rounded-tr-sm bg-cyan-400/15 text-white border border-cyan-400/20"
                : "rounded-tl-sm bg-white/5 text-slate-200 border border-white/10"
            }`}
          >
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          </div>

          {/* Footer: timestamp + verified badge */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-600">
              {formatTime(message.timestamp)}
            </span>
            {!isUser && message.proof && (
              <button
                onClick={() => setShowProof(true)}
                className="inline-flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-400 transition hover:bg-green-500/20 hover:border-green-400/50"
              >
                <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Verified
              </button>
            )}
          </div>
        </div>
      </div>

      {showProof && message.proof && (
        <ProofModal
          proof={message.proof}
          onClose={() => setShowProof(false)}
        />
      )}
    </>
  );
}
