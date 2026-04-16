"use client";

import { useState } from "react";
import {
  useSkills,
  type SkillItem,
  type SkillData,
} from "../hooks/useSkills";
import {
  apiPost,
  apiPut,
  apiDelete,
  setApiWalletAddress,
  MEMORY_TIMEOUT,
} from "../lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

type Language = "typescript" | "python" | "javascript" | "text";

const LANGUAGE_BADGE: Record<Language, string> = {
  typescript:
    "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30",
  python:
    "bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-300 dark:border-yellow-500/30",
  javascript:
    "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:border-orange-500/30",
  text: "bg-gray-50 text-gray-500 border-gray-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/10",
};

function langBadgeClass(lang: string): string {
  return (
    LANGUAGE_BADGE[lang as Language] ??
    "bg-gray-50 text-gray-500 border-gray-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/10"
  );
}

const LANGUAGE_OPTIONS: Language[] = [
  "typescript",
  "python",
  "javascript",
  "text",
];

// ─── Shared form field styles ─────────────────────────────────────────────────

const INPUT_CLASS =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder-slate-600 dark:focus:border-indigo-400/50 dark:focus:ring-indigo-400/10";

const LABEL_CLASS =
  "mb-1.5 block text-xs font-medium text-gray-500 dark:text-slate-400";

// ─── InstallSkillModal ────────────────────────────────────────────────────────

interface InstallSkillModalProps {
  agentId: string;
  address: string;
  onClose: () => void;
  onSaved: () => void;
}

