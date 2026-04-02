"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { SoulTimeline } from "../../../../components/SoulTimeline";
import type { AgentExperience } from "../../../../components/SoulTimeline";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface SoulState {
  currentHash: string;
  experienceCount: number;
  lastExperienceAt: number;
}

function truncate(hash: string, front = 8, back = 6): string {
  if (!hash) return "";
  if (hash.length <= front + back + 2) return hash;
  return `${hash.slice(0, front)}...${hash.slice(-back)}`;
}

const EXPERIENCE_TYPES = [
  { key: "inference",   icon: "🔮", label: "Inference",   color: "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" },
  { key: "bounty",      icon: "🏆", label: "Bounty",      color: "bg-amber-500/20 text-amber-300 border border-amber-500/30" },
  { key: "interaction", icon: "🤝", label: "Interaction", color: "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" },
  { key: "knowledge",   icon: "📚", label: "Knowledge",   color: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" },
  { key: "error",       icon: "⚠️", label: "Error",       color: "bg-red-500/20 text-red-300 border border-red-500/30" },
  { key: "trade",       icon: "💱", label: "Trade",       color: "bg-purple-500/20 text-purple-300 border border-purple-500/30" },
];

function SoulStateSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-3">
        <div className="h-4 w-32 rounded bg-white/10" />
        <div className="h-8 w-3/4 rounded bg-white/10" />
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="h-16 rounded-xl bg-white/5" />
          <div className="h-16 rounded-xl bg-white/5" />
        </div>
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={handleCopy}
      className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-slate-400 transition hover:border-cyan-500/30 hover:text-cyan-300"
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

export default function AgentSoulPage() {
  const params = useParams();
  const agentId =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
      ? params.id[0]
      : "";

  const [soulState, setSoulState] = useState<SoulState | null>(null);
  const [experiences, setExperiences] = useState<AgentExperience[]>([]);
  const [loading, setLoading] = useState(true);
  const [expLoading, setExpLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ valid: boolean; message?: string } | null>(null);

  useEffect(() => {
    if (!agentId) return;
    let cancelled = false;

    async function loadSoul() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/soul/${agentId}`);
        const json = await res.json();
        if (!cancelled) {
          if (json.success && json.data) setSoulState(json.data);
          else if (json.currentHash !== undefined) setSoulState(json as SoulState);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load soul state");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    async function loadExperiences() {
      setExpLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/soul/${agentId}/history`);
        const json = await res.json();
        if (!cancelled) {
          const list = json.data ?? json.experiences ?? json ?? [];
          setExperiences(Array.isArray(list) ? list : []);
        }
      } catch {
        // non-critical
      } finally {
        if (!cancelled) setExpLoading(false);
      }
    }

    loadSoul();
    loadExperiences();
    return () => { cancelled = true; };
  }, [agentId]);

  async function handleVerify() {
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/soul/${agentId}/verify`);
      const json = await res.json();
      const valid = json.valid ?? json.data?.valid ?? json.success ?? false;
      setVerifyResult({ valid, message: json.message ?? json.data?.message });
    } catch (err) {
      setVerifyResult({ valid: false, message: err instanceof Error ? err.message : "Verification failed" });
    } finally {
      setVerifying(false);
    }
  }

  // Compute type distribution from experiences
  const typeCounts = experiences.reduce<Record<string, number>>((acc, exp) => {
    const k = (exp.type ?? "").toLowerCase();
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
  const totalExp = experiences.length || 1;

  return (
    <main className="mx-auto max-w-4xl px-6 py-8 space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold text-cyan-400">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.7)]" />
            Living Soul
          </div>
          <h1 className="text-2xl font-bold text-white">
            Agent Soul{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              🧬
            </span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            The immutable experiential record of Agent #{agentId}
          </p>
        </div>

        <button
          onClick={handleVerify}
          disabled={verifying || !soulState}
          className="shrink-0 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/20 disabled:opacity-50 flex items-center gap-2"
        >
          {verifying ? (
            <>
              <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Verifying…
            </>
          ) : "🔍 Verify Integrity"}
        </button>
      </div>

      {/* ── Verify result banner ── */}
      {verifyResult && (
        <div
          className={`flex items-center gap-3 rounded-2xl border px-5 py-3 text-sm ${
            verifyResult.valid
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/20 bg-red-500/10 text-red-300"
          }`}
        >
          <span className="text-lg">{verifyResult.valid ? "✅" : "❌"}</span>
          <div>
            <p className="font-semibold">
              {verifyResult.valid ? "Soul Integrity Verified" : "Integrity Check Failed"}
            </p>
            {verifyResult.message && (
              <p className="text-xs opacity-80 mt-0.5">{verifyResult.message}</p>
            )}
          </div>
          <button
            onClick={() => setVerifyResult(null)}
            className="ml-auto text-xs opacity-60 hover:opacity-100"
          >✕</button>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          ⚠ {error}
        </div>
      )}

      {/* ── Soul State Card ── */}
      {loading ? (
        <SoulStateSkeleton />
      ) : soulState ? (
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-500/5 to-indigo-500/5 p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🔗</span>
            <h2 className="text-sm font-semibold text-white">Current Soul State</h2>
            <span className="ml-auto rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
              On-Chain
            </span>
          </div>

          <div className="mb-4">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Soul Hash</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 font-mono text-xs text-cyan-300 bg-slate-900/50 rounded-lg px-3 py-2 border border-white/5 truncate">
                {soulState.currentHash || "—"}
              </code>
              {soulState.currentHash && <CopyButton text={soulState.currentHash} />}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-center">
              <p className="text-xl font-bold text-white">{soulState.experienceCount.toLocaleString()}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider">Experiences</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-center">
              <p className="text-xl font-bold text-cyan-300">{experiences.length.toLocaleString()}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider">Loaded</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-center col-span-2 sm:col-span-1">
              <p className="text-sm font-bold text-indigo-300">
                {soulState.lastExperienceAt
                  ? new Date(soulState.lastExperienceAt * 1000).toLocaleDateString()
                  : "—"}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider">Last Activity</p>
            </div>
          </div>
        </div>
      ) : (
        !error && (
          <div className="flex flex-col items-center gap-3 py-12 text-center rounded-2xl border border-white/10 bg-white/[0.02]">
            <span className="text-4xl">🧬</span>
            <p className="text-sm text-slate-400">No soul state found for this agent.</p>
          </div>
        )
      )}

      {/* ── Experience Type Distribution ── */}
      {!expLoading && experiences.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Experience Distribution</h2>
          <div className="flex flex-wrap gap-2">
            {EXPERIENCE_TYPES.map(({ key, icon, label, color }) => {
              const count = typeCounts[key] ?? 0;
              const pct = Math.round((count / totalExp) * 100);
              if (count === 0) return null;
              return (
                <div
                  key={key}
                  className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${color}`}
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                  <span className="font-bold">{count}</span>
                  <span className="opacity-60">({pct}%)</span>
                </div>
              );
            })}
          </div>

          {/* Mini bar chart */}
          <div className="mt-4 space-y-2">
            {EXPERIENCE_TYPES.map(({ key, icon, label }) => {
              const count = typeCounts[key] ?? 0;
              if (count === 0) return null;
              const pct = (count / Math.max(...Object.values(typeCounts))) * 100;
              return (
                <div key={key} className="flex items-center gap-2">
                  <span className="w-5 text-center text-sm">{icon}</span>
                  <span className="w-20 text-[10px] text-slate-400">{label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 w-5 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Experience Timeline ── */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-center gap-2 mb-5">
          <span className="text-lg">📜</span>
          <h2 className="text-sm font-semibold text-white">Experience Timeline</h2>
          {!expLoading && experiences.length > 0 && (
            <span className="ml-auto text-xs text-slate-500">{experiences.length} records</span>
          )}
        </div>
        <SoulTimeline experiences={experiences} loading={expLoading} />
      </div>

      {/* ── Privacy Disclaimer ── */}
      <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5 flex gap-3">
        <span className="shrink-0 text-xl mt-0.5">🔐</span>
        <div>
          <p className="text-xs font-semibold text-indigo-300 mb-1">Privacy Protected</p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your experiences are encrypted and stored on{" "}
            <span className="text-indigo-300 font-medium">0G Storage</span>. Only the hash is
            recorded on-chain. Even SealMind cannot see the original data. Integrity can be
            verified by anyone at any time without revealing the contents.
          </p>
        </div>
      </div>
    </main>
  );
}
