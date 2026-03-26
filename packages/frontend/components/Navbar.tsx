"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useLang } from "../contexts/LangContext";

const WalletConnectButton = dynamic(
  () => import("./WalletConnectButton").then((mod) => mod.WalletConnectButton),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300">Connect</div>
    )
  }
);

export function Navbar() {
  const { lang, toggleLang, t } = useLang();

  const links = [
    { href: "/", label: t("nav_home") },
    { href: "/dashboard", label: t("nav_dashboard") },
    { href: "/explore", label: t("nav_explore") },
    { href: "/verify", label: t("nav_verify") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <div>
          <Link href="/" className="text-lg font-semibold tracking-wide text-white">
            SealMind
          </Link>
          <p className="text-xs text-slate-400">{t("nav_tagline")}</p>
        </div>

        {/* Nav links */}
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-slate-300 transition hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right controls: language toggle + wallet */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-cyan-400/50 hover:text-cyan-300 active:scale-95"
            title={lang === "zh" ? "Switch to English" : "切换为中文"}
          >
            <span className="text-base leading-none">{lang === "zh" ? "🇨🇳" : "🇺🇸"}</span>
            <span>{lang === "zh" ? "EN" : "中文"}</span>
          </button>

          <WalletConnectButton />
        </div>
      </div>
    </header>
  );
}
