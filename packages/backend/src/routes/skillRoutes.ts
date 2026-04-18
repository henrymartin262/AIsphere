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

    const body = req.body as {
      walletAddress?: string;
      // flat format
      name?: string;
      description?: string;
      language?: string;
      code?: string;
      enabled?: boolean;
      version?: string;
      author?: string;
      // nested format (frontend sends this)
      skill?: {
        name?: string;
        description?: string;
        language?: string;
        code?: string;
        enabled?: boolean;
        version?: string;
        author?: string;
      };
      tags?: string[];
    };

    const { walletAddress } = body;
    // Support both flat and nested skill format
    const skillInput = body.skill ?? body;
    const name = skillInput.name;
    const description = skillInput.description;
    const language = skillInput.language ?? "typescript";
    const code = skillInput.code ?? "";
    const enabled = skillInput.enabled !== undefined ? skillInput.enabled : true;
    const version = skillInput.version ?? "1.0.0";
    const author = skillInput.author ?? "user";

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
    const body2 = req.body as {
      walletAddress?: string;
      // flat format
      name?: string;
      description?: string;
      language?: string;
      code?: string;
      enabled?: boolean;
      version?: string;
      author?: string;
      // nested format (frontend sends this)
      skill?: {
        name?: string;
        description?: string;
        language?: string;
        code?: string;
        enabled?: boolean;
        version?: string;
        author?: string;
      };
      tags?: string[];
    };

    const { walletAddress } = body2;
    const skillInput2 = body2.skill ?? body2;
    const name = skillInput2.name;
    const description = skillInput2.description;
    const language = skillInput2.language ?? "typescript";
    const code = skillInput2.code ?? "";
    const enabled = skillInput2.enabled !== undefined ? skillInput2.enabled : true;
    const version = skillInput2.version ?? "1.0.0";
    const author = skillInput2.author ?? "user";

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

// ─── ClawHub Catalog ──────────────────────────────────────────────────────────

