"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAgent } from "../../../../hooks/useAgent";
import { useDecisions } from "../../../../hooks/useDecisions";
import { useLang } from "../../../../contexts/LangContext";
import { SoulSignature } from "../../../../components/SoulSignature";
import type { Decision } from "../../../../types";

function truncate(hash: string, front = 8, back = 6): string {
  if (!hash) return "";
  if (hash.length <= front + back + 2) return hash;
  return `${hash.slice(0, front)}...${hash.slice(-back)}`;
}

function StarsDisplay({ level }: { level: number }) {
  const clamped = Math.min(5, Math.max(1, level));
  return (
    <span className="text-amber-400 tracking-tight">
      {"★".repeat(clamped)}
      <span className="text-gray-300 dark:text-slate-600">{"☆".repeat(5 - clamped)}</span>
    </span>
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
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="card flex items-center gap-3 p-4">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-xs text-gray-400 dark:text-slate-500">{label}</p>
        <p
          className={`text-xl font-bold ${
            accent
              ? "text-indigo-600 dark:text-indigo-300"
              : "text-gray-900 dark:text-white"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function DecisionRow({ decision }: { decision: Decision }) {
  const statusIcon = decision.onChain
    ? "✅"
    : decision.txHash
    ? "⏳"
    : "🔒";
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-gray-50 dark:border-white/[0.04] last:border-0">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm">{statusIcon}</span>
        <code className="font-mono text-xs text-gray-600 dark:text-slate-300 truncate">
          {truncate(decision.proofHash, 10, 8)}
        </code>
      </div>
      <span className="shrink-0 text-[11px] text-gray-400 dark:text-slate-500">
        {new Date(decision.timestamp * 1000).toLocaleDateString()}
      </span>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const { t } = useLang();
  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={handleCopy}
      className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-500 transition hover:border-indigo-300 hover:text-indigo-600 dark:border-white/10 dark:text-slate-400 dark:hover:border-white/20 dark:hover:text-white"
    >
      {copied ? t("decision_copied") : t("decision_copy")}
    </button>
  );
}

function SkeletonProfile() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-8 animate-pulse">
      {/* Header skeleton */}
      <div className="card mb-6 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-gray-100 dark:bg-white/10" />
            <div className="space-y-2">
              <div className="h-5 w-40 rounded bg-gray-100 dark:bg-white/10" />
              <div className="h-3 w-24 rounded bg-gray-50 dark:bg-white/5" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-20 rounded-xl bg-gray-100 dark:bg-white/10" />
            <div className="h-8 w-24 rounded-xl bg-gray-100 dark:bg-white/10" />
          </div>
        </div>
      </div>
      {/* Stats skeleton */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className="h-16 rounded-2xl border border-gray-100 bg-gray-50 dark:border-white/[0.06] dark:bg-white/[0.03]"
          />
        ))}
      </div>
      {/* Body skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="h-56 rounded-2xl border border-gray-100 bg-gray-50 dark:border-white/[0.06] dark:bg-white/[0.03]" />
        <div className="h-56 rounded-2xl border border-gray-100 bg-gray-50 dark:border-white/[0.06] dark:bg-white/[0.03]" />
      </div>
    </main>
  );
}

export default function AgentProfilePage() {
  const params = useParams();
  const agentId =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
      ? params.id[0]
      : "";

  const { agent, isLoading, error } = useAgent(agentId);
  const {
    decisions,
    isLoading: decisionsLoading,
  } = useDecisions(agentId, 1);

  const { t } = useLang();
  const isEn = t("nav_home") === "Home";

  const [shareCopied, setShareCopied] = useState(false);

  function handleShare() {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  }

  // Derive soul signature: use agent's metadataHash, or generate placeholder from agentId
  const soulSignature: string = (() => {
    const meta = agent?.profile?.metadataHash;
    if (meta && meta.length >= 10) return meta;
    // Placeholder: derive deterministic bytes32 from agentId
    const numId = Number(agentId) || 0;
    return "0x" + numId.toString(16).padStart(64, "0");
  })();

  const level = agent?.stats?.level ?? 1;
  const createdAt = agent?.stats?.lastActiveAt
    ? new Date(agent.stats.lastActiveAt * 1000).toLocaleDateString()
    : "—";

  const recentDecisions = decisions.slice(0, 5);

  if (isLoading) return <SkeletonProfile />;

  if (error) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          ⚠ {error}
        </div>
      </main>
    );
  }

  if (!agent) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <span className="text-5xl">🤖</span>
          <p className="text-base font-medium text-gray-900 dark:text-white">
            {isEn ? "Agent not found" : "未找到该 Agent"}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      {/* ── Header ── */}
      <div className="card mb-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50 to-purple-100 text-2xl dark:border-indigo-500/20 dark:from-indigo-500/10 dark:to-purple-500/10">
              🤖
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  {agent.profile?.name ?? `Agent #${agentId}`}
                </h1>
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-600 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-300">
                  Lv.{level}
                </span>
                <StarsDisplay level={level} />
              </div>
              <p className="mt-0.5 text-xs text-gray-400 dark:text-slate-500">
                {agent.profile?.model ?? "Unknown Model"}
                {agent.stats?.lastActiveAt
                  ? ` · ${isEn ? "Active" : "活跃"}: ${createdAt}`
                  : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs text-gray-500 transition hover:border-indigo-300 hover:text-indigo-600 dark:border-white/10 dark:text-slate-400 dark:hover:border-indigo-400/30 dark:hover:text-indigo-300"
            >
              {shareCopied
                ? isEn
                  ? "✓ Copied!"
                  : "✓ 已复制!"
                : isEn
                ? "🔗 Share"
                : "🔗 分享"}
            </button>
            <Link
              href={`/agent/${agentId}/chat`}
              className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-100 dark:border-indigo-400/30 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
            >
              {isEn ? "💬 Chat →" : "💬 对话 →"}
            </Link>
          </div>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon="🔮"
          label={t("card_inferences")}
          value={(agent.stats?.totalInferences ?? 0).toLocaleString()}
          accent
        />
        <StatCard
          icon="🧠"
          label={t("card_memories")}
          value={(agent.stats?.totalMemories ?? 0).toLocaleString()}
        />
        <StatCard
          icon="⭐"
          label={t("card_trust")}
          value={(agent.stats?.trustScore ?? 0).toLocaleString()}
        />
        <StatCard
          icon="🏆"
          label={isEn ? "Level" : "等级"}
          value={<StarsDisplay level={level} /> as unknown as string}
        />
      </div>

      {/* ── Body: Soul Signature + Recent Decisions ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Soul Signature Card */}
        <div className="card p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-lg">🔮</span>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {isEn ? "Soul Signature" : "灵魂签名"}
            </h2>
            <span className="badge ml-auto">{isEn ? "Unique" : "唯一"}</span>
          </div>

          <div className="flex items-center gap-5">
            {/* SVG pattern */}
            <div className="shrink-0 rounded-full p-1 border border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02]">
              <SoulSignature signature={soulSignature} size={100} />
            </div>

            {/* Hash info */}
            <div className="min-w-0 flex-1 space-y-2">
              <div>
                <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                  {isEn ? "Signature Hash" : "签名哈希"}
                </p>
                <code className="block break-all font-mono text-[11px] text-gray-600 dark:text-slate-300 leading-relaxed">
                  {truncate(soulSignature, 10, 8)}
                </code>
              </div>
              <div className="flex items-center gap-2">
                <CopyButton text={soulSignature} />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                  {isEn ? "Last Active" : "最后活跃"}
                </p>
                <p className="text-xs text-gray-600 dark:text-slate-300 mt-0.5">
                  {createdAt}
                </p>
              </div>
            </div>
          </div>

          <p className="mt-4 text-[11px] text-gray-400 dark:text-slate-500 text-center italic border-t border-gray-50 dark:border-white/[0.04] pt-3">
            {isEn
              ? "Every Agent's unique soul mark, non-replicable"
              : "每个 Agent 的灵魂印记，独一无二，不可复制"}
          </p>
        </div>

        {/* Recent Decisions Card */}
        <div className="card p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="text-lg">⛓</span>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {isEn ? "Recent Decisions" : "最近决策"}
            </h2>
          </div>

          {decisionsLoading ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="flex justify-between py-2.5 border-b border-gray-50 dark:border-white/[0.04]"
                >
                  <div className="h-3 w-2/3 rounded bg-gray-100 dark:bg-white/10" />
                  <div className="h-3 w-16 rounded bg-gray-50 dark:bg-white/5" />
                </div>
              ))}
            </div>
          ) : recentDecisions.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <span className="text-3xl">⛓</span>
              <p className="text-xs text-gray-400 dark:text-slate-500">
                {isEn ? "No decisions yet" : "暂无决策记录"}
              </p>
            </div>
          ) : (
            <div>
              {recentDecisions.map((d) => (
                <DecisionRow key={d.id} decision={d} />
              ))}
            </div>
          )}

          {!decisionsLoading && (
            <div className="mt-4 pt-3 border-t border-gray-50 dark:border-white/[0.04]">
              <Link
                href={`/agent/${agentId}/decisions`}
                className="flex items-center justify-center gap-1 text-xs text-indigo-600 transition hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                {isEn ? "View all decisions →" : "查看全部决策 →"}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Description / Tags ── */}
      {((agent.profile as { description?: string })?.description ||
        (agent.profile as { tags?: string[] })?.tags?.length) && (
        <div className="card mt-4 p-5">
          <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
            {isEn ? "About" : "关于"}
          </h2>
          {(agent.profile as { description?: string })?.description && (
            <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
              {(agent.profile as { description?: string }).description}
            </p>
          )}
          {(() => {
            const tags = (agent.profile as { tags?: string[] })?.tags ?? [];
            return tags.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-indigo-200/60 bg-indigo-50/50 px-2 py-0.5 text-[10px] text-indigo-500 dark:border-indigo-500/20 dark:bg-indigo-500/5 dark:text-indigo-400"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            ) : null;
          })()}
        </div>
      )}
    </main>
  );
}
