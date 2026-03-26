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
      <div className="mb-8">
        <span className="badge">{t("verify_badge")}</span>
        <h1 className="mt-4 text-3xl font-semibold text-white">{t("verify_title")}</h1>
        <p className="mt-2 text-slate-400">{t("verify_desc")}</p>
      </div>

      {/* Input form */}
      <form onSubmit={handleVerify} className="card p-6">
        <label className="mb-2 block text-sm font-medium text-slate-300">
          {t("verify_label")}
        </label>
        <div className="flex gap-3">
          <input
            value={proofHash}
            onChange={(e) => setProofHash(e.target.value)}
            placeholder="0x..."
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-sm text-white placeholder-slate-600 outline-none transition focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30"
          />
          <button
            type="submit"
            disabled={isLoading || !proofHash.trim()}
            className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : t("verify_btn")}
          </button>
        </div>
      </form>

      {/* Result */}
      {result && (
        <div className="mt-6">
          {result.valid ? (
            <div className="card p-6 border-green-500/30 bg-green-500/5">
              <div className="flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="font-semibold text-green-300">{t("verify_success_title")}</p>
                  <p className="text-xs text-green-500/70">{t("verify_success_desc")}</p>
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
                    <div key={label} className="flex items-start justify-between gap-3 rounded-xl bg-white/5 px-4 py-2.5">
                      <span className="text-xs text-slate-500 shrink-0">{label}</span>
                      <span className={`text-xs text-right break-all ${mono ? "font-mono text-slate-300" : "text-white"}`}>
                        {value}
                      </span>
                    </div>
                  ) : null
                )}
                {result.onChain && result.txHash && (
                  <div className="rounded-xl bg-white/5 px-4 py-2.5">
                    <p className="text-xs text-slate-500">{t("proof_field_tx")}</p>
                    <a
                      href={`https://chainscan-galileo.0g.ai/tx/${result.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block break-all font-mono text-xs text-cyan-400 underline hover:text-cyan-300"
                    >
                      {result.txHash} ↗
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card p-6 border-red-500/30 bg-red-500/5">
              <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
                <span className="text-2xl">❌</span>
                <div>
                  <p className="font-semibold text-red-300">{t("verify_fail_title")}</p>
                  <p className="text-xs text-red-500/70">{result.error ?? t("verify_fail_desc")}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
