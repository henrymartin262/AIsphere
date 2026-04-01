"use client";

import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { useAgents } from "../../hooks/useAgent";
import { AgentCard } from "../../components/AgentCard";
import { useLang } from "../../contexts/LangContext";

function SkeletonCard() {
  return (
    <div className="card animate-pulse p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50" />
          <div className="space-y-2">
            <div className="h-5 w-32 rounded-lg bg-orange-50" />
            <div className="h-3 w-20 rounded-lg bg-orange-50/50" />
          </div>
        </div>
        <div className="h-6 w-16 rounded-full bg-orange-50" />
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl bg-orange-50/50 p-3">
            <div className="mx-auto h-5 w-8 rounded bg-orange-50" />
            <div className="mx-auto mt-1 h-2 w-12 rounded bg-orange-50/50" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 连接钱包未连接时的大号引导页 ── */
function ConnectWalletPrompt() {
  const { t } = useLang();
  return (
    <main className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-8 px-6 py-20">
      <div className="relative w-full max-w-xl overflow-hidden">
        {/* 背景动态光效 */}
        <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-64 w-[500px] rounded-full bg-gradient-to-br from-orange-400/[0.08] via-amber-300/[0.06] to-violet-500/[0.05] blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-cyan-400/[0.04] blur-[60px]" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-rose-400/[0.03] blur-[50px]" />

        <div className="card-gradient relative p-12 text-center md:p-16">
          {/* 装饰几何 */}
          <div className="pointer-events-none absolute left-6 top-6 h-16 w-16 animate-rotate-slow rounded-lg border border-orange-200/20 opacity-30" />
          <div className="pointer-events-none absolute right-6 bottom-6 h-12 w-12 animate-rotate-slow rounded-full border border-violet-200/15 opacity-25" style={{ animationDirection: "reverse" }} />

          <div className="relative z-10">
            {/* 钱包图标 — 大号渐变 */}
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl border border-orange-200/60 shadow-glow"
              style={{ background: "linear-gradient(135deg, #fff7ed, #fef3c7, #f5f3ff)" }}
            >
              <div className="relative">
                <svg className="h-12 w-12" viewBox="0 0 48 48" fill="none">
                  <defs>
                    <linearGradient id="wallet-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f97316" />
                      <stop offset="50%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                  <rect x="4" y="12" width="40" height="28" rx="6" stroke="url(#wallet-grad)" strokeWidth="2.5" fill="none" />
                  <path d="M4 20h40" stroke="url(#wallet-grad)" strokeWidth="2" />
                  <circle cx="35" cy="30" r="3" fill="url(#wallet-grad)" opacity="0.6" />
                  <path d="M12 12V10a6 6 0 016-6h12a6 6 0 016 6v2" stroke="url(#wallet-grad)" strokeWidth="2" strokeLinecap="round" />
                </svg>
                {/* 脉冲指示器 */}
                <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-40" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-gradient-to-r from-orange-400 to-amber-400" />
                </div>
              </div>
            </div>

            <h1 className="mt-8 text-2xl font-bold text-slate-800 md:text-3xl">{t("dash_connect_title")}</h1>
            <p className="mt-3 text-slate-500 max-w-sm mx-auto leading-relaxed">{t("dash_connect_desc")}</p>

            {/* 特性标签 */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {[
                { label: "0G Network", color: "text-orange-500 bg-orange-50 border-orange-200/60" },
                { label: "TEE Secured", color: "text-violet-500 bg-violet-50 border-violet-200/60" },
                { label: "On-Chain Verified", color: "text-cyan-500 bg-cyan-50 border-cyan-200/60" },
              ].map((tag) => (
                <span key={tag.label} className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-semibold ${tag.color}`}>
                  <span className="h-1 w-1 rounded-full bg-current opacity-50" />
                  {tag.label}
                </span>
              ))}
            </div>

            {/* RainbowKit 连接按钮 */}
            <div className="mt-8 flex justify-center">
              <ConnectButton />
            </div>

            <p className="mt-6 text-xs text-slate-400">
              MetaMask · WalletConnect · Coinbase Wallet
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { agents, isLoading, error, refetch } = useAgents(address);
  const { t } = useLang();

  if (!isConnected) {
    return <ConnectWalletPrompt />;
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      {/* Header */}
      <div className="animate-slide-up flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t("dash_title")}</h1>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-mint shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
            <p className="text-sm text-slate-400 font-mono truncate max-w-xs">{address}</p>
          </div>
        </div>
        <Link href="/agent/create" className="btn-primary shrink-0">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" d="M12 4v16m8-8H4" />
          </svg>
          {t("dash_create")}
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-6 animate-scale-in flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-500">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </span>
          <p className="text-sm text-red-600 flex-1">{error}</p>
          <button onClick={refetch} className="rounded-lg border border-red-200 bg-white px-3 py-1 text-xs text-red-500 hover:bg-red-50 transition">
            {t("dash_retry")}
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && agents.length === 0 && (
        <div className="mt-16 animate-slide-up flex flex-col items-center gap-6 text-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-brand-400/[0.08] blur-[40px]" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl border border-orange-200 bg-white shadow-card">
              <svg className="h-12 w-12 text-brand-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1}>
                <rect x="3" y="3" width="18" height="18" rx="4" />
                <circle cx="12" cy="10" r="3" />
                <path d="M7 20c0-2.8 2.2-5 5-5s5 2.2 5 5" strokeLinecap="round" />
              </svg>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-800">{t("dash_empty_title")}</h2>
            <p className="mt-2 text-slate-400 max-w-md">{t("dash_empty_desc")}</p>
          </div>
          <Link href="/agent/create" className="btn-primary">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" d="M12 4v16m8-8H4" />
            </svg>
            {t("dash_create")}
          </Link>
        </div>
      )}

      {/* Agent grid */}
      {!isLoading && agents.length > 0 && (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {agents.map((agent, i) => (
            <div key={agent.agentId} className="animate-slide-up-stagger" style={{ animationDelay: `${i * 0.06}s` }}>
              <AgentCard agent={agent} />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
