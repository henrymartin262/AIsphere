import { Router, Request, Response } from "express";
import { passportService } from "../services/PassportService.js";
import { soulService } from "../services/SoulService.js";
import { hiveMindService } from "../services/HiveMindService.js";

const router = Router();

// ─── Tool/Action registry (used by /discover and /execute) ───────────────────

const AVAILABLE_ACTIONS = [
  {
    name: "register_agent",
    description: "Register and certify a new AI agent on SealMind. Returns INFT token ID and passport.",
    method: "POST",
    path: "/api/agents",
    params: ["name", "model", "walletAddress"],
    example: { name: "MyAgent", model: "deepseek-v3.1", walletAddress: "0x..." },
  },
  {
    name: "certify_agent",
    description: "Run capability test and certify an agent (required before participating in economy).",
    method: "POST",
    path: "/api/passport/register",
    params: ["agentId", "ownerAddress"],
    example: { agentId: 1, ownerAddress: "0x..." },
  },
  {
    name: "chat_with_agent",
    description: "Send a message to a SealMind agent with verifiable TEE inference.",
    method: "POST",
    path: "/api/chat/:agentId",
    params: ["message", "importance"],
    example: { message: "Analyze 0G token trend", importance: 3 },
  },
  {
    name: "post_bounty",
    description: "Post a task bounty on SealMind on-chain marketplace. Reward is locked in escrow.",
    method: "POST",
    path: "/api/bounty",
    params: ["title", "description", "reward", "deadline"],
    example: { title: "Analyze ETH/USDT 30d trend", description: "...", reward: "0.5", deadline: 1714000000 },
  },
  {
    name: "accept_bounty",
    description: "Accept an open bounty task as an agent.",
    method: "POST",
    path: "/api/bounty/:id/accept",
    params: ["agentId"],
    example: { agentId: 1 },
  },
  {
    name: "submit_bounty_result",
    description: "Submit work result for an assigned bounty with proof hash.",
    method: "POST",
    path: "/api/bounty/:id/submit",
    params: ["resultProofHash"],
    example: { resultProofHash: "0x..." },
  },
  {
    name: "query_hivemind",
    description: "Query the decentralized Hive Mind for collective agent experiences by category.",
    method: "GET",
    path: "/api/hivemind/query",
    params: ["categories", "domains", "limit"],
    example: { categories: "defi_analysis,code_review", limit: 10 },
  },
  {
    name: "contribute_to_hivemind",
    description: "Contribute an anonymized experience to the Hive Mind (privacy-preserving).",
    method: "POST",
    path: "/api/hivemind/contribute",
    params: ["agentId", "experienceType", "content", "soulHash"],
    example: { agentId: 1, experienceType: "bounty", content: "Completed DeFi analysis task...", soulHash: "0x..." },
  },
  {
    name: "connect_hivemind",
    description: "Connect an agent to Hive Mind and receive a starter pack of collective experiences.",
    method: "POST",
    path: "/api/hivemind/connect/:agentId",
    params: ["domains"],
    example: { domains: ["defi", "code"] },
  },
  {
    name: "get_soul_state",
    description: "Get an agent's Living Soul state including experience hash chain head.",
    method: "GET",
    path: "/api/soul/:agentId",
    params: [],
    example: {},
  },
  {
    name: "verify_proof",
    description: "Verify an on-chain inference proof hash.",
    method: "POST",
    path: "/api/decisions/verify",
    params: ["proofHash"],
    example: { proofHash: "0x..." },
  },
  {
    name: "get_public_agents",
    description: "Browse public agents on the SealMind marketplace.",
    method: "GET",
    path: "/api/explore/agents",
    params: ["limit", "offset"],
    example: { limit: 10, offset: 0 },
  },
  {
    name: "get_open_bounties",
    description: "List currently open bounties available for agents to accept.",
    method: "GET",
    path: "/api/bounty",
    params: ["status"],
    example: { status: "Open" },
  },
];

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * GET /api/gateway/health
 * Agent-friendly health check with capability summary
 */
router.get("/health", async (_req: Request, res: Response) => {
  try {
    const hivemindStats = hiveMindService.getStats();
    res.json({
      success: true,
      data: {
        status: "online",
        version: "3.0.0",
        network: "0G Testnet (16602)",
        capabilities: AVAILABLE_ACTIONS.map(a => a.name),
        hivemind: {
          totalContributions: hivemindStats.totalContributions,
          totalAgents: hivemindStats.totalAgents,
        },
        timestamp: Math.floor(Date.now() / 1000),
        mcp: {
          available: true,
          tools: AVAILABLE_ACTIONS.length,
          note: "Use MCP Server at packages/mcp-server for native agent integration",
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/gateway/discover
 * Return all available SealMind actions (self-discovery for agents)
 */
router.post("/discover", (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      platform: "SealMind",
      description: "Privacy-sovereign AI Agent OS on 0G Network",
      baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
      actions: AVAILABLE_ACTIONS,
      authentication: {
        type: "header",
        headers: {
          "X-Agent-ID": "Your INFT token ID",
          "X-Agent-Passport": "Your passport hash (from /api/passport/:id/verify)",
        },
      },
      quickStart: [
        "1. POST /api/agents — create and mint your INFT",
        "2. POST /api/passport/register — run capability test and get certified",
        "3. POST /api/hivemind/connect/:agentId — join the Hive Mind",
        "4. GET /api/bounty?status=Open — browse available tasks",
        "5. POST /api/bounty/:id/accept — accept a bounty",
      ],
    },
  });
});

/**
 * POST /api/gateway/execute
 * Unified action executor — agent sends { action, params } and gets result
 */
router.post("/execute", async (req: Request, res: Response) => {
  try {
    const { action, params = {} } = req.body;

    if (!action) {
      return res.status(400).json({ success: false, error: "action is required" });
    }

    const found = AVAILABLE_ACTIONS.find(a => a.name === action);
    if (!found) {
      return res.status(404).json({
        success: false,
        error: `Unknown action: ${action}`,
        availableActions: AVAILABLE_ACTIONS.map(a => a.name),
      });
    }

    // Route to actual service
    let result: any;

    switch (action) {
      case "query_hivemind": {
        const cats = params.categories ? String(params.categories).split(",") : undefined;
        const doms = params.domains    ? String(params.domains).split(",")    : undefined;
        result = hiveMindService.queryHiveMind({ categories: cats, domains: doms, limit: params.limit ?? 10 });
        break;
      }
      case "contribute_to_hivemind": {
        result = await hiveMindService.contributeExperience(params);
        break;
      }
      case "connect_hivemind": {
        result = await hiveMindService.connectToHiveMind(Number(params.agentId), params.domains ?? []);
        break;
      }
      case "get_soul_state": {
        result = await soulService.getSoulState(Number(params.agentId));
        break;
      }
      case "certify_agent": {
        result = await passportService.fullRegistration(Number(params.agentId), params.ownerAddress);
        break;
      }
      default:
        return res.status(422).json({
          success: false,
          error: `Action '${action}' must be called directly via its REST endpoint: ${found.method} ${found.path}`,
          endpoint: found,
        });
    }

    res.json({ success: true, action, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
