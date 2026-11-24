import { NextResponse } from "next/server";
import { requireAdmin, requireSuperAdmin, isSuperAdminRole } from "@/lib/auth";
import { parsePositiveId } from "@/lib/constants";
import { hashPassword, generateTemporaryPassword } from "@/lib/password";
import { recordAuditLog } from "@/lib/audit";
import { supabaseServer } from "@/lib/supabase-server";
import type { TablesUpdate } from "@/types/database.types";

const ALLOWED_ROLES = new Set(["admin", "editor", "member"]);

function maskTcNo(tc?: string | null): string | null {
  if (!tc) return null;
  if (tc.length < 4) return "****";
  return `${"*".repeat(Math.max(0, tc.length - 4))}${tc.slice(-4)}`;
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("response" in auth) return auth.response;

  const { data, error } = await supabaseServer
    .from("users")
    .select(
      "id, full_name, email, tc_no, role, title, member_no, phone, avatar_url, created_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const canSeeFullTc = isSuperAdminRole(auth.user.role);
  const safeData = (data || []).map((u) => ({
    ...u,
    tc_no: canSeeFullTc ? u.tc_no : maskTcNo(u.tc_no),
  }));

  return NextResponse.json({
    success: true,
    users: safeData,
    data: safeData,
  });
}

export async function POST(request: Request) {
  const auth = await requireSuperAdmin(request);
  if ("response" in auth) return auth.response;

  try {
    const body = (await request.json()) as {
      full_name?: string;
      email?: string;
      tc_no?: string;
      password?: string;
      role?: string;
      title?: string;
      member_no?: string;
      phone?: string;
      avatar_url?: string;
    };

    const fullName = (body.full_name || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const role = (body.role || "member").trim().toLowerCase();

    if (!fullName || !email) {
      return NextResponse.json(
        { error: "Ad soyad ve e-posta adresi zorunludur." },
        { status: 400 }
      );
    }

    if (!ALLOWED_ROLES.has(role)) {
      return NextResponse.json(
        { error: "Geçersiz kullanıcı rolü." },
        { status: 400 }
      );
    }

    const rawPassword = (body.password || "").trim();
    if (rawPassword && rawPassword.length < 8) {
      return NextResponse.json(
        { error: "Şifre en az 8 karakter olmalıdır." },
        { status: 400 }
      );
    }

    const tempPassword = rawPassword ? null : generateTemporaryPassword(12);
    const passwordHash = hashPassword(rawPassword || tempPassword || "");
    const memberNo =
      (body.member_no || "").trim().toUpperCase() ||
      `AHID-${new Date().getFullYear()}-${Math.floor(
        1000 + Math.random() * 9000
      )}`;

    const { data, error } = await supabaseServer
      .from("users")
      .insert({
        full_name: fullName,
        email,
        tc_no: body.tc_no?.trim() || null,
        password_hash: passwordHash,
        role,
        title:
          body.title?.trim() || (role === "member" ? "Dernek Üyesi" : "Yönetici"),
        member_no: memberNo,
        phone: body.phone?.trim() || null,
        avatar_url: body.avatar_url?.trim() || null,
      })
      .select(
        "id, full_name, email, tc_no, role, title, member_no, phone, avatar_url, created_at"
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await recordAuditLog({
      actorUserId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "USER_CREATED",
      target: email,
      details: `Yeni kullanıcı oluşturuldu (Rol: ${role}, Üye No: ${memberNo})`,
      status: "success",
    });

    return NextResponse.json(
      {
        success: true,
        user: data,
        data,
        ...(tempPassword ? { temporary_password: tempPassword } : {}),
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Geçersiz istek gövdesi." },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await requireSuperAdmin(request);
  if ("response" in auth) return auth.response;

  try {
    const body = (await request.json()) as {
      id?: number | string;
      full_name?: string;
      email?: string;
      tc_no?: string | null;
      password?: string;
      role?: string;
      title?: string | null;
      member_no?: string | null;
      phone?: string | null;
      avatar_url?: string | null;
    };

    const userId = parsePositiveId(body.id);
    if (!userId) {
      return NextResponse.json(
        { error: "Geçerli kullanıcı ID zorunludur." },
        { status: 400 }
      );
    }

    const updatePayload: TablesUpdate<"users"> = {};

    if (body.full_name !== undefined) {
      updatePayload.full_name = body.full_name.trim();
    }
    if (body.email !== undefined) {
      updatePayload.email = body.email.trim().toLowerCase();
    }
    if (body.tc_no !== undefined) {
      updatePayload.tc_no = body.tc_no ? body.tc_no.trim() : null;
    }
    if (body.title !== undefined) {
      updatePayload.title = body.title ? body.title.trim() : null;
    }
    if (body.member_no !== undefined) {
      updatePayload.member_no = body.member_no
        ? body.member_no.trim().toUpperCase()
        : null;
    }
    if (body.phone !== undefined) {
      updatePayload.phone = body.phone ? body.phone.trim() : null;
    }
    if (body.avatar_url !== undefined) {
      updatePayload.avatar_url = body.avatar_url ? body.avatar_url.trim() : null;
    }

    if (body.role !== undefined) {
      const nextRole = body.role.trim().toLowerCase();
      if (!ALLOWED_ROLES.has(nextRole)) {
        return NextResponse.json({ error: "Geçersiz rol." }, { status: 400 });
      }
      if (userId === auth.user.id && nextRole !== "admin") {
        return NextResponse.json(
          { error: "Kendi Süper Yönetici rolünüzü düşüremezsiniz." },
          { status: 400 }
        );
      }
      updatePayload.role = nextRole;
    }

    if (body.password && body.password.trim()) {
      if (body.password.trim().length < 8) {
        return NextResponse.json(
          { error: "Yeni şifre en az 8 karakter olmalıdır." },
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
      .eq("id", userId)
      .select(
        "id, full_name, email, tc_no, role, title, member_no, phone, avatar_url, created_at"
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await recordAuditLog({
      actorUserId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "USER_UPDATED",
      target: data.email,
      details: `Kullanıcı güncellendi (${Object.keys(updatePayload).join(", ")})`,
      status: "success",
    });

    return NextResponse.json({ success: true, user: data, data });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Geçersiz istek." },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  const auth = await requireSuperAdmin(request);
  if ("response" in auth) return auth.response;

  const { searchParams } = new URL(request.url);
  const userId = parsePositiveId(searchParams.get("id"));
  if (!userId) {
    return NextResponse.json(
      { error: "Geçerli kullanıcı ID zorunludur." },
      { status: 400 }
    );
  }

  if (userId === auth.user.id) {
    return NextResponse.json(
      { error: "Kendi aktif yönetici hesabınızı silemezsiniz." },
      { status: 400 }
    );
  }

  const { error } = await supabaseServer.from("users").delete().eq("id", userId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await recordAuditLog({
    actorUserId: auth.user.id,
    actorEmail: auth.user.email,
    actorRole: auth.user.role,
    action: "USER_DELETED",
    target: String(userId),
    details: "Kullanıcı hesabı silindi.",
    status: "warning",
  });

  return NextResponse.json({ success: true });
}
