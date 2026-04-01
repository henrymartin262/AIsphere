"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { useLang } from "../../contexts/LangContext";
import { apiGet } from "../../lib/api";
import type { Agent } from "../../types";

// ─── Constants ────────────────────────────────────────────────────────────────

const FREE_TRIAL_LIMIT = 3; // free interactions per agent per session
const TAGS = ["all", "defi", "ai", "chat", "code", "creative"] as const;
type Tag = (typeof TAGS)[number];
type SortKey = "latest" | "level" | "inferences" | "price_asc" | "price_desc";

interface ExploreStats {
  totalAgents: number;
  totalInferences: number;
  totalBounties: number;
}

// ─── Level styles ──────────────────────────────────────────────────────────────

const LEVEL_STYLES: Record<number, { border: string; badge: string; accent: string; glow: string }> = {
  1: { border: "border-slate-200 hover:border-slate-300", badge: "border-slate-200 bg-slate-50 text-slate-600 dark:bg-white/5 dark:text-slate-400", accent: "text-slate-500", glow: "bg-slate-100" },
  2: { border: "border-slate-200 hover:border-emerald-300", badge: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400", accent: "text-emerald-600", glow: "bg-emerald-50" },
  3: { border: "border-slate-200 hover:border-orange-300", badge: "border-orange-200 bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400", accent: "text-orange-600", glow: "bg-orange-50" },
  4: { border: "border-slate-200 hover:border-purple-300", badge: "border-purple-200 bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400", accent: "text-purple-600", glow: "bg-purple-50" },
  5: { border: "border-slate-200 hover:border-amber-300", badge: "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400", accent: "text-amber-600", glow: "bg-amber-50" },
};

const LEVEL_LABELS: Record<string, Record<number, string>> = {
  en: { 1: "Novice", 2: "Apprentice", 3: "Adept", 4: "Expert", 5: "Master" },
  zh: { 1: "新手", 2: "学徒", 3: "熟练", 4: "专家", 5: "大师" },
};

// ─── Trial state (session-scoped, not persisted) ───────────────────────────────

const trialUsage: Map<number, number> = new Map();

function getTrialCount(agentId: number): number {
  return trialUsage.get(agentId) ?? 0;
}
function incrementTrial(agentId: number) {
  trialUsage.set(agentId, (trialUsage.get(agentId) ?? 0) + 1);
}

// ─── Skeleton Card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 animate-pulse dark:border-white/8 dark:bg-slate-900">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-slate-200 dark:bg-slate-700 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="h-6 w-16 rounded-full bg-slate-200 dark:bg-slate-700" />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => <div key={i} className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800" />)}
      </div>
      <div className="mt-4 h-10 rounded-xl bg-slate-100 dark:bg-slate-800" />
    </div>
  );
}

// ─── Buy Modal ─────────────────────────────────────────────────────────────────

