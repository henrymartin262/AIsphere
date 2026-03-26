import cors from "cors";
import express from "express";

import { env } from "./config/index.js";
import { initialize0GClients } from "./config/og.js";
import agentRoutes from "./routes/agentRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import decisionRoutes from "./routes/decisionRoutes.js";
import exploreRoutes from "./routes/exploreRoutes.js";
import memoryRoutes from "./routes/memoryRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", async (_req, res) => {
  const clients = await initialize0GClients();

  res.status(200).json({
    service: "@sealmind/backend",
    status: "ok",
    chainId: env.CHAIN_ID,
    providerUrl: clients.providerUrl,
    timestamp: new Date().toISOString()
  });
});

app.use("/api/agents", agentRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/memory", memoryRoutes);
app.use("/api/decisions", decisionRoutes);
app.use("/api/explore", exploreRoutes);
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
