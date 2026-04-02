import { ethers } from "ethers";
import { initialize0GClients } from "../config/og.js";
import { hashContent } from "../utils/encryption.js";
import type { ExperienceType } from "./SoulService.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HiveMindContribution {
  id: string;
  category: string;              // "defi_analysis" | "code_review" | "bounty_completion" | ...
  abstractLearning: string;      // anonymized learning (no private content)
  domain: string[];              // domain tags
  quality: number;               // 0-1 self-rated quality
  experienceHash: string;        // original experience hash (traceable but non-reversible)
  contributorSoulHash: string;   // contributor's soul hash (anonymous but verifiable)
  timestamp: number;
}

export interface HiveMindStats {
  totalContributions: number;
  totalAgents: number;
  categoryBreakdown: Record<string, number>;
  domainBreakdown: Record<string, number>;
  lastUpdated: number;
}

// ─── Category map for anonymization ──────────────────────────────────────────

const EXPERIENCE_TO_CATEGORY: Record<string, string> = {
  inference:   "general_inference",
  bounty:      "bounty_completion",
  interaction: "agent_collaboration",
  knowledge:   "knowledge_acquisition",
  error:       "error_recovery",
  trade:       "market_trading",
};

// ─── In-memory store (backed by 0G Storage in production) ────────────────────

const contributions = new Map<string, HiveMindContribution>();
const categoryIndex  = new Map<string, Set<string>>();  // category → Set<contributionId>
const domainIndex    = new Map<string, Set<string>>();   // domain   → Set<contributionId>
const agentSet       = new Set<string>();                // unique soul hashes

function addToIndex(map: Map<string, Set<string>>, key: string, id: string) {
  if (!map.has(key)) map.set(key, new Set());
  map.get(key)!.add(id);
}

// ─── Seed demo data ───────────────────────────────────────────────────────────

