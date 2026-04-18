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
  apiGet,
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

// ─── ClawHubModal ─────────────────────────────────────────────────────────────

interface NpmPackage {
  name: string;
  version: string;
  description: string;
  keywords: string[];
  downloads?: number;
  links?: { npm?: string; repository?: string };
  author?: { name?: string; username?: string };
  date?: string;
}

interface NpmPackageDetail {
  name: string;
  version: string;
  description: string;
  keywords: string[];
  readme: string;
  tarball: string;
  repository?: string;
  author?: string;
}

interface ClawHubModalProps {
  agentId: string;
  address: string;
  onClose: () => void;
  onSaved: () => void;
}

function ClawHubModal({ agentId, address, onClose, onSaved }: ClawHubModalProps) {
  const [catalog, setCatalog] = useState<NpmPackage[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [installing, setInstalling] = useState<string | null>(null);
  const [installed, setInstalled] = useState<Set<string>>(new Set());
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [preview, setPreview] = useState<NpmPackageDetail | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  async function loadCatalog(q = "") {
    setLoading(true);
    setErr(null);
    try {
      setApiWalletAddress(address);
      const res = await apiGet<{ data: NpmPackage[]; total: number }>(
        "/skills/clawhub/catalog",
        q ? { q } : undefined,
        15_000
      );
      // apiGet auto-unwraps {success,data} — res IS the unwrapped payload
      const pkgs = Array.isArray(res) ? res : (res as { data?: NpmPackage[] }).data ?? [];
      setCatalog(pkgs);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load catalog");
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }

  // Load on first open
  if (catalog === null && !loading && !err) {
    loadCatalog();
  }

  async function handleSearch() {
    setSearching(true);
    setCatalog(null);
    await loadCatalog(search.trim());
  }

  async function handlePreview(pkg: NpmPackage) {
    setPreview(null);
    setLoadingPreview(true);
    try {
      setApiWalletAddress(address);
      const res = await apiGet<{ data: NpmPackageDetail }>(
        `/skills/clawhub/package/${pkg.name}`,
        undefined,
        12_000
      );
      const detail = (res as { data?: NpmPackageDetail }).data ?? res as unknown as NpmPackageDetail;
      setPreview(detail);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load package details");
    } finally {
      setLoadingPreview(false);
    }
  }

  async function handleInstall(pkg: NpmPackage | NpmPackageDetail) {
    setInstalling(pkg.name);
    setErr(null);
    try {
      setApiWalletAddress(address);

      // Build description from readme or description
      const desc = pkg.description || pkg.name;
      const readmeSnippet = "readme" in pkg && pkg.readme
        ? pkg.readme.replace(/#+\s*/g, "").replace(/\n+/g, " ").trim().slice(0, 200)
        : "";

      // Detect language from keywords
      const kw = (pkg.keywords ?? []).map((k) => k.toLowerCase());
      const language =
        kw.includes("python") ? "python" :
        kw.includes("javascript") ? "javascript" :
        kw.includes("typescript") ? "typescript" :
        "typescript";

      // Code = install instruction + readme snippet as documentation
      const npmUrl = `https://www.npmjs.com/package/${pkg.name}`;
      const code = [
        `// ClawHub Skill: ${pkg.name} v${pkg.version}`,
        `// Install: npx clawhub@latest install ${pkg.name}`,
        `// npm: ${npmUrl}`,
        readmeSnippet ? `\n// Description:\n// ${readmeSnippet}` : "",
        `\n// TODO: Implement skill using the ${pkg.name} package`,
      ].filter(Boolean).join("\n");

      await apiPost(
        `/skills/${agentId}`,
        {
          walletAddress: address,
          skill: {
            name: pkg.name.replace(/^@[^/]+\//, ""), // strip scope for display
            description: desc,
            language,
            code,
            enabled: true,
            version: pkg.version || "1.0.0",
            author: typeof (pkg as NpmPackageDetail).author === "string"
              ? (pkg as NpmPackageDetail).author
              : pkg.name,
          },
          tags: [...(pkg.keywords ?? []).slice(0, 5), "clawhub", "npm"],
        },
        MEMORY_TIMEOUT
      );
      setInstalled((prev) => new Set(prev).add(pkg.name));
      setPreview(null);
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Install failed");
    } finally {
      setInstalling(null);
    }
  }

  return (
    <ModalWrapper onClose={onClose}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🦞</span>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">ClawHub — Skill Marketplace</h2>
        <a href="https://clawhub.ai/skills" target="_blank" rel="noreferrer"
           className="ml-auto text-[10px] text-indigo-400 hover:text-indigo-600 underline">clawhub.ai ↗</a>
      </div>

      {/* Search */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search ClawHub skills..."
          className={`${INPUT_CLASS} flex-1`}
        />
        <button
          onClick={handleSearch}
          disabled={searching || loading}
          className="shrink-0 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-600 hover:bg-indigo-100 disabled:opacity-40 transition dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300"
        >
          {searching ? "..." : "Search"}
        </button>
      </div>

      {/* Package detail preview */}
      {preview && (
        <div className="mb-4 rounded-xl border border-indigo-100 dark:border-indigo-500/20 bg-indigo-50/40 dark:bg-indigo-500/5 p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{preview.name}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">{preview.description}</p>
            </div>
            <button onClick={() => setPreview(null)} className="text-gray-400 hover:text-gray-600 shrink-0 text-xs">✕</button>
          </div>
          {preview.readme && (
            <pre className="mb-3 text-[10px] text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-white/5 rounded-lg p-2 max-h-28 overflow-y-auto whitespace-pre-wrap font-mono border border-gray-100 dark:border-white/10">
              {preview.readme.slice(0, 500)}
            </pre>
          )}
          <div className="flex gap-2 justify-end">
            {preview.repository && (
              <a href={preview.repository} target="_blank" rel="noreferrer"
                 className="rounded-xl border border-gray-200 dark:border-white/10 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 dark:text-slate-400 dark:hover:bg-white/5 transition flex items-center gap-1">
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                GitHub
              </a>
            )}
            <button
              onClick={() => handleInstall(preview)}
              disabled={installing === preview.name || installed.has(preview.name)}
              className="btn-primary disabled:opacity-40"
            >
              {installing === preview.name ? "Installing..." : installed.has(preview.name) ? "✓ Installed" : "Install"}
            </button>
          </div>
        </div>
      )}

      {loadingPreview && (
        <div className="mb-4 animate-pulse rounded-xl bg-gray-50 dark:bg-white/5 h-24 border border-gray-100 dark:border-white/10" />
      )}

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="animate-pulse rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-4 h-16" />
          ))}
        </div>
      )}

      {err && <ErrorMessage message={err} />}

      {!loading && catalog && catalog.length === 0 && (
        <p className="text-sm text-center text-gray-400 py-8">No skills found{search ? ` for "${search}"` : ""}</p>
      )}

      {!loading && catalog && catalog.length > 0 && (
        <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
          <p className="text-[10px] text-gray-400 dark:text-slate-500 mb-2">{catalog.length} packages · sorted by monthly downloads</p>
          {catalog.map((pkg) => {
            const isInstalled = installed.has(pkg.name);
            const isInstalling = installing === pkg.name;
            return (
              <div key={pkg.name} className="flex items-start gap-3 rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.03] px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white truncate font-mono">{pkg.name}</p>
                    <span className="text-[10px] text-gray-400 shrink-0">v{pkg.version}</span>
                    {pkg.downloads !== undefined && pkg.downloads > 0 && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 shrink-0 font-medium">
                        ↓ {pkg.downloads >= 1000 ? `${(pkg.downloads / 1000).toFixed(1)}k` : pkg.downloads}/mo
                      </span>
                    )}
                    {pkg.date && <span className="text-[10px] text-gray-300 dark:text-slate-600 shrink-0">{new Date(pkg.date).toLocaleDateString()}</span>}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2 mb-1">{pkg.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {(pkg.keywords ?? []).slice(0, 4).map((t) => (
                      <span key={t} className="rounded border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-white/[0.03] px-1.5 text-[10px] text-gray-400">#{t}</span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    onClick={() => handlePreview(pkg)}
                    className="rounded-xl border border-gray-200 dark:border-white/10 px-2.5 py-1 text-[10px] text-gray-500 hover:bg-gray-50 dark:text-slate-400 dark:hover:bg-white/5 transition"
                  >
                    Details
                  </button>
                  <button
                    onClick={() => !isInstalled && handleInstall(pkg)}
                    disabled={isInstalling || isInstalled}
                    className={`rounded-xl px-2.5 py-1 text-[10px] font-medium transition ${
                      isInstalled
                        ? "border border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300 cursor-default"
                        : "btn-primary disabled:opacity-40"
                    }`}
                  >
                    {isInstalling ? "..." : isInstalled ? "✓" : "Install"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-end mt-4">
        <button onClick={onClose} className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-500 transition hover:border-gray-300 hover:text-gray-700 dark:border-white/10 dark:text-slate-400 dark:hover:text-white">
          Close
        </button>
      </div>
    </ModalWrapper>
  );
}

// ─── GitHubImportModal ────────────────────────────────────────────────────────

interface GitHubImportModalProps {
  agentId: string;
  address: string;
  onClose: () => void;
  onSaved: () => void;
}

function GitHubImportModal({ agentId, address, onClose, onSaved }: GitHubImportModalProps) {
  const [url, setUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const isValid = url.trim().startsWith("https://github.com/") || url.trim().startsWith("https://raw.githubusercontent.com/");

  async function handleImport() {
    if (!isValid) return;
    setImporting(true);
    setErr(null);
    try {
      setApiWalletAddress(address);
      await apiPost(
        `/skills/${agentId}/import-github`,
        { walletAddress: address, url: url.trim() },
        MEMORY_TIMEOUT
      );
      onSaved();
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  return (
    <ModalWrapper onClose={onClose}>
      <div className="flex items-center gap-2 mb-4">
        <svg className="h-5 w-5 text-gray-700 dark:text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Import from GitHub</h2>
      </div>

      <div className="mb-3 rounded-xl border border-blue-100 dark:border-blue-500/20 bg-blue-50/60 dark:bg-blue-500/5 px-3 py-2 text-xs text-blue-700 dark:text-blue-300">
        Paste a GitHub file URL (e.g. <code className="font-mono">https://github.com/user/repo/blob/main/skill.ts</code>)
      </div>

      <div className="mb-4">
        <label className={LABEL_CLASS}>GitHub File URL *</label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/user/repo/blob/main/skill.ts"
          className={INPUT_CLASS}
        />
        {url && !isValid && (
          <p className="mt-1 text-xs text-red-500">Must be a github.com or raw.githubusercontent.com URL</p>
        )}
      </div>

      <ErrorMessage message={err} />

      <ModalActions
        onClose={onClose}
        onSave={handleImport}
        saving={importing}
        disabled={!isValid}
      />
    </ModalWrapper>
  );
}

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
  | { kind: "clawhub" }
  | { kind: "github" }
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
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setModal({ kind: "github" })}
            className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 hover:border-gray-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 flex items-center gap-1.5"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
            GitHub
          </button>
          <button
            onClick={() => setModal({ kind: "clawhub" })}
            className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-600 transition hover:bg-orange-100 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-300 dark:hover:bg-orange-500/20 flex items-center gap-1.5"
          >
            🦞 ClawHub
          </button>
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
            + Install
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
          <div className="flex gap-2 mt-2 flex-wrap justify-center">
            <button
              onClick={() => setModal({ kind: "github" })}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 flex items-center gap-1.5"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
              GitHub
            </button>
            <button
              onClick={() => setModal({ kind: "clawhub" })}
              className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-600 transition hover:bg-orange-100 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-300"
            >
              🦞 ClawHub
            </button>
            <button
              onClick={() => setModal({ kind: "generate" })}
              className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-600 transition hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
            >
              ✨ AI Generate
            </button>
            <button
              onClick={() => setModal({ kind: "install" })}
              className="btn-primary"
            >
              + Install
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
      {modal.kind === "clawhub" && (
        <ClawHubModal
          agentId={agentId}
          address={address}
          onClose={() => setModal({ kind: "none" })}
          onSaved={refetch}
        />
      )}

      {modal.kind === "github" && (
        <GitHubImportModal
          agentId={agentId}
          address={address}
          onClose={() => setModal({ kind: "none" })}
          onSaved={refetch}
        />
      )}

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
