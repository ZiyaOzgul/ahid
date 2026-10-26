import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    let query = supabase
      .from("board_members")
      .select("*")
      .order("order_no", { ascending: true })
      .order("id", { ascending: true });

    if (category) {
      query = query.eq("category", category);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json(
        { success: false, error: error.message, members: [] },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      members: data || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message, members: [] },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      full_name,
      title,
      category,
      organization,
      bio,
      photo_url,
      order_no,
      term_period,
      term_label,
      is_founding_president,
      quote,
      focus_areas,
      achievements,
      registry_info,
    } = body;

    if (!full_name || !title) {
      return NextResponse.json(
        { success: false, error: "Ad soyad ve görev unvanı zorunludur." },
        { status: 400 }
      );
    }

    const payload = {
      full_name,
      title,
      category: category || "yonetim_kurulu",
      organization: organization || "AHİD",
      bio: bio || "",
      photo_url: photo_url || "",
      order_no: order_no || 99,
      is_active: true,
      term_period: term_period || null,
      term_label: term_label || null,
      is_founding_president: Boolean(is_founding_president),
      quote: quote || null,
      focus_areas: focus_areas || null,
      achievements: Array.isArray(achievements) ? achievements : [],
      registry_info: registry_info || null,
    };

    const { error } = await supabase.from("board_members").insert(payload);
    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Yönetim kurulu / kurul üyesi başarıyla eklendi.",
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
        { success: false, error: "Silinecek üye ID belirtilmelidir." },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("board_members").delete().eq("id", Number(id));
    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Kurul üyesi kaydı silindi.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
