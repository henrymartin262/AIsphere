"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { useLang } from "../../contexts/LangContext";
import { apiGet, apiPost, setApiWalletAddress } from "../../lib/api";

/* ── Types ── */
interface OpenClawSkill {
  id: string;
  name: string;
  description: string;
  handler: string;
}

interface OpenClawAgent {
  agentId: string;
  sealMindTokenId: number;
  workspace: string;
  skills: OpenClawSkill[];
  createdAt: number;
}

interface OpenClawStatus {
  registered: boolean;
  agentCount: number;
  skillCount: number;
  taskQueue: number;
  pipelineCount: number;
  builtInSkills: string[];
}

/* ── Skill Badge Colors ── */
const SKILL_COLORS: Record<string, string> = {
  "sealed-inference":     "bg-indigo-50 text-indigo-600 border-indigo-200/60",
  "memory-recall":        "bg-violet-50 text-violet-600 border-violet-200/60",
  "decision-audit":       "bg-amber-50 text-amber-600 border-amber-200/60",
  "multi-agent-delegate": "bg-cyan-50 text-cyan-600 border-cyan-200/60",
  "context-builder":      "bg-emerald-50 text-emerald-600 border-emerald-200/60",
};

function getSkillColor(id: string): string {
  return SKILL_COLORS[id] ?? "bg-gray-50 text-gray-600 border-gray-200/60";
}

