"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { useMemory } from "../../../../hooks/useMemory";
import { useLang } from "../../../../contexts/LangContext";
import { apiPost, apiDelete } from "../../../../lib/api";
import type { MemoryItem } from "../../../../types";

type MemoryType = "all" | "conversation" | "knowledge" | "personality" | "skill" | "decision";

const TYPE_ICON: Record<string, string> = {
  conversation: "💬", knowledge: "📚", personality: "🧠", skill: "⚡", decision: "⛓",
};

const TYPE_COLOR: Record<string, string> = {
  conversation: "bg-blue-50   text-blue-600   border-blue-200   dark:bg-blue-500/10   dark:text-blue-300   dark:border-blue-500/30",
  knowledge:    "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30",
  personality:  "bg-purple-50  text-purple-600  border-purple-200  dark:bg-purple-500/10  dark:text-purple-300  dark:border-purple-500/30",
  skill:        "bg-amber-50   text-amber-600   border-amber-200   dark:bg-amber-500/10   dark:text-amber-300   dark:border-amber-500/30",
  decision:     "bg-indigo-50  text-indigo-600  border-indigo-200  dark:bg-indigo-500/10  dark:text-indigo-300  dark:border-indigo-500/30",
};

function ImportanceDots({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((n) => (
        <span key={n} className={`inline-block h-1.5 w-1.5 rounded-full ${n <= value ? "bg-indigo-500" : "bg-gray-200 dark:bg-white/10"}`} />
      ))}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="card animate-pulse p-5">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-xl bg-gray-100 dark:bg-white/10" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-20 rounded bg-gray-100 dark:bg-white/10" />
          <div className="h-4 w-full rounded bg-gray-100 dark:bg-white/10" />
          <div className="h-4 w-3/4 rounded bg-gray-50 dark:bg-white/5" />
          <div className="h-3 w-1/3 rounded bg-gray-50 dark:bg-white/5" />
        </div>
      </div>
    </div>
  );
}

interface AddMemoryModalProps {
  agentId: string;
  walletAddress: string;
  onClose: () => void;
  onSaved: () => void;
}

