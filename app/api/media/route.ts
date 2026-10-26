import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    let query = supabase
      .from("media_assets")
      .select("*")
      .order("id", { ascending: false });

    if (category && category !== "all" && category !== "Tümü") {
      query = query.eq("category", category);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json(
        { success: false, error: error.message, assets: [] },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      assets: data || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message, assets: [] },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      file_name,
      title,
      file_url,
      bucket,
      format,
      file_size,
      dimensions,
      aspect_ratio,
      category,
      alt_text,
      usage_locations,
      is_live,
    } = body;

    if (!file_name || !file_url) {
      return NextResponse.json(
        { success: false, error: "Dosya adı ve URL zorunludur." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("media_assets")
      .insert({
        file_name,
        title: title || file_name,
        file_url,
        bucket: bucket || "media",
        format: format || "WEBP",
        file_size: file_size || "500 KB",
        dimensions: dimensions || "1920 × 1080",
        aspect_ratio: aspect_ratio || "16:9",
        category: category || "Genel Kurumsal",
        alt_text: alt_text || "",
        usage_locations: Array.isArray(usage_locations) ? usage_locations : [],
        is_live: is_live !== undefined ? Boolean(is_live) : true,
      })
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
      asset: data,
      message: "Medya varlığı kütüphaneye kaydedildi.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, alt_text, category, title, usage_locations, is_live } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Güncellenecek medya ID belirtilmelidir." },
        { status: 400 }
      );
    }

    const updates: {
      alt_text?: string | null;
      category?: string;
      title?: string | null;
      usage_locations?: string[] | null;
      is_live?: boolean;
    } = {};
    if (alt_text !== undefined) updates.alt_text = alt_text;
    if (category !== undefined) updates.category = category;
    if (title !== undefined) updates.title = title;
    if (usage_locations !== undefined) updates.usage_locations = usage_locations;
    if (is_live !== undefined) updates.is_live = Boolean(is_live);

    const { data, error } = await supabase
      .from("media_assets")
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
      asset: data,
      message: "Medya varlığı güncellendi.",
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
      .from("media_assets")
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
      message: "Medya varlığı silindi.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
