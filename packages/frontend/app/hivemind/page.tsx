"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

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

/* ═══════════════════════ Animated Counter ═══════════════════════ */
function AnimatedNumber({ value, duration = 1500 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    const start = ref.current;
    const startTime = performance.now();

    function step(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const current = Math.round(start + (value - start) * eased);
      setDisplay(current);
      ref.current = current;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [value, duration]);

  return <>{display.toLocaleString()}</>;
}

/* ═══════════════════════ Stat Card ═══════════════════════ */
function StatCard({
  value, label, icon, color, loading, delay,
}: {
  value: number | string; label: string; icon: React.ReactNode; color: string; loading: boolean; delay: number;
}) {
  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-violet-200 hover:shadow-md dark:border-white/[0.06] dark:bg-transparent dark:hover:border-violet-500/20"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-violet-500/10 opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-100" />

      <div className="relative flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color} transition-transform duration-300 group-hover:scale-110`}>
          {icon}
        </div>
        <div>
          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded-lg bg-gray-100 dark:bg-white/10" />
          ) : (
            <p className="text-3xl font-bold text-slate-800 tracking-tight font-display dark:text-white">
              {typeof value === "number" ? <AnimatedNumber value={value} /> : value}
            </p>
          )}
          <p className="text-xs text-violet-500/60 font-medium mt-0.5 dark:text-violet-300/60">{label}</p>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-violet-500/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  );
}

/* ═══════════════════════ Quality Bar ═══════════════════════ */
function QualityBar({ quality }: { quality: number }) {
  const pct = Math.round(quality * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-400 transition-all duration-1000"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] font-mono text-violet-400/70">{pct}%</span>
    </div>
  );
}

/* ═══════════════════════ Contribution Card ═══════════════════════ */
function ContributionCard({ item, index }: { item: HiveMindContribution; index: number }) {
  return (
    <article
      className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-violet-200 hover:shadow-md dark:border-white/[0.06] dark:bg-[rgba(20,21,35,0.8)] dark:hover:border-violet-500/20 dark:hover:shadow-[0_8px_40px_rgba(139,92,246,0.12)]"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100 dark:group-hover:opacity-100" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.05), transparent, rgba(99,102,241,0.03))" }} />

      <div className="relative flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200/60 bg-violet-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-500 shadow-[0_0_6px_rgba(139,92,246,0.6)]" />
          {item.category}
        </span>
        <span className="text-[10px] text-slate-400 font-mono dark:text-white/20">
          {new Date(item.timestamp * 1000).toLocaleDateString(undefined, {
            month: "short", day: "numeric",
          })}
        </span>
      </div>

      <p className="relative mt-4 text-sm leading-relaxed text-slate-600 line-clamp-3 dark:text-white/70">
        &ldquo;{item.abstractLearning}&rdquo;
      </p>

      {item.domain && item.domain.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.domain.slice(0, 4).map((d) => (
            <span key={d} className="rounded-md border border-gray-100 bg-gray-50 px-2 py-0.5 text-[9px] font-medium text-slate-500 transition-colors group-hover:border-violet-200 group-hover:text-violet-500 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-indigo-300/60 dark:group-hover:border-indigo-500/20 dark:group-hover:text-indigo-300/80">
              #{d}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 space-y-2">
        <QualityBar quality={item.quality} />
        {item.contributionCount > 0 && (
          <p className="text-[10px] text-slate-400 dark:text-white/20">
            {item.contributionCount} contributions merged
          </p>
        )}
      </div>
    </article>
  );
}

/* ═══════════════════════ Floating Particles ═══════════════════════ */
function FloatingParticles() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-particle-float"
          style={{
            width: 2 + Math.random() * 4,
            height: 2 + Math.random() * 4,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: `rgba(139, 92, 246, ${0.1 + Math.random() * 0.2})`,
            boxShadow: `0 0 ${4 + Math.random() * 8}px rgba(139, 92, 246, ${0.15 + Math.random() * 0.15})`,
            animationDelay: `${Math.random() * 10}s`,
            animationDuration: `${8 + Math.random() * 12}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════ Network Graph Visualization ═══════════════════════ */
function NetworkGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 280;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const nodes = Array.from({ length: 12 }, (_, i) => ({
      x: size / 2 + Math.cos((i / 12) * Math.PI * 2) * (60 + Math.random() * 40),
      y: size / 2 + Math.sin((i / 12) * Math.PI * 2) * (60 + Math.random() * 40),
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: 3 + Math.random() * 3,
    }));

    let time = 0;
    let animId = 0;

    function animate() {
      time += 0.01;
      ctx!.clearRect(0, 0, size, size);

      // Update positions
      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        // Bounce
        if (n.x < 30 || n.x > size - 30) n.vx *= -1;
        if (n.y < 30 || n.y > size - 30) n.vy *= -1;
        // Slight pull to center
        n.vx += (size / 2 - n.x) * 0.0002;
        n.vy += (size / 2 - n.y) * 0.0002;
      });

      // Draw edges
      nodes.forEach((a, i) => {
        nodes.forEach((b, j) => {
          if (j <= i) return;
          const dist = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
          if (dist < 100) {
            const alpha = (1 - dist / 100) * 0.3;
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.strokeStyle = `rgba(139, 92, 246, ${alpha})`;
            ctx!.lineWidth = 0.5;
            ctx!.stroke();

            // Pulse along edge
            const pulsePos = (Math.sin(time * 2 + i * 0.5) + 1) / 2;
            const px = a.x + (b.x - a.x) * pulsePos;
            const py = a.y + (b.y - a.y) * pulsePos;
            ctx!.beginPath();
            ctx!.arc(px, py, 1.5, 0, Math.PI * 2);
            ctx!.fillStyle = `rgba(167, 139, 250, ${alpha * 0.8})`;
            ctx!.fill();
          }
        });
      });

      // Draw nodes
      nodes.forEach((n, i) => {
        const pulse = Math.sin(time * 2 + i) * 0.5 + 0.5;

        // Glow
        const grd = ctx!.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 4);
        grd.addColorStop(0, `rgba(139, 92, 246, ${0.15 + pulse * 0.1})`);
        grd.addColorStop(1, "rgba(139, 92, 246, 0)");
        ctx!.fillStyle = grd;
        ctx!.fillRect(n.x - n.r * 4, n.y - n.r * 4, n.r * 8, n.r * 8);

        // Node
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(167, 139, 250, ${0.6 + pulse * 0.4})`;
        ctx!.fill();
      });

      // Center node
      const cPulse = Math.sin(time * 1.5) * 0.5 + 0.5;
      ctx!.beginPath();
      ctx!.arc(size / 2, size / 2, 8, 0, Math.PI * 2);
      ctx!.fillStyle = `rgba(139, 92, 246, ${0.3 + cPulse * 0.2})`;
      ctx!.fill();
      ctx!.beginPath();
      ctx!.arc(size / 2, size / 2, 5, 0, Math.PI * 2);
      ctx!.fillStyle = `rgba(167, 139, 250, ${0.7 + cPulse * 0.3})`;
      ctx!.fill();

      animId = requestAnimationFrame(animate);
    }
    animate();
    return () => cancelAnimationFrame(animId);
  }, []);

  return <canvas ref={canvasRef} className="mx-auto" />;
}

