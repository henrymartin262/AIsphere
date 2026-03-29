"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useAgent } from "../../../hooks/useAgent";
import { useLang } from "../../../contexts/LangContext";

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const { t } = useLang();
  const agentId =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
      ? params.id[0]
      : "";

  const { agent } = useAgent(agentId);
  const isEn = t("nav_home") === "Home";

  const TABS = [
    { href: "chat",      label: `💬 ${isEn ? "Chat" : "对话"}` },
    { href: "memory",    label: `🧠 ${isEn ? "Memory" : "记忆"}` },
    { href: "decisions", label: `⛓ ${isEn ? "Decisions" : "决策"}` },
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-65px)]">
      <div className="border-b border-gray-100 bg-white/80 backdrop-blur dark:border-white/[0.08] dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-lg dark:border-white/10 dark:bg-white/5">
              🤖
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {agent?.profile?.name ?? `Agent #${agentId}`}
              </p>
              <p className="text-xs text-gray-400 dark:text-slate-500">{agent?.profile?.model ?? "Loading..."}</p>
            </div>
          </div>
          <nav className="flex gap-1">
            {TABS.map((tab) => {
              const href = `/agent/${agentId}/${tab.href}`;
              const active = pathname === href;
              return (
                <Link
                  key={tab.href}
                  href={href}
                  className={`rounded-xl px-4 py-1.5 text-xs font-medium transition-all ${
                    active
                      ? "bg-indigo-50 text-indigo-600 border border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-400/30"
                      : "text-gray-500 hover:text-gray-800 hover:bg-gray-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
