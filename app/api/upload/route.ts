import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const bucket = (formData.get("bucket") as string) || "media";
    const category = (formData.get("category") as string) || "Genel Kurumsal";
    const altText = (formData.get("alt_text") as string) || "";

    const safeBucket = bucket === "cv-uploads" ? "cv-uploads" : "media";
    if (safeBucket === "media") {
      const auth = await requireAdmin(req);
      if ("response" in auth) return auth.response;
    }

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Yüklenecek dosya seçilmedi." },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "Dosya boyutu en fazla 10 MB olabilir." },
        { status: 400 }
      );
    }

    const ext = (file.name.split(".").pop() || "bin").toLowerCase();
    const allowedExt =
      safeBucket === "cv-uploads"
        ? new Set(["pdf", "doc", "docx", "png", "jpg", "jpeg", "webp"])
        : new Set(["png", "jpg", "jpeg", "webp", "svg", "gif", "pdf"]);
    if (!allowedExt.has(ext)) {
      return NextResponse.json(
        { success: false, error: "Desteklenmeyen dosya uzantısı." },
        { status: 400 }
      );
    }
    const baseName = file.name
      .replace(/\.[^/.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "-")
      .slice(0, 40);
    const filePath = `${Date.now()}-${baseName}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from(safeBucket)
      .upload(filePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { success: false, error: uploadError.message },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from(safeBucket)
      .getPublicUrl(filePath);

    let assetRecord = null;
    if (safeBucket === "media") {
      const sizeStr =
        file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.max(1, Math.round(file.size / 1024))} KB`;

      const { data: inserted } = await supabase
        .from("media_assets")
        .insert({
          file_name: file.name,
          title: file.name,
          file_url: publicUrlData.publicUrl,
          bucket: safeBucket,
          format: ext.toUpperCase(),
          file_size: sizeStr,
          dimensions: "1920 × 1080",
          aspect_ratio: "16:9",
          category,
          alt_text: altText || file.name,
          usage_locations: [],
          is_live: true,
        })
        .select("*")
        .maybeSingle();
      assetRecord = inserted;
    }

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
      path: filePath,
      name: file.name,
      size: file.size,
      asset: assetRecord,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
