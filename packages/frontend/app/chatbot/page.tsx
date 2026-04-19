"use client";

import { useState, useCallback, useEffect } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { useLang } from "../../contexts/LangContext";
import { apiGet, apiPost, apiDelete, setApiWalletAddress } from "../../lib/api";
import { useAgents } from "../../hooks/useAgent";
import type { Agent } from "../../types";

// ─── Brand SVG Icons ─────────────────────────────────────────────────────────

const Icons = {
  telegram: (
    <svg viewBox="0 0 24 24" fill="#26A5E4" className="h-6 w-6">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  ),
  feishu: (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
      <rect width="24" height="24" rx="6" fill="#3370FF"/>
      <path d="M7 12.5L10.5 9 14 12.5 10.5 16 7 12.5Z" fill="white"/>
      <path d="M11 8.5L14.5 5 18 8.5 14.5 12 11 8.5Z" fill="white" opacity="0.7"/>
      <path d="M11 16.5L14.5 13 18 16.5 14.5 20 11 16.5Z" fill="white" opacity="0.7"/>
    </svg>
  ),
  wechat: (
    <svg viewBox="0 0 24 24" fill="#07C160" className="h-6 w-6">
      <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.295.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.81-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.6-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-7.063-6.122zm-3.89 3.499c.535 0 .969.44.969.983a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.983.969-.983zm3.812 0c.535 0 .969.44.969.983a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.983.969-.983z"/>
    </svg>
  ),
  wecom: (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
      <rect width="24" height="24" rx="5" fill="#0082EF"/>
      <path d="M5 8.5C5 7.12 6.12 6 7.5 6h9C17.88 6 19 7.12 19 8.5v7C19 16.88 17.88 18 16.5 18h-9C6.12 18 5 16.88 5 15.5v-7z" fill="white" opacity="0.15"/>
      <path d="M8 10.5l4 3 4-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="8" y="9" width="8" height="6" rx="1" stroke="white" strokeWidth="1.5" fill="none"/>
    </svg>
  ),
  discord: (
    <svg viewBox="0 0 24 24" fill="#5865F2" className="h-6 w-6">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.003.024.015.046.03.06a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  ),
  slack: (
    <svg viewBox="0 0 24 24" className="h-6 w-6">
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#E01E5A"/>
    </svg>
  ),
  whatsapp: (
    <svg viewBox="0 0 24 24" fill="#25D366" className="h-6 w-6">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
    </svg>
  ),
  line: (
    <svg viewBox="0 0 24 24" fill="#00B900" className="h-6 w-6">
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
    </svg>
  ),
  matrix: (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
      <path d="M.632.55v22.9H2.28V24H0V0h2.28v.55zm7.043 7.26v1.157h.033c.309-.443.683-.784 1.117-1.024.433-.245.936-.365 1.5-.365.54 0 1.033.107 1.481.314.448.208.785.582 1.02 1.108.254-.374.6-.706 1.034-.992.434-.287.95-.43 1.546-.43.453 0 .872.056 1.26.167.388.108.718.3.99.569.272.268.48.622.626 1.055.145.43.217.96.217 1.58v5.44h-2.29v-4.6c0-.29-.012-.563-.04-.822-.025-.258-.094-.482-.193-.674-.1-.191-.243-.342-.435-.454-.19-.11-.453-.166-.785-.166-.332 0-.596.06-.795.172-.2.113-.354.268-.465.462-.11.195-.183.42-.217.676-.033.255-.05.525-.05.804v4.6h-2.29v-4.554c0-.257-.012-.507-.035-.754-.024-.245-.087-.463-.194-.654-.106-.19-.26-.343-.46-.457-.2-.115-.48-.172-.84-.172-.11 0-.254.022-.44.064-.19.043-.37.138-.543.282-.174.144-.322.354-.443.628-.12.275-.18.643-.18 1.108v4.51h-2.29V7.81h2.19zm15.693 15.64V.55H21.72V0H24v24h-2.28v-.55z"/>
    </svg>
  ),
  teams: (
    <svg viewBox="0 0 24 24" className="h-6 w-6">
      <path d="M20.625 7.875a2.625 2.625 0 1 0 0-5.25 2.625 2.625 0 0 0 0 5.25z" fill="#5059C9"/>
      <path d="M14.25 8.25a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" fill="#7B83EB"/>
      <path d="M17.625 9h-6.75A1.875 1.875 0 0 0 9 10.875v6.375a5.25 5.25 0 0 0 10.5 0v-6.375A1.875 1.875 0 0 0 17.625 9z" fill="#7B83EB"/>
      <path d="M20.625 9h-2.25v5.25a5.25 5.25 0 0 1-5.25 5.25H9.19A5.252 5.252 0 0 0 14.25 21h4.125A2.625 2.625 0 0 0 21 18.375V10.5A1.5 1.5 0 0 0 20.625 9z" fill="#5059C9"/>
      <path d="M9 9.75H3.75A1.5 1.5 0 0 0 2.25 11.25v5.625a3.375 3.375 0 0 0 6.75 0V10.5A.75.75 0 0 0 9 9.75z" fill="#4B53BC"/>
    </svg>
  ),
};

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
  icon: React.ReactNode;
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
    icon: Icons.telegram,
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
    icon: Icons.feishu,
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
    icon: Icons.wecom,
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
    icon: Icons.wechat,
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
    icon: Icons.discord,
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
    icon: Icons.slack,
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
    icon: Icons.whatsapp,
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
    icon: Icons.line,
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
    icon: Icons.matrix,
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
    icon: Icons.teams,
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
              <span className="flex items-center justify-center">{meta.icon}</span>
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
                  <span className="flex h-10 w-10 items-center justify-center">{PLATFORM_META[created.platform].icon}</span>
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
            <span className="flex items-center justify-center">{meta.icon}</span>
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
                  <span className="flex items-center justify-center">{meta.icon}</span>
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
                <span key={p} className="flex items-center justify-center h-8 w-8">{PLATFORM_META[p].icon}</span>
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
