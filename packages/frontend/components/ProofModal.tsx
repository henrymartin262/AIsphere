"use client";

import { useState } from "react";
import type { InferenceProof } from "../types";
import { useLang } from "../contexts/LangContext";

interface ProofModalProps {
  proof: InferenceProof;
  onClose: () => void;
}

function truncate(s: string, len = 18): string {
  if (!s) return "";
  if (s.length <= len) return s;
  return `${s.slice(0, 10)}...${s.slice(-8)}`;
}

function HashRow({ label, value, copyLabel, copiedLabel }: {
  label: string; value: string; copyLabel: string; copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl bg-white/5 p-3">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
        <p className="mt-0.5 break-all font-mono text-xs text-slate-300">{value || "—"}</p>
      </div>
      {value && (
        <button
          onClick={copy}
          className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-slate-400 transition hover:border-cyan-400/30 hover:text-cyan-300"
        >
          {copied ? "✓" : copyLabel}
        </button>
      )}
    </div>
  );
}

export function ProofModal({ proof, onClose }: ProofModalProps) {
  const [copiedMain, setCopiedMain] = useState(false);
  const { t, lang } = useLang();

  const copyProofHash = async () => {
    await navigator.clipboard.writeText(proof.proofHash);
    setCopiedMain(true);
    setTimeout(() => setCopiedMain(false), 1500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-3xl border border-white/10 bg-slate-950/95 p-6 shadow-glow">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`inline-flex h-2.5 w-2.5 rounded-full ${
              proof.teeVerified ? "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" : "bg-orange-400"
            }`} />
            <h2 className="text-base font-semibold text-white">{t("proof_title")}</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-slate-400 transition hover:border-white/20 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* TEE Status */}
        <div className={`mt-4 flex items-center gap-2 rounded-xl border px-4 py-3 ${
          proof.teeVerified
            ? "border-green-500/30 bg-green-500/10 text-green-300"
            : "border-orange-500/30 bg-orange-500/10 text-orange-300"
        }`}>
          <span className="text-lg">{proof.teeVerified ? "✅" : "⚠️"}</span>
          <div>
            <p className="text-sm font-medium">
              {proof.teeVerified ? t("proof_tee_verified") : t("proof_tee_unverified")}
            </p>
            <p className="text-[11px] opacity-70">
              {proof.teeVerified
                ? lang === "zh" ? "此推理在安全硬件飞地内完成，结果不可篡改" : "Inference completed in secure hardware enclave, tamper-proof"
                : lang === "zh" ? "链上状态尚未确认，请稍后重试" : "On-chain status pending, please retry later"}
            </p>
          </div>
        </div>

        {/* On-chain status */}
        {proof.onChain && proof.txHash && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3">
            <span className="text-sm">⛓️</span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-blue-300">{t("proof_on_chain")}</p>
              <a
                href={`https://chainscan-galileo.0g.ai/tx/${proof.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-0.5 block truncate font-mono text-[10px] text-blue-400 underline hover:text-blue-300"
              >
                {truncate(proof.txHash, 24)} →
              </a>
            </div>
          </div>
        )}

        {/* Hashes */}
        <div className="mt-4 space-y-2">
          <HashRow label={t("proof_field_proof_hash")} value={proof.proofHash} copyLabel={t("proof_copy")} copiedLabel={t("proof_copied")} />
          <HashRow label={t("proof_field_model")} value={proof.modelHash} copyLabel={t("proof_copy")} copiedLabel={t("proof_copied")} />
          <HashRow label={t("proof_field_input")} value={proof.inputHash} copyLabel={t("proof_copy")} copiedLabel={t("proof_copied")} />
          <HashRow label={t("proof_field_output")} value={proof.outputHash} copyLabel={t("proof_copy")} copiedLabel={t("proof_copied")} />
        </div>

        {/* Timestamp */}
        <p className="mt-3 text-center text-[11px] text-slate-600">
          {new Date(proof.timestamp).toLocaleString(lang === "zh" ? "zh-CN" : "en-US")}
        </p>

        {/* Copy CTA */}
        <button
          onClick={copyProofHash}
          className="mt-4 w-full rounded-2xl border border-cyan-400/30 bg-cyan-400/10 py-2.5 text-sm font-medium text-cyan-300 transition hover:bg-cyan-400/20"
        >
          {copiedMain ? `✓ ${t("proof_copied")} Proof Hash` : `${t("proof_copy")} Proof Hash`}
        </button>
      </div>
    </div>
  );
}