function AddMemoryModal({ agentId, walletAddress, onClose, onSaved }: AddMemoryModalProps) {
  const { t } = useLang();
  const [type, setType] = useState<Exclude<MemoryType, "all">>("conversation");
  const [content, setContent] = useState("");
  const [importance, setImportance] = useState(3);
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const TYPES: Exclude<MemoryType, "all">[] = ["conversation","knowledge","personality","skill","decision"];
  const TYPE_LABEL_KEY: Record<string, string> = {
    conversation: "memory_conversation", knowledge: "memory_knowledge",
    personality: "memory_personality",   skill: "memory_skill", decision: "memory_decision",
  };

  async function handleSave() {
    if (!content.trim()) return;
    setSaving(true); setErr(null);
    try {
      await apiPost(`/memory/${agentId}`, {
        type, content: content.trim(), importance,
        tags: tags.split(",").map((s) => s.trim()).filter(Boolean), walletAddress,
      });
      onSaved(); onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to save");
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md card p-6 shadow-2xl">
        <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">{t("memory_add_title")}</h2>

        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-slate-400">{t("memory_type")}</label>
          <div className="flex flex-wrap gap-2">
            {TYPES.map((tp) => (
              <button key={tp} onClick={() => setType(tp)}
                className={`rounded-xl px-3 py-1 text-xs font-medium border transition ${
                  type === tp ? TYPE_COLOR[tp] : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10"
                }`}>
                {TYPE_ICON[tp]} {t(TYPE_LABEL_KEY[tp] as Parameters<typeof t>[0])}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-slate-400">{t("memory_content")}</label>
          <textarea rows={4} value={content} onChange={(e) => setContent(e.target.value)}
            placeholder={t("memory_content_ph")}
            className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder-slate-600 dark:focus:border-indigo-400/50 dark:focus:ring-indigo-400/10"
          />
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-slate-400">{t("memory_importance")}</label>
          <div className="flex gap-1.5">
            {[1,2,3,4,5].map((n) => (
              <button key={n} onClick={() => setImportance(n)}
                className={`h-7 w-7 rounded-full text-xs font-semibold transition ${
                  importance === n
                    ? "bg-indigo-500 text-white"
                    : "border border-gray-200 bg-white text-gray-400 hover:border-indigo-300 hover:text-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-500 dark:hover:text-indigo-300"
                }`}>
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-slate-400">{t("memory_tags")}</label>
          <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="tag1, tag2"
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder-slate-600 dark:focus:border-indigo-400/50 dark:focus:ring-indigo-400/10"
          />
        </div>

        {err && (
          <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">{err}</p>
        )}

        <div className="flex gap-2 justify-end">
          <button onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-500 transition hover:border-gray-300 hover:text-gray-700 dark:border-white/10 dark:text-slate-400 dark:hover:text-white">
            {t("memory_cancel")}
          </button>
          <button onClick={handleSave} disabled={saving || !content.trim()}
            className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed">
            {saving ? "..." : t("memory_save")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AgentMemoryPage() {
  const params = useParams();
  const agentId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";
  const { address } = useAccount();
  const { memories, isLoading, error, refetch } = useMemory(agentId);
  const { t } = useLang();

  const [activeTab, setActiveTab] = useState<MemoryType>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const TABS: { key: MemoryType; labelKey: Parameters<typeof t>[0] }[] = [
    { key: "all",          labelKey: "memory_all" },
    { key: "conversation", labelKey: "memory_conversation" },
    { key: "knowledge",    labelKey: "memory_knowledge" },
    { key: "personality",  labelKey: "memory_personality" },
    { key: "skill",        labelKey: "memory_skill" },
    { key: "decision",     labelKey: "memory_decision" },
  ];

  const filtered = activeTab === "all" ? memories : memories.filter((m) => m.type === activeTab);

  async function handleDelete(memory: MemoryItem) {
    if (!window.confirm(t("memory_delete_confirm"))) return;
    setDeletingId(memory.id);
    try { await apiDelete(`/memory/${agentId}/${memory.id}`); await refetch(); }
    catch { /* ignore */ }
    finally { setDeletingId(null); }
  }

  function formatTime(ts: number) { return new Date(ts * 1000).toLocaleString(); }

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <span className="badge">{t("memory_title")}</span>
        <button onClick={() => setShowAddModal(true)}
          className="btn-primary">
          + {t("memory_add")}
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="mb-5 flex flex-wrap gap-1.5">
        {TABS.map(({ key, labelKey }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition border ${
              activeTab === key
                ? "bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-400/30"
                : "border-gray-200 bg-white text-gray-500 hover:border-indigo-200 hover:text-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10"
            }`}>
            {key !== "all" && TYPE_ICON[key] + " "}{t(labelKey)}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          ⚠ {error}
        </div>
      )}

      {isLoading && <div className="space-y-3">{[1,2,3].map((n) => <SkeletonCard key={n} />)}</div>}

      {!isLoading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <span className="text-5xl">🧠</span>
          <p className="text-base font-medium text-gray-900 dark:text-white">{t("memory_empty")}</p>
          <p className="text-sm text-gray-400 dark:text-slate-500">{t("memory_empty_desc")}</p>
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((memory) => {
            const memType = memory.type ?? "conversation";
            const icon = TYPE_ICON[memType] ?? "📄";
            const colorClass = TYPE_COLOR[memType] ?? "bg-gray-50 text-gray-600 border-gray-200 dark:bg-white/5 dark:text-slate-300 dark:border-white/10";
            const preview = memory.content.length > 120 ? memory.content.slice(0, 120) + "…" : memory.content;

            return (
              <div key={memory.id}
                className="card group relative p-5 hover:shadow-md">
                <button onClick={() => handleDelete(memory)} disabled={deletingId === memory.id}
                  className="absolute right-4 top-4 hidden rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500 group-hover:flex disabled:opacity-40 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                  aria-label="delete">
                  {deletingId === memory.id ? (
                    <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>

                <div className="flex items-start gap-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-base ${colorClass}`}>
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`inline-block rounded-lg border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${colorClass}`}>
                      {memType}
                    </span>
                    <p className="mt-1.5 text-sm leading-relaxed text-gray-700 dark:text-slate-200">{preview}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <span className="text-[11px] text-gray-400 dark:text-slate-500">{formatTime(memory.timestamp)}</span>
                      <ImportanceDots value={memory.importance} />
                      {memory.tags && memory.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {memory.tags.map((tag) => (
                            <span key={tag} className="rounded-md border border-gray-100 bg-gray-50 px-1.5 py-0.5 text-[10px] text-gray-400 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-slate-500">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <AddMemoryModal agentId={agentId} walletAddress={address ?? ""}
          onClose={() => setShowAddModal(false)} onSaved={refetch} />
      )}
    </main>
  );
}
