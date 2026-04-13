"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { SoulTimeline } from "../../../../components/SoulTimeline";
import type { AgentExperience } from "../../../../components/SoulTimeline";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

interface SoulState {
  currentHash: string;
  experienceCount: number;
  lastExperienceAt: number;
}

const EXPERIENCE_TYPES = [
  { key: "inference",   icon: "🔮", label: "Inference",   colorLight: "bg-cyan-50 text-cyan-700 border-cyan-200",       colorDark: "dark:bg-cyan-500/10 dark:text-cyan-300 dark:border-cyan-500/30" },
  { key: "bounty",      icon: "🏆", label: "Bounty",      colorLight: "bg-amber-50 text-amber-700 border-amber-200",     colorDark: "dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30" },
  { key: "interaction", icon: "🤝", label: "Interaction", colorLight: "bg-indigo-50 text-indigo-700 border-indigo-200",  colorDark: "dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/30" },
  { key: "knowledge",   icon: "📚", label: "Knowledge",   colorLight: "bg-emerald-50 text-emerald-700 border-emerald-200", colorDark: "dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30" },
  { key: "error",       icon: "⚠️", label: "Error",       colorLight: "bg-red-50 text-red-700 border-red-200",           colorDark: "dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30" },
  { key: "trade",       icon: "💱", label: "Trade",       colorLight: "bg-purple-50 text-purple-700 border-purple-200", colorDark: "dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-500/30" },
];

function SoulStateSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/8 dark:bg-slate-900 space-y-3">
        <div className="h-4 w-32 rounded bg-slate-100 dark:bg-white/10" />
        <div className="h-8 w-3/4 rounded bg-slate-100 dark:bg-white/10" />
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="h-16 rounded-xl bg-slate-50 dark:bg-white/5" />
          <div className="h-16 rounded-xl bg-slate-50 dark:bg-white/5" />
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
      className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-slate-500 transition hover:border-indigo-300 hover:text-indigo-600 dark:border-white/10 dark:text-slate-400 dark:hover:border-indigo-500/30 dark:hover:text-indigo-300"
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
        const res = await fetch(`${API_BASE}/soul/${agentId}`);
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
        const res = await fetch(`${API_BASE}/soul/${agentId}/history`);
        const json = await res.json();
        if (!cancelled) {
          const list = json.data ?? json.experiences ?? json ?? [];
          setExperiences(Array.isArray(list) ? list : []);
        }
      } catch { /* non-critical */ }
      finally { if (!cancelled) setExpLoading(false); }
    }

    loadSoul();
    loadExperiences();
    return () => { cancelled = true; };
  }, [agentId]);

  async function handleVerify() {
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await fetch(`${API_BASE}/soul/${agentId}/verify`);
      const json = await res.json();
      const valid = json.valid ?? json.data?.valid ?? json.success ?? false;
      setVerifyResult({ valid, message: json.message ?? json.data?.message });
    } catch (err) {
      setVerifyResult({ valid: false, message: err instanceof Error ? err.message : "Verification failed" });
    } finally {
      setVerifying(false);
    }
  }

  const typeCounts = experiences.reduce<Record<string, number>>((acc, exp) => {
    const k = (exp.type ?? "").toLowerCase();
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
  const totalExp = experiences.length || 1;

  return (
    <main className="mx-auto max-w-4xl px-6 py-8 space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 animate-slide-up">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-200/60 bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-600 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.6)]" />
            Living Soul
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Agent Soul 🧬
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            The immutable experiential record of Agent #{agentId}
          </p>
        </div>

        <button
          onClick={handleVerify}
          disabled={verifying || !soulState}
          className="shrink-0 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-100 disabled:opacity-50 flex items-center gap-2 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
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

      {/* ── Verify result ── */}
      {verifyResult && (
        <div className={`flex items-center gap-3 rounded-2xl border px-5 py-3 text-sm ${
          verifyResult.valid
            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
            : "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
        }`}>
          <span className="text-lg">{verifyResult.valid ? "✅" : "❌"}</span>
          <div>
            <p className="font-semibold">
              {verifyResult.valid ? "Soul Integrity Verified" : "Integrity Check Failed"}
            </p>
            {verifyResult.message && (
              <p className="text-xs opacity-70 mt-0.5">{verifyResult.message}</p>
            )}
          </div>
          <button onClick={() => setVerifyResult(null)} className="ml-auto text-xs opacity-50 hover:opacity-100">✕</button>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
          ⚠ {error}
        </div>
      )}

      {/* ── Soul State Card ── */}
      {loading ? (
        <SoulStateSkeleton />
      ) : soulState ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/8 dark:bg-slate-900">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🔗</span>
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Current Soul State</h2>
            <span className="ml-auto rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
              On-Chain
            </span>
          </div>

          <div className="mb-4">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Soul Hash</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 font-mono text-xs text-indigo-600 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 truncate dark:bg-slate-800/50 dark:border-white/5 dark:text-indigo-300">
                {soulState.currentHash || "—"}
              </code>
              {soulState.currentHash && <CopyButton text={soulState.currentHash} />}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center dark:border-white/8 dark:bg-white/[0.03]">
              <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{soulState.experienceCount.toLocaleString()}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-wider">Experiences</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center dark:border-white/8 dark:bg-white/[0.03]">
              <p className="text-xl font-bold text-indigo-600 dark:text-indigo-300">{experiences.length.toLocaleString()}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-wider">Loaded</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-center col-span-2 sm:col-span-1 dark:border-white/8 dark:bg-white/[0.03]">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {soulState.lastExperienceAt
                  ? new Date(soulState.lastExperienceAt * 1000).toLocaleDateString()
                  : "—"}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-wider">Last Activity</p>
            </div>
          </div>
        </div>
      ) : (
        !error && (
          <div className="flex flex-col items-center gap-3 py-12 text-center rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-white/8 dark:bg-slate-900">
            <span className="text-4xl">🧬</span>
            <p className="text-sm text-slate-400">No soul state found for this agent.</p>
          </div>
        )
      )}

      {/* ── Experience Type Distribution ── */}
      {!expLoading && experiences.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-slate-900">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">Experience Distribution</h2>
          <div className="flex flex-wrap gap-2">
            {EXPERIENCE_TYPES.map(({ key, icon, label, colorLight, colorDark }) => {
              const count = typeCounts[key] ?? 0;
              const pct = Math.round((count / totalExp) * 100);
              if (count === 0) return null;
              return (
                <div key={key} className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${colorLight} ${colorDark}`}>
                  <span>{icon}</span>
                  <span>{label}</span>
                  <span className="font-bold">{count}</span>
                  <span className="opacity-60">({pct}%)</span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 space-y-2">
            {EXPERIENCE_TYPES.map(({ key, icon, label }) => {
              const count = typeCounts[key] ?? 0;
              if (count === 0) return null;
              const pct = (count / Math.max(...Object.values(typeCounts))) * 100;
              return (
                <div key={key} className="flex items-center gap-2">
                  <span className="w-5 text-center text-sm">{icon}</span>
                  <span className="w-20 text-[10px] text-slate-400 dark:text-slate-500">{label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 w-5 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Soul Growth Curve ── */}
      {!expLoading && experiences.length > 1 && (() => {
        // Build cumulative experience count over time for the growth chart
        const sorted = [...experiences].sort((a, b) => a.timestamp - b.timestamp);
        const points = sorted.map((_, i) => ({ t: sorted[i].timestamp, count: i + 1 }));

        // Normalize to SVG coordinates
        const svgW = 600, svgH = 180, padX = 40, padY = 20;
        const tMin = points[0].t;
        const tMax = points[points.length - 1].t;
        const tRange = Math.max(tMax - tMin, 1);
        const maxCount = points[points.length - 1].count;

        const toX = (t: number) => padX + ((t - tMin) / tRange) * (svgW - padX * 2);
        const toY = (c: number) => svgH - padY - ((c / maxCount) * (svgH - padY * 2));

        const pathD = points.map((p, i) =>
          `${i === 0 ? "M" : "L"} ${toX(p.t).toFixed(1)} ${toY(p.count).toFixed(1)}`
        ).join(" ");

        const areaD = pathD + ` L ${toX(tMax).toFixed(1)} ${(svgH - padY).toFixed(1)} L ${toX(tMin).toFixed(1)} ${(svgH - padY).toFixed(1)} Z`;

        // X-axis labels (first, middle, last)
        const fmtDate = (ts: number) => new Date(ts * 1000).toLocaleDateString(undefined, { month: "short", day: "numeric" });
        const xLabels = [
          { x: toX(tMin), label: fmtDate(tMin) },
          ...(points.length > 2 ? [{ x: toX(points[Math.floor(points.length / 2)].t), label: fmtDate(points[Math.floor(points.length / 2)].t) }] : []),
          { x: toX(tMax), label: fmtDate(tMax) },
        ];

        return (
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-slate-900">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">📈</span>
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Soul Growth Curve</h2>
              <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">{maxCount} total experiences</span>
            </div>
            <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(99,102,241)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="rgb(99,102,241)" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              {/* Grid lines */}
              {[0.25, 0.5, 0.75, 1].map((frac) => (
                <g key={frac}>
                  <line x1={padX} y1={toY(maxCount * frac)} x2={svgW - padX} y2={toY(maxCount * frac)}
                    stroke="currentColor" className="text-gray-100 dark:text-white/5" strokeWidth="0.5" />
                  <text x={padX - 6} y={toY(maxCount * frac) + 3} textAnchor="end"
                    className="fill-slate-300 dark:fill-white/20" fontSize="8">{Math.round(maxCount * frac)}</text>
                </g>
              ))}
              {/* X-axis */}
              <line x1={padX} y1={svgH - padY} x2={svgW - padX} y2={svgH - padY}
                stroke="currentColor" className="text-gray-200 dark:text-white/10" strokeWidth="0.5" />
              {xLabels.map((l, i) => (
                <text key={i} x={l.x} y={svgH - 4} textAnchor="middle"
                  className="fill-slate-300 dark:fill-white/20" fontSize="8">{l.label}</text>
              ))}
              {/* Area fill */}
              <path d={areaD} fill="url(#growthGrad)" />
              {/* Line */}
              <path d={pathD} fill="none" stroke="rgb(99,102,241)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              {/* Data points */}
              {points.map((p, i) => (
                <circle key={i} cx={toX(p.t)} cy={toY(p.count)} r={points.length > 30 ? 1.5 : 3}
                  fill="rgb(99,102,241)" stroke="white" strokeWidth="1" className="dark:stroke-slate-900" />
              ))}
            </svg>
          </div>
        );
      })()}

      {/* ── Experience Timeline ── */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-slate-900">
        <div className="flex items-center gap-2 mb-5">
          <span className="text-lg">📜</span>
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Experience Timeline</h2>
          {!expLoading && experiences.length > 0 && (
            <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">{experiences.length} records</span>
          )}
        </div>
        <SoulTimeline experiences={experiences} loading={expLoading} />
      </div>

      {/* ── Privacy Disclaimer ── */}
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5 flex gap-3 dark:border-indigo-500/20 dark:bg-indigo-500/5">
        <span className="shrink-0 text-xl mt-0.5">🔐</span>
        <div>
          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-300 mb-1">Privacy Protected</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Your experiences are encrypted and stored on{" "}
            <span className="text-indigo-600 dark:text-indigo-300 font-medium">0G Storage</span>. Only the hash is
            recorded on-chain. Even SealMind cannot see the original data. Integrity can be
            verified by anyone at any time without revealing the contents.
          </p>
        </div>
      </div>
    </main>
  );
}
