import { hashContent } from "../utils/encryption.js";
import { initialize0GClients } from "../config/og.js";
import * as MemoryVaultService from "./MemoryVaultService.js";
import * as SealedInferenceService from "./SealedInferenceService.js";
import * as MultiAgentService from "./MultiAgentService.js";

// ─── Types ────────────────────────────────────────────────────────────────────

/** OpenClaw Agent definition */
export interface OpenClawAgent {
  agentId: string;
  sealMindTokenId: number;
  workspace: string;
  skills: OpenClawSkill[];
  bindings: OpenClawBinding[];
  sandbox?: {
    mode: "off" | "agent";
    tools?: { allow?: string[]; deny?: string[] };
  };
  createdAt: number;
}

/** OpenClaw Skill definition (Agent-native capabilities) */
export interface OpenClawSkill {
  id: string;
  name: string;
  description: string;
  handler: string; // Route handler path
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
}

/** OpenClaw Binding — routes messages to the correct agent */
export interface OpenClawBinding {
  agentId: string;
  match: {
    channel?: string;
    peer?: { kind: string; id: string };
    accountId?: string;
    capability?: string;
  };
  priority?: number;
}

/** OpenClaw Gateway configuration */
export interface OpenClawConfig {
  version: string;
  gateway: {
    host: string;
    port: number;
    apiBaseUrl: string;
  };
  agents: OpenClawAgent[];
  bindings: OpenClawBinding[];
  routing: {
    strategy: "capability" | "round-robin" | "priority";
    fallbackAgentId: string;
  };
}

/** OpenClaw Task — submitted through the orchestration layer */
export interface OpenClawTask {
  id: string;
  type: "inference" | "skill" | "delegation" | "pipeline";
  agentId: string;
  input: string;
  context?: string;
  skills?: string[];
  status: "queued" | "running" | "completed" | "failed";
  result?: string;
  proofHash?: string;
  createdAt: number;
  completedAt?: number;
}

/** Skill execution result */
export interface SkillExecutionResult {
  skillId: string;
  agentId: string;
  output: string;
  proofHash: string;
  teeVerified: boolean;
  executionTimeMs: number;
}

/** Pipeline definition — chained skill executions */
export interface SkillPipeline {
  id: string;
  name: string;
  steps: Array<{
    skillId: string;
    agentId: string;
    inputMapping?: string; // JSONPath or template for mapping previous step output
  }>;
}

// ─── In-memory registries ────────────────────────────────────────────────────

const agentRegistry: Map<string, OpenClawAgent> = new Map();
const skillRegistry: Map<string, OpenClawSkill> = new Map();
const taskQueue: Map<string, OpenClawTask> = new Map();
const pipelines: Map<string, SkillPipeline> = new Map();

// ─── Built-in Skills ─────────────────────────────────────────────────────────

const BUILT_IN_SKILLS: OpenClawSkill[] = [
  {
    id: "skill:sealed-inference",
    name: "Sealed Inference",
    description: "Run TEE-verified inference via 0G Compute Broker",
    handler: "/api/chat/:agentId"
  },
  {
    id: "skill:memory-recall",
    name: "Memory Recall",
    description: "Recall and search encrypted memories from 0G KV Storage",
    handler: "/api/memory/:agentId"
  },
  {
    id: "skill:decision-audit",
    name: "Decision Audit",
    description: "Record and verify on-chain decision proofs",
    handler: "/api/decisions/:agentId"
  },
  {
    id: "skill:multi-agent-delegate",
    name: "Multi-Agent Delegation",
    description: "Delegate tasks to other agents for collaborative processing",
    handler: "/api/multi-agent/delegate"
  },
  {
    id: "skill:context-builder",
    name: "Context Builder",
    description: "Build rich context from agent memories for informed responses",
    handler: "/api/memory/:agentId/context"
  }
];

// Register built-in skills
for (const skill of BUILT_IN_SKILLS) {
  skillRegistry.set(skill.id, skill);
}

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Register a SealMind agent as an OpenClaw agent with capabilities.
 */
