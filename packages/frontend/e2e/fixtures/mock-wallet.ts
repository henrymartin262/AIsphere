import { test as base, expect, Page } from "@playwright/test";

export const TEST_WALLET = "0x30e31C6E8179f7aAb6E19B26a3F46B10E4Ce7f92";

/** Inject wagmi v2 connection state into localStorage before page loads */
export async function injectWalletMock(page: Page) {
  await page.addInitScript((wallet) => {
    // wagmi v2 persisted state format (Map serialized as {value: [...], version: 2})
    const wagmiStore = {
      state: {
        connections: {
          value: [[
            "injected",
            {
              accounts: [wallet],
              chainId: 16602,
              connector: {
                id: "injected",
                name: "Injected",
                type: "injected",
                uid: "injected",
              },
            },
          ]],
          version: 2,
        },
        current: "injected",
        chainId: 16602,
      },
      version: 2,
    };
    try {
      localStorage.setItem("wagmi.store", JSON.stringify(wagmiStore));
      // Also set recentConnectorId used by RainbowKit
      localStorage.setItem("wagmi.recentConnectorId", '"injected"');
    } catch { /* ignore */ }
  }, TEST_WALLET);
}

/** Mock all backend API calls */
export async function mockApiRoutes(page: Page) {
  const wallet = TEST_WALLET;

  // Models endpoint
  await page.route("**/api/agents/models**", async (route) => {
    await route.fulfill({
      json: { success: true, data: [
        { id: "teeml-llama3", name: "LLaMA-3 (TeeML)", provider: "0G-TeeML", teeSupported: true },
        { id: "deepseek-chat", name: "DeepSeek Chat", provider: "DeepSeek", teeSupported: false },
      ]},
    });
  });

  // Single agent (must be before wildcard agents route)
  await page.route(/\/api\/agents\/8(\?.*)?$/, async (route) => {
    await route.fulfill({
      json: { success: true, data: {
        id: 8, tokenId: 8,
        profile: { name: "DeFi Advisor", description: "A DeFi strategy agent", model: "teeml-llama3", personality: "analytical" },
        stats: { level: 3, totalInferences: 42, trustScore: 88, lastActive: Date.now() },
        owner: wallet,
      }},
    });
  });

  // Agents list
  await page.route(/\/api\/agents(\?.*)?$/, async (route) => {
    await route.fulfill({
      json: { success: true, data: [
        { id: 8, tokenId: 8, profile: { name: "DeFi Advisor", model: "teeml-llama3" }, stats: { level: 3, totalInferences: 42, trustScore: 88 }, owner: wallet },
        { id: 12, tokenId: 12, profile: { name: "NFT Scout", model: "deepseek-chat" }, stats: { level: 1, totalInferences: 5, trustScore: 60 }, owner: wallet },
      ]},
    });
  });

  // Memory list & create
  await page.route(/\/api\/memory\/8(\?.*)?$/, async (route) => {
    const method = route.request().method();
    if (method === "GET") {
      await route.fulfill({
        json: { success: true, data: [
          { id: "m1", agentId: 8, type: "knowledge", content: "DeFi risk management best practices", importance: 4, timestamp: Math.floor(Date.now() / 1000), tags: ["defi", "risk"] },
          { id: "m2", agentId: 8, type: "personality", content: "Analytical and data-driven decision making", importance: 3, timestamp: Math.floor(Date.now() / 1000), tags: ["personality"] },
        ]},
      });
    } else if (method === "POST") {
      await route.fulfill({
        status: 201,
        json: { success: true, data: { id: "m-new", agentId: 8, type: "knowledge", content: "Auto-test memory", importance: 3, timestamp: Math.floor(Date.now() / 1000), tags: [] } },
      });
    } else {
      await route.continue();
    }
  });

  // Memory delete
  await page.route(/\/api\/memory\/8\/.+/, async (route) => {
    if (route.request().method() === "DELETE") {
      await route.fulfill({ json: { success: true } });
    } else {
      await route.continue();
    }
  });

  // Chat history
  await page.route(/\/api\/chat\/\d+\/history/, async (route) => {
    await route.fulfill({ json: [] });
  });

  // Chat inference
  await page.route(/\/api\/chat\/\d+$/, async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        json: {
          success: true,
          data: {
            response: "This is a mock AI response for E2E testing.",
            proof: { proofHash: "0xabc", teeVerified: false, timestamp: Date.now(), inferenceMode: "mock" },
          },
        },
      });
    } else {
      await route.continue();
    }
  });

  // Explore agents — actual path is /explore/agents
  await page.route(/\/api\/explore\/agents(\?.*)?$/, async (route) => {
    await route.fulfill({
      json: { success: true, data: {
        agents: [
          { id: 1, tokenId: 1, profile: { name: "Alpha Agent", description: "AI research agent" }, stats: { level: 2, totalInferences: 100, trustScore: 75 }, owner: "0x1111" },
          { id: 2, tokenId: 2, profile: { name: "Beta Agent", description: "DeFi analytics agent" }, stats: { level: 4, totalInferences: 300, trustScore: 92 }, owner: "0x2222" },
          { id: 3, tokenId: 3, profile: { name: "Gamma Agent", description: "NFT valuation agent" }, stats: { level: 1, totalInferences: 20, trustScore: 55 }, owner: "0x3333" },
        ],
        total: 3,
      }},
    });
  });

  // Explore stats
  await page.route(/\/api\/explore\/stats(\?.*)?$/, async (route) => {
    await route.fulfill({
      json: { success: true, data: { totalAgents: 3, activeAgents: 2, totalInferences: 420, avgTrustScore: 74 } },
    });
  });
}

/** Extended test fixture: wallet mock + API mocks applied before page loads */
export const test = base.extend<{ authedPage: Page }>({
  authedPage: async ({ page }, use) => {
    await injectWalletMock(page);
    await mockApiRoutes(page);
    await use(page);
  },
});

export { expect };
