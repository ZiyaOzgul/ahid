import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAuditLogs } from "@/lib/audit";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("response" in auth) return auth.response;

  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") || "50");
  const logs = await getAuditLogs(Number.isFinite(limit) ? limit : 50);

  return NextResponse.json({ success: true, logs, data: logs });
}
