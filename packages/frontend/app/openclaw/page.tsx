"use client";

import { useState, useEffect, useCallback } from "react";
import { useLang } from "../../contexts/LangContext";
import { apiGet, apiPost } from "../../lib/api";

/* ── Types ── */
interface OpenClawSkill {
  id: string;
  name: string;
  description: string;
  handler: string;
}

interface OpenClawAgent {
  agentId: string;
  sealMindTokenId: number;
  workspace: string;
  skills: OpenClawSkill[];
  createdAt: number;
}

interface OpenClawStatus {
  registered: boolean;
  agentCount: number;
  skillCount: number;
  taskQueue: number;
  pipelineCount: number;
  builtInSkills: string[];
}

/* ── Skill Badge Colors ── */
const SKILL_COLORS: Record<string, string> = {
  "sealed-inference": "bg-indigo-50 text-indigo-600 border-indigo-200/60",
  "memory-recall": "bg-violet-50 text-violet-600 border-violet-200/60",
  "decision-audit": "bg-amber-50 text-amber-600 border-amber-200/60",
  "multi-agent-delegate": "bg-cyan-50 text-cyan-600 border-cyan-200/60",
  "context-builder": "bg-emerald-50 text-emerald-600 border-emerald-200/60",
};

function getSkillColor(id: string): string {
  return SKILL_COLORS[id] ?? "bg-gray-50 text-gray-600 border-gray-200/60";
}