function InstallSkillModal({
  agentId,
  address,
  onClose,
  onSaved,
}: InstallSkillModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState<Language>("typescript");
  const [code, setCode] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSave() {
    if (!name.trim() || !description.trim()) return;
    setSaving(true);
    setErr(null);
    try {
      setApiWalletAddress(address);
      await apiPost(
        `/skills/${agentId}`,
        {
          walletAddress: address,
          skill: {
            name: name.trim(),
            description: description.trim(),
            language,
            code,
            enabled,
            version: "1.0.0",
            author: address,
          },
          tags: [],
        },
        MEMORY_TIMEOUT
      );
      onSaved();
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to save skill");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalWrapper onClose={onClose}>
      <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
        Install Skill
      </h2>

      <div className="mb-4">
        <label className={LABEL_CLASS}>Name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Web Search"
          className={INPUT_CLASS}
        />
      </div>

      <div className="mb-4">
        <label className={LABEL_CLASS}>Description *</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What does this skill do?"
          className={INPUT_CLASS}
        />
      </div>

      <div className="mb-4">
        <label className={LABEL_CLASS}>Language</label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className={INPUT_CLASS}
        >
          {LANGUAGE_OPTIONS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className={LABEL_CLASS}>Code</label>
        <textarea
          rows={6}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="// Skill implementation..."
          className={`${INPUT_CLASS} resize-y font-mono text-xs`}
        />
      </div>

      <div className="mb-5 flex items-center gap-2">
        <input
          type="checkbox"
          id="install-enabled"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-indigo-500 focus:ring-indigo-400 dark:border-white/20 dark:bg-white/5"
        />
        <label
          htmlFor="install-enabled"
          className="text-sm text-gray-700 dark:text-slate-300"
        >
          Enabled
        </label>
      </div>

      <ErrorMessage message={err} />

      <ModalActions
        onClose={onClose}
        onSave={handleSave}
        saving={saving}
        disabled={!name.trim() || !description.trim()}
      />
    </ModalWrapper>
  );
}

// ─── EditSkillModal ───────────────────────────────────────────────────────────

interface EditSkillModalProps {
  agentId: string;
  address: string;
  item: SkillItem;
  onClose: () => void;
  onSaved: () => void;
}

function EditSkillModal({
  agentId,
  address,
  item,
  onClose,
  onSaved,
}: EditSkillModalProps) {
  const [name, setName] = useState(item.skill.name);
  const [description, setDescription] = useState(item.skill.description);
  const [language, setLanguage] = useState<Language>(
    (item.skill.language as Language) ?? "typescript"
  );
  const [code, setCode] = useState(item.skill.code ?? "");
  const [enabled, setEnabled] = useState(item.skill.enabled);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSave() {
    if (!name.trim() || !description.trim()) return;
    setSaving(true);
    setErr(null);
    try {
      setApiWalletAddress(address);
      await apiPut(
        `/skills/${agentId}/${item.id}`,
        {
          walletAddress: address,
          skill: {
            ...item.skill,
            name: name.trim(),
            description: description.trim(),
            language,
            code,
            enabled,
          },
          tags: item.tags,
        },
        MEMORY_TIMEOUT
      );
      onSaved();
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to update skill");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalWrapper onClose={onClose}>
      <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
        Edit Skill
      </h2>

      <div className="mb-4">
        <label className={LABEL_CLASS}>Name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={INPUT_CLASS}
        />
      </div>

      <div className="mb-4">
        <label className={LABEL_CLASS}>Description *</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={INPUT_CLASS}
        />
      </div>

      <div className="mb-4">
        <label className={LABEL_CLASS}>Language</label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className={INPUT_CLASS}
        >
          {LANGUAGE_OPTIONS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className={LABEL_CLASS}>Code</label>
        <textarea
          rows={6}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className={`${INPUT_CLASS} resize-y font-mono text-xs`}
        />
      </div>

      <div className="mb-5 flex items-center gap-2">
        <input
          type="checkbox"
          id="edit-enabled"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-indigo-500 focus:ring-indigo-400 dark:border-white/20 dark:bg-white/5"
        />
        <label
          htmlFor="edit-enabled"
          className="text-sm text-gray-700 dark:text-slate-300"
        >
          Enabled
        </label>
      </div>

      <ErrorMessage message={err} />

      <ModalActions
        onClose={onClose}
        onSave={handleSave}
        saving={saving}
        disabled={!name.trim() || !description.trim()}
      />
    </ModalWrapper>
  );
}

// ─── AIGenerateModal ──────────────────────────────────────────────────────────

interface AIGenerateModalProps {
  agentId: string;
  address: string;
  onClose: () => void;
  onSaved: () => void;
}

interface GenerateResult {
  skill?: SkillData;
  code?: string;
  name?: string;
  description?: string;
}

function AIGenerateModal({
  agentId,
  address,
  onClose,
  onSaved,
}: AIGenerateModalProps) {
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState<Language>("typescript");
  const [generating, setGenerating] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [generated, setGenerated] = useState<SkillData | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setGenerating(true);
    setErr(null);
    setGenerated(null);
    try {
      setApiWalletAddress(address);
      const result = await apiPost<GenerateResult>(
        `/skills/${agentId}/generate`,
        { walletAddress: address, prompt: prompt.trim(), language },
        MEMORY_TIMEOUT
      );
      // Normalise various response shapes
      const skillData: SkillData = result.skill ?? {
        name: result.name ?? "Generated Skill",
        description: result.description ?? prompt.trim(),
        language,
        code: result.code ?? "",
        enabled: true,
        version: "1.0.0",
        author: address,
      };
      setGenerated(skillData);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function handleInstall() {
    if (!generated) return;
    setInstalling(true);
    setErr(null);
    try {
      setApiWalletAddress(address);
      await apiPost(
        `/skills/${agentId}`,
        { walletAddress: address, skill: generated, tags: ["ai-generated"] },
        MEMORY_TIMEOUT
      );
      onSaved();
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to install skill");
    } finally {
      setInstalling(false);
    }
  }

  return (
    <ModalWrapper onClose={onClose}>
      <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
        ✨ AI Generate Skill
      </h2>

      <div className="mb-4">
        <label className={LABEL_CLASS}>Describe what skill you want...</label>
        <textarea
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. A skill that summarises web pages given a URL"
          disabled={generating}
          className={`${INPUT_CLASS} resize-none`}
        />
      </div>

      <div className="mb-4">
        <label className={LABEL_CLASS}>Language</label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          disabled={generating}
          className={INPUT_CLASS}
        >
          {LANGUAGE_OPTIONS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      {!generated && (
        <div className="flex justify-end gap-2 mb-2">
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-500 transition hover:border-gray-300 hover:text-gray-700 dark:border-white/10 dark:text-slate-400 dark:hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
            className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {generating ? "Generating..." : "Generate ✨"}
          </button>
        </div>
      )}

      {generated && (
        <div className="mb-4">
          <p className="mb-1.5 text-xs font-medium text-gray-500 dark:text-slate-400">
            Generated — <span className="text-gray-700 dark:text-white font-semibold">{generated.name}</span>
          </p>
          <p className="mb-2 text-xs text-gray-500 dark:text-slate-400">
            {generated.description}
          </p>
          <pre className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 overflow-auto max-h-48 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 font-mono whitespace-pre-wrap break-all">
            {generated.code || "(no code generated)"}
          </pre>
        </div>
      )}

      <ErrorMessage message={err} />

      {generated && (
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-500 transition hover:border-gray-300 hover:text-gray-700 dark:border-white/10 dark:text-slate-400 dark:hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
          >
            Regenerate ✨
          </button>
          <button
            onClick={handleInstall}
            disabled={installing}
            className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {installing ? "Installing..." : "Install"}
          </button>
        </div>
      )}
    </ModalWrapper>
  );
}

// ─── Shared modal primitives ──────────────────────────────────────────────────

function ModalWrapper({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-lg card p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
      {/* Click outside to close */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
}

function ErrorMessage({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
      {message}
    </p>
  );
}

function ModalActions({
  onClose,
  onSave,
  saving,
  disabled,
}: {
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
  disabled: boolean;
}) {
  return (
    <div className="flex gap-2 justify-end">
      <button
        onClick={onClose}
        className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-500 transition hover:border-gray-300 hover:text-gray-700 dark:border-white/10 dark:text-slate-400 dark:hover:text-white"
      >
        Cancel
      </button>
      <button
        onClick={onSave}
        disabled={saving || disabled}
        className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}

// ─── SkillCard ────────────────────────────────────────────────────────────────

interface SkillCardProps {
  item: SkillItem;
  agentId: string;
  address: string;
  onEdit: (item: SkillItem) => void;
  onDeleted: () => void;
  onToggled: () => void;
}

function SkillCard({
  item,
  agentId,
  address,
  onEdit,
  onDeleted,
  onToggled,
}: SkillCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  const { skill, tags, timestamp } = item;
  const badgeClass = langBadgeClass(skill.language);

  function formatDate(ts: number) {
    return new Date(ts).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  async function handleDelete() {
    if (!window.confirm(`Delete skill "${skill.name}"?`)) return;
    setDeleting(true);
    try {
      setApiWalletAddress(address);
      await apiDelete(
        `/skills/${agentId}/${item.id}`,
        { walletAddress: address },
        MEMORY_TIMEOUT
      );
      onDeleted();
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  }

  async function handleToggle() {
    setToggling(true);
    try {
      setApiWalletAddress(address);
      await apiPut(
        `/skills/${agentId}/${item.id}`,
        {
          walletAddress: address,
          skill: { ...skill, enabled: !skill.enabled },
          tags,
        },
        MEMORY_TIMEOUT
      );
      onToggled();
    } catch {
      // ignore
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="card group p-5 hover:shadow-md transition-shadow">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-base bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30">
            ⚡
          </div>
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
            {skill.name}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-lg border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badgeClass}`}
        >
          {skill.language}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed mb-3 pl-11">
        {skill.description}
      </p>

      {/* Meta row */}
      <div className="pl-11 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-400 dark:text-slate-500">
          {skill.author && (
            <span className="truncate max-w-[120px]">
              by {skill.author.length > 10 ? `${skill.author.slice(0, 6)}…${skill.author.slice(-4)}` : skill.author}
            </span>
          )}
          <span>·</span>
          <span>v{skill.version ?? "1.0.0"}</span>
          <span>·</span>
          <span>{formatDate(timestamp)}</span>
          {tags && tags.length > 0 && (
            <>
              <span>·</span>
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-gray-100 bg-gray-50 px-1.5 py-0.5 dark:border-white/[0.06] dark:bg-white/[0.03]"
                >
                  #{tag}
                </span>
              ))}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Toggle */}
          <button
            onClick={handleToggle}
            disabled={toggling}
            title={skill.enabled ? "Disable" : "Enable"}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
              skill.enabled
                ? "bg-amber-400 dark:bg-amber-500"
                : "bg-gray-200 dark:bg-white/20"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
                skill.enabled ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>

          {/* Edit */}
          <button
            onClick={() => onEdit(item)}
            className="rounded-lg px-2.5 py-1 text-xs font-medium border border-gray-200 text-gray-500 transition hover:bg-gray-50 hover:text-gray-700 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
          >
            Edit
          </button>

          {/* Delete */}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg px-2.5 py-1 text-xs font-medium border border-gray-200 text-gray-500 transition hover:bg-red-50 hover:border-red-200 hover:text-red-500 dark:border-white/10 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-400 disabled:opacity-40"
          >
            {deleting ? "..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SkillsTab ────────────────────────────────────────────────────────────────

interface SkillsTabProps {
  agentId: string;
  address: string;
  isEn: boolean;
}

type ModalState =
  | { kind: "none" }
  | { kind: "install" }
  | { kind: "generate" }
  | { kind: "edit"; item: SkillItem };

export function SkillsTab({ agentId, address, isEn }: SkillsTabProps) {
  const { skills, isLoading, error, refetch } = useSkills(agentId, address);
  const [modal, setModal] = useState<ModalState>({ kind: "none" });

  const _ = isEn; // reserved for future i18n use

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-5 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-gray-400 dark:text-slate-500">
          {skills.length} skill{skills.length !== 1 ? "s" : ""} installed
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setModal({ kind: "generate" })}
            className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-600 transition hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20"
          >
            ✨ AI Generate
          </button>
          <button
            onClick={() => setModal({ kind: "install" })}
            className="btn-primary"
          >
            + Install Skill
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          ⚠ {error}
        </div>
      )}

      {/* Loading skeletons */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="card animate-pulse p-5">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-gray-100 dark:bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 rounded bg-gray-100 dark:bg-white/10" />
                  <div className="h-4 w-full rounded bg-gray-100 dark:bg-white/10" />
                  <div className="h-3 w-1/3 rounded bg-gray-50 dark:bg-white/5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && skills.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <span className="text-5xl">⚡</span>
          <p className="text-base font-medium text-gray-900 dark:text-white">
            No skills installed yet
          </p>
          <p className="text-sm text-gray-400 dark:text-slate-500">
            Install a skill or generate one with AI to extend this agent's capabilities.
          </p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setModal({ kind: "generate" })}
              className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-600 transition hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20"
            >
              ✨ AI Generate
            </button>
            <button
              onClick={() => setModal({ kind: "install" })}
              className="btn-primary"
            >
              + Install Skill
            </button>
          </div>
        </div>
      )}

      {/* Skill list */}
      {!isLoading && skills.length > 0 && (
        <div className="space-y-3">
          {skills.map((item) => (
            <SkillCard
              key={item.id}
              item={item}
              agentId={agentId}
              address={address}
              onEdit={(it) => setModal({ kind: "edit", item: it })}
              onDeleted={refetch}
              onToggled={refetch}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {modal.kind === "install" && (
        <InstallSkillModal
          agentId={agentId}
          address={address}
          onClose={() => setModal({ kind: "none" })}
          onSaved={refetch}
        />
      )}

      {modal.kind === "generate" && (
        <AIGenerateModal
          agentId={agentId}
          address={address}
          onClose={() => setModal({ kind: "none" })}
          onSaved={refetch}
        />
      )}

      {modal.kind === "edit" && (
        <EditSkillModal
          agentId={agentId}
          address={address}
          item={modal.item}
          onClose={() => setModal({ kind: "none" })}
          onSaved={refetch}
        />
      )}
    </div>
  );
}
