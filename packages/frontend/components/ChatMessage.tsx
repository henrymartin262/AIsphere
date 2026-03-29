"use client";

import { useState } from "react";
import type { ChatMessage as ChatMessageType } from "../types";
import { ProofModal } from "./ProofModal";

interface ChatMessageProps {
  message: ChatMessageType;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [showProof, setShowProof] = useState(false);
  const isUser = message.role === "user";

  return (
    <>
      <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        {/* Avatar */}
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          isUser
            ? "border border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-400/30 dark:bg-indigo-500/15 dark:text-indigo-300"
            : "border border-gray-200 bg-gray-50 text-gray-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400"
        }`}>
          {isUser ? "我" : "AI"}
        </div>

        {/* Bubble */}
        <div className={`flex max-w-[75%] flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
          <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "rounded-tr-sm bg-indigo-500 text-white dark:bg-indigo-600"
              : "rounded-tl-sm border border-gray-200 bg-white text-gray-800 dark:border-white/[0.08] dark:bg-white/5 dark:text-slate-200"
          }`}>
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 dark:text-slate-600">{formatTime(message.timestamp)}</span>
            {!isUser && message.proof && (
              <button onClick={() => setShowProof(true)}
                className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-600 transition hover:bg-green-100 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-400 dark:hover:bg-green-500/20">
                <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Verified
              </button>
            )}
          </div>
        </div>
      </div>

      {showProof && message.proof && (
        <ProofModal proof={message.proof} onClose={() => setShowProof(false)} />
      )}
    </>
  );
}
