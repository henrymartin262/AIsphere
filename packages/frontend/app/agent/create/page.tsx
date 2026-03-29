"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useCreateAgent } from "../../../hooks/useAgent";
import { useLang } from "../../../contexts/LangContext";

type Step = "form" | "minting" | "done";

export default function CreateAgentPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { createAgent, isLoading, error } = useCreateAgent();
  const { t, lang } = useLang();

  const MODELS = [
    { value: "deepseek-v3.1", label: "DeepSeek V3.1", desc: t("create_model_deepseek_desc") },
    { value: "qwen-2.5-72b",  label: "Qwen 2.5 72B",  desc: t("create_model_qwen_desc") },
  ];

  const MINT_STEPS = [
    t("create_step_1"), t("create_step_2"), t("create_step_3"),
    t("create_step_4"), t("create_step_5"),
  ];

  const [step, setStep] = useState<Step>("form");
  const [mintStep, setMintStep] = useState(0);
  const [createdId, setCreatedId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", model: "deepseek-v3.1", description: "", personality: "" });
  const [formError, setFormError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isConnected || !address) return;
    if (!form.name.trim()) { setFormError(t("create_error_name")); return; }
    setFormError(null);
    setStep("minting");
    setMintStep(0);
    for (let i = 0; i < MINT_STEPS.length - 1; i++) {
      await new Promise((r) => setTimeout(r, 700));
      setMintStep(i + 1);
    }
    const result = await createAgent({
      name: form.name.trim(), model: form.model,
      description: form.description.trim(), personality: form.personality.trim(),
      ownerAddress: address,
    });
    if (result) { setCreatedId(result.agentId); setMintStep(MINT_STEPS.length - 1); setStep("done"); }
    else setStep("form");
  }

  /* ── Not connected ── */
  if (!isConnected) {
    return (
      <main className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-8 px-6 py-24">
        <div className="card-gradient w-full max-w-md p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 text-3xl dark:border-indigo-400/20 dark:bg-indigo-500/10">
            🔒
          </div>
          <h1 className="mt-6 text-2xl font-semibold text-gray-900 dark:text-white">{t("create_connect_title")}</h1>
          <p className="mt-3 text-gray-500 dark:text-slate-400">{t("create_connect_desc")}</p>
          <div className="mt-6 flex justify-center"><ConnectButton /></div>
        </div>
      </main>
    );
  }

  /* ── Minting ── */
  if (step === "minting") {
    return (
      <main className="mx-auto flex max-w-lg flex-col items-center justify-center gap-8 px-6 py-24">
        <div className="card w-full p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 dark:border-indigo-400/20 dark:bg-indigo-500/10">
            <svg className="h-8 w-8 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <h2 className="mt-5 text-xl font-semibold text-gray-900 dark:text-white">{t("create_submit")}</h2>
          <div className="mt-6 space-y-2">
            {MINT_STEPS.map((s, i) => (
              <div key={i} className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-all ${
                i < mintStep ? "text-green-600 dark:text-green-400"
                : i === mintStep ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300"
                : "text-gray-300 dark:text-slate-700"
              }`}>
                <span className="flex h-5 w-5 items-center justify-center rounded-full text-xs">
                  {i < mintStep ? "✓" : i === mintStep ? "⏳" : "○"}
                </span>
                {s}
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  /* ── Done ── */
  if (step === "done" && createdId !== null) {
    return (
      <main className="mx-auto flex max-w-lg flex-col items-center justify-center gap-8 px-6 py-24">
        <div className="card w-full p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-green-200 bg-green-50 text-3xl dark:border-green-500/30 dark:bg-green-500/10">
            🎉
          </div>
          <h2 className="mt-5 text-xl font-semibold text-gray-900 dark:text-white">{t("create_success_title")}</h2>
          <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 dark:border-white/[0.08] dark:bg-white/5">
            <p className="text-xs text-gray-400 dark:text-slate-500">{t("create_success_id")}</p>
            <p className="mt-1 font-mono text-lg font-semibold text-indigo-600 dark:text-indigo-300">#{createdId}</p>
          </div>
          <button
            onClick={() => router.push(`/agent/${createdId}/chat`)}
            className="btn-primary mt-6 w-full justify-center"
          >
            {t("create_success_go")} →
          </button>
        </div>
      </main>
    );
  }

  /* ── Form ── */
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-8">
        <span className="badge">Create Agent</span>
        <h1 className="mt-4 text-3xl font-semibold text-gray-900 dark:text-white">{t("create_title")}</h1>
        <p className="mt-2 text-gray-500 dark:text-slate-400">{t("create_desc")}</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-8 space-y-6">
        {/* Name */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">
            {t("create_field_name")} <span className="text-red-500">*</span>
          </label>
          <input
            name="name" value={form.name} onChange={handleChange}
            placeholder={t("create_field_name_ph")}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder-slate-600 dark:focus:border-indigo-400/50 dark:focus:ring-indigo-400/10"
          />
        </div>

        {/* Model */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">
            {t("create_field_model")} <span className="text-red-500">*</span>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            {MODELS.map((m) => (
              <label key={m.value} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                form.model === m.value
                  ? "border-indigo-300 bg-indigo-50 dark:border-indigo-400/40 dark:bg-indigo-500/10"
                  : "border-gray-200 bg-white hover:border-indigo-200 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20"
              }`}>
                <input type="radio" name="model" value={m.value}
                  checked={form.model === m.value} onChange={handleChange}
                  className="mt-0.5 accent-indigo-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{m.label}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500">{m.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">{t("create_field_desc")}</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={2}
            placeholder={t("create_field_desc_ph")}
            className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder-slate-600 dark:focus:border-indigo-400/50 dark:focus:ring-indigo-400/10"
          />
        </div>

        {/* Personality */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300">{t("create_field_personality")}</label>
          <textarea name="personality" value={form.personality} onChange={handleChange} rows={4}
            placeholder={t("create_field_personality_ph")}
            className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder-slate-600 dark:focus:border-indigo-400/50 dark:focus:ring-indigo-400/10"
          />
        </div>

        {(formError || error) && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {formError || error}
          </div>
        )}

        <button type="submit" disabled={isLoading}
          className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed">
          {isLoading ? t("create_submitting") : t("create_submit")}
        </button>
      </form>
    </main>
  );
}
