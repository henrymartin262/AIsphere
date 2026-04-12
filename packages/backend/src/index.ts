import cors from "cors";
import express from "express";

import { env } from "./config/index.js";
import { initialize0GClients } from "./config/og.js";
import * as OpenClawService from "./services/OpenClawService.js";
import * as AgentService from "./services/AgentService.js";
import * as BountyService from "./services/BountyService.js";
import { passportService } from "./services/PassportService.js";
import { soulService } from "./services/SoulService.js";
import { hiveMindService } from "./services/HiveMindService.js";
import { walletAuth } from "./middleware/auth.js";
import agentRoutes from "./routes/agentRoutes.js";
import bountyRoutes from "./routes/bountyRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import decisionRoutes from "./routes/decisionRoutes.js";
import exploreRoutes from "./routes/exploreRoutes.js";
import memoryRoutes from "./routes/memoryRoutes.js";
import multiAgentRoutes from "./routes/multiAgentRoutes.js";
import openclawRoutes from "./routes/openclawRoutes.js";
import passportRoutes from "./routes/passportRoutes.js";
import soulRoutes from "./routes/soulRoutes.js";
import hiveMindRoutes from "./routes/hiveMindRoutes.js";
import gatewayRoutes from "./routes/gatewayRoutes.js";
import mediaRoutes from "./routes/mediaRoutes.js";
import computeRoutes from "./routes/computeRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", async (_req, res) => {
  const clients = await initialize0GClients();
  const openclawStatus = await OpenClawService.getStatus();

  res.status(200).json({
    service: "@sealmind/backend",
    version: "3.0.0",
    status: "ok",
    chainId: env.CHAIN_ID,
    providerUrl: clients.providerUrl,
    integrations: {
      "0g-chain": clients.brokerStatus,
      "0g-kv-storage": clients.kvReady ? "ready" : "unavailable",
      "0g-compute-broker": clients.brokerStatus,
      "0g-provider-discovery": clients.brokerStatus,
      "0g-text-to-image": clients.brokerStatus,
      "0g-speech-to-text": clients.brokerStatus,
      "0g-compute-account": clients.brokerStatus,
      "0g-storage-chain-crosslayer": clients.kvReady ? "ready" : "unavailable",
      "openclaw": openclawStatus.registered ? "active" : "standby",
      "multi-agent": "enabled",
      "passport": "enabled",
      "living-soul": "enabled",
      "hive-mind": "enabled",
      "mcp-server": "enabled",
    },
    openclaw: openclawStatus,
    timestamp: new Date().toISOString()
  });
});

app.use("/api/agents",      walletAuth, agentRoutes);
app.use("/api/bounty",      bountyRoutes);
app.use("/api/chat",        walletAuth, chatRoutes);
app.use("/api/memory",      walletAuth, memoryRoutes);
app.use("/api/decisions",   decisionRoutes);
app.use("/api/explore",     exploreRoutes);
app.use("/api/multi-agent", walletAuth, multiAgentRoutes);
app.use("/api/openclaw",    openclawRoutes);
// v3.0 routes — POST operations require walletAuth, GET operations are public
app.use("/api/passport",    passportRoutes);
app.use("/api/soul",        walletAuth, soulRoutes);
app.use("/api/hivemind",    hiveMindRoutes);
app.use("/api/gateway",     gatewayRoutes);
app.use("/api/compute",     walletAuth, computeRoutes);
app.use("/api/media",       walletAuth, mediaRoutes);
app.use(errorHandler);

async function bootstrap() {
  await initialize0GClients();
  await passportService.init();
  await soulService.init();
  await hiveMindService.init();

  // Pre-warm caches so first user request is instant (not RPC timeout)
  // Warm both limit=20 (stats page) and limit=100 (explore page uses this)
  console.log("[Bootstrap] Pre-warming caches...");
  await Promise.allSettled([
    AgentService.listPublicAgents(0, 20),
    AgentService.listPublicAgents(0, 100),
    BountyService.getBounties(0, 50),
  ]);
  console.log("[Bootstrap] Cache warm-up complete");

  app.listen(env.PORT, () => {
    console.log(`SealMind backend v3.0 listening on http://localhost:${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to bootstrap backend:", error);
  process.exit(1);
});

export default app;
