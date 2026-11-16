import { NextResponse, type NextRequest } from "next/server";

export const SESSION_COOKIE_NAME = "ahid_session";
export const ADMIN_ROLES = new Set(["admin", "editor"]);

export interface SessionUser {
  id: string;
  email: string;
  role: string;
  full_name: string;
  member_no?: string | null;
  exp: number;
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function getAuthSecret(): string {
  const secret =
    process.env.AUTH_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";
  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }
  return secret;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(b64url: string): Uint8Array<ArrayBuffer> {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  const binary = atob(b64 + pad);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function importHmacKey(): Promise<CryptoKey> {
  const raw = textEncoder.encode(getAuthSecret());
  const keyBytes = new Uint8Array(raw.length);
  keyBytes.set(raw);
  return crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export function isAdminRole(role?: string | null): boolean {
  return Boolean(role && ADMIN_ROLES.has(role.toLowerCase()));
}

export async function signSessionToken(
  user: Omit<SessionUser, "exp">,
  ttlSeconds = 60 * 60 * 24
): Promise<string> {
  const payload: SessionUser = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const payloadJson = JSON.stringify(payload);
  const encodedPayload = bytesToBase64Url(textEncoder.encode(payloadJson));
  const dataBytes = textEncoder.encode(encodedPayload);
  const verifyBytes = new Uint8Array(dataBytes.length);
  verifyBytes.set(dataBytes);

  const key = await importHmacKey();
  const signature = await crypto.subtle.sign("HMAC", key, verifyBytes);
  const encodedSig = bytesToBase64Url(new Uint8Array(signature));
  return `${encodedPayload}.${encodedSig}`;
}

export async function verifySessionToken(
  token: string | undefined | null
): Promise<SessionUser | null> {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encodedPayload, encodedSig] = parts;
  if (!encodedPayload || !encodedSig) return null;

  try {
    const key = await importHmacKey();
    const sigBytes = base64UrlToBytes(encodedSig);
    const dataRaw = textEncoder.encode(encodedPayload);
    const dataBytes = new Uint8Array(dataRaw.length);
    dataBytes.set(dataRaw);

    const isValid = await crypto.subtle.verify("HMAC", key, sigBytes, dataBytes);
    if (!isValid) return null;

    const payloadBytes = base64UrlToBytes(encodedPayload);
    const payload = JSON.parse(textDecoder.decode(payloadBytes)) as SessionUser;
    if (!payload?.id || !payload?.email || !payload?.exp) return null;
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function parseCookieHeader(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";");
  for (const part of cookies) {
    const eqIndex = part.indexOf("=");
    if (eqIndex === -1) continue;
    const key = part.slice(0, eqIndex).trim();
    if (key === name) {
      return decodeURIComponent(part.slice(eqIndex + 1).trim());
    }
  }
  return null;
}

export async function getSessionFromRequest(
  req: Request | NextRequest
): Promise<SessionUser | null> {
  let token: string | undefined | null = null;
  const maybeNextReq = req as NextRequest;
  if (maybeNextReq.cookies && typeof maybeNextReq.cookies.get === "function") {
    token = maybeNextReq.cookies.get(SESSION_COOKIE_NAME)?.value ?? null;
  }
  if (!token) {
    token = parseCookieHeader(req.headers.get("cookie"), SESSION_COOKIE_NAME);
  }
  return verifySessionToken(token);
}

export async function requireAuth(
  req: Request | NextRequest
): Promise<{ user: SessionUser } | { response: NextResponse }> {
  const user = await getSessionFromRequest(req);
  if (!user) {
    return {
      response: NextResponse.json(
        { error: "Oturum gerekli. Lütfen giriş yapın." },
        { status: 401 }
      ),
    };
  }
  return { user };
}

export async function requireAdmin(
  req: Request | NextRequest
): Promise<{ user: SessionUser } | { response: NextResponse }> {
  const auth = await requireAuth(req);
  if ("response" in auth) return auth;
  if (!isAdminRole(auth.user.role)) {
    return {
      response: NextResponse.json(
        { error: "Bu işlem için yönetici yetkisi gereklidir." },
        { status: 403 }
      ),
    };
  }
  return { user: auth.user };
}
