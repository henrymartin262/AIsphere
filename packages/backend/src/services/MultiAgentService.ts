import { randomUUID } from "crypto";
import { hashContent } from "../utils/encryption.js";
import * as SealedInferenceService from "./SealedInferenceService.js";
import * as MemoryVaultService from "./MemoryVaultService.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MessageType = "request" | "response" | "delegate" | "broadcast" | "handoff";
export type TaskStatus = "pending" | "in_progress" | "completed" | "failed";

/** Inter-agent message */
export interface AgentMessage {
  id: string;
  fromAgentId: number;
  toAgentId: number;
  type: MessageType;
  content: string;
  taskId?: string;
  metadata?: Record<string, unknown>;
  timestamp: number;
}

/** A delegated task between agents */
export interface AgentTask {
  id: string;
  initiatorAgentId: number;
  delegateAgentId: number;
  description: string;
  context: string;
  status: TaskStatus;
  result?: string;
  messages: AgentMessage[];
  createdAt: number;
  updatedAt: number;
}

/** Collaboration session between multiple agents */
export interface CollaborationSession {
  id: string;
  name: string;
  agentIds: number[];
  walletAddress: string;
  tasks: AgentTask[];
  messages: AgentMessage[];
  createdAt: number;
  updatedAt: number;
}

/** Result of a multi-agent orchestration */
export interface OrchestrationResult {
  sessionId: string;
  responses: Array<{
    agentId: number;
    response: string;
    proofHash: string;
    teeVerified: boolean;
  }>;
  aggregatedResponse: string;
  routingDecisions: string[];
}

// ─── In-memory stores ────────────────────────────────────────────────────────

const messageQueue: Map<number, AgentMessage[]> = new Map();  // agentId → inbox
const sessions: Map<string, CollaborationSession> = new Map();
const tasks: Map<string, AgentTask> = new Map();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInbox(agentId: number): AgentMessage[] {
  if (!messageQueue.has(agentId)) messageQueue.set(agentId, []);
  return messageQueue.get(agentId)!;
}

/** Simple keyword-based routing to determine which agent should handle a query */
function routeMessage(
  message: string,
  availableAgents: Array<{ agentId: number; name: string; model: string; tags?: string[] }>
): number[] {
  const lower = message.toLowerCase();

  // Keywords → capability mapping for intelligent routing
  const capabilityKeywords: Record<string, string[]> = {
    code: ["code", "program", "debug", "function", "algorithm", "typescript", "javascript", "python"],
    analysis: ["analyze", "analysis", "data", "statistics", "trend", "report", "insight"],
    creative: ["write", "creative", "story", "poem", "design", "brainstorm", "idea"],
    research: ["research", "find", "search", "investigate", "explore", "learn"],
    planning: ["plan", "strategy", "schedule", "organize", "manage", "roadmap"]
  };

  // Score each agent based on keyword relevance
  const scores = availableAgents.map((agent) => {
    let score = 0;
    const agentLower = `${agent.name} ${agent.model} ${(agent.tags ?? []).join(" ")}`.toLowerCase();

    for (const [, keywords] of Object.entries(capabilityKeywords)) {
      const messageMatch = keywords.some((k) => lower.includes(k));
      const agentMatch = keywords.some((k) => agentLower.includes(k));
      if (messageMatch && agentMatch) score += 2;
      if (messageMatch) score += 1;
    }

    return { agentId: agent.agentId, score };
  });

  // Sort by score descending, return top agents (at least 1, up to 3)
  scores.sort((a, b) => b.score - a.score);
  const selected = scores.slice(0, Math.min(3, scores.length));

  // If no agent scored, return the first available
  if (selected.every((s) => s.score === 0) && availableAgents.length > 0) {
    return [availableAgents[0].agentId];
  }

  return selected.filter((s) => s.score > 0).map((s) => s.agentId);
}

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Send a message from one agent to another.
 * Messages are stored in the recipient's inbox for async processing.
 */
export async function sendMessage(
  fromAgentId: number,
  toAgentId: number,
  type: MessageType,
  content: string,
  taskId?: string
): Promise<AgentMessage> {
  const message: AgentMessage = {
    id: randomUUID(),
    fromAgentId,
    toAgentId,
    type,
    content,
    taskId,
    timestamp: Date.now()
  };

  // Push to recipient's inbox
  getInbox(toAgentId).push(message);

  // If part of a session, also record there
  for (const session of sessions.values()) {
    if (session.agentIds.includes(fromAgentId) && session.agentIds.includes(toAgentId)) {
      session.messages.push(message);
      session.updatedAt = Date.now();
    }
  }

  console.log(`[MultiAgent] Message ${message.id}: Agent #${fromAgentId} → Agent #${toAgentId} (${type})`);
  return message;
}

