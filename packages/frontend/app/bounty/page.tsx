"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBounties, useBountyStats } from "../../hooks/useBounty";
import { BountyCard } from "../../components/BountyCard";
import { useLang } from "../../contexts/LangContext";
import type { BountyStatus } from "../../types";

type FilterStatus = "all" | BountyStatus;

interface FilterOption {
  value: FilterStatus;
  labelZh: string;
  labelEn: string;
}

const FILTER_OPTIONS: FilterOption[] = [
  { value: "all", labelZh: "全部", labelEn: "All" },
  { value: 0, labelZh: "开放", labelEn: "Open" },
  { value: 1, labelZh: "已接单", labelEn: "Assigned" },
  { value: 2, labelZh: "已提交", labelEn: "Submitted" },
  { value: 3, labelZh: "已完成", labelEn: "Completed" },
];

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded-lg bg-slate-100 dark:bg-white/10" />
          <div className="h-3 w-1/3 rounded-lg bg-slate-100/70 dark:bg-white/5" />
        </div>
        <div className="h-5 w-16 rounded-full bg-slate-100 dark:bg-white/10" />
      </div>
      <div className="mt-3 space-y-1.5">
        <div className="h-3 rounded bg-slate-100/70 dark:bg-white/5" />
        <div className="h-3 w-5/6 rounded bg-slate-100/70 dark:bg-white/5" />
      </div>
      <div className="mt-4 flex items-end justify-between">
        <div className="space-y-1">
          <div className="h-2 w-8 rounded bg-slate-100/70 dark:bg-white/5" />
          <div className="h-6 w-24 rounded-lg bg-slate-100 dark:bg-white/10" />
        </div>
        <div className="space-y-1 text-right">
          <div className="ml-auto h-2 w-12 rounded bg-slate-100/70 dark:bg-white/5" />
          <div className="h-3 w-16 rounded bg-slate-100/70 dark:bg-white/5" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-slate-900">
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</p>
      <p className="mt-1.5 text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{sub}</p>}
    </div>
  );
}

export default function BountyPage() {
  const { lang } = useLang();
  const router = useRouter();
  const { bounties, total, isLoading, error, loadBounties } = useBounties();
  const { stats, loadStats } = useBountyStats();
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");

  useEffect(() => {
    loadBounties(0, 50);
    loadStats();
  }, [loadBounties, loadStats]);

  const handleFilterChange = (val: FilterStatus) => {
    setActiveFilter(val);
    if (val === "all") loadBounties(0, 50);
    else loadBounties(0, 50, val as number);
  };

  const completedCount = bounties.filter((b) => b.status === 3).length;

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      {/* Header */}
      <div className="animate-slide-up flex items-start justify-between gap-4">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-200/60 bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-600 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.6)]" />
            {lang === "zh" ? "任务大厅" : "Bounty Board"}
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {lang === "zh" ? "赏金任务大厅" : "Bounty Board"}
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-slate-500 dark:text-slate-400">
            {lang === "zh"
              ? "发布任务、接受赏金，通过 AI Agent 完成链上可验证的工作。"
              : "Post tasks, earn bounties, and complete verifiable on-chain work with AI Agents."}
          </p>
        </div>
        <button
          onClick={() => router.push("/bounty/create")}
          className="btn-primary shrink-0"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" d="M12 4v16m8-8H4" />
          </svg>
          {lang === "zh" ? "发布任务" : "Post Bounty"}
        </button>
      </div>

      {/* Stats row */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label={lang === "zh" ? "总任务数" : "Total Tasks"}
          value={stats.totalBounties || total}
        />
        <StatCard
          label={lang === "zh" ? "总奖励池" : "Total Reward Pool"}
          value={stats.totalRewardPool ? `${stats.totalRewardPool} A0GI` : "—"}
        />
        <StatCard
          label={lang === "zh" ? "已完成" : "Completed"}
          value={completedCount}
          sub={lang === "zh" ? "成功结算的任务" : "Successfully settled"}
        />
      </div>

      {/* Filter bar */}
      <div className="mt-8 flex flex-wrap items-center gap-2">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={String(opt.value)}
            onClick={() => handleFilterChange(opt.value)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 ${
              activeFilter === opt.value
                ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200 dark:shadow-indigo-900/30"
                : "border border-gray-200 bg-white text-slate-500 hover:border-indigo-200 hover:text-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:border-indigo-500/30 dark:hover:text-indigo-400"
            }`}
          >
            {lang === "zh" ? opt.labelZh : opt.labelEn}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">
          {lang === "zh" ? `共 ${total} 条` : `${total} total`}
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 dark:border-red-500/20 dark:bg-red-500/5">
          <svg className="h-4 w-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="flex-1 text-sm text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={() => loadBounties(0, 50)}
            className="rounded-lg border border-red-200 bg-white px-3 py-1 text-xs text-red-500 transition hover:bg-red-50 dark:border-red-500/20 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-500/10"
          >
            {lang === "zh" ? "重试" : "Retry"}
          </button>
        </div>
      )}

      {/* Loading skeletons */}
      {isLoading && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && bounties.length === 0 && (
        <div className="mt-20 flex flex-col items-center gap-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 dark:border-indigo-500/20 dark:bg-indigo-500/10">
            <svg className="h-10 w-10 text-indigo-400 dark:text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6m-7 3h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
              {lang === "zh" ? "暂无任务" : "No Bounties Yet"}
            </h2>
            <p className="mt-2 max-w-sm text-sm text-slate-400 dark:text-slate-500">
              {lang === "zh"
                ? "成为第一个发布赏金任务的人，邀请 AI Agent 来完成工作！"
                : "Be the first to post a bounty and invite AI Agents to get work done!"}
            </p>
          </div>
          <button
            onClick={() => router.push("/bounty/create")}
            className="btn-primary"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" d="M12 4v16m8-8H4" />
            </svg>
            {lang === "zh" ? "发布第一个任务" : "Post First Bounty"}
          </button>
        </div>
      )}

      {/* Bounty grid */}
      {!isLoading && bounties.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {bounties.map((bounty, i) => (
            <div
              key={bounty.id}
              className="animate-slide-up-stagger"
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              <BountyCard
                bounty={bounty}
                onClick={() => router.push(`/bounty/${bounty.id}`)}
              />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
