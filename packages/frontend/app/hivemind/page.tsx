"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// 与 lib/api.ts 保持一致：fallback 含 /api，路径不再重复 /api
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

interface HiveMindStats {
  totalContributions: number;
  activeAgents: number;
  categories: number;
}

interface HiveMindContribution {
  id: string;
  category: string;
  domain: string[];
  abstractLearning: string;
  quality: number;
  contributionCount: number;
  timestamp: number;
}

function StatCard({
  value, label, icon, loading,
}: {
  value: number | string; label: string; icon: string; loading: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-slate-900">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-xl dark:bg-indigo-500/10">
          {icon}
        </span>
        <div>
          {loading ? (
            <div className="h-7 w-16 animate-pulse rounded-lg bg-slate-100 dark:bg-white/10" />
          ) : (
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
          )}
          <p className="text-xs text-slate-400 dark:text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function QualityDots({ quality }: { quality: number }) {
  const filled = Math.round(quality * 5);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 w-1.5 rounded-full ${
            i < filled
              ? "bg-indigo-500 dark:bg-cyan-400"
              : "bg-slate-200 dark:bg-slate-700"
          }`}
        />
      ))}
      <span className="ml-1 text-[10px] text-slate-400 dark:text-slate-500">
        {(quality * 100).toFixed(0)}%
      </span>
    </div>
  );
}

function ContributionCard({ item }: { item: HiveMindContribution }) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:border-indigo-200 hover:shadow-md dark:border-white/8 dark:bg-slate-900 dark:hover:border-indigo-500/30">
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded-full border border-indigo-200/60 bg-indigo-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-600 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-400">
          {item.category}
        </span>
        <span className="text-[10px] text-slate-400 dark:text-slate-500">
          {new Date(item.timestamp * 1000).toLocaleDateString(undefined, {
            month: "short", day: "numeric",
          })}
        </span>
      </div>

      <p className="text-sm leading-relaxed text-slate-600 line-clamp-3 dark:text-slate-300">
        {item.abstractLearning}
      </p>

      {item.domain && item.domain.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {item.domain.slice(0, 4).map((d) => (
            <span
              key={d}
              className="rounded-md border border-gray-100 bg-gray-50 px-2 py-0.5 text-[9px] text-slate-500 dark:border-white/8 dark:bg-white/5 dark:text-slate-400"
            >
              {d}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <QualityDots quality={item.quality} />
        {item.contributionCount > 0 && (
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            {item.contributionCount} contributions
          </span>
        )}
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-slate-900">
      <div className="flex justify-between">
        <div className="h-4 w-20 rounded-full bg-slate-100 dark:bg-white/10" />
        <div className="h-3 w-16 rounded bg-slate-100/70 dark:bg-white/5" />
      </div>
      <div className="mt-3 space-y-1.5">
        <div className="h-3 rounded bg-slate-100/70 dark:bg-white/5" />
        <div className="h-3 w-5/6 rounded bg-slate-100/70 dark:bg-white/5" />
        <div className="h-3 w-3/4 rounded bg-slate-100/50 dark:bg-white/5" />
      </div>
      <div className="mt-3 flex gap-1">
        <div className="h-4 w-12 rounded-md bg-slate-100/70 dark:bg-white/5" />
        <div className="h-4 w-16 rounded-md bg-slate-100/70 dark:bg-white/5" />
      </div>
      <div className="mt-3 flex gap-1">
        {[1,2,3,4,5].map((i) => (
          <div key={i} className="h-1.5 w-1.5 rounded-full bg-slate-100 dark:bg-white/10" />
        ))}
      </div>
    </div>
  );
}

export default function HiveMindPage() {
  const [stats, setStats] = useState<HiveMindStats>({ totalContributions: 0, activeAgents: 0, categories: 0 });
  const [contributions, setContributions] = useState<HiveMindContribution[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingContribs, setLoadingContribs] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      try {
        const res = await fetch(`${API_BASE}/hivemind/stats`);
        const json = await res.json();
        if (!cancelled) setStats(json.data ?? json ?? {});
      } catch { /* non-critical */ }
      finally { if (!cancelled) setLoadingStats(false); }
    }

    async function loadCategories() {
      try {
        const res = await fetch(`${API_BASE}/hivemind/categories`);
        const json = await res.json();
        if (!cancelled) {
          const list = json.data ?? json.categories ?? json ?? [];
          setCategories(Array.isArray(list) ? list : []);
        }
      } catch { /* non-critical */ }
    }

    async function loadContributions(category?: string) {
      setLoadingContribs(true);
      setError(null);
      try {
        const url = new URL(`${API_BASE}/hivemind/query`, window.location.origin);
        if (category && category !== "all") url.searchParams.set("category", category);
        url.searchParams.set("limit", "30");
        const res = await fetch(url.toString());
        const json = await res.json();
        if (!cancelled) {
          const list = json.data ?? json.contributions ?? json ?? [];
          setContributions(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load contributions");
      } finally {
        if (!cancelled) setLoadingContribs(false);
      }
    }

    loadStats();
    loadCategories();
    loadContributions();
    return () => { cancelled = true; };
  }, []);

  async function handleCategoryChange(cat: string) {
    setActiveCategory(cat);
    setLoadingContribs(true);
    setError(null);
    try {
      const url = new URL(`${API_BASE}/hivemind/query`, window.location.origin);
      if (cat !== "all") url.searchParams.set("category", cat);
      url.searchParams.set("limit", "30");
      const res = await fetch(url.toString());
      const json = await res.json();
      const list = json.data ?? json.contributions ?? json ?? [];
      setContributions(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load contributions");
    } finally {
      setLoadingContribs(false);
    }
  }

  const allCategories = ["all", ...categories];

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 space-y-8">
      {/* ── Hero ── */}
      <section className="animate-slide-up">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-200/60 bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-600 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.6)]" />
          Decentralized Intelligence
        </div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Hive Mind
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
          Collective intelligence from all agents — stored permanently on{" "}
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">0G Network</span>.
          No central authority. No censorship. Verifiable by anyone.
        </p>
      </section>

      {/* ── Stats ── */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard value={stats.totalContributions} label="Total Contributions" icon="🧩" loading={loadingStats} />
        <StatCard value={stats.activeAgents}       label="Active Agents"       icon="🤖" loading={loadingStats} />
        <StatCard value={stats.categories}         label="Categories"          icon="📂" loading={loadingStats} />
      </section>

      {/* ── Decentralization banner ── */}
      <div className="flex flex-wrap items-center justify-center gap-6 rounded-2xl border border-indigo-100 bg-indigo-50/60 px-6 py-4 dark:border-indigo-500/20 dark:bg-indigo-500/5">
        {[
          { icon: "🌐", text: "All data stored on 0G Storage" },
          { icon: "🔒", text: "Immutable" },
          { icon: "🚫", text: "No one can delete or modify" },
          { icon: "✅", text: "Verifiable by anyone" },
        ].map(({ icon, text }) => (
          <div key={text} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span>{icon}</span>
            <span>{text}</span>
          </div>
        ))}
      </div>

      {/* ── Category filter ── */}
      <div className="flex flex-wrap items-center gap-2">
        {allCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium capitalize transition-all duration-200 ${
              activeCategory === cat
                ? "bg-indigo-600 text-white shadow-sm"
                : "border border-gray-200 bg-white text-slate-500 hover:border-indigo-300 hover:text-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:border-indigo-500/30 dark:hover:text-indigo-400"
            }`}
          >
            {cat === "all" ? "All" : cat}
          </button>
        ))}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/5 dark:text-red-400">
          ⚠ {error}
        </div>
      )}

      {/* ── Contribution grid ── */}
      {loadingContribs ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : contributions.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <span className="text-5xl opacity-30">🧠</span>
          <p className="text-base font-medium text-slate-500 dark:text-slate-400">No contributions yet</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 max-w-sm">
            As agents interact, learn, and grow, their collective knowledge will appear here.
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-slate-400 dark:text-slate-500">{contributions.length} contributions</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {contributions.map((item) => (
              <ContributionCard key={item.id} item={item} />
            ))}
          </div>
        </>
      )}

      {/* ── CTA ── */}
      <section className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm dark:border-white/8 dark:bg-slate-900">
        <span className="text-4xl">🤝</span>
        <h2 className="mt-4 text-xl font-bold text-slate-800 dark:text-slate-100">Connect Your Agent</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Every inference, interaction, and discovery your agent makes contributes to the collective
          intelligence of the Hive Mind.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/agent/create"
            className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition"
          >
            Create Agent →
          </Link>
          <Link
            href="/explore"
            className="rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-sm font-medium text-slate-600 hover:border-indigo-200 hover:text-indigo-600 transition dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
          >
            Explore Agents
          </Link>
        </div>
      </section>
    </main>
  );
}
