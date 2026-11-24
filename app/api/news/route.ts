import { NextResponse } from "next/server";
import { getSessionFromRequest, requireAdmin } from "@/lib/auth";
import {
  parsePositiveId,
  parseStringArray,
  slugifyTurkish,
} from "@/lib/constants";
import { recordAuditLog } from "@/lib/audit";
import { supabaseServer } from "@/lib/supabase-server";
import type { TablesUpdate } from "@/types/database.types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const idParam = parsePositiveId(searchParams.get("id"));
  const category = searchParams.get("category");
  const featured = searchParams.get("featured");
  const limitParam = Number(searchParams.get("limit") || "0");

  const session = await getSessionFromRequest(request);

  if (slug || idParam) {
    let q = supabaseServer.from("news_announcements").select("*");
    q = slug ? q.eq("slug", slug) : q.eq("id", idParam as number);
    const { data: item, error } = await q.maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!item) {
      return NextResponse.json(
        { error: "Haber veya duyuru bulunamadı." },
        { status: 404 }
      );
    }

    if (item.is_member_only && !session) {
      return NextResponse.json(
        {
          error:
            "Bu duyuru yalnızca AHİD üyelerine özeldir. İçeriği görüntülemek için lütfen üye girişi yapın.",
          requiresMemberAuth: true,
          preview: {
            id: item.id,
            title: item.title,
            slug: item.slug,
            category: item.category,
            published_at: item.published_at,
            is_member_only: true,
          },
        },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true, item, data: item });
  }

  let query = supabaseServer
    .from("news_announcements")
    .select("*")
    .order("published_at", { ascending: false });

  if (category && category !== "all") {
    query = query.eq("category", category);
  }
  if (featured === "true") {
    query = query.eq("is_featured", true);
  }
  if (Number.isFinite(limitParam) && limitParam > 0) {
    query = query.limit(limitParam);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Strip sensitive content body from member-only announcements when visitor is anonymous
  const safeRows = (data || []).map((row) => {
    if (row.is_member_only && !session) {
      return {
        ...row,
        content: null,
        highlights: null,
        locked: true,
      };
    }
    return { ...row, locked: false };
  });

  return NextResponse.json({
    success: true,
    items: safeRows,
    news: safeRows,
    data: safeRows,
  });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if ("response" in auth) return auth.response;

  try {
    const body = (await request.json()) as {
      title?: string;
      slug?: string;
      category?: string;
      bulletin_no?: string | null;
      location?: string | null;
      summary?: string | null;
      content?: string | null;
      highlights?: string | string[] | null;
      image_url?: string | null;
      is_featured?: boolean;
      is_member_only?: boolean;
      read_time?: string | null;
      published_at?: string | null;
    };

    if (!body.title?.trim()) {
      return NextResponse.json(
        { error: "Haber/duyuru başlığı zorunludur." },
        { status: 400 }
      );
    }

    const baseSlug = slugifyTurkish(body.slug || body.title);
    const uniqueSlug = `${baseSlug || "duyuru"}-${Date.now()
      .toString(36)
      .slice(-4)}`;
    const wordCount = (body.content || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    const parsedHighlights =
      body.highlights !== undefined ? parseStringArray(body.highlights) : null;

    const { data, error } = await supabaseServer
      .from("news_announcements")
      .insert({
        title: body.title.trim(),
        slug: uniqueSlug,
        category: (body.category || "Duyuru").trim(),
        bulletin_no: body.bulletin_no?.trim() || null,
        location: body.location?.trim() || "Ankara",
        summary: body.summary?.trim() || null,
        content: body.content?.trim() || null,
        highlights: parsedHighlights,
        image_url: body.image_url?.trim() || null,
        is_featured: Boolean(body.is_featured),
        is_member_only: Boolean(body.is_member_only),
        read_time:
          body.read_time?.trim() || `${Math.max(1, Math.ceil(wordCount / 180))} dk`,
        published_at:
          body.published_at || new Date().toISOString().split("T")[0],
        author_id: auth.user.id,
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
      action: "NEWS_CREATED",
      target: data.title,
      details: `Duyuru eklendi (Kategori: ${data.category}, Üyelere Özel: ${
        data.is_member_only ? "Evet" : "Hayır"
      })`,
      status: "success",
    });

    return NextResponse.json({ success: true, item: data, data }, { status: 201 });
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
      slug?: string;
      category?: string;
      bulletin_no?: string | null;
      location?: string | null;
      summary?: string | null;
      content?: string | null;
      highlights?: string | string[] | null;
      image_url?: string | null;
      is_featured?: boolean;
      is_member_only?: boolean;
      read_time?: string | null;
      published_at?: string | null;
    };

    const newsId = parsePositiveId(body.id);
    if (!newsId) {
      return NextResponse.json(
        { error: "Geçerli haber/duyuru ID zorunludur." },
        { status: 400 }
      );
    }

    const updatePayload: TablesUpdate<"news_announcements"> = {};
    if (body.title !== undefined) updatePayload.title = body.title.trim();
    if (body.slug !== undefined) updatePayload.slug = slugifyTurkish(body.slug);
    if (body.category !== undefined) {
      updatePayload.category = body.category.trim();
    }
    if (body.bulletin_no !== undefined) updatePayload.bulletin_no = body.bulletin_no;
    if (body.location !== undefined) updatePayload.location = body.location;
    if (body.summary !== undefined) updatePayload.summary = body.summary;
    if (body.content !== undefined) updatePayload.content = body.content;
    if (body.highlights !== undefined) {
      updatePayload.highlights = parseStringArray(body.highlights);
    }
    if (body.image_url !== undefined) updatePayload.image_url = body.image_url;
    if (body.is_featured !== undefined) {
      updatePayload.is_featured = Boolean(body.is_featured);
    }
    if (body.is_member_only !== undefined) {
      updatePayload.is_member_only = Boolean(body.is_member_only);
    }
    if (body.read_time !== undefined) updatePayload.read_time = body.read_time;
    if (body.published_at !== undefined) {
      updatePayload.published_at = body.published_at;
    }

    const { data, error } = await supabaseServer
      .from("news_announcements")
      .update(updatePayload)
      .eq("id", newsId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await recordAuditLog({
      actorUserId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "NEWS_UPDATED",
      target: data.title,
      details: "Haber/duyuru güncellendi.",
      status: "success",
    });

    return NextResponse.json({ success: true, item: data, data });
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
  const newsId = parsePositiveId(searchParams.get("id"));
  if (!newsId) {
    return NextResponse.json(
      { error: "Geçerli haber/duyuru ID zorunludur." },
      { status: 400 }
    );
  }

  const { error } = await supabaseServer
    .from("news_announcements")
    .delete()
    .eq("id", newsId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await recordAuditLog({
    actorUserId: auth.user.id,
    actorEmail: auth.user.email,
    actorRole: auth.user.role,
    action: "NEWS_DELETED",
    target: String(newsId),
    details: "Haber/duyuru silindi.",
    status: "warning",
  });

  return NextResponse.json({ success: true });
}
