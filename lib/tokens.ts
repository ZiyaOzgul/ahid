export const SESSION_COOKIE_NAME = "ahid_session";

const ADMIN_ROLES = new Set(["admin", "editor"]);

export interface SessionUser {
  id: number;
  email: string;
  role: string;
  full_name: string;
  member_no?: string | null;
  exp: number;
}

function getAuthSecret(): string {
  const secret =
    process.env.AUTH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!secret) {
    throw new Error(
      "AUTH_SECRET ortam değişkeni yapılandırılmadı. Güvenli oturum imzalama için AUTH_SECRET tanımlanmalıdır."
    );
  }
  return secret;
}

export function isAdminRole(role?: string | null): boolean {
  if (!role) return false;
  return ADMIN_ROLES.has(role.toLowerCase());
}

export function isSuperAdminRole(role?: string | null): boolean {
  if (!role) return false;
  return role.toLowerCase() === "admin";
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string): Uint8Array {
  const padded =
    str.replace(/-/g, "+").replace(/_/g, "/") +
    "===".slice((str.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function signPayload(payloadB64: string): Promise<string> {
  const key = await importHmacKey(getAuthSecret());
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payloadB64)
  );
  return base64UrlEncode(new Uint8Array(sig));
}

function constantTimeStringEqual(a: string, b: string): boolean {
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) {
    const ca = i < a.length ? a.charCodeAt(i) : 0;
    const cb = i < b.length ? b.charCodeAt(i) : 0;
    diff |= ca ^ cb;
  }
  return diff === 0;
}

export async function signSessionToken(
  user: Omit<SessionUser, "exp">,
  ttlSeconds = 60 * 60 * 24
): Promise<string> {
  const payload: SessionUser = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const payloadB64 = base64UrlEncode(
    new TextEncoder().encode(JSON.stringify(payload))
  );
  const sigB64 = await signPayload(payloadB64);
  return `${payloadB64}.${sigB64}`;
}

export async function verifySessionToken(
  token: string | undefined | null
): Promise<SessionUser | null> {
  if (!token || !token.includes(".")) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;
  if (!payloadB64 || !sigB64) return null;

  try {
    const expectedSig = await signPayload(payloadB64);
    if (!constantTimeStringEqual(sigB64, expectedSig)) return null;

    const payloadBytes = base64UrlDecode(payloadB64);
    const payload = JSON.parse(
      new TextDecoder().decode(payloadBytes)
    ) as SessionUser;
    const numericId = Number(payload.id);
    if (
      !Number.isFinite(numericId) ||
      numericId <= 0 ||
      !payload.exp ||
      payload.exp < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return { ...payload, id: numericId };
  } catch {
    return null;
  }
}

interface CaptchaPayload {
  purpose: "login_captcha";
  answer: string;
  nonce: string;
  exp: number;
}

export async function signCaptchaChallenge(
  answer: string,
  ttlSeconds = 300
): Promise<string> {
  const randBytes = new Uint8Array(8);
  crypto.getRandomValues(randBytes);
  const nonce = base64UrlEncode(randBytes);
  const payload: CaptchaPayload = {
    purpose: "login_captcha",
    answer: answer.trim().toUpperCase(),
    nonce,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const payloadB64 = base64UrlEncode(
    new TextEncoder().encode(JSON.stringify(payload))
  );
  const sigB64 = await signPayload(payloadB64);
  return `${payloadB64}.${sigB64}`;
}

export async function verifyCaptchaChallenge(
  token: string | undefined | null,
  userAnswer: string | undefined | null
): Promise<boolean> {
  if (!token || !userAnswer || !token.includes(".")) return false;
  const [payloadB64, sigB64] = token.split(".");
  if (!payloadB64 || !sigB64) return false;
  try {
    const expectedSig = await signPayload(payloadB64);
    if (!constantTimeStringEqual(sigB64, expectedSig)) return false;

    const payloadBytes = base64UrlDecode(payloadB64);
    const payload = JSON.parse(
      new TextDecoder().decode(payloadBytes)
    ) as CaptchaPayload;
    if (
      payload.purpose !== "login_captcha" ||
      !payload.exp ||
      payload.exp < Math.floor(Date.now() / 1000)
    ) {
      return false;
    }
    return constantTimeStringEqual(
      userAnswer.trim().toUpperCase(),
      payload.answer.trim().toUpperCase()
    );
  } catch {
    return false;
  }
}

interface UnsubscribePayload {
  purpose: "newsletter_unsub";
  email: string;
  exp: number;
}

export async function signUnsubscribeToken(
  email: string,
  ttlSeconds = 60 * 60 * 24 * 30
): Promise<string> {
  const payload: UnsubscribePayload = {
    purpose: "newsletter_unsub",
    email: email.trim().toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const payloadB64 = base64UrlEncode(
    new TextEncoder().encode(JSON.stringify(payload))
  );
  const sigB64 = await signPayload(payloadB64);
  return `${payloadB64}.${sigB64}`;
}

export async function verifyUnsubscribeToken(
  token: string | undefined | null
): Promise<string | null> {
  if (!token || !token.includes(".")) return null;
  const [payloadB64, sigB64] = token.split(".");
  if (!payloadB64 || !sigB64) return null;
  try {
    const expectedSig = await signPayload(payloadB64);
    if (!constantTimeStringEqual(sigB64, expectedSig)) return null;
    const payloadBytes = base64UrlDecode(payloadB64);
    const payload = JSON.parse(
      new TextDecoder().decode(payloadBytes)
    ) as UnsubscribePayload;
    if (
      payload.purpose !== "newsletter_unsub" ||
      !payload.exp ||
      payload.exp < Math.floor(Date.now() / 1000) ||
      !payload.email
    ) {
      return null;
    }
    return payload.email;
  } catch {
    return null;
  }
}
