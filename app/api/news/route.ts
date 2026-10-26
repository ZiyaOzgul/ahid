import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const slug = searchParams.get("slug");
    const memberOnly = searchParams.get("member_only");

    if (slug) {
      const { data: item, error } = await supabase
        .from("news_announcements")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (error || !item) {
        return NextResponse.json(
          { success: false, error: "Haber veya duyuru bulunamadı." },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, item });
    }

    let query = supabase
      .from("news_announcements")
      .select("*")
      .order("is_featured", { ascending: false })
      .order("id", { ascending: false });

    if (category && category !== "all" && category !== "Tümü") {
      query = query.eq("category", category);
    }

    if (memberOnly === "true") {
      query = query.eq("is_member_only", true);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json(
        { success: false, error: error.message, items: [] },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      items: data || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message, items: [] },
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
      bulletin_no,
      location,
      summary,
      content,
      highlights,
      image_url,
      is_featured,
      is_member_only,
      read_time,
      published_at,
    } = body;

    if (!title) {
      return NextResponse.json(
        { success: false, error: "Haber/duyuru başlığı zorunludur." },
        { status: 400 }
      );
    }

    const slug =
      title
        .toLowerCase()
        .replace(/ğ/g, "g")
        .replace(/ü/g, "u")
        .replace(/ş/g, "s")
        .replace(/ı/g, "i")
        .replace(/ö/g, "o")
        .replace(/ç/g, "c")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") +
      "-" +
      Date.now().toString().slice(-4);

    const { error } = await supabase.from("news_announcements").insert({
      title,
      slug,
      category: category || "Basın Bülteni",
      bulletin_no: bulletin_no || null,
      location: location || "Genel Merkez, Ankara",
      summary: summary || "",
      content: content || summary || "",
      highlights: Array.isArray(highlights) ? highlights : [],
      image_url: image_url || null,
      is_featured: Boolean(is_featured),
      is_member_only: Boolean(is_member_only),
      read_time: read_time || "3 dk okuma",
      published_at:
        published_at ||
        new Date().toLocaleDateString("tr-TR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      slug,
      message: "Haber/duyuru başarıyla yayınlandı.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID belirtilmelidir." },
        { status: 400 }
      );
    }
    const { error } = await supabase
      .from("news_announcements")
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
      message: "Kayıt silindi.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
