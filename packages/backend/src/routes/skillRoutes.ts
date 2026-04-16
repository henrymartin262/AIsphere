import { Router, type Router as ExpressRouter } from "express";
import * as MemoryVaultService from "../services/MemoryVaultService.js";
import type { Memory } from "../services/MemoryVaultService.js";
import { env } from "../config/index.js";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SkillData {
  name: string;
  description: string;
  language: string;
  code: string;
  enabled: boolean;
  version: string;
  author: string;
}

interface SkillItem {
  id: string;
  agentId: number;
  skill: SkillData;
  timestamp: number;
  tags: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseSkill(memory: Memory): SkillItem | null {
  try {
    const skill = JSON.parse(memory.content) as SkillData;
    return {
      id: memory.id,
      agentId: memory.agentId,
      skill,
      timestamp: memory.timestamp,
      tags: memory.tags,
    };
  } catch {
    return null;
  }
}

/**
 * Call GLM or DeepSeek to generate code for a skill.
 * Falls back to a mock comment if no API key is configured.
 */
async function generateCodeWithAI(prompt: string, language: string): Promise<string> {
  const systemPrompt =
    `You are an expert programmer. Generate a standalone ${language} function/script that: ` +
    `${prompt}. Return ONLY the code, no explanation, no markdown fences.`;

  const baseBody = {
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    max_tokens: 2048,
    temperature: 0.3,
  };

  // ── Try GLM first ──────────────────────────────────────────────────────────
  if (env.GLM_API_KEY) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60_000);
    try {
      const res = await fetch(`${env.GLM_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.GLM_API_KEY}`,
        },
        body: JSON.stringify({ ...baseBody, model: env.GLM_MODEL }),
        signal: controller.signal,
      });
      if (res.ok) {
        const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
        const code = data.choices[0]?.message?.content?.trim();
        if (code) return code;
      }
    } catch {
      // fall through to DeepSeek
    } finally {
      clearTimeout(timer);
    }
  }

  // ── Fall back to DeepSeek ──────────────────────────────────────────────────
  if (env.DEEPSEEK_API_KEY) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60_000);
    try {
      const res = await fetch(`${env.DEEPSEEK_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({ ...baseBody, model: "deepseek-chat" }),
        signal: controller.signal,
      });
      if (res.ok) {
        const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
        const code = data.choices[0]?.message?.content?.trim();
        if (code) return code;
      }
    } catch {
      // fall through to mock
    } finally {
      clearTimeout(timer);
    }
  }

  // ── No AI provider — return placeholder ───────────────────────────────────
  return `// Auto-generated skill\n// TODO: implement ${prompt}`;
}

// ─── Router ───────────────────────────────────────────────────────────────────

const router: ExpressRouter = Router();

// GET /api/skills/:agentId?address=0x...
router.get("/:agentId", async (req, res) => {
  try {
    const agentId = parseInt(req.params.agentId, 10);
    if (isNaN(agentId)) {
      res.status(400).json({ success: false, error: "agentId must be a number" });
      return;
    }

    const { address } = req.query as { address?: string };
    if (!address) {
      res.status(400).json({ success: false, error: "address query param is required" });
      return;
    }

    const memories = await MemoryVaultService.loadMemories(agentId, address, { type: "skill" });
    const skills = memories.map(parseSkill).filter((s): s is SkillItem => s !== null);

    res.status(200).json({ success: true, data: skills });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load skills";
    res.status(500).json({ success: false, error: message });
  }
});

// POST /api/skills/:agentId — install / create a skill
router.post("/:agentId", async (req, res) => {
  try {
    const agentId = parseInt(req.params.agentId, 10);
    if (isNaN(agentId)) {
      res.status(400).json({ success: false, error: "agentId must be a number" });
      return;
    }

    const {
      walletAddress,
      name,
      description,
      language = "typescript",
      code = "",
      enabled = true,
      version = "1.0.0",
      author = "user",
    } = req.body as {
      walletAddress?: string;
      name?: string;
      description?: string;
      language?: string;
      code?: string;
      enabled?: boolean;
      version?: string;
      author?: string;
    };

    if (!walletAddress || !name || !description) {
      res.status(400).json({
        success: false,
        error: "walletAddress, name, and description are required",
      });
      return;
    }

    const skillData: SkillData = { name, description, language, code, enabled, version, author };

    const memory = await MemoryVaultService.saveMemory(
      agentId,
      {
        type: "skill",
        content: JSON.stringify(skillData),
        importance: 0.8,
        tags: [name, language],
      },
      walletAddress,
    );

    const item = parseSkill(memory);
    if (!item) {
      res.status(500).json({ success: false, error: "Failed to parse saved skill" });
      return;
    }

    res.status(201).json({ success: true, data: item });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create skill";
    res.status(500).json({ success: false, error: message });
  }
});

// PUT /api/skills/:agentId/:memoryId — update a skill (delete old + save new)
router.put("/:agentId/:memoryId", async (req, res) => {
  try {
    const agentId = parseInt(req.params.agentId, 10);
    if (isNaN(agentId)) {
      res.status(400).json({ success: false, error: "agentId must be a number" });
      return;
    }

    const { memoryId } = req.params;
    const {
      walletAddress,
      name,
      description,
      language = "typescript",
      code = "",
      enabled = true,
      version = "1.0.0",
      author = "user",
    } = req.body as {
      walletAddress?: string;
      name?: string;
      description?: string;
      language?: string;
      code?: string;
      enabled?: boolean;
      version?: string;
      author?: string;
    };

    if (!walletAddress || !name || !description) {
      res.status(400).json({
        success: false,
        error: "walletAddress, name, and description are required",
      });
      return;
    }

    // 0G KV doesn't support in-place update — delete old entry then write new one
    await MemoryVaultService.deleteMemory(agentId, memoryId, walletAddress);

    const skillData: SkillData = { name, description, language, code, enabled, version, author };

    const memory = await MemoryVaultService.saveMemory(
      agentId,
      {
        type: "skill",
        content: JSON.stringify(skillData),
        importance: 0.8,
        tags: [name, language],
      },
      walletAddress,
    );

    const item = parseSkill(memory);
    if (!item) {
      res.status(500).json({ success: false, error: "Failed to parse updated skill" });
      return;
    }

    res.status(200).json({ success: true, data: item });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update skill";
    res.status(500).json({ success: false, error: message });
  }
});

// DELETE /api/skills/:agentId/:memoryId — uninstall a skill
router.delete("/:agentId/:memoryId", async (req, res) => {
  try {
    const agentId = parseInt(req.params.agentId, 10);
    if (isNaN(agentId)) {
      res.status(400).json({ success: false, error: "agentId must be a number" });
      return;
    }

    const { memoryId } = req.params;
    const { walletAddress } = req.body as { walletAddress?: string };

    if (!walletAddress) {
      res.status(400).json({ success: false, error: "walletAddress is required in request body" });
      return;
    }

    const deleted = await MemoryVaultService.deleteMemory(agentId, memoryId, walletAddress);
    if (!deleted) {
      res.status(404).json({ success: false, error: `Skill ${memoryId} not found` });
      return;
    }

    res.status(200).json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete skill";
    res.status(500).json({ success: false, error: message });
  }
});

// POST /api/skills/:agentId/generate — AI-generate a skill from a natural-language prompt
router.post("/:agentId/generate", async (req, res) => {
  try {
    const agentId = parseInt(req.params.agentId, 10);
    if (isNaN(agentId)) {
      res.status(400).json({ success: false, error: "agentId must be a number" });
      return;
    }

    const {
      walletAddress,
      prompt,
      language = "typescript",
    } = req.body as {
      walletAddress?: string;
      prompt?: string;
      language?: string;
    };

    if (!walletAddress || !prompt) {
      res.status(400).json({ success: false, error: "walletAddress and prompt are required" });
      return;
    }

    const code = await generateCodeWithAI(prompt, language);

    const skillData: SkillData = {
      name: prompt.slice(0, 60).replace(/[^a-zA-Z0-9 _-]/g, "").trim() || "generated-skill",
      description: prompt,
      language,
      code,
      enabled: true,
      version: "1.0.0",
      author: "ai",
    };

    const memory = await MemoryVaultService.saveMemory(
      agentId,
      {
        type: "skill",
        content: JSON.stringify(skillData),
        importance: 0.8,
        tags: [skillData.name, language],
      },
      walletAddress,
    );

    const item = parseSkill(memory);
    if (!item) {
      res.status(500).json({ success: false, error: "Failed to parse generated skill" });
      return;
    }

    res.status(201).json({ success: true, data: item });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate skill";
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
