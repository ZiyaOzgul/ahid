import { supabaseServer } from "@/lib/supabase-server";

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor_email: string;
  actor_role: string;
  action: string;
  target: string;
  details: string;
  status: "success" | "warning" | "error";
}

const AUDIT_PAGE = "system_audit";
const AUDIT_SECTION = "logs";
const AUDIT_KEY = "entries";
const MAX_AUDIT_ENTRIES = 150;

export async function getAuditLogs(limit = 50): Promise<AuditLogEntry[]> {
  try {
    const { data, error } = await supabaseServer
      .from("cms_variables")
      .select("value")
      .eq("page", AUDIT_PAGE)
      .eq("section", AUDIT_SECTION)
      .eq("key", AUDIT_KEY)
      .maybeSingle();

    if (error || !data?.value) return [];
    const parsed = JSON.parse(data.value) as AuditLogEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, Math.max(1, Math.min(limit, MAX_AUDIT_ENTRIES)));
  } catch {
    return [];
  }
}

export async function recordAuditLog(input: {
  actorUserId?: number | null;
  actorEmail: string;
  actorRole: string;
  action: string;
  target: string;
  details: string;
  status?: "success" | "warning" | "error";
}): Promise<void> {
  try {
    const current = await getAuditLogs(MAX_AUDIT_ENTRIES);
    const entry: AuditLogEntry = {
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      actor_email: input.actorEmail,
      actor_role: input.actorRole,
      action: input.action,
      target: input.target,
      details: input.details,
      status: input.status || "success",
    };

    const nextEntries = [entry, ...current].slice(0, MAX_AUDIT_ENTRIES);
    const serialized = JSON.stringify(nextEntries);

    const { data: existing } = await supabaseServer
      .from("cms_variables")
      .select("id")
      .eq("page", AUDIT_PAGE)
      .eq("section", AUDIT_SECTION)
      .eq("key", AUDIT_KEY)
      .maybeSingle();

    if (existing?.id) {
      await supabaseServer
        .from("cms_variables")
        .update({
          value: serialized,
          updated_at: new Date().toISOString(),
          updated_by: input.actorUserId ?? null,
        })
        .eq("id", existing.id);
    } else {
      await supabaseServer.from("cms_variables").insert({
        page: AUDIT_PAGE,
        section: AUDIT_SECTION,
        key: AUDIT_KEY,
        value: serialized,
        description: "Gerçek zamanlı sistem ve güvenlik denetim kayıtları",
        updated_by: input.actorUserId ?? null,
      });
    }
  } catch {
    // Non-blocking audit persistence
  }
}
