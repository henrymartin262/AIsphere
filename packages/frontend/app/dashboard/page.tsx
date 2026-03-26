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
        <div className="flex-1 space-y-2">
          <div className="h-5 w-2/3 rounded-lg bg-white/10" />
          <div className="h-3 w-1/3 rounded-lg bg-white/5" />
        </div>
        <div className="h-6 w-16 rounded-full bg-white/10" />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl bg-white/5 p-3">
            <div className="mx-auto h-5 w-8 rounded bg-white/10" />
            <div className="mx-auto mt-1 h-2 w-12 rounded bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { agents, isLoading, error, refetch } = useAgents(address);
  const { t } = useLang();

  if (!isConnected) {
    return (
      <main className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-8 px-6 py-24">
        <div className="card p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10 text-3xl">
            🔒
          </div>
          <h1 className="mt-6 text-2xl font-semibold text-white">{t("dash_connect_title")}</h1>
          <p className="mt-3 text-slate-400">{t("dash_connect_desc")}</p>
          <div className="mt-6 flex justify-center">
            <ConnectButton />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">{t("dash_title")}</h1>
          <p className="mt-1 text-sm text-slate-400 font-mono truncate max-w-xs">{address}</p>
        </div>
        <Link
          href="/agent/create"
          className="shrink-0 rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 active:scale-95"
        >
          + {t("dash_create")}
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4">
          <span className="text-red-400">⚠</span>
          <p className="text-sm text-red-300">{error}</p>
          <button onClick={refetch} className="ml-auto text-xs text-red-400 underline hover:text-red-300">
            {t("dash_retry")}
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && agents.length === 0 && (
        <div className="mt-16 flex flex-col items-center gap-6 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-white/5 text-5xl">
            🤖
          </div>
          <div>
            <h2 className="text-xl font-medium text-white">{t("dash_empty_title")}</h2>
            <p className="mt-2 text-slate-400">{t("dash_empty_desc")}</p>
          </div>
          <Link
            href="/agent/create"
            className="rounded-full bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 active:scale-95"
          >
            + {t("dash_create")}
          </Link>
        </div>
      )}

      {/* Agent grid */}
      {!isLoading && agents.length > 0 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {agents.map((agent) => (
            <AgentCard key={agent.agentId} agent={agent} />
          ))}
        </div>
      )}
    </main>
  );
}
