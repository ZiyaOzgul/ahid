import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const slug = searchParams.get("slug");

    if (slug) {
      const { data: article, error } = await supabase
        .from("articles")
        .select("*, board_members(id, full_name, title, photo_url, organization, bio)")
        .eq("slug", slug)
        .maybeSingle();

      if (error || !article) {
        return NextResponse.json(
          { success: false, error: "Makale bulunamadı.", article: null },
          { status: 404 }
        );
      }

      // Increment view count asynchronously
      const nextViews = (article.views_count || 0) + 1;
      await supabase
        .from("articles")
        .update({ views_count: nextViews })
        .eq("id", article.id);

      return NextResponse.json({
        success: true,
        article: { ...article, views_count: nextViews },
      });
    }

    let query = supabase
      .from("articles")
      .select("*, board_members(id, full_name, title, photo_url, organization)")
      .order("id", { ascending: false });

    if (category && category !== "Tümü") {
      query = query.eq("category", category);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json(
        { success: false, error: error.message, articles: [] },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      articles: data || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message, articles: [] },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      category,
      author_name,
      author_title,
      author_avatar,
      board_member_id,
      read_time,
      summary,
      content,
      image_url,
    } = body;

    if (!title || !author_name) {
      return NextResponse.json(
        { success: false, error: "Makale başlığı ve yazar adı zorunludur." },
        { status: 400 }
      );
    }

    const slug =
      title
        .toLowerCase()
        .replace(/[^a-z0-9ğüşıöç\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-") +
      "-" +
      Date.now().toString().slice(-4);

    const payload = {
      title,
      slug,
      category: category || "Makaleler",
      author_name,
      author_title: author_title || "İletişim Uzmanı",
      author_avatar: author_avatar || "",
      board_member_id: board_member_id ? Number(board_member_id) : null,
      read_time: read_time || "5 dk okuma",
      summary: summary || "",
      content: content || summary || "",
      image_url: image_url || "",
      published_at: new Date().toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      views_count: 1,
    };

    const { error } = await supabase.from("articles").insert(payload);
    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      slug,
      message: "Makale / yayın başarıyla kaydedildi.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
