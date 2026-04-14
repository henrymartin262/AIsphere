import { Router, type Router as ExpressRouter } from "express";
import * as OpenClawService from "../services/OpenClawService.js";

const router: ExpressRouter = Router();

// ─── Status ──────────────────────────────────────────────────────────────────

/**
 * GET /api/openclaw/status
 * Get OpenClaw integration status.
 */
router.get("/status", async (_req, res) => {
  try {
    const status = await OpenClawService.getStatus();
    res.status(200).json({ success: true, data: status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get status";
    res.status(500).json({ error: message });
  }
});

// ─── Agent Registration ──────────────────────────────────────────────────────

/**
 * POST /api/openclaw/agents
 * Register a AIsphere agent as an OpenClaw agent.
 *
 * Body: { sealMindTokenId, agentName, skills?, bindings? }
 */
router.post("/agents", async (req, res) => {
  try {
    const { sealMindTokenId, agentName, skills, bindings } = req.body as {
      sealMindTokenId?: number;
      agentName?: string;
      skills?: string[];
      bindings?: OpenClawService.OpenClawBinding[];
    };

    if (!sealMindTokenId || !agentName) {
      res.status(400).json({ error: "sealMindTokenId and agentName are required" });
      return;
    }

    const agent = await OpenClawService.registerAgent(
      sealMindTokenId,
      agentName,
      skills,
      bindings
    );

    res.status(201).json({ success: true, data: agent });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Agent registration failed";
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/openclaw/agents
 * List all registered OpenClaw agents.
 */
router.get("/agents", async (_req, res) => {
  try {
    const agents = await OpenClawService.listAgents();
    res.status(200).json({ success: true, data: agents });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list agents";
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/openclaw/agents/:agentId
 * Get a specific OpenClaw agent.
 */
router.get("/agents/:agentId", async (req, res) => {
  try {
    const agent = await OpenClawService.getAgent(req.params.agentId);
    if (!agent) {
      res.status(404).json({ error: "Agent not found" });
      return;
    }
    res.status(200).json({ success: true, data: agent });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get agent";
    res.status(500).json({ error: message });
  }
});

// ─── Skills ──────────────────────────────────────────────────────────────────

/**
 * GET /api/openclaw/skills
 * List all registered skills.
 */
router.get("/skills", async (_req, res) => {
  try {
    const skills = await OpenClawService.listSkills();
    res.status(200).json({ success: true, data: skills });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list skills";
    res.status(500).json({ error: message });
  }
});

/**
 * POST /api/openclaw/skills
 * Register a new custom skill.
 *
 * Body: { id, name, description, handler, inputSchema?, outputSchema? }
 */
router.post("/skills", async (req, res) => {
  try {
    const { id, name, description, handler, inputSchema, outputSchema } = req.body as {
      id?: string;
      name?: string;
      description?: string;
      handler?: string;
      inputSchema?: Record<string, unknown>;
      outputSchema?: Record<string, unknown>;
    };

    if (!id || !name || !description || !handler) {
      res.status(400).json({ error: "id, name, description, and handler are required" });
      return;
    }

    const skill = await OpenClawService.registerSkill({
      id,
      name,
      description,
      handler,
      inputSchema,
      outputSchema
    });

    res.status(201).json({ success: true, data: skill });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Skill registration failed";
    res.status(500).json({ error: message });
  }
});

/**
 * POST /api/openclaw/skills/:skillId/execute
 * Execute a skill on a specific agent.
 *
 * Body: { agentId, input, walletAddress }
 */
router.post("/skills/:skillId/execute", async (req, res) => {
  try {
    const { skillId } = req.params;
    const { agentId, input, walletAddress } = req.body as {
      agentId?: string | number;
      input?: string;
      walletAddress?: string;
    };

    if (!agentId || !input || !walletAddress) {
      res.status(400).json({ error: "agentId, input, and walletAddress are required" });
      return;
    }

    const result = await OpenClawService.executeSkill(
      skillId,
      agentId,
      input,
      walletAddress
    );

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Skill execution failed";
    res.status(500).json({ error: message });
  }
});

// ─── Tasks ───────────────────────────────────────────────────────────────────

/**
 * POST /api/openclaw/tasks
 * Submit a task to the OpenClaw orchestration queue.
 *
 * Body: { type, agentId, input, skills?, walletAddress? }
 */
router.post("/tasks", async (req, res) => {
  try {
    const { type, agentId, input, skills, walletAddress } = req.body as {
      type?: string;
      agentId?: string;
      input?: string;
      skills?: string[];
      walletAddress?: string;
    };

    if (!type || !agentId || !input) {
      res.status(400).json({ error: "type, agentId, and input are required" });
      return;
    }

    const validTypes = ["inference", "skill", "delegation", "pipeline"];
    if (!validTypes.includes(type)) {
      res.status(400).json({ error: `type must be one of: ${validTypes.join(", ")}` });
      return;
    }

    const task = await OpenClawService.submitTask(
      type as OpenClawService.OpenClawTask["type"],
      agentId,
      input,
      skills,
      walletAddress
    );

    res.status(201).json({ success: true, data: task });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Task submission failed";
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/openclaw/tasks/:taskId
 * Get task details.
 */
router.get("/tasks/:taskId", async (req, res) => {
  try {
    const task = await OpenClawService.getTask(req.params.taskId);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    res.status(200).json({ success: true, data: task });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get task";
    res.status(500).json({ error: message });
  }
});

// ─── Configuration ───────────────────────────────────────────────────────────

/**
 * GET /api/openclaw/config
 * Generate OpenClaw gateway configuration.
 */
router.get("/config", async (_req, res) => {
  try {
    const config = await OpenClawService.generateConfig();
    res.status(200).json({ success: true, data: config });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate config";
    res.status(500).json({ error: message });
  }
});

// ─── Pipelines ───────────────────────────────────────────────────────────────

/**
 * POST /api/openclaw/pipelines
 * Create a skill pipeline.
 *
 * Body: { id, name, steps: [{ skillId, agentId, inputMapping? }] }
 */
router.post("/pipelines", async (req, res) => {
  try {
    const { id, name, steps } = req.body as {
      id?: string;
      name?: string;
      steps?: Array<{ skillId: string; agentId: string; inputMapping?: string }>;
    };

    if (!id || !name || !steps?.length) {
      res.status(400).json({ error: "id, name, and steps are required" });
      return;
    }

    const pipeline = await OpenClawService.createPipeline({ id, name, steps });
    res.status(201).json({ success: true, data: pipeline });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Pipeline creation failed";
    res.status(500).json({ error: message });
  }
});

export default router;
