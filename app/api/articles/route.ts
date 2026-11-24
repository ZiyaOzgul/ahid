import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { parsePositiveId, slugifyTurkish } from "@/lib/constants";
import { recordAuditLog } from "@/lib/audit";
import { supabaseServer } from "@/lib/supabase-server";
import type { TablesUpdate } from "@/types/database.types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const idParam = parsePositiveId(searchParams.get("id"));
  const category = searchParams.get("category");
  const limitParam = Number(searchParams.get("limit") || "0");
  const increment = searchParams.get("increment") === "true";

  if (slug || idParam) {
    let q = supabaseServer.from("articles").select("*");
    q = slug ? q.eq("slug", slug) : q.eq("id", idParam as number);

    const { data: article, error } = await q.maybeSingle();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!article) {
      return NextResponse.json(
        { error: "Yayın veya köşe yazısı bulunamadı." },
        { status: 404 }
      );
    }

    if (increment) {
      const nextViews = (article.views_count || 0) + 1;
      await supabaseServer
        .from("articles")
        .update({ views_count: nextViews })
        .eq("id", article.id);
      article.views_count = nextViews;
    }

    return NextResponse.json({ success: true, article, data: article });
  }

  let query = supabaseServer
    .from("articles")
    .select("*")
    .order("published_at", { ascending: false });

  if (category && category !== "all") {
    query = query.eq("category", category);
  }
  if (Number.isFinite(limitParam) && limitParam > 0) {
    query = query.limit(limitParam);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    articles: data || [],
    data: data || [],
  });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if ("response" in auth) return auth.response;

  try {
    const body = (await request.json()) as {
      title?: string;
      slug?: string;
      author_name?: string;
      author_title?: string | null;
      author_avatar?: string | null;
      board_member_id?: number | string | null;
      category?: string;
      summary?: string | null;
      content?: string | null;
      read_time?: string | null;
      published_at?: string | null;
      image_url?: string | null;
    };

    if (!body.title?.trim() || !body.author_name?.trim()) {
      return NextResponse.json(
        { error: "Başlık ve yazar adı zorunludur." },
        { status: 400 }
      );
    }

    const baseSlug = slugifyTurkish(body.slug || body.title);
    const uniqueSlug = `${baseSlug || "yazi"}-${Date.now()
      .toString(36)
      .slice(-4)}`;

    const boardMemberId = parsePositiveId(body.board_member_id);
    let authorAvatar = body.author_avatar?.trim() || null;
    if (!authorAvatar && boardMemberId) {
      const { data: bm } = await supabaseServer
        .from("board_members")
        .select("photo_url")
        .eq("id", boardMemberId)
        .maybeSingle();
      if (bm?.photo_url) authorAvatar = bm.photo_url;
    }

    const wordCount = (body.content || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    const computedReadTime =
      body.read_time?.trim() ||
      `${Math.max(1, Math.ceil(wordCount / 180))} dk okuma`;

    const { data, error } = await supabaseServer
      .from("articles")
      .insert({
        title: body.title.trim(),
        slug: uniqueSlug,
        author_name: body.author_name.trim(),
        author_title: body.author_title?.trim() || "Kurul Üyesi / Yazar",
        author_avatar: authorAvatar,
        board_member_id: boardMemberId,
        author_id: auth.user.id,
        category: (body.category || "Görüş").trim(),
        summary: body.summary?.trim() || null,
        content: body.content?.trim() || null,
        read_time: computedReadTime,
        published_at:
          body.published_at || new Date().toISOString().split("T")[0],
        image_url: body.image_url?.trim() || null,
        views_count: 0,
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
      action: "ARTICLE_CREATED",
      target: data.title,
      details: `Köşe yazısı/yayın eklendi (Yazar: ${data.author_name})`,
      status: "success",
    });

    return NextResponse.json(
      { success: true, article: data, data },
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
      slug?: string;
      author_name?: string;
      author_title?: string | null;
      author_avatar?: string | null;
      board_member_id?: number | string | null;
      category?: string;
      summary?: string | null;
      content?: string | null;
      read_time?: string | null;
      published_at?: string | null;
      image_url?: string | null;
    };

    const articleId = parsePositiveId(body.id);
    if (!articleId) {
      return NextResponse.json(
        { error: "Geçerli yayın ID zorunludur." },
        { status: 400 }
      );
    }

    const updatePayload: TablesUpdate<"articles"> = {};
    if (body.title !== undefined) updatePayload.title = body.title.trim();
    if (body.slug !== undefined) updatePayload.slug = slugifyTurkish(body.slug);
    if (body.author_name !== undefined) {
      updatePayload.author_name = body.author_name.trim();
    }
    if (body.author_title !== undefined) {
      updatePayload.author_title = body.author_title;
    }
    if (body.author_avatar !== undefined) {
      updatePayload.author_avatar = body.author_avatar;
    }
    if (body.board_member_id !== undefined) {
      updatePayload.board_member_id = parsePositiveId(body.board_member_id);
    }
    if (body.category !== undefined) {
      updatePayload.category = body.category.trim();
    }
    if (body.summary !== undefined) updatePayload.summary = body.summary;
    if (body.content !== undefined) updatePayload.content = body.content;
    if (body.read_time !== undefined) updatePayload.read_time = body.read_time;
    if (body.published_at !== undefined) {
      updatePayload.published_at = body.published_at;
    }
    if (body.image_url !== undefined) updatePayload.image_url = body.image_url;

    const { data, error } = await supabaseServer
      .from("articles")
      .update(updatePayload)
      .eq("id", articleId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await recordAuditLog({
      actorUserId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "ARTICLE_UPDATED",
      target: data.title,
      details: "Yayın/köşe yazısı güncellendi.",
      status: "success",
    });

    return NextResponse.json({ success: true, article: data, data });
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
  const articleId = parsePositiveId(searchParams.get("id"));
  if (!articleId) {
    return NextResponse.json(
      { error: "Geçerli yayın ID zorunludur." },
      { status: 400 }
    );
  }

  const { error } = await supabaseServer
    .from("articles")
    .delete()
    .eq("id", articleId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await recordAuditLog({
    actorUserId: auth.user.id,
    actorEmail: auth.user.email,
    actorRole: auth.user.role,
    action: "ARTICLE_DELETED",
    target: String(articleId),
    details: "Köşe yazısı/yayın silindi.",
    status: "warning",
  });

  return NextResponse.json({ success: true });
}
