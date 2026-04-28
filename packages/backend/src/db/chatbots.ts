/**
 * chatbots table — DB access layer.
 * Replaces chatbots.json.
 */

import db from "./index.js";

export interface ChatbotRow {
  id: string;
  agentId: number;
  platform: string;
  name: string;
  webhookToken: string;
  botToken?: string;
  appId?: string;
  appSecret?: string;
  webhookUrl: string;
  enabled: boolean;
  walletAddress: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
}

interface DbRow {
  id: string;
  agent_id: number;
  platform: string;
  name: string;
  webhook_token: string;
  bot_token: string | null;
  app_id: string | null;
  app_secret: string | null;
  webhook_url: string;
  enabled: number;
  wallet_address: string;
  created_at: number;
  updated_at: number;
  message_count: number;
}

function rowToBot(r: DbRow): ChatbotRow {
  return {
    id: r.id,
    agentId: r.agent_id,
    platform: r.platform,
    name: r.name,
    webhookToken: r.webhook_token,
    botToken: r.bot_token ?? undefined,
    appId: r.app_id ?? undefined,
    appSecret: r.app_secret ?? undefined,
    webhookUrl: r.webhook_url,
    enabled: r.enabled === 1,
    walletAddress: r.wallet_address,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    messageCount: r.message_count,
  };
}

const stmts = {
  insert: db.prepare(`
    INSERT INTO chatbots
      (id, agent_id, platform, name, webhook_token, bot_token, app_id, app_secret, webhook_url, enabled, wallet_address, created_at, updated_at, message_count)
    VALUES
      (@id, @agentId, @platform, @name, @webhookToken, @botToken, @appId, @appSecret, @webhookUrl, @enabled, @walletAddress, @createdAt, @updatedAt, @messageCount)
  `),
  findById: db.prepare(`SELECT * FROM chatbots WHERE id=?`),
  findByWallet: db.prepare(`SELECT * FROM chatbots WHERE lower(wallet_address)=lower(?)`),
  findByToken: db.prepare(`SELECT * FROM chatbots WHERE webhook_token=? AND platform=?`),
  update: db.prepare(`
    UPDATE chatbots SET
      name=COALESCE(@name, name),
      bot_token=COALESCE(@botToken, bot_token),
      app_id=COALESCE(@appId, app_id),
      app_secret=COALESCE(@appSecret, app_secret),
      enabled=COALESCE(@enabled, enabled),
      updated_at=@updatedAt
    WHERE id=@id AND lower(wallet_address)=lower(@walletAddress)
  `),
  delete: db.prepare(`DELETE FROM chatbots WHERE id=? AND lower(wallet_address)=lower(?)`),
  incrementMsgCount: db.prepare(`UPDATE chatbots SET message_count=message_count+1, updated_at=? WHERE webhook_token=?`),
};

export function insertChatbot(bot: ChatbotRow): void {
  stmts.insert.run({
    id: bot.id,
    agentId: bot.agentId,
    platform: bot.platform,
    name: bot.name,
    webhookToken: bot.webhookToken,
    botToken: bot.botToken ?? null,
    appId: bot.appId ?? null,
    appSecret: bot.appSecret ?? null,
    webhookUrl: bot.webhookUrl,
    enabled: bot.enabled ? 1 : 0,
    walletAddress: bot.walletAddress.toLowerCase(),
    createdAt: bot.createdAt,
    updatedAt: bot.updatedAt,
    messageCount: bot.messageCount,
  });
}

export function getChatbotsByWallet(wallet: string): ChatbotRow[] {
  return (stmts.findByWallet.all(wallet) as DbRow[]).map(rowToBot);
}

export function getChatbotByToken(token: string, platform: string): ChatbotRow | null {
  const row = stmts.findByToken.get(token, platform) as DbRow | undefined;
  return row ? rowToBot(row) : null;
}

export function updateChatbot(
  id: string,
  walletAddress: string,
  patch: { name?: string; botToken?: string; appId?: string; appSecret?: string; enabled?: boolean }
): boolean {
  const r = stmts.update.run({
    id,
    walletAddress,
    name: patch.name ?? null,
    botToken: patch.botToken ?? null,
    appId: patch.appId ?? null,
    appSecret: patch.appSecret ?? null,
    enabled: patch.enabled !== undefined ? (patch.enabled ? 1 : 0) : null,
    updatedAt: Date.now(),
  });
  return r.changes > 0;
}

export function deleteChatbot(id: string, walletAddress: string): boolean {
  const r = stmts.delete.run(id, walletAddress);
  return r.changes > 0;
}

export function incrementMessageCount(webhookToken: string): void {
  stmts.incrementMsgCount.run(Date.now(), webhookToken);
}
