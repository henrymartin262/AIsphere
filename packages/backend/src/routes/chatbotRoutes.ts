import { Router } from "express";
import { randomUUID } from "crypto";
import * as SealedInferenceService from "../services/SealedInferenceService.js";
import * as MemoryVaultService from "../services/MemoryVaultService.js";
import * as AgentService from "../services/AgentService.js";
import {
  insertChatbot,
  getChatbotsByWallet,
  getChatbotByToken,
  updateChatbot,
  deleteChatbot,
  incrementMessageCount,
} from "../db/chatbots.js";

const router: Router = Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getBaseUrl(req: { headers: Record<string, string | string[] | undefined>; hostname: string; protocol: string }): string {
  const host = req.headers["x-forwarded-host"] ?? req.hostname;
  const proto = req.headers["x-forwarded-proto"] ?? req.protocol;
  return `${proto}://${host}`;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /api/chatbot — list all chatbot configs for a wallet
router.get("/", (req, res) => {
  const { walletAddress } = req.query as { walletAddress?: string };
  if (!walletAddress) {
    res.status(400).json({ success: false, error: "walletAddress query param required" });
    return;
  }
  const configs = getChatbotsByWallet(walletAddress)
    .map((c) => ({ ...c, botToken: c.botToken ? "***" : undefined }));
  res.json({ success: true, data: configs });
});

// POST /api/chatbot — create a new chatbot config
router.post("/", (req, res) => {
  const { agentId, platform, name, botToken, appId, appSecret, walletAddress } = req.body as {
    agentId?: number;
    platform?: "telegram" | "feishu" | "wechat" | "wecom" | "slack" | "discord" | "whatsapp" | "line" | "matrix" | "teams";
    name?: string;
    botToken?: string;
    appId?: string;
    appSecret?: string;
    walletAddress?: string;
  };

  if (!agentId || !platform || !name || !walletAddress) {
    res.status(400).json({ success: false, error: "agentId, platform, name, and walletAddress are required" });
    return;
  }

  const webhookToken = randomUUID().replace(/-/g, "");
  const id = randomUUID();
  const baseUrl = getBaseUrl(req as Parameters<typeof getBaseUrl>[0]);
  const webhookUrl = `${baseUrl}/api/chatbot/webhook/${platform}/${webhookToken}`;

  insertChatbot({
    id, agentId, platform, name, webhookToken, botToken, appId, appSecret,
    webhookUrl, enabled: true, walletAddress,
    createdAt: Date.now(), updatedAt: Date.now(), messageCount: 0,
  });

  const config = { id, agentId, platform, name, webhookToken, botToken: botToken ? "***" : undefined, appId, appSecret, webhookUrl, enabled: true, walletAddress, createdAt: Date.now(), updatedAt: Date.now(), messageCount: 0 };
  res.status(201).json({ success: true, data: config });
});

// PUT /api/chatbot/:id — update config
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { walletAddress, botToken, appId, enabled, name } = req.body as {
    walletAddress?: string; botToken?: string; appId?: string; enabled?: boolean; name?: string;
  };
  if (!walletAddress) { res.status(400).json({ success: false, error: "walletAddress required" }); return; }
  const ok = updateChatbot(id, walletAddress, { name, botToken, appId, enabled });
  if (!ok) { res.status(404).json({ success: false, error: "Not found or not authorized" }); return; }
  const updated = getChatbotsByWallet(walletAddress).find((c) => c.id === id);
  res.json({ success: true, data: updated ? { ...updated, botToken: updated.botToken ? "***" : undefined } : null });
});

// DELETE /api/chatbot/:id
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const { walletAddress } = req.body as { walletAddress?: string };
  if (!walletAddress) { res.status(400).json({ success: false, error: "walletAddress required" }); return; }
  const ok = deleteChatbot(id, walletAddress);
  if (!ok) { res.status(404).json({ success: false, error: "Not found or not authorized" }); return; }
  res.json({ success: true });
});

