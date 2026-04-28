/**
 * auth_nonces table — SIWE-lite nonce store.
 * Nonces expire after 5 minutes and can only be used once.
 */

import db from "./index.js";
import { randomBytes } from "crypto";

const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const stmts = {
  insert: db.prepare(`
    INSERT INTO auth_nonces (wallet_address, nonce, expires_at, used)
    VALUES (lower(@wallet), @nonce, @expiresAt, 0)
  `),
  find: db.prepare(`
    SELECT * FROM auth_nonces
    WHERE lower(wallet_address)=lower(?) AND nonce=? AND used=0 AND expires_at > ?
  `),
  markUsed: db.prepare(`
    UPDATE auth_nonces SET used=1
    WHERE lower(wallet_address)=lower(?) AND nonce=?
  `),
  cleanup: db.prepare(`DELETE FROM auth_nonces WHERE expires_at < ? OR used=1`),
};

/** Generate a fresh nonce for the given wallet, valid for 5 min */
export function createNonce(wallet: string): string {
  const nonce = randomBytes(16).toString("hex");
  stmts.insert.run({ wallet, nonce, expiresAt: Date.now() + NONCE_TTL_MS });
  // Opportunistic cleanup of expired nonces
  stmts.cleanup.run(Date.now() - NONCE_TTL_MS);
  return nonce;
}

/** Verify a nonce is valid for the wallet, then consume it (one-time use) */
export function consumeNonce(wallet: string, nonce: string): boolean {
  const row = stmts.find.get(wallet, nonce, Date.now());
  if (!row) return false;
  stmts.markUsed.run(wallet, nonce);
  return true;
}
