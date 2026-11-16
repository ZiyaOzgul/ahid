import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";

const READ_NOTIF_KEY = "admin_read_notification_ids";

async function getServerReadNotificationIds(): Promise<string[]> {
  try {
    const { data } = await supabase
      .from("cms_variables")
      .select("value")
      .eq("key", READ_NOTIF_KEY)
      .maybeSingle();
    if (!data?.value) return [];
    const parsed = JSON.parse(data.value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

async function saveServerReadNotificationIds(ids: string[]) {
  const trimmed = Array.from(new Set(ids)).slice(-150);
  await supabase.from("cms_variables").upsert(
    {
      key: READ_NOTIF_KEY,
      value: JSON.stringify(trimmed),
      page: "system",
      section: "notifications",
      description: "Yönetici bildirim okunma kayıtları",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" }
  );
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("response" in auth) return auth.response;

  try {
    const [pendingAppsRes, unreadMsgRes, serverReadIds] = await Promise.all([
      supabase
        .from("membership_applications")
        .select("id, application_no, first_name, last_name, tier, created_at")
        .eq("status", "pending")
        .order("id", { ascending: false })
        .limit(8),
      supabase
        .from("contact_messages")
        .select("id, name, department, subject, created_at")
        .eq("status", "unread")
        .order("id", { ascending: false })
        .limit(8),
      getServerReadNotificationIds(),
    ]);

    const readSet = new Set(serverReadIds);
    const notifications: Array<{
      id: string;
      title: string;
      message: string;
      time: string;
      link: string;
      type: "application" | "contact" | "article" | "system";
      unread: boolean;
    }> = [];

    if (pendingAppsRes.data && pendingAppsRes.data.length > 0) {
      pendingAppsRes.data.forEach((app) => {
        const id = `app-${app.id}`;
        notifications.push({
          id,
          title: "Yeni Üyelik Başvurusu",
          message: `${app.first_name} ${app.last_name} (${app.tier?.toUpperCase() || "ASİL"}) - Sicil onayı bekliyor`,
          time: new Date(app.created_at || Date.now()).toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          }),
          link: "/admin/uyelik",
          type: "application",
          unread: !readSet.has(id),
        });
      });
    }

    if (unreadMsgRes.data && unreadMsgRes.data.length > 0) {
      unreadMsgRes.data.forEach((msg) => {
        const id = `msg-${msg.id}`;
        notifications.push({
          id,
          title: "Yeni Protokol / İletişim Mesajı",
          message: `${msg.name} - ${msg.subject || msg.department || "İletişim Talebi"}`,
          time: new Date(msg.created_at || Date.now()).toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          }),
          link: "/admin/protokol",
          type: "contact",
          unread: !readSet.has(id),
        });
      });
    }

    const unreadCount = notifications.filter((n) => n.unread).length;

    return NextResponse.json({
      success: true,
      count: unreadCount,
      totalCount: notifications.length,
      notifications,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message, count: 0, notifications: [] },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("response" in auth) return auth.response;

  try {
    let bodyIds: string[] = [];
    try {
      const body = await req.json();
      if (Array.isArray(body?.ids)) {
        bodyIds = body.ids.map(String);
      }
    } catch {
      // empty body means mark all notifications read
    }

    const existingRead = await getServerReadNotificationIds();

    if (bodyIds.length > 0) {
      const msgIds = bodyIds
        .filter((id) => id.startsWith("msg-"))
        .map((id) => Number(id.replace("msg-", "")))
        .filter((n) => !Number.isNaN(n));

      if (msgIds.length > 0) {
        await supabase
          .from("contact_messages")
          .update({ status: "read" })
          .in("id", msgIds)
          .eq("status", "unread");
      }

      await saveServerReadNotificationIds([...existingRead, ...bodyIds]);
    } else {
      const { data: pendingApps } = await supabase
        .from("membership_applications")
        .select("id")
        .eq("status", "pending");

      const appIds = (pendingApps || []).map((a) => `app-${a.id}`);

      await supabase
        .from("contact_messages")
        .update({ status: "read" })
        .eq("status", "unread");

      await saveServerReadNotificationIds([...existingRead, ...appIds]);
    }

    return NextResponse.json({
      success: true,
      message: "Bildirimler okundu olarak işaretlendi.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
