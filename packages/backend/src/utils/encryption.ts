import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";
import { keccak256, toUtf8Bytes } from "ethers";

/**
 * Derive a deterministic AES-256 key from walletAddress + agentId.
 * MVP: pure HMAC derivation (no live wallet signing needed).
 */
export function deriveAgentKey(walletAddress: string, agentId: number): Buffer {
  const raw = `SealMind:AgentKey:${walletAddress.toLowerCase()}:${agentId}`;
  return Buffer.from(createHash("sha256").update(raw).digest());
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
