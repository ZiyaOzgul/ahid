import crypto from "node:crypto";

const SCRYPT_PREFIX = "scrypt";
const SCRYPT_KEYLEN = 64;
const SCRYPT_COST = 16384;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;

export function isHashedPassword(stored?: string | null): boolean {
  if (!stored) return false;
  const parts = stored.split("$");
  return parts.length === 3 && parts[0] === SCRYPT_PREFIX && parts[1].length >= 16;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto
    .scryptSync(password, salt, SCRYPT_KEYLEN, {
      N: SCRYPT_COST,
      r: SCRYPT_BLOCK_SIZE,
      p: SCRYPT_PARALLELIZATION,
    })
    .toString("hex");
  return `${SCRYPT_PREFIX}$${salt}$${derived}`;
}

export function verifyPassword(
  password: string,
  storedHash?: string | null
): { valid: boolean; needsRehash: boolean } {
  if (!storedHash || !password) {
    return { valid: false, needsRehash: false };
  }

  if (isHashedPassword(storedHash)) {
    const [, salt, expectedHex] = storedHash.split("$");
    try {
      const expectedBuf = Buffer.from(expectedHex, "hex");
      const actualBuf = crypto.scryptSync(password, salt, SCRYPT_KEYLEN, {
        N: SCRYPT_COST,
        r: SCRYPT_BLOCK_SIZE,
        p: SCRYPT_PARALLELIZATION,
      });
      if (expectedBuf.length !== actualBuf.length) {
        return { valid: false, needsRehash: false };
      }
      const valid = crypto.timingSafeEqual(expectedBuf, actualBuf);
      return { valid, needsRehash: false };
    } catch {
      return { valid: false, needsRehash: false };
    }
  }

  // Legacy plaintext fallback — automatically flagged for immediate rehash on successful login
  const a = Buffer.from(password, "utf8");
  const b = Buffer.from(storedHash, "utf8");
  if (a.length !== b.length) {
    return { valid: false, needsRehash: false };
  }
  const valid = crypto.timingSafeEqual(a, b);
  return { valid, needsRehash: valid };
}

export function generateTemporaryPassword(length = 12): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#";
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}