// ─── Telegram Webhook ─────────────────────────────────────────────────────────

// POST /api/chatbot/webhook/telegram/:token — receives messages from Telegram
router.post("/webhook/telegram/:token", async (req, res) => {
  // Acknowledge immediately (Telegram requires < 5s response)
  res.json({ ok: true });

  const { token } = req.params;
  const config = getChatbotByToken(token, "telegram");
  if (!config || !config.enabled) return;

  try {
    const update = req.body as {
      message?: { text?: string; chat?: { id?: number }; from?: { first_name?: string; username?: string } };
    };
    const text = update.message?.text;
    const chatId = update.message?.chat?.id;
    if (!text || !chatId) return;

    // Run inference with the agent
    const agent = await AgentService.getAgent(config.agentId);
    const context = await MemoryVaultService.buildContext(config.agentId, config.walletAddress);
    const { response } = await SealedInferenceService.inference(config.agentId, text, context);

    // Send reply via Telegram Bot API
    if (config.botToken) {
      await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: response, parse_mode: "Markdown" }),
        signal: AbortSignal.timeout(10_000),
      });
    }

    // Record message count
    incrementMessageCount(token);
    await MemoryVaultService.saveMemory(config.agentId, {
      type: "conversation",
      content: `[Telegram] User: ${text}\nAgent: ${response}`,
      importance: 0.5,
      tags: ["telegram", "chatbot"],
    }, config.walletAddress);

    void agent; // suppress unused warning
  } catch (err) {
    console.warn("[Chatbot] Telegram webhook error:", (err as Error).message);
  }
});

// ─── Feishu Webhook ───────────────────────────────────────────────────────────

// POST /api/chatbot/webhook/feishu/:token — receives messages from Feishu
router.post("/webhook/feishu/:token", async (req, res) => {
  const { token } = req.params;
  const config = getChatbotByToken(token, "feishu");

  // Feishu URL verification challenge
  const body = req.body as {
    challenge?: string;
    type?: string;
    event?: { message?: { content?: string }; sender?: { sender_id?: { open_id?: string } } };
    header?: { event_type?: string };
  };

  if (body.type === "url_verification" || body.challenge) {
    res.json({ challenge: body.challenge });
    return;
  }

  res.json({ code: 0 }); // Acknowledge immediately

  if (!config || !config.enabled) return;

  try {
    const eventType = body.header?.event_type;
    if (eventType !== "im.message.receive_v1") return;

    const msgContent = body.event?.message?.content;
    if (!msgContent) return;

    let text: string;
    try {
      const parsed = JSON.parse(msgContent) as { text?: string };
      text = parsed.text ?? msgContent;
    } catch { text = msgContent; }

    const openId = body.event?.sender?.sender_id?.open_id;
    if (!text) return;

    // Run inference
    const context = await MemoryVaultService.buildContext(config.agentId, config.walletAddress);
    const { response } = await SealedInferenceService.inference(config.agentId, text, context);

    // Reply via Feishu API
    if (config.botToken && config.appId && openId) {
      // Get tenant access token first
      const tokenRes = await fetch("https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ app_id: config.appId, app_secret: config.botToken }),
        signal: AbortSignal.timeout(8_000),
      });
      const tokenData = await tokenRes.json() as { tenant_access_token?: string };
      const accessToken = tokenData.tenant_access_token;

      if (accessToken) {
        await fetch("https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=open_id", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({
            receive_id: openId,
            msg_type: "text",
            content: JSON.stringify({ text: response }),
          }),
          signal: AbortSignal.timeout(10_000),
        });
      }
    }

    incrementMessageCount(token);

    await MemoryVaultService.saveMemory(config.agentId, {
      type: "conversation",
      content: `[Feishu] User: ${text}\nAgent: ${response}`,
      importance: 0.5,
      tags: ["feishu", "chatbot"],
    }, config.walletAddress);
  } catch (err) {
    console.warn("[Chatbot] Feishu webhook error:", (err as Error).message);
  }
});

export default router;
