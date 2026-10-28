import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const notifications: Array<{
      id: string;
      title: string;
      message: string;
      time: string;
      link: string;
      type: "application" | "contact" | "article" | "system";
      unread: boolean;
    }> = [];

    // 1. Bekleyen üyelik başvuruları
    const { data: pendingApps, error: appsError } = await supabase
      .from("membership_applications")
      .select("id, application_no, first_name, last_name, tier, created_at")
      .eq("status", "pending")
      .order("id", { ascending: false })
      .limit(5);

    if (pendingApps && pendingApps.length > 0) {
      pendingApps.forEach((app) => {
        notifications.push({
          id: `app-${app.id}`,
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
          unread: true,
        });
      });
    }

    // 2. Okunmamış iletişim & protokol mesajları
    const { data: unreadMessages, error: msgError } = await supabase
      .from("contact_messages")
      .select("id, name, department, subject, created_at")
      .eq("status", "unread")
      .order("id", { ascending: false })
      .limit(5);

    if (unreadMessages && unreadMessages.length > 0) {
      unreadMessages.forEach((msg) => {
        notifications.push({
          id: `msg-${msg.id}`,
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
          unread: true,
        });
      });
    }

    return NextResponse.json({
      success: true,
      count: notifications.length,
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
  try {
    // Okunmamış iletişim mesajlarını okundu (read) olarak işaretle
    await supabase
      .from("contact_messages")
      .update({ status: "read" })
      .eq("status", "unread");

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
