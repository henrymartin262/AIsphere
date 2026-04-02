import { initialize0GClients } from "../config/og.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TextToImageParams {
  prompt: string;
  width?: number;   // default 512
  height?: number;  // default 512
  n?: number;       // default 1
}

export interface TextToImageResult {
  images: Array<{ url?: string; b64_json?: string }>;
  providerAddress: string;
  teeVerified: boolean;
  cost: string;  // estimated fee (A0GI)
  mock?: boolean;
}

export interface SpeechToTextParams {
  audioBuffer: Buffer;
  filename: string;       // e.g. "audio.mp3"
  mimeType: string;       // e.g. "audio/mpeg"
  language?: string;      // e.g. "en"
  responseFormat?: "json" | "text" | "srt" | "verbose_json";
}

export interface SpeechToTextResult {
  text: string;
  language?: string;
  duration?: number;
  segments?: Array<{ start: number; end: number; text: string }>;
  providerAddress: string;
  teeVerified: boolean;
  mock?: boolean;
}

export interface MediaProviderInfo {
  address: string;
  serviceType: string;
  teeVerified: boolean;
}

// Internal shape of a service entry returned by the broker
// provider[0] = address, provider[1] = serviceType, provider[2] = url, provider[3+] = other fields
type ServiceEntry = [string, string, string, ...unknown[]];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isTeeVerified(entry: ServiceEntry): boolean {
  // Check verifiability field if present (index 4 or beyond)
  const extra = entry.slice(3).join(" ").toLowerCase();
  return extra.includes("tee") || extra.includes("verified");
}

// ─── Service ──────────────────────────────────────────────────────────────────

export async function textToImage(params: TextToImageParams): Promise<TextToImageResult> {
  const clients = await initialize0GClients();

  if (clients.brokerStatus === "ready" && clients.signer) {
    try {
      const { createZGComputeNetworkBroker } = await import("@0glabs/0g-serving-broker");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const broker = await createZGComputeNetworkBroker(clients.signer as any);

      const services = (await broker.inference.listService()) as ServiceEntry[];
      const imgProviders = services.filter((s) => s[1] === "text-to-image");

      if (imgProviders.length > 0) {
        const provider = imgProviders[0];
        const providerAddress = provider[0];
        const providerUrl = provider[2];

        const requestBody = JSON.stringify({
          model: "flux-turbo",
          prompt: params.prompt,
          n: params.n ?? 1,
          size: `${params.width ?? 512}x${params.height ?? 512}`,
          response_format: "url"
        });

        const rawHeaders = await broker.inference.getRequestHeaders(providerAddress, requestBody);
        const headers = rawHeaders as unknown as Record<string, string>;

        const res = await fetch(`${providerUrl}/images/generations`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...headers },
          body: requestBody
        });

        if (!res.ok) {
          throw new Error(`Image generation failed: HTTP ${res.status}`);
        }

        const chatID = res.headers.get("ZG-Res-Key") ?? "";
        const rawBody = await res.text();
        const data = JSON.parse(rawBody) as {
          data: Array<{ url?: string; b64_json?: string }>;
          usage?: unknown;
        };

        if (chatID) {
          await broker.inference.processResponse(providerAddress, chatID, rawBody);
        }

        return {
          images: data.data ?? [],
          providerAddress,
          teeVerified: isTeeVerified(provider),
          cost: "~0.001"
        };
      }
    } catch (err) {
      console.warn("[MediaService] text-to-image via broker failed, using mock:", err);
    }
  }

  // ── Mock fallback ──────────────────────────────────────────────────────────
  console.warn("[MediaService] No text-to-image provider available, returning mock");
  const encoded = encodeURIComponent(params.prompt.slice(0, 60));
  return {
    images: [{
      url: `https://placehold.co/${params.width ?? 512}x${params.height ?? 512}/1a1a2e/00d4ff?text=${encoded}`
    }],
    providerAddress: "0x0000000000000000000000000000000000000000",
    teeVerified: false,
    cost: "0",
    mock: true
  };
}

