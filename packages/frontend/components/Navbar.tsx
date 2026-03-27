"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "../contexts/LangContext";

const WalletConnectButton = dynamic(
  () => import("./WalletConnectButton").then((mod) => mod.WalletConnectButton),
  {
    ssr: false,
    loading: () => (
      <div className="h-10 w-28 animate-pulse rounded-xl bg-gray-100" />
    )
  }
);

export function Navbar() {
  const { lang, toggleLang, t } = useLang();
  const pathname = usePathname();

  const links = [
    { href: "/", label: t("nav_home") },
    { href: "/dashboard", label: t("nav_dashboard") },
    { href: "/explore", label: t("nav_explore") },
    { href: "/verify", label: t("nav_verify") },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-50 opacity-60 transition-opacity group-hover:opacity-100" />
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm">
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
              <span className="text-gradient">Seal</span><span className="text-gray-900">Mind</span>
            </span>
            <p className="text-[10px] text-gray-400 leading-none">{t("nav_tagline")}</p>
          </div>
        </Link>

        {/* Nav links — pill 导航 */}
        <nav className="hidden items-center gap-1.5 rounded-full border border-gray-100 bg-gray-50/60 p-1.5 md:flex">
          {links.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch={true}
                className={`relative rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-800 hover:bg-white/60"
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
        <div className="flex items-center gap-2.5">
          <button
            onClick={toggleLang}
            className="flex h-10 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 text-sm font-medium text-gray-500 transition-all hover:border-indigo-300 hover:text-indigo-600 hover:shadow-sm"
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
