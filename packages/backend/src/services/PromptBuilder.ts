/**
 * PromptBuilder — AIsphere Agent Prompt Framework
 *
 * Assembles the full prompt for every inference call.
 *
 * Structure:
 * ┌─────────────────────────────────────────────────────────┐
 * │  SYSTEM                                                  │
 * │  ├─ Identity: who the agent is                          │
 * │  ├─ Platform: AIsphere / 0G Network context             │
 * │  ├─ Personality memories (from Memory Vault)            │
 * │  └─ Knowledge memories  (from Memory Vault)             │
 * ├─────────────────────────────────────────────────────────┤
 * │  HISTORY (last N turns, oldest → newest)                │
 * │  ├─ user: ...                                           │
 * │  └─ assistant: ...                                      │
 * ├─────────────────────────────────────────────────────────┤
 * │  USER (current query)                                   │
 * └─────────────────────────────────────────────────────────┘
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AgentContext {
  agentId: number;
  /** Agent's on-chain name */
  agentName: string;
  /**
   * Pre-built personality + knowledge section from MemoryVaultService.
   * Pass empty string if unavailable.
   */
  personalityContext: string;
}

export interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
}

/** Fully assembled prompt ready for any inference layer */
export interface BuiltPrompt {
  /** OpenAI-compatible messages array (system + history + user) */
  messages: ChatMessage[];
  /**
   * Flat single-string prompt for providers that only accept a text input
   * (e.g. 0G broker's legacy text completion endpoints).
   */
  flatPrompt: string;
  /** The system string alone (useful for logging / debugging) */
  systemPrompt: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** How many history turns to include (each turn = 1 user + 1 assistant message) */
const MAX_HISTORY_TURNS = 10;

// ─── Builder ──────────────────────────────────────────────────────────────────

/**
 * Build a complete prompt for an agent inference call.
 *
 * @param agentCtx   Agent identity + pre-loaded personality/knowledge memories
 * @param history    Full session message history (ordered oldest → newest)
 * @param userMessage The current user query
 */
export function buildPrompt(
  agentCtx: AgentContext,
  history: HistoryMessage[],
  userMessage: string
): BuiltPrompt {
  const systemPrompt = buildSystemPrompt(agentCtx);

  // Trim history to last MAX_HISTORY_TURNS * 2 messages (pairs)
  const trimmedHistory = history.slice(-(MAX_HISTORY_TURNS * 2));

  // OpenAI-compatible messages array
  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...trimmedHistory.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: userMessage },
  ];

  // Flat prompt (for 0G broker single-string endpoints)
  const historyLines = trimmedHistory
    .map((m) => `${m.role === "user" ? "Human" : "Assistant"}: ${m.content}`)
    .join("\n");

  const flatPrompt = [
    `<system>\n${systemPrompt}\n</system>`,
    historyLines ? `<history>\n${historyLines}\n</history>` : "",
    `Human: ${userMessage}`,
    "Assistant:",
  ]
    .filter(Boolean)
    .join("\n\n");

  return { messages, flatPrompt, systemPrompt };
}

// ─── System prompt assembly ───────────────────────────────────────────────────

function buildSystemPrompt(ctx: AgentContext): string {
  const sections: string[] = [];

  // 1. Identity
  sections.push(
    `You are ${ctx.agentName}, an AI Agent living on AIsphere.\n` +
    `AIsphere is a privacy-sovereign AI Agent OS built on 0G Network. ` +
    `Your every inference is TEE-verified and your decisions are recorded as immutable on-chain proof.`
  );

  // 2. Personality & Knowledge (from Memory Vault)
  const memCtx = ctx.personalityContext?.trim();
  if (memCtx && memCtx !== "No prior context available.") {
    sections.push(memCtx);
  }

  // 3. Behavioral guardrails
  sections.push(
    `Always respond as ${ctx.agentName}. ` +
    `Be helpful, honest, and consistent with your personality. ` +
    `Keep responses concise unless depth is clearly needed.`
  );

  return sections.join("\n\n");
}
