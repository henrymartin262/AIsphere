import cors from "cors";
import express from "express";

import { env } from "./config/index.js";
import { initialize0GClients } from "./config/og.js";
import * as OpenClawService from "./services/OpenClawService.js";
import { walletAuth } from "./middleware/auth.js";
import agentRoutes from "./routes/agentRoutes.js";
import bountyRoutes from "./routes/bountyRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import decisionRoutes from "./routes/decisionRoutes.js";
import exploreRoutes from "./routes/exploreRoutes.js";
import memoryRoutes from "./routes/memoryRoutes.js";
import multiAgentRoutes from "./routes/multiAgentRoutes.js";
import openclawRoutes from "./routes/openclawRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", async (_req, res) => {
  const clients = await initialize0GClients();
  const openclawStatus = await OpenClawService.getStatus();

  res.status(200).json({
    service: "@sealmind/backend",
    status: "ok",
    chainId: env.CHAIN_ID,
    providerUrl: clients.providerUrl,
    integrations: {
      "0g-chain": clients.brokerStatus,
      "0g-kv-storage": clients.kvReady ? "ready" : "unavailable",
      "0g-compute-broker": clients.brokerStatus,
      "openclaw": openclawStatus.registered ? "active" : "standby",
      "multi-agent": "enabled"
    },
    openclaw: openclawStatus,
    timestamp: new Date().toISOString()
  });
});

app.use("/api/agents", walletAuth, agentRoutes);
app.use("/api/bounty", bountyRoutes);
app.use("/api/chat", walletAuth, chatRoutes);
app.use("/api/memory", walletAuth, memoryRoutes);
app.use("/api/decisions", decisionRoutes);
app.use("/api/explore", exploreRoutes);
app.use("/api/multi-agent", walletAuth, multiAgentRoutes);
app.use("/api/openclaw", openclawRoutes);
app.use(errorHandler);

async function bootstrap() {
  await initialize0GClients();

  app.listen(env.PORT, () => {
    console.log(`SealMind backend listening on http://localhost:${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to bootstrap backend:", error);
  process.exit(1);
});

export default app;
