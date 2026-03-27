"use client";

import { useLang } from "../../contexts/LangContext";

const COMING_FEATURES = [
  {
    titleZh: "Agent 市场", titleEn: "Agent Marketplace",
    descZh: "浏览和发现公开的 AI Agent", descEn: "Browse and discover public AI Agents",
    color: "bg-brand-50 text-brand-600 border-brand-100",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    titleZh: "标签筛选", titleEn: "Tag Filters",
    descZh: "按技能、模型、等级筛选", descEn: "Filter by skills, models, levels",
    color: "bg-accent-muted text-accent border-purple-100",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
      </svg>
    ),
  },
  {
    titleZh: "排行榜", titleEn: "Leaderboard",
    descZh: "信任分排名与热门 Agent", descEn: "Trust score ranking & trending",
    color: "bg-ocean-muted text-ocean border-cyan-100",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    titleZh: "一键复用", titleEn: "One-click Fork",
    descZh: "Fork 公开 Agent 的人格配置", descEn: "Fork public Agent personality",
    color: "bg-mint-muted text-mint border-emerald-100",
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
    ),
  },
];

export default function ExplorePage() {
  const { t } = useLang();
  const isEn = t("nav_home") === "Home";

  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      {/* Header */}
      <section className="animate-slide-up card-gradient relative overflow-hidden p-10 md:p-14">
        {/* 背景装饰 */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-accent/[0.05] blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-brand-400/[0.06] blur-[60px]" />

        <div className="relative z-10">
          <span className="badge">Explore</span>
          <h1 className="mt-4 text-3xl font-bold text-slate-800 md:text-4xl">
            {isEn ? "Agent " : "公开 Agent "}
            <span className="text-gradient">{isEn ? "Marketplace" : "市场"}</span>
          </h1>
          <p className="mt-3 max-w-2xl text-slate-500 leading-relaxed">
            {isEn
              ? "Discover, evaluate, and interact with publicly available AI Agents. Each Agent's identity, inference history, and trust score are verifiable on-chain."
              : "发现、评估和交互公开的 AI Agent。每个 Agent 的身份、推理历史和信任分均可链上验证。"}
          </p>
        </div>
      </section>

      {/* Coming Features Grid */}
      <section className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {COMING_FEATURES.map((feat, i) => (
          <div
            key={i}
            className="animate-slide-up-stagger card group p-6 cursor-default"
            style={{ animationDelay: `${0.1 + i * 0.08}s` }}
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${feat.color} transition-transform group-hover:scale-110`}>
              {feat.icon}
            </div>
            <h3 className="mt-3 text-sm font-semibold text-slate-800">
              {isEn ? feat.titleEn : feat.titleZh}
            </h3>
            <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
              {isEn ? feat.descEn : feat.descZh}
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-medium text-amber-500">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400 animate-glow-pulse" />
              Coming Soon
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