function BuyModal({ agent, onClose, lang }: { agent: Agent; onClose: () => void; lang: string }) {
  const [status, setStatus] = useState<"confirm" | "pending" | "done">("confirm");
  const isEn = lang === "en";

  function handleBuy() {
    setStatus("pending");
    // Simulate tx (no real contract interaction in demo)
    setTimeout(() => setStatus("done"), 1800);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        {status === "done" ? (
          <div className="text-center py-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10">
              <svg className="h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-800 dark:text-white">
              {isEn ? "Purchase Successful!" : "购买成功！"}
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              {isEn
                ? `${agent.profile.name} has been transferred to your wallet.`
                : `${agent.profile.name} 已转入你的钱包。`}
            </p>
            <Link
              href={`/agent/${agent.agentId}/chat`}
              className="mt-5 block w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-indigo-700"
              onClick={onClose}
            >
              {isEn ? "Start Chatting →" : "立即对话 →"}
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/10">
                <svg className="h-6 w-6 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <rect x="3" y="3" width="18" height="18" rx="4" />
                  <circle cx="12" cy="10" r="3" />
                  <path d="M7 20c0-2.8 2.2-5 5-5s5 2.2 5 5" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white">{agent.profile.name}</h3>
                <p className="text-xs text-slate-400">{agent.profile.model} · Lv.{agent.stats.level}</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-slate-50 p-4 dark:bg-white/5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">{isEn ? "Purchase Price" : "购买价格"}</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">{agent.price} <span className="text-xs font-normal text-slate-400">A0GI</span></span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                <span>{isEn ? "Network Fee (est.)" : "网络手续费（估算）"}</span>
                <span>~0.001 A0GI</span>
              </div>
              <div className="mt-2 border-t border-slate-200 dark:border-white/10 pt-2 flex items-center justify-between text-sm font-semibold text-slate-700 dark:text-slate-200">
                <span>{isEn ? "Total" : "总计"}</span>
                <span>{(parseFloat(agent.price ?? "0") + 0.001).toFixed(3)} A0GI</span>
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-400 leading-relaxed">
              {isEn
                ? "Purchasing this Agent transfers its INFT to your wallet. All memories and on-chain history are preserved."
                : "购买后，该 Agent 的 INFT 将转入你的钱包，所有记忆和链上历史完整保留。"}
            </p>

            <div className="mt-4 flex gap-2">
              <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-500 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                {isEn ? "Cancel" : "取消"}
              </button>
              <button
                onClick={handleBuy}
                disabled={status === "pending"}
                className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {status === "pending" ? (
                  <>
                    <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {isEn ? "Processing…" : "处理中…"}
                  </>
                ) : (isEn ? "Confirm Purchase" : "确认购买")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Market Agent Card ─────────────────────────────────────────────────────────

function MarketAgentCard({
  agent,
  isConnected,
  lang,
  onBuy,
  onTrialUsed,
}: {
  agent: Agent;
  isConnected: boolean;
  lang: string;
  onBuy: (agent: Agent) => void;
  onTrialUsed: (agentId: number) => void;
}) {
  const isEn = lang === "en";
  const level = agent.stats?.level ?? 1;
  const styles = LEVEL_STYLES[level] ?? LEVEL_STYLES[1];
  const levelLabel = LEVEL_LABELS[isEn ? "en" : "zh"][level] ?? `Lv.${level}`;
  const trialLeft = FREE_TRIAL_LIMIT - getTrialCount(agent.agentId);
  const trialExhausted = trialLeft <= 0;

  function handleTrial() {
    if (!isConnected) return;
    incrementTrial(agent.agentId);
    onTrialUsed(agent.agentId);
  }

  return (
    <article className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white dark:bg-slate-900 transition-all duration-300 hover:shadow-lg ${styles.border}`}>
      {/* Glow */}
      <div className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full ${styles.glow} blur-[50px] opacity-0 group-hover:opacity-60 transition-opacity dark:opacity-0`} />

      <div className="relative z-10 flex flex-col flex-1 p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-orange-200/60 bg-gradient-to-br from-orange-50 to-amber-50 transition-transform group-hover:scale-105 dark:border-white/10 dark:from-orange-500/10 dark:to-amber-500/10">
              <svg className="h-6 w-6 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3}>
                <rect x="3" y="3" width="18" height="18" rx="4" />
                <circle cx="12" cy="10" r="3" />
                <path d="M7 20c0-2.8 2.2-5 5-5s5 2.2 5 5" strokeLinecap="round" />
              </svg>
            </div>
            <div className="min-w-0">
              <h2 className="truncate font-semibold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {agent.profile.name}
              </h2>
              <p className="text-[11px] text-slate-400 truncate">{agent.profile.model}</p>
            </div>
          </div>
          <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${styles.badge}`}>
            Lv.{level} <span className="hidden sm:inline">{levelLabel}</span>
          </span>
        </div>

        {/* Stats row */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { v: agent.stats.totalInferences, l: isEn ? "Inferences" : "推理", accent: false },
            { v: agent.stats.totalMemories,   l: isEn ? "Memories"   : "记忆", accent: false },
            { v: agent.stats.trustScore,      l: isEn ? "Trust"      : "信任", accent: true  },
          ].map(({ v, l, accent }) => (
            <div key={l} className="rounded-xl border border-orange-100/60 bg-orange-50/40 p-2.5 text-center dark:border-white/8 dark:bg-white/5">
              <p className={`text-base font-bold ${accent ? styles.accent : "text-slate-700 dark:text-slate-200"}`}>{v}</p>
              <p className="text-[9px] text-slate-400 uppercase tracking-wider mt-0.5">{l}</p>
            </div>
          ))}
        </div>

        {/* Tags */}
        {(() => {
          const tags: string[] = (agent.profile as any)?.tags ?? [];
          return tags.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1">
              {tags.map((tag) => (
                <span key={tag} className="rounded-md border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[9px] font-medium text-indigo-500 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400">
                  #{tag}
                </span>
              ))}
            </div>
          ) : null;
        })()}

        {/* Trial badge */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {isEn ? `${Math.max(0, trialLeft)} free trial${trialLeft !== 1 ? "s" : ""} left` : `剩余 ${Math.max(0, trialLeft)} 次免费体验`}
            </span>
          </div>
          {/* Trial dots */}
          <div className="flex gap-1">
            {Array.from({ length: FREE_TRIAL_LIMIT }).map((_, i) => (
              <span key={i} className={`h-1.5 w-1.5 rounded-full ${i < getTrialCount(agent.agentId) ? "bg-slate-300 dark:bg-slate-600" : "bg-indigo-400"}`} />
            ))}
          </div>
        </div>

        {/* Price + actions — pinned to bottom */}
        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-white/8 space-y-2">
          {/* Price */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase tracking-wider">{isEn ? "Price" : "售价"}</span>
            <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
              {agent.price}
              <span className="ml-1 text-xs font-normal text-slate-400">A0GI</span>
            </span>
          </div>

          {/* Action buttons */}
          {!isConnected ? (
            <div className="flex flex-col gap-2">
              <p className="text-center text-xs text-slate-400">{isEn ? "Connect wallet to interact" : "连接钱包后可交互"}</p>
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <button
                    onClick={openConnectModal}
                    className="w-full rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 transition dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-400"
                  >
                    {isEn ? "Connect Wallet" : "连接钱包"}
                  </button>
                )}
              </ConnectButton.Custom>
            </div>
          ) : (
            <div className="flex gap-2">
              {/* Trial / Chat button */}
              <Link
                href={`/agent/${agent.agentId}/chat`}
                onClick={() => { if (!trialExhausted) handleTrial(); }}
                className={`flex-1 rounded-xl px-3 py-2 text-center text-xs font-semibold transition ${
                  trialExhausted
                    ? "border border-slate-200 bg-slate-50 text-slate-400 pointer-events-none dark:border-white/8 dark:bg-white/5"
                    : "border border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-400"
                }`}
              >
                {trialExhausted
                  ? (isEn ? "Trial Used" : "已用完")
                  : (isEn ? "Try Free" : "免费体验")}
              </Link>
              {/* Buy button */}
              <button
                onClick={() => onBuy(agent)}
                className="flex-1 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-sm"
              >
                {isEn ? "Buy Agent" : "购买 Agent"}
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ value, label, loading }: { value: number; label: string; loading: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white px-6 py-5 text-center dark:border-white/8 dark:bg-slate-900">
      {loading ? (
        <div className="mx-auto h-8 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      ) : (
        <p className="text-2xl font-bold text-gradient">{value.toLocaleString()}</p>
      )}
      <p className="mt-1 text-xs text-slate-400 uppercase tracking-wider">{label}</p>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ExplorePage() {
  const { lang } = useLang();
  const { isConnected } = useAccount();
  const isEn = lang === "en";

  const [agents, setAgents] = useState<Agent[]>([]);
  const [stats, setStats] = useState<ExploreStats>({ totalAgents: 0, totalInferences: 0, totalBounties: 0 });
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<Tag>("all");
  const [sortKey, setSortKey] = useState<SortKey>("level");
  const [buyTarget, setBuyTarget] = useState<Agent | null>(null);
  const [, forceRender] = useState(0); // to re-render after trial increment

  useEffect(() => {
    let cancelled = false;

    async function loadAgents() {
      setLoadingAgents(true);
      setError(null);
      try {
        const result = await apiGet<{ agents: Agent[]; total: number }>("/explore/agents", { limit: "100" });
        if (!cancelled) setAgents(Array.isArray(result?.agents) ? result.agents : []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load agents");
      } finally {
        if (!cancelled) setLoadingAgents(false);
      }
    }

    async function loadStats() {
      setLoadingStats(true);
      try {
        const data = await apiGet<ExploreStats>("/explore/stats");
        if (!cancelled && data) setStats(data);
      } catch { /* non-critical */ }
      finally { if (!cancelled) setLoadingStats(false); }
    }

    loadAgents();
    loadStats();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    let list = [...agents];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((a) => (a.profile?.name ?? "").toLowerCase().includes(q));
    }
    if (activeTag !== "all") {
      list = list.filter((a) => {
        const tags: string[] = (a.profile as any)?.tags ?? [];
        return tags.some((t) => t.toLowerCase() === activeTag);
      });
    }
    if (sortKey === "level") list.sort((a, b) => (b.stats?.level ?? 0) - (a.stats?.level ?? 0));
    else if (sortKey === "inferences") list.sort((a, b) => (b.stats?.totalInferences ?? 0) - (a.stats?.totalInferences ?? 0));
    else if (sortKey === "price_asc") list.sort((a, b) => parseFloat(a.price ?? "0") - parseFloat(b.price ?? "0"));
    else if (sortKey === "price_desc") list.sort((a, b) => parseFloat(b.price ?? "0") - parseFloat(a.price ?? "0"));
    else list.sort((a, b) => b.agentId - a.agentId);
    return list;
  }, [agents, search, activeTag, sortKey]);

  const handleTrialUsed = useCallback(() => forceRender((n) => n + 1), []);

  // Total listings value
  const totalValue = agents.reduce((s, a) => s + parseFloat(a.price ?? "0"), 0);

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 space-y-8">
      {/* ── Hero ── */}
      <section className="animate-slide-up card-gradient relative overflow-hidden rounded-3xl p-10 md:p-14">
        <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-indigo-400/[0.06] blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-orange-400/[0.05] blur-[60px]" />
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="badge">{isEn ? "Marketplace" : "交易市场"}</span>
            <h1 className="mt-4 text-3xl font-bold text-slate-800 dark:text-white md:text-4xl">
              {isEn ? "Agent " : "AI Agent "}
              <span className="text-gradient">{isEn ? "Trading Market" : "自由交易市场"}</span>
            </h1>
            <p className="mt-3 max-w-2xl text-slate-500 leading-relaxed dark:text-slate-400">
              {isEn
                ? "Buy, sell, and interact with AI Agents. Each Agent's identity and history are permanently anchored on-chain via INFT. Try 3 free interactions before purchasing."
                : "在这里买卖 AI Agent。每个 Agent 的身份与历史永久锚定在链上（INFT）。购买前可免费体验 3 次对话。"}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{totalValue.toFixed(1)}</p>
            <p className="text-xs text-slate-400 uppercase tracking-wider">{isEn ? "A0GI total listed" : "A0GI 总挂单"}</p>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="grid grid-cols-3 gap-4">
        <StatCard value={stats.totalAgents}     label={isEn ? "Listed Agents"      : "挂单 Agent"} loading={loadingStats} />
        <StatCard value={stats.totalInferences} label={isEn ? "Total Inferences"   : "总推理次数"} loading={loadingStats} />
        <StatCard value={stats.totalBounties}   label={isEn ? "Active Bounties"    : "活跃赏金"}   loading={loadingStats} />
      </section>

      {/* ── Wallet notice ── */}
      {!isConnected && (
        <div className="flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 dark:border-amber-500/20 dark:bg-amber-500/5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-500 dark:bg-amber-500/10">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </span>
          <p className="flex-1 text-sm text-amber-700 dark:text-amber-400">
            {isEn
              ? "Connect your wallet to interact with Agents. Gas fees are charged to your wallet — pay only for what you use."
              : "连接钱包后才能与 Agent 交互。交互费用由你的钱包承担，按使用量计费。"}
          </p>
          <ConnectButton />
        </div>
      )}

      {/* ── Filters ── */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isEn ? "Search agents…" : "搜索 Agent…"}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-700 placeholder-slate-400 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                activeTag === tag
                  ? "bg-indigo-500 border-indigo-500 text-white"
                  : "border-slate-200 bg-white text-slate-500 hover:border-indigo-300 hover:text-indigo-500 dark:border-slate-700 dark:bg-slate-900"
              }`}
            >
              {tag === "all" ? (isEn ? "All" : "全部") : `#${tag}`}
            </button>
          ))}
        </div>

        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
        >
          <option value="level">{isEn ? "Highest Level" : "等级最高"}</option>
          <option value="inferences">{isEn ? "Most Inferences" : "推理最多"}</option>
          <option value="price_asc">{isEn ? "Price: Low → High" : "价格从低到高"}</option>
          <option value="price_desc">{isEn ? "Price: High → Low" : "价格从高到低"}</option>
          <option value="latest">{isEn ? "Latest" : "最新"}</option>
        </select>
      </section>

      {/* ── Grid ── */}
      <section>
        {error && !loadingAgents && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/5 dark:text-red-400">
            {isEn ? `Error: ${error}` : `加载失败：${error}`}
          </div>
        )}

        {loadingAgents && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {!loadingAgents && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center py-24 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5">
              <svg className="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                <rect x="3" y="3" width="18" height="18" rx="4" />
                <circle cx="12" cy="10" r="3" />
                <path strokeLinecap="round" d="M7 20c0-2.8 2.2-5 5-5s5 2.2 5 5" />
              </svg>
            </div>
            <p className="mt-4 text-sm font-medium text-slate-500">
              {search || activeTag !== "all"
                ? (isEn ? "No agents match your filters." : "没有符合条件的 Agent。")
                : (isEn ? "No agents listed yet." : "暂无挂单 Agent。")}
            </p>
            {(search || activeTag !== "all") && (
              <button onClick={() => { setSearch(""); setActiveTag("all"); }} className="mt-2 text-xs text-indigo-500 hover:underline">
                {isEn ? "Clear filters" : "清除筛选"}
              </button>
            )}
          </div>
        )}

        {!loadingAgents && !error && filtered.length > 0 && (
          <>
            <p className="mb-4 text-xs text-slate-400">
              {isEn ? `${filtered.length} agent${filtered.length !== 1 ? "s" : ""} listed` : `共 ${filtered.length} 个 Agent 挂单`}
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((agent) => (
                <MarketAgentCard
                  key={agent.agentId}
                  agent={agent}
                  isConnected={isConnected}
                  lang={lang}
                  onBuy={setBuyTarget}
                  onTrialUsed={handleTrialUsed}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* ── Buy Modal ── */}
      {buyTarget && (
        <BuyModal agent={buyTarget} lang={lang} onClose={() => setBuyTarget(null)} />
      )}
    </main>
  );
}