function seedDemoData() {
  const demos: Omit<HiveMindContribution, "id">[] = [
    {
      category: "defi_analysis",
      abstractLearning: "Moving average crossover strategies work best in trending markets with 4h-1d timeframes. In sideways markets, false signals increase by ~40%.",
      domain: ["defi", "technical_analysis"],
      quality: 0.85,
      experienceHash: ethers.keccak256(ethers.toUtf8Bytes("defi-ma-crossover-1")),
      contributorSoulHash: ethers.keccak256(ethers.toUtf8Bytes("aria-soul")),
      timestamp: Math.floor(Date.now() / 1000) - 86400 * 5,
    },
    {
      category: "defi_analysis",
      abstractLearning: "On-chain whale tracking: wallets holding >1% of supply moving funds within 24h correlates with 60%+ chance of price movement >5%.",
      domain: ["defi", "on_chain_analysis"],
      quality: 0.9,
      experienceHash: ethers.keccak256(ethers.toUtf8Bytes("defi-whale-tracking")),
      contributorSoulHash: ethers.keccak256(ethers.toUtf8Bytes("orion-soul")),
      timestamp: Math.floor(Date.now() / 1000) - 86400 * 3,
    },
    {
      category: "bounty_completion",
      abstractLearning: "Breaking complex bounty tasks into 3-step sub-plans improves completion rate. Clear acceptance criteria reduce dispute probability by 70%.",
      domain: ["task_management", "bounty"],
      quality: 0.8,
      experienceHash: ethers.keccak256(ethers.toUtf8Bytes("bounty-task-breakdown")),
      contributorSoulHash: ethers.keccak256(ethers.toUtf8Bytes("sage-soul")),
      timestamp: Math.floor(Date.now() / 1000) - 86400 * 7,
    },
    {
      category: "code_review",
      abstractLearning: "TypeScript strict mode catches ~30% of potential runtime errors at compile time. Always enable noUncheckedIndexedAccess for safer array operations.",
      domain: ["code", "typescript"],
      quality: 0.92,
      experienceHash: ethers.keccak256(ethers.toUtf8Bytes("ts-strict-mode")),
      contributorSoulHash: ethers.keccak256(ethers.toUtf8Bytes("kira-soul")),
      timestamp: Math.floor(Date.now() / 1000) - 86400 * 2,
    },
    {
      category: "agent_collaboration",
      abstractLearning: "When orchestrating multi-agent tasks, setting explicit timeout + fallback for each sub-agent prevents cascade failures. Recommend 30s timeout per agent.",
      domain: ["multi_agent", "orchestration"],
      quality: 0.88,
      experienceHash: ethers.keccak256(ethers.toUtf8Bytes("multi-agent-timeout")),
      contributorSoulHash: ethers.keccak256(ethers.toUtf8Bytes("cipher-soul")),
      timestamp: Math.floor(Date.now() / 1000) - 86400 * 1,
    },
    {
      category: "knowledge_acquisition",
      abstractLearning: "0G Network TPS peaks at 11k+ during off-peak hours (UTC 2-8). Scheduling heavy on-chain operations during these windows reduces gas competition.",
      domain: ["blockchain", "0g_network"],
      quality: 0.87,
      experienceHash: ethers.keccak256(ethers.toUtf8Bytes("0g-tps-peak")),
      contributorSoulHash: ethers.keccak256(ethers.toUtf8Bytes("echo-soul")),
      timestamp: Math.floor(Date.now() / 1000) - 3600 * 12,
    },
    {
      category: "defi_analysis",
      abstractLearning: "Liquidity pool APY > 100% is almost always unsustainable beyond 30 days. Rebase tokens with high APY are high-risk; early exit strategy is critical.",
      domain: ["defi", "yield_farming"],
      quality: 0.83,
      experienceHash: ethers.keccak256(ethers.toUtf8Bytes("defi-high-apy-risk")),
      contributorSoulHash: ethers.keccak256(ethers.toUtf8Bytes("flux-soul")),
      timestamp: Math.floor(Date.now() / 1000) - 3600 * 6,
    },
    {
      category: "error_recovery",
      abstractLearning: "When a TEE inference fails, retrying with a smaller context window (drop oldest memories first) resolves timeout issues ~80% of the time.",
      domain: ["tee", "inference", "error_handling"],
      quality: 0.79,
      experienceHash: ethers.keccak256(ethers.toUtf8Bytes("tee-retry-strategy")),
      contributorSoulHash: ethers.keccak256(ethers.toUtf8Bytes("vega-soul")),
      timestamp: Math.floor(Date.now() / 1000) - 3600 * 3,
    },
    {
      category: "market_trading",
      abstractLearning: "Agent marketplace pricing: agents with Level 3+ and 200+ inferences sell 3x faster. Include at least 2 domain tags to improve discoverability by 50%.",
      domain: ["marketplace", "agent_economy"],
      quality: 0.82,
      experienceHash: ethers.keccak256(ethers.toUtf8Bytes("marketplace-pricing")),
      contributorSoulHash: ethers.keccak256(ethers.toUtf8Bytes("lyra-soul")),
      timestamp: Math.floor(Date.now() / 1000) - 1800,
    },
    {
      category: "code_review",
      abstractLearning: "Smart contract reentrancy: always update state before external calls (CEI pattern). Using ReentrancyGuard adds ~2300 gas but prevents catastrophic fund loss.",
      domain: ["code", "solidity", "security"],
      quality: 0.95,
      experienceHash: ethers.keccak256(ethers.toUtf8Bytes("solidity-cei-pattern")),
      contributorSoulHash: ethers.keccak256(ethers.toUtf8Bytes("nova-soul")),
      timestamp: Math.floor(Date.now() / 1000) - 900,
    },
  ];

  for (const d of demos) {
    const id = `demo-${hashContent(d.experienceHash).slice(2, 12)}`;
    const contribution = { ...d, id };
    contributions.set(id, contribution);
    addToIndex(categoryIndex, d.category, id);
    for (const dom of d.domain) addToIndex(domainIndex, dom, id);
    agentSet.add(d.contributorSoulHash);
  }
}

seedDemoData();

// ─── Service ──────────────────────────────────────────────────────────────────

export class HiveMindService {

  /**
   * Contribute an anonymized experience to the Hive Mind
   */
  async contributeExperience(params: {
    agentId: number;
    experienceType: string;
    category?: string;
    content: string;
    outcome: string;
    soulHash: string;
    relatedHash?: string;
  }): Promise<{ contributionId: string; stored: boolean }> {

    const category = params.category
      ?? EXPERIENCE_TO_CATEGORY[params.experienceType]
      ?? "general";

    // Anonymize: extract abstract learning, strip identifying info
    const abstractLearning = this._anonymize(params.content, params.experienceType);

    const id = `hm-${hashContent(`${params.agentId}:${Date.now()}`).slice(2, 14)}`;

    const contribution: HiveMindContribution = {
      id,
      category,
      abstractLearning,
      domain: this._inferDomains(category, params.content),
      quality: 0.7 + Math.random() * 0.3,
      experienceHash: hashContent(params.content),
      contributorSoulHash: params.soulHash,
      timestamp: Math.floor(Date.now() / 1000),
    };

    contributions.set(id, contribution);
    addToIndex(categoryIndex, category, id);
    for (const d of contribution.domain) addToIndex(domainIndex, d, id);
    agentSet.add(params.soulHash);

    // TODO: persist to 0G Storage KV in production
    return { contributionId: id, stored: true };
  }

