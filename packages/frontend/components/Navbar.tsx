"use client";

import dynamic from "next/dynamic";
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

const THEME_OPTIONS: { value: ThemeMode; icon: string; labelZh: string; labelEn: string }[] = [
  { value: "system", icon: "💻", labelZh: "跟随系统", labelEn: "System" },
  { value: "light",  icon: "☀️", labelZh: "日间",     labelEn: "Light"  },
  { value: "dark",   icon: "🌙", labelZh: "夜间",     labelEn: "Dark"   },
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
    { href: "/dashboard", label: t("nav_dashboard") },
    { href: "/multi-agent", label: t("nav_multi_agent") },
    { href: "/openclaw", label: "OpenClaw" },
    { href: "/bounty", label: lang === "zh" ? "赏金" : "Bounty" },
    { href: "/explore", label: t("nav_explore") },
    { href: "/hivemind", label: lang === "zh" ? "🧠 蜂巢" : "🧠 Hive Mind" },
    { href: "/passport", label: lang === "zh" ? "🎫 护照" : "🎫 Passport" },
    { href: "/verify", label: t("nav_verify") },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur-2xl dark:border-white/8 dark:bg-slate-950/80">
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
            <span className="text-base font-bold tracking-wide">
              <span className="text-gradient">Seal</span>
              <span className="text-gray-900 dark:text-white">Mind</span>
            </span>
            <p className="text-[10px] text-gray-400 leading-none dark:text-slate-500">{t("nav_tagline")}</p>
          </div>
        </Link>

        {/* Nav links */}
        <nav className="hidden items-center gap-1 rounded-full border border-gray-100 bg-gray-50/60 p-1 md:flex dark:border-white/8 dark:bg-white/5">
          {links.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch={true}
                className={`relative rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
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
            className="flex h-10 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 text-sm font-medium text-gray-500 transition-all hover:border-indigo-300 hover:text-indigo-600 hover:shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:border-indigo-400/50 dark:hover:text-indigo-300"
            title={lang === "zh" ? "Switch to English" : "切换为中文"}
          >
            <span className="text-sm leading-none">{lang === "zh" ? "🇨🇳" : "🇺🇸"}</span>
            <span>{lang === "zh" ? "EN" : "中文"}</span>
          </button>
          <WalletConnectButton />
        </div>
      </div>
    </header>
  );
}
