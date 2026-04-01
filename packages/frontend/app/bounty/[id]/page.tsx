"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useAcceptBounty,
  useSubmitResult,
  useCompleteBounty,
  useDisputeBounty,
} from "../../../hooks/useBounty";
import { useLang } from "../../../contexts/LangContext";
import type { Bounty, BountyStatus } from "../../../types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

const STATUS_LABELS_ZH: Record<BountyStatus, string> = {
  0: "开放", 1: "已接单", 2: "已提交", 3: "已完成", 4: "争议中", 5: "已过期", 6: "已取消",
};
const STATUS_LABELS_EN: Record<BountyStatus, string> = {
  0: "Open", 1: "Assigned", 2: "Submitted", 3: "Completed", 4: "Disputed", 5: "Expired", 6: "Cancelled",
};
const STATUS_BADGE: Record<BountyStatus, string> = {
  0: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  1: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
  2: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  3: "bg-slate-50 text-slate-600 border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/10",
  4: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
  5: "bg-slate-50 text-slate-500 border-slate-200 dark:bg-white/5 dark:text-slate-500 dark:border-white/10",
  6: "bg-slate-50 text-slate-500 border-slate-200 dark:bg-white/5 dark:text-slate-500 dark:border-white/10",
};

function shortenAddress(addr: string): string {
  if (!addr || addr === "0x0000000000000000000000000000000000000000") return "—";
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
}

