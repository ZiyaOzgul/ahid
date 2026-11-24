import { NextResponse } from "next/server";
import { isAdminRole, requireAuth } from "@/lib/auth";
import { parsePositiveId, SITE_BASE_URL } from "@/lib/constants";
import { hashPassword } from "@/lib/password";
import { generateQrDataUrl } from "@/lib/qr";
import { recordAuditLog } from "@/lib/audit";
import { supabaseServer } from "@/lib/supabase-server";
import type { TablesUpdate } from "@/types/database.types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const verifyMemberNo = (searchParams.get("verify_member_no") || "").trim();

  // Minimal public card authenticity verification (no PII leaked)
  if (verifyMemberNo) {
    const { data: verifiedUser } = await supabaseServer
      .from("users")
      .select("full_name, member_no, title, role")
      .eq("member_no", verifyMemberNo.toUpperCase())
      .maybeSingle();

    if (!verifiedUser) {
      return NextResponse.json({
        success: true,
        verified: false,
        message: "Bu üye numarasına ait aktif kayıt bulunamadı.",
      });
    }

    return NextResponse.json({
      success: true,
      verified: true,
      member_no: verifiedUser.member_no,
      full_name: verifiedUser.full_name,
      title: verifiedUser.title || "Dernek Üyesi",
      status: "Aktif AHİD Üyesi",
    });
  }

  // Strictly require authenticated session for private portal data (KVKK protection)
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  const requestedUserId = parsePositiveId(searchParams.get("user_id"));
  const isAdmin = isAdminRole(auth.user.role);
  const targetUserId =
    isAdmin && requestedUserId ? requestedUserId : auth.user.id;

  const { data: user, error: userError } = await supabaseServer
    .from("users")
    .select(
      "id, full_name, email, role, title, member_no, phone, avatar_url, created_at"
    )
    .eq("id", targetUserId)
    .maybeSingle();

  if (userError || !user) {
    return NextResponse.json(
      { error: "Üye profili bulunamadı." },
      { status: 404 }
    );
  }

  const [duesRes, regsRes, memberNewsRes, appRes] = await Promise.all([
    supabaseServer
      .from("member_dues")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabaseServer
      .from("event_registrations")
      .select("*, events(*)")
      .or(`user_id.eq.${user.id},email.eq.${user.email}`)
      .order("created_at", { ascending: false }),
    supabaseServer
      .from("news_announcements")
      .select(
        "id, title, slug, category, summary, published_at, is_member_only, read_time"
      )
      .eq("is_member_only", true)
      .order("published_at", { ascending: false })
      .limit(10),
    supabaseServer
      .from("membership_applications")
      .select("*")
      .or(`user_id.eq.${user.id},email.eq.${user.email}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const verifyTarget = user.member_no || String(user.id);
  const verificationUrl = `${SITE_BASE_URL}/uye-paneli?dogrula=${encodeURIComponent(
    verifyTarget
  )}`;
  const qrDataUrl = await generateQrDataUrl(verificationUrl);

  return NextResponse.json({
    success: true,
    member: user,
    user,
    application: appRes.data || null,
    dues: duesRes.data || [],
    registrations: regsRes.data || [],
    notices: memberNewsRes.data || [],
    memberAnnouncements: memberNewsRes.data || [],
    qrDataUrl,
    verificationUrl,
  });
}

export async function PATCH(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  try {
    const body = (await request.json()) as {
      user_id?: number | string;
      id?: number | string;
      full_name?: string;
      phone?: string | null;
      title?: string | null;
      avatar_url?: string | null;
      password?: string;
    };

    const isAdmin = isAdminRole(auth.user.role);
    const requestedId = parsePositiveId(body.user_id ?? body.id);
    const targetId = isAdmin && requestedId ? requestedId : auth.user.id;

    if (targetId !== auth.user.id && !isAdmin) {
      return NextResponse.json(
        { error: "Başka bir üyenin profilini güncelleyemezsiniz." },
        { status: 403 }
      );
    }

    const updatePayload: TablesUpdate<"users"> = {};
    if (body.full_name !== undefined && body.full_name.trim()) {
      updatePayload.full_name = body.full_name.trim();
    }
    if (body.phone !== undefined) {
      updatePayload.phone = body.phone ? body.phone.trim() : null;
    }
    if (body.title !== undefined) {
      updatePayload.title = body.title ? body.title.trim() : null;
    }
    if (body.avatar_url !== undefined) {
      updatePayload.avatar_url = body.avatar_url ? body.avatar_url.trim() : null;
    }
    if (body.password && body.password.trim()) {
      if (body.password.trim().length < 8) {
        return NextResponse.json(
          { error: "Yeni şifreniz en az 8 karakter olmalıdır." },
          { status: 400 }
        );
      }
      updatePayload.password_hash = hashPassword(body.password.trim());
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { error: "Güncellenecek alan belirtilmedi." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from("users")
      .update(updatePayload)
      .eq("id", targetId)
      .select(
        "id, full_name, email, role, title, member_no, phone, avatar_url, created_at"
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await recordAuditLog({
      actorUserId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "MEMBER_PROFILE_UPDATED",
      target: data.email,
      details: "Üye profil/şifre bilgileri güncellendi.",
      status: "success",
    });

    return NextResponse.json({ success: true, member: data, user: data });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Geçersiz istek." },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  try {
    const body = (await request.json()) as {
      action?: string;
      dues_id?: number | string;
      receipt_no?: string;
      receipt_url?: string;
    };

    if (body.action === "submit_receipt") {
      const duesId = parsePositiveId(body.dues_id);
      if (!duesId || !body.receipt_no?.trim()) {
        return NextResponse.json(
          { error: "Aidat dönemi ve dekont/referans numarası zorunludur." },
          { status: 400 }
        );
      }

      const { data: dueRow } = await supabaseServer
        .from("member_dues")
        .select("*")
        .eq("id", duesId)
        .maybeSingle();

      if (!dueRow) {
        return NextResponse.json(
          { error: "Aidat kaydı bulunamadı." },
          { status: 404 }
        );
      }

      if (dueRow.user_id !== auth.user.id && !isAdminRole(auth.user.role)) {
        return NextResponse.json(
          { error: "Bu aidat kaydına işlem yapma yetkiniz yok." },
          { status: 403 }
        );
      }

      const { data, error } = await supabaseServer
        .from("member_dues")
        .update({
          receipt_no: body.receipt_no.trim(),
          receipt_url: body.receipt_url?.trim() || dueRow.receipt_url,
        })
        .eq("id", duesId)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        due: data,
        message:
          "Havale/EFT dekont bilginiz Saymanlık incelemesine iletildi.",
      });
    }

    return NextResponse.json({ error: "Bilinmeyen işlem." }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Geçersiz istek." },
      { status: 400 }
    );
  }
}
