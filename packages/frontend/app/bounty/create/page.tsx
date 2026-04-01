"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useCreateBounty } from "../../../hooks/useBounty";
import { useLang } from "../../../contexts/LangContext";

type Step = 1 | 2 | 3;

interface FormData {
  title: string;
  description: string;
  rewardEth: string;
  deadlineDate: string;
}

const INITIAL_FORM: FormData = {
  title: "",
  description: "",
  rewardEth: "",
  deadlineDate: "",
};

function StepIndicator({ current }: { current: Step }) {
  const steps = [1, 2, 3] as const;
  return (
    <div className="flex items-center gap-3">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-3">
          <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
            current === s
              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200 dark:shadow-indigo-900/30"
              : current > s
              ? "bg-emerald-500 text-white"
              : "border border-gray-200 bg-white text-slate-400 dark:border-white/10 dark:bg-white/5"
          }`}>
            {current > s ? (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : s}
          </div>
          {i < steps.length - 1 && (
            <div className={`h-px w-8 transition-all ${current > s ? "bg-emerald-400" : "bg-gray-200 dark:bg-white/10"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function CreateBountyPage() {
  const { lang } = useLang();
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { createBounty, isLoading, error } = useCreateBounty();

  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [result, setResult] = useState<{ bountyId: number; txHash?: string } | null>(null);

  // Compute min date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  function validate(): boolean {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (!form.title.trim()) errs.title = lang === "zh" ? "请输入任务标题" : "Title is required";
    if (form.title.length > 100) errs.title = lang === "zh" ? "最多 100 个字符" : "Max 100 characters";
    if (!form.description.trim()) errs.description = lang === "zh" ? "请输入任务描述" : "Description is required";
    if (form.description.length > 1000) errs.description = lang === "zh" ? "最多 1000 个字符" : "Max 1000 characters";
    const reward = parseFloat(form.rewardEth);
    if (isNaN(reward) || reward < 0.001) errs.rewardEth = lang === "zh" ? "最低 0.001 A0GI" : "Minimum 0.001 A0GI";
    if (!form.deadlineDate) errs.deadlineDate = lang === "zh" ? "请选择截止日期" : "Deadline is required";
    else if (form.deadlineDate < minDate) errs.deadlineDate = lang === "zh" ? "截止日期至少为明天" : "Deadline must be at least tomorrow";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!address) return;
    try {
      const deadline = Math.floor(new Date(form.deadlineDate).getTime() / 1000) + 86399; // end of day
      const data = await createBounty(
        { title: form.title, description: form.description, deadline, rewardEth: form.rewardEth },
        address
      );
      setResult(data);
      setStep(3);
    } catch {
      // error handled in hook
    }
  }

  if (!isConnected) {
    return (
      <main className="mx-auto flex max-w-lg flex-col items-center justify-center gap-8 px-6 py-20">
        <div className="card-gradient w-full p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-200/60 bg-indigo-50 dark:border-indigo-500/20 dark:bg-indigo-500/10">
            <svg className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25" />
            </svg>
          </div>
          <h2 className="mt-6 text-xl font-bold text-slate-800 dark:text-slate-100">
            {lang === "zh" ? "请先连接钱包" : "Connect Wallet First"}
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {lang === "zh" ? "连接钱包才能发布赏金任务" : "You need to connect a wallet to post a bounty"}
          </p>
          <div className="mt-6 flex justify-center">
            <ConnectButton />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-10">
      {/* Header */}
      <div className="animate-slide-up">
        <button
          onClick={() => step === 1 ? router.push("/bounty") : setStep((s) => (s - 1) as Step)}
          className="mb-6 flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-300"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" d="M11 17l-5-5 5-5M18 12H6" />
          </svg>
          {lang === "zh" ? "返回" : "Back"}
        </button>

        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {lang === "zh" ? "发布赏金任务" : "Post a Bounty"}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {lang === "zh" ? "赏金将锁入链上合约，任务完成后自动释放" : "Reward is locked in contract and released on completion"}
            </p>
          </div>
          <StepIndicator current={step} />
        </div>
      </div>

      <div className="mt-8">
        {/* ── Step 1: Fill in details ── */}
        {step === 1 && (
          <div className="animate-slide-up space-y-5">
            {/* Title */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                {lang === "zh" ? "任务标题" : "Title"}
                <span className="ml-1 text-red-400">*</span>
              </label>
              <input
                type="text"
                maxLength={100}
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder={lang === "zh" ? "简短清晰地描述任务目标..." : "Briefly describe the task goal..."}
                className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:bg-white/5 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:ring-indigo-500/20 ${
                  formErrors.title ? "border-red-300 bg-red-50 dark:border-red-500/40 dark:bg-red-500/5" : "border-gray-200 bg-white dark:border-white/10"
                }`}
              />
              <div className="mt-1 flex items-center justify-between">
                {formErrors.title ? (
                  <p className="text-xs text-red-500">{formErrors.title}</p>
                ) : <span />}
                <span className="text-[10px] text-slate-400">{form.title.length}/100</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                {lang === "zh" ? "任务描述" : "Description"}
                <span className="ml-1 text-red-400">*</span>
              </label>
              <textarea
                rows={5}
                maxLength={1000}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder={lang === "zh" ? "详细描述任务要求、验收标准、交付物..." : "Describe requirements, acceptance criteria, deliverables..."}
                className={`w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:bg-white/5 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:ring-indigo-500/20 ${
                  formErrors.description ? "border-red-300 bg-red-50 dark:border-red-500/40 dark:bg-red-500/5" : "border-gray-200 bg-white dark:border-white/10"
                }`}
              />
              <div className="mt-1 flex items-center justify-between">
                {formErrors.description ? (
                  <p className="text-xs text-red-500">{formErrors.description}</p>
                ) : <span />}
                <span className="text-[10px] text-slate-400">{form.description.length}/1000</span>
              </div>
            </div>

            {/* Reward */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                {lang === "zh" ? "赏金金额 (A0GI)" : "Reward Amount (A0GI)"}
                <span className="ml-1 text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={form.rewardEth}
                  onChange={(e) => setForm((f) => ({ ...f, rewardEth: e.target.value }))}
                  placeholder="0.01"
                  className={`w-full rounded-xl border px-4 py-3 pr-16 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:bg-white/5 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:ring-indigo-500/20 ${
                    formErrors.rewardEth ? "border-red-300 bg-red-50 dark:border-red-500/40 dark:bg-red-500/5" : "border-gray-200 bg-white dark:border-white/10"
                  }`}
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">A0GI</span>
              </div>
              {formErrors.rewardEth ? (
                <p className="mt-1 text-xs text-red-500">{formErrors.rewardEth}</p>
              ) : (
                <p className="mt-1 text-xs text-slate-400">{lang === "zh" ? "最低 0.001 A0GI" : "Minimum 0.001 A0GI"}</p>
              )}
            </div>

            {/* Deadline */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
                {lang === "zh" ? "截止日期" : "Deadline"}
                <span className="ml-1 text-red-400">*</span>
              </label>
              <input
                type="date"
                min={minDate}
                value={form.deadlineDate}
                onChange={(e) => setForm((f) => ({ ...f, deadlineDate: e.target.value }))}
                className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:bg-white/5 dark:text-slate-100 dark:focus:ring-indigo-500/20 ${
                  formErrors.deadlineDate ? "border-red-300 bg-red-50 dark:border-red-500/40 dark:bg-red-500/5" : "border-gray-200 bg-white dark:border-white/10"
                }`}
              />
              {formErrors.deadlineDate && (
                <p className="mt-1 text-xs text-red-500">{formErrors.deadlineDate}</p>
              )}
            </div>

            <button
              onClick={() => { if (validate()) setStep(2); }}
              className="btn-primary w-full justify-center"
            >
              {lang === "zh" ? "下一步：确认" : "Next: Review"}
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" d="M13 7l5 5-5 5" />
              </svg>
            </button>
          </div>
        )}

        {/* ── Step 2: Confirm ── */}
        {step === 2 && (
          <div className="animate-slide-up space-y-5">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 dark:border-white/8 dark:bg-slate-900">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {lang === "zh" ? "任务摘要" : "Task Summary"}
              </h3>
              <dl className="mt-4 space-y-3">
                {[
                  { label: lang === "zh" ? "标题" : "Title", value: form.title },
                  { label: lang === "zh" ? "描述" : "Description", value: form.description },
                  { label: lang === "zh" ? "赏金" : "Reward", value: `${form.rewardEth} A0GI` },
                  { label: lang === "zh" ? "截止日期" : "Deadline", value: form.deadlineDate },
                  { label: lang === "zh" ? "发布者" : "Creator", value: address ? `${address.slice(0, 8)}…${address.slice(-6)}` : "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex gap-3">
                    <dt className="w-20 shrink-0 text-xs text-slate-400 dark:text-slate-500">{label}</dt>
                    <dd className="min-w-0 flex-1 break-all text-xs font-medium text-slate-700 dark:text-slate-300">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Warning note */}
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/20 dark:bg-amber-500/5">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                {lang === "zh"
                  ? "发布后赏金将锁入智能合约，任务完成后自动释放给执行方 Agent。"
                  : "Upon posting, the reward will be locked in the smart contract and released to the executing Agent upon completion."}
              </p>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-500/20 dark:bg-red-500/5">
                <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-gray-300 hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
              >
                {lang === "zh" ? "修改" : "Edit"}
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="btn-primary flex-[2] justify-center disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                    </svg>
                    {lang === "zh" ? "发布中..." : "Posting..."}
                  </>
                ) : (
                  <>
                    {lang === "zh" ? "确认发布" : "Confirm & Post"}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Success ── */}
        {step === 3 && result && (
          <div className="animate-scale-in text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <svg className="h-10 w-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="mt-6 text-xl font-bold text-slate-800 dark:text-slate-100">
              {lang === "zh" ? "🎉 任务发布成功！" : "🎉 Bounty Posted!"}
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {lang === "zh" ? `任务 ID: #${result.bountyId}` : `Bounty ID: #${result.bountyId}`}
            </p>
            {result.txHash && (
              <p className="mt-1 break-all font-mono text-xs text-slate-400 dark:text-slate-500">
                {result.txHash}
              </p>
            )}

            <div className="mt-8 flex flex-col gap-3">
              <button
                onClick={() => router.push(`/bounty/${result.bountyId}`)}
                className="btn-primary justify-center"
              >
                {lang === "zh" ? "查看任务" : "View Bounty"}
              </button>
              <button
                onClick={() => { setStep(1); setForm(INITIAL_FORM); setResult(null); }}
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
              >
                {lang === "zh" ? "发布更多" : "Post Another"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
