import { createCipheriv, createDecipheriv, randomBytes, createHash, createHmac } from "crypto";
import { keccak256, toUtf8Bytes } from "ethers";

/**
 * Server-side secret for HKDF-based key derivation.
 * In production this should come from a secret manager / HSM.
 * Falls back to a hardcoded value for Hackathon MVP.
 */
const SERVER_SECRET = process.env.ENCRYPTION_SECRET ?? "SealMind:ServerSecret:v3:0G-Hackathon-2026";

/**
 * Derive a deterministic AES-256 key from walletAddress + agentId using HKDF-like construction.
 *
 * Uses HMAC-SHA256 with a server-side secret as the PRK, making keys unrecoverable
 * without access to the server secret — even if walletAddress and agentId are public.
 *
 * In a full production system, the wallet owner would sign a challenge and the signature
 * would serve as the input keying material. For the Hackathon MVP, HMAC with server secret
 * provides meaningful security improvement over plain SHA256.
 */
export function deriveAgentKey(walletAddress: string, agentId: number | string): Buffer {
  const info = `SealMind:AgentKey:${String(walletAddress).toLowerCase()}:${agentId}`;
  return Buffer.from(
    createHmac("sha256", SERVER_SECRET).update(info).digest()
  );
}

export function encryptMemory(
  plaintext: string,
  key: Buffer
): { encryptedData: string; iv: string } {
  const iv = randomBytes(12); // GCM recommends 12-byte IV
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    encryptedData: Buffer.concat([encrypted, authTag]).toString("base64"),
    iv: iv.toString("base64")
  };
}

export function decryptMemory(encryptedData: string, iv: string, key: Buffer): string {
  const buf = Buffer.from(encryptedData, "base64");
  const ivBuf = Buffer.from(iv, "base64");
  const authTag = buf.slice(buf.length - 16);
  const ciphertext = buf.slice(0, buf.length - 16);
  const decipher = createDecipheriv("aes-256-gcm", key, ivBuf);
  decipher.setAuthTag(authTag);
  return decipher.update(ciphertext).toString("utf8") + decipher.final("utf8");
}

export function hashContent(content: string): string {
  return keccak256(toUtf8Bytes(content));
}
