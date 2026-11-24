import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  escapeLikePattern,
  parsePositiveId,
  SITE_BASE_URL,
} from "@/lib/constants";
import { generateQrDataUrl } from "@/lib/qr";
import { getSystemSettings } from "@/lib/system-settings";
import { recordAuditLog } from "@/lib/audit";
import { supabaseServer } from "@/lib/supabase-server";
import type { TablesUpdate } from "@/types/database.types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const rawCode = (
    searchParams.get("verify_code") ||
    searchParams.get("code") ||
    ""
  ).trim();

  if (rawCode) {
    const settings = await getSystemSettings();
    if (!settings.public_verification_enabled) {
      return NextResponse.json(
        {
          error:
            "Resmi belge doğrulama servisi yönetim tarafından geçici olarak devre dışı bırakılmıştır.",
        },
        { status: 403 }
      );
    }

    const cleanCode = escapeLikePattern(rawCode);
    const { data, error } = await supabaseServer
      .from("documents")
      .select("*")
      .ilike("document_code", cleanCode)
      .limit(5);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        success: true,
        verified: false,
        documents: [],
        data: [],
        message:
          "Girilen belge kodu ile eşleşen resmi AHİD kaydı bulunamadı.",
      });
    }

    const doc = data[0];
    const qrUrl = `${SITE_BASE_URL}/kaynaklar?kod=${encodeURIComponent(
      doc.document_code || rawCode
    )}`;
    const qrDataUrl = await generateQrDataUrl(qrUrl);

    return NextResponse.json({
      success: true,
      verified: true,
      documents: data,
      data,
      document: doc,
      qrDataUrl,
    });
  }

  let query = supabaseServer
    .from("documents")
    .select("*")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    documents: data || [],
    data: data || [],
  });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if ("response" in auth) return auth.response;

  try {
    const body = (await request.json()) as {
      title?: string;
      subtitle?: string | null;
      description?: string | null;
      category?: string;
      document_code?: string | null;
      file_url?: string | null;
      file_format?: string | null;
      file_size?: string | null;
      revision_date?: string | null;
      authority?: string | null;
      signature_status?: string | null;
      is_featured?: boolean;
    };

    if (!body.title?.trim()) {
      return NextResponse.json(
        { error: "Belge başlığı zorunludur." },
        { status: 400 }
      );
    }

    const docCode =
      body.document_code?.trim().toUpperCase() ||
      `AHID-BEL-${new Date().getFullYear()}-${Math.floor(
        100 + Math.random() * 900
      )}`;

    const { data, error } = await supabaseServer
      .from("documents")
      .insert({
        title: body.title.trim(),
        subtitle: body.subtitle?.trim() || null,
        description: body.description?.trim() || null,
        category: (body.category || "genel").trim(),
        document_code: docCode,
        file_url: body.file_url?.trim() || null,
        file_format: (body.file_format || "PDF").trim(),
        file_size: body.file_size?.trim() || "PDF",
        revision_date:
          body.revision_date?.trim() || new Date().toISOString().split("T")[0],
        authority: body.authority?.trim() || "AHİD Yönetim Kurulu",
        signature_status:
          body.signature_status?.trim() || "Yönetim Kurulu Onaylı",
        is_featured: Boolean(body.is_featured),
        uploaded_by: auth.user.id,
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
      action: "DOCUMENT_CREATED",
      target: docCode,
      details: `Resmi doküman arşivlendi: ${data.title}`,
      status: "success",
    });

    return NextResponse.json(
      { success: true, document: data, data },
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
      subtitle?: string | null;
      description?: string | null;
      category?: string;
      document_code?: string | null;
      file_url?: string | null;
      file_format?: string | null;
      file_size?: string | null;
      revision_date?: string | null;
      authority?: string | null;
      signature_status?: string | null;
      is_featured?: boolean;
    };

    const docId = parsePositiveId(body.id);
    if (!docId) {
      return NextResponse.json(
        { error: "Geçerli belge ID zorunludur." },
        { status: 400 }
      );
    }

    const updatePayload: TablesUpdate<"documents"> = {};
    if (body.title !== undefined) updatePayload.title = body.title.trim();
    if (body.subtitle !== undefined) updatePayload.subtitle = body.subtitle;
    if (body.description !== undefined) {
      updatePayload.description = body.description;
    }
    if (body.category !== undefined) {
      updatePayload.category = body.category.trim();
    }
    if (body.document_code !== undefined) {
      updatePayload.document_code =
        body.document_code?.trim().toUpperCase() || null;
    }
    if (body.file_url !== undefined) updatePayload.file_url = body.file_url;
    if (body.file_format !== undefined && body.file_format !== null) {
      updatePayload.file_format = body.file_format;
    }
    if (body.file_size !== undefined) updatePayload.file_size = body.file_size;
    if (body.revision_date !== undefined) {
      updatePayload.revision_date = body.revision_date;
    }
    if (body.authority !== undefined) updatePayload.authority = body.authority;
    if (body.signature_status !== undefined) {
      updatePayload.signature_status = body.signature_status;
    }
    if (body.is_featured !== undefined) {
      updatePayload.is_featured = Boolean(body.is_featured);
    }

    const { data, error } = await supabaseServer
      .from("documents")
      .update(updatePayload)
      .eq("id", docId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await recordAuditLog({
      actorUserId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "DOCUMENT_UPDATED",
      target: data.document_code || data.title,
      details: "Resmi belge kaydı güncellendi.",
      status: "success",
    });

    return NextResponse.json({ success: true, document: data, data });
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
  const docId = parsePositiveId(searchParams.get("id"));
  if (!docId) {
    return NextResponse.json(
      { error: "Geçerli belge ID zorunludur." },
      { status: 400 }
    );
  }

  const { error } = await supabaseServer
    .from("documents")
    .delete()
    .eq("id", docId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await recordAuditLog({
    actorUserId: auth.user.id,
    actorEmail: auth.user.email,
    actorRole: auth.user.role,
    action: "DOCUMENT_DELETED",
    target: String(docId),
    details: "Resmi belge kaydı silindi.",
    status: "warning",
  });

  return NextResponse.json({ success: true });
}