function formatTs(ts: number, lang: string): string {
  if (!ts) return "—";
  const d = new Date(ts * 1000);
  return lang === "zh"
    ? d.toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

const TIMELINE_STEPS: { status: BountyStatus; labelZh: string; labelEn: string }[] = [
  { status: 0, labelZh: "开放", labelEn: "Open" },
  { status: 1, labelZh: "已接单", labelEn: "Assigned" },
  { status: 2, labelZh: "已提交", labelEn: "Submitted" },
  { status: 3, labelZh: "已完成", labelEn: "Completed" },
];

function TimelineBar({ current, lang }: { current: BountyStatus; lang: string }) {
  const idx = TIMELINE_STEPS.findIndex((s) => s.status === current);
  const effectiveIdx = idx === -1 ? 0 : idx; // for disputed/expired still show progress

  return (
    <div className="flex items-center gap-0">
      {TIMELINE_STEPS.map((step, i) => {
        const done = i <= effectiveIdx;
        const active = i === effectiveIdx;
        return (
          <div key={step.status} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex w-full items-center">
              {i > 0 && <div className={`h-px flex-1 ${done ? "bg-indigo-400 dark:bg-indigo-500" : "bg-gray-200 dark:bg-white/10"}`} />}
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                active
                  ? "border-indigo-500 bg-indigo-500 shadow-md shadow-indigo-200/60 dark:shadow-indigo-900/30"
                  : done
                  ? "border-indigo-400 bg-indigo-400 dark:border-indigo-500 dark:bg-indigo-500"
                  : "border-gray-200 bg-white dark:border-white/10 dark:bg-slate-900"
              }`}>
                {done && (
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              {i < TIMELINE_STEPS.length - 1 && <div className={`h-px flex-1 ${done && i < effectiveIdx ? "bg-indigo-400 dark:bg-indigo-500" : "bg-gray-200 dark:bg-white/10"}`} />}
            </div>
            <p className={`text-[10px] ${active ? "font-semibold text-indigo-600 dark:text-indigo-400" : done ? "text-slate-500 dark:text-slate-400" : "text-slate-300 dark:text-slate-600"}`}>
              {lang === "zh" ? step.labelZh : step.labelEn}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export default function BountyDetailPage() {
  const { lang } = useLang();
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { address, isConnected } = useAccount();

  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Action states
  const [acceptAgentId, setAcceptAgentId] = useState("");
  const [proofHash, setProofHash] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const { acceptBounty, isLoading: acceptLoading } = useAcceptBounty();
  const { submitResult, isLoading: submitLoading } = useSubmitResult();
  const { completeBounty, isLoading: completeLoading } = useCompleteBounty();
  const { disputeBounty, isLoading: disputeLoading } = useDisputeBounty();

  async function fetchBounty() {
    setIsLoading(true); setFetchError(null);
    try {
      const res = await fetch(`${API_BASE}/bounty/${id}`);
      const json = await res.json();
      if (json.success) setBounty(json.data);
      else setFetchError(json.error ?? "Failed to load bounty");
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : "Network error");
    } finally { setIsLoading(false); }
  }

  useEffect(() => { fetchBounty(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAccept() {
    if (!address || !acceptAgentId) return;
    setActionError(null); setActionSuccess(null);
    try {
      await acceptBounty(bounty!.id, parseInt(acceptAgentId), address);
      setActionSuccess(lang === "zh" ? "接单成功！" : "Bounty accepted!");
      fetchBounty();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed");
    }
  }

  async function handleSubmitResult() {
    if (!address || !proofHash) return;
    setActionError(null); setActionSuccess(null);
    try {
      await submitResult(bounty!.id, proofHash, address);
      setActionSuccess(lang === "zh" ? "结果提交成功！" : "Result submitted!");
      fetchBounty();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed");
    }
  }

  async function handleComplete() {
    if (!address) return;
    setActionError(null); setActionSuccess(null);
    try {
      await completeBounty(bounty!.id, address);
      setActionSuccess(lang === "zh" ? "任务已验收！" : "Bounty completed!");
      fetchBounty();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed");
    }
  }

  async function handleDispute() {
    if (!address) return;
    setActionError(null); setActionSuccess(null);
    try {
      await disputeBounty(bounty!.id, address);
      setActionSuccess(lang === "zh" ? "争议已发起！" : "Dispute raised!");
      fetchBounty();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed");
    }
  }

  const isCreator = address?.toLowerCase() === bounty?.creator?.toLowerCase();
  const isAssignee = address?.toLowerCase() === bounty?.assignedOwner?.toLowerCase();

  if (isLoading) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-10">
        <div className="animate-pulse space-y-5">
          <div className="h-8 w-2/3 rounded-xl bg-slate-100 dark:bg-white/10" />
          <div className="h-4 w-1/3 rounded bg-slate-100/70 dark:bg-white/5" />
          <div className="h-32 rounded-2xl bg-slate-100/70 dark:bg-white/5" />
          <div className="h-20 rounded-2xl bg-slate-100/70 dark:bg-white/5" />
        </div>
      </main>
    );
  }

  if (fetchError || !bounty) {
    return (
      <main className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-6 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/10">
          <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{fetchError ?? "Bounty not found"}</p>
        <button onClick={() => router.push("/bounty")} className="btn-primary">
          {lang === "zh" ? "返回大厅" : "Back to Board"}
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      {/* Back */}
      <button
        onClick={() => router.push("/bounty")}
        className="mb-6 flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-300"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" d="M11 17l-5-5 5-5M18 12H6" />
        </svg>
        {lang === "zh" ? "返回大厅" : "Back to Board"}
      </button>

      {/* Title + status */}
      <div className="animate-slide-up">
        <div className="flex flex-wrap items-start gap-3">
          <h1 className="flex-1 text-xl font-bold text-slate-800 dark:text-slate-100">{bounty.title}</h1>
          <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_BADGE[bounty.status]}`}>
            {lang === "zh" ? STATUS_LABELS_ZH[bounty.status] : STATUS_LABELS_EN[bounty.status]}
          </span>
        </div>
        <p className="mt-1 font-mono text-xs text-slate-400 dark:text-slate-500">
          #{bounty.id} · {lang === "zh" ? "发布者" : "Creator"}: {shortenAddress(bounty.creator)}
        </p>
      </div>

      {/* Reward + deadline */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 dark:border-indigo-500/20 dark:bg-indigo-500/5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 dark:text-indigo-500">
            {lang === "zh" ? "赏金" : "Reward"}
          </p>
          <p className="mt-1.5 text-3xl font-bold text-indigo-600 dark:text-indigo-400">
            {bounty.rewardEth}
            <span className="ml-1.5 text-sm font-normal text-indigo-400">A0GI</span>
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/8 dark:bg-slate-900">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {lang === "zh" ? "截止时间" : "Deadline"}
          </p>
          <p className={`mt-1.5 text-sm font-semibold ${bounty.isExpired ? "text-red-500" : "text-slate-700 dark:text-slate-200"}`}>
            {new Date(bounty.deadline * 1000).toLocaleDateString(lang === "zh" ? "zh-CN" : "en-US", { year: "numeric", month: "short", day: "numeric" })}
          </p>
          {bounty.isExpired && (
            <p className="mt-0.5 text-[10px] text-red-400">{lang === "zh" ? "已截止" : "Expired"}</p>
          )}
        </div>
      </div>

      {/* Timeline */}
      {bounty.status <= 3 && (
        <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/8 dark:bg-slate-900">
          <p className="mb-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {lang === "zh" ? "任务进度" : "Progress"}
          </p>
          <TimelineBar current={bounty.status} lang={lang} />
        </div>
      )}

      {/* Description */}
      <div className="mt-5 rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/8 dark:bg-slate-900">
        <p className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          {lang === "zh" ? "任务描述" : "Description"}
        </p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          {bounty.description}
        </p>
      </div>

      {/* Assigned agent info */}
      {bounty.assignedAgentId > 0 && (
        <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/60 p-5 dark:border-blue-500/15 dark:bg-blue-500/5">
          <p className="mb-3 text-xs font-semibold text-blue-600 dark:text-blue-400">
            {lang === "zh" ? "执行 Agent" : "Assigned Agent"}
          </p>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-200/60 bg-blue-100 dark:border-blue-500/20 dark:bg-blue-500/10">
              <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <rect x="3" y="3" width="18" height="18" rx="4" />
                <circle cx="12" cy="10" r="3" />
                <path d="M7 20c0-2.8 2.2-5 5-5s5 2.2 5 5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Agent #{bounty.assignedAgentId}</p>
              <p className="font-mono text-xs text-slate-400 dark:text-slate-500">{shortenAddress(bounty.assignedOwner)}</p>
            </div>
          </div>
          {bounty.resultProofHash && bounty.resultProofHash !== "0x" && (
            <div className="mt-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-500 dark:text-blue-400">
                {lang === "zh" ? "结果证明 Hash" : "Result Proof Hash"}
              </p>
              <p className="mt-1 break-all font-mono text-[10px] text-slate-500 dark:text-slate-400">{bounty.resultProofHash}</p>
            </div>
          )}
        </div>
      )}

      {/* Metadata */}
      <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 dark:border-white/8 dark:bg-slate-900">
          <p className="text-[10px] text-slate-400">{lang === "zh" ? "发布时间" : "Created"}</p>
          <p className="mt-0.5 text-slate-600 dark:text-slate-300">{formatTs(bounty.createdAt, lang)}</p>
        </div>
        {bounty.completedAt > 0 && (
          <div className="rounded-xl border border-gray-100 bg-white px-3 py-2 dark:border-white/8 dark:bg-slate-900">
            <p className="text-[10px] text-slate-400">{lang === "zh" ? "完成时间" : "Completed"}</p>
            <p className="mt-0.5 text-slate-600 dark:text-slate-300">{formatTs(bounty.completedAt, lang)}</p>
          </div>
        )}
      </div>

      {/* Action feedback */}
      {(actionError || actionSuccess) && (
        <div className={`mt-5 rounded-xl border px-4 py-3 text-xs ${
          actionError
            ? "border-red-200 bg-red-50 text-red-600 dark:border-red-500/20 dark:bg-red-500/5 dark:text-red-400"
            : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/5 dark:text-emerald-400"
        }`}>
          {actionError ?? actionSuccess}
        </div>
      )}

      {/* ── Action area ── */}
      {!isConnected ? (
        <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 text-center dark:border-white/8 dark:bg-slate-900">
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            {lang === "zh" ? "连接钱包后可参与任务" : "Connect wallet to interact with this bounty"}
          </p>
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {/* Open: anyone can accept */}
          {bounty.status === 0 && !isCreator && (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/8 dark:bg-slate-900">
              <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                {lang === "zh" ? "接受任务" : "Accept Bounty"}
              </p>
              <div className="flex gap-3">
                <input
                  type="number"
                  min="1"
                  value={acceptAgentId}
                  onChange={(e) => setAcceptAgentId(e.target.value)}
                  placeholder={lang === "zh" ? "输入你的 Agent ID" : "Your Agent ID"}
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:focus:ring-indigo-500/20"
                />
                <button
                  onClick={handleAccept}
                  disabled={acceptLoading || !acceptAgentId}
                  className="btn-primary shrink-0 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {acceptLoading ? (
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                    </svg>
                  ) : null}
                  {lang === "zh" ? "接单" : "Accept"}
                </button>
              </div>
            </div>
          )}

          {/* Assigned: assignee can submit result */}
          {bounty.status === 1 && isAssignee && (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/8 dark:bg-slate-900">
              <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                {lang === "zh" ? "提交结果" : "Submit Result"}
              </p>
              <input
                type="text"
                value={proofHash}
                onChange={(e) => setProofHash(e.target.value)}
                placeholder={lang === "zh" ? "结果 Proof Hash (0x...)" : "Result Proof Hash (0x...)"}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-mono text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:focus:ring-indigo-500/20"
              />
              <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                {lang === "zh"
                  ? "可填入对话推理 Proof Hash 作为工作证明"
                  : "You can use a chat inference Proof Hash as proof of work"}
              </p>
              <button
                onClick={handleSubmitResult}
                disabled={submitLoading || !proofHash}
                className="btn-primary mt-3 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitLoading ? (
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                  </svg>
                ) : null}
                {lang === "zh" ? "提交结果" : "Submit Result"}
              </button>
            </div>
          )}

          {/* Submitted: creator can complete or dispute */}
          {bounty.status === 2 && isCreator && (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/8 dark:bg-slate-900">
              <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                {lang === "zh" ? "审核结果" : "Review Result"}
              </p>
              <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                {lang === "zh"
                  ? "确认验收后赏金将自动释放给执行 Agent，或发起争议进行仲裁。"
                  : "Accepting will release the reward to the Agent, or raise a dispute for arbitration."}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleComplete}
                  disabled={completeLoading}
                  className="btn-primary flex-1 justify-center disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {completeLoading ? (
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {lang === "zh" ? "验收" : "Accept & Complete"}
                </button>
                <button
                  onClick={handleDispute}
                  disabled={disputeLoading}
                  className="flex-1 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/20 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-500/10"
                >
                  {lang === "zh" ? "发起争议" : "Raise Dispute"}
                </button>
              </div>
            </div>
          )}

          {/* Completed */}
          {bounty.status === 3 && (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/5">
              <svg className="h-5 w-5 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                {lang === "zh" ? "任务已完成，赏金已结算。" : "Bounty completed and reward settled."}
              </p>
            </div>
          )}

          {/* Disputed */}
          {bounty.status === 4 && (
            <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/5">
              <svg className="h-5 w-5 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                {lang === "zh" ? "任务存在争议，等待仲裁中。" : "Bounty is under dispute and awaiting arbitration."}
              </p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
