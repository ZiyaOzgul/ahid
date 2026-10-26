import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const verifyCode = searchParams.get("verify_code");

    if (verifyCode) {
      const cleaned = verifyCode.trim();
      const { data: doc, error } = await supabase
        .from("documents")
        .select("*")
        .ilike("document_code", cleaned)
        .maybeSingle();

      if (error) {
        return NextResponse.json(
          { success: false, verified: false, error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        verified: Boolean(doc),
        document: doc || null,
      });
    }

    let query = supabase
      .from("documents")
      .select("*")
      .order("is_featured", { ascending: false })
      .order("id", { ascending: false });

    if (category && category !== "all" && category !== "Tümü") {
      query = query.eq("category", category);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json(
        { success: false, error: error.message, documents: [] },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      documents: data || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message, documents: [] },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      subtitle,
      description,
      category,
      document_code,
      file_url,
      file_format,
      file_size,
      revision_date,
      authority,
      signature_status,
      is_featured,
    } = body;

    if (!title) {
      return NextResponse.json(
        { success: false, error: "Belge başlığı zorunludur." },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("documents").insert({
      title,
      subtitle: subtitle || null,
      description: description || null,
      category: category || "Dernek Tüzüğü & İç Yönergeler",
      document_code:
        document_code ||
        `TR-AHID-${new Date().getFullYear()}-ARCH-${Math.floor(1000 + Math.random() * 9000)}`,
      file_url: file_url || null,
      file_format: file_format || "PDF",
      file_size: file_size || "1.0 MB",
      revision_date:
        revision_date ||
        new Date().toLocaleDateString("tr-TR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
      authority: authority || "Yönetim Kurulu",
      signature_status: signature_status || "KamuSM Onaylı",
      is_featured: Boolean(is_featured),
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Resmi belge kütüphaneye eklendi.",
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
      .from("documents")
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
      message: "Belge kaydı silindi.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
