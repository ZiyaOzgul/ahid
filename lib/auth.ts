import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  isAdminRole,
  isSuperAdminRole,
  verifySessionToken,
  type SessionUser,
} from "./tokens";

export * from "./tokens";

function parseCookieHeader(
  cookieHeader: string | null,
  name: string
): string | undefined {
  if (!cookieHeader) return undefined;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    if (k === name) {
      return decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  return undefined;
}

export async function getSessionFromRequest(
  req: Request | NextRequest
): Promise<SessionUser | null> {
  let token: string | undefined;
  if ("cookies" in req && typeof req.cookies?.get === "function") {
    token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
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
        { error: "Oturum açmanız gerekiyor." },
        { status: 401 }
      ),
    };
  }
  return { user };
}

export async function requireAdmin(
  req: Request | NextRequest
): Promise<{ user: SessionUser } | { response: NextResponse }> {
  const user = await getSessionFromRequest(req);
  if (!user) {
    return {
      response: NextResponse.json(
        { error: "Yetkisiz erişim. Lütfen giriş yapın." },
        { status: 401 }
      ),
    };
  }
  if (!isAdminRole(user.role)) {
    return {
      response: NextResponse.json(
        { error: "Bu işlem için yönetici yetkisi gereklidir." },
        { status: 403 }
      ),
    };
  }
  return { user };
}

export async function requireSuperAdmin(
  req: Request | NextRequest
): Promise<{ user: SessionUser } | { response: NextResponse }> {
  const user = await getSessionFromRequest(req);
  if (!user) {
    return {
      response: NextResponse.json(
        { error: "Yetkisiz erişim. Lütfen giriş yapın." },
        { status: 401 }
      ),
    };
  }
  if (!isSuperAdminRole(user.role)) {
    return {
      response: NextResponse.json(
        {
          error:
            "Bu işlem yalnızca Süper Yönetici (admin) yetkisiyle yapılabilir.",
        },
        { status: 403 }
      ),
    };
  }
  return { user };
}