export default function OpenClawPage() {
  const { t } = useLang();
  const isEn = t("nav_home") === "Home";

  const [status, setStatus] = useState<OpenClawStatus | null>(null);
  const [skills, setSkills] = useState<OpenClawSkill[]>([]);
  const [agents, setAgents] = useState<OpenClawAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "skills" | "agents">("overview");

  // Register Agent form
  const [regTokenId, setRegTokenId] = useState("");
  const [regName, setRegName] = useState("");
  const [registering, setRegistering] = useState(false);

  /* ── Fetch data ── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statusData, skillsData, agentsData] = await Promise.all([
        apiGet<OpenClawStatus>("/openclaw/status"),
        apiGet<OpenClawSkill[]>("/openclaw/skills"),
        apiGet<OpenClawAgent[]>("/openclaw/agents"),
      ]);
      setStatus(statusData);
      setSkills(Array.isArray(skillsData) ? skillsData : []);
      setAgents(Array.isArray(agentsData) ? agentsData : []);
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── Register Agent ── */
  const handleRegister = useCallback(async () => {
    const tokenId = parseInt(regTokenId, 10);
    if (isNaN(tokenId) || !regName.trim()) return;
    setRegistering(true);
    try {
      await apiPost("/openclaw/agents", {
        sealMindTokenId: tokenId,
        agentName: regName,
      });
      setRegTokenId("");
      setRegName("");
      fetchData();
    } catch (err) {
      console.error("Register failed:", err);
    } finally {
      setRegistering(false);
    }
  }, [regTokenId, regName, fetchData]);

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      {/* Header */}
      <section className="animate-slide-up card-gradient relative overflow-hidden p-8 md:p-12">
        <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-cyan-400/[0.06] blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-indigo-400/[0.05] blur-[60px]" />
        <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <span className="badge">OpenClaw</span>
            <h1 className="mt-4 text-2xl font-bold text-slate-800 md:text-3xl">
              OpenClaw{" "}
              <span className="text-gradient">{isEn ? "Integration" : "技能中心"}</span>
            </h1>
            <p className="mt-2 max-w-2xl text-slate-500 leading-relaxed text-sm">
              {isEn
                ? "Register AIsphere Agents as OpenClaw Skills, build skill pipelines, and orchestrate tasks through the unified gateway."
                : "将 AIsphere Agent 注册为 OpenClaw 技能，构建技能流水线，通过统一网关编排任务。"}
            </p>
          </div>
          {/* Status indicator */}
          {status && (
            <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2">
              <span className={`h-2 w-2 rounded-full ${status.registered ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-amber-400"}`} />
              <span className="text-xs font-medium text-slate-600">
                {status.registered ? (isEn ? "Connected" : "已连接") : (isEn ? "Standby" : "待激活")}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Stats Row */}
      {status && (
        <section className="mt-6 grid gap-4 sm:grid-cols-4">
          {[
            { label: isEn ? "Agents" : "Agent 数", value: status.agentCount, color: "text-indigo-600" },
            { label: isEn ? "Skills" : "技能数", value: status.skillCount, color: "text-violet-600" },
            { label: isEn ? "Task Queue" : "任务队列", value: status.taskQueue, color: "text-amber-600" },
            { label: isEn ? "Pipelines" : "流水线", value: status.pipelineCount, color: "text-cyan-600" },
          ].map((stat) => (
            <div key={stat.label} className="card p-4 text-center">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </section>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-gray-50 border border-gray-100" />
          ))}
        </div>
      )}

      {!loading && (
        <>
          {/* Tab Navigation */}
          <div className="mt-8 flex items-center gap-1 rounded-full border border-gray-100 bg-gray-50/60 p-1 w-fit">
            {[
              { key: "overview" as const, label: isEn ? "Overview" : "概览" },
              { key: "skills" as const, label: isEn ? "Skills" : "技能" },
              { key: "agents" as const, label: isEn ? "Agents" : "Agent" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-800 hover:bg-white/60"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Tab: Overview ── */}
          {activeTab === "overview" && (
            <section className="mt-6 animate-slide-up grid gap-6 lg:grid-cols-2">
              {/* Built-in Skills */}
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-slate-800">
                  {isEn ? "Built-in Skills" : "内置技能"}
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  {isEn ? "AIsphere native capabilities exposed as OpenClaw Skills" : "AIsphere 原生能力作为 OpenClaw 技能暴露"}
                </p>
                <div className="mt-4 space-y-2">
                  {(status?.builtInSkills ?? []).map((skillId) => (
                    <div key={skillId} className={`flex items-center gap-3 rounded-xl border p-3 ${getSkillColor(skillId)}`}>
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/80">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-semibold">{skillId}</p>
                        <p className="text-[10px] opacity-70">
                          {skillId === "sealed-inference" ? (isEn ? "TEE verifiable inference" : "TEE 可验证推理")
                            : skillId === "memory-recall" ? (isEn ? "Encrypted memory query" : "加密记忆查询")
                            : skillId === "decision-audit" ? (isEn ? "On-chain audit trail" : "链上审计追踪")
                            : skillId === "multi-agent-delegate" ? (isEn ? "Cross-agent task routing" : "跨 Agent 任务路由")
                            : skillId === "context-builder" ? (isEn ? "Context assembly" : "上下文组装")
                            : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Architecture diagram */}
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-slate-800">
                  {isEn ? "Architecture" : "架构概览"}
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  {isEn ? "How OpenClaw integrates with AIsphere" : "OpenClaw 如何与 AIsphere 集成"}
                </p>
                <div className="mt-4 rounded-xl bg-slate-50 border border-slate-100 p-5 font-mono text-[11px] text-slate-500 leading-relaxed whitespace-pre">
{`┌─────────────────────────┐
│    OpenClaw Gateway     │
│  ┌───────┐ ┌─────────┐ │
│  │ Route │→│  Skill  │ │
│  │ Match │ │ Execute │ │
│  └───┬───┘ └────┬────┘ │
└──────┼──────────┼──────┘
       │          │
┌──────▼──────────▼──────┐
│      AIsphere Core     │
│ ┌──────┐ ┌───────────┐ │
│ │Memory│ │  Sealed   │ │
│ │Vault │ │ Inference │ │
│ └──┬───┘ └─────┬─────┘ │
│    │           │       │
│ ┌──▼───────────▼─────┐ │
│ │  0G Network Layer  │ │
│ │ Chain·Storage·TEE  │ │
│ └────────────────────┘ │
└────────────────────────┘`}
                </div>
              </div>
            </section>
          )}

          {/* ── Tab: Skills ── */}
          {activeTab === "skills" && (
            <section className="mt-6 animate-slide-up">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {skills.map((skill) => (
                  <div key={skill.id} className="card group p-5 transition-all hover:border-indigo-200">
                    <div className="flex items-start justify-between">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${getSkillColor(skill.id)}`}>
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">{skill.handler}</span>
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">{skill.name}</h3>
                    <p className="mt-1 text-xs text-slate-400 leading-relaxed">{skill.description}</p>
                    <div className="mt-3 flex items-center gap-1.5">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      <span className="text-[10px] text-emerald-600 font-medium">{isEn ? "Active" : "已激活"}</span>
                    </div>
                  </div>
                ))}
              </div>
              {skills.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <p className="text-sm text-slate-400">{isEn ? "No skills registered" : "暂无已注册技能"}</p>
                </div>
              )}
            </section>
          )}

          {/* ── Tab: Agents ── */}
          {activeTab === "agents" && (
            <section className="mt-6 animate-slide-up space-y-6">
              {/* Register Form */}
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-slate-800">
                  {isEn ? "Register Agent in OpenClaw" : "注册 Agent 到 OpenClaw"}
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  {isEn ? "Register your AIsphere Agent as an OpenClaw agent to enable skill execution." : "将您的 AIsphere Agent 注册为 OpenClaw Agent 以启用技能执行。"}
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-slate-600">AIsphere Token ID</label>
                    <input
                      type="text"
                      value={regTokenId}
                      onChange={(e) => setRegTokenId(e.target.value)}
                      placeholder={isEn ? "e.g. 1" : "例如：1"}
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">{isEn ? "Agent Name" : "Agent 名称"}</label>
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder={isEn ? "e.g. DataAnalyst" : "例如：数据分析师"}
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition"
                    />
                  </div>
                </div>
                <button
                  onClick={handleRegister}
                  disabled={registering || !regTokenId.trim() || !regName.trim()}
                  className="btn-primary mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {registering ? (isEn ? "Registering..." : "注册中...") : (isEn ? "Register Agent" : "注册 Agent")}
                </button>
              </div>

              {/* Agent List */}
              <div className="grid gap-4 sm:grid-cols-2">
                {agents.map((agent) => (
                  <div key={agent.agentId} className="card p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-200/60 bg-gradient-to-br from-cyan-50 to-indigo-50">
                        <svg className="h-6 w-6 text-cyan-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2}>
                          <rect x="3" y="3" width="18" height="18" rx="4" />
                          <circle cx="12" cy="10" r="3" />
                          <path d="M7 20c0-2.8 2.2-5 5-5s5 2.2 5 5" strokeLinecap="round" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{agent.workspace}</p>
                        <p className="text-[10px] text-slate-400 font-mono">INFT #{agent.sealMindTokenId}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {agent.skills.map((skill) => (
                        <span key={skill.id} className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[9px] font-medium ${getSkillColor(skill.id)}`}>
                          {skill.id}
                        </span>
                      ))}
                    </div>
                    <p className="mt-2 text-[10px] text-slate-400 font-mono">
                      {isEn ? "Registered" : "注册时间"}: {new Date(agent.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
              {agents.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 border border-gray-100">
                    <svg className="h-7 w-7 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <rect x="3" y="3" width="18" height="18" rx="4" />
                      <circle cx="12" cy="10" r="3" />
                      <path d="M7 20c0-2.8 2.2-5 5-5s5 2.2 5 5" strokeLinecap="round" />
                    </svg>
                  </div>
                  <p className="text-sm text-slate-400">{isEn ? "No agents registered in OpenClaw" : "暂无 Agent 注册到 OpenClaw"}</p>
                  <p className="text-xs text-slate-300">{isEn ? "Register your first agent above" : "在上方注册您的第一个 Agent"}</p>
                </div>
              )}
            </section>
          )}
        </>
      )}
    </main>
  );
}