const CLAWHUB_CATALOG = [
  {
    id: "web-search",
    name: "Web Search",
    description: "Search the web and return top results with titles and snippets",
    language: "typescript",
    version: "1.0.0",
    author: "clawhub",
    tags: ["search", "web"],
    code: `// Web Search Skill
// Usage: call search(query) to get web results
async function search(query: string): Promise<Array<{ title: string; url: string; snippet: string }>> {
  const res = await fetch(\`https://api.duckduckgo.com/?q=\${encodeURIComponent(query)}&format=json&no_html=1\`);
  const data = await res.json();
  return (data.RelatedTopics || []).slice(0, 5).map((t: { Text?: string; FirstURL?: string }) => ({
    title: t.Text?.split(" - ")[0] ?? "",
    url: t.FirstURL ?? "",
    snippet: t.Text ?? "",
  }));
}`,
  },
  {
    id: "url-summarizer",
    name: "URL Summarizer",
    description: "Fetch a web page and extract its main text content for summarization",
    language: "typescript",
    version: "1.0.0",
    author: "clawhub",
    tags: ["web", "summarize"],
    code: `// URL Summarizer Skill
// Usage: call summarize(url) to get page text
async function summarize(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  const html = await res.text();
  // Strip tags and collapse whitespace
  const text = html.replace(/<[^>]+>/g, " ").replace(/\\s+/g, " ").trim();
  return text.slice(0, 4000);
}`,
  },
  {
    id: "json-formatter",
    name: "JSON Formatter",
    description: "Parse, validate and pretty-print JSON data",
    language: "typescript",
    version: "1.0.0",
    author: "clawhub",
    tags: ["json", "utility"],
    code: `// JSON Formatter Skill
function formatJson(input: string, indent = 2): string {
  try {
    const parsed = JSON.parse(input);
    return JSON.stringify(parsed, null, indent);
  } catch (e) {
    throw new Error(\`Invalid JSON: \${(e as Error).message}\`);
  }
}

function validateJson(input: string): { valid: boolean; error?: string } {
  try {
    JSON.parse(input);
    return { valid: true };
  } catch (e) {
    return { valid: false, error: (e as Error).message };
  }
}`,
  },
  {
    id: "math-calculator",
    name: "Math Calculator",
    description: "Evaluate mathematical expressions safely",
    language: "typescript",
    version: "1.0.0",
    author: "clawhub",
    tags: ["math", "utility"],
    code: `// Math Calculator Skill
// Safely evaluates basic math expressions
function calculate(expression: string): number {
  // Allow only numbers, operators, parentheses and spaces
  if (!/^[0-9+\\-*/().\\s%^]+$/.test(expression)) {
    throw new Error("Invalid expression: only numbers and operators allowed");
  }
  // Use Function constructor for safe eval
  const result = new Function(\`"use strict"; return (\${expression})\`)();
  if (typeof result !== "number" || !isFinite(result)) {
    throw new Error("Expression did not evaluate to a finite number");
  }
  return result;
}`,
  },
  {
    id: "datetime-utils",
    name: "DateTime Utilities",
    description: "Format dates, calculate differences and convert timezones",
    language: "typescript",
    version: "1.0.0",
    author: "clawhub",
    tags: ["datetime", "utility"],
    code: `// DateTime Utilities Skill
function formatDate(date: Date | string | number, locale = "en-US"): string {
  return new Date(date).toLocaleString(locale, {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function daysBetween(a: Date | string, b: Date | string): number {
  const ms = Math.abs(new Date(b).getTime() - new Date(a).getTime());
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function toTimezone(date: Date | string, tz: string): string {
  return new Date(date).toLocaleString("en-US", { timeZone: tz });
}`,
  },
  {
    id: "text-analyzer",
    name: "Text Analyzer",
    description: "Count words, sentences, reading time and detect language",
    language: "typescript",
    version: "1.0.0",
    author: "clawhub",
    tags: ["text", "nlp"],
    code: `// Text Analyzer Skill
function analyzeText(text: string) {
  const words = text.trim().split(/\\s+/).filter(Boolean);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const paragraphs = text.split(/\\n{2,}/).filter(p => p.trim().length > 0);
  const readingTimeMin = Math.ceil(words.length / 200);
  return {
    chars: text.length,
    words: words.length,
    sentences: sentences.length,
    paragraphs: paragraphs.length,
    readingTimeMin,
    avgWordsPerSentence: Math.round(words.length / Math.max(sentences.length, 1)),
  };
}`,
  },
  {
    id: "crypto-price",
    name: "Crypto Price Fetcher",
    description: "Fetch real-time cryptocurrency prices from CoinGecko",
    language: "typescript",
    version: "1.0.0",
    author: "clawhub",
    tags: ["crypto", "finance"],
    code: `// Crypto Price Fetcher Skill
// Usage: getPrice("bitcoin") or getPrice("ethereum")
async function getPrice(coinId: string): Promise<{ usd: number; usd_24h_change: number }> {
  const url = \`https://api.coingecko.com/api/v3/simple/price?ids=\${coinId}&vs_currencies=usd&include_24hr_change=true\`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(\`CoinGecko API error: \${res.status}\`);
  const data = await res.json();
  if (!data[coinId]) throw new Error(\`Coin not found: \${coinId}\`);
  return data[coinId];
}`,
  },
  {
    id: "markdown-to-html",
    name: "Markdown to HTML",
    description: "Convert Markdown text to HTML with basic formatting support",
    language: "typescript",
    version: "1.0.0",
    author: "clawhub",
    tags: ["markdown", "html", "utility"],
    code: `// Markdown to HTML Skill
function markdownToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\\*\\*(.+?)\\*\\*/g, "<strong>$1</strong>")
    .replace(/\\*(.+?)\\*/g, "<em>$1</em>")
    .replace(/\`(.+?)\`/g, "<code>$1</code>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\\/li>)/gs, "<ul>$1</ul>")
    .replace(/\\[(.+?)\\]\\((.+?)\\)/g, '<a href="$2">$1</a>')
    .replace(/\\n{2,}/g, "</p><p>")
    .replace(/^(.+)$/gm, (line) => line.startsWith("<") ? line : \`<p>\${line}</p>\`);
}`,
  },
];

