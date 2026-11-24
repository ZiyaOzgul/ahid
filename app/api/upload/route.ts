import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { formatFileSize } from "@/lib/constants";
import { inspectUploadBuffer } from "@/lib/image-meta";
import { recordAuditLog } from "@/lib/audit";
import { supabaseServer } from "@/lib/supabase-server";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if ("response" in auth) return auth.response;

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const requestedBucket = String(formData.get("bucket") || "media");
    const category = String(formData.get("category") || "Genel");
    const titleInput = String(formData.get("title") || "").trim();
    const altText = String(formData.get("alt_text") || "").trim();
    const isLiveRaw = formData.get("is_live");
    const isLive = isLiveRaw === null ? true : String(isLiveRaw) !== "false";

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Yüklenecek dosya seçilmedi." },
        { status: 400 }
      );
    }

    if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "Dosya boyutu 0 KB ile 10 MB arasında olmalıdır." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const inspected = inspectUploadBuffer(buffer, { allowPdf: true });

    if (!inspected.valid) {
      return NextResponse.json(
        { error: inspected.error || "Geçersiz dosya biçimi." },
        { status: 400 }
      );
    }

    const bucket = requestedBucket === "cv-uploads" ? "cv-uploads" : "media";
    const safeStoragePath = `${Date.now()}_${crypto
      .randomBytes(6)
      .toString("hex")}.${inspected.extension}`;

    const { error: uploadError } = await supabaseServer.storage
      .from(bucket)
      .upload(safeStoragePath, buffer, {
        contentType: inspected.mimeType,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Depolama hatası: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabaseServer.storage.from(bucket).getPublicUrl(safeStoragePath);

    const fileSize = formatFileSize(file.size);
    const derivedTitle =
      titleInput || file.name.replace(/\.[^/.]+$/, "") || safeStoragePath;

    const { data: asset, error: dbError } = await supabaseServer
      .from("media_assets")
      .insert({
        file_name: file.name,
        title: derivedTitle,
        file_url: publicUrl,
        bucket,
        format: inspected.detectedType,
        file_size: fileSize,
        dimensions: inspected.dimensionsLabel,
        aspect_ratio: inspected.aspectRatioLabel,
        category,
        alt_text: altText || derivedTitle,
        is_live: isLive,
        uploaded_by: auth.user.id,
      })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json(
        { error: `Medya kaydı oluşturulamadı: ${dbError.message}` },
        { status: 500 }
      );
    }

    await recordAuditLog({
      actorUserId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "MEDIA_UPLOADED",
      target: file.name,
      details: `${inspected.detectedType} (${fileSize}, ${inspected.dimensionsLabel}) yüklendi.`,
      status: "success",
    });

    return NextResponse.json(
      {
        success: true,
        url: publicUrl,
        file_format: inspected.detectedType,
        file_size: fileSize,
        dimensions: inspected.dimensionsLabel,
        aspect_ratio: inspected.aspectRatioLabel,
        asset,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Dosya yükleme işlemi başarısız oldu.",
      },
      { status: 500 }
    );
  }
}
