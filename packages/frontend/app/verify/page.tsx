"use client";

import { useState } from "react";
import { useVerify } from "../../hooks/useVerify";
import { useLang } from "../../contexts/LangContext";

export default function VerifyPage() {
  const { verify, result, isLoading } = useVerify();
  const { t, lang } = useLang();
  const [proofHash, setProofHash] = useState("");

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!proofHash.trim()) return;
    await verify(proofHash.trim());
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      {/* Header */}
      <div className="animate-slide-up mb-8">
        <span className="badge">{t("verify_badge")}</span>
        <h1 className="mt-4 text-3xl font-bold text-slate-800">
          {t("verify_title").split("").slice(0, 2).join("")}
          <span className="text-gradient">{t("verify_title").split("").slice(2).join("")}</span>
        </h1>
        <p className="mt-2 text-slate-500 leading-relaxed">{t("verify_desc")}</p>
      </div>

      {/* Input form */}
      <form onSubmit={handleVerify} className="animate-slide-up stagger-2 card relative overflow-hidden p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-400/[0.06] blur-[60px]" />

        <div className="relative z-10">
          <label className="mb-2 block text-sm font-medium text-slate-600">
            {t("verify_label")}
          </label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-orange-300">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
              </div>
              <input
                value={proofHash}
                onChange={(e) => setProofHash(e.target.value)}
                placeholder="0x..."
                className="w-full rounded-xl border border-orange-200/60 bg-white py-3 pl-10 pr-4 font-mono text-sm text-slate-700 placeholder-slate-300 outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-100 focus:shadow-sm"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !proofHash.trim()}
              className="btn-primary rounded-xl px-6 py-3 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {isLoading ? (
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : t("verify_btn")}
            </button>
          </div>
        </div>
      </form>

      {/* Result */}
      {result && (
        <div className="mt-6 animate-scale-in">
          {result.valid ? (
            <div className="card relative overflow-hidden p-6 border-emerald-200">
              <div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-emerald-400/[0.06] blur-[60px]" />

              <div className="relative z-10">
                <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                    <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-emerald-700">{t("verify_success_title")}</p>
                    <p className="text-xs text-emerald-500">{t("verify_success_desc")}</p>
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  {[
                    { label: "Proof Hash", value: result.proofHash, mono: true },
                    { label: t("verify_field_agent"), value: result.agentId != null ? `#${result.agentId}` : undefined },
                    {
                      label: t("verify_field_timestamp"),
                      value: result.timestamp
                        ? new Date(result.timestamp).toLocaleString(lang === "zh" ? "zh-CN" : "en-US")
                        : undefined,
                    },
                    { label: t("verify_field_importance"), value: result.importance != null ? String(result.importance) : undefined },
                    { label: t("verify_field_onchain"), value: result.onChain ? t("verify_onchain_yes") : t("verify_onchain_no") },
                  ].map(({ label, value, mono }) =>
                    value ? (
                      <div key={label} className="flex items-start justify-between gap-3 rounded-xl bg-orange-50/50 border border-orange-100/60 px-4 py-2.5">
                        <span className="text-xs text-slate-400 shrink-0">{label}</span>
                        <span className={`text-xs text-right break-all ${mono ? "font-mono text-slate-600" : "text-slate-700"}`}>
                          {value}
                        </span>
                      </div>
                    ) : null
                  )}
                  {result.onChain && result.txHash && (
                    <div className="rounded-xl bg-orange-50/50 border border-orange-100/60 px-4 py-2.5">
                      <p className="text-xs text-slate-400">{t("proof_field_tx")}</p>
                      <a
                        href={`https://chainscan-galileo.0g.ai/tx/${result.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 break-all font-mono text-xs text-brand-500 transition hover:text-brand-600"
                      >
                        {result.txHash}
                        <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="card relative overflow-hidden p-6 border-red-200">
              <div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-red-400/[0.06] blur-[60px]" />
              <div className="relative z-10 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                  <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-red-700">{t("verify_fail_title")}</p>
                  <p className="text-xs text-red-500">{result.error ?? t("verify_fail_desc")}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