/**
 * Get all pending messages for an agent (inbox).
 */
export async function getMessages(agentId: number, limit = 50): Promise<AgentMessage[]> {
  return getInbox(agentId).slice(-limit);
}

/**
 * Delegate a task from one agent to another.
 * The delegate agent will process the task using its own context and capabilities.
 */
export async function delegateTask(
  initiatorAgentId: number,
  delegateAgentId: number,
  description: string,
  walletAddress: string
): Promise<AgentTask> {
  // Build context from the initiator's memory
  const context = await MemoryVaultService.buildContext(initiatorAgentId, walletAddress);

  const task: AgentTask = {
    id: randomUUID(),
    initiatorAgentId,
    delegateAgentId,
    description,
    context,
    status: "pending",
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  tasks.set(task.id, task);

  // Send a delegation message
  const msg = await sendMessage(
    initiatorAgentId,
    delegateAgentId,
    "delegate",
    `Task delegated: ${description}`,
    task.id
  );
  task.messages.push(msg);

  console.log(`[MultiAgent] Task ${task.id}: Agent #${initiatorAgentId} delegated to Agent #${delegateAgentId}`);
  return task;
}

/**
 * Execute a delegated task: the delegate agent processes the task.
 */
export async function executeTask(
  taskId: string,
  walletAddress: string
): Promise<AgentTask> {
  const task = tasks.get(taskId);
  if (!task) throw new Error(`Task ${taskId} not found`);

  task.status = "in_progress";
  task.updatedAt = Date.now();

  try {
    // Build delegate agent's own context
    const delegateContext = await MemoryVaultService.buildContext(task.delegateAgentId, walletAddress);

    // Combine initiator context + delegate context
    const combinedContext = [
      "## Delegated Task Context (from Agent #" + task.initiatorAgentId + ")",
      task.context,
      "",
      "## Your Own Context (Agent #" + task.delegateAgentId + ")",
      delegateContext
    ].join("\n");

    // Run inference with the delegate agent
    const { response, proof } = await SealedInferenceService.inference(
      task.delegateAgentId,
      task.description,
      combinedContext
    );

    task.result = response;
    task.status = "completed";
    task.updatedAt = Date.now();

    // Send response message back to initiator
    const responseMsg = await sendMessage(
      task.delegateAgentId,
      task.initiatorAgentId,
      "response",
      `Task completed: ${response}`,
      task.id
    );
    task.messages.push(responseMsg);

    // Save the task result as a decision memory for the delegate agent
    await MemoryVaultService.saveMemory(
      task.delegateAgentId,
      {
        type: "decision",
        content: `Delegated task from Agent #${task.initiatorAgentId}: ${task.description}\nResult: ${response}`,
        importance: 0.7,
        tags: ["multi-agent", "delegation", `from-agent-${task.initiatorAgentId}`]
      },
      walletAddress
    );

    console.log(`[MultiAgent] Task ${taskId} completed by Agent #${task.delegateAgentId}, proof: ${proof.proofHash}`);
  } catch (err) {
    task.status = "failed";
    task.result = `Error: ${(err as Error).message}`;
    task.updatedAt = Date.now();
  }

  return task;
}

/**
 * Create a collaboration session with multiple agents.
 */
export async function createSession(
  name: string,
  agentIds: number[],
  walletAddress: string
): Promise<CollaborationSession> {
  const session: CollaborationSession = {
    id: randomUUID(),
    name,
    agentIds,
    walletAddress,
    tasks: [],
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  sessions.set(session.id, session);
  console.log(`[MultiAgent] Session ${session.id} created: "${name}" with agents [${agentIds.join(", ")}]`);
  return session;
}

/**
 * Get a collaboration session by ID.
 */
export async function getSession(sessionId: string): Promise<CollaborationSession | null> {
  return sessions.get(sessionId) ?? null;
}

/**
 * List all active collaboration sessions for a wallet.
 */
export async function listSessions(walletAddress: string): Promise<CollaborationSession[]> {
  return Array.from(sessions.values()).filter(
    (s) => s.walletAddress.toLowerCase() === walletAddress.toLowerCase()
  );
}

/**
 * Multi-agent orchestration: route a user query to the best agent(s),
 * run parallel inference, and aggregate results.
 */
export async function orchestrate(
  userMessage: string,
  availableAgents: Array<{ agentId: number; name: string; model: string; tags?: string[] }>,
  walletAddress: string,
  sessionId?: string
): Promise<OrchestrationResult> {
  const routingDecisions: string[] = [];

  // 1. Route the message to the best agent(s)
  const selectedAgentIds = routeMessage(userMessage, availableAgents);
  routingDecisions.push(`Routed to agents: [${selectedAgentIds.join(", ")}]`);

  // 2. Get or create a session
  let session: CollaborationSession;
  if (sessionId && sessions.has(sessionId)) {
    session = sessions.get(sessionId)!;
  } else {
    session = await createSession(
      `Orchestration: ${userMessage.slice(0, 50)}...`,
      selectedAgentIds,
      walletAddress
    );
  }

  // 3. Run inference on each selected agent in parallel
  const inferencePromises = selectedAgentIds.map(async (agentId) => {
    const context = await MemoryVaultService.buildContext(agentId, walletAddress);
    const { response, proof } = await SealedInferenceService.inference(
      agentId,
      userMessage,
      context
    );

    // Save the interaction as a memory
    await MemoryVaultService.saveMemory(
      agentId,
      {
        type: "conversation",
        content: `[Multi-Agent Orchestration] User: ${userMessage}\nAgent: ${response}`,
        importance: 0.6,
        tags: ["multi-agent", "orchestration"]
      },
      walletAddress
    );

    return {
      agentId,
      response,
      proofHash: proof.proofHash,
      teeVerified: proof.teeVerified
    };
  });

  const responses = await Promise.all(inferencePromises);
  routingDecisions.push(`Received ${responses.length} agent responses`);

  // 4. Aggregate responses
  let aggregatedResponse: string;
  if (responses.length === 1) {
    aggregatedResponse = responses[0].response;
    routingDecisions.push("Single agent response — no aggregation needed");
  } else {
    // Multi-agent: combine insights from all agents
    const parts = responses.map(
      (r) => `[Agent #${r.agentId}${r.teeVerified ? " ✅" : ""}]: ${r.response}`
    );
    aggregatedResponse = parts.join("\n\n---\n\n");
    routingDecisions.push(`Aggregated ${responses.length} agent responses`);

    // Broadcast summary to all participating agents
    for (let i = 0; i < responses.length; i++) {
      for (let j = i + 1; j < responses.length; j++) {
        await sendMessage(
          responses[i].agentId,
          responses[j].agentId,
          "broadcast",
          `Collaborated on: "${userMessage.slice(0, 100)}"`
        );
      }
    }
  }

  session.updatedAt = Date.now();

  const proofHashes = responses.map((r) => r.proofHash);
  const orchestrationHash = hashContent(proofHashes.join(":"));

  return {
    sessionId: session.id,
    responses,
    aggregatedResponse,
    routingDecisions
  };
}

/**
 * Agent handoff: transfer a conversation from one agent to another.
 */
export async function handoff(
  fromAgentId: number,
  toAgentId: number,
  reason: string,
  walletAddress: string
): Promise<AgentMessage> {
  // Transfer recent conversation context
  const fromContext = await MemoryVaultService.buildContext(fromAgentId, walletAddress);

  // Save the handoff context as a knowledge memory for the receiving agent
  await MemoryVaultService.saveMemory(
    toAgentId,
    {
      type: "knowledge",
      content: `Handoff from Agent #${fromAgentId}. Reason: ${reason}\n\nPrior context:\n${fromContext}`,
      importance: 0.8,
      tags: ["handoff", `from-agent-${fromAgentId}`]
    },
    walletAddress
  );

  // Send handoff message
  const msg = await sendMessage(
    fromAgentId,
    toAgentId,
    "handoff",
    `Handoff: ${reason}. Prior context transferred.`
  );

  console.log(`[MultiAgent] Handoff: Agent #${fromAgentId} → Agent #${toAgentId}, reason: ${reason}`);
  return msg;
}

/**
 * Get task by ID.
 */
export async function getTask(taskId: string): Promise<AgentTask | null> {
  return tasks.get(taskId) ?? null;
}

/**
 * List tasks involving a specific agent.
 */
export async function listAgentTasks(agentId: number): Promise<AgentTask[]> {
  return Array.from(tasks.values()).filter(
    (t) => t.initiatorAgentId === agentId || t.delegateAgentId === agentId
  );
}
