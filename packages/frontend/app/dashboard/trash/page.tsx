"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import Link from "next/link";
import { useAgents } from "../../../hooks/useAgent";
import { useLang } from "../../../contexts/LangContext";
import type { Agent } from "../../../types";

const STORAGE_KEY = "aisphere:deleted-agents";

function getDeletedIds(): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return new Set(stored ? JSON.parse(stored) : []);
  } catch { return new Set(); }
}

function saveDeletedIds(ids: Set<number>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

export default function TrashPage() {
  const { address, isConnected } = useAccount();
  const { agents, isLoading } = useAgents(address);
  const { t } = useLang();
  const [deletedIds, setDeletedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    setDeletedIds(getDeletedIds());
  }, []);

  const trashedAgents = agents.filter((a) => deletedIds.has(a.agentId));

  function handleRestore(agentId: number) {
    setDeletedIds((prev) => {
      const next = new Set(prev);
      next.delete(agentId);
      saveDeletedIds(next);
      return next;
    });
  }

  function handleEmptyTrash() {
    setDeletedIds(new Set());
    saveDeletedIds(new Set());
  }

  const isZh = t("nav_home") !== "Home";

  if (!isConnected) {
    return (
      <main className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-6 px-6 py-20">
        <p className="text-slate-400">{isZh ? "请先连接钱包" : "Please connect your wallet"}</p>
        <Link href="/dashboard" className="btn-primary">{isZh ? "返回" : "Back"}</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {isZh ? "🗑️ 回收站" : "🗑️ Trash"}
            </h1>
            <p className="mt-0.5 text-sm text-slate-400">
              {isZh
                ? "已删除的 Agent 仍存在于链上，可随时恢复"
                : "Deleted Agents still exist on-chain and can be restored anytime"}
            </p>
          </div>
        </div>
        {trashedAgents.length > 0 && (
          <button onClick={handleEmptyTrash}
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-100 transition-colors">
            {isZh ? "清空回收站" : "Empty Trash"}
          </button>
        )}
      </div>

      {/* Info banner */}
      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50/60 px-5 py-4">
        <svg className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z"/>
        </svg>
        <div className="text-sm text-amber-700">
          <p className="font-semibold">{isZh ? "为什么不能永久删除？" : "Why can't agents be permanently deleted?"}</p>
          <p className="mt-1 text-amber-600">
            {isZh
              ? "Agent 的身份 INFT 存储在 0G 区块链上，区块链数据不可篡改。删除只是将 Agent 从你的仪表盘隐藏。若需彻底销毁，可通过钱包发送 burn 交易（需 gas 费用）。"
              : "Agent identity INFTs live on the 0G blockchain, which is immutable by design. Deletion only hides agents from your dashboard. To truly destroy one, send a burn transaction from your wallet (requires gas)."}
          </p>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-200 border-t-orange-500" />
        </div>
      )}

      {/* Empty */}
      {!isLoading && trashedAgents.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-4xl">
            🗑️
          </div>
          <p className="text-slate-400">{isZh ? "回收站是空的" : "Trash is empty"}</p>
          <Link href="/dashboard" className="btn-primary mt-2">
            {isZh ? "返回仪表盘" : "Back to Dashboard"}
          </Link>
        </div>
      )}

      {/* Trashed agents */}
      {!isLoading && trashedAgents.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {trashedAgents.map((agent) => (
            <div key={agent.agentId} className="card p-5 opacity-70 hover:opacity-100 transition-opacity">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
                    <svg className="h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <rect x="3" y="3" width="18" height="18" rx="4"/>
                      <circle cx="12" cy="10" r="3"/>
                      <path d="M7 20c0-2.8 2.2-5 5-5s5 2.2 5 5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700 line-through">{agent.profile?.name ?? `Agent #${agent.agentId}`}</p>
                    <p className="text-xs text-slate-400">#{agent.agentId} · {agent.profile?.model ?? "—"}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRestore(agent.agentId)}
                  className="shrink-0 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-100 transition-colors"
                >
                  {isZh ? "恢复" : "Restore"}
                </button>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  { v: agent.stats?.totalInferences ?? 0, l: isZh ? "推理" : "Inferences" },
                  { v: agent.stats?.totalMemories ?? 0, l: isZh ? "记忆" : "Memories" },
                  { v: agent.stats?.trustScore ?? 0, l: isZh ? "信任" : "Trust" },
                ].map(({ v, l }) => (
                  <div key={l} className="rounded-xl bg-slate-50 border border-slate-100 p-2 text-center">
                    <p className="text-sm font-bold text-slate-500">{v}</p>
                    <p className="text-[9px] text-slate-400 uppercase tracking-wide">{l}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
