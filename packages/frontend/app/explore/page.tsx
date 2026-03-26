"use client";

import { useLang } from "../../contexts/LangContext";

export default function ExplorePage() {
  const { t } = useLang();
  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <section className="card p-8">
        <span className="badge">Explore</span>
        <h1 className="mt-4 text-3xl font-semibold text-white">
          {t("nav_home") === "Home" ? "Agent Marketplace" : "公开 Agent 市场"}
        </h1>
        <p className="mt-3 text-slate-300">
          {t("nav_home") === "Home"
            ? "Coming soon — AgentCard grid, tag filters, sorting and paginated browsing."
            : "后续会在这里接入 AgentCard 网格、标签筛选、排序和分页浏览。"}
        </p>
      </section>
    </main>
  );
}