// ─── ClawHub: proxy npm registry for real openclaw-skill packages ─────────────

const NPM_SEARCH_URL = "https://registry.npmjs.org/-/v1/search";
const NPM_REGISTRY_URL = "https://registry.npmjs.org";

interface NpmPackage {
  name: string;
  version: string;
  description: string;
  keywords: string[];
  links: { npm?: string; repository?: string; homepage?: string };
  author?: { name?: string; username?: string };
  date: string;
}

interface NpmSearchResult {
  objects: Array<{ package: NpmPackage; score: { final: number } }>;
  total: number;
}

const CLAWHUB_BASE = "https://clawhub.ai";

interface ClawHubSkill {
  name: string;
  version: string;
  description: string;
  keywords: string[];
  downloads?: number;
  author?: string;
  slug?: string;
  date?: string;
}

/** Search ClawHub official API (requires token) */
async function searchClawHubSkills(query: string, size = 20): Promise<ClawHubSkill[]> {
  const token = env.CLAWHUB_TOKEN;
  if (!token) return [];

  const headers = { Accept: "application/json", Authorization: `Bearer ${token}` };

  // Search for slugs
  const q = query || "agent";
  const searchUrl = `${CLAWHUB_BASE}/api/v1/search?q=${encodeURIComponent(q)}&limit=${size}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 10_000);

  let slugs: string[] = [];
  try {
    const res = await fetch(searchUrl, { headers, signal: ctrl.signal });
    if (res.ok) {
      const data = await res.json() as { results?: Array<{ slug?: string; displayName?: string; summary?: string }> };
      slugs = (data.results ?? []).map((r) => r.slug ?? "").filter(Boolean);
    }
  } catch { /* fall through */ } finally { clearTimeout(t); }

  if (slugs.length === 0) return [];

  // Fetch details for each slug in parallel (batch 8 at a time)
  const BATCH = 8;
  const skills: ClawHubSkill[] = [];
  for (let i = 0; i < slugs.length; i += BATCH) {
    const batch = slugs.slice(i, i + BATCH);
    const results = await Promise.all(batch.map(async (slug) => {
      try {
        const ctrl2 = new AbortController();
        const t2 = setTimeout(() => ctrl2.abort(), 8_000);
        const r = await fetch(`${CLAWHUB_BASE}/api/v1/skills/${encodeURIComponent(slug)}`, {
          headers, signal: ctrl2.signal
        });
        clearTimeout(t2);
        if (!r.ok) return null;
        const d = await r.json() as {
          skill?: { slug?: string; displayName?: string; summary?: string; tags?: string[] };
          latestVersion?: { version?: string };
          metadata?: { installsAllTime?: number; stars?: number };
          owner?: { handle?: string };
        };
        const skill = d.skill ?? {};
        const ver = d.latestVersion ?? {};
        const meta = d.metadata ?? {};
        const owner = d.owner ?? {};
        return {
          name: skill.slug ?? slug,
          version: ver.version ?? "1.0.0",
          description: skill.summary ?? "",
          keywords: skill.tags ?? ["clawhub"],
          downloads: meta.installsAllTime ?? meta.stars ?? 0,
          author: owner.handle ?? "clawhub",
          slug,
          date: undefined,
        } as ClawHubSkill;
      } catch { return null; }
    }));
    skills.push(...results.filter((s): s is ClawHubSkill => s !== null));
  }

  // Sort by downloads desc
  skills.sort((a, b) => (b.downloads ?? 0) - (a.downloads ?? 0));
  return skills;
}


async function searchNpmSkills(query: string, size = 30): Promise<NpmPackage[]> {
  // Search both keywords in parallel for broader coverage
  const keywords = query
    ? [`${query} keywords:clawhub`, `${query} keywords:openclaw-skill`]
    : ["keywords:clawhub", "keywords:openclaw-skill"];

  const fetchSearch = async (text: string, n: number): Promise<NpmPackage[]> => {
    const url = `${NPM_SEARCH_URL}?text=${encodeURIComponent(text)}&size=${n}&quality=0.3&popularity=2.0&maintenance=0.3`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) return [];
      const data = (await res.json()) as NpmSearchResult;
      return data.objects.map((o) => o.package);
    } catch { return []; } finally { clearTimeout(timer); }
  };

  // Fetch both keyword sets in parallel
  const [a, b] = await Promise.all([
    fetchSearch(keywords[0], size),
    fetchSearch(keywords[1], Math.floor(size / 2)),
  ]);

  // Deduplicate by package name
  const seen = new Set<string>();
  const combined: NpmPackage[] = [];
  for (const pkg of [...a, ...b]) {
    if (!seen.has(pkg.name)) { seen.add(pkg.name); combined.push(pkg); }
  }

  // Fetch download counts in parallel (batch to avoid rate limit)
  const BATCH = 15;
  const downloads = new Map<string, number>();
  for (let i = 0; i < combined.length; i += BATCH) {
    const batch = combined.slice(i, i + BATCH);
    await Promise.all(batch.map(async (pkg) => {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 5_000);
        const r = await fetch(
          `https://api.npmjs.org/downloads/point/last-month/${encodeURIComponent(pkg.name)}`,
          { signal: ctrl.signal }
        );
        clearTimeout(t);
        if (r.ok) {
          const d = await r.json() as { downloads?: number };
          downloads.set(pkg.name, d.downloads ?? 0);
        }
      } catch { /* ignore */ }
    }));
  }

  // Sort by download count descending
  combined.sort((x, y) => (downloads.get(y.name) ?? 0) - (downloads.get(x.name) ?? 0));

  // Attach download count for frontend display
  return combined.slice(0, size).map((pkg) => ({
    ...pkg,
    downloads: downloads.get(pkg.name) ?? 0,
  }));
}

