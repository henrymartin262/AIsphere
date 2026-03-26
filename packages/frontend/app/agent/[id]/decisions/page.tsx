"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useDecisions } from "../../../../hooks/useDecisions";
import { useLang } from "../../../../contexts/LangContext";
import type { Decision } from "../../../../types";

const IMPORTANCE_COLOR: Record<number, string> = {
  1: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  2: "bg-green-500/20 text-green-300 border-green-500/30",
  3: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  4: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  5: "bg-red-500/20 text-red-300 border-red-500/30",
};

const OG_EXPLORER = "https://explorer.0g.ai/tx/";

function truncate(hash: string, len = 10) {
  if (!hash) return "";
  return hash.length > len * 2 + 2
    ? `${hash.slice(0, len)}...${hash.slice(-len)}`
    : hash;
}

function CopyButton({ text, label, copiedLabel }: { text: string; label: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="rounded-lg border border-white/10 px-2 py-0.5 text-[10px] text-slate-400 hover:text-white hover:border-white/20 transition"
    >
      {copied ? copiedLabel : label}
    </button>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: string;
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className={`text-xl font-bold ${accent ? "text-cyan-300" : "text-white"}`}>{value}</p>
      </div>
    </div>
  );
}

function DecisionCard({ decision }: { decision: Decision }) {
  const { t } = useLang();
  const [expanded, setExpanded] = useState(false);

  const importanceLevel = Math.min(5, Math.max(1, Math.round(decision.importance)));
  const colorClass = IMPORTANCE_COLOR[importanceLevel] ?? IMPORTANCE_COLOR[3];

  const statusBadge = decision.onChain ? (
    <span className="flex items-center gap-1 text-xs text-green-400">
      ✅ {t("decision_status_onchain")}
    </span>
  ) : decision.txHash ? (
    <span className="flex items-center gap-1 text-xs text-amber-400">
      ⏳ {t("decision_status_pending")}
    </span>
  ) : (
    <span className="flex items-center gap-1 text-xs text-slate-500">
      🔒 {t("decision_status_local")}
    </span>
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-white/20">
      {/* Top row */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-lg border px-2 py-0.5 text-xs font-bold ${colorClass}`}
          >
            {t("decision_importance")} {importanceLevel}
          </span>
          {statusBadge}
        </div>
        <span className="text-[11px] text-slate-600">
          {new Date(decision.timestamp * 1000).toLocaleString()}
        </span>
      </div>

      {/* Proof Hash */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-slate-500">Proof:</span>
        <code className="font-mono text-xs text-slate-300">{truncate(decision.proofHash, 12)}</code>
        <CopyButton
          text={decision.proofHash}
          label={t("decision_copy")}
          copiedLabel={t("decision_copied")}
        />
      </div>

      {/* On-chain link */}
      {decision.onChain && decision.txHash && (
        <div className="mt-1 flex items-center gap-2">
          <span className="text-[11px] text-slate-500">Tx:</span>
          <code className="font-mono text-xs text-slate-300">{truncate(decision.txHash, 10)}</code>
          <a
            href={`${OG_EXPLORER}${decision.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-cyan-400/30 px-2 py-0.5 text-[10px] text-cyan-400 hover:bg-cyan-400/10 transition"
          >
            {t("decision_explorer")} ↗
          </a>
        </div>
      )}

      {/* Expand/Collapse hashes */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="mt-3 text-[11px] text-slate-500 hover:text-slate-300 transition"
      >
        {expanded ? t("decision_hide_hashes") : t("decision_show_hashes")} ▾
      </button>

      {expanded && (
        <div className="mt-2 space-y-1.5 rounded-xl border border-white/5 bg-white/[0.03] p-3">
          {(
            [
              ["Input Hash", decision.inputHash],
              ["Output Hash", decision.outputHash],
              ["Model Hash", decision.modelHash],
            ] as [string, string][]
          ).map(([label, hash]) => (
            <div key={label} className="flex flex-wrap items-center gap-2">
              <span className="w-20 shrink-0 text-[11px] text-slate-600">{label}:</span>
              <code className="flex-1 break-all font-mono text-[11px] text-slate-400">{hash}</code>
              <CopyButton
                text={hash}
                label={t("decision_copy")}
                copiedLabel={t("decision_copied")}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
      <div className="flex gap-2">
        <div className="h-5 w-20 rounded-lg bg-white/10" />
        <div className="h-5 w-16 rounded-lg bg-white/5" />
      </div>
      <div className="h-4 w-2/3 rounded bg-white/10" />
      <div className="h-3 w-1/3 rounded bg-white/5" />
    </div>
  );
}

export default function AgentDecisionsPage() {
  const params = useParams();
  const agentId =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
      ? params.id[0]
      : "";

  const { t } = useLang();
  const {
    decisions,
    stats,
    isLoading,
    error,
    currentPage,
    totalPages,
    nextPage,
    prevPage,
  } = useDecisions(agentId);

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <span className="badge">{t("decision_title")}</span>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon="📊" label={t("decision_total")} value={stats.total} accent />
          <StatCard icon="⛓" label={t("decision_onchain")} value={stats.onChain} />
          <StatCard icon="📦" label={t("decision_batched")} value={stats.batched} />
          <StatCard icon="🔒" label={t("decision_local")} value={stats.local} />
        </div>
      )}

      {/* Skeleton stats if loading and no stats yet */}
      {isLoading && !stats && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 animate-pulse">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-16 rounded-2xl bg-white/5 border border-white/10" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          ⚠ {error}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <SkeletonCard key={n} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && decisions.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <span className="text-5xl">⛓</span>
          <p className="text-base font-medium text-white">{t("decision_empty")}</p>
        </div>
      )}

      {/* Decision Timeline */}
      {!isLoading && decisions.length > 0 && (
        <div className="space-y-3">
          {decisions.map((decision) => (
            <DecisionCard key={decision.id} decision={decision} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            onClick={prevPage}
            disabled={currentPage <= 1}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-400 hover:text-white hover:border-white/20 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← {t("decision_prev")}
          </button>
          <span className="text-xs text-slate-500">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={nextPage}
            disabled={currentPage >= totalPages}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-400 hover:text-white hover:border-white/20 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {t("decision_next")} →
          </button>
        </div>
      )}
    </main>
  );
}
