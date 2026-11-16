import { NextResponse, type NextRequest } from "next/server";
import { getSessionFromRequest, isAdminRole } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session || !isAdminRole(session.role)) {
    const loginUrl = new URL("/login", request.url);
    const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    if (nextPath && nextPath !== "/login") {
      loginUrl.searchParams.set("next", nextPath);
    }
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/admin-panel/:path*"],
};
