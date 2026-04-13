"use client";

import { useState } from "react";
import Link from "next/link";
import { useLang } from "../../../contexts/LangContext";
import { translations } from "../../../lib/i18n";
import { apiGet } from "../../../lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

interface AgentSoul {
  agentId: number;
  name: string;
  model: string;
  level: number;
  totalInferences: number;
  totalMemories: number;
  trustScore: number;
  soulSignature?: string;
  soulState?: {
    currentHash: string;
    experienceCount: number;
    lastExperienceAt: number;
  };
  experiences?: { type: string; count: number }[];
}

const EXPERIENCE_ICONS: Record<string, string> = {
  inference: "🔮", bounty: "🏆", interaction: "🤝",
  knowledge: "📚", error: "⚠️", trade: "💰",
};

const LEVEL_NAMES_EN = ["", "Seedling", "Apprentice", "Journeyman", "Expert", "Master"];
const LEVEL_NAMES_ZH = ["", "初学者", "学徒", "专家", "大师", "传奇"];

function StatBar({ label, valueA, valueB, maxVal, colorA, colorB }: {
  label: string; valueA: number; valueB: number; maxVal: number; colorA: string; colorB: string;
}) {
  const pctA = maxVal > 0 ? Math.min((valueA / maxVal) * 100, 100) : 0;
  const pctB = maxVal > 0 ? Math.min((valueB / maxVal) * 100, 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-slate-500 dark:text-white/40">
        <span className="font-bold text-indigo-600 dark:text-indigo-300">{valueA}</span>
        <span className="font-medium">{label}</span>
        <span className="font-bold text-rose-600 dark:text-rose-300">{valueB}</span>
      </div>
      <div className="flex h-2 gap-1">
        <div className="flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
          <div className={`h-full rounded-full ${colorA} transition-all duration-1000`} style={{ width: `${pctA}%`, float: "right" }} />
        </div>
        <div className="flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
          <div className={`h-full rounded-full ${colorB} transition-all duration-1000`} style={{ width: `${pctB}%` }} />
        </div>
      </div>
    </div>
  );
}

