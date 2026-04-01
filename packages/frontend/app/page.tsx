"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useLang } from "../contexts/LangContext";

/* ═══════════════════════════════════════════════
   全屏封面（Cover）— 深蓝紫调
   ═══════════════════════════════════════════════ */
function HeroCover({ onEnter }: { onEnter: () => void }) {
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setReady(true), 300);
    const t2 = setTimeout(() => setStep(1), 800);
    const t3 = setTimeout(() => setStep(2), 1200);
    const t4 = setTimeout(() => setStep(3), 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0c0a1d] via-[#121028] to-[#0a0f1e]" />
      <div className="blob absolute -left-40 -top-40 h-[600px] w-[600px] bg-indigo-500/15" />
      <div className="blob absolute right-[-10%] top-[10%] h-[450px] w-[450px] bg-violet-500/10" style={{ animationDelay: "5s" }} />
      <div className="blob absolute bottom-[-15%] left-[20%] h-[500px] w-[500px] bg-blue-500/10" style={{ animationDelay: "10s" }} />
      <div className="neural-grid absolute inset-0 opacity-20" />

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="absolute -left-[180px] -top-[180px] h-[360px] w-[360px] animate-orbit-slow rounded-full border border-indigo-400/10">
          <div className="absolute left-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-indigo-400/40 shadow-[0_0_12px_rgba(99,102,241,0.5)]" />
        </div>
        <div className="absolute -left-[120px] -top-[120px] h-[240px] w-[240px] animate-orbit rounded-full border border-violet-300/[0.08]">
          <div className="absolute right-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-violet-400/50" />
        </div>
        <div className="absolute -left-[70px] -top-[70px] h-[140px] w-[140px] animate-orbit-reverse rounded-full border border-blue-400/10">
          <div className="absolute left-1/2 top-0 h-1 w-1 -translate-x-1/2 rounded-full bg-blue-400/50" />
        </div>
      </div>

      {[
        { size: 4, x: "10%", y: "15%", delay: "0s", color: "bg-indigo-400/30" },
        { size: 5, x: "85%", y: "12%", delay: "1.5s", color: "bg-violet-300/25" },
        { size: 3, x: "75%", y: "70%", delay: "3s", color: "bg-blue-400/25" },
        { size: 5, x: "20%", y: "75%", delay: "0.8s", color: "bg-indigo-300/20" },
        { size: 4, x: "50%", y: "8%", delay: "2.5s", color: "bg-violet-400/20" },
        { size: 6, x: "90%", y: "45%", delay: "4s", color: "bg-blue-300/20" },
      ].map((p, i) => (
        <div key={i} className={`particle ${p.color} animate-particle-float rounded-full`} style={{ width: p.size, height: p.size, left: p.x, top: p.y, animationDelay: p.delay }} />
      ))}

      <div className="meteor animate-meteor absolute left-[10%] top-[5%]" />
      <div className="meteor animate-meteor-delayed absolute left-[60%] top-[10%]" />

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="absolute -left-[100px] -top-[100px] h-[200px] w-[200px] animate-ripple rounded-full border border-indigo-400/10" />
        <div className="absolute -left-[100px] -top-[100px] h-[200px] w-[200px] animate-ripple-delayed rounded-full border border-violet-300/[0.08]" />
      </div>

      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-10 px-8">
        <div className={`transition-all duration-1000 ${ready ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}>
          <div className="animate-logo-float relative">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-500/30 to-violet-500/20 blur-3xl" />
            <div className="relative flex h-28 w-28 items-center justify-center rounded-3xl border border-white/10 bg-white/5 shadow-[0_0_60px_rgba(99,102,241,0.2)] backdrop-blur-xl">
              <svg className="h-14 w-14" viewBox="0 0 48 48" fill="none">
                <defs>
                  <linearGradient id="cover-g" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="50%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#f97316" />
                  </linearGradient>
                </defs>
                <path d="M24 4L44 16V32L24 44L4 32V16L24 4Z" stroke="url(#cover-g)" strokeWidth="2" fill="none" />
                <path d="M24 4L44 16V32L24 44L4 32V16L24 4Z" fill="url(#cover-g)" opacity="0.06" />
                <circle cx="24" cy="24" r="6" fill="url(#cover-g)" opacity="0.15" />
                <circle cx="24" cy="24" r="3" fill="url(#cover-g)" opacity="0.5" />
                <path d="M24 10L38 18M24 10L10 18M24 38L38 30M24 38L10 30M10 18V30M38 18V30" stroke="url(#cover-g)" strokeWidth="0.5" opacity="0.2" />
              </svg>
            </div>
          </div>
        </div>

        <div className={`text-center transition-all duration-1000 delay-300 ${ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <h1 className="text-6xl font-extrabold tracking-tight md:text-8xl">
            <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-orange-300 bg-clip-text text-transparent">Seal</span>
            <span className="text-white/90">Mind</span>
          </h1>
          <p className={`mt-4 text-lg text-white/40 transition-all duration-700 delay-500 md:text-xl ${step >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            Privacy-Sovereign AI Agent Operating System
          </p>
        </div>

        <div className={`flex flex-wrap items-center justify-center gap-3 transition-all duration-700 delay-700 ${step >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          {[
            { label: "0G Network", icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" },
            { label: "TEE Verified", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
            { label: "On-Chain Audit", icon: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" },
            { label: "AES-256", icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" },
          ].map((tag, i) => (
            <span key={tag.label} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[12px] font-medium text-white/50 backdrop-blur-sm transition-all hover:border-indigo-400/30 hover:text-white/70">
              <svg className="h-3.5 w-3.5 text-indigo-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={tag.icon} />
              </svg>
              {tag.label}
            </span>
          ))}
        </div>

        <div className={`transition-all duration-700 delay-1000 ${step >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <button onClick={onEnter} className="group relative inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-600 px-12 py-5 text-lg font-bold text-white shadow-[0_4px_30px_rgba(99,102,241,0.4)] transition-all hover:shadow-[0_8px_50px_rgba(99,102,241,0.5)] hover:-translate-y-1 active:scale-95">
            <span className="absolute inset-0 rounded-full bg-gradient-to-r from-white/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <span className="relative">Enter App</span>
            <svg className="relative h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>

        <p className={`text-center text-sm text-white/20 max-w-lg transition-all duration-700 delay-[1200ms] ${step >= 3 ? "opacity-100" : "opacity-0"}`}>
          Build truly sovereign AI Agents with verifiable inference and encrypted memory
        </p>
      </div>

      <div className="pointer-events-none absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/20 to-transparent" />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/15 to-transparent" />
    </div>
  );
}

/* ═══════════════════════════════════════════════
   动态浮光背景 — 明亮柔和蓝紫调
   ═══════════════════════════════════════════════ */
function DynamicBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div
        className="absolute -left-32 -top-20 h-[600px] w-[600px] rounded-full blur-[120px]"
        style={{
          background: "radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)",
          animation: "float-x 16s ease-in-out infinite",
        }}
      />
      <div
        className="absolute -right-20 top-[40%] h-[500px] w-[500px] rounded-full blur-[100px]"
        style={{
          background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)",
          animation: "float-x-reverse 18s ease-in-out infinite",
          animationDelay: "3s",
        }}
      />
      <div
        className="absolute left-[40%] bottom-[-5%] h-[450px] w-[450px] rounded-full blur-[100px]"
        style={{
          background: "radial-gradient(circle, rgba(249,115,22,0.04) 0%, transparent 70%)",
          animation: "breathe 10s ease-in-out infinite",
          animationDelay: "5s",
        }}
      />
      {[
        { size: 4, x: "15%", y: "20%", delay: "0s", bg: "rgba(99,102,241,0.25)" },
        { size: 5, x: "80%", y: "15%", delay: "2s", bg: "rgba(139,92,246,0.2)" },
        { size: 3, x: "60%", y: "70%", delay: "4s", bg: "rgba(99,102,241,0.2)" },
        { size: 4, x: "25%", y: "80%", delay: "1s", bg: "rgba(249,115,22,0.15)" },
        { size: 5, x: "85%", y: "50%", delay: "3s", bg: "rgba(139,92,246,0.15)" },
      ].map((p, i) => (
        <div key={i} className="absolute rounded-full animate-particle-float" style={{ width: p.size, height: p.size, left: p.x, top: p.y, animationDelay: p.delay, background: p.bg, boxShadow: `0 0 ${p.size * 3}px ${p.bg}` }} />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   首页主体 — 明亮清爽
   ═══════════════════════════════════════════════ */
export default function HomePage() {
  const { t, lang } = useLang();
  const [showCover, setShowCover] = useState(true);
  const [coverExiting, setCoverExiting] = useState(false);
  const [stats, setStats] = useState({ totalAgents: 0, totalInferences: 0, totalBounties: 0 });

  const handleEnter = useCallback(() => {
    setCoverExiting(true);
    setTimeout(() => setShowCover(false), 800);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const entered = sessionStorage.getItem("sealmind-entered");
      if (entered) setShowCover(false);
    }
  }, []);

  useEffect(() => {
    if (!showCover) sessionStorage.setItem("sealmind-entered", "1");
  }, [showCover]);

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
    fetch(`${API}/explore/stats`)
      .then(r => r.json())
      .then(j => { if (j.success) setStats(j.data); })
      .catch(() => {});
  }, []);

  const isEn = lang !== "zh";

  const features = [
    {
      title: t("home_feat_inft"),
      desc: t("home_feat_inft_desc"),
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <rect x="3" y="3" width="18" height="18" rx="4" />
          <circle cx="12" cy="10" r="3" />
          <path d="M7 18c0-2.8 2.2-5 5-5s5 2.2 5 5" strokeLinecap="round" />
        </svg>
      ),
      bg: "bg-indigo-50",
      text: "text-indigo-600",
      link: "/dashboard",
    },
    {
      title: t("home_feat_tee"),
      desc: t("home_feat_tee_desc"),
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      bg: "bg-violet-50",
      text: "text-violet-600",
      link: "/verify",
    },
    {
      title: t("home_feat_memory"),
      desc: t("home_feat_memory_desc"),
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      bg: "bg-blue-50",
      text: "text-blue-600",
      link: "/dashboard",
    },
    {
      title: t("home_feat_decision"),
      desc: t("home_feat_decision_desc"),
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
      bg: "bg-orange-50",
      text: "text-orange-600",
      link: "/dashboard",
    },
    {
      title: t("home_feat_multi_agent"),
      desc: t("home_feat_multi_agent_desc"),
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <circle cx="9" cy="7" r="3" />
          <circle cx="17" cy="7" r="2" />
          <path d="M3 18c0-3 2.7-5 6-5 1.2 0 2.3.3 3.2.7M14 18c0-2.2 1.3-4 3-4s3 1.8 3 4" strokeLinecap="round" />
        </svg>
      ),
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      link: "/multi-agent",
    },
    {
      title: t("home_feat_openclaw"),
      desc: t("home_feat_openclaw_desc"),
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      bg: "bg-cyan-50",
      text: "text-cyan-600",
      link: "/openclaw",
    },
    {
      title: t("home_feat_storage"),
      desc: t("home_feat_storage_desc"),
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <ellipse cx="12" cy="6" rx="8" ry="3" />
          <path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6" />
          <path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
        </svg>
      ),
      bg: "bg-purple-50",
      text: "text-purple-600",
      link: "/dashboard",
    },
    {
      title: t("home_feat_wallet_auth"),
      desc: t("home_feat_wallet_auth_desc"),
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M21 12V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h7" />
          <path d="M16 12h5v4h-5a2 2 0 010-4z" />
          <circle cx="18" cy="14" r="1" fill="currentColor" />
        </svg>
      ),
      bg: "bg-amber-50",
      text: "text-amber-600",
      link: "/dashboard",
    },
  ];

  return (
    <>
      {showCover && (
        <div className={coverExiting ? "animate-cover-fade" : ""}>
          <HeroCover onEnter={handleEnter} />
        </div>
      )}

      <DynamicBackground />

      <main className="relative z-10 mx-auto flex max-w-6xl flex-col gap-14 px-6 py-16 md:py-24">

        {/* ── Hero Section — 明亮大气 ── */}
        <section className="relative animate-slide-up">
          {/* 顶部渐变装饰弧 */}
          <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-40 w-[90%] rounded-[100%] bg-gradient-to-r from-indigo-200/20 via-violet-200/15 to-blue-200/15 blur-[80px]" />

          <div className="relative text-center md:text-left md:flex md:items-center md:gap-16">
            {/* 左侧文字 */}
            <div className="flex-1 space-y-8">
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200/60 bg-gradient-to-r from-indigo-50 to-violet-50 px-4 py-1.5 text-xs font-semibold text-indigo-600 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                {t("home_badge")}
              </span>

              {/* 重新设计的标题 — 分行排版 + 关键词高亮 */}
              <div className="space-y-3">
                <h1 className="text-4xl font-extrabold leading-[1.15] tracking-tight md:text-5xl lg:text-[3.4rem]">
                  <span className="text-gray-800">{t("home_title").split("，")[0]}，</span>
                </h1>
                <h1 className="text-4xl font-extrabold leading-[1.15] tracking-tight md:text-5xl lg:text-[3.4rem]">
                  <span className="relative">
                    <span className="relative z-10 bg-gradient-to-r from-indigo-600 via-violet-500 to-indigo-600 bg-clip-text text-transparent" style={{ backgroundSize: "200% 100%", animation: "gradient-shift 4s ease infinite" }}>
                      {(() => {
                        const rest = t("home_title").split("，").slice(1).join("，");
                        // 尝试提取核心动词+名词部分高亮
                        return rest;
                      })()}
                    </span>
                    {/* 底部装饰下划线 */}
                    <span className="absolute -bottom-1 left-0 right-0 h-[3px] rounded-full bg-gradient-to-r from-indigo-400/40 via-violet-400/60 to-indigo-400/40" style={{ animation: "gradient-shift 4s ease infinite", backgroundSize: "200% 100%" }} />
                  </span>
                </h1>
              </div>

              <p className="text-base leading-relaxed text-gray-500 md:text-lg max-w-xl">
                {t("home_desc")}
              </p>

              <div className="flex flex-wrap gap-3 pt-1">
                <Link
                  href="/dashboard"
                  className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:scale-[0.97]"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  <span className="relative">{t("home_cta_dashboard")}</span>
                  <svg className="relative h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link
                  href="/verify"
                  className="group inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-semibold text-gray-600 shadow-sm transition-all hover:border-indigo-300 hover:text-indigo-600 hover:shadow-md hover:-translate-y-0.5"
                >
                  <svg className="h-4 w-4 text-gray-400 group-hover:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  {t("home_cta_verify")}
                </Link>
              </div>
            </div>

            {/* 右侧装饰视觉 — 修复旋转动画 */}
            <div className="hidden md:flex flex-shrink-0 items-center justify-center">
              <div className="relative h-72 w-72 lg:h-80 lg:w-80">
                {/* 渐变光晕 */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-100/60 via-violet-50/40 to-blue-50/40 blur-2xl" />
                
                {/* 外环 — 带上运动光点 */}
                <div className="absolute inset-4 rounded-full" style={{ animation: "spin 40s linear infinite" }}>
                  <div className="absolute inset-0 rounded-full border border-indigo-200/40" />
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.6)]" />
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-indigo-300/60 shadow-[0_0_8px_rgba(99,102,241,0.4)]" />
                </div>
                
                {/* 中环 — 带运动光点，反转 */}
                <div className="absolute inset-12 rounded-full" style={{ animation: "spin 30s linear infinite reverse" }}>
                  <div className="absolute inset-0 rounded-full border border-violet-200/40" />
                  <div className="absolute top-1/2 -right-1 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-violet-300/50" />
                </div>
                
                {/* 内环 — 慢速旋转 */}
                <div className="absolute inset-20 rounded-full" style={{ animation: "spin 50s linear infinite" }}>
                  <div className="absolute inset-0 rounded-full border border-blue-200/30" />
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-blue-400/60 shadow-[0_0_8px_rgba(59,130,246,0.4)]" />
                </div>

                {/* 虚线轨道装饰 */}
                <div className="absolute inset-8 rounded-full border border-dashed border-indigo-100/30" />

                {/* 中心 Logo */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-20 w-20 items-center justify-center rounded-2xl border border-indigo-100/80 bg-white shadow-lg shadow-indigo-100/50">
                  <svg className="h-10 w-10" viewBox="0 0 48 48" fill="none">
                    <defs>
                      <linearGradient id="hero-g" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="50%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#6366f1" />
                      </linearGradient>
                    </defs>
                    <path d="M24 4L44 16V32L24 44L4 32V16L24 4Z" stroke="url(#hero-g)" strokeWidth="2" fill="none" />
                    <path d="M24 4L44 16V32L24 44L4 32V16L24 4Z" fill="url(#hero-g)" opacity="0.06" />
                    <circle cx="24" cy="24" r="5" fill="url(#hero-g)" opacity="0.15" />
                    <circle cx="24" cy="24" r="2.5" fill="url(#hero-g)" opacity="0.4" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 统计条 + 特性卡片 — 紧凑布局 ── */}
        <section className="animate-slide-up stagger-2 space-y-6">
          {/* 统计指标 — 横向紧凑排列 */}
          <div className="flex items-stretch gap-3 overflow-x-auto pb-1">
            {[
              { value: "3", label: "Smart Contracts", icon: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1", color: "text-indigo-600", bg: "bg-indigo-50" },
              { value: "TEE", label: "Sealed Inference", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", color: "text-violet-600", bg: "bg-violet-50" },
              { value: "AES-256", label: "Memory Encryption", icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z", color: "text-blue-600", bg: "bg-blue-50" },
              { value: "21+", label: "API Endpoints", icon: "M4 6h16M4 12h16M4 18h16", color: "text-emerald-600", bg: "bg-emerald-50" },
              { value: "5", label: "OpenClaw Skills", icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4", color: "text-cyan-600", bg: "bg-cyan-50" },
              { value: "0G", label: "Native Integration", icon: "M12 21a9 9 0 100-18 9 9 0 000 18zM3.6 9h16.8M3.6 15h16.8", color: "text-orange-600", bg: "bg-orange-50" },
            ].map((stat, i) => (
              <div key={i} className="group flex-1 min-w-[130px] rounded-xl border border-gray-100 bg-white px-3.5 py-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-gray-200">
                <div className="flex items-center gap-2.5">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${stat.bg} ${stat.color} transition-transform group-hover:scale-105`}>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 leading-tight">{stat.value}</p>
                    <p className="text-[10px] font-medium text-gray-400 leading-tight">{stat.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 特性卡片 — 8 个功能展示 */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((item, i) => (
            <Link
              key={i}
              href={item.link}
              className="animate-slide-up-stagger group relative cursor-pointer rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:border-gray-200"
              style={{ animationDelay: `${0.1 + i * 0.06}s` }}
            >
              {/* 顶部角标 — 标识已实现 */}
              <div className="absolute top-3 right-3">
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[9px] font-semibold text-green-600">
                  <span className="h-1 w-1 rounded-full bg-green-500" />
                  Live
                </span>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.bg} ${item.text} transition-transform group-hover:scale-110`}>
                {item.icon}
              </div>
              <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-gray-300">
                {t("home_feature_label")}
              </p>
              <h2 className="mt-1 text-sm font-bold text-gray-800 leading-snug">
                {item.title}
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-gray-400 line-clamp-2">
                {item.desc}
              </p>
            </Link>
          ))}
          </div>

          {/* 全网统计 */}
          <div className="mt-12 flex flex-wrap justify-center gap-8">
            {[
              { value: stats.totalAgents, label: "Agents Created", labelZh: "已创建 Agent" },
              { value: stats.totalInferences, label: "Inferences Run", labelZh: "推理次数" },
              { value: stats.totalBounties, label: "Bounties Posted", labelZh: "赏金任务" },
            ].map(({ value, label, labelZh }) => (
              <div key={label} className="text-center">
                <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-violet-500 to-indigo-600 bg-clip-text text-transparent">
                  {value > 0 ? value.toLocaleString() : "—"}
                </p>
                <p className="mt-1 text-xs text-slate-500">{isEn ? label : labelZh}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Bounty Board Preview ── */}
        <section className="animate-slide-up stagger-3">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">{isEn ? "New" : "新功能"}</span>
              <h2 className="mt-1 text-xl font-bold text-slate-800">
                {isEn ? "Bounty " : "赏金 "}
                <span className="text-gradient">{isEn ? "Board" : "任务板"}</span>
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                {isEn ? "Post tasks, let AI Agents earn rewards on-chain." : "发布任务，让 AI Agent 完成并赚取链上赏金。"}
              </p>
            </div>
            <Link href="/bounty" className="shrink-0 flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 transition dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-400">
              {isEn ? "View All" : "查看全部"}
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" d="M13 7l5 5-5 5M6 12h12" />
              </svg>
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { id: 1, title: isEn ? "Analyze 0G Network Performance" : "分析 0G 网络性能指标", reward: "0.1", status: 0, statusLabel: isEn ? "Open" : "开放", statusColor: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", deadline: isEn ? "7d left" : "剩余 7 天" },
              { id: 4, title: isEn ? "Generate Solidity Security Audit" : "生成 Solidity 安全审计报告", reward: "0.8", status: 2, statusLabel: isEn ? "Submitted" : "已提交", statusColor: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500", deadline: isEn ? "10d left" : "剩余 10 天" },
              { id: 5, title: isEn ? "Build ChatGPT Plugin for 0G Storage" : "构建 0G Storage ChatGPT 插件", reward: "1.5", status: 0, statusLabel: isEn ? "Open" : "开放", statusColor: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", deadline: isEn ? "14d left" : "剩余 14 天" },
            ].map((b) => (
              <Link key={b.id} href={`/bounty/${b.id}`} className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-200 dark:border-white/8 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-2">
                  <p className="flex-1 text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 transition-colors line-clamp-2">{b.title}</p>
                  <span className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${b.statusColor}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${b.dot}`} />
                    {b.statusLabel}
                  </span>
                </div>
                <div className="mt-auto pt-4 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">{isEn ? "Reward" : "赏金"}</p>
                    <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{b.reward} <span className="text-xs font-normal text-slate-400">A0GI</span></p>
                  </div>
                  <p className="text-xs text-slate-400">{b.deadline}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Agent Marketplace Preview ── */}
        <section className="animate-slide-up stagger-4">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400">{isEn ? "New" : "新功能"}</span>
              <h2 className="mt-1 text-xl font-bold text-slate-800">
                {isEn ? "Agent " : "Agent "}
                <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">{isEn ? "Marketplace" : "交易市场"}</span>
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                {isEn ? "Buy, sell, and try AI Agents. 3 free interactions before purchase." : "买卖 AI Agent，购买前可免费体验 3 次。"}
              </p>
            </div>
            <Link href="/explore" className="shrink-0 flex items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-semibold text-orange-600 hover:bg-orange-100 transition dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-400">
              {isEn ? "Browse All" : "浏览全部"}
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" d="M13 7l5 5-5 5M6 12h12" />
              </svg>
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { id: 3, name: "Orion", model: "qwen-2.5-72b", level: 5, inferences: 524, trust: 96, price: "3.0", tags: ["defi", "ai", "code"], levelColor: "border-amber-200 bg-amber-50 text-amber-700" },
              { id: 10, name: "Lyra", model: "qwen-2.5-72b", level: 5, inferences: 612, trust: 99, price: "5.0", tags: ["creative", "chat", "ai"], levelColor: "border-amber-200 bg-amber-50 text-amber-700" },
              { id: 9, name: "Vega", model: "deepseek-v3", level: 4, inferences: 389, trust: 92, price: "2.5", tags: ["defi", "code", "ai"], levelColor: "border-purple-200 bg-purple-50 text-purple-700" },
            ].map((a) => (
              <Link key={a.id} href="/explore" className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-orange-200 dark:border-white/8 dark:bg-slate-900">
                {/* Header */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-orange-200/60 bg-gradient-to-br from-orange-50 to-amber-50 group-hover:scale-105 transition-transform">
                      <svg className="h-5 w-5 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3}>
                        <rect x="3" y="3" width="18" height="18" rx="4" />
                        <circle cx="12" cy="10" r="3" />
                        <path d="M7 20c0-2.8 2.2-5 5-5s5 2.2 5 5" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-orange-600 transition-colors">{a.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{a.model}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${a.levelColor}`}>Lv.{a.level}</span>
                </div>
                {/* Tags */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {a.tags.map(t => (
                    <span key={t} className="rounded-md border border-orange-100 bg-orange-50/60 px-1.5 py-0.5 text-[9px] font-medium text-orange-500">#{t}</span>
                  ))}
                </div>
                {/* Stats + price */}
                <div className="mt-auto pt-4 flex items-end justify-between">
                  <div className="flex gap-3 text-center">
                    <div>
                      <p className="text-sm font-bold text-slate-700">{a.inferences}</p>
                      <p className="text-[9px] text-slate-400 uppercase">{isEn ? "Inf." : "推理"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-orange-500">{a.trust}</p>
                      <p className="text-[9px] text-slate-400 uppercase">{isEn ? "Trust" : "信任"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">{isEn ? "Price" : "售价"}</p>
                    <p className="text-lg font-bold text-orange-600">{a.price} <span className="text-xs font-normal text-slate-400">A0GI</span></p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── 底部 ── */}
        <section className="animate-slide-up stagger-5 text-center">
          <div className="inline-flex items-center gap-3 rounded-full border border-gray-100 bg-white px-6 py-3 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)] animate-pulse" />
            <p className="text-sm text-gray-400">
              Built on <span className="font-semibold text-gray-700">0G Network</span> · TEE Sealed Inference · On-Chain Audit
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
