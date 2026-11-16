import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const id = searchParams.get("id");

    if (id) {
      const { data: event, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", Number(id))
        .maybeSingle();

      if (error || !event) {
        return NextResponse.json(
          { success: false, error: "Etkinlik bulunamadı.", event: null },
          { status: 404 }
        );
      }

      const { count } = await supabase
        .from("event_registrations")
        .select("*", { count: "exact", head: true })
        .eq("event_id", Number(id));

      return NextResponse.json({
        success: true,
        event: { ...event, registrations_count: count || 0 },
      });
    }

    let query = supabase.from("events").select("*").order("id", { ascending: true });
    if (category && category !== "Tümü") {
      query = query.eq("category", category);
    }

    const [{ data, error }, { data: regRows }] = await Promise.all([
      query,
      supabase.from("event_registrations").select("event_id"),
    ]);
    if (error) {
      return NextResponse.json({ success: false, error: error.message, events: [] }, { status: 500 });
    }

    const regCounts: Record<number, number> = {};
    for (const row of regRows || []) {
      const eid = Number(row.event_id);
      if (!Number.isNaN(eid)) {
        regCounts[eid] = (regCounts[eid] || 0) + 1;
      }
    }

    const enrichedEvents = (data || []).map((ev) => ({
      ...ev,
      registrations_count: regCounts[ev.id] || 0,
    }));

    return NextResponse.json({
      success: true,
      events: enrichedEvents,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message, events: [] },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("response" in auth) return auth.response;

  try {
    const body = await req.json();
    const {
      title,
      category,
      event_date,
      event_time,
      location,
      summary,
      description,
      image_url,
      is_featured,
    } = body;

    if (!title || !event_date) {
      return NextResponse.json(
        { success: false, error: "Etkinlik başlığı ve tarihi zorunludur." },
        { status: 400 }
      );
    }

    const payload = {
      title,
      category: category || "Genel Etkinlik",
      event_date,
      event_time: event_time || "14:00",
      location: location || "AHİD Genel Merkez - Ankara",
      summary: summary || "",
      description: description || "",
      image_url: image_url || "",
      is_featured: Boolean(is_featured),
      registration_open: true,
    };

    const { data, error } = await supabase
      .from("events")
      .insert(payload)
      .select("*")
      .single();
    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      event: data,
      message: "Etkinlik başarıyla takvime eklendi.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("response" in auth) return auth.response;

  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Etkinlik ID zorunludur." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("events")
      .update(updates)
      .eq("id", Number(id))
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      event: data,
      message: "Etkinlik başarıyla güncellendi.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("response" in auth) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Etkinlik ID zorunludur." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", Number(id));

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Etkinlik başarıyla silindi.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
