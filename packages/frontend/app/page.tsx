"use client";

import Link from "next/link";
import { useLang } from "../contexts/LangContext";

export default function HomePage() {
  const { t } = useLang();

  const features = [
    t("home_feat_inft"),
    t("home_feat_tee"),
    t("home_feat_memory"),
    t("home_feat_decision"),
  ];

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-12 px-6 py-16">
      <section className="card overflow-hidden p-10 md:p-14">
        <span className="badge">{t("home_badge")}</span>
        <div className="mt-6 max-w-3xl space-y-6">
          <h1 className="text-4xl font-semibold leading-tight text-white md:text-6xl">
            {t("home_title")}
          </h1>
          <p className="text-lg text-slate-300">{t("home_desc")}</p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/dashboard"
              className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              {t("home_cta_dashboard")}
            </Link>
            <Link
              href="/verify"
              className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-300 hover:text-cyan-200"
            >
              {t("home_cta_verify")}
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {features.map((item) => (
          <article key={item} className="card p-6">
            <p className="text-sm text-cyan-200">{t("home_feature_label")}</p>
            <h2 className="mt-3 text-xl font-medium text-white">{item}</h2>
            <p className="mt-2 text-sm text-slate-400">{t("home_feature_placeholder")}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
