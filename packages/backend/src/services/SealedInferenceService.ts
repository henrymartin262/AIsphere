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

// Internal shape of a service entry returned by the broker
interface BrokerService {
  provider: string;
  serviceType: string;
  url: string;
  model: string;
  verifiability: string;
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

// ─── Service ──────────────────────────────────────────────────────────────────

export async function inference(
  agentId: number,
  userMessage: string,
  context: string,
  model = "teeml-llama3"
): Promise<InferenceResult> {
  const clients = await initialize0GClients();

  // ── Layer 1: 0G Compute Broker (TeeML) ────────────────────────────────────
  if (clients.brokerStatus === "ready" && clients.signer) {
    try {
      const { createZGComputeNetworkBroker } = await import("@0glabs/0g-serving-broker");
      // Use unknown cast to bridge ESM vs CJS ethers Wallet type mismatch
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const broker = await createZGComputeNetworkBroker(clients.signer as any);

      const prompt = context
        ? `System context:\n${context}\n\nUser: ${userMessage}\nAssistant:`
        : `User: ${userMessage}\nAssistant:`;

      // listService returns available providers; pick the first TEE-verified one
      const services = (await broker.inference.listService()) as BrokerService[];
      const teeService = services.find(
        (s) =>
          s.verifiability?.toLowerCase().includes("tee") ||
          s.model?.toLowerCase().includes("llama") ||
          s.serviceType?.toLowerCase().includes("teeml")
      );

      if (teeService) {
        const rawHeaders = await broker.inference.getRequestHeaders(
          teeService.provider,
          prompt
        );
        // ServingRequestHeaders doesn't have an index signature — spread via unknown
        const headers = rawHeaders as unknown as Record<string, string>;

        const response = await fetch(`${teeService.url}/v1/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...headers
          },
          body: JSON.stringify({
            model: teeService.model || model,
            messages: [{ role: "user", content: prompt }],
            max_tokens: 512
          })
        });

        if (response.ok) {
          const data = (await response.json()) as {
            choices: Array<{ message: { content: string } }>;
            signatures?: { attestation: string };
          };
          const text = data.choices?.[0]?.message?.content ?? "";
          const proof = buildProof(
            teeService.model || model,
            prompt,
            text,
            true,
            "tee",
            data.signatures?.attestation
          );
          return { response: text, proof };
        }
      }
    } catch (err) {
      console.warn("[SealedInference] Broker inference failed, falling back to DeepSeek:", err);
    }
  }

  // ── Layer 2: DeepSeek API ──────────────────────────────────────────────────
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

  // ── Layer 3: Mock fallback ─────────────────────────────────────────────────
  const mockResponse = generateMockResponse(agentId, userMessage, context);
  const proof = buildProof(model, userMessage, mockResponse, false, "mock");
  return { response: mockResponse, proof };
}

export async function listAvailableModels(): Promise<ModelInfo[]> {
  const clients = await initialize0GClients();

  if (clients.brokerStatus === "ready" && clients.signer) {
    try {
      const { createZGComputeNetworkBroker } = await import("@0glabs/0g-serving-broker");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const broker = await createZGComputeNetworkBroker(clients.signer as any);
      const services = (await broker.inference.listService()) as BrokerService[];
      return services.map((s) => ({
        id: s.provider,
        name: s.model || s.provider,
        provider: "0G-TeeML",
        teeSupported: s.verifiability?.toLowerCase().includes("tee") ?? false
      }));
    } catch (err) {
      console.warn("[SealedInference] listAvailableModels failed:", err);
    }
  }

  return [
    { id: "teeml-llama3", name: "LLaMA-3 (TeeML)", provider: "0G-TeeML", teeSupported: true },
    { id: "deepseek-chat", name: "DeepSeek Chat", provider: "DeepSeek", teeSupported: false },
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