/** Get npm package metadata + readme */
async function getNpmPackage(name: string): Promise<{
  name: string;
  version: string;
  description: string;
  keywords: string[];
  readme: string;
  tarball: string;
  repository?: string;
  author?: string;
}> {
  const url = `${NPM_REGISTRY_URL}/${encodeURIComponent(name)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`npm package not found: ${name} (${res.status})`);
    const data = await res.json() as {
      name: string;
      description?: string;
      readme?: string;
      keywords?: string[];
      "dist-tags"?: { latest?: string };
      versions?: Record<string, {
        description?: string;
        keywords?: string[];
        dist?: { tarball?: string };
        repository?: { url?: string };
        author?: { name?: string } | string;
      }>;
    };
    const latest = data["dist-tags"]?.latest ?? "";
    const v = data.versions?.[latest] ?? {};
    const tarball = v.dist?.tarball ?? "";
    const repoUrl = typeof v.repository === "object" ? v.repository?.url ?? "" : "";
    const authorName = typeof v.author === "object" ? v.author?.name ?? "" : v.author ?? "";
    return {
      name: data.name,
      version: latest,
      description: v.description ?? data.description ?? "",
      keywords: v.keywords ?? data.keywords ?? [],
      readme: (data.readme ?? "").slice(0, 3000),
      tarball,
      repository: repoUrl.replace(/^git\+/, "").replace(/\.git$/, ""),
      author: authorName,
    };
  } finally {
    clearTimeout(timer);
  }
}

// GET /api/skills/clawhub/catalog?q=keyword&size=20
router.get("/clawhub/catalog", async (req, res) => {
  try {
    const { q = "", size = "20" } = req.query as { q?: string; size?: string };
    const n = Math.min(parseInt(size, 10) || 20, 50);

    // Try ClawHub official API first (token required)
    const clawHubResults = await searchClawHubSkills(q || "agent", n);
    if (clawHubResults.length > 0) {
      return res.status(200).json({ success: true, data: clawHubResults, total: clawHubResults.length, source: "clawhub" });
    }

    // Fallback: npm registry
    const pkgs = await searchNpmSkills(q, n);
    return res.status(200).json({ success: true, data: pkgs, total: pkgs.length, source: "npm" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch ClawHub catalog";
    res.status(500).json({ success: false, error: message });
  }
});

// GET /api/skills/clawhub/package/* — get npm package metadata for install preview
router.get("/clawhub/package/*", async (req, res) => {
  try {
    // Support scoped packages like @scope/name — extract from URL path
    const prefix = "/clawhub/package/";
    const name = req.path.startsWith(prefix) ? req.path.slice(prefix.length) : "";
    if (!name) {
      res.status(400).json({ success: false, error: "package name is required" });
      return;
    }
    const pkg = await getNpmPackage(name);
    res.status(200).json({ success: true, data: pkg });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch package";
    res.status(500).json({ success: false, error: message });
  }
});

// POST /api/skills/:agentId/import-github — fetch code from GitHub and install as skill
router.post("/:agentId/import-github", async (req, res) => {
  try {
    const agentId = parseInt(req.params.agentId, 10);
    if (isNaN(agentId)) {
      res.status(400).json({ success: false, error: "agentId must be a number" });
      return;
    }

    const { walletAddress, url } = req.body as { walletAddress?: string; url?: string };
    if (!walletAddress || !url) {
      res.status(400).json({ success: false, error: "walletAddress and url are required" });
      return;
    }

    // Convert GitHub URL to raw URL
    let rawUrl = url.trim();
    // https://github.com/user/repo/blob/main/file.ts → https://raw.githubusercontent.com/user/repo/main/file.ts
    rawUrl = rawUrl
      .replace("https://github.com/", "https://raw.githubusercontent.com/")
      .replace("/blob/", "/");

    // Fetch the raw file
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);
    let code: string;
    try {
      const fetchRes = await fetch(rawUrl, { signal: controller.signal });
      if (!fetchRes.ok) {
        res.status(400).json({ success: false, error: `Failed to fetch GitHub file: HTTP ${fetchRes.status}` });
        return;
      }
      code = await fetchRes.text();
    } finally {
      clearTimeout(timer);
    }

    // Detect language from file extension
    const ext = rawUrl.split(".").pop()?.toLowerCase() ?? "";
    const langMap: Record<string, string> = {
      ts: "typescript", tsx: "typescript",
      js: "javascript", jsx: "javascript",
      py: "python", python: "python",
    };
    const language = langMap[ext] ?? "text";

    // Extract name from filename
    const filename = rawUrl.split("/").pop() ?? "imported-skill";
    const name = filename.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");

    // Extract description from first comment line
    const firstComment = code.match(/^(?:\/\/|#|\/\*)\s*(.+)/m)?.[1]?.trim() ?? `Imported from GitHub: ${filename}`;

    const skillData: SkillData = {
      name,
      description: firstComment,
      language,
      code,
      enabled: true,
      version: "1.0.0",
      author: "github",
    };

    const memory = await MemoryVaultService.saveMemory(
      agentId,
      {
        type: "skill",
        content: JSON.stringify(skillData),
        importance: 0.8,
        tags: [name, language, "github"],
      },
      walletAddress,
    );

    const item = parseSkill(memory);
    if (!item) {
      res.status(500).json({ success: false, error: "Failed to parse imported skill" });
      return;
    }

    res.status(201).json({ success: true, data: item });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to import skill";
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
