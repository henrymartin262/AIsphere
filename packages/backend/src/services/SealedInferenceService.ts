import { hashContent } from "../utils/encryption.js";
import { initialize0GClients } from "../config/og.js";
import { env } from "../config/index.js";
import type { BuiltPrompt, ChatMessage } from "./PromptBuilder.js";
import { buildPrompt as _buildPrompt } from "./PromptBuilder.js";

/** Timeout for each LLM API call (ms). Front-end CHAT_TIMEOUT is 90s; keep backend tighter. */
const LLM_FETCH_TIMEOUT_MS = 60_000; // 60s per inference call

function makeFetchSignal(): AbortSignal {
  if (typeof AbortSignal.timeout === "function") return AbortSignal.timeout(LLM_FETCH_TIMEOUT_MS);
  const ctrl = new AbortController();
  setTimeout(() => ctrl.abort(), LLM_FETCH_TIMEOUT_MS);
  return ctrl.signal;
}

/** Normalise a string context or a pre-built BuiltPrompt into a BuiltPrompt */
function normalisePrompt(promptOrContext: BuiltPrompt | string, userMessage: string, agentId: number): BuiltPrompt {
  if (typeof promptOrContext === "string") {
    // Legacy callers pass a plain context string — wrap it into a minimal BuiltPrompt
    return _buildPrompt(
      { agentId, agentName: `Agent #${agentId}`, personalityContext: promptOrContext },
      [],
      userMessage
    );
  }
  return promptOrContext;
}

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
  promptOrContext: BuiltPrompt | string,
  model = "teeml-llama3"
): Promise<InferenceResult> {
  const clients = await initialize0GClients();
  const prompt = normalisePrompt(promptOrContext, userMessage, agentId);

  // ── Layer 1: 0G Compute Broker (TeeML) ────────────────────────────────────
  if (clients.brokerStatus === "ready" && env.PRIVATE_KEY) {
    try {
      const { createZGComputeNetworkBroker } = await import("@0glabs/0g-serving-broker");
      const { ethers: ethersLib } = await import("ethers");

      const TESTNET_RPC = "https://evmrpc-testnet.0g.ai";
      const testProvider = new ethersLib.JsonRpcProvider(TESTNET_RPC);
      const testSigner = new ethersLib.Wallet(env.PRIVATE_KEY, testProvider);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const broker = await createZGComputeNetworkBroker(testSigner as any);

      const services = (await broker.inference.listService()) as unknown[][];
      const chatbotServices = services.filter(
        (s) => Array.isArray(s) && (
          (s[1] as string) === "chatbot" ||
          (s[1] as string) === "inference" ||
          (s[1] as string) === "llm"
        )
      );
      const candidates = chatbotServices.length > 0 ? chatbotServices : services.filter(Array.isArray);
      const teeProviders = candidates.filter((s) => s[10] === true);
      const anyProviders = candidates;

      console.log(`[SealedInference] services=${services.length} chatbot=${chatbotServices.length} tee=${teeProviders.length}`);

      const provider = teeProviders[0] ?? anyProviders[0] ?? null;

      if (provider) {
        const providerAddress = provider[0] as string;
        const isTeeVerified = provider[10] === true;

        let endpoint: string;
        let providerModel: string;
        try {
          const meta = await (broker.inference as any).getServiceMetadata(providerAddress);
          endpoint = meta.endpoint as string;
          providerModel = (meta.model as string) ?? ((provider[6] as string) ?? (provider[3] as string) ?? model);
          console.log(`[SealedInference] metadata: endpoint=${endpoint} model=${providerModel}`);
        } catch (metaErr) {
          endpoint = (provider[2] as string);
          providerModel = (provider[6] as string) ?? (provider[3] as string) ?? model;
          console.warn(`[SealedInference] getServiceMetadata failed, using tuple: ${endpoint}`, (metaErr as Error).message);
        }

        try {
          await broker.inference.acknowledgeProviderSigner(providerAddress);
          console.log(`[SealedInference] acknowledgeProviderSigner ok: ${providerAddress}`);
        } catch (ackErr) {
          console.warn("[SealedInference] acknowledgeProviderSigner failed (non-fatal):", (ackErr as Error).message);
        }

        let rawHeaders: unknown;
        try {
          rawHeaders = await (broker.inference as any).getRequestHeaders(providerAddress);
          console.log(`[SealedInference] getRequestHeaders ok`);
        } catch (hdrErr) {
          console.warn("[SealedInference] getRequestHeaders failed, falling back:", (hdrErr as Error).message);
          throw hdrErr;
        }
        const headers = rawHeaders as Record<string, string>;

        const chatUrl = `${endpoint}/chat/completions`;
        console.log(`[SealedInference] Calling ${chatUrl} model=${providerModel}`);

        let response: Response;
        try {
          // Use structured messages array (system + history + user)
          response = await fetch(chatUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...headers },
            body: JSON.stringify({
              model: providerModel,
              messages: prompt.messages,
              max_tokens: 512
            }),
            signal: makeFetchSignal(),
          });
          console.log(`[SealedInference] Provider response status: ${response.status}`);
        } catch (fetchErr) {
          // Some 0G providers don't support messages array — fall back to flat prompt
          console.warn("[SealedInference] messages fetch failed, retrying with flat prompt:", (fetchErr as Error).message);
          response = await fetch(chatUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...headers },
            body: JSON.stringify({
              model: providerModel,
              messages: [{ role: "user", content: prompt.flatPrompt }],
              max_tokens: 512
            }),
            signal: makeFetchSignal(),
          });
        }

        if (response.ok) {
          const data = (await response.json()) as {
            id?: string;
            choices: Array<{ message: { content: string } }>;
            usage?: unknown;
            signatures?: { attestation: string };
          };
          const text = data.choices?.[0]?.message?.content ?? "";

          const chatID = response.headers.get("ZG-Res-Key") ?? response.headers.get("zg-res-key") ?? data.id ?? "";
          console.log(`[SealedInference] TEE response ok, chatID=${chatID} tee=${isTeeVerified}`);

          if (chatID) {
            try {
              await broker.inference.processResponse(providerAddress, chatID, JSON.stringify(data.usage ?? {}));
            } catch (processErr) {
              console.warn("[SealedInference] processResponse failed (non-fatal):", (processErr as Error).message);
            }
          }

          const proof = buildProof(
            providerModel,
            prompt.flatPrompt,
            text,
            isTeeVerified,
            isTeeVerified ? "tee" : "real",
            data.signatures?.attestation
          );
          return { response: text, proof };
        }
      }
    } catch (err) {
      console.warn("[SealedInference] Broker inference failed, falling back:", err);
    }
  }

  // ── Layer 2: GLM (ZhiPu AI) ───────────────────────────────────────────────
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
          messages: prompt.messages,   // ← full structured messages with history
          max_tokens: 1024,
          temperature: 0.7
        }),
        signal: makeFetchSignal(),
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

  // ── Layer 3: DeepSeek API ─────────────────────────────────────────────────
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
          messages: prompt.messages,   // ← full structured messages with history
          max_tokens: 1024,
          temperature: 0.7
        }),
        signal: makeFetchSignal(),
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
  const mockResponse = generateMockResponse(agentId, userMessage, prompt.systemPrompt);
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
