"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { useAgent } from "../../../../hooks/useAgent";
import { useChat } from "../../../../hooks/useChat";
import { ChatMessage } from "../../../../components/ChatMessage";
import { useLang } from "../../../../contexts/LangContext";

const LEVEL_COLORS: Record<number, string> = {
  1: "text-slate-300", 2: "text-green-300", 3: "text-blue-300",
  4: "text-purple-300", 5: "text-cyan-300",
};

export default function AgentChatPage() {
  const params = useParams();
  const agentId =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
      ? params.id[0]
      : "";

  const { isConnected } = useAccount();
  const { agent, isLoading: agentLoading } = useAgent(agentId);
  const { messages, sendMessage, isLoading: chatLoading, error: chatError, loadHistory } = useChat(agentId);
  const { t, lang } = useLang();

  const THINKING_STEPS = [
    { label: t("chat_sending") === "发送中" ? "发送中" : "Sending", icon: "📤" },
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
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (agentId) loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinkStep]);

  async function handleSend() {
    if (!input.trim() || !isConnected || chatLoading) return;
    const content = input.trim();
    setInput("");
    setThinkStep(0);
    for (let i = 1; i < THINKING_STEPS.length - 1; i++) {
      await new Promise((r) => setTimeout(r, 600));
      setThinkStep(i);
    }
    await sendMessage(content, importance);
    setThinkStep(null);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const level = agent?.stats?.level ?? 1;

  const importanceLabel =
    importance >= 4
      ? lang === "zh" ? "高优先级" : "High Priority"
      : importance <= 2
      ? lang === "zh" ? "临时对话" : "Temporary"
      : lang === "zh" ? "标准记忆" : "Standard";

  return (
    <div className="flex h-[calc(100vh-65px)] overflow-hidden">
      {/* ── Left Sidebar ── */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-slate-950/60 p-5 md:flex">
        {agentLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-12 w-12 rounded-full bg-white/10" />
            <div className="h-4 w-3/4 rounded bg-white/10" />
            <div className="h-3 w-1/2 rounded bg-white/5" />
          </div>
        ) : agent ? (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-2xl">
              🤖
            </div>
            <h2 className="mt-3 text-base font-semibold text-white">{agent.profile?.name}</h2>
            <span className={`mt-1 text-xs font-medium ${LEVEL_COLORS[level] ?? "text-slate-300"}`}>
              Lv.{level} {LEVEL_LABELS[level] ?? ""}
            </span>
            <p className="mt-1 text-xs text-slate-500">{agent.profile?.model}</p>

            <div className="mt-5 space-y-2">
              {[
                { label: t("card_inferences"), value: agent.stats?.totalInferences ?? 0 },
                { label: t("card_memories"), value: agent.stats?.totalMemories ?? 0 },
                { label: t("card_trust"), value: agent.stats?.trustScore ?? 0, highlight: true },
              ].map(({ label, value, highlight }) => (
                <div key={label} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                  <span className="text-xs text-slate-500">{label}</span>
                  <span className={`text-sm font-semibold ${highlight ? "text-cyan-300" : "text-white"}`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {(agent.profile as any)?.description && (
              <p className="mt-4 text-xs leading-relaxed text-slate-500">
                {(agent.profile as any).description}
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-slate-600">
            {lang === "zh" ? "Agent 不存在" : "Agent not found"}
          </p>
        )}
      </aside>

      {/* ── Main Chat ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="flex items-center gap-3 border-b border-white/10 bg-slate-950/60 px-4 py-3 md:hidden">
          <span className="text-xl">🤖</span>
          <div>
            <p className="text-sm font-medium text-white">{agent?.profile?.name ?? `Agent #${agentId}`}</p>
            <p className="text-xs text-slate-500">{agent?.profile?.model}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {messages.length === 0 && !chatLoading && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <span className="text-4xl">💬</span>
              <p className="text-slate-400">{t("chat_empty")}</p>
            </div>
          )}

          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}

          {/* Thinking indicator */}
          {thinkStep !== null && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/20 text-xs text-blue-300">
                AI
              </div>
              <div className="rounded-2xl rounded-tl-sm border border-white/10 bg-white/5 px-4 py-3">
                <div className="flex items-center gap-2">
                  {THINKING_STEPS.map((s, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-1 text-xs transition-all ${
                        i < (thinkStep ?? 0) ? "text-green-400" : i === thinkStep ? "text-cyan-300" : "text-slate-700"
                      }`}
                    >
                      <span>{s.icon}</span>
                      <span className="hidden sm:inline">{s.label}</span>
                      {i < THINKING_STEPS.length - 1 && <span className="mx-0.5 text-slate-700">›</span>}
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="h-1.5 w-1.5 rounded-full bg-cyan-400/60 animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {chatError && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              ⚠ {chatError}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── Input Area ── */}
        <div className="border-t border-white/10 bg-slate-950/80 p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-xs text-slate-500">{t("chat_importance")}</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setImportance(n)}
                  className={`h-6 w-6 rounded-full text-xs font-medium transition ${
                    importance === n
                      ? "bg-cyan-400 text-slate-950"
                      : "border border-white/10 bg-white/5 text-slate-500 hover:border-cyan-400/30 hover:text-cyan-300"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <span className="ml-1 text-[10px] text-slate-600">{importanceLabel}</span>
          </div>

          <div className="flex gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!isConnected || chatLoading}
              rows={2}
              placeholder={isConnected ? t("chat_placeholder") : lang === "zh" ? "请先连接钱包以开始对话" : "Connect wallet to start chatting"}
              className="flex-1 resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30 disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!isConnected || chatLoading || !input.trim()}
              className="self-end rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {chatLoading ? (
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : t("chat_send")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