export async function registerAgent(
  sealMindTokenId: number,
  agentName: string,
  skills: string[] = [],
  bindings: OpenClawBinding[] = []
): Promise<OpenClawAgent> {
  const agentId = `sealmind-agent-${sealMindTokenId}`;

  // Map requested skill IDs to registered skills
  const agentSkills: OpenClawSkill[] = skills
    .map((sid) => skillRegistry.get(sid))
    .filter((s): s is OpenClawSkill => s !== undefined);

  // If no skills specified, assign all built-in skills
  if (agentSkills.length === 0) {
    agentSkills.push(...BUILT_IN_SKILLS);
  }

  const agent: OpenClawAgent = {
    agentId,
    sealMindTokenId,
    workspace: `~/.openclaw/agents/${agentId}/`,
    skills: agentSkills,
    bindings: bindings.length > 0 ? bindings : [
      {
        agentId,
        match: { capability: "*" },
        priority: 0
      }
    ],
    sandbox: {
      mode: "agent",
      tools: {
        allow: ["read", "inference", "memory", "decision"],
        deny: ["exec", "write", "delete"]
      }
    },
    createdAt: Date.now()
  };

  agentRegistry.set(agentId, agent);
  console.log(`[OpenClaw] Registered agent: ${agentId} with ${agentSkills.length} skills`);
  return agent;
}

/**
 * Get a registered OpenClaw agent.
 */
export async function getAgent(agentId: string): Promise<OpenClawAgent | null> {
  return agentRegistry.get(agentId) ?? null;
}

/**
 * List all registered OpenClaw agents.
 */
export async function listAgents(): Promise<OpenClawAgent[]> {
  return Array.from(agentRegistry.values());
}

/**
 * Register a custom skill.
 */
export async function registerSkill(skill: OpenClawSkill): Promise<OpenClawSkill> {
  skillRegistry.set(skill.id, skill);
  console.log(`[OpenClaw] Registered skill: ${skill.id} — ${skill.name}`);
  return skill;
}

/**
 * List all registered skills (built-in + custom).
 */
export async function listSkills(): Promise<OpenClawSkill[]> {
  return Array.from(skillRegistry.values());
}

/**
 * Execute a skill on a specific agent.
 * Routes through SealMind's inference/memory/decision pipeline.
 */
export async function executeSkill(
  skillId: string,
  agentIdOrTokenId: string | number,
  input: string,
  walletAddress: string
): Promise<SkillExecutionResult> {
  const startTime = Date.now();
  const skill = skillRegistry.get(skillId);
  if (!skill) throw new Error(`Skill not found: ${skillId}`);

  // Resolve SealMind token ID
  const tokenId = typeof agentIdOrTokenId === "number"
    ? agentIdOrTokenId
    : parseInt(agentIdOrTokenId.replace("sealmind-agent-", ""), 10);

  let output: string;
  let proofHash: string;
  let teeVerified = false;

  switch (skillId) {
    case "skill:sealed-inference": {
      const context = await MemoryVaultService.buildContext(tokenId, walletAddress);
      const { response, proof } = await SealedInferenceService.inference(tokenId, input, context);
      output = response;
      proofHash = proof.proofHash;
      teeVerified = proof.teeVerified;
      break;
    }
    case "skill:memory-recall": {
      const memories = await MemoryVaultService.loadMemories(tokenId, walletAddress, {
        limit: 10
      });
      output = memories.map((m) => `[${m.type}] ${m.content}`).join("\n");
      proofHash = hashContent(output);
      break;
    }
    case "skill:context-builder": {
      output = await MemoryVaultService.buildContext(tokenId, walletAddress);
      proofHash = hashContent(output);
      break;
    }
    case "skill:multi-agent-delegate": {
      // Parse delegation input: "delegate to agent X: task description"
      const match = input.match(/delegate to agent (\d+):\s*(.*)/i);
      if (match) {
        const targetId = parseInt(match[1], 10);
        const desc = match[2];
        const task = await MultiAgentService.delegateTask(tokenId, targetId, desc, walletAddress);
        const executedTask = await MultiAgentService.executeTask(task.id, walletAddress);
        output = executedTask.result ?? "Task executed but no result returned";
        proofHash = hashContent(output);
      } else {
        output = "Invalid delegation format. Use: delegate to agent <id>: <description>";
        proofHash = hashContent(output);
      }
      break;
    }
    default: {
      // Generic skill execution — use inference with skill context
      const context = `Executing skill: ${skill.name}\nDescription: ${skill.description}\n`;
      const { response, proof } = await SealedInferenceService.inference(tokenId, input, context);
      output = response;
      proofHash = proof.proofHash;
      teeVerified = proof.teeVerified;
      break;
    }
  }

  const executionTimeMs = Date.now() - startTime;

  console.log(`[OpenClaw] Skill ${skillId} executed on agent ${agentIdOrTokenId} in ${executionTimeMs}ms`);

  return {
    skillId,
    agentId: typeof agentIdOrTokenId === "string" ? agentIdOrTokenId : `sealmind-agent-${agentIdOrTokenId}`,
    output,
    proofHash,
    teeVerified,
    executionTimeMs
  };
}