export async function speechToText(params: SpeechToTextParams): Promise<SpeechToTextResult> {
  const clients = await initialize0GClients();

  if (clients.brokerStatus === "ready" && clients.signer) {
    try {
      const { createZGComputeNetworkBroker } = await import("@0glabs/0g-serving-broker");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const broker = await createZGComputeNetworkBroker(clients.signer as any);

      const services = (await broker.inference.listService()) as ServiceEntry[];
      const sttProviders = services.filter((s) =>
        s[1] === "speech-to-text" ||
        s[1] === "audio-transcription" ||
        String(s[1]).toLowerCase().includes("whisper")
      );

      if (sttProviders.length > 0) {
        const provider = sttProviders[0];
        const providerAddress = provider[0];
        const providerUrl = provider[2];

        const formData = new FormData();
        formData.append(
          "file",
          new Blob([new Uint8Array(params.audioBuffer)], { type: params.mimeType }),
          params.filename
        );
        formData.append("model", "whisper-large-v3");
        formData.append("language", params.language ?? "en");
        formData.append("response_format", params.responseFormat ?? "verbose_json");

        // Sign with a stable body representation (FormData boundary varies)
        const rawHeaders = await broker.inference.getRequestHeaders(
          providerAddress,
          JSON.stringify({ model: "whisper-large-v3" })
        );
        const headers = rawHeaders as unknown as Record<string, string>;
        // Do NOT set Content-Type — let FormData auto-set it with boundary
        delete headers["Content-Type"];
        delete headers["content-type"];

        const res = await fetch(`${providerUrl}/audio/transcriptions`, {
          method: "POST",
          headers,
          body: formData
        });

        if (!res.ok) {
          throw new Error(`Speech-to-text failed: HTTP ${res.status}`);
        }

        const chatID = res.headers.get("ZG-Res-Key") ?? "";
        const rawBody = await res.text();
        const data = JSON.parse(rawBody) as {
          text: string;
          language?: string;
          duration?: number;
          segments?: Array<{ start: number; end: number; text: string }>;
          usage?: unknown;
        };

        if (chatID) {
          await broker.inference.processResponse(providerAddress, chatID, rawBody);
        }

        return {
          text: data.text ?? "",
          language: data.language,
          duration: data.duration,
          segments: data.segments,
          providerAddress,
          teeVerified: isTeeVerified(provider)
        };
      }
    } catch (err) {
      console.warn("[MediaService] speech-to-text via broker failed, using mock:", err);
    }
  }

  // ── Mock fallback ──────────────────────────────────────────────────────────
  console.warn("[MediaService] No speech-to-text provider available, returning mock");
  return {
    text: "Mock transcription: [audio processing unavailable]",
    language: params.language ?? "en",
    duration: 0,
    segments: [],
    providerAddress: "0x0000000000000000000000000000000000000000",
    teeVerified: false,
    mock: true
  };
}

export async function listMediaProviders(): Promise<MediaProviderInfo[]> {
  const clients = await initialize0GClients();

  if (clients.brokerStatus === "ready" && clients.signer) {
    try {
      const { createZGComputeNetworkBroker } = await import("@0glabs/0g-serving-broker");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const broker = await createZGComputeNetworkBroker(clients.signer as any);
      const services = (await broker.inference.listService()) as ServiceEntry[];

      const mediaTypes = new Set([
        "text-to-image",
        "speech-to-text",
        "audio-transcription",
        "image-generation"
      ]);

      return services
        .filter((s) =>
          mediaTypes.has(s[1]) ||
          String(s[1]).toLowerCase().includes("whisper") ||
          String(s[1]).toLowerCase().includes("flux") ||
          String(s[1]).toLowerCase().includes("image") ||
          String(s[1]).toLowerCase().includes("audio")
        )
        .map((s) => ({
          address: s[0],
          serviceType: s[1],
          teeVerified: isTeeVerified(s)
        }));
    } catch (err) {
      console.warn("[MediaService] listMediaProviders failed:", err);
    }
  }

  return [];
}
