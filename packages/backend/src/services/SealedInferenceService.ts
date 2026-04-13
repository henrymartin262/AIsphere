import { hashContent } from "../utils/encryption.js";
import { initialize0GClients } from "../config/og.js";
import { env } from "../config/index.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InferenceProof {
  modelHash: string;
  inputHash: string;
  outputHash: string;
  signature?: string;
  timestamp: number;
  teeVerified: boolean;
  proofHash: string;
  inferenceMode: "tee" | "real" | "mock";
}

export interface InferenceResult {
  response: string;
  proof: InferenceProof;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  teeSupported: boolean;
}

export interface ProviderInfo {
  address: string;
  serviceType: string;
  url: string;
  model: string;
  teeVerified: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildProof(
  model: string,
  input: string,
  output: string,
  teeVerified: boolean,
  inferenceMode: "tee" | "real" | "mock",
  signature?: string
): InferenceProof {
  const timestamp = Date.now();
  const modelHash = hashContent(model);
  const inputHash = hashContent(input);
  const outputHash = hashContent(output);
  const proofHash = hashContent(`${inputHash}${outputHash}${modelHash}${timestamp}`);
  return { modelHash, inputHash, outputHash, signature, timestamp, teeVerified, proofHash, inferenceMode };
}

// ─── Provider Discovery ───────────────────────────────────────────────────────

/**
 * Discover all available inference providers from the 0G Compute broker.
 * Returns an empty array when broker is unavailable (mock mode).
 *
 * listService() returns a tuple array where each tuple is:
 *   [0]=address, [1]=serviceType, [2]=url, [3]=name, [4]=..., [5]=...,
 *   [6]=model, [7]=..., [8]=..., [9]=..., [10]=teeVerified (boolean)
 */
export async function discoverProviders(): Promise<ProviderInfo[]> {
  const clients = await initialize0GClients();

  if (clients.brokerStatus !== "ready" || !clients.signer) {
    return [];
  }

  try {
    const { createZGComputeNetworkBroker } = await import("@0glabs/0g-serving-broker");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const broker = await createZGComputeNetworkBroker(clients.signer as any);
    const services = (await broker.inference.listService()) as unknown[][];

    return services
      .filter((s) => Array.isArray(s) && s.length > 1)
      .map((s) => ({
        address: (s[0] as string) ?? "",
        serviceType: (s[1] as string) ?? "",
        url: (s[2] as string) ?? "",
        model: (s[6] as string) ?? (s[3] as string) ?? "",
        teeVerified: s[10] === true
      }));
  } catch (err) {
    console.warn("[SealedInference] discoverProviders failed:", err);
    return [];
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export async function inference(
  agentId: number,
  userMessage: string,
  context: string,
  model = "teeml-llama3"
): Promise<InferenceResult> {
  const clients = await initialize0GClients();

  // ── Layer 1: 0G Compute Broker (TeeML) ────────────────────────────────────
  // Use testnet signer for Compute Broker — testnet has active TEE providers + 30 A0GI balance
  if (clients.brokerStatus === "ready" && env.PRIVATE_KEY) {
    try {
      const { createZGComputeNetworkBroker } = await import("@0glabs/0g-serving-broker");
      const { ethers: ethersLib } = await import("ethers");

      // Create a testnet-specific signer for the Compute Broker
      const TESTNET_RPC = "https://evmrpc-testnet.0g.ai";
      const testProvider = new ethersLib.JsonRpcProvider(TESTNET_RPC);
      const testSigner = new ethersLib.Wallet(env.PRIVATE_KEY, testProvider);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const broker = await createZGComputeNetworkBroker(testSigner as any);

      const prompt = context
        ? `System context:\n${context}\n\nUser: ${userMessage}\nAssistant:`
        : `User: ${userMessage}\nAssistant:`;

      // listService returns tuple arrays; pick TEE provider first, fall back to any chatbot
      const services = (await broker.inference.listService()) as unknown[][];
      const chatbotServices = services.filter(
        (s) => Array.isArray(s) && (s[1] as string) === "chatbot"
      );
      const teeProviders = chatbotServices.filter((s) => s[10] === true);
      const anyProviders = chatbotServices;

      const provider = teeProviders[0] ?? anyProviders[0] ?? null;

      if (provider) {
        const providerAddress = provider[0] as string;
        const providerUrl = provider[2] as string;
        const providerModel = (provider[6] as string) ?? (provider[3] as string) ?? model;
        const isTeeVerified = provider[10] === true;

        // Acknowledge provider signer before first use
        try {
          await broker.inference.acknowledgeProviderSigner(providerAddress);
        } catch (ackErr) {
          console.warn("[SealedInference] acknowledgeProviderSigner failed (non-fatal):", ackErr);
        }

        const rawHeaders = await broker.inference.getRequestHeaders(providerAddress, prompt);
        // ServingRequestHeaders doesn't have an index signature — spread via unknown
        const headers = rawHeaders as unknown as Record<string, string>;

        const response = await fetch(`${providerUrl}/v1/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...headers
          },
          body: JSON.stringify({
            model: providerModel,
            messages: [{ role: "user", content: prompt }],
            max_tokens: 512
          })
        });

        if (response.ok) {
          // Extract chatID from response header for fee settlement
          const chatID = response.headers.get("ZG-Res-Key") ?? "";

          const data = (await response.json()) as {
            choices: Array<{ message: { content: string } }>;
            usage?: unknown;
            signatures?: { attestation: string };
          };
          const text = data.choices?.[0]?.message?.content ?? "";

          // processResponse is required for fee settlement — must be called after inference
          if (chatID) {
            try {
              await broker.inference.processResponse(providerAddress, chatID, data.usage as string | undefined);
            } catch (processErr) {
              console.warn("[SealedInference] processResponse failed (non-fatal):", processErr);
            }
          }

          const proof = buildProof(
            providerModel,
            prompt,
            text,
            isTeeVerified,
            isTeeVerified ? "tee" : "real",
            data.signatures?.attestation
          );
          return { response: text, proof };
        }
      }
    } catch (err) {
      console.warn("[SealedInference] Broker inference failed, falling back to DeepSeek:", err);
    }
  }

  // ── Layer 2: GLM (ZhiPu AI) — Primary real inference ───────────────────────
  if (env.GLM_API_KEY) {
    try {
      const response = await fetch(`${env.GLM_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${env.GLM_API_KEY}`
        },
        body: JSON.stringify({
          model: env.GLM_MODEL,
          messages: [
            { role: "system", content: context || "You are a helpful AI agent on SealMind, a privacy-sovereign AI Agent OS built on 0G Network." },
            { role: "user", content: userMessage }
          ],
          max_tokens: 1024,
          temperature: 0.7
        })
      });

      if (response.ok) {
        const data = (await response.json()) as {
          choices: Array<{ message: { content: string } }>;
        };
        const text = data.choices?.[0]?.message?.content ?? "";
        const proof = buildProof(env.GLM_MODEL, userMessage, text, false, "real");
        console.log(`[SealedInference] GLM (${env.GLM_MODEL}) inference succeeded`);
        return { response: text, proof };
      } else {
        console.warn("[SealedInference] GLM API returned non-OK status:", response.status);
      }
    } catch (err) {
      console.warn("[SealedInference] GLM inference failed, falling back to DeepSeek:", err);
    }
  }

  // ── Layer 3: DeepSeek API (fallback) ──────────────────────────────────────
  if (env.DEEPSEEK_API_KEY) {
    try {
      const response = await fetch(`${env.DEEPSEEK_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${env.DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: context || "You are a helpful AI agent." },
            { role: "user", content: userMessage }
          ],
          max_tokens: 1024,
          temperature: 0.7
        })
      });

      if (response.ok) {
        const data = (await response.json()) as {
          choices: Array<{ message: { content: string } }>;
        };
        const text = data.choices?.[0]?.message?.content ?? "";
        const proof = buildProof("deepseek-chat", userMessage, text, false, "real");
        return { response: text, proof };
      } else {
        console.warn("[SealedInference] DeepSeek API returned non-OK status:", response.status);
      }
    } catch (err) {
      console.warn("[SealedInference] DeepSeek inference failed, falling back to mock:", err);
    }
  }

  // ── Layer 4: Mock fallback ─────────────────────────────────────────────────
  const mockResponse = generateMockResponse(agentId, userMessage, context);
  const proof = buildProof(model, userMessage, mockResponse, false, "mock");
  return { response: mockResponse, proof };
}

export async function listAvailableModels(): Promise<ModelInfo[]> {
  const providers = await discoverProviders();

  if (providers.length > 0) {
    return providers.map((p) => ({
      id: p.address,
      name: p.model || p.address,
      provider: "0G-TeeML",
      teeSupported: p.teeVerified
    }));
  }

  return [
    { id: "teeml-llama3", name: "LLaMA-3 (TeeML)", provider: "0G-TeeML", teeSupported: true },
    { id: "deepseek-chat", name: "DeepSeek Chat", provider: "DeepSeek", teeSupported: false },
    ...(env.GLM_API_KEY ? [{ id: env.GLM_MODEL, name: `GLM (${env.GLM_MODEL})`, provider: "ZhiPu AI", teeSupported: false }] : []),
    { id: "mock-gpt", name: "Mock GPT (Dev)", provider: "local", teeSupported: false }
  ];
}

// ─── Mock response generator ──────────────────────────────────────────────────

function generateMockResponse(agentId: number, message: string, _context: string): string {
  const responses = [
    `As Agent #${agentId}, I've processed your request: "${message}". In a production environment, this would be handled by a TEE-verified LLaMA model via 0G Compute Broker.`,
    `I understand you're asking about "${message}". This is a simulated response from Agent #${agentId} while the 0G inference network is not configured.`,
    `Agent #${agentId} here. Your query "${message}" has been received. TEE verification is pending network configuration.`
  ];
  return responses[Math.abs(message.length + agentId) % responses.length];
}
