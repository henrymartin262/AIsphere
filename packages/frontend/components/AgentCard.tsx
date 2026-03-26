"use client";

import Link from "next/link";
import type { Agent } from "../types";
import { useLang } from "../contexts/LangContext";

const LEVEL_COLORS: Record<number, string> = {
  1: "border-slate-400/40 bg-slate-400/10 text-slate-300",
  2: "border-green-400/40 bg-green-400/10 text-green-300",
  3: "border-blue-400/40 bg-blue-400/10 text-blue-300",
  4: "border-purple-400/40 bg-purple-400/10 text-purple-300",
  5: "border-cyan-400/40 bg-cyan-400/10 text-cyan-300",
};

interface AgentCardProps {
  agent: Agent;
}

export function AgentCard({ agent }: AgentCardProps) {
  const { t } = useLang();
  const level = agent.stats?.level ?? 1;
  const levelColor = LEVEL_COLORS[level] ?? LEVEL_COLORS[1];

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
      <article className="card h-full p-6 transition-all duration-200 hover:border-cyan-400/40 hover:shadow-glow hover:-translate-y-0.5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="truncate text-lg font-semibold text-white group-hover:text-cyan-200 transition-colors">
              {agent.profile?.name ?? `Agent #${agent.agentId}`}
            </h2>
            <p className="mt-0.5 text-xs text-slate-400 truncate">
              {agent.profile?.model ?? "Unknown Model"}
            </p>
          </div>
          <span className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${levelColor}`}>
            Lv.{level} {levelLabel}
          </span>
        </div>

        {/* Description */}
        {(agent.profile as any)?.description && (
          <p className="mt-3 text-sm text-slate-400 line-clamp-2">
            {(agent.profile as any).description}
          </p>
        )}

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-white/5 p-2.5 text-center">
            <p className="text-lg font-semibold text-white">{agent.stats?.totalInferences ?? 0}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{t("card_inferences")}</p>
          </div>
          <div className="rounded-xl bg-white/5 p-2.5 text-center">
            <p className="text-lg font-semibold text-white">{agent.stats?.totalMemories ?? 0}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{t("card_memories")}</p>
          </div>
          <div className="rounded-xl bg-white/5 p-2.5 text-center">
            <p className="text-lg font-semibold text-cyan-300">{agent.stats?.trustScore ?? 0}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{t("card_trust")}</p>
          </div>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {tags.slice(0, 4).map((tag) => (
              <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-400">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-[11px] text-slate-600">#{agent.agentId}</span>
          <span className="text-xs text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
            {t("nav_home") === "Home" ? "Chat →" : "进入对话 →"}
          </span>
        </div>
      </article>
    </Link>
  );
}
