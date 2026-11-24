import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  normalizeBoardCategory,
  parsePositiveId,
  parseStringArray,
} from "@/lib/constants";
import { recordAuditLog } from "@/lib/audit";
import { supabaseServer } from "@/lib/supabase-server";
import type { TablesUpdate } from "@/types/database.types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const activeOnly = searchParams.get("active") === "true";

  let query = supabaseServer
    .from("board_members")
    .select("*")
    .order("order_no", { ascending: true })
    .order("created_at", { ascending: true });

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const normalizedRows = (data || []).map((row) => ({
    ...row,
    category: normalizeBoardCategory(row.category),
  }));

  if (category && category !== "all") {
    const targetCat = normalizeBoardCategory(category);
    const filtered = normalizedRows.filter((r) => r.category === targetCat);
    return NextResponse.json({
      success: true,
      members: filtered,
      data: filtered,
    });
  }

  return NextResponse.json({
    success: true,
    members: normalizedRows,
    data: normalizedRows,
  });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if ("response" in auth) return auth.response;

  try {
    const body = (await request.json()) as {
      full_name?: string;
      title?: string | null;
      organization?: string | null;
      bio?: string | null;
      photo_url?: string | null;
      category?: string;
      order_no?: number;
      is_active?: boolean;
      is_founding_president?: boolean;
      term_period?: string | null;
      term_label?: string | null;
      quote?: string | null;
      focus_areas?: string | null;
      achievements?: string | string[] | null;
      registry_info?: string | null;
    };

    if (!body.full_name?.trim()) {
      return NextResponse.json(
        { error: "Üye ad soyad bilgisi zorunludur." },
        { status: 400 }
      );
    }

    const normalizedCategory = normalizeBoardCategory(body.category);
    const parsedAchievements =
      body.achievements !== undefined
        ? parseStringArray(body.achievements)
        : null;

    const { data, error } = await supabaseServer
      .from("board_members")
      .insert({
        full_name: body.full_name.trim(),
        title: body.title?.trim() || "Kurul Üyesi",
        organization: body.organization?.trim() || null,
        bio: body.bio?.trim() || null,
        photo_url: body.photo_url?.trim() || null,
        category: normalizedCategory,
        order_no: Number.isFinite(body.order_no) ? Number(body.order_no) : 10,
        is_active: body.is_active ?? true,
        is_founding_president: Boolean(body.is_founding_president),
        term_period: body.term_period?.trim() || null,
        term_label: body.term_label?.trim() || null,
        quote: body.quote?.trim() || null,
        focus_areas: body.focus_areas?.trim() || null,
        achievements: parsedAchievements,
        registry_info: body.registry_info?.trim() || null,
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
      action: "BOARD_MEMBER_CREATED",
      target: data.full_name,
      details: `Kurul üyesi eklendi (Kategori: ${normalizedCategory})`,
      status: "success",
    });

    return NextResponse.json(
      { success: true, member: data, data },
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
      full_name?: string;
      title?: string | null;
      organization?: string | null;
      bio?: string | null;
      photo_url?: string | null;
      category?: string;
      order_no?: number;
      is_active?: boolean;
      is_founding_president?: boolean;
      term_period?: string | null;
      term_label?: string | null;
      quote?: string | null;
      focus_areas?: string | null;
      achievements?: string | string[] | null;
      registry_info?: string | null;
    };

    const memberId = parsePositiveId(body.id);
    if (!memberId) {
      return NextResponse.json(
        { error: "Geçerli kurul üyesi ID zorunludur." },
        { status: 400 }
      );
    }

    const updatePayload: TablesUpdate<"board_members"> = {};
    if (body.full_name !== undefined) {
      updatePayload.full_name = body.full_name.trim();
    }
    if (body.title !== undefined && body.title?.trim()) {
      updatePayload.title = body.title.trim();
    }
    if (body.organization !== undefined) {
      updatePayload.organization = body.organization;
    }
    if (body.bio !== undefined) updatePayload.bio = body.bio;
    if (body.photo_url !== undefined) updatePayload.photo_url = body.photo_url;
    if (body.category !== undefined) {
      updatePayload.category = normalizeBoardCategory(body.category);
    }
    if (body.order_no !== undefined) {
      updatePayload.order_no = Number(body.order_no);
    }
    if (body.is_active !== undefined) {
      updatePayload.is_active = Boolean(body.is_active);
    }
    if (body.is_founding_president !== undefined) {
      updatePayload.is_founding_president = Boolean(body.is_founding_president);
    }
    if (body.term_period !== undefined) {
      updatePayload.term_period = body.term_period;
    }
    if (body.term_label !== undefined) updatePayload.term_label = body.term_label;
    if (body.quote !== undefined) updatePayload.quote = body.quote;
    if (body.focus_areas !== undefined) {
      updatePayload.focus_areas = body.focus_areas;
    }
    if (body.achievements !== undefined) {
      updatePayload.achievements = parseStringArray(body.achievements);
    }
    if (body.registry_info !== undefined) {
      updatePayload.registry_info = body.registry_info;
    }

    const { data, error } = await supabaseServer
      .from("board_members")
      .update(updatePayload)
      .eq("id", memberId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await recordAuditLog({
      actorUserId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "BOARD_MEMBER_UPDATED",
      target: data.full_name,
      details: "Kurul üyesi bilgileri güncellendi.",
      status: "success",
    });

    return NextResponse.json({ success: true, member: data, data });
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
  const memberId = parsePositiveId(searchParams.get("id"));
  if (!memberId) {
    return NextResponse.json(
      { error: "Geçerli kurul üyesi ID zorunludur." },
      { status: 400 }
    );
  }

  const { error } = await supabaseServer
    .from("board_members")
    .delete()
    .eq("id", memberId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await recordAuditLog({
    actorUserId: auth.user.id,
    actorEmail: auth.user.email,
    actorRole: auth.user.role,
    action: "BOARD_MEMBER_DELETED",
    target: String(memberId),
    details: "Kurul üyesi kaydı silindi.",
    status: "warning",
  });

  return NextResponse.json({ success: true });
}
