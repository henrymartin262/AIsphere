"use client";

import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useLang } from "../../contexts/LangContext";
import { apiGet, apiPost } from "../../lib/api";

/* ── Types ── */
interface CollaborationSession {
  id: string;
  name: string;
  agentIds: number[];
  tasks: unknown[];
  messages: unknown[];
  createdAt: number;
  updatedAt: number;
}

interface OrchestrationResult {
  sessionId: string;
  selectedAgents: Array<{ agentId: number; name: string; score: number }>;
  results: Array<{ agentId: number; response: string; proof?: unknown }>;
  aggregatedResponse: string;
  timestamp: number;
}

/* ── Status Card ── */
function StatusCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-slate-400">{label}</p>
          <p className="text-lg font-bold text-slate-800">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function MultiAgentPage() {
  const { address, isConnected } = useAccount();
  const { t } = useLang();
  const isEn = t("nav_home") === "Home";

  const [sessions, setSessions] = useState<CollaborationSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [orchestrateResult, setOrchestrateResult] = useState<OrchestrationResult | null>(null);
  const [orchestrating, setOrchestrating] = useState(false);

  // Form state
  const [queryMessage, setQueryMessage] = useState("");
  const [agentIdsInput, setAgentIdsInput] = useState("");
  const [sessionName, setSessionName] = useState("");
  const [sessionAgentIds, setSessionAgentIds] = useState("");

  // Tab
  const [activeTab, setActiveTab] = useState<"orchestrate" | "sessions">("orchestrate");

  /* ── Fetch sessions ── */
  const fetchSessions = useCallback(async () => {
    if (!address) return;
    setLoadingSessions(true);
    try {
      const data = await apiGet<CollaborationSession[]>("/multi-agent/sessions", { walletAddress: address });
      setSessions(Array.isArray(data) ? data : []);
    } catch {
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  }, [address]);

  /* ── Orchestrate ── */
  const handleOrchestrate = useCallback(async () => {
    if (!address || !queryMessage.trim() || !agentIdsInput.trim()) return;
    setOrchestrating(true);
    setOrchestrateResult(null);
    try {
      const agentIds = agentIdsInput.split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n));
      const result = await apiPost<OrchestrationResult>("/multi-agent/orchestrate", {
        message: queryMessage,
        agentIds,
        walletAddress: address,
      });
      setOrchestrateResult(result);
    } catch (err) {
      console.error("Orchestration failed:", err);
    } finally {
      setOrchestrating(false);
    }
  }, [address, queryMessage, agentIdsInput]);

  /* ── Create Session ── */
  const handleCreateSession = useCallback(async () => {
    if (!address || !sessionName.trim() || !sessionAgentIds.trim()) return;
    try {
      const agentIds = sessionAgentIds.split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n));
      await apiPost("/multi-agent/sessions", {
        name: sessionName,
        agentIds,
        walletAddress: address,
      });
      setSessionName("");
      setSessionAgentIds("");
      fetchSessions();
    } catch (err) {
      console.error("Create session failed:", err);
    }
  }, [address, sessionName, sessionAgentIds, fetchSessions]);

  if (!isConnected) {
    return (
      <main className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-6 px-6 py-20 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50 to-violet-50">
          <svg className="h-10 w-10 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-800">
          {isEn ? "Connect Wallet to Access Multi-Agent" : "连接钱包以访问多 Agent 协作"}
        </h1>
        <p className="text-slate-500 max-w-md">
          {isEn ? "Multi-Agent collaboration requires wallet connection for agent ownership verification." : "多 Agent 协作需要连接钱包以验证 Agent 所有权。"}
        </p>
        <ConnectButton />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      {/* Header */}
      <section className="animate-slide-up card-gradient relative overflow-hidden p-8 md:p-12">
        <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-indigo-400/[0.06] blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-violet-400/[0.05] blur-[60px]" />
        <div className="relative z-10">
          <span className="badge">Multi-Agent</span>
          <h1 className="mt-4 text-2xl font-bold text-slate-800 md:text-3xl">
            {isEn ? "Multi-Agent " : "多 Agent "}
            <span className="text-gradient">{isEn ? "Collaboration" : "协作中心"}</span>
          </h1>
          <p className="mt-2 max-w-2xl text-slate-500 leading-relaxed text-sm">
            {isEn
              ? "Orchestrate multiple AI Agents to work together — delegate tasks, route queries to the best agent, and manage collaboration sessions."
              : "编排多个 AI Agent 协同工作 — 委派任务、将查询路由到最佳 Agent、管理协作会话。"}
          </p>
        </div>
      </section>

      {/* Status Cards */}
      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatusCard
          icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
          label={isEn ? "Active Sessions" : "活跃会话"}
          value={sessions.length}
          color="bg-indigo-50 text-indigo-500 border-indigo-200/60"
        />
        <StatusCard
          icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
          label={isEn ? "Message Types" : "消息类型"}
          value="5"
          color="bg-violet-50 text-violet-500 border-violet-200/60"
        />
        <StatusCard
          icon={<svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
          label={isEn ? "Orchestration" : "编排模式"}
          value={isEn ? "Parallel" : "并行"}
          color="bg-amber-50 text-amber-500 border-amber-200/60"
        />
      </section>

      {/* Tab Navigation */}
      <div className="mt-8 flex items-center gap-1 rounded-full border border-gray-100 bg-gray-50/60 p-1 w-fit">
        {[
          { key: "orchestrate" as const, label: isEn ? "Orchestrate" : "编排推理" },
          { key: "sessions" as const, label: isEn ? "Sessions" : "协作会话" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              if (tab.key === "sessions") fetchSessions();
            }}
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

      {/* ── Tab: Orchestrate ── */}
      {activeTab === "orchestrate" && (
        <section className="mt-6 animate-slide-up">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-800">
              {isEn ? "Multi-Agent Orchestration" : "多 Agent 编排"}
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              {isEn
                ? "Send a query to multiple agents simultaneously, get aggregated results with proofs."
                : "同时向多个 Agent 发送查询，获取聚合结果和证明。"}
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600">
                  {isEn ? "Agent IDs (comma-separated)" : "Agent ID（逗号分隔）"}
                </label>
                <input
                  type="text"
                  value={agentIdsInput}
                  onChange={(e) => setAgentIdsInput(e.target.value)}
                  placeholder={isEn ? "e.g. 1, 2, 3" : "例如：1, 2, 3"}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">
                  {isEn ? "Query Message" : "查询消息"}
                </label>
                <textarea
                  value={queryMessage}
                  onChange={(e) => setQueryMessage(e.target.value)}
                  placeholder={isEn ? "Enter your query for multi-agent orchestration..." : "输入需要多 Agent 协作处理的查询..."}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition resize-none"
                />
              </div>
              <button
                onClick={handleOrchestrate}
                disabled={orchestrating || !queryMessage.trim() || !agentIdsInput.trim()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {orchestrating ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={3} strokeDasharray="60 20" /></svg>
                    {isEn ? "Orchestrating..." : "编排中..."}
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    {isEn ? "Run Orchestration" : "开始编排"}
                  </>
                )}
              </button>
            </div>

            {/* Result */}
            {orchestrateResult && (
              <div className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50/30 p-5">
                <h3 className="text-sm font-semibold text-indigo-700">
                  {isEn ? "Orchestration Result" : "编排结果"}
                </h3>
                <div className="mt-3 space-y-3">
                  <div className="rounded-lg bg-white border border-gray-100 p-4">
                    <p className="text-xs text-slate-400 mb-1">{isEn ? "Aggregated Response" : "聚合回复"}</p>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{orchestrateResult.aggregatedResponse}</p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {orchestrateResult.selectedAgents?.map((ag) => (
                      <div key={ag.agentId} className="flex items-center gap-2 rounded-lg bg-white border border-gray-100 p-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-600">#{ag.agentId}</span>
                        <div>
                          <p className="text-xs font-medium text-slate-700">{ag.name}</p>
                          <p className="text-[10px] text-slate-400">{isEn ? "Score" : "得分"}: {ag.score}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Tab: Sessions ── */}
      {activeTab === "sessions" && (
        <section className="mt-6 animate-slide-up space-y-6">
          {/* Create Session */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-800">
              {isEn ? "Create Collaboration Session" : "创建协作会话"}
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-600">{isEn ? "Session Name" : "会话名称"}</label>
                <input
                  type="text"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder={isEn ? "e.g. Analysis Team" : "例如：分析团队"}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">{isEn ? "Agent IDs" : "Agent ID"}</label>
                <input
                  type="text"
                  value={sessionAgentIds}
                  onChange={(e) => setSessionAgentIds(e.target.value)}
                  placeholder={isEn ? "e.g. 1, 2, 3" : "例如：1, 2, 3"}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition"
                />
              </div>
            </div>
            <button
              onClick={handleCreateSession}
              disabled={!sessionName.trim() || !sessionAgentIds.trim()}
              className="btn-secondary mt-4 disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M12 4v16m8-8H4" /></svg>
              {isEn ? "Create Session" : "创建会话"}
            </button>
          </div>

          {/* Session List */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-800">
              {isEn ? "Collaboration Sessions" : "协作会话列表"}
            </h2>

            {loadingSessions && (
              <div className="mt-4 space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-50" />
                ))}
              </div>
            )}

            {!loadingSessions && sessions.length === 0 && (
              <div className="mt-8 flex flex-col items-center gap-3 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 border border-gray-100">
                  <svg className="h-8 w-8 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-sm text-slate-400">{isEn ? "No sessions yet" : "暂无协作会话"}</p>
                <p className="text-xs text-slate-300">{isEn ? "Create your first collaboration session above" : "在上方创建您的第一个协作会话"}</p>
              </div>
            )}

            {!loadingSessions && sessions.length > 0 && (
              <div className="mt-4 space-y-3">
                {sessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 p-4 transition hover:border-indigo-200">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">{session.name}</h3>
                      <div className="mt-1 flex items-center gap-3">
                        <span className="text-[10px] text-slate-400">
                          {session.agentIds.length} {isEn ? "agents" : "个 Agent"}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {session.tasks.length} {isEn ? "tasks" : "个任务"}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {session.messages.length} {isEn ? "messages" : "条消息"}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(session.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
