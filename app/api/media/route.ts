import { NextResponse } from "next/server";
import { getSessionFromRequest, isAdminRole, requireAdmin } from "@/lib/auth";
import { parsePositiveId } from "@/lib/constants";
import { recordAuditLog } from "@/lib/audit";
import { supabaseServer } from "@/lib/supabase-server";
import type { TablesUpdate } from "@/types/database.types";

function extractStoragePath(fileUrl: string, bucket: string): string | null {
  try {
    const marker = `/storage/v1/object/public/${bucket}/`;
    const idx = fileUrl.indexOf(marker);
    if (idx === -1) return null;
    const raw = fileUrl.slice(idx + marker.length).split("?")[0];
    return decodeURIComponent(raw);
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const session = await getSessionFromRequest(request);
  const isAdmin = isAdminRole(session?.role);

  let query = supabaseServer
    .from("media_assets")
    .select("*")
    .order("created_at", { ascending: false });

  if (!isAdmin) {
    query = query.eq("is_live", true);
  }

  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    assets: data || [],
    data: data || [],
  });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if ("response" in auth) return auth.response;

  try {
    const body = (await request.json()) as {
      file_name?: string;
      title?: string;
      file_url?: string;
      bucket?: string;
      format?: string;
      file_size?: string;
      dimensions?: string;
      aspect_ratio?: string;
      category?: string;
      alt_text?: string;
      usage_locations?: string[];
      is_live?: boolean;
    };

    if (!body.file_url || !body.file_name) {
      return NextResponse.json(
        { error: "Dosya adı ve dosya URL adresi zorunludur." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from("media_assets")
      .insert({
        file_name: body.file_name,
        title: body.title || body.file_name,
        file_url: body.file_url,
        bucket: body.bucket || "media",
        format: body.format || "JPG",
        file_size: body.file_size || "Belirtilmemiş",
        dimensions: body.dimensions || "Harici Kaynak",
        aspect_ratio: body.aspect_ratio || "Özel",
        category: body.category || "Genel",
        alt_text: body.alt_text || body.title || body.file_name,
        usage_locations: body.usage_locations || [],
        is_live: body.is_live ?? true,
        uploaded_by: auth.user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { success: true, asset: data, data },
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
      category?: string;
      alt_text?: string;
      usage_locations?: string[];
      is_live?: boolean;
    };

    const assetId = parsePositiveId(body.id);
    if (!assetId) {
      return NextResponse.json(
        { error: "Geçerli medya ID zorunludur." },
        { status: 400 }
      );
    }

    const updateFields: TablesUpdate<"media_assets"> = {};
    if (body.title !== undefined) updateFields.title = body.title.trim();
    if (body.category !== undefined) {
      updateFields.category = body.category.trim();
    }
    if (body.alt_text !== undefined) updateFields.alt_text = body.alt_text.trim();
    if (body.usage_locations !== undefined) {
      updateFields.usage_locations = body.usage_locations;
    }
    if (body.is_live !== undefined) {
      updateFields.is_live = Boolean(body.is_live);
    }

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json(
        { error: "Güncellenecek alan bulunamadı." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from("media_assets")
      .update(updateFields)
      .eq("id", assetId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, asset: data, data });
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
  const assetId = parsePositiveId(searchParams.get("id"));
  if (!assetId) {
    return NextResponse.json(
      { error: "Geçerli medya ID zorunludur." },
      { status: 400 }
    );
  }

  const { data: asset } = await supabaseServer
    .from("media_assets")
    .select("id, file_name, file_url, bucket")
    .eq("id", assetId)
    .maybeSingle();

  if (asset?.file_url) {
    const bucket = asset.bucket || "media";
    const storagePath = extractStoragePath(asset.file_url, bucket);
    if (storagePath) {
      await supabaseServer.storage.from(bucket).remove([storagePath]);
    }
  }

  const { error } = await supabaseServer
    .from("media_assets")
    .delete()
    .eq("id", assetId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await recordAuditLog({
    actorUserId: auth.user.id,
    actorEmail: auth.user.email,
    actorRole: auth.user.role,
    action: "MEDIA_DELETED",
    target: asset?.file_name || String(assetId),
    details: "Medya varlığı veritabanından ve depolama alanından silindi.",
    status: "warning",
  });

  return NextResponse.json({ success: true });
}
