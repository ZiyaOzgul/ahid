import { NextResponse } from "next/server";
import { getSessionFromRequest, requireAdmin } from "@/lib/auth";
import { EVENT_DEFAULT_CAPACITY, parsePositiveId } from "@/lib/constants";
import { generateQrDataUrl } from "@/lib/qr";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sendTransactionalEmail } from "@/lib/mailer";
import { recordAuditLog } from "@/lib/audit";
import { supabaseServer } from "@/lib/supabase-server";
import type { TablesUpdate } from "@/types/database.types";

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("response" in auth) return auth.response;

  const { searchParams } = new URL(request.url);
  const eventIdParam = searchParams.get("event_id");

  let query = supabaseServer
    .from("event_registrations")
    .select("*, events(id, title, event_date, event_time, location)")
    .order("created_at", { ascending: false });

  if (eventIdParam && eventIdParam !== "all") {
    const parsedId = parsePositiveId(eventIdParam);
    if (parsedId) {
      query = query.eq("event_id", parsedId);
    }
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    registrations: data || [],
    data: data || [],
  });
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const limit = checkRateLimit(`event-reg:${ip}`, 12, 15 * 60_000);
    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: `Çok fazla etkinlik kayıt denemesi. Lütfen ${limit.resetInSeconds} saniye sonra tekrar deneyin.`,
        },
        { status: 429 }
      );
    }

    const session = await getSessionFromRequest(request);
    const body = (await request.json()) as {
      event_id?: number | string;
      full_name?: string;
      participant_name?: string;
      email?: string;
      participant_email?: string;
      phone?: string | null;
      participant_phone?: string | null;
      organization?: string | null;
      title?: string | null;
      ticket_type?: string | null;
    };

    const eventId = parsePositiveId(body.event_id);
    const fullName = (body.full_name || body.participant_name || "").trim();
    const email = (
      body.email ||
      body.participant_email ||
      ""
    )
      .trim()
      .toLowerCase();
    const phone =
      (body.phone || body.participant_phone || "").trim() || null;

    if (!eventId) {
      return NextResponse.json(
        { error: "Geçerli bir etkinlik seçimi zorunludur." },
        { status: 400 }
      );
    }

    if (!fullName || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        {
          error:
            "Katılımcı adı soyadı ve geçerli bir e-posta adresi zorunludur.",
        },
        { status: 400 }
      );
    }

    const { data: event, error: eventErr } = await supabaseServer
      .from("events")
      .select("id, title, event_date, event_time, location, registration_open")
      .eq("id", eventId)
      .maybeSingle();

    if (eventErr || !event) {
      return NextResponse.json(
        { error: "Seçilen etkinlik bulunamadı." },
        { status: 404 }
      );
    }

    if (!event.registration_open) {
      return NextResponse.json(
        { error: "Bu etkinlik için online kayıt alımı kapalıdır." },
        { status: 400 }
      );
    }

    const { data: existingReg } = await supabaseServer
      .from("event_registrations")
      .select("id, status")
      .eq("event_id", eventId)
      .eq("email", email)
      .neq("status", "cancelled")
      .maybeSingle();

    if (existingReg) {
      return NextResponse.json(
        {
          error:
            "Bu e-posta adresi ile seçilen etkinliğe zaten onaylı kaydınız bulunmaktadır.",
          alreadyRegistered: true,
        },
        { status: 409 }
      );
    }

    const { count: currentCount } = await supabaseServer
      .from("event_registrations")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .neq("status", "cancelled");

    if ((currentCount || 0) >= EVENT_DEFAULT_CAPACITY) {
      return NextResponse.json(
        { error: "Etkinlik kontenjanı dolmuştur." },
        { status: 400 }
      );
    }

    const { data: registration, error: insertErr } = await supabaseServer
      .from("event_registrations")
      .insert({
        event_id: eventId,
        user_id: session?.id ?? null,
        full_name: fullName,
        email,
        phone,
        organization: body.organization?.trim() || null,
        title: body.title?.trim() || null,
        ticket_type:
          body.ticket_type?.trim() ||
          (session ? "AHİD Üyesi" : "Genel Katılımcı"),
        status: "confirmed",
      })
      .select()
      .single();

    if (insertErr || !registration) {
      return NextResponse.json(
        {
          error: insertErr?.message || "Etkinlik kaydı oluşturulamadı.",
        },
        { status: 500 }
      );
    }

    const ticketCode = `AHID-EVT-${String(registration.id).padStart(6, "0")}`;
    const qrPayload = `AHID-TICKET|${ticketCode}|${event.title}|${fullName}|${email}`;
    const qrDataUrl = await generateQrDataUrl(qrPayload);

    await sendTransactionalEmail({
      to: email,
      subject: `AHİD Etkinlik Kayıt Onayı: ${event.title}`,
      text: `Sayın ${fullName},\n\n"${event.title}" etkinliğine kaydınız onaylanmıştır.\n\nBilet Kodunuz: ${ticketCode}\nTarih: ${event.event_date}${
        event.event_time ? ` (${event.event_time})` : ""
      }\nYer: ${event.location || "Ankara"}\n\nSaygılarımızla,\nAHİD Etkinlik Koordinasyon`,
    });

    return NextResponse.json(
      {
        success: true,
        registration,
        ticketCode,
        qrDataUrl,
        event,
      },
      { status: 201 }
    );
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
      status?: "confirmed" | "checked_in" | "cancelled";
      ticket_type?: string;
    };

    const regId = parsePositiveId(body.id);
    if (!regId) {
      return NextResponse.json(
        { error: "Geçerli kayıt ID zorunludur." },
        { status: 400 }
      );
    }

    const updatePayload: TablesUpdate<"event_registrations"> = {};
    if (body.status) updatePayload.status = body.status;
    if (body.ticket_type) updatePayload.ticket_type = body.ticket_type;

    const { data, error } = await supabaseServer
      .from("event_registrations")
      .update(updatePayload)
      .eq("id", regId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await recordAuditLog({
      actorUserId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "EVENT_CHECKIN_UPDATED",
      target: data.full_name,
      details: `Katılımcı durumu güncellendi: ${data.status}`,
      status: "success",
    });

    return NextResponse.json({ success: true, registration: data, data });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Geçersiz istek." },
      { status: 400 }
    );
  }
}