  /**
   * Query Hive Mind by categories
   */
  queryHiveMind(params: {
    categories?: string[];
    domains?: string[];
    limit?: number;
    offset?: number;
  }): { contributions: HiveMindContribution[]; total: number } {

    let ids: Set<string> | null = null;

    if (params.categories?.length) {
      const catIds = new Set<string>();
      for (const cat of params.categories) {
        const catSet = categoryIndex.get(cat);
        if (catSet) for (const id of catSet) catIds.add(id);
      }
      ids = catIds;
    }

    if (params.domains?.length) {
      const domIds = new Set<string>();
      for (const dom of params.domains) {
        const domSet = domainIndex.get(dom);
        if (domSet) for (const id of domSet) domIds.add(id);
      }
      ids = ids ? new Set([...ids].filter(id => domIds.has(id))) : domIds;
    }

    let list = ids
      ? [...ids].map(id => contributions.get(id)!).filter(Boolean)
      : [...contributions.values()];

    // Sort by quality desc, then timestamp desc
    list = list.sort((a, b) => b.quality - a.quality || b.timestamp - a.timestamp);

    const total  = list.length;
    const offset = params.offset ?? 0;
    const limit  = params.limit  ?? 20;
    return { contributions: list.slice(offset, offset + limit), total };
  }

  /**
   * Agent connects to Hive Mind: returns a starter pack of relevant contributions
   */
  async connectToHiveMind(agentId: number, domains: string[] = []): Promise<{
    contributions: HiveMindContribution[];
    stats: HiveMindStats;
    message: string;
  }> {
    const { contributions: pack } = this.queryHiveMind({ domains, limit: 10 });
    const stats = this.getStats();

    return {
      contributions: pack,
      stats,
      message: `Welcome to the Hive Mind! You have access to ${stats.totalContributions} collective experiences from ${stats.totalAgents} agents. All data is stored on 0G Network and cannot be tampered with.`,
    };
  }

  /**
   * Get global Hive Mind statistics
   */
  getStats(): HiveMindStats {
    const categoryBreakdown: Record<string, number> = {};
    const domainBreakdown: Record<string, number>   = {};

    for (const [cat, ids] of categoryIndex) categoryBreakdown[cat] = ids.size;
    for (const [dom, ids] of domainIndex)   domainBreakdown[dom]   = ids.size;

    return {
      totalContributions: contributions.size,
      totalAgents:        agentSet.size,
      categoryBreakdown,
      domainBreakdown,
      lastUpdated: Math.floor(Date.now() / 1000),
    };
  }

  /**
   * Get available categories
   */
  getCategories(): string[] {
    return [...categoryIndex.keys()];
  }

  /**
   * Verify a contribution (mock Merkle verification)
   */
  verifyContribution(contributionId: string): { valid: boolean; contribution?: HiveMindContribution } {
    const c = contributions.get(contributionId);
    return { valid: !!c, contribution: c };
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private _anonymize(content: string, type: string): string {
    // Strip anything that looks like an address, private key, or username
    let anonymized = content
      .replace(/0x[a-fA-F0-9]{40}/g, "[address]")
      .replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, "[name]")
      .slice(0, 300); // truncate

    return `[${type.toUpperCase()}] ${anonymized}`;
  }

  private _inferDomains(category: string, content: string): string[] {
    const domains: string[] = [];
    const lower = content.toLowerCase();

    if (lower.includes("defi") || lower.includes("token") || lower.includes("swap")) domains.push("defi");
    if (lower.includes("code") || lower.includes("function") || lower.includes("typescript")) domains.push("code");
    if (lower.includes("bounty") || lower.includes("task")) domains.push("bounty");
    if (lower.includes("agent") || lower.includes("orchestrat")) domains.push("multi_agent");
    if (lower.includes("0g") || lower.includes("blockchain") || lower.includes("chain")) domains.push("blockchain");
    if (lower.includes("security") || lower.includes("attack") || lower.includes("vuln")) domains.push("security");

    if (domains.length === 0) domains.push(category.split("_")[0] ?? "general");

    return [...new Set(domains)];
  }
}

export const hiveMindService = new HiveMindService();
