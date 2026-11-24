import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { inspectUploadBuffer } from "@/lib/image-meta";
import { formatFileSize } from "@/lib/constants";
import { supabaseServer } from "@/lib/supabase-server";

const MAX_CV_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rate = checkRateLimit(`cv-upload:${ip}`, 10, 60 * 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: `Çok fazla dosya yükleme isteği. Lütfen ${rate.resetInSeconds} saniye sonra tekrar deneyin.`,
        },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Yüklenecek özgeçmiş (PDF) dosyası bulunamadı." },
        { status: 400 }
      );
    }

    if (file.size <= 0 || file.size > MAX_CV_BYTES) {
      return NextResponse.json(
        { error: "Özgeçmiş dosyası 0 KB ile 5 MB arasında olmalıdır." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const inspected = inspectUploadBuffer(buffer, { allowPdf: true });

    if (!inspected.valid || inspected.detectedType !== "PDF") {
      return NextResponse.json(
        {
          error:
            "Özgeçmiş yüklemelerinde güvenlik nedeniyle yalnızca geçerli PDF dosyaları kabul edilmektedir.",
        },
        { status: 400 }
      );
    }

    const safeFileName = `applications/${Date.now()}_${crypto
      .randomBytes(6)
      .toString("hex")}.pdf`;

    const { error: uploadError } = await supabaseServer.storage
      .from("cv-uploads")
      .upload(safeFileName, buffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Depolama yükleme hatası: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabaseServer.storage.from("cv-uploads").getPublicUrl(safeFileName);

    return NextResponse.json(
      {
        success: true,
        url: publicUrl,
        fileName: file.name,
        fileSize: formatFileSize(file.size),
        format: "PDF",
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Özgeçmiş yüklenemedi.",
      },
      { status: 500 }
    );
  }
}