/**
 * Submit a task to the OpenClaw orchestration queue.
 */
export async function submitTask(
  type: OpenClawTask["type"],
  agentId: string,
  input: string,
  skills?: string[],
  walletAddress?: string
): Promise<OpenClawTask> {
  const task: OpenClawTask = {
    id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    agentId,
    input,
    skills,
    status: "queued",
    createdAt: Date.now()
  };

  taskQueue.set(task.id, task);
  console.log(`[OpenClaw] Task queued: ${task.id} (${type}) for agent ${agentId}`);

  // Auto-execute if wallet is provided
  if (walletAddress) {
    task.status = "running";
    try {
      if (type === "skill" && skills?.length) {
        // Execute skill chain
        let lastOutput = input;
        for (const skillId of skills) {
          const result = await executeSkill(skillId, agentId, lastOutput, walletAddress);
          lastOutput = result.output;
          task.proofHash = result.proofHash;
        }
        task.result = lastOutput;
      } else if (type === "pipeline") {
        // Execute pipeline
        task.result = await executePipeline(agentId, input, walletAddress);
      } else {
        // Default: sealed inference
        const result = await executeSkill("skill:sealed-inference", agentId, input, walletAddress);
        task.result = result.output;
        task.proofHash = result.proofHash;
      }
      task.status = "completed";
    } catch (err) {
      task.status = "failed";
      task.result = `Error: ${(err as Error).message}`;
    }
    task.completedAt = Date.now();
  }

  return task;
}

/**
 * Get task by ID.
 */
export async function getTask(taskId: string): Promise<OpenClawTask | null> {
  return taskQueue.get(taskId) ?? null;
}

/**
 * Create a skill pipeline (chained skill execution).
 */
export async function createPipeline(pipeline: SkillPipeline): Promise<SkillPipeline> {
  pipelines.set(pipeline.id, pipeline);
  console.log(`[OpenClaw] Pipeline created: ${pipeline.id} — ${pipeline.name} (${pipeline.steps.length} steps)`);
  return pipeline;
}

/**
 * Execute a skill pipeline.
 */
async function executePipeline(
  agentId: string,
  input: string,
  walletAddress: string
): Promise<string> {
  // For now, execute the default pipeline: context → inference → memory save
  const tokenId = parseInt(agentId.replace("sealmind-agent-", ""), 10) || 1;

  // Step 1: Build context
  const context = await MemoryVaultService.buildContext(tokenId, walletAddress);

  // Step 2: Run inference
  const { response, proof } = await SealedInferenceService.inference(tokenId, input, context);

  // Step 3: Save result as memory
  await MemoryVaultService.saveMemory(
    tokenId,
    {
      type: "decision",
      content: `[OpenClaw Pipeline] Input: ${input}\nOutput: ${response}`,
      importance: 0.6,
      tags: ["openclaw", "pipeline"]
    },
    walletAddress
  );

  return response;
}

/**
 * Generate OpenClaw gateway configuration for all registered agents.
 */
export async function generateConfig(): Promise<OpenClawConfig> {
  const agents = Array.from(agentRegistry.values());
  const allBindings: OpenClawBinding[] = [];

  for (const agent of agents) {
    allBindings.push(...agent.bindings);
  }

  return {
    version: "1.0.0",
    gateway: {
      host: "127.0.0.1",
      port: 18789,
      apiBaseUrl: "http://localhost:4000/api"
    },
    agents,
    bindings: allBindings,
    routing: {
      strategy: "capability",
      fallbackAgentId: agents[0]?.agentId ?? "sealmind-agent-1"
    }
  };
}

/**
 * Get OpenClaw integration status.
 */
export async function getStatus(): Promise<{
  registered: boolean;
  agentCount: number;
  skillCount: number;
  pendingTasks: number;
  pipelineCount: number;
}> {
  const pending = Array.from(taskQueue.values()).filter(
    (t) => t.status === "queued" || t.status === "running"
  ).length;

  return {
    registered: agentRegistry.size > 0,
    agentCount: agentRegistry.size,
    skillCount: skillRegistry.size,
    pendingTasks: pending,
    pipelineCount: pipelines.size
  };
}
