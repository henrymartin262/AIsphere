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
  conversation: "💬",
  knowledge: "📚",
  personality: "🧠",
  skill: "⚡",
  decision: "⛓",
};

const TYPE_COLOR: Record<string, string> = {
  conversation: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  knowledge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  personality: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  skill: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  decision: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
};

function ImportanceDots({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`inline-block h-1.5 w-1.5 rounded-full ${
            n <= value ? "bg-cyan-400" : "bg-white/10"
          }`}
        />
      ))}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-xl bg-white/10" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-20 rounded bg-white/10" />
          <div className="h-4 w-full rounded bg-white/10" />
          <div className="h-4 w-3/4 rounded bg-white/5" />
          <div className="h-3 w-1/3 rounded bg-white/5" />
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

  const TYPES: Exclude<MemoryType, "all">[] = [
    "conversation",
    "knowledge",
    "personality",
    "skill",
    "decision",
  ];

  const TYPE_LABEL_KEY: Record<string, string> = {
    conversation: "memory_conversation",
    knowledge: "memory_knowledge",
    personality: "memory_personality",
    skill: "memory_skill",
    decision: "memory_decision",
  };

  async function handleSave() {
    if (!content.trim()) return;
    setSaving(true);
    setErr(null);
    try {
      await apiPost(`/memory/${agentId}`, {
        type,
        content: content.trim(),
        importance,
        tags: tags
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        walletAddress,
      });
      onSaved();
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        <h2 className="mb-4 text-base font-semibold text-white">{t("memory_add_title")}</h2>

        {/* Type */}
        <div className="mb-4">
          <label className="mb-1.5 block text-xs text-slate-400">{t("memory_type")}</label>
          <div className="flex flex-wrap gap-2">
            {TYPES.map((tp) => (
              <button
                key={tp}
                onClick={() => setType(tp)}
                className={`rounded-xl px-3 py-1 text-xs font-medium border transition ${
                  type === tp
                    ? TYPE_COLOR[tp]
                    : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                }`}
              >
                {TYPE_ICON[tp]} {t(TYPE_LABEL_KEY[tp] as Parameters<typeof t>[0])}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="mb-4">
          <label className="mb-1.5 block text-xs text-slate-400">{t("memory_content")}</label>
          <textarea
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t("memory_content_ph")}
            className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30"
          />
        </div>

        {/* Importance */}
        <div className="mb-4">
          <label className="mb-1.5 block text-xs text-slate-400">{t("memory_importance")}</label>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setImportance(n)}
                className={`h-7 w-7 rounded-full text-xs font-semibold transition ${
                  importance === n
                    ? "bg-cyan-400 text-slate-950"
                    : "border border-white/10 bg-white/5 text-slate-500 hover:text-white"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="mb-5">
          <label className="mb-1.5 block text-xs text-slate-400">{t("memory_tags")}</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="tag1, tag2"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30"
          />
        </div>

        {err && (
          <p className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {err}
          </p>
        )}

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-400 hover:text-white transition"
          >
            {t("memory_cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !content.trim()}
            className="rounded-xl bg-cyan-400 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300 transition disabled:opacity-40"
          >
            {saving ? "..." : t("memory_save")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AgentMemoryPage() {
  const params = useParams();
  const agentId =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
      ? params.id[0]
      : "";

  const { address } = useAccount();
  const { memories, isLoading, error, refetch } = useMemory(agentId);
  const { t } = useLang();

  const [activeTab, setActiveTab] = useState<MemoryType>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const TABS: { key: MemoryType; labelKey: Parameters<typeof t>[0] }[] = [
    { key: "all", labelKey: "memory_all" },
    { key: "conversation", labelKey: "memory_conversation" },
    { key: "knowledge", labelKey: "memory_knowledge" },
    { key: "personality", labelKey: "memory_personality" },
    { key: "skill", labelKey: "memory_skill" },
    { key: "decision", labelKey: "memory_decision" },
  ];

  const filtered =
    activeTab === "all"
      ? memories
      : memories.filter((m) => m.type === activeTab);

  async function handleDelete(memory: MemoryItem) {
    if (!window.confirm(t("memory_delete_confirm"))) return;
    setDeletingId(memory.id);
    try {
      await apiDelete(`/memory/${agentId}/${memory.id}`);
      await refetch();
    } catch {
      // silently ignore — could add error toast later
    } finally {
      setDeletingId(null);
    }
  }

  function formatTime(ts: number) {
    return new Date(ts * 1000).toLocaleString();
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="badge">{t("memory_title")}</span>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300 transition active:scale-95"
        >
          + {t("memory_add")}
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="mb-5 flex flex-wrap gap-1.5">
        {TABS.map(({ key, labelKey }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition border ${
              activeTab === key
                ? "bg-cyan-400/15 text-cyan-300 border-cyan-400/30"
                : "border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
            }`}
          >
            {key !== "all" && TYPE_ICON[key] + " "}
            {t(labelKey)}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          ⚠ {error}
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <SkeletonCard key={n} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <span className="text-5xl">🧠</span>
          <p className="text-base font-medium text-white">{t("memory_empty")}</p>
          <p className="text-sm text-slate-500">{t("memory_empty_desc")}</p>
        </div>
      )}

      {/* Memory List */}
      {!isLoading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((memory) => {
            const memType = memory.type ?? "conversation";
            const icon = TYPE_ICON[memType] ?? "📄";
            const colorClass = TYPE_COLOR[memType] ?? "bg-slate-500/20 text-slate-300 border-slate-500/30";
            const preview =
              memory.content.length > 120
                ? memory.content.slice(0, 120) + "…"
                : memory.content;

            return (
              <div
                key={memory.id}
                className="group relative rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-white/20 hover:bg-white/[0.07]"
              >
                {/* Delete button */}
                <button
                  onClick={() => handleDelete(memory)}
                  disabled={deletingId === memory.id}
                  className="absolute right-4 top-4 hidden rounded-lg p-1.5 text-slate-600 transition hover:bg-red-500/15 hover:text-red-400 group-hover:flex disabled:opacity-40"
                  aria-label="delete"
                >
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
                  {/* Icon */}
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-base ${colorClass}`}>
                    {icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Type badge */}
                    <span className={`inline-block rounded-lg border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${colorClass}`}>
                      {memType}
                    </span>

                    {/* Content */}
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-200">{preview}</p>

                    {/* Footer */}
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <span className="text-[11px] text-slate-600">{formatTime(memory.timestamp)}</span>
                      <ImportanceDots value={memory.importance} />
                      {memory.tags && memory.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {memory.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-500"
                            >
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

      {/* Add Memory Modal */}
      {showAddModal && (
        <AddMemoryModal
          agentId={agentId}
          walletAddress={address ?? ""}
          onClose={() => setShowAddModal(false)}
          onSaved={refetch}
        />
      )}
    </main>
  );
}
