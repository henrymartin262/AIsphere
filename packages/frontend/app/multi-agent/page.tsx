"use client";

import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useLang } from "../../contexts/LangContext";
import { apiGet, apiPost, setApiWalletAddress, CHAT_TIMEOUT } from "../../lib/api";

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
  // backend returns `responses`, not `selectedAgents`
  responses: Array<{ agentId: number; response: string; proofHash: string; teeVerified: boolean }>;
  aggregatedResponse: string;
  routingDecisions: string[];
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

  const [selectedSession, setSelectedSession] = useState<CollaborationSession | null>(null);
  const [sessionDetail, setSessionDetail] = useState<CollaborationSession | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const handleOpenSession = useCallback(async (session: CollaborationSession) => {
    setSelectedSession(session);
    setLoadingDetail(true);
    try {
      setApiWalletAddress(address!);
      const data = await apiGet<{ data: CollaborationSession }>(`/multi-agent/sessions/${session.id}`);
      setSessionDetail(data.data ?? session);
    } catch {
      setSessionDetail(session);
    } finally {
      setLoadingDetail(false);
    }
  }, [address]);

  const handleCloseSession = useCallback(() => {
    setSelectedSession(null);
    setSessionDetail(null);
  }, []);

  const [orchestrateError, setOrchestrateError] = useState<string | null>(null);

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
    setOrchestrateError(null);
    try {
      setApiWalletAddress(address);
      const agentIds = agentIdsInput.split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n));
      if (agentIds.length === 0) {
        setOrchestrateError("Please enter valid agent IDs");
        return;
      }
      const result = await apiPost<OrchestrationResult>("/multi-agent/orchestrate", {
        message: queryMessage,
        agentIds,
        walletAddress: address,
      }, CHAT_TIMEOUT);
      setOrchestrateResult(result);
    } catch (err) {
      setOrchestrateError(err instanceof Error ? err.message : "Orchestration failed");
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

            {/* Error */}
            {orchestrateError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                ⚠ {orchestrateError}
              </div>
            )}

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
                  {orchestrateResult.responses?.length > 0 && (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {orchestrateResult.responses.map((r) => (
                        <div key={r.agentId} className="flex items-start gap-2 rounded-lg bg-white border border-gray-100 p-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-600">#{r.agentId}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <p className="text-xs font-medium text-slate-700">{isEn ? "Agent" : "Agent"} #{r.agentId}</p>
                              {r.teeVerified && <span className="text-[10px] rounded bg-emerald-50 border border-emerald-200 text-emerald-600 px-1.5 py-0">TEE ✓</span>}
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-3">{r.response}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {orchestrateResult.routingDecisions?.length > 0 && (
                    <div className="rounded-lg bg-white border border-gray-100 p-3">
                      <p className="text-xs text-slate-400 mb-1.5">{isEn ? "Routing Log" : "路由日志"}</p>
                      <ul className="space-y-0.5">
                        {orchestrateResult.routingDecisions.map((d, i) => (
                          <li key={i} className="text-[11px] text-slate-500 flex gap-1.5">
                            <span className="text-indigo-300">▸</span>{d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
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
                  <div
                    key={session.id}
                    onClick={() => handleOpenSession(session)}
                    className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/30 cursor-pointer"
                  >
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
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </span>
                      <svg className="h-4 w-4 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M9 5l7 7-7 7" /></svg>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Session Detail Modal ── */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-gray-100 bg-white dark:border-white/10 dark:bg-slate-900 shadow-2xl flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10 shrink-0">
              <div>
                <h2 className="text-base font-semibold text-slate-800 dark:text-white">{selectedSession.name}</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isEn ? "Agents" : "参与 Agent"}：{selectedSession.agentIds.map(id => `#${id}`).join(", ")}
                  {" · "}{new Date(selectedSession.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={handleCloseSession}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
              {loadingDetail && (
                <div className="space-y-3">
                  {[1,2,3].map(n => <div key={n} className="animate-pulse rounded-xl bg-gray-50 dark:bg-white/5 h-16" />)}
                </div>
              )}

              {!loadingDetail && sessionDetail && (
                <>
                  {/* Tasks */}
                  {(sessionDetail.tasks as Array<{id: string; description?: string; status?: string; result?: string; delegateAgentId?: number}>).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
                        📋 {isEn ? "Tasks" : "任务"} ({sessionDetail.tasks.length})
                      </p>
                      <div className="space-y-2">
                        {(sessionDetail.tasks as Array<{id: string; description?: string; status?: string; result?: string; delegateAgentId?: number}>).map((task) => (
                          <div key={task.id} className="rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.03] px-4 py-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{task.description ?? task.id}</span>
                              <span className={`text-[10px] rounded border px-1.5 py-0 ${
                                task.status === "completed" ? "border-emerald-200 text-emerald-600 bg-emerald-50" :
                                task.status === "failed" ? "border-red-200 text-red-500 bg-red-50" :
                                "border-amber-200 text-amber-600 bg-amber-50"
                              }`}>{task.status ?? "pending"}</span>
                            </div>
                            {task.result && <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-3">{task.result}</p>}
                            {task.delegateAgentId && <p className="text-[10px] text-slate-400 mt-1">→ Agent #{task.delegateAgentId}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Messages */}
                  {(sessionDetail.messages as Array<{id: string; fromAgentId?: number; toAgentId?: number; type?: string; content?: string; timestamp?: number}>).length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">
                        💬 {isEn ? "Messages" : "消息记录"} ({sessionDetail.messages.length})
                      </p>
                      <div className="space-y-2">
                        {(sessionDetail.messages as Array<{id: string; fromAgentId?: number; toAgentId?: number; type?: string; content?: string; timestamp?: number}>).map((msg) => {
                          const isUser = msg.fromAgentId === 0 && msg.type === "request";
                          const isAgentResp = msg.toAgentId === 0 && msg.type === "response";
                          return (
                          <div key={msg.id} className={`rounded-xl border px-4 py-3 ${
                            isUser
                              ? "border-blue-100 dark:border-blue-500/20 bg-blue-50/40 dark:bg-blue-500/5"
                              : isAgentResp
                              ? "border-emerald-100 dark:border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-500/5"
                              : "border-indigo-100 dark:border-indigo-500/20 bg-indigo-50/40 dark:bg-indigo-500/5"
                          }`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[10px] font-semibold ${
                                isUser ? "text-blue-600 dark:text-blue-400"
                                : isAgentResp ? "text-emerald-600 dark:text-emerald-400"
                                : "text-indigo-600 dark:text-indigo-400"
                              }`}>
                                {isUser
                                  ? (isEn ? "👤 User" : "👤 用户")
                                  : isAgentResp
                                  ? `🤖 Agent #${msg.fromAgentId}`
                                  : `Agent #${msg.fromAgentId} → #${msg.toAgentId}`}
                              </span>
                              <span className={`text-[10px] rounded border px-1.5 py-0 ${
                                isUser ? "border-blue-100 dark:border-blue-500/20 bg-white dark:bg-blue-500/10 text-blue-400"
                                : isAgentResp ? "border-emerald-100 dark:border-emerald-500/20 bg-white dark:bg-emerald-500/10 text-emerald-400"
                                : "border-indigo-100 dark:border-indigo-500/20 bg-white dark:bg-indigo-500/10 text-indigo-400"
                              }`}>{msg.type}</span>
                              {msg.timestamp && (
                                <span className="text-[10px] text-slate-400 ml-auto">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-10 text-center">
                      <span className="text-3xl">💬</span>
                      <p className="text-sm text-gray-400 dark:text-slate-500">
                        {isEn ? "No messages in this session yet" : "此会话暂无消息记录"}
                      </p>
                      <p className="text-xs text-gray-300 dark:text-slate-600">
                        {isEn ? "Run an orchestration with this session to see messages" : "使用此会话运行编排任务后可查看消息"}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-gray-100 dark:border-white/10 shrink-0 flex justify-between items-center">
              <span className="text-xs text-gray-400 dark:text-slate-500">
                {sessionDetail
                  ? `${(sessionDetail.tasks as unknown[]).length} ${isEn ? "tasks" : "个任务"} · ${(sessionDetail.messages as unknown[]).length} ${isEn ? "messages" : "条消息"}`
                  : ""}
              </span>
              <button onClick={handleCloseSession} className="rounded-xl border border-gray-200 dark:border-white/10 px-4 py-1.5 text-sm text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/5 transition">
                {isEn ? "Close" : "关闭"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
