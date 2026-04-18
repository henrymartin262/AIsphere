"use client";

import dynamic from "next/dynamic";
import type React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useLang } from "../contexts/LangContext";
import { useTheme, type ThemeMode } from "../contexts/ThemeContext";

const WalletConnectButton = dynamic(
  () => import("./WalletConnectButton").then((mod) => mod.WalletConnectButton),
  {
    ssr: false,
    loading: () => (
      <div className="h-10 w-28 animate-pulse rounded-xl bg-gray-100 dark:bg-white/10" />
    )
  }
);

const THEME_OPTIONS: { value: ThemeMode; icon: React.ReactNode; labelZh: string; labelEn: string }[] = [
  { value: "system", icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" /></svg>, labelZh: "跟随系统", labelEn: "System" },
  { value: "light",  icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>, labelZh: "日间",     labelEn: "Light"  },
  { value: "dark",   icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>, labelZh: "夜间",     labelEn: "Dark"   },
];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { lang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = THEME_OPTIONS.find((o) => o.value === theme) ?? THEME_OPTIONS[0];

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-base shadow-sm transition-all hover:border-indigo-300 hover:shadow dark:border-white/10 dark:bg-white/5 dark:hover:border-indigo-400/50"
        title={lang === "zh" ? "切换主题" : "Toggle theme"}
        aria-label="Theme"
      >
        {current.icon}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-36 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg dark:border-white/10 dark:bg-slate-900">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setTheme(opt.value); setOpen(false); }}
              className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                theme === opt.value
                  ? "bg-indigo-50 text-indigo-600 font-medium dark:bg-indigo-500/15 dark:text-indigo-300"
                  : "text-gray-600 hover:bg-gray-50 dark:text-slate-400 dark:hover:bg-white/5"
              }`}
            >
              <span>{opt.icon}</span>
              <span>{lang === "zh" ? opt.labelZh : opt.labelEn}</span>
              {theme === opt.value && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const { lang, toggleLang, t } = useLang();
  const pathname = usePathname();

  const links = [
    { href: "/", label: t("nav_home") },
    { href: "/chatbot", label: lang === "zh" ? "Bot 接入" : "Chatbot" },
    { href: "/dashboard", label: t("nav_dashboard") },
    { href: "/openclaw", label: "OpenClaw" },
    { href: "/explore", label: t("nav_explore") },
    { href: "/multi-agent", label: t("nav_multi_agent") },
    { href: "/bounty", label: lang === "zh" ? "赏金" : "Bounty" },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur-2xl dark:border-white/[0.06] dark:bg-slate-950/80">
      {/* Gradient accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-50 opacity-60 transition-opacity group-hover:opacity-100 dark:from-indigo-500/20 dark:to-violet-500/10" />
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                <defs>
                  <linearGradient id="nav-g" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#f97316" />
                  </linearGradient>
                </defs>
                <path d="M12 2L22 8.5V15.5L12 22L2 15.5V8.5L12 2Z" stroke="url(#nav-g)" strokeWidth="1.5" fill="none" />
                <circle cx="12" cy="12" r="3" fill="url(#nav-g)" opacity="0.3" />
                <path d="M12 5V19M5 8.5L19 15.5M19 8.5L5 15.5" stroke="url(#nav-g)" strokeWidth="0.5" opacity="0.2" />
              </svg>
            </div>
          </div>
          <div>
            <span className="font-display text-base font-bold tracking-wide">
              <span className="text-gradient">AI</span>
              <span className="text-gray-900 dark:text-white">sphere</span>
            </span>
            <p className="text-[10px] text-gray-400 leading-none dark:text-slate-500">{t("nav_tagline")}</p>
          </div>
        </Link>

        {/* Nav links */}
        <nav className="hidden items-center gap-1 overflow-x-auto rounded-full border border-gray-100 bg-gray-50/60 p-1 md:flex dark:border-white/8 dark:bg-white/5 scrollbar-hide">
          {links.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch={true}
                className={`relative whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                  active
                    ? "bg-white text-indigo-600 shadow-sm dark:bg-white/10 dark:text-indigo-300"
                    : "text-gray-500 hover:text-gray-800 hover:bg-white/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10"
                }`}
              >
                {active && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.5)]" />
                )}
                <span className={active ? "ml-3" : ""}>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={toggleLang}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-500 shadow-sm transition-all hover:border-indigo-300 hover:text-indigo-600 hover:shadow dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:border-indigo-400/50 dark:hover:text-indigo-300"
            title={lang === "zh" ? "Switch to English" : "切换为中文"}
          >
            {lang === "zh" ? "EN" : "中"}
          </button>
          <WalletConnectButton />
        </div>
      </div>
    </header>
  );
}
