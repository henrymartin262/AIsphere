"use client";

import type { Bounty, BountyStatus } from "../types";
import { useLang } from "../contexts/LangContext";

interface BountyCardProps {
  bounty: Bounty;
  onClick?: () => void;
}

const STATUS_STYLES: Record<BountyStatus, { badge: string; dot: string; border: string; glow: string }> = {
  0: { badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20", dot: "bg-emerald-500", border: "hover:border-emerald-300 dark:hover:border-emerald-500/40", glow: "bg-emerald-400/[0.06]" },
  1: { badge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20", dot: "bg-blue-500", border: "hover:border-blue-300 dark:hover:border-blue-500/40", glow: "bg-blue-400/[0.06]" },
  2: { badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20", dot: "bg-amber-500", border: "hover:border-amber-300 dark:hover:border-amber-500/40", glow: "bg-amber-400/[0.06]" },
  3: { badge: "bg-slate-50 text-slate-600 border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/10", dot: "bg-slate-400", border: "hover:border-slate-300 dark:hover:border-white/20", glow: "bg-slate-400/[0.04]" },
  4: { badge: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20", dot: "bg-red-500 animate-pulse", border: "hover:border-red-300 dark:hover:border-red-500/40", glow: "bg-red-400/[0.06]" },
  5: { badge: "bg-slate-50 text-slate-500 border-slate-200 dark:bg-white/5 dark:text-slate-500 dark:border-white/10", dot: "bg-slate-400", border: "hover:border-slate-200 dark:hover:border-white/15", glow: "bg-slate-400/[0.03]" },
  6: { badge: "bg-slate-50 text-slate-500 border-slate-200 dark:bg-white/5 dark:text-slate-500 dark:border-white/10", dot: "bg-slate-300", border: "hover:border-slate-200 dark:hover:border-white/15", glow: "bg-slate-400/[0.03]" },
};

const STATUS_LABELS_ZH: Record<BountyStatus, string> = {
  0: "开放", 1: "已接单", 2: "已提交", 3: "已完成", 4: "争议中", 5: "已过期", 6: "已取消",
};

const STATUS_LABELS_EN: Record<BountyStatus, string> = {
  0: "Open", 1: "Assigned", 2: "Submitted", 3: "Completed", 4: "Disputed", 5: "Expired", 6: "Cancelled",
};

function formatDeadline(deadline: number, lang: string): string {
  const now = Date.now() / 1000;
  const diff = deadline - now;
  if (diff < 0) return lang === "zh" ? "已截止" : "Expired";
  if (diff < 3600) return lang === "zh" ? `${Math.floor(diff / 60)}分钟后` : `${Math.floor(diff / 60)}m left`;
  if (diff < 86400) return lang === "zh" ? `${Math.floor(diff / 3600)}小时后` : `${Math.floor(diff / 3600)}h left`;
  return lang === "zh" ? `${Math.floor(diff / 86400)}天后` : `${Math.floor(diff / 86400)}d left`;
}

function shortenAddress(addr: string): string {
  if (!addr || addr === "0x0000000000000000000000000000000000000000") return "—";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function BountyCard({ bounty, onClick }: BountyCardProps) {
  const { lang } = useLang();
  const styles = STATUS_STYLES[bounty.status] ?? STATUS_STYLES[0];
  const statusLabel = lang === "zh" ? STATUS_LABELS_ZH[bounty.status] : STATUS_LABELS_EN[bounty.status];
  const deadlineStr = formatDeadline(bounty.deadline, lang);
  const isExpiredOrDead = bounty.status === 5 || bounty.status === 6 || bounty.isExpired;

  return (
    <article
      onClick={onClick}
      className={`group hover-lift animate-in relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 cursor-pointer flex flex-col dark:border-white/8 dark:bg-slate-900 ${styles.border} hover:shadow-md`}
    >
      {/* Background glow */}
      <div className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full ${styles.glow} blur-[40px] opacity-0 transition-opacity group-hover:opacity-100`} />

      <div className="relative z-10 flex flex-col flex-1">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-slate-800 transition-colors group-hover:text-indigo-600 dark:text-slate-100 dark:group-hover:text-indigo-400">
              {bounty.title}
            </h3>
            <p className="mt-0.5 font-mono text-[10px] text-slate-400 dark:text-slate-500">
              #{bounty.id} · {shortenAddress(bounty.creator)}
            </p>
          </div>
          {/* Status badge */}
          <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${styles.badge}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
            {statusLabel}
          </span>
        </div>

        {/* Description */}
        <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          {bounty.description || (lang === "zh" ? "暂无描述" : "No description provided.")}
        </p>

        {/* Assigned agent row (shown if assigned) — fixed height spacer when absent */}
        <div className="mt-3 h-8">
          {bounty.assignedAgentId > 0 ? (
            <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-1.5 dark:border-blue-500/15 dark:bg-blue-500/5">
              <svg className="h-3 w-3 text-blue-500 dark:text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="3" width="18" height="18" rx="4" />
                <circle cx="12" cy="10" r="3" />
                <path d="M7 20c0-2.8 2.2-5 5-5s5 2.2 5 5" strokeLinecap="round" />
              </svg>
              <span className="text-[10px] text-blue-600 dark:text-blue-400">
                {lang === "zh" ? `Agent #${bounty.assignedAgentId}` : `Agent #${bounty.assignedAgentId}`}
                <span className="ml-1 font-mono text-blue-400 dark:text-blue-500">{shortenAddress(bounty.assignedOwner)}</span>
              </span>
            </div>
          ) : null}
        </div>

        {/* Reward + deadline row — pinned to bottom */}
        <div className="mt-auto pt-3 border-t border-slate-100 dark:border-white/8 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {lang === "zh" ? "赏金" : "Reward"}
            </p>
            <p className="mt-0.5 text-xl font-bold text-indigo-600 dark:text-indigo-400">
              {bounty.rewardEth}
              <span className="ml-1 text-xs font-normal text-slate-400 dark:text-slate-500">A0GI</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {lang === "zh" ? "截止时间" : "Deadline"}
            </p>
            <p className={`mt-0.5 text-xs font-medium ${isExpiredOrDead ? "text-slate-400 dark:text-slate-500" : "text-slate-700 dark:text-slate-300"}`}>
              {deadlineStr}
            </p>
          </div>
        </div>

        {/* Footer arrow */}
        <div className="mt-2 flex items-center justify-end">
          <span className="flex items-center gap-1 text-[10px] text-indigo-500 opacity-0 transition-all -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 dark:text-indigo-400">
            {lang === "zh" ? "查看详情" : "View details"}
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d="M13 7l5 5-5 5M6 12h12" />
            </svg>
          </span>
        </div>
      </div>
    </article>
  );
}
