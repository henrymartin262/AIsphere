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

  const TABS = [
    { href: "chat", label: `💬 ${t("nav_home") === "Home" ? "Chat" : "对话"}` },
    { href: "memory", label: `🧠 ${t("nav_home") === "Home" ? "Memory" : "记忆"}` },
    { href: "decisions", label: `⛓ ${t("nav_home") === "Home" ? "Decisions" : "决策"}` },
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-65px)]">
      <div className="border-b border-white/10 bg-slate-950/60 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <span className="text-xl">🤖</span>
            <div>
              <p className="text-sm font-medium text-white">
                {agent?.profile?.name ?? `Agent #${agentId}`}
              </p>
              <p className="text-xs text-slate-500">{agent?.profile?.model ?? "Loading..."}</p>
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
                  className={`rounded-xl px-4 py-1.5 text-xs font-medium transition ${
                    active
                      ? "bg-cyan-400/15 text-cyan-300 border border-cyan-400/30"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
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
