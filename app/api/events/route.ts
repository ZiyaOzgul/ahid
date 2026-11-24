import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { EVENT_DEFAULT_CAPACITY, parsePositiveId } from "@/lib/constants";
import { recordAuditLog } from "@/lib/audit";
import { supabaseServer } from "@/lib/supabase-server";
import type { TablesUpdate } from "@/types/database.types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idParam = parsePositiveId(searchParams.get("id"));
  const featured = searchParams.get("featured");
  const category = searchParams.get("category");
  const limitParam = Number(searchParams.get("limit") || "0");

  let query = supabaseServer
    .from("events")
    .select("*")
    .order("event_date", { ascending: true });

  if (idParam) {
    query = query.eq("id", idParam);
  }
  if (featured === "true") {
    query = query.eq("is_featured", true);
  }
  if (category && category !== "all") {
    query = query.eq("category", category);
  }
  if (Number.isFinite(limitParam) && limitParam > 0) {
    query = query.limit(limitParam);
  }

  const [eventsRes, regsRes] = await Promise.all([
    query,
    supabaseServer.from("event_registrations").select("event_id, status"),
  ]);

  if (eventsRes.error) {
    return NextResponse.json(
      { error: eventsRes.error.message },
      { status: 500 }
    );
  }

  const countMap = new Map<number, number>();
  for (const reg of regsRes.data || []) {
    if (reg.status === "cancelled") continue;
    countMap.set(reg.event_id, (countMap.get(reg.event_id) || 0) + 1);
  }

  const enriched = (eventsRes.data || []).map((ev) => ({
    ...ev,
    registrations_count: countMap.get(ev.id) || 0,
    capacity: EVENT_DEFAULT_CAPACITY,
  }));

  if (idParam) {
    return NextResponse.json({
      success: true,
      event: enriched[0] || null,
      data: enriched[0] || null,
    });
  }

  return NextResponse.json({ success: true, events: enriched, data: enriched });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if ("response" in auth) return auth.response;

  try {
    const body = (await request.json()) as {
      title?: string;
      category?: string;
      event_date?: string;
      event_time?: string | null;
      location?: string | null;
      summary?: string | null;
      description?: string | null;
      image_url?: string | null;
      is_featured?: boolean;
      registration_open?: boolean;
    };

    if (!body.title?.trim() || !body.event_date) {
      return NextResponse.json(
        { error: "Etkinlik başlığı ve tarihi zorunludur." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from("events")
      .insert({
        title: body.title.trim(),
        category: (body.category || "Etkinlik").trim(),
        event_date: body.event_date,
        event_time: body.event_time?.trim() || null,
        location: body.location?.trim() || null,
        summary: body.summary?.trim() || null,
        description: body.description?.trim() || null,
        image_url: body.image_url?.trim() || null,
        is_featured: Boolean(body.is_featured),
        registration_open: body.registration_open ?? true,
        created_by: auth.user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await recordAuditLog({
      actorUserId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "EVENT_CREATED",
      target: data.title,
      details: `Etkinlik oluşturuldu (${data.event_date})`,
      status: "success",
    });

    return NextResponse.json(
      { success: true, event: data, data },
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
      title?: string;
      category?: string;
      event_date?: string;
      event_time?: string | null;
      location?: string | null;
      summary?: string | null;
      description?: string | null;
      image_url?: string | null;
      is_featured?: boolean;
      registration_open?: boolean;
    };

    const eventId = parsePositiveId(body.id);
    if (!eventId) {
      return NextResponse.json(
        { error: "Geçerli etkinlik ID zorunludur." },
        { status: 400 }
      );
    }

    const updatePayload: TablesUpdate<"events"> = {};
    if (body.title !== undefined) updatePayload.title = body.title.trim();
    if (body.category !== undefined) {
      updatePayload.category = body.category.trim();
    }
    if (body.event_date !== undefined) updatePayload.event_date = body.event_date;
    if (body.event_time !== undefined) updatePayload.event_time = body.event_time;
    if (body.location !== undefined) updatePayload.location = body.location;
    if (body.summary !== undefined) updatePayload.summary = body.summary;
    if (body.description !== undefined) {
      updatePayload.description = body.description;
    }
    if (body.image_url !== undefined) updatePayload.image_url = body.image_url;
    if (body.is_featured !== undefined) {
      updatePayload.is_featured = Boolean(body.is_featured);
    }
    if (body.registration_open !== undefined) {
      updatePayload.registration_open = Boolean(body.registration_open);
    }

    const { data, error } = await supabaseServer
      .from("events")
      .update(updatePayload)
      .eq("id", eventId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await recordAuditLog({
      actorUserId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "EVENT_UPDATED",
      target: data.title,
      details: "Etkinlik bilgileri güncellendi.",
      status: "success",
    });

    return NextResponse.json({ success: true, event: data, data });
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
  const eventId = parsePositiveId(searchParams.get("id"));
  if (!eventId) {
    return NextResponse.json(
      { error: "Geçerli etkinlik ID zorunludur." },
      { status: 400 }
    );
  }

  await supabaseServer
    .from("event_registrations")
    .delete()
    .eq("event_id", eventId);

  const { error } = await supabaseServer
    .from("events")
    .delete()
    .eq("id", eventId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await recordAuditLog({
    actorUserId: auth.user.id,
    actorEmail: auth.user.email,
    actorRole: auth.user.role,
    action: "EVENT_DELETED",
    target: String(eventId),
    details: "Etkinlik ve bağlı kayıtlar silindi.",
    status: "warning",
  });

  return NextResponse.json({ success: true });
}