/* ── Step indicator for onchain-register flow ── */
function StepDot({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  return (
    <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold border transition-all ${
      done  ? "border-emerald-500 bg-emerald-500 text-white"
            : active ? "border-indigo-500 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20"
            : "border-gray-200 bg-gray-50 text-gray-400 dark:border-white/10 dark:bg-white/5"
    }`}>
      {done ? "✓" : n}
    </div>
  );
}

export default function OpenClawPage() {
  const { t } = useLang();
  const isEn = t("nav_home") === "Home";
  const { address, isConnected } = useAccount();

  const [status, setStatus] = useState<OpenClawStatus | null>(null);
  const [skills, setSkills] = useState<OpenClawSkill[]>([]);
  const [agents, setAgents] = useState<OpenClawAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"journey" | "skills" | "agents">("journey");

  // Register Agent form
  const [regTokenId, setRegTokenId] = useState("");
  const [regName, setRegName] = useState("");
  const [registering, setRegistering] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // Onchain registration flow steps (1-3)
  const [regStep, setRegStep] = useState<1 | 2 | 3>(1);
  const [storageSync, setStorageSync] = useState(true);

  /* ── Fetch data ── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statusData, skillsData, agentsData] = await Promise.all([
        apiGet<OpenClawStatus>("/openclaw/status"),
        apiGet<OpenClawSkill[]>("/openclaw/skills"),
        apiGet<OpenClawAgent[]>("/openclaw/agents"),
      ]);
      setStatus(statusData);
      setSkills(Array.isArray(skillsData) ? skillsData : []);
      setAgents(Array.isArray(agentsData) ? agentsData : []);
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Register Agent ── */
  const handleRegister = useCallback(async () => {
    const tokenId = parseInt(regTokenId, 10);
    if (isNaN(tokenId) || !regName.trim()) return;
    setRegistering(true);
    try {
      if (address) setApiWalletAddress(address);
      await apiPost("/openclaw/agents", {
        sealMindTokenId: tokenId,
        agentName: regName,
        storageSync,
        walletAddress: address ?? "",
      });
      setRegisterSuccess(true);
      setRegStep(3);
      fetchData();
    } catch (err) {
      console.error("Register failed:", err);
    } finally {
      setRegistering(false);
    }
  }, [regTokenId, regName, fetchData, address, storageSync]);

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">

      {/* ── Hero Header ── */}
      <section className="animate-slide-up card-gradient relative overflow-hidden p-8 md:p-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-cyan-400/[0.06] blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-indigo-400/[0.05] blur-[60px]" />
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="badge">OpenClaw × AIsphere</span>
            <h1 className="mt-3 text-2xl font-bold text-slate-800 dark:text-white md:text-3xl">
              {isEn ? "Bring Your Agent " : "让你的 Agent "}
              <span className="text-gradient">{isEn ? "On-Chain" : "上链"}</span>
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500 leading-relaxed dark:text-slate-400">
              {isEn
                ? "Already have an OpenClaw agent? Register it on 0G Network to get a verifiable on-chain identity, encrypted memory backup, and a living Soul — without leaving your existing tools."
                : "已经有 OpenClaw Agent？将它注册到 0G Network，获得链上可验证身份、加密记忆备份和 Living Soul —— 无需放弃现有工具。"}
            </p>
          </div>
          {status && (
            <div className="shrink-0 flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 dark:border-white/10 dark:bg-white/5">
              <span className={`h-2 w-2 rounded-full ${status.registered ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-amber-400"}`} />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                {status.registered
                  ? (isEn ? "Connected" : "已连接")
                  : (isEn ? "Standby" : "待激活")}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* ── Value Props Row ── */}
      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: "⛓",
            title: isEn ? "On-Chain Identity" : "链上身份",
            desc: isEn ? "Mint an INFT on 0G Network. Your agent gains a permanent, verifiable identity." : "在 0G Network 铸造 INFT，Agent 获得永久可验证的链上身份。",
            color: "border-indigo-200/60 bg-indigo-50/40 dark:border-indigo-400/20 dark:bg-indigo-500/5",
          },
          {
            icon: "☁️",
            title: isEn ? "0G Storage Cloud" : "0G 存储云盘",
            desc: isEn ? "Like GitHub for your agent. Config, memories, and history — encrypted, yours forever." : "Agent 的 GitHub。配置、记忆、历史记录——加密存储，永远属于你。",
            color: "border-cyan-200/60 bg-cyan-50/40 dark:border-cyan-400/20 dark:bg-cyan-500/5",
          },
          {
            icon: "🧬",
            title: isEn ? "Living Soul" : "Living Soul",
            desc: isEn ? "Every inference enriches your agent's Soul — a growing, on-chain personality." : "每次推理都为 Agent 的 Soul 增添经验，构建链上成长人格。",
            color: "border-violet-200/60 bg-violet-50/40 dark:border-violet-400/20 dark:bg-violet-500/5",
          },
        ].map((v) => (
          <div key={v.title} className={`rounded-2xl border p-5 ${v.color}`}>
            <div className="text-2xl">{v.icon}</div>
            <h3 className="mt-2 text-sm font-semibold text-slate-800 dark:text-white">{v.title}</h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed dark:text-slate-400">{v.desc}</p>
          </div>
        ))}
      </section>

      {/* ── Tabs ── */}
      {!loading && (
        <>
          <div className="mt-8 flex items-center gap-1 rounded-full border border-gray-100 bg-gray-50/60 p-1 w-fit dark:border-white/8 dark:bg-white/5">
            {[
              { key: "journey" as const, label: isEn ? "⛓ Register" : "⛓ 上链注册" },
              { key: "skills"  as const, label: isEn ? "⚡ Skills"    : "⚡ 技能" },
              { key: "agents"  as const, label: isEn ? "🤖 My Agents" : "🤖 我的 Agent" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? "bg-white text-indigo-600 shadow-sm dark:bg-white/10 dark:text-indigo-300"
                    : "text-gray-500 hover:text-gray-800 hover:bg-white/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ══ Tab: Journey (Onchain Registration) ══ */}
          {activeTab === "journey" && (
            <section className="mt-6 animate-slide-up grid gap-6 lg:grid-cols-2">

              {/* Left: Step-by-step guide */}
              <div className="card p-6">
                <h2 className="text-base font-semibold text-slate-800 dark:text-white">
                  {isEn ? "Two-Phase On-Chain Integration" : "两阶段链上集成方案"}
                </h2>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  {isEn
                    ? "Phase 1 runs once. Phase 2 runs on every inference."
                    : "第一阶段只运行一次，第二阶段在每次推理时自动触发。"}
                </p>

                <div className="mt-5 space-y-4">
                  {/* Phase 1 */}
                  <div className="rounded-xl border border-indigo-200/60 bg-indigo-50/40 p-4 dark:border-indigo-400/20 dark:bg-indigo-500/5">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white">1</span>
                      <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                        {isEn ? "On-Chain Registration Skill" : "上链注册 Skill（一次性）"}
                      </span>
                    </div>
                    <ul className="mt-3 space-y-1.5 text-xs text-indigo-600/80 dark:text-indigo-400/80">
                      {(isEn ? [
                        "🔑 Bind EVM wallet address",
                        "⚡ Initialize 0G Compute account",
                        "🪙 Mint INFT — chain identity",
                        "🧬 Generate Living Soul",
                        "☁️ Configure 0G Storage backup",
                      ] : [
                        "🔑 绑定 EVM 钱包地址",
                        "⚡ 初始化 0G Compute 账户",
                        "🪙 铸造 INFT — 链上身份",
                        "🧬 生成 Living Soul",
                        "☁️ 配置 0G Storage 云盘备份",
                      ]).map((step) => (
                        <li key={step} className="flex items-start gap-2">
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center text-slate-300 dark:text-slate-700">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {/* Phase 2 */}
                  <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/40 p-4 dark:border-emerald-400/20 dark:bg-emerald-500/5">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">2</span>
                      <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                        {isEn ? "On-Chain Activity Skill" : "链上活动 Skill（每次推理）"}
                      </span>
                    </div>
                    <ul className="mt-3 space-y-1.5 text-xs text-emerald-600/80 dark:text-emerald-400/80">
                      {(isEn ? [
                        "⛓ Record inference proof on DecisionChain",
                        "☁️ Sync memory to 0G Storage (encrypted)",
                        "🧬 Update Soul with experience",
                      ] : [
                        "⛓ 推理证明写入 DecisionChain",
                        "☁️ 记忆同步到 0G Storage（加密）",
                        "🧬 Soul 经验值更新",
                      ]).map((step) => (
                        <li key={step} className="flex items-start gap-2">
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Note */}
                <div className="mt-4 rounded-xl border border-amber-200/60 bg-amber-50/40 px-4 py-3 dark:border-amber-400/20 dark:bg-amber-500/5">
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    <span className="font-semibold">📌 {isEn ? "Note" : "注意"}：</span>
                    {isEn
                      ? " Migrated agents are marked as non-transferable. They cannot be sold on the AIsphere marketplace."
                      : " 迁移的 Agent 标记为不可转让，不能在 AIsphere 市场中出售。"}
                  </p>
                </div>
              </div>

              {/* Right: Registration form */}
              <div className="card p-6">
                <h2 className="text-base font-semibold text-slate-800 dark:text-white">
                  {isEn ? "Register Your OpenClaw Agent" : "注册你的 OpenClaw Agent"}
                </h2>

                {!isConnected ? (
                  <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-dashed border-gray-200 py-10 text-center dark:border-white/10">
                    <span className="text-3xl">🔌</span>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {isEn ? "Connect your wallet first" : "请先连接钱包"}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {isEn ? "Wallet connection required for on-chain operations" : "链上操作需要钱包连接"}
                    </p>
                  </div>
                ) : registerSuccess ? (
                  <div className="mt-6 flex flex-col items-center gap-4 rounded-xl border border-emerald-200 bg-emerald-50 py-10 text-center dark:border-emerald-400/20 dark:bg-emerald-500/5">
                    <span className="text-4xl">🎉</span>
                    <div>
                      <p className="font-semibold text-emerald-700 dark:text-emerald-300">
                        {isEn ? "Agent On-Chain!" : "Agent 已上链！"}
                      </p>
                      <p className="mt-1 text-xs text-emerald-600/80 dark:text-emerald-400/80">
                        {isEn
                          ? "Your agent now has an on-chain identity. The Activity Skill will record every inference automatically."
                          : "你的 Agent 现在拥有链上身份，后续每次推理将自动记录到链上。"}
                      </p>
                    </div>
                    <button
                      onClick={() => { setRegisterSuccess(false); setRegStep(1); setRegTokenId(""); setRegName(""); }}
                      className="text-xs text-emerald-600 underline"
                    >
                      {isEn ? "Register another" : "再注册一个"}
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 space-y-4">
                    {/* Step 1: Wallet info */}
                    <div className={`rounded-xl border p-4 transition-all ${regStep === 1 ? "border-indigo-200 bg-indigo-50/40 dark:border-indigo-400/20 dark:bg-indigo-500/5" : "border-gray-100 dark:border-white/[0.06]"}`}>
                      <div className="flex items-center gap-2 mb-3">
                        <StepDot n={1} active={regStep === 1} done={regStep > 1} />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {isEn ? "Wallet Confirmed" : "钱包已确认"}
                        </span>
                      </div>
                      <div className="rounded-lg bg-white border border-gray-100 px-3 py-2 font-mono text-xs text-slate-500 dark:bg-white/5 dark:border-white/[0.06] dark:text-slate-400 break-all">
                        {address}
                      </div>
                      {regStep === 1 && (
                        <button onClick={() => setRegStep(2)} className="btn-primary mt-3 text-xs py-1.5 px-4">
                          {isEn ? "Confirm & Continue" : "确认并继续"}
                        </button>
                      )}
                    </div>

                    {/* Step 2: Agent info + storage */}
                    <div className={`rounded-xl border p-4 transition-all ${regStep === 2 ? "border-indigo-200 bg-indigo-50/40 dark:border-indigo-400/20 dark:bg-indigo-500/5" : "border-gray-100 dark:border-white/[0.06]"}`}>
                      <div className="flex items-center gap-2 mb-3">
                        <StepDot n={2} active={regStep === 2} done={regStep > 2} />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {isEn ? "Agent Info & Storage" : "Agent 信息与存储配置"}
                        </span>
                      </div>
                      {regStep >= 2 && (
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                              {isEn ? "AIsphere INFT Token ID" : "AIsphere INFT Token ID"}
                            </label>
                            <input
                              type="number"
                              value={regTokenId}
                              onChange={(e) => setRegTokenId(e.target.value)}
                              placeholder={isEn ? "e.g. 8" : "例如：8"}
                              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-indigo-400/50"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                              {isEn ? "OpenClaw Workspace Name" : "OpenClaw Workspace 名称"}
                            </label>
                            <input
                              type="text"
                              value={regName}
                              onChange={(e) => setRegName(e.target.value)}
                              placeholder={isEn ? "e.g. my-research-agent" : "例如：research-agent"}
                              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-indigo-400/50"
                            />
                          </div>
                          {/* Storage sync toggle */}
                          <div className="flex items-center justify-between rounded-xl border border-cyan-200/60 bg-cyan-50/40 px-4 py-3 dark:border-cyan-400/20 dark:bg-cyan-500/5">
                            <div>
                              <p className="text-xs font-medium text-cyan-700 dark:text-cyan-300">
                                ☁️ {isEn ? "Sync to 0G Storage" : "同步到 0G Storage"}
                              </p>
                              <p className="text-[10px] text-cyan-600/70 dark:text-cyan-400/70 mt-0.5">
                                {isEn
                                  ? "Back up agent config & memories to your personal 0G cloud"
                                  : "将 Agent 配置和记忆备份到你的 0G 个人云盘"}
                              </p>
                            </div>
                            <button
                              onClick={() => setStorageSync((v) => !v)}
                              className={`relative h-6 w-11 rounded-full transition-colors ${storageSync ? "bg-cyan-500" : "bg-gray-200 dark:bg-white/20"}`}
                            >
                              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${storageSync ? "translate-x-5" : "translate-x-0.5"}`} />
                            </button>
                          </div>
                          <button
                            onClick={handleRegister}
                            disabled={registering || !regTokenId.trim() || !regName.trim()}
                            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {registering
                              ? (isEn ? "Registering on-chain..." : "链上注册中...")
                              : (isEn ? "⛓ Register On-Chain" : "⛓ 立即上链注册")}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ══ Tab: Skills ══ */}
          {activeTab === "skills" && (
            <section className="mt-6 animate-slide-up">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-slate-800 dark:text-white">
                  {isEn ? "Available Skills" : "可用技能列表"}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isEn
                    ? "AIsphere native capabilities exposed as OpenClaw Skills"
                    : "AIsphere 原生能力作为 OpenClaw Skills 暴露，可在任何兼容平台调用"}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {skills.map((skill) => (
                  <div key={skill.id} className="card group p-5 transition-all hover:border-indigo-200 dark:hover:border-indigo-400/30">
                    <div className="flex items-start justify-between">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${getSkillColor(skill.id)}`}>
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-600">{skill.handler}</span>
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors dark:text-white dark:group-hover:text-indigo-300">{skill.name}</h3>
                    <p className="mt-1 text-xs text-slate-400 leading-relaxed">{skill.description}</p>
                    <div className="mt-3 flex items-center gap-1.5">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      <span className="text-[10px] text-emerald-600 font-medium dark:text-emerald-400">{isEn ? "Active" : "已激活"}</span>
                    </div>
                  </div>
                ))}
                {skills.length === 0 && (
                  <div className="col-span-3 flex flex-col items-center gap-3 py-16 text-center">
                    <p className="text-sm text-slate-400">{isEn ? "No skills registered yet" : "暂无已注册技能"}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ══ Tab: My Agents ══ */}
          {activeTab === "agents" && (
            <section className="mt-6 animate-slide-up space-y-4">
              {agents.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-20 text-center">
                  <span className="text-5xl">🤖</span>
                  <div>
                    <p className="text-base font-medium text-slate-800 dark:text-white">
                      {isEn ? "No agents registered yet" : "暂无已注册 Agent"}
                    </p>
                    <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                      {isEn
                        ? 'Go to the "Register" tab to bring your OpenClaw agent on-chain.'
                        : '前往「上链注册」Tab 将你的 OpenClaw Agent 上链。'}
                    </p>
                  </div>
                  <button onClick={() => setActiveTab("journey")} className="btn-primary">
                    {isEn ? "⛓ Register Now" : "⛓ 立即注册"}
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {agents.map((agent) => (
                    <div key={agent.agentId} className="card p-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-200/60 bg-gradient-to-br from-cyan-50 to-indigo-50 dark:border-cyan-400/20 dark:from-cyan-500/10 dark:to-indigo-500/10">
                          <svg className="h-6 w-6 text-cyan-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2}>
                            <rect x="3" y="3" width="18" height="18" rx="4" />
                            <circle cx="12" cy="10" r="3" />
                            <path d="M7 20c0-2.8 2.2-5 5-5s5 2.2 5 5" strokeLinecap="round" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate dark:text-white">{agent.workspace}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[10px] text-slate-400 font-mono">INFT #{agent.sealMindTokenId}</p>
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/60 bg-amber-50 px-1.5 py-0.5 text-[9px] font-medium text-amber-600 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-400">
                              {isEn ? "Non-transferable" : "不可转让"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {agent.skills.map((skill) => (
                          <span key={skill.id} className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[9px] font-medium ${getSkillColor(skill.id)}`}>
                            {skill.id}
                          </span>
                        ))}
                      </div>
                      <p className="mt-2 text-[10px] text-slate-400 font-mono">
                        {isEn ? "Registered" : "注册时间"}：{new Date(agent.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-gray-50 border border-gray-100 dark:border-white/[0.06] dark:bg-white/5" />
          ))}
        </div>
      )}
    </main>
  );
}
