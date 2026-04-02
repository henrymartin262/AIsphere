"use client";

import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

type Step = 1 | 2 | 3;

interface TestResult {
  name: string;
  passed: boolean;
  icon: string;
}

interface PassportData {
  passportHash: string;
  certifiedAt: number;
  isActive: boolean;
  agentId: number;
  walletAddress?: string;
}

const TESTS: TestResult[] = [
  { name: "Inference Engine", passed: false, icon: "🔮" },
  { name: "0G Storage", passed: false, icon: "🗄️" },
  { name: "Identity Verification", passed: false, icon: "🪪" },
];

function StepIndicator({ current }: { current: Step }) {
  const labels = ["Enter ID", "Test", "Issued"];
  return (
    <div className="flex items-center justify-center gap-3 mb-8">
      {([1, 2, 3] as Step[]).map((s) => (
        <div key={s} className="flex items-center gap-3">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold border transition-all duration-300 ${
                s < current
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : s === current
                  ? "border-indigo-500 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300"
                  : "border-gray-200 bg-gray-50 text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-500"
              }`}
            >
              {s < current ? "✓" : s}
            </div>
            <span className="text-[9px] text-slate-400 dark:text-slate-500">{labels[s - 1]}</span>
          </div>
          {s < 3 && (
            <div
              className={`h-px w-12 mb-4 transition-all duration-500 ${
                s < current ? "bg-emerald-400" : "bg-gray-200 dark:bg-white/10"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={handleCopy}
      className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-slate-500 transition hover:border-indigo-300 hover:text-indigo-600 dark:border-white/10 dark:text-slate-400 dark:hover:border-indigo-500/30 dark:hover:text-indigo-300"
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

export default function PassportPage() {
  const [step, setStep] = useState<Step>(1);
  const [agentId, setAgentId] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [tests, setTests] = useState<TestResult[]>(TESTS.map((t) => ({ ...t })));
  const [passport, setPassport] = useState<PassportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState("");

  async function handleBeginRegistration() {
    if (!agentId.trim()) return;
    setError(null);
    setStep(2);
    setTests(TESTS.map((t) => ({ ...t, passed: false })));

    try {
      const body: Record<string, string> = { agentId: agentId.trim() };
      if (walletAddress.trim()) body.walletAddress = walletAddress.trim();

      const res = await fetch(`${API_BASE}/passport/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      const results: boolean[] = json.data?.testResults ?? json.testResults ?? [true, true, true];
      for (let i = 0; i < TESTS.length; i++) {
        await new Promise((r) => setTimeout(r, 800 + i * 600));
        setTests((prev) =>
          prev.map((t, idx) => (idx === i ? { ...t, passed: Boolean(results[i]) } : t))
        );
      }

      await new Promise((r) => setTimeout(r, 400));

      if (!res.ok || !json.success) {
        throw new Error(json.error ?? json.message ?? "Registration failed");
      }

      const data: PassportData = json.data ?? json;
      setPassport(data);
      setShareUrl(
        typeof window !== "undefined"
          ? `${window.location.origin}/passport/${data.agentId}`
          : `/passport/${data.agentId}`
      );
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
      setStep(1);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      {/* ── Page Header ── */}
      <div className="animate-slide-up mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-200/60 bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-600 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.6)]" />
          On-Chain Certification
        </div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Agent Passport
        </h1>
        <p className="mt-1.5 max-w-xl text-sm text-slate-500 dark:text-slate-400">
          Register your agent and receive a permanent on-chain identity certificate.
        </p>
      </div>

      {/* ── Wizard Card ── */}
      <div className="mx-auto max-w-lg">
        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm dark:border-white/8 dark:bg-slate-900">
          <StepIndicator current={step} />

          {/* ── Step 1: Input ── */}
          {step === 1 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">
                Enter Your Agent ID
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">
                Provide your agent ID to begin the certification process
              </p>

              {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                  ⚠ {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                    Agent ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={agentId}
                    onChange={(e) => setAgentId(e.target.value)}
                    placeholder="e.g. 42"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder-slate-300 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:placeholder-slate-600 dark:focus:border-indigo-500/50 dark:focus:ring-indigo-500/10"
                    onKeyDown={(e) => e.key === "Enter" && agentId.trim() && handleBeginRegistration()}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                    Wallet Address <span className="text-slate-300 dark:text-slate-600">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder-slate-300 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:placeholder-slate-600 dark:focus:border-indigo-500/50 dark:focus:ring-indigo-500/10"
                  />
                </div>

                <button
                  onClick={handleBeginRegistration}
                  disabled={!agentId.trim()}
                  className="mt-2 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Begin Registration →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Testing ── */}
          {step === 2 && (
            <div>
              <div className="text-center mb-6">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 mb-4 dark:border-indigo-500/30 dark:bg-indigo-500/10">
                  <svg className="h-6 w-6 animate-spin text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  Running Capability Tests…
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Verifying agent #{agentId} capabilities
                </p>
              </div>

              <div className="space-y-3">
                {tests.map((test, idx) => {
                  const isRunning = tests.slice(0, idx).every((t) => t.passed) && !test.passed;
                  return (
                    <div
                      key={test.name}
                      className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-500 ${
                        test.passed
                          ? "border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10"
                          : isRunning
                          ? "border-indigo-200 bg-indigo-50 dark:border-indigo-500/30 dark:bg-indigo-500/10"
                          : "border-gray-100 bg-gray-50 dark:border-white/8 dark:bg-white/[0.02]"
                      }`}
                    >
                      <span className="text-xl">{test.icon}</span>
                      <span className={`flex-1 text-sm font-medium ${
                        test.passed
                          ? "text-emerald-700 dark:text-emerald-300"
                          : isRunning
                          ? "text-indigo-700 dark:text-indigo-300"
                          : "text-slate-400 dark:text-slate-500"
                      }`}>
                        {test.name}
                      </span>
                      {test.passed ? (
                        <span className="text-emerald-500 font-bold">✓</span>
                      ) : isRunning ? (
                        <svg className="h-4 w-4 animate-spin text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs text-slate-400 text-center dark:border-white/8 dark:bg-white/[0.02] dark:text-slate-500">
                Connecting to 0G Network · Verifying on-chain identity
              </div>
            </div>
          )}

          {/* ── Step 3: Success ── */}
          {step === 3 && passport && (
            <div>
              <div className="text-center mb-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 mb-4 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/10">
                  <span className="text-3xl">🪪</span>
                </div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                  Passport Issued!
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Agent #{passport.agentId} is now certified on-chain
                </p>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5 space-y-4 dark:border-white/8 dark:bg-white/[0.03]">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider">Status</span>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                    passport.isActive
                      ? "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400"
                      : "border-gray-200 bg-gray-100 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400"
                  }`}>
                    {passport.isActive ? "✓ Active" : "Inactive"}
                  </span>
                </div>

                <div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                    Passport Hash
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 truncate font-mono text-xs text-indigo-600 bg-white rounded-lg px-3 py-2 border border-gray-200 dark:bg-black/20 dark:border-white/5 dark:text-indigo-300">
                      {passport.passportHash}
                    </code>
                    <CopyButton text={passport.passportHash} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                      Certified At
                    </p>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {passport.certifiedAt
                        ? new Date(passport.certifiedAt * 1000).toLocaleDateString(undefined, {
                            year: "numeric", month: "long", day: "numeric",
                          })
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                      Agent ID
                    </p>
                    <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-300">
                      #{passport.agentId}
                    </p>
                  </div>
                </div>

                {shareUrl && (
                  <div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                      Shareable Link
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 truncate font-mono text-xs text-slate-500 bg-white rounded-lg px-3 py-2 border border-gray-200 dark:bg-black/20 dark:border-white/5 dark:text-slate-400">
                        {shareUrl}
                      </code>
                      <CopyButton text={shareUrl} />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => { setStep(1); setAgentId(""); setWalletAddress(""); setPassport(null); setError(null); }}
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-slate-500 transition hover:border-indigo-200 hover:text-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-400"
                >
                  Register Another
                </button>
                <a
                  href={`/agent/${passport.agentId}/profile`}
                  className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  View Agent →
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
