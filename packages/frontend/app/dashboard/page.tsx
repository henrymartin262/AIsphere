"use client";

import { useAccount, useChainId } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { useState, useCallback, useEffect } from "react";
import { useAgents } from "../../hooks/useAgent";
import { AgentCard } from "../../components/AgentCard";
import { useLang } from "../../contexts/LangContext";
import { apiGet, apiPost, setApiWalletAddress } from "../../lib/api";
import { useMemory } from "../../hooks/useMemory";
import type { Agent } from "../../types";

/* ── 0G Compute 账户数据类型 ── */
interface ComputeAccount {
  balance: string;
  available: string;
  locked: string;
}

type ComputeStatus = "loading" | "unstaked" | "ready" | "error";

/* ── 0G Compute 初始化 Modal ── */
function ComputeInitModal({ address, isEn, onClose, onSuccess }: {
  address: string;
  isEn: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const chainId = useChainId();
  const isTestnet = chainId === 16602;
  const networkLabel = isTestnet ? "0G Testnet" : "0G Mainnet";

  const [amount, setAmount] = useState("1.0");
  const [depositing, setDepositing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleDeposit() {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) { setErr(isEn ? "Invalid amount" : "金额无效"); return; }
    setDepositing(true); setErr(null);
    try {
      setApiWalletAddress(address);
      await apiPost("/compute/deposit", { amount });
      setDone(true);
      setTimeout(() => { onSuccess(); onClose(); }, 1500);
    } catch (e) {
      setErr(e instanceof Error ? e.message : (isEn ? "Deposit failed" : "质押失败"));
    } finally { setDepositing(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white dark:border-white/10 dark:bg-slate-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 text-lg">⚡</span>
            <div>
              <h2 className="text-base font-semibold text-slate-800 dark:text-white">
                {isEn ? "Initialize 0G Compute" : "初始化 0G Compute"}
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">{networkLabel}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <span className="text-4xl">✅</span>
            <p className="text-sm font-semibold text-green-700 dark:text-green-400">
              {isEn ? "Staking successful!" : "质押成功！"}
            </p>
          </div>
        ) : (
          <>
            {/* Info */}
            <div className="mb-4 rounded-xl border border-amber-100 bg-amber-50/60 dark:border-amber-500/20 dark:bg-amber-500/5 px-4 py-3 text-xs text-amber-700 dark:text-amber-300 space-y-1">
              <p>• {isEn ? "Stake A0GI to pay for AI inference via 0G Compute" : "质押 A0GI 用于支付 0G Compute 的 AI 推理费用"}</p>
              <p>• {isEn ? "Funds stay in your wallet-controlled ledger" : "资金保留在你的钱包控制的账本中"}</p>
              <p>• {isEn ? "Unused balance can be refunded anytime" : "未使用余额可随时退回"}</p>
            </div>

            {/* Network badge */}
            <div className="mb-4 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${isTestnet ? "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300" : "bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-300"}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {networkLabel}
              </span>
              {isTestnet && (
                <a href="https://faucet.0g.ai" target="_blank" rel="noopener noreferrer"
                  className="text-xs text-indigo-500 hover:underline">
                  {isEn ? "Get testnet tokens ↗" : "获取测试网代币 ↗"}
                </a>
              )}
            </div>

            {/* Amount input */}
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-slate-400">
                {isEn ? "Stake Amount (A0GI)" : "质押金额 (A0GI)"}
              </label>
              <div className="flex gap-2">
                <input
                  type="number" min="0.1" max="100" step="0.1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-indigo-400/50"
                />
                <div className="flex gap-1">
                  {["0.5", "1.0", "2.0"].map((v) => (
                    <button key={v} onClick={() => setAmount(v)}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition border ${amount === v ? "border-indigo-300 bg-indigo-50 text-indigo-600 dark:border-indigo-500/40 dark:bg-indigo-500/10 dark:text-indigo-300" : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-400"}`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {err && (
              <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">{err}</p>
            )}

            <div className="flex gap-2">
              <button onClick={onClose}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:border-white/10 dark:text-slate-400 dark:hover:text-white transition-colors">
                {isEn ? "Skip for now" : "暂时跳过"}
              </button>
              <button onClick={handleDeposit} disabled={depositing}
                className="flex-1 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50 transition-colors">
                {depositing ? (isEn ? "Staking…" : "质押中…") : (isEn ? "Stake A0GI" : "确认质押")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── 0G Compute 状态 Banner ── */
function ComputeStatusBanner({ address, isEn, onInitClick }: { address: string; isEn: boolean; onInitClick: () => void }) {
  const [status, setStatus] = useState<ComputeStatus>("loading");
  const [balance, setBalance] = useState<string>("0");

  const fetchStatus = useCallback(() => {
    let cancelled = false;
    setStatus("loading");
    setApiWalletAddress(address);
    apiGet<ComputeAccount>("/compute/account")
      .then((data) => {
        if (cancelled) return;
        const bal = parseFloat(data.balance ?? "0");
        setBalance(data.balance ?? "0");
        setStatus(bal > 0 ? "ready" : "unstaked");
      })
      .catch(() => { if (!cancelled) setStatus("error"); });
    return () => { cancelled = true; };
  }, [address]);

  useEffect(() => {
    return fetchStatus();
  }, [fetchStatus]);

  /* loading skeleton */
  if (status === "loading") {
    return (
      <div className="mt-6 animate-pulse rounded-2xl border border-amber-200/60 bg-amber-50/40 dark:border-amber-500/20 dark:bg-amber-500/5 px-5 py-3 flex items-center gap-3">
        <div className="h-4 w-4 rounded-full bg-amber-200 dark:bg-amber-500/30" />
        <div className="h-3 w-48 rounded bg-amber-200/70 dark:bg-amber-500/20" />
      </div>
    );
  }

  /* silent error — do not render anything */
  if (status === "error") return null;

  /* ── ready: compact green badge ── */
  if (status === "ready") {
    return (
      <div className="mt-6 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 dark:border-green-500/25 dark:bg-green-500/10 px-4 py-2 w-fit">
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 text-[10px] font-bold">⚡</span>
        <span className="text-xs font-medium text-green-700 dark:text-green-300">
          {isEn ? "0G Compute Ready" : "0G Compute 就绪"}
        </span>
        <span className="text-xs text-green-500 dark:text-green-400/70">
          {isEn ? `Balance: ${balance} A0GI` : `余额：${balance} A0GI`}
        </span>
        <span className="text-green-500 dark:text-green-400 text-xs">✓</span>
      </div>
    );
  }

  /* ── unstaked: amber warning card ── */
  return (
    <div className="mt-6 rounded-2xl border border-amber-300/60 bg-amber-50 dark:border-amber-500/25 dark:bg-amber-500/10 px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-base">⚡</span>
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              {isEn ? "0G Compute Not Initialized" : "0G Compute 未初始化"}
            </p>
            <p className="mt-0.5 text-xs text-amber-700/70 dark:text-amber-400/70">
              {isEn
                ? "Stake A0GI to enable AI inference. Balance: 0 A0GI"
                : "需要质押 A0GI 才能使用 AI 推理功能。余额：0 A0GI"}
            </p>
          </div>
        </div>
        <button
          onClick={onInitClick}
          className="shrink-0 flex items-center gap-1 rounded-xl border border-amber-300 bg-white dark:bg-amber-500/10 dark:border-amber-500/30 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors"
        >
          {isEn ? "Initialize" : "初始化"}
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ── 0G Storage 云盘状态条 ── */
interface StorageStatusBarProps {
  agents: Array<{ agentId: number; profile?: { name?: string } }>;
  address: string;
  isEn: boolean;
}

type StorageStatus = "loading" | "ready" | "error";

function StorageStatusBar({ agents, address, isEn, onDetailsClick }: StorageStatusBarProps & { onDetailsClick: () => void }) {
  const [totalMemories, setTotalMemories] = useState<number>(0);
  const [status, setStatus] = useState<StorageStatus>("loading");

  useEffect(() => {
    let cancelled = false;
    setApiWalletAddress(address);

    const topAgents = agents.slice(0, 3);
    Promise.all(
      topAgents.map((agent) =>
        apiGet<unknown[]>(`/memory/${agent.agentId}`, { address: address.toLowerCase() })
          .then((arr) => (Array.isArray(arr) ? arr.length : 0))
          .catch(() => 0)
      )
    )
      .then((counts) => {
        if (cancelled) return;
        const total = counts.reduce((sum, n) => sum + n, 0);
        setTotalMemories(total);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => { cancelled = true; };
  }, [address, agents]);

  const firstAgentId = agents[0]?.agentId;
  /* 50 memories = "full" bar; cap at 100 % */
  const fillPct = Math.min((totalMemories / 50) * 100, 100);

  if (status === "loading") {
    return (
      <div className="mt-4 animate-pulse rounded-xl border border-cyan-200/60 bg-cyan-50/30 dark:border-cyan-500/20 dark:bg-cyan-500/5 px-4 py-2.5 flex items-center gap-3">
        <div className="h-3 w-3 rounded-full bg-cyan-200 dark:bg-cyan-500/30 shrink-0" />
        <div className="h-3 w-44 rounded bg-cyan-200/70 dark:bg-cyan-500/20" />
      </div>
    );
  }

  const memLabel =
    status === "error"
      ? (isEn ? "Storage ready" : "云盘已就绪")
      : totalMemories === 0
      ? (isEn ? "No data yet" : "暂无数据")
      : (isEn ? `${totalMemories} memories synced` : `已同步 ${totalMemories} 条记忆`);

  return (
    <div className="mt-4 flex items-center gap-3 rounded-xl border border-cyan-200/60 bg-cyan-50/30 dark:border-cyan-500/20 dark:bg-cyan-500/5 px-4 py-2.5">
      {/* Left: icon + label */}
      <span className="text-sm shrink-0" aria-hidden="true">☁️</span>
      <span className="text-xs font-semibold text-cyan-700 dark:text-cyan-300 shrink-0 whitespace-nowrap">
        {isEn ? "0G Storage" : "0G Storage 云盘"}
      </span>

      {/* Middle: progress bar + memory count + sync badge */}
      <div className="flex flex-1 items-center gap-2 min-w-0">
        <div className="w-24 h-1.5 rounded-full bg-cyan-100 dark:bg-cyan-900/40 overflow-hidden shrink-0">
          <div
            className="h-full rounded-full bg-cyan-400 dark:bg-cyan-500 transition-all duration-700"
            style={{ width: `${fillPct}%` }}
          />
        </div>
        <span className="text-xs text-cyan-600 dark:text-cyan-400 truncate">
          {memLabel}
        </span>
        <span className="hidden sm:inline text-xs text-cyan-500 dark:text-cyan-400/70 shrink-0 whitespace-nowrap">
          · {isEn ? "Cross-device sync ✓" : "跨设备同步 ✓"}
        </span>
      </div>

      {/* Right: tagline + details link */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="hidden md:inline text-[10px] text-cyan-500/60 dark:text-cyan-400/40 whitespace-nowrap">
          {isEn ? "Data always yours" : "解放本地存储 · 数据永远属于你"}
        </span>
        {firstAgentId !== undefined && (
          <button
            onClick={onDetailsClick}
            className="text-xs font-medium text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors whitespace-nowrap"
          >
            {isEn ? "Details ›" : "查看详情 ›"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── 0G Storage 详情 Modal ── */
function StorageDetailsModal({ agents, address, isEn, onClose }: {
  agents: Array<{ agentId: number; profile?: { name?: string } }>;
  address: string;
  isEn: boolean;
  onClose: () => void;
}) {
  const { memories, isLoading, error } = useMemory(
    agents[0]?.agentId?.toString(),
    address
  );

  const [selectedAgent, setSelectedAgent] = useState(agents[0]?.agentId);

  const { memories: selectedMemories, isLoading: loadingSelected } = useMemory(
    selectedAgent?.toString(),
    address
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-2xl border border-gray-100 bg-white dark:border-white/10 dark:bg-slate-900 shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-lg">☁️</span>
            <h2 className="text-base font-semibold text-slate-800 dark:text-white">
              {isEn ? "0G Storage Cloud" : "0G Storage 云盘"}
            </h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Agent tabs */}
        {agents.length > 1 && (
          <div className="flex gap-1 px-6 pt-4 shrink-0 flex-wrap">
            {agents.map((a) => (
              <button key={a.agentId}
                onClick={() => setSelectedAgent(a.agentId)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition border ${selectedAgent === a.agentId ? "border-cyan-300 bg-cyan-50 text-cyan-700 dark:border-cyan-500/40 dark:bg-cyan-500/10 dark:text-cyan-300" : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-400"}`}>
                {a.profile?.name ?? `Agent ${a.agentId}`}
              </button>
            ))}
          </div>
        )}

        {/* Memory list */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-2">
          {loadingSelected && (
            <div className="space-y-2">
              {[1,2,3].map((n) => (
                <div key={n} className="animate-pulse rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-4 h-16" />
              ))}
            </div>
          )}
          {!loadingSelected && selectedMemories.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <span className="text-3xl">🧠</span>
              <p className="text-sm text-gray-400 dark:text-slate-500">
                {isEn ? "No memories stored yet" : "暂无存储的记忆"}
              </p>
            </div>
          )}
          {!loadingSelected && selectedMemories.map((m) => (
            <div key={m.id} className="rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.03] px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-wide">{m.type}</span>
                <span className="text-[10px] text-gray-400 shrink-0">{new Date(m.timestamp * 1000).toLocaleDateString()}</span>
              </div>
              <p className="mt-1 text-sm text-gray-700 dark:text-slate-300 line-clamp-2">{m.content}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 dark:border-white/10 shrink-0 flex justify-between items-center">
          <span className="text-xs text-gray-400 dark:text-slate-500">
            {isEn ? `${selectedMemories.length} memories` : `${selectedMemories.length} 条记忆`}
          </span>
          <Link
            href={`/agent/${selectedAgent}/memory`}
            onClick={onClose}
            className="text-xs font-medium text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
          >
            {isEn ? "Open full page →" : "打开完整页面 →"}
          </Link>
        </div>
      </div>
    </div>
  );
}

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

/* ── 上链设置区块 ── */
interface OnChainSetupSectionProps {
  agents: Agent[];
  isEn: boolean;
}

function OnChainSetupSection({ agents, isEn }: OnChainSetupSectionProps) {
  const [open, setOpen] = useState(false);

  const features = isEn
    ? [
        "On-chain INFT identity (ERC-721)",
        "TEE-verified sealed inference",
        "Encrypted memory on 0G Storage",
        "Soul grows with each interaction",
      ]
    : [
        "获得 INFT 链上身份（ERC-721）",
        "推理过程 TEE 可验证",
        "记忆加密存储在 0G Storage",
        "Soul 随使用成长",
      ];

  return (
    <div className="mt-8 rounded-2xl border border-gray-100 bg-white dark:border-gray-700/50 dark:bg-gray-900/40 overflow-hidden">
      {/* Collapsible header */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400 text-base">
            ⛓
          </span>
          <div>
            <span className="text-sm font-semibold text-slate-800 dark:text-white">
              {isEn ? "⛓ On-Chain Setup" : "⛓ 上链设置"}
            </span>
            <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">
              {isEn ? "Bind your Agent to an on-chain identity" : "将你的 Agent 绑定链上身份"}
            </span>
          </div>
        </div>
        <svg
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expandable body */}
      {open && (
        <div className="border-t border-gray-100 dark:border-gray-700/50 px-6 py-5 grid gap-5 sm:grid-cols-2">
          {/* Left: info card */}
          <div className="rounded-xl border border-violet-100 bg-violet-50/60 dark:border-violet-500/20 dark:bg-violet-500/5 p-5">
            <h3 className="text-sm font-semibold text-violet-800 dark:text-violet-300 mb-3">
              {isEn ? "What is an On-Chain Agent?" : "什么是链上 Agent？"}
            </h3>
            <ul className="space-y-2">
              {features.map((feat) => (
                <li key={feat} className="flex items-start gap-2 text-xs text-violet-700 dark:text-violet-400/80">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-violet-200/60 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 text-[10px]">
                    ✓
                  </span>
                  {feat}
                </li>
              ))}
            </ul>
          </div>

          {/* Right: agent status + action */}
          <div className="flex flex-col gap-4">
            {/* Agent on-chain status list */}
            <div className="space-y-2">
              {agents.map((agent) => {
                const isOnChain =
                  !!agent.profile.metadataHash &&
                  agent.profile.metadataHash !== "" &&
                  agent.profile.metadataHash !== "0x";
                return (
                  <div
                    key={agent.agentId}
                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 dark:border-gray-700/40 bg-gray-50/60 dark:bg-gray-800/30 px-4 py-2.5"
                  >
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                      {agent.profile.name}
                    </span>
                    {isOnChain ? (
                      <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-green-700 dark:text-green-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 dark:bg-green-400" />
                        {isEn ? "On-chain" : "已上链"}
                      </span>
                    ) : (
                      <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                        {isEn ? "Off-chain" : "未上链"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* CTA */}
            <div className="mt-auto">
              <p className="mb-2 text-xs text-slate-400 dark:text-slate-500">
                {isEn
                  ? "Creating a new Agent automatically mints its INFT on-chain."
                  : "创建 Agent 时会自动完成 INFT 铸造。"}
              </p>
              <Link
                href="/agent/create"
                className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 dark:border-violet-500/30 bg-violet-50 dark:bg-violet-500/10 px-4 py-2 text-xs font-semibold text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-colors"
              >
                {isEn ? "Create On-Chain Agent →" : "创建链上 Agent →"}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { agents, isLoading, error, refetch } = useAgents(address);
  const { t, lang } = useLang();
  const isEn = lang === "en";

  const [showComputeModal, setShowComputeModal] = useState(false);
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [computeKey, setComputeKey] = useState(0); // re-mount banner after staking

  // 持久化已删除的 agent ID（localStorage）
  const [deletedIds, setDeletedIds] = useState<Set<number>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem("aisphere:deleted-agents");
      return new Set(stored ? JSON.parse(stored) : []);
    } catch { return new Set(); }
  });

  const handleDelete = useCallback((agentId: number) => {
    setDeletedIds((prev) => {
      const next = new Set(prev).add(agentId);
      localStorage.setItem("aisphere:deleted-agents", JSON.stringify([...next]));
      return next;
    });
  }, []);

  const visibleAgents = agents.filter((a) => !deletedIds.has(a.agentId));

  if (!isConnected) {
    return <ConnectWalletPrompt />;
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      {/* Header */}
      <div className="animate-slide-up flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-800 dark:text-white">{t("dash_title")}</h1>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-mint shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
            <p className="text-sm text-slate-400 font-mono truncate max-w-xs">{address}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {deletedIds.size > 0 && (
            <Link href="/dashboard/trash"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 hover:border-red-200 hover:text-red-500 transition-colors">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
              {t("nav_home") === "Home" ? "Trash" : "回收站"}
              <span className="rounded-full bg-red-100 px-1.5 text-[10px] font-bold text-red-500">{deletedIds.size}</span>
            </Link>
          )}
          <Link href="/agent/create" className="btn-primary">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" d="M12 4v16m8-8H4" />
            </svg>
            {t("dash_create")}
          </Link>
        </div>
      </div>

      {/* 0G Compute 状态 Banner */}
      {address && (
        <ComputeStatusBanner
          key={computeKey}
          address={address}
          isEn={isEn}
          onInitClick={() => setShowComputeModal(true)}
        />
      )}

      {/* 0G Storage 云盘状态条 */}
      {visibleAgents.length > 0 && address && (
        <StorageStatusBar
          agents={visibleAgents}
          address={address}
          isEn={isEn}
          onDetailsClick={() => setShowStorageModal(true)}
        />
      )}

      {/* Compute Init Modal */}
      {showComputeModal && address && (
        <ComputeInitModal
          address={address}
          isEn={isEn}
          onClose={() => setShowComputeModal(false)}
          onSuccess={() => setComputeKey((k) => k + 1)}
        />
      )}

      {/* Storage Details Modal */}
      {showStorageModal && address && visibleAgents.length > 0 && (
        <StorageDetailsModal
          agents={visibleAgents}
          address={address}
          isEn={isEn}
          onClose={() => setShowStorageModal(false)}
        />
      )}

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
      {!isLoading && !error && visibleAgents.length === 0 && (
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
      {!isLoading && visibleAgents.length > 0 && (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visibleAgents.map((agent, i) => (
            <div key={agent.agentId} className="animate-slide-up-stagger" style={{ animationDelay: `${i * 0.06}s` }}>
              <AgentCard agent={agent} onDelete={handleDelete} />
            </div>
          ))}
        </div>
      )}

      {/* On-Chain Setup section — only when wallet connected + ≥1 agent */}
      {!isLoading && visibleAgents.length > 0 && (
        <OnChainSetupSection agents={visibleAgents} isEn={isEn} />
      )}
    </main>
  );
}