function AgentCard({ agent, color, isEn }: { agent: AgentSoul | null; color: string; isEn: boolean }) {
  if (!agent) return (
    <div className="flex h-48 items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/[0.02]">
      <p className="text-sm text-slate-400 dark:text-white/30">{isEn ? "Enter Agent ID above" : "请在上方输入 Agent ID"}</p>
    </div>
  );

  const levelName = isEn ? LEVEL_NAMES_EN[agent.level] || `Lv.${agent.level}` : LEVEL_NAMES_ZH[agent.level] || `Lv.${agent.level}`;

  return (
    <div className={`rounded-2xl border ${color} bg-white p-5 shadow-sm dark:bg-slate-900`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color.includes("indigo") ? "bg-indigo-100 dark:bg-indigo-500/20" : "bg-rose-100 dark:bg-rose-500/20"} text-lg font-bold`}>
          #{agent.agentId}
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-slate-800 dark:text-white">{agent.name}</h3>
          <p className="text-xs text-slate-400 dark:text-white/30">{agent.model} · {levelName}</p>
        </div>
      </div>

      {agent.soulSignature && (
        <div className="mb-3 rounded-lg bg-gray-50 px-3 py-2 dark:bg-white/[0.03]">
          <p className="text-[9px] uppercase tracking-wider text-slate-400 dark:text-white/20">{isEn ? "Soul Signature" : "灵魂签名"}</p>
          <p className="font-mono text-[10px] text-slate-500 dark:text-white/40 truncate">{agent.soulSignature}</p>
        </div>
      )}

      {agent.soulState && (
        <div className="mb-3 rounded-lg bg-gray-50 px-3 py-2 dark:bg-white/[0.03]">
          <p className="text-[9px] uppercase tracking-wider text-slate-400 dark:text-white/20">{isEn ? "Soul Hash (Head)" : "灵魂哈希（链头）"}</p>
          <p className="font-mono text-[10px] text-indigo-500 dark:text-indigo-300 truncate">{agent.soulState.currentHash}</p>
          <p className="mt-1 text-[10px] text-slate-400 dark:text-white/20">
            {agent.soulState.experienceCount} {isEn ? "experiences" : "条经验"}
          </p>
        </div>
      )}

      {agent.experiences && agent.experiences.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {agent.experiences.map((e) => (
            <span key={e.type} className="inline-flex items-center gap-1 rounded-md border border-gray-100 bg-gray-50 px-2 py-0.5 text-[9px] font-medium text-slate-500 dark:border-white/5 dark:bg-white/[0.03] dark:text-white/40">
              {EXPERIENCE_ICONS[e.type] || "📝"} {e.type} ×{e.count}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  const { lang } = useLang();
  const isEn = lang === "en";

  const [idA, setIdA] = useState("");
  const [idB, setIdB] = useState("");
  const [agentA, setAgentA] = useState<AgentSoul | null>(null);
  const [agentB, setAgentB] = useState<AgentSoul | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchAgent(id: string): Promise<AgentSoul | null> {
    try {
      const agent = await apiGet<any>(`/agents/${id}`);
      const raw = agent?.data ?? agent;
      if (!raw) return null;

      let soulState = undefined;
      let experiences: { type: string; count: number }[] = [];
      try {
        const soul = await apiGet<any>(`/soul/${id}`);
        const sd = soul?.data ?? soul;
        soulState = sd?.soulState ?? { currentHash: sd?.currentHash, experienceCount: sd?.experienceCount, lastExperienceAt: sd?.lastExperienceAt };
        if (sd?.digest?.experiencesByType) {
          experiences = Object.entries(sd.digest.experiencesByType).map(([type, count]) => ({ type, count: count as number }));
        }
      } catch { /* soul data optional */ }

      return {
        agentId: raw.agentId,
        name: raw.profile?.name ?? `Agent #${id}`,
        model: raw.profile?.model ?? "unknown",
        level: raw.stats?.level ?? 1,
        totalInferences: raw.stats?.totalInferences ?? 0,
        totalMemories: raw.stats?.totalMemories ?? 0,
        trustScore: raw.stats?.trustScore ?? 0,
        soulSignature: raw.soulSignature,
        soulState,
        experiences,
      };
    } catch {
      return null;
    }
  }

  async function handleCompare() {
    if (!idA.trim() || !idB.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const [a, b] = await Promise.all([fetchAgent(idA.trim()), fetchAgent(idB.trim())]);
      if (!a) throw new Error(isEn ? `Agent #${idA} not found` : `Agent #${idA} 未找到`);
      if (!b) throw new Error(isEn ? `Agent #${idB} not found` : `Agent #${idB} 未找到`);
      setAgentA(a);
      setAgentB(b);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Compare failed");
    } finally {
      setLoading(false);
    }
  }

  const maxInf = Math.max(agentA?.totalInferences ?? 1, agentB?.totalInferences ?? 1, 1);
  const maxMem = Math.max(agentA?.totalMemories ?? 1, agentB?.totalMemories ?? 1, 1);
  const maxTrust = 100;
  const maxExp = Math.max(agentA?.soulState?.experienceCount ?? 1, agentB?.soulState?.experienceCount ?? 1, 1);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="animate-slide-up mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-pink-200/60 bg-pink-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-pink-600 dark:border-pink-500/20 dark:bg-pink-500/10 dark:text-pink-300">
          <span className="h-1.5 w-1.5 rounded-full bg-pink-500" />
          {isEn ? "Soul Comparison" : "灵魂对比"}
        </div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          {isEn ? "Compare Agent Souls" : "对比 Agent 灵魂"}
        </h1>
        <p className="mt-1.5 max-w-xl text-sm text-slate-500 dark:text-slate-400">
          {isEn
            ? "See how two agents' souls differ — experiences, growth, and capabilities side by side."
            : "对比两个 Agent 的灵魂差异——经验、成长和能力一目了然。"}
        </p>
      </div>

      {/* Input */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-indigo-500">Agent A</label>
          <input
            type="text" value={idA} onChange={(e) => setIdA(e.target.value)} placeholder="ID, e.g. 1"
            className="w-full rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-indigo-500/20 dark:bg-white/5 dark:text-white dark:focus:ring-indigo-500/10"
            onKeyDown={(e) => e.key === "Enter" && handleCompare()}
          />
        </div>
        <div className="flex items-end">
          <span className="px-3 py-2.5 text-lg font-bold text-slate-300 dark:text-white/20">VS</span>
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-rose-500">Agent B</label>
          <input
            type="text" value={idB} onChange={(e) => setIdB(e.target.value)} placeholder="ID, e.g. 2"
            className="w-full rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 dark:border-rose-500/20 dark:bg-white/5 dark:text-white dark:focus:ring-rose-500/10"
            onKeyDown={(e) => e.key === "Enter" && handleCompare()}
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={handleCompare}
            disabled={!idA.trim() || !idB.trim() || loading}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (isEn ? "Loading..." : "加载中...") : (isEn ? "Compare" : "对比")}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          ⚠ {error}
        </div>
      )}

      {/* Agent Cards */}
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <AgentCard agent={agentA} color="border-indigo-200 dark:border-indigo-500/20" isEn={isEn} />
        <AgentCard agent={agentB} color="border-rose-200 dark:border-rose-500/20" isEn={isEn} />
      </div>

      {/* Comparison Bars */}
      {agentA && agentB && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-5 dark:border-white/8 dark:bg-slate-900">
          <h3 className="text-center font-display text-lg font-bold text-slate-800 dark:text-white">
            {agentA.name} <span className="text-slate-300 dark:text-white/20">vs</span> {agentB.name}
          </h3>

          <StatBar label={isEn ? "Inferences" : "推理次数"} valueA={agentA.totalInferences} valueB={agentB.totalInferences} maxVal={maxInf} colorA="bg-gradient-to-r from-indigo-500 to-indigo-400" colorB="bg-gradient-to-l from-rose-500 to-rose-400" />
          <StatBar label={isEn ? "Memories" : "记忆数"} valueA={agentA.totalMemories} valueB={agentB.totalMemories} maxVal={maxMem} colorA="bg-gradient-to-r from-indigo-500 to-indigo-400" colorB="bg-gradient-to-l from-rose-500 to-rose-400" />
          <StatBar label={isEn ? "Trust Score" : "信任分"} valueA={agentA.trustScore} valueB={agentB.trustScore} maxVal={maxTrust} colorA="bg-gradient-to-r from-indigo-500 to-indigo-400" colorB="bg-gradient-to-l from-rose-500 to-rose-400" />
          <StatBar label={isEn ? "Soul Experiences" : "灵魂经验"} valueA={agentA.soulState?.experienceCount ?? 0} valueB={agentB.soulState?.experienceCount ?? 0} maxVal={maxExp} colorA="bg-gradient-to-r from-indigo-500 to-indigo-400" colorB="bg-gradient-to-l from-rose-500 to-rose-400" />
          <StatBar label={isEn ? "Level" : "等级"} valueA={agentA.level} valueB={agentB.level} maxVal={5} colorA="bg-gradient-to-r from-indigo-500 to-indigo-400" colorB="bg-gradient-to-l from-rose-500 to-rose-400" />

          {/* Winner */}
          {(() => {
            const scoreA = agentA.totalInferences + agentA.trustScore + (agentA.soulState?.experienceCount ?? 0) * 2 + agentA.level * 10;
            const scoreB = agentB.totalInferences + agentB.trustScore + (agentB.soulState?.experienceCount ?? 0) * 2 + agentB.level * 10;
            const winner = scoreA > scoreB ? agentA.name : scoreB > scoreA ? agentB.name : null;
            const winColor = scoreA > scoreB ? "from-indigo-500 to-indigo-600" : "from-rose-500 to-rose-600";
            return (
              <div className="mt-4 text-center">
                {winner ? (
                  <div className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${winColor} px-5 py-2 text-sm font-bold text-white shadow-lg`}>
                    🏆 {winner} {isEn ? "has a richer soul" : "拥有更丰富的灵魂"}
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-5 py-2 text-sm font-bold text-slate-500 dark:bg-white/5 dark:text-white/40">
                    ⚖️ {isEn ? "Evenly matched souls" : "旗鼓相当的灵魂"}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Back */}
      <div className="mt-8 text-center">
        <Link href="/explore" className="text-sm text-slate-400 hover:text-indigo-500 transition-colors dark:text-white/30 dark:hover:text-white/60">
          ← {isEn ? "Back to Explore" : "返回市场"}
        </Link>
      </div>
    </main>
  );
}