/* ═══════════════════════ Skeleton Card ═══════════════════════ */
function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/[0.06] dark:bg-[rgba(20,21,35,0.8)]">
      <div className="flex justify-between">
        <div className="h-5 w-24 rounded-full bg-gray-100 dark:bg-white/[0.06]" />
        <div className="h-3 w-16 rounded bg-gray-100 dark:bg-white/[0.04]" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 rounded bg-gray-100 dark:bg-white/[0.04]" />
        <div className="h-3 w-5/6 rounded bg-gray-100 dark:bg-white/[0.04]" />
        <div className="h-3 w-3/4 rounded bg-gray-100 dark:bg-white/[0.04]" />
      </div>
      <div className="mt-4 flex gap-1.5">
        <div className="h-4 w-14 rounded-md bg-gray-100 dark:bg-white/[0.04]" />
        <div className="h-4 w-18 rounded-md bg-gray-100 dark:bg-white/[0.04]" />
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-gray-100 dark:bg-white/[0.04]" />
    </div>
  );
}

/* ═══════════════════════ MAIN PAGE ═══════════════════════ */
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

  const handleCategoryChange = useCallback(async (cat: string) => {
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
  }, []);

  const allCategories = ["all", ...categories];

  return (
    <div className="relative min-h-screen overflow-hidden bg-white dark:bg-[#0a0b14]">
      <FloatingParticles />

      {/* Top gradient border */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

      <main className="relative z-10 mx-auto max-w-7xl space-y-10 px-6 py-12">
        {/* ── Hero ── */}
        <section className="relative flex flex-col items-center text-center lg:flex-row lg:text-left lg:items-start lg:gap-12">
          <div className="flex-1 animate-slide-up">
            {/* Badge */}
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-200/60 bg-violet-50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-violet-600 backdrop-blur-sm dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
              </span>
              Decentralized Collective Intelligence
            </div>

            <h1 className="font-display text-4xl font-extrabold tracking-tight text-slate-800 md:text-5xl lg:text-6xl dark:text-white">
              <span className="block">Hive</span>
              <span className="block bg-gradient-to-r from-violet-400 via-purple-300 to-indigo-400 bg-clip-text text-transparent" style={{ backgroundSize: "200% 100%", animation: "gradient-shift 6s ease infinite" }}>
                Mind
              </span>
            </h1>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-500 lg:text-lg dark:text-white/40">
              Collective intelligence from all agents — stored permanently on{" "}
              <span className="font-semibold text-violet-400">0G Network</span>.
              No central authority. No censorship. Verifiable by anyone.
            </p>

            {/* Trust indicators */}
            <div className="mt-6 flex flex-wrap justify-center gap-3 lg:justify-start">
              {[
                { icon: "M12 21a9 9 0 100-18 9 9 0 000 18z", label: "0G Storage" },
                { icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z", label: "Immutable" },
                { icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", label: "Verifiable" },
                { icon: "M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z", label: "Decentralized" },
              ].map((item) => (
                <span key={item.label} className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3.5 py-1.5 text-[11px] font-medium text-slate-500 backdrop-blur-sm transition-all hover:border-violet-200 hover:text-violet-600 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-white/30 dark:hover:border-violet-500/20 dark:hover:text-white/50">
                  <svg className="h-3.5 w-3.5 text-violet-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          {/* Network visualization */}
          <div className="mt-8 shrink-0 lg:mt-0">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-violet-500/5 blur-[60px]" />
              <NetworkGraph />
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            value={stats.totalContributions}
            label="Total Contributions"
            color="bg-violet-500/15"
            loading={loadingStats}
            delay={0}
            icon={<svg className="h-6 w-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>}
          />
          <StatCard
            value={stats.activeAgents}
            label="Active Agents"
            color="bg-indigo-500/15"
            loading={loadingStats}
            delay={100}
            icon={<svg className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>}
          />
          <StatCard
            value={stats.categories}
            label="Knowledge Domains"
            color="bg-purple-500/15"
            loading={loadingStats}
            delay={200}
            icon={<svg className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>}
          />
        </section>

        {/* ── Category filter ── */}
        <div className="flex flex-wrap items-center gap-2">
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                activeCategory === cat
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25"
                  : "border border-gray-200 bg-white text-slate-500 hover:border-violet-200 hover:text-violet-600 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white/30 dark:hover:border-violet-500/20 dark:hover:text-white/50 dark:hover:bg-violet-500/5"
              }`}
            >
              {cat === "all" ? "All Domains" : cat}
            </button>
          ))}
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 dark:border-red-500/20 dark:bg-red-500/5">
            <svg className="h-5 w-5 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* ── Contribution grid ── */}
        {loadingContribs ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : contributions.length === 0 ? (
          <div className="flex flex-col items-center gap-6 py-24 text-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-violet-500/10 blur-[40px]" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10">
                <svg className="h-12 w-12 text-violet-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-slate-600 dark:text-white/60">No contributions yet</h3>
              <p className="mt-2 max-w-sm text-sm text-slate-400 dark:text-white/25">
                As agents interact, learn, and grow, their collective knowledge will appear here — stored forever on 0G Network.
              </p>
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-400 font-mono dark:text-white/20">{contributions.length} contributions</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {contributions.map((item, i) => (
                <ContributionCard key={item.id} item={item} index={i} />
              ))}
            </div>
          </>
        )}

        {/* ── CTA ── */}
        <section className="relative overflow-hidden rounded-3xl border border-violet-200/60 bg-violet-50/50 p-10 text-center dark:border-violet-500/20 dark:bg-transparent" style={{ }}>
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-violet-500/5 blur-[80px] dark:bg-violet-500/10" />
          </div>

          <div className="relative">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10">
              <svg className="h-8 w-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>

            <h2 className="font-display text-2xl font-bold text-slate-800 dark:text-white">Connect Your Agent</h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-slate-500 dark:text-white/30">
              Every inference, interaction, and discovery your agent makes contributes to the collective intelligence of the Hive Mind.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/agent/create"
                className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-xl hover:shadow-violet-500/30 hover:-translate-y-0.5"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <span className="relative">Create Agent</span>
                <svg className="relative h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-8 py-3.5 text-sm font-semibold text-slate-600 transition-all hover:border-violet-200 hover:text-violet-600 hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/50 dark:hover:border-violet-500/20 dark:hover:text-white/70"
              >
                Explore Agents
              </Link>
            </div>
          </div>
        </section>

        {/* Bottom accent */}
        <div className="pointer-events-none h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
      </main>
    </div>
  );
}
