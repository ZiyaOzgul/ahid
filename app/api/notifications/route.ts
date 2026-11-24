import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("response" in auth) return auth.response;

  try {
    const [pendingAppsRes, newMsgsRes, pendingDuesRes, cmsReadRes] =
      await Promise.all([
        supabaseServer
          .from("membership_applications")
          .select("id, first_name, last_name, application_no, tier, created_at")
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(10),
        supabaseServer
          .from("contact_messages")
          .select("id, name, subject, type, created_at")
          .eq("status", "new")
          .order("created_at", { ascending: false })
          .limit(10),
        supabaseServer
          .from("member_dues")
          .select("id, period, amount, receipt_no, created_at")
          .eq("status", "pending")
          .not("receipt_no", "is", null)
          .order("created_at", { ascending: false })
          .limit(8),
        supabaseServer
          .from("cms_variables")
          .select("value")
          .eq("page", "admin")
          .eq("section", "notifications")
          .eq("key", "read_ids")
          .maybeSingle(),
      ]);

    let readIds: string[] = [];
    if (cmsReadRes.data?.value) {
      try {
        const parsed = JSON.parse(cmsReadRes.data.value) as string[];
        if (Array.isArray(parsed)) readIds = parsed;
      } catch {
        readIds = [];
      }
    }
    const readSet = new Set(readIds);

    const notifications = [
      ...(pendingAppsRes.data || []).map((app) => {
        const id = `app-${app.id}`;
        return {
          id,
          type: "application",
          title: `Yeni Üyelik Başvurusu (${app.application_no})`,
          description: `${app.first_name} ${app.last_name} — ${app.tier}`,
          href: "/admin/uyelik",
          created_at: app.created_at,
          read: readSet.has(id),
        };
      }),
      ...(newMsgsRes.data || []).map((msg) => {
        const id = `msg-${msg.id}`;
        return {
          id,
          type: msg.type === "protocol_appointment" ? "protocol" : "message",
          title:
            msg.type === "protocol_appointment"
              ? `Protokol Randevu Talebi: ${msg.name}`
              : `Yeni Mesaj: ${msg.name}`,
          description: msg.subject || "İletişim formu üzerinden iletildi",
          href: "/admin/protokol",
          created_at: msg.created_at,
          read: readSet.has(id),
        };
      }),
      ...(pendingDuesRes.data || []).map((due) => {
        const id = `due-${due.id}`;
        return {
          id,
          type: "dues",
          title: `Dekont Bildirimi (${due.receipt_no})`,
          description: `${due.period} — ₺${Number(due.amount).toLocaleString("tr-TR")}`,
          href: "/admin/uyelik",
          created_at: due.created_at,
          read: readSet.has(id),
        };
      }),
    ].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const unreadCount = notifications.filter((n) => !n.read).length;

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Bildirimler yüklenemedi." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin(request);
  if ("response" in auth) return auth.response;

  try {
    const body = (await request.json()) as {
      id?: string;
      ids?: string[];
      markAllRead?: boolean;
    };

    const { data: existing } = await supabaseServer
      .from("cms_variables")
      .select("id, value")
      .eq("page", "admin")
      .eq("section", "notifications")
      .eq("key", "read_ids")
      .maybeSingle();

    let current: string[] = [];
    if (existing?.value) {
      try {
        const parsed = JSON.parse(existing.value) as string[];
        if (Array.isArray(parsed)) current = parsed;
      } catch {
        current = [];
      }
    }

    const toAdd = body.ids || (body.id ? [body.id] : []);
    const merged = Array.from(new Set([...current, ...toAdd])).slice(-200);
    const serialized = JSON.stringify(merged);

    if (existing?.id) {
      await supabaseServer
        .from("cms_variables")
        .update({
          value: serialized,
          updated_at: new Date().toISOString(),
          updated_by: auth.user.id,
        })
        .eq("id", existing.id);
    } else {
      await supabaseServer.from("cms_variables").insert({
        page: "admin",
        section: "notifications",
        key: "read_ids",
        value: serialized,
        description: "Okunmuş yönetici bildirim ID listesi",
        updated_by: auth.user.id,
      });
    }

    return NextResponse.json({ success: true, readCount: merged.length });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Geçersiz istek." },
      { status: 400 }
    );
  }
}
