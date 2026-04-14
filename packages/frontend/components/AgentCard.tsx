"use client";

import Link from "next/link";
import { useState } from "react";
import type { Agent } from "../types";
import { useLang } from "../contexts/LangContext";

const LEVEL_STYLES: Record<number, { border: string; badge: string; glow: string; icon: string }> = {
  1: { border: "hover:border-slate-300", badge: "border-slate-200 bg-slate-50 text-slate-600", glow: "bg-slate-100", icon: "text-slate-400" },
  2: { border: "hover:border-emerald-300", badge: "border-emerald-200 bg-emerald-50 text-emerald-600", glow: "bg-emerald-50", icon: "text-emerald-500" },
  3: { border: "hover:border-orange-300", badge: "border-orange-200 bg-orange-50 text-orange-600", glow: "bg-orange-50", icon: "text-orange-500" },
  4: { border: "hover:border-purple-300", badge: "border-purple-200 bg-purple-50 text-purple-600", glow: "bg-purple-50", icon: "text-purple-500" },
  5: { border: "hover:border-amber-300", badge: "border-amber-200 bg-amber-50 text-amber-600", glow: "bg-amber-50", icon: "text-amber-500" },
};

interface AgentCardProps {
  agent: Agent;
  onDelete?: (agentId: number) => void;
}

export function AgentCard({ agent, onDelete }: AgentCardProps) {
  const { t } = useLang();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const level = agent.stats?.level ?? 1;
  const styles = LEVEL_STYLES[level] ?? LEVEL_STYLES[1];

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirmDelete) {
      setConfirmDelete(true);
      // 3秒后自动取消确认态
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    // 软删除：直接通知父组件，无需后端调用
    onDelete?.(agent.agentId);
  }

  const LEVEL_LABELS: Record<number, string> = {
    1: t("card_level_1"),
    2: t("card_level_2"),
    3: t("card_level_3"),
    4: t("card_level_4"),
    5: t("card_level_5"),
  };
  const levelLabel = LEVEL_LABELS[level] ?? `Level ${level}`;
  const tags: string[] = (agent.profile as any)?.tags ?? [];

  return (
    <Link href={`/agent/${agent.agentId}/chat`} className="group block">
      <article className={`card hover-lift animate-in relative h-full overflow-hidden p-6 transition-all duration-300 ${styles.border}`}>
        {/* 悬浮背景光 */}
        <div className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full ${styles.glow} blur-[40px] opacity-0 transition-opacity group-hover:opacity-60`} />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-orange-200/60 bg-gradient-to-br from-brand-50 to-warm-100 transition-transform group-hover:scale-105">
                <svg className="h-6 w-6 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2}>
                  <rect x="3" y="3" width="18" height="18" rx="4" />
                  <circle cx="12" cy="10" r="3" />
                  <path d="M7 20c0-2.8 2.2-5 5-5s5 2.2 5 5" strokeLinecap="round" />
                </svg>
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold text-slate-800 transition-colors group-hover:text-brand-600">
                  {agent.profile?.name ?? `Agent #${agent.agentId}`}
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-400 truncate">
                  {agent.profile?.model ?? "Unknown Model"}
                </p>
              </div>
            </div>
            <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${styles.badge}`}>
              Lv.{level}
              <span className="hidden sm:inline">{levelLabel}</span>
            </span>
          </div>

          {/* Description */}
          {(agent.profile as any)?.description && (
            <p className="mt-3 text-xs text-slate-400 line-clamp-2 leading-relaxed">
              {(agent.profile as any).description}
            </p>
          )}

          {/* Stats */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { value: agent.stats?.totalInferences ?? 0, label: t("card_inferences"), highlight: false },
              { value: agent.stats?.totalMemories ?? 0, label: t("card_memories"), highlight: false },
              { value: agent.stats?.trustScore ?? 0, label: t("card_trust"), highlight: true },
            ].map(({ value, label, highlight }) => (
              <div key={label} className="rounded-xl bg-orange-50/50 border border-orange-100/60 p-2.5 text-center transition-colors group-hover:border-orange-200/60">
                <p className={`text-base font-bold ${highlight ? "text-brand-600" : "text-slate-700"}`}>{value}</p>
                <p className="text-[9px] text-slate-400 mt-0.5 uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.slice(0, 4).map((tag) => (
                <span key={tag} className="rounded-md border border-orange-200/60 bg-orange-50/50 px-2 py-0.5 text-[9px] text-slate-400">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-mono">#{agent.agentId}</span>
            <div className="flex items-center gap-2">
              {onDelete && (
                <button
                  onClick={handleDelete}
                  className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium transition-all ${
                    confirmDelete
                      ? "bg-red-50 text-red-500 border border-red-200 hover:bg-red-100"
                      : "text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100"
                  }`}
                  title={confirmDelete ? "Click again to confirm delete" : "Move to trash"}
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                  {confirmDelete ? (t("nav_home") === "Home" ? "Confirm?" : "确认?") : ""}
                </button>
              )}
              <span className="flex items-center gap-1 text-xs text-brand-500 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0 -translate-x-1">
                {t("nav_home") === "Home" ? "Chat" : "进入对话"}
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" d="M13 7l5 5-5 5M6 12h12" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
