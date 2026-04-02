"use client";

import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

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
  return (
    <div className="flex items-center justify-center gap-3 mb-8">
      {([1, 2, 3] as Step[]).map((s) => (
        <div key={s} className="flex items-center gap-3">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold border transition-all duration-300 ${
              s < current
                ? "border-emerald-500 bg-emerald-500 text-white"
                : s === current
                ? "border-cyan-400 bg-cyan-400/20 text-cyan-300"
                : "border-white/10 bg-white/5 text-slate-500"
            }`}
          >
            {s < current ? "✓" : s}
          </div>
          {s < 3 && (
            <div
              className={`h-px w-12 transition-all duration-500 ${
                s < current ? "bg-emerald-500" : "bg-white/10"
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
      className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-slate-400 transition hover:border-cyan-500/30 hover:text-cyan-300"
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

      const res = await fetch(`${API_BASE}/api/passport/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      // Animate test results one by one
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
    <main className="relative min-h-[calc(100vh-65px)] bg-slate-950 flex items-center justify-center p-6">
      {/* Hexagonal grid background */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 66L0 50V16L28 0l28 16v34L28 66zm0-4L4 48V18L28 4l24 14v30L28 62z' fill='%230ea5e9' /%3E%3C/svg%3E")`,
          backgroundSize: "56px 100px",
        }}
      />
      {/* Glow blobs */}
      <div className="pointer-events-none fixed left-1/4 top-1/4 h-72 w-72 rounded-full bg-cyan-500/10 blur-[120px]" />
      <div className="pointer-events-none fixed bottom-1/4 right-1/4 h-56 w-56 rounded-full bg-indigo-500/10 blur-[100px]" />

      <div className="relative z-10 w-full max-w-lg">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold text-cyan-400 mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.7)]" />
            On-Chain Certification
          </div>
          <h1 className="text-3xl font-bold text-white">
            Agent{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              Passport
            </span>
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Register your agent and receive a permanent on-chain identity certificate
          </p>
        </div>

        <StepIndicator current={step} />

        {/* ── Step 1: Input ── */}
        <div
          className={`transition-all duration-500 ${
            step === 1 ? "opacity-100 translate-y-0" : "opacity-0 pointer-events-none absolute"
          }`}
        >
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-sm">
            <h2 className="text-lg font-semibold text-white mb-1">Enter Your Agent ID</h2>
            <p className="text-xs text-slate-500 mb-6">
              Provide your agent ID to begin the certification process
            </p>

            {error && (
              <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                ⚠ {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  Agent ID <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  placeholder="e.g. 42"
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 transition"
                  onKeyDown={(e) => e.key === "Enter" && agentId.trim() && handleBeginRegistration()}
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  Wallet Address <span className="text-slate-600">(optional)</span>
                </label>
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 transition"
                />
              </div>

              <button
                onClick={handleBeginRegistration}
                disabled={!agentId.trim()}
                className="w-full rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:from-cyan-500 hover:to-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-900/30 mt-2"
              >
                Begin Registration →
              </button>
            </div>
          </div>
        </div>

        {/* ── Step 2: Testing ── */}
        {step === 2 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-sm">
            <div className="text-center mb-6">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/10 mb-4">
                <svg className="h-6 w-6 animate-spin text-cyan-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-white">Running Capability Tests…</h2>
              <p className="text-xs text-slate-500 mt-1">Verifying agent #{agentId} capabilities</p>
            </div>

            <div className="space-y-3">
              {tests.map((test, idx) => {
                const isRunning = tests.slice(0, idx).every((t) => t.passed) && !test.passed;
                return (
                  <div
                    key={test.name}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-500 ${
                      test.passed
                        ? "border-emerald-500/30 bg-emerald-500/10"
                        : isRunning
                        ? "border-cyan-500/30 bg-cyan-500/10"
                        : "border-white/[0.06] bg-white/[0.02]"
                    }`}
                  >
                    <span className="text-xl">{test.icon}</span>
                    <span
                      className={`flex-1 text-sm font-medium ${
                        test.passed
                          ? "text-emerald-300"
                          : isRunning
                          ? "text-cyan-300"
                          : "text-slate-500"
                      }`}
                    >
                      {test.name}
                    </span>
                    {test.passed ? (
                      <span className="text-emerald-400 font-bold">✓</span>
                    ) : isRunning ? (
                      <svg className="h-4 w-4 animate-spin text-cyan-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-5 rounded-xl bg-slate-900/50 px-4 py-3 text-xs text-slate-500 text-center">
              Connecting to 0G Network · Verifying on-chain identity
            </div>
          </div>
        )}

        {/* ── Step 3: Success ── */}
        {step === 3 && passport && (
          <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/30 to-cyan-950/20 p-8 backdrop-blur-sm">
            <div className="text-center mb-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 mb-4 shadow-lg shadow-emerald-500/10">
                <span className="text-3xl">🪪</span>
              </div>
              <h2 className="text-lg font-semibold text-white">Passport Issued!</h2>
              <p className="text-xs text-slate-400 mt-1">
                Agent #{passport.agentId} is now certified on-chain
              </p>
            </div>

            {/* Passport card */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 space-y-4 shadow-xl">
              {/* Status row */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 uppercase tracking-wider">Status</span>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${
                    passport.isActive
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-slate-500/30 bg-slate-500/10 text-slate-400"
                  }`}
                >
                  {passport.isActive ? "✓ Active" : "Inactive"}
                </span>
              </div>

              {/* Passport hash */}
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Passport Hash</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate font-mono text-xs text-cyan-300 bg-black/30 rounded-lg px-3 py-2 border border-white/5">
                    {passport.passportHash}
                  </code>
                  <CopyButton text={passport.passportHash} />
                </div>
              </div>

              {/* Certified at */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Certified At</p>
                  <p className="text-sm font-semibold text-slate-200">
                    {passport.certifiedAt
                      ? new Date(passport.certifiedAt * 1000).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Agent ID</p>
                  <p className="text-sm font-semibold text-indigo-300">#{passport.agentId}</p>
                </div>
              </div>

              {/* Shareable link */}
              {shareUrl && (
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Shareable Link</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 truncate font-mono text-xs text-slate-400 bg-black/30 rounded-lg px-3 py-2 border border-white/5">
                      {shareUrl}
                    </code>
                    <CopyButton text={shareUrl} />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => {
                  setStep(1);
                  setAgentId("");
                  setWalletAddress("");
                  setPassport(null);
                  setError(null);
                }}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-400 hover:bg-white/10 transition"
              >
                Register Another
              </button>
              <a
                href={`/agent/${passport.agentId}/profile`}
                className="flex-1 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:from-cyan-500 hover:to-indigo-500 transition"
              >
                View Agent →
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
