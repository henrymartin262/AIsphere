"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { useAgent } from "../../../../hooks/useAgent";
import { useChat } from "../../../../hooks/useChat";
import { useChatSessions } from "../../../../hooks/useChatSessions";
import { ChatMessage } from "../../../../components/ChatMessage";
import { useLang } from "../../../../contexts/LangContext";

const LEVEL_COLORS: Record<number, string> = {
  1: "text-gray-400 dark:text-slate-400",
  2: "text-green-600 dark:text-green-400",
  3: "text-blue-600 dark:text-blue-400",
  4: "text-purple-600 dark:text-purple-400",
  5: "text-indigo-600 dark:text-indigo-400",
};

function formatTime(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - ts) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function AgentChatPage() {
  const params = useParams();
  const agentId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";

  const { isConnected } = useAccount();
  const { agent, isLoading: agentLoading } = useAgent(agentId);
  const { messages, setMessages, sendMessage, isLoading: chatLoading, error: chatError, loadHistory } = useChat(agentId);
  const { t, lang } = useLang();

  const {
    sessions, activeSession, activeSessionId,
    updateSessionMessages, newSession, deleteSession, switchSession, renameSession,
  } = useChatSessions(agentId);

  const THINKING_STEPS = [
    { label: lang === "zh" ? "发送中" : "Sending", icon: "📤" },
    { label: t("chat_sending"), icon: "🧠" },
    { label: lang === "zh" ? "保存记忆" : "Saving", icon: "💾" },
    { label: lang === "zh" ? "完成" : "Done", icon: "✅" },
  ];

  const LEVEL_LABELS: Record<number, string> = {
    1: t("card_level_1"), 2: t("card_level_2"), 3: t("card_level_3"),
    4: t("card_level_4"), 5: t("card_level_5"),
  };

  const [input, setInput] = useState("");
  const [importance, setImportance] = useState(3);
  const [thinkStep, setThinkStep] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [queueCount, setQueueCount] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const queueRef = useRef<Array<{ content: string; importance: number }>>([]);
  const processingRef = useRef(false);
  const cancelledRef = useRef(false);
  const isZh = lang === "zh";

  // Load history from backend on first mount — only to warm up backend cache.
  // Do NOT restore messages from backend history here; localStorage sessions are the source of truth.
  // (Backend history is built from in-memory store which resets on restart.)
  useEffect(() => { if (agentId) loadHistory().catch(() => {}); }, [agentId]); // eslint-disable-line

  // Restore messages from session when switching
  useEffect(() => {
    if (activeSession && activeSession.messages.length > 0) {
      setMessages(activeSession.messages);
    } else if (activeSession && activeSession.messages.length === 0) {
      setMessages([]);
    }
  }, [activeSessionId]); // eslint-disable-line

  // Save messages to session whenever they change
  useEffect(() => {
    if (activeSessionId && messages.length > 0) {
      updateSessionMessages(activeSessionId, messages);
    }
  }, [messages]); // eslint-disable-line

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, thinkStep]);

  // ── Message queue processor ──────────────────────────────────────────────────
  async function processQueue() {
    if (processingRef.current) return;
    processingRef.current = true;
    cancelledRef.current = false;

    while (queueRef.current.length > 0) {
      if (cancelledRef.current) break;

      const item = queueRef.current[0];
      setQueueCount(queueRef.current.length - 1);

      setThinkStep(0);
      for (let i = 1; i < THINKING_STEPS.length - 1; i++) {
        if (cancelledRef.current) break;
        await new Promise((r) => setTimeout(r, 600));
        setThinkStep(i);
      }

      if (!cancelledRef.current) {
        // Pass current messages as history for multi-turn context (snapshot before this message)
        const historySnapshot = [...messages];
        await sendMessage(item.content, item.importance, () => cancelledRef.current, historySnapshot);
      }

      setThinkStep(null);
      queueRef.current.shift();
      setQueueCount(queueRef.current.length);
    }

    processingRef.current = false;
  }

  function handleSend() {
    if (!input.trim()) return;
    const content = input.trim();
    const imp = importance;
    setInput("");

    queueRef.current.push({ content, importance: imp });
    setQueueCount(queueRef.current.length);
    processQueue();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  function resetQueueState() {
    cancelledRef.current = true;
    queueRef.current = [];
    processingRef.current = false;
    setQueueCount(0);
    setThinkStep(null);
  }

  function handleNewChat() {
    resetQueueState();
    newSession();
    setMessages([]);
  }

  function handleSwitchSession(sessionId: string) {
    if (sessionId === activeSessionId) return;
    resetQueueState();
    switchSession(sessionId);
  }

  function handleDeleteSession(e: React.MouseEvent, sessionId: string) {
    e.stopPropagation();
    setDeletingId(sessionId);
    setTimeout(() => {
      deleteSession(sessionId);
      setDeletingId(null);
      if (sessionId === activeSessionId) {
        resetQueueState();
        setMessages([]);
      }
    }, 300);
  }

  function handleStartRename(e: React.MouseEvent, sessionId: string, currentTitle: string) {
    e.stopPropagation();
    setEditingId(sessionId);
    setEditingTitle(currentTitle === "New Chat" ? "" : currentTitle);
    setTimeout(() => renameInputRef.current?.focus(), 50);
  }

  function handleRenameSubmit(sessionId: string) {
    renameSession(sessionId, editingTitle || "New Chat");
    setEditingId(null);
    setEditingTitle("");
  }

  function handleRenameKeyDown(e: React.KeyboardEvent, sessionId: string) {
    if (e.key === "Enter") { e.preventDefault(); handleRenameSubmit(sessionId); }
    if (e.key === "Escape") { setEditingId(null); setEditingTitle(""); }
  }

  const level = agent?.stats?.level ?? 1;
  const importanceLabel =
    importance >= 4 ? (isZh ? "高优先级" : "High Priority")
    : importance <= 2 ? (isZh ? "临时对话" : "Temporary")
    : (isZh ? "标准记忆" : "Standard");

  return (
    <div className="flex h-[calc(100vh-65px)] overflow-hidden">

      {/* ── Session Sidebar ── */}
      <aside className={`${sidebarOpen ? "w-64" : "w-0"} shrink-0 flex-col border-r border-gray-100 bg-white transition-all duration-200 overflow-hidden dark:border-white/[0.08] dark:bg-slate-950 hidden md:flex`}>
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/[0.08]">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50 text-sm dark:border-indigo-400/20 dark:bg-indigo-500/10">
                🤖
              </div>
              <span className="text-xs font-semibold text-gray-700 truncate dark:text-slate-300">
                {agent?.profile?.name ?? `Agent #${agentId}`}
              </span>
            </div>
            <button
              onClick={handleNewChat}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 hover:text-indigo-500 hover:border-indigo-200 transition-colors dark:border-white/10 dark:bg-white/5 dark:text-slate-500 dark:hover:text-indigo-300"
              title={isZh ? "新建对话" : "New Chat"}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* Session list */}
          <div className="flex-1 overflow-y-auto py-2">
            {sessions.length === 0 && (
              <p className="px-4 py-3 text-xs text-gray-400 dark:text-slate-600">
                {isZh ? "暂无对话" : "No conversations yet"}
              </p>
            )}
            {sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => editingId !== s.id && handleSwitchSession(s.id)}
                className={`group relative mx-2 mb-0.5 flex cursor-pointer items-start gap-2 rounded-xl px-3 py-2.5 transition-all ${
                  deletingId === s.id ? "opacity-0 scale-95" : "opacity-100"
                } ${
                  s.id === activeSessionId
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
                    : "text-gray-600 hover:bg-gray-50 dark:text-slate-400 dark:hover:bg-white/[0.04]"
                }`}
              >
                <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm3.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm3.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>

                <div className="flex-1 min-w-0">
                  {editingId === s.id ? (
                    /* ── Rename input ── */
                    <input
                      ref={renameInputRef}
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onBlur={() => handleRenameSubmit(s.id)}
                      onKeyDown={(e) => handleRenameKeyDown(e, s.id)}
                      onClick={(e) => e.stopPropagation()}
                      placeholder={s.title}
                      className="w-full rounded bg-white px-1 py-0 text-xs font-medium text-gray-800 outline-none ring-1 ring-indigo-400 dark:bg-slate-800 dark:text-white"
                    />
                  ) : (
                    <p className="truncate text-xs font-medium leading-tight">{s.title}</p>
                  )}
                  <p className="mt-0.5 text-[10px] opacity-50">{formatTime(s.updatedAt)}</p>
                </div>

                {/* Action buttons — show on hover */}
                {editingId !== s.id && (
                  <div className="absolute right-2 top-2 hidden items-center gap-0.5 group-hover:flex">
                    {/* Rename */}
                    <button
                      onClick={(e) => handleStartRename(e, s.id, s.title)}
                      className="flex h-5 w-5 items-center justify-center rounded text-gray-400 hover:text-indigo-500 dark:text-slate-600 dark:hover:text-indigo-400"
                      title={isZh ? "重命名" : "Rename"}
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                      </svg>
                    </button>
                    {/* Delete */}
                    <button
                      onClick={(e) => handleDeleteSession(e, s.id)}
                      className="flex h-5 w-5 items-center justify-center rounded text-gray-400 hover:text-red-400 dark:text-slate-600 dark:hover:text-red-400"
                      title={isZh ? "删除" : "Delete"}
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Agent stats at bottom */}
          {agent && !agentLoading && (
            <div className="border-t border-gray-100 px-4 py-3 dark:border-white/[0.08]">
              <div className="space-y-1.5">
                {[
                  { label: t("card_inferences"), value: agent.stats?.totalInferences ?? 0 },
                  { label: t("card_trust"), value: agent.stats?.trustScore ?? 0, highlight: true },
                ].map(({ label, value, highlight }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 dark:text-slate-600">{label}</span>
                    <span className={`text-[11px] font-semibold ${highlight ? "text-indigo-500 dark:text-indigo-400" : "text-gray-600 dark:text-slate-400"}`}>{value}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 dark:text-slate-600">{isZh ? "等级" : "Level"}</span>
                  <span className={`text-[11px] font-semibold ${LEVEL_COLORS[level] ?? "text-gray-400"}`}>Lv.{level} {LEVEL_LABELS[level] ?? ""}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main Chat ── */}
      <div className="flex flex-1 flex-col overflow-hidden bg-gray-50/50 dark:bg-slate-950/50">
        {/* Top bar with toggle + model info */}
        <div className="flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-2.5 dark:border-white/[0.08] dark:bg-slate-900">
          {/* Sidebar toggle */}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors dark:text-slate-500 dark:hover:text-slate-300 dark:hover:bg-white/[0.06]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex-1 flex items-center gap-2 min-w-0">
            <span className="text-sm font-medium text-gray-700 truncate dark:text-slate-300">
              {activeSession?.title && activeSession.title !== "New Chat"
                ? activeSession.title
                : (agent?.profile?.name ?? `Agent #${agentId}`)}
            </span>
            {agent?.profile?.model && (
              <span className="shrink-0 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] text-gray-400 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-600">
                {agent.profile.model}
              </span>
            )}
          </div>

          <button
            onClick={handleNewChat}
            className="md:hidden flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-500 hover:border-indigo-200 hover:text-indigo-500 transition-colors dark:border-white/10 dark:bg-white/5 dark:text-slate-400"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" d="M12 4v16m8-8H4" />
            </svg>
            {isZh ? "新建" : "New"}
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {messages.length === 0 && !chatLoading && (
            <div className="flex flex-col items-center gap-6 py-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-hero-gradient-subtle">
                <svg className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="font-display text-lg font-semibold text-gray-800 dark:text-white">{isZh ? "开始对话" : "Start a Conversation"}</h3>
                <p className="mt-1 text-sm text-gray-400 dark:text-slate-500">{isZh ? "选择一个话题或输入你的问题" : "Pick a topic or type your question"}</p>
              </div>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 w-full max-w-lg">
                {[
                  { icon: "📊", label: isZh ? "分析 0G 代币趋势" : "Analyze 0G token trend", msg: isZh ? "分析一下 0G 代币近期的价格趋势和市场表现" : "Analyze the recent price trend of 0G token" },
                  { icon: "🔍", label: isZh ? "审计智能合约" : "Audit smart contract", msg: isZh ? "帮我审计一个 Solidity 智能合约" : "Help me audit a Solidity smart contract" },
                  { icon: "🧠", label: isZh ? "解释 TEE 推理" : "Explain TEE inference", msg: isZh ? "解释 TEE 可信执行环境是如何保证 AI 推理安全性的" : "Explain how TEE ensures AI inference security" },
                  { icon: "💡", label: isZh ? "DeFi 收益策略" : "DeFi yield strategies", msg: isZh ? "推荐几个安全的 DeFi 收益策略" : "Recommend safe DeFi yield farming strategies" },
                ].map((prompt) => (
                  <button key={prompt.label} onClick={() => setInput(prompt.msg)}
                    className="group flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 text-left text-sm transition-all hover:border-indigo-200 hover:bg-indigo-50/50 hover:shadow-sm dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-indigo-400/20 dark:hover:bg-indigo-500/5">
                    <span className="text-lg">{prompt.icon}</span>
                    <span className="text-gray-600 group-hover:text-indigo-600 dark:text-slate-400 dark:group-hover:text-indigo-300">{prompt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)}

          {thinkStep !== null && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 text-xs font-medium text-indigo-600 dark:border-indigo-400/30 dark:bg-indigo-500/15 dark:text-indigo-300">AI</div>
              <div className="rounded-2xl rounded-tl-sm border border-gray-200 bg-white px-4 py-3 dark:border-white/[0.08] dark:bg-white/5">
                <div className="flex items-center gap-2">
                  {THINKING_STEPS.map((s, i) => (
                    <div key={i} className={`flex items-center gap-1 text-xs transition-all ${
                      i < (thinkStep ?? 0) ? "text-green-600 dark:text-green-400"
                      : i === thinkStep ? "text-indigo-600 dark:text-indigo-300"
                      : "text-gray-300 dark:text-slate-700"
                    }`}>
                      <span>{s.icon}</span>
                      <span className="hidden sm:inline">{s.label}</span>
                      {i < THINKING_STEPS.length - 1 && <span className="mx-0.5 text-gray-300 dark:text-slate-700">›</span>}
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex gap-1">
                  {[0,1,2].map((i) => <span key={i} className="h-1.5 w-1.5 rounded-full bg-indigo-400/60 animate-bounce" style={{ animationDelay: `${i*150}ms` }} />)}
                </div>
              </div>
            </div>
          )}

          {chatError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
              ⚠ {chatError}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-100 bg-white p-4 dark:border-white/[0.08] dark:bg-slate-950">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-xs text-gray-400 dark:text-slate-500">{t("chat_importance")}</span>
            <div className="flex gap-1">
              {[1,2,3,4,5].map((n) => (
                <button key={n} onClick={() => setImportance(n)}
                  className={`h-6 w-6 rounded-full text-xs font-medium transition ${
                    importance === n
                      ? "bg-indigo-500 text-white"
                      : "border border-gray-200 bg-white text-gray-400 hover:border-indigo-300 hover:text-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-500 dark:hover:border-indigo-400/30 dark:hover:text-indigo-300"
                  }`}>{n}</button>
              ))}
            </div>
            <span className="ml-1 text-[10px] text-gray-400 dark:text-slate-600">{importanceLabel}</span>
          </div>
          <div className="flex gap-3">
            <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
              rows={2} placeholder={t("chat_placeholder")}
              className="flex-1 resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder-slate-600 dark:focus:border-indigo-400/50 dark:focus:ring-indigo-400/10" />
            <div className="flex flex-col items-end gap-1.5">
              <button onClick={handleSend} disabled={!isConnected || !input.trim()}
                className="rounded-2xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-600 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">
                {chatLoading
                  ? <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  : t("chat_send")}
              </button>
              {queueCount > 0 && (
                <span className="text-[10px] text-indigo-400 dark:text-indigo-500">
                  {isZh ? `队列中 ${queueCount} 条` : `${queueCount} queued`}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
