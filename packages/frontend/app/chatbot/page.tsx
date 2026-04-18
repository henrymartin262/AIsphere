"use client";

import { useState, useCallback, useEffect } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { useLang } from "../../contexts/LangContext";
import { apiGet, apiPost, apiDelete, setApiWalletAddress } from "../../lib/api";
import { useAgents } from "../../hooks/useAgent";
import type { Agent } from "../../types";

// ─── Types ────────────────────────────────────────────────────────────────────

type Platform = "telegram" | "feishu" | "wechat" | "wecom" | "slack" | "discord" | "whatsapp" | "line" | "matrix" | "teams";

interface ChatbotConfig {
  id: string;
  agentId: number;
  platform: Platform;
  name: string;
  webhookToken: string;
  webhookUrl: string;
  enabled: boolean;
  walletAddress: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
}

// ─── Platform registry ────────────────────────────────────────────────────────

const PLATFORM_META: Record<Platform, {
  name: string;
  emoji: string;
  color: string;
  bg: string;
  border: string;
  badge: string;
  fields: Array<{ key: string; label: string; placeholder: string; hint: string; secret: boolean }>;
  setupUrl: string;
  setupLabel: string;
  available: boolean;
}> = {
  telegram: {
    name: "Telegram",
    emoji: "✈️",
    color: "text-sky-500",
    bg: "bg-sky-50 dark:bg-sky-500/10",
    border: "border-sky-200 dark:border-sky-500/30",
    badge: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
    fields: [
      { key: "botToken", label: "Bot Token", placeholder: "1234567890:ABCDefGhIJKlmNoPQRsTUVwxyZ", hint: "Get from @BotFather → /newbot", secret: true },
    ],
    setupUrl: "https://t.me/BotFather",
    setupLabel: "@BotFather",
    available: true,
  },
  feishu: {
    name: "飞书 Feishu",
    emoji: "🪶",
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-500/10",
    border: "border-blue-200 dark:border-blue-500/30",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
    fields: [
      { key: "appId", label: "App ID", placeholder: "cli_xxxxxxxxxxxxxxxx", hint: "Feishu Open Platform → App credentials", secret: false },
      { key: "botToken", label: "App Secret", placeholder: "xxxxxxxxxxxxxxxx", hint: "Feishu Open Platform → App credentials", secret: true },
    ],
    setupUrl: "https://open.feishu.cn",
    setupLabel: "open.feishu.cn",
    available: true,
  },
  wecom: {
    name: "企业微信 WeCom",
    emoji: "💼",
    color: "text-green-600",
    bg: "bg-green-50 dark:bg-green-500/10",
    border: "border-green-200 dark:border-green-500/30",
    badge: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
    fields: [
      { key: "appId", label: "Corp ID (企业ID)", placeholder: "ww1234567890abcdef", hint: "企业微信管理后台 → 我的企业 → 企业ID", secret: false },
      { key: "botToken", label: "AgentSecret", placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", hint: "企业微信后台 → 应用管理 → 自建应用 → Secret", secret: true },
      { key: "appSecret", label: "Agent ID", placeholder: "1000001", hint: "企业微信后台 → 应用管理 → AgentId", secret: false },
    ],
    setupUrl: "https://work.weixin.qq.com",
    setupLabel: "work.weixin.qq.com",
    available: true,
  },
  wechat: {
    name: "微信 WeChat",
    emoji: "💬",
    color: "text-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
    border: "border-emerald-200 dark:border-emerald-500/30",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
    fields: [
      { key: "appId", label: "AppID", placeholder: "wx1234567890abcdef", hint: "微信公众平台 → 开发 → 基本配置 → AppID", secret: false },
      { key: "botToken", label: "AppSecret", placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", hint: "微信公众平台 → 开发 → 基本配置 → AppSecret", secret: true },
      { key: "appSecret", label: "Token (自定义)", placeholder: "自定义Token字符串", hint: "用于消息校验，可自行设置", secret: false },
    ],
    setupUrl: "https://mp.weixin.qq.com",
    setupLabel: "mp.weixin.qq.com",
    available: true,
  },
  discord: {
    name: "Discord",
    emoji: "🎮",
    color: "text-indigo-500",
    bg: "bg-indigo-50 dark:bg-indigo-500/10",
    border: "border-indigo-200 dark:border-indigo-500/30",
    badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300",
    fields: [
      { key: "botToken", label: "Bot Token", placeholder: "MTxxxxxxxx.Gyyyyy.zzzzzzzzzzzzzzzzzzzzzzz", hint: "Discord Developer Portal → Bot → Token", secret: true },
      { key: "appId", label: "Application ID", placeholder: "1234567890123456789", hint: "Discord Developer Portal → General Information", secret: false },
    ],
    setupUrl: "https://discord.com/developers",
    setupLabel: "discord.com/developers",
    available: true,
  },
  slack: {
    name: "Slack",
    emoji: "⚡",
    color: "text-yellow-500",
    bg: "bg-yellow-50 dark:bg-yellow-500/10",
    border: "border-yellow-200 dark:border-yellow-500/30",
    badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300",
    fields: [
      { key: "botToken", label: "Bot OAuth Token", placeholder: "xoxb-xxxxxxxxxxxx-xxxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx", hint: "Slack API → Your App → OAuth & Permissions → Bot Token", secret: true },
      { key: "appId", label: "Signing Secret", placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", hint: "Slack API → Your App → Basic Information → Signing Secret", secret: true },
    ],
    setupUrl: "https://api.slack.com/apps",
    setupLabel: "api.slack.com",
    available: true,
  },
  whatsapp: {
    name: "WhatsApp",
    emoji: "📱",
    color: "text-green-500",
    bg: "bg-green-50 dark:bg-green-500/10",
    border: "border-green-200 dark:border-green-500/30",
    badge: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
    fields: [
      { key: "botToken", label: "Access Token", placeholder: "EAAxxxxxxxxxxxxxxx", hint: "Meta Developer → WhatsApp → API Setup → Temporary Access Token", secret: true },
      { key: "appId", label: "Phone Number ID", placeholder: "1234567890123456", hint: "Meta Developer → WhatsApp → API Setup → Phone Number ID", secret: false },
      { key: "appSecret", label: "Verify Token", placeholder: "my_verify_token", hint: "Custom string for webhook verification", secret: false },
    ],
    setupUrl: "https://developers.facebook.com",
    setupLabel: "developers.facebook.com",
    available: true,
  },
  line: {
    name: "LINE",
    emoji: "🟢",
    color: "text-green-400",
    bg: "bg-green-50 dark:bg-green-500/10",
    border: "border-green-200 dark:border-green-500/30",
    badge: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
    fields: [
      { key: "botToken", label: "Channel Access Token", placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", hint: "LINE Developers → Messaging API → Channel Access Token", secret: true },
      { key: "appId", label: "Channel Secret", placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", hint: "LINE Developers → Messaging API → Channel Secret", secret: true },
    ],
    setupUrl: "https://developers.line.biz",
    setupLabel: "developers.line.biz",
    available: true,
  },
  matrix: {
    name: "Matrix",
    emoji: "🔷",
    color: "text-purple-500",
    bg: "bg-purple-50 dark:bg-purple-500/10",
    border: "border-purple-200 dark:border-purple-500/30",
    badge: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300",
    fields: [
      { key: "appId", label: "Homeserver URL", placeholder: "https://matrix.org", hint: "Your Matrix homeserver URL", secret: false },
      { key: "botToken", label: "Access Token", placeholder: "syt_xxxxxxxx_xxxxxxxx", hint: "Element → Settings → Help & About → Access Token", secret: true },
    ],
    setupUrl: "https://matrix.org",
    setupLabel: "matrix.org",
    available: true,
  },
  teams: {
    name: "Microsoft Teams",
    emoji: "🟦",
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-500/10",
    border: "border-blue-200 dark:border-blue-500/30",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
    fields: [
      { key: "appId", label: "App ID", placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", hint: "Azure Portal → App registrations → Application ID", secret: false },
      { key: "botToken", label: "App Password", placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", hint: "Azure Portal → App registrations → Certificates & Secrets", secret: true },
    ],
    setupUrl: "https://portal.azure.com",
    setupLabel: "portal.azure.com",
    available: true,
  },
};

// ─── Step 1: Agent picker ─────────────────────────────────────────────────────

function AgentPicker({ agents, selected, onSelect, isEn }: {
  agents: Agent[];
  selected: number | null;
  onSelect: (id: number) => void;
  isEn: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wide">
        {isEn ? "Step 1 · Choose Agent" : "第一步 · 选择 Agent"}
      </p>
      {agents.length === 0 ? (
        <div className="rounded-xl border border-gray-100 dark:border-white/10 p-6 text-center">
          <p className="text-sm text-slate-400">{isEn ? "No agents yet" : "还没有 Agent"}</p>
          <Link href="/agent/create" className="mt-2 inline-block text-xs text-indigo-500 hover:underline">
            {isEn ? "Create one →" : "创建 Agent →"}
          </Link>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {agents.map((a) => {
            const active = selected === a.agentId;
            return (
              <button key={a.agentId} onClick={() => onSelect(a.agentId)}
                className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                  active
                    ? "border-indigo-300 bg-indigo-50 dark:border-indigo-500/40 dark:bg-indigo-500/10"
                    : "border-gray-200 dark:border-white/10 hover:border-indigo-200 dark:hover:border-indigo-500/20 hover:bg-gray-50 dark:hover:bg-white/5"
                }`}>
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-sm font-bold ${
                  active ? "border-indigo-200 bg-indigo-100 text-indigo-600 dark:border-indigo-500/30 dark:bg-indigo-500/20 dark:text-indigo-300" : "border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-slate-400"
                }`}>
                  {(a.profile?.name ?? "A")[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-medium truncate ${active ? "text-indigo-700 dark:text-indigo-300" : "text-slate-700 dark:text-slate-300"}`}>
                    {a.profile?.name ?? `Agent #${a.agentId}`}
                  </p>
                  <p className="text-[10px] text-slate-400">#{a.agentId}</p>
                </div>
                {active && <span className="ml-auto text-indigo-500 shrink-0">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Step 2: Platform picker ──────────────────────────────────────────────────

function PlatformPicker({ selected, onSelect, isEn }: {
  selected: Platform | null;
  onSelect: (p: Platform) => void;
  isEn: boolean;
}) {
  const platforms = Object.entries(PLATFORM_META) as [Platform, typeof PLATFORM_META[Platform]][];
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wide">
        {isEn ? "Step 2 · Choose Platform" : "第二步 · 选择平台"}
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
        {platforms.map(([key, meta]) => {
          const active = selected === key;
          return (
            <button key={key} onClick={() => onSelect(key)}
              className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition ${
                active ? `${meta.border} ${meta.bg} ${meta.color}` : "border-gray-200 dark:border-white/10 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/5"
              }`}>
              <span className="text-xl">{meta.emoji}</span>
              <span className="text-[11px] font-medium leading-tight">{meta.name.split(" ")[0]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 3: Credentials form ─────────────────────────────────────────────────

function CredentialsForm({ platform, values, onChange, isEn }: {
  platform: Platform;
  values: Record<string, string>;
  onChange: (k: string, v: string) => void;
  isEn: boolean;
}) {
  const meta = PLATFORM_META[platform];
  const inputClass = "w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-600 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-400/10";
  const labelClass = "mb-1.5 block text-xs font-medium text-gray-500 dark:text-slate-400";

  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wide">
        {isEn ? "Step 3 · Configure Credentials" : "第三步 · 填写配置"}
      </p>
      <div className="space-y-3">
        <div>
          <label className={labelClass}>{isEn ? "Display Name *" : "显示名称 *"}</label>
          <input type="text" value={values.name ?? ""} onChange={(e) => onChange("name", e.target.value)}
            placeholder={isEn ? "e.g. My Telegram Bot" : "例如：我的 Telegram 机器人"} className={inputClass} />
        </div>
        {meta.fields.map((f) => (
          <div key={f.key}>
            <label className={labelClass}>{f.label}</label>
            <input type={f.secret ? "password" : "text"} value={values[f.key] ?? ""}
              onChange={(e) => onChange(f.key, e.target.value)}
              placeholder={f.placeholder} className={inputClass} />
            <p className="mt-1 text-[10px] text-gray-400 dark:text-slate-500">
              {f.hint} ·{" "}
              <a href={meta.setupUrl} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">
                {meta.setupLabel} ↗
              </a>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Create Wizard Modal ──────────────────────────────────────────────────────

function CreateWizardModal({ agents, address, isEn, onClose, onCreated }: {
  agents: Agent[];
  address: string;
  isEn: boolean;
  onClose: () => void;
  onCreated: (config: ChatbotConfig) => void;
}) {
  const [agentId, setAgentId] = useState<number | null>(agents[0]?.agentId ?? null);
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [created, setCreated] = useState<ChatbotConfig | null>(null);
  const [copied, setCopied] = useState(false);

  const step = !agentId ? 1 : !platform ? 2 : !created ? 3 : 4;

  function handleChange(k: string, v: string) {
    setValues((prev) => ({ ...prev, [k]: v }));
  }

  async function handleCreate() {
    if (!agentId || !platform || !values.name?.trim()) return;
    setSaving(true);
    setErr(null);
    try {
      setApiWalletAddress(address);
      const data = await apiPost<{ data: ChatbotConfig }>("/chatbot", {
        agentId,
        platform,
        name: values.name.trim(),
        botToken: values.botToken?.trim() || undefined,
        appId: values.appId?.trim() || undefined,
        appSecret: values.appSecret?.trim() || undefined,
        walletAddress: address,
      });
      const config = (data as { data?: ChatbotConfig }).data ?? data as unknown as ChatbotConfig;
      setCreated(config);
      onCreated(config);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to create bot");
    } finally {
      setSaving(false);
    }
  }

  function copyWebhook() {
    if (created) {
      navigator.clipboard.writeText(created.webhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const canCreate = agentId && platform && values.name?.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-gray-100 dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl flex flex-col max-h-[92vh]"
           onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-800 dark:text-white">
              {step === 4 ? (isEn ? "🎉 Bot Connected!" : "🎉 Bot 接入成功！") : (isEn ? "Connect a Bot" : "接入 Bot")}
            </h2>
            {step < 4 && (
              <div className="flex items-center gap-1 mt-1">
                {[1,2,3].map((s) => (
                  <div key={s} className={`h-1 rounded-full transition-all ${s <= step ? "w-8 bg-indigo-500" : "w-4 bg-gray-200 dark:bg-white/10"}`} />
                ))}
              </div>
            )}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
          {step === 4 && created ? (
            // Success state
            <div className="space-y-4">
              <div className={`rounded-2xl border ${PLATFORM_META[created.platform].border} ${PLATFORM_META[created.platform].bg} p-5`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{PLATFORM_META[created.platform].emoji}</span>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-white">{created.name}</p>
                    <p className={`text-xs ${PLATFORM_META[created.platform].color}`}>{PLATFORM_META[created.platform].name}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                  {isEn ? "Copy your webhook URL and paste it into your bot settings:" : "复制 Webhook 地址，粘贴到机器人配置中："}
                </p>
                <div className="flex items-center gap-2 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-3">
                  <code className="flex-1 text-[11px] font-mono text-indigo-600 dark:text-indigo-300 break-all">{created.webhookUrl}</code>
                  <button onClick={copyWebhook}
                    className="shrink-0 rounded-lg border border-gray-200 dark:border-white/10 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/5 transition">
                    {copied ? "✓ Copied" : isEn ? "Copy" : "复制"}
                  </button>
                </div>
              </div>
              <div className="rounded-xl border border-gray-100 dark:border-white/10 p-4">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase">
                  {isEn ? "Next steps" : "下一步"}
                </p>
                <ol className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <li className="flex gap-2"><span>1.</span>{isEn ? `Go to ${PLATFORM_META[created.platform].setupLabel}` : `前往 ${PLATFORM_META[created.platform].setupLabel}`}</li>
                  <li className="flex gap-2"><span>2.</span>{isEn ? "Find the Webhook / Event Subscription settings" : "找到 Webhook / 事件订阅配置"}</li>
                  <li className="flex gap-2"><span>3.</span>{isEn ? "Paste the webhook URL above" : "粘贴上方 Webhook 地址"}</li>
                  <li className="flex gap-2"><span>4.</span>{isEn ? "Start chatting with your agent!" : "开始与 Agent 对话！"}</li>
                </ol>
              </div>
            </div>
          ) : (
            <>
              <AgentPicker agents={agents} selected={agentId} onSelect={setAgentId} isEn={isEn} />
              {agentId && <PlatformPicker selected={platform} onSelect={(p) => { setPlatform(p); setValues({}); }} isEn={isEn} />}
              {agentId && platform && (
                <CredentialsForm platform={platform} values={values} onChange={handleChange} isEn={isEn} />
              )}
              {err && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">{err}</p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-white/10 shrink-0 flex gap-2 justify-end">
          <button onClick={onClose} className="rounded-xl border border-gray-200 dark:border-white/10 px-4 py-2 text-sm text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/5 transition">
            {step === 4 ? (isEn ? "Done" : "完成") : (isEn ? "Cancel" : "取消")}
          </button>
          {step < 4 && (
            <button onClick={handleCreate} disabled={!canCreate || saving}
              className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed">
              {saving ? (isEn ? "Connecting..." : "接入中...") : (isEn ? "Connect Bot" : "接入 Bot")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Bot Card ─────────────────────────────────────────────────────────────────

function BotCard({ config, agentName, isEn, onDeleted, address }: {
  config: ChatbotConfig;
  agentName: string;
  isEn: boolean;
  onDeleted: () => void;
  address: string;
}) {
  const meta = PLATFORM_META[config.platform] ?? PLATFORM_META.telegram;
  const [showWebhook, setShowWebhook] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [enabled, setEnabled] = useState(config.enabled);
  const [toggling, setToggling] = useState(false);

  function copyWebhook() {
    navigator.clipboard.writeText(config.webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleToggle() {
    setToggling(true);
    try {
      setApiWalletAddress(address);
      await apiPost(`/chatbot/${config.id}`, { walletAddress: address, enabled: !enabled });
      setEnabled(!enabled);
    } catch { /* ignore */ } finally { setToggling(false); }
  }

  async function handleDelete() {
    if (!confirm(isEn ? `Delete "${config.name}"?` : `删除"${config.name}"？`)) return;
    setDeleting(true);
    try {
      setApiWalletAddress(address);
      await apiDelete(`/chatbot/${config.id}`, { walletAddress: address });
      onDeleted();
    } catch { /* ignore */ } finally { setDeleting(false); }
  }

  return (
    <div className={`card p-5 border-l-4 ${meta.border}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl ${meta.bg}`}>
            {meta.emoji}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-white">{config.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className={`text-[10px] rounded-md px-1.5 font-medium ${meta.badge}`}>{meta.name}</span>
              <span className="text-[10px] text-slate-400">→ {agentName}</span>
            </div>
          </div>
        </div>
        <button onClick={handleToggle} disabled={toggling}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
            enabled ? "bg-emerald-400 dark:bg-emerald-500" : "bg-gray-200 dark:bg-white/20"
          }`}>
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${enabled ? "translate-x-4" : "translate-x-0"}`} />
        </button>
      </div>

      <div className="flex items-center gap-4 mb-3 text-[11px] text-slate-400">
        <span>💬 {config.messageCount} {isEn ? "msg" : "条"}</span>
        <span>📅 {new Date(config.createdAt).toLocaleDateString()}</span>
        <span className={enabled ? "text-emerald-500" : "text-gray-400"}>
          {enabled ? (isEn ? "● Active" : "● 运行中") : (isEn ? "○ Paused" : "○ 已暂停")}
        </span>
      </div>

      <button onClick={() => setShowWebhook(!showWebhook)}
        className="text-[11px] text-indigo-500 dark:text-indigo-400 flex items-center gap-1 hover:text-indigo-600">
        <svg className={`h-3 w-3 transition-transform ${showWebhook ? "rotate-90" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M9 5l7 7-7 7"/></svg>
        Webhook URL
      </button>

      {showWebhook && (
        <div className="mt-2 rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-3">
          <div className="flex items-center gap-2">
            <code className="flex-1 text-[10px] font-mono text-indigo-600 dark:text-indigo-300 break-all">{config.webhookUrl}</code>
            <button onClick={copyWebhook}
              className="shrink-0 rounded-lg border border-gray-200 dark:border-white/10 px-2 py-1 text-[10px] text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 transition">
              {copied ? "✓" : isEn ? "Copy" : "复制"}
            </button>
          </div>
        </div>
      )}

      <div className="mt-3 flex justify-end">
        <button onClick={handleDelete} disabled={deleting}
          className="text-[11px] text-gray-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition">
          {deleting ? "..." : (isEn ? "Delete" : "删除")}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ChatbotPage() {
  const { address, isConnected } = useAccount();
  const { lang } = useLang();
  const isEn = lang === "en";
  const { agents } = useAgents(address);

  const [configs, setConfigs] = useState<ChatbotConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const fetchConfigs = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      setApiWalletAddress(address);
      const data = await apiGet<{ data: ChatbotConfig[] }>("/chatbot", { walletAddress: address });
      const arr = Array.isArray(data) ? data : (data as { data?: ChatbotConfig[] }).data ?? [];
      setConfigs(arr);
    } catch { setConfigs([]); } finally { setLoading(false); }
  }, [address]);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

  function getAgentName(agentId: number) {
    const a = agents.find((ag) => ag.agentId === agentId);
    return a?.profile?.name ?? `Agent #${agentId}`;
  }

  if (!isConnected) {
    return (
      <main className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-6 px-6 py-20 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-500/10 dark:to-violet-500/10">
          <svg className="h-10 w-10 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
          {isEn ? "Connect Your Agent to Messaging Apps" : "将 Agent 接入即时通讯"}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-md text-sm">
          {isEn
            ? "Support Telegram, WeChat, WeCom, Discord, Slack, WhatsApp, LINE, Feishu and more."
            : "支持 Telegram、微信、企业微信、Discord、Slack、WhatsApp、LINE、飞书等 10 大平台。"}
        </p>
        <ConnectButton />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      {/* Header */}
      <section className="animate-slide-up card-gradient relative overflow-hidden p-8 md:p-10 mb-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-sky-400/[0.06] blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-indigo-400/[0.05] blur-[60px]" />
        <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <span className="badge">{isEn ? "Chatbot Integration" : "Bot 接入"}</span>
            <h1 className="mt-4 text-2xl font-bold text-slate-800 dark:text-white md:text-3xl">
              {isEn ? "Chat Anywhere with Your " : "随时随地与 "}
              <span className="text-gradient">{isEn ? "AI Agent" : "AI Agent 对话"}</span>
            </h1>
            <p className="mt-2 max-w-xl text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              {isEn
                ? "Connect your agents to 10+ platforms — Telegram, WeChat, WeCom, Discord, Slack, WhatsApp, LINE, Feishu, Matrix, Teams."
                : "将 Agent 接入 10+ 平台——Telegram、微信、企业微信、Discord、Slack、WhatsApp、LINE、飞书、Matrix、Teams。"}
            </p>
            {/* Platform icons strip */}
            <div className="flex flex-wrap gap-2 mt-3">
              {(Object.entries(PLATFORM_META) as [Platform, typeof PLATFORM_META[Platform]][]).map(([key, meta]) => (
                <span key={key} title={meta.name} className={`rounded-lg border px-2 py-0.5 text-sm ${meta.border} ${meta.bg}`}>
                  {meta.emoji}
                </span>
              ))}
            </div>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary shrink-0 flex items-center gap-2">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M12 4v16m8-8H4"/></svg>
            {isEn ? "Connect Bot" : "接入 Bot"}
          </button>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        {[
          { label: isEn ? "Connected" : "已接入", value: configs.length, icon: "🤖" },
          { label: isEn ? "Active" : "运行中", value: configs.filter(c => c.enabled).length, icon: "✅" },
          { label: isEn ? "Messages" : "消息数", value: configs.reduce((s, c) => s + c.messageCount, 0), icon: "💬" },
          { label: isEn ? "Platforms" : "平台数", value: new Set(configs.map(c => c.platform)).size, icon: "🔗" },
        ].map((s) => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <span className="text-2xl">{s.icon}</span>
            <div>
              <p className="text-lg font-bold text-slate-800 dark:text-white">{s.value}</p>
              <p className="text-xs text-slate-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bot list */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800 dark:text-white">
            {isEn ? "Your Bots" : "已接入的 Bot"}
          </h2>
        </div>

        {loading && (
          <div className="grid gap-3 sm:grid-cols-2">
            {[1, 2].map((n) => <div key={n} className="animate-pulse card h-36" />)}
          </div>
        )}

        {!loading && configs.length === 0 && (
          <div className="card flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex gap-2 text-4xl">
              {(["telegram","feishu","wecom","wechat","discord"] as Platform[]).map(p => (
                <span key={p}>{PLATFORM_META[p].emoji}</span>
              ))}
            </div>
            <p className="text-base font-medium text-slate-700 dark:text-slate-300 mt-2">
              {isEn ? "No bots connected yet" : "还没有接入任何 Bot"}
            </p>
            <p className="text-sm text-slate-400 max-w-xs">
              {isEn
                ? "Connect your agent to a messaging platform and start chatting from anywhere."
                : "将 Agent 接入即时通讯平台，随时随地开始对话。"}
            </p>
            <button onClick={() => setShowCreate(true)} className="btn-primary mt-2">
              {isEn ? "+ Connect Bot" : "+ 接入 Bot"}
            </button>
          </div>
        )}

        {!loading && configs.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {configs.map((config) => (
              <BotCard key={config.id} config={config} agentName={getAgentName(config.agentId)}
                isEn={isEn} onDeleted={fetchConfigs} address={address!} />
            ))}
          </div>
        )}
      </div>

      {/* Create wizard */}
      {showCreate && (
        <CreateWizardModal
          agents={agents}
          address={address!}
          isEn={isEn}
          onClose={() => setShowCreate(false)}
          onCreated={(cfg) => {
            setConfigs((prev) => [...prev, cfg]);
            setShowCreate(false);
          }}
        />
      )}
    </main>
  );
}
