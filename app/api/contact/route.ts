import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { parsePositiveId } from "@/lib/constants";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sendTransactionalEmail } from "@/lib/mailer";
import { getSystemSettings } from "@/lib/system-settings";
import { recordAuditLog } from "@/lib/audit";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("response" in auth) return auth.response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const type = searchParams.get("type");

  let query = supabaseServer
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }
  if (type && type !== "all") {
    query = query.eq("type", type);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    messages: data || [],
    data: data || [],
  });
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const limit = checkRateLimit(`contact:${ip}`, 8, 15 * 60_000);
    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: `Çok fazla mesaj gönderildi. Lütfen ${limit.resetInSeconds} saniye sonra tekrar deneyin.`,
        },
        { status: 429 }
      );
    }

    const body = (await request.json()) as {
      type?: string;
      name?: string;
      email?: string;
      phone?: string | null;
      department?: string | null;
      subject?: string | null;
      message?: string;
    };

    const name = (body.name || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const message = (body.message || "").trim();

    if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Ad soyad ve geçerli bir e-posta adresi zorunludur." },
        { status: 400 }
      );
    }

    if (!message || message.length < 5) {
      return NextResponse.json(
        { error: "Lütfen en az 5 karakter uzunluğunda bir mesaj yazın." },
        { status: 400 }
      );
    }

    const msgType = body.type || "general";
    const subject =
      (body.subject || "").trim() ||
      (msgType === "protocol_appointment"
        ? "Protokol Randevu Talebi"
        : "Genel İletişim Mesajı");

    const { data, error } = await supabaseServer
      .from("contact_messages")
      .insert({
        type: msgType,
        name,
        email,
        phone: body.phone?.trim() || null,
        department: body.department?.trim() || "Genel Sekreterlik",
        subject,
        message,
        status: "new",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const settings = await getSystemSettings();
    if (settings.contact_notify_email) {
      await sendTransactionalEmail({
        to: settings.contact_notify_email,
        subject: `[AHİD İletişim] ${subject} — ${name}`,
        text: `Gönderen: ${name} (${email})\nTelefon: ${
          body.phone || "-"
        }\nBirim: ${body.department || "Genel Sekreterlik"}\nTür: ${msgType}\n\nMesaj:\n${message}`,
        replyTo: email,
      });
    }

    return NextResponse.json({ success: true, message: data, data }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Geçersiz istek." },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin(request);
  if ("response" in auth) return auth.response;

  try {
    const body = (await request.json()) as {
      id?: number | string;
      status?: "new" | "in_progress" | "replied" | "archived";
      admin_notes?: string;
      reply_message?: string;
      reply_subject?: string;
    };

    const msgId = parsePositiveId(body.id);
    if (!msgId) {
      return NextResponse.json(
        { error: "Geçerli mesaj ID zorunludur." },
        { status: 400 }
      );
    }

    const { data: existing, error: fetchErr } = await supabaseServer
      .from("contact_messages")
      .select("*")
      .eq("id", msgId)
      .maybeSingle();

    if (fetchErr || !existing) {
      return NextResponse.json({ error: "Mesaj bulunamadı." }, { status: 404 });
    }

    let emailResult = null;
    let combinedNotes =
      body.admin_notes !== undefined
        ? body.admin_notes
        : existing.admin_notes || "";
    let nextStatus = body.status || existing.status;

    if (body.reply_message && body.reply_message.trim()) {
      const settings = await getSystemSettings();
      const replySubject =
        body.reply_subject?.trim() ||
        `Ynt: ${existing.subject || "AHİD İletişim"}`;
      emailResult = await sendTransactionalEmail({
        to: existing.email,
        subject: replySubject,
        text: body.reply_message.trim(),
        replyTo: settings.contact_notify_email,
      });

      const stamp = new Date().toLocaleString("tr-TR");
      const logLine = `[${stamp} - ${auth.user.full_name} (${
        emailResult.sent
          ? "Resend ile Gönderildi"
          : "E-posta İstemcisi Hazırlandı"
      })]: ${body.reply_message.trim()}`;
      combinedNotes = combinedNotes
        ? `${combinedNotes}\n\n${logLine}`
        : logLine;
      nextStatus = "replied";
    }

    const { data, error } = await supabaseServer
      .from("contact_messages")
      .update({
        status: nextStatus,
        admin_notes: combinedNotes,
        handled_by: auth.user.id,
      })
      .eq("id", msgId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await recordAuditLog({
      actorUserId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: body.reply_message ? "CONTACT_REPLIED" : "CONTACT_UPDATED",
      target: existing.email,
      details: `İletişim kaydı durumu: ${nextStatus}`,
      status: "success",
    });

    return NextResponse.json({
      success: true,
      message: data,
      data,
      emailResult,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Geçersiz istek." },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin(request);
  if ("response" in auth) return auth.response;

  const { searchParams } = new URL(request.url);
  const msgId = parsePositiveId(searchParams.get("id"));
  if (!msgId) {
    return NextResponse.json(
      { error: "Geçerli mesaj ID zorunludur." },
      { status: 400 }
    );
  }

  const { error } = await supabaseServer
    .from("contact_messages")
    .delete()
    .eq("id", msgId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
