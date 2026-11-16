import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { SESSION_COOKIE_NAME, signSessionToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    let body: { identity?: string; password?: string; tab?: string; rememberMe?: boolean };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Geçersiz JSON istek gövdesi." },
        { status: 400 }
      );
    }
    const { identity, password, tab, rememberMe } = body;

    if (!identity || !password) {
      return NextResponse.json(
        { success: false, error: "Kimlik ve şifre alanları zorunludur." },
        { status: 400 }
      );
    }

    const cleanIdentity = String(identity).trim().replace(/[,()]/g, "");
    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, tc_no, password_hash, full_name, role, title, member_no, phone, avatar_url")
      .or(`email.eq.${cleanIdentity},tc_no.eq.${cleanIdentity},member_no.eq.${cleanIdentity}`)
      .maybeSingle();

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: "Girilen kimlik bilgisiyle eşleşen kullanıcı bulunamadı." },
        { status: 401 }
      );
    }

    if (user.password_hash !== password) {
      return NextResponse.json(
        { success: false, error: "Girdiğiniz şifre hatalı. Lütfen tekrar deneyiniz." },
        { status: 401 }
      );
    }

    if (tab === "admin" && user.role !== "admin" && user.role !== "editor") {
      return NextResponse.json(
        { success: false, error: "Bu hesap yönetim kuruluna veya editör masasına yetkili değildir." },
        { status: 403 }
      );
    }

    const safeUser = {
      id: user.id,
      email: user.email,
      tc_no: user.tc_no,
      full_name: user.full_name,
      role: user.role,
      title: user.title,
      member_no: user.member_no,
      phone: user.phone,
      avatar_url: user.avatar_url,
    };

    const memberQuery = encodeURIComponent(user.member_no || user.email || user.tc_no || "");
    const ttlSeconds = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24;
    const token = await signSessionToken(
      {
        id: String(user.id),
        email: user.email,
        role: user.role,
        full_name: user.full_name || user.email,
        member_no: user.member_no ?? null,
      },
      ttlSeconds
    );

    const response = NextResponse.json({
      success: true,
      user: safeUser,
      redirectUrl:
        user.role === "admin" || user.role === "editor"
          ? "/admin"
          : `/uye-paneli?q=${memberQuery}`,
    });

    const isHttps =
      req.nextUrl.protocol === "https:" ||
      req.headers.get("x-forwarded-proto") === "https";

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: ttlSeconds,
      secure: isHttps,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bilinmeyen hata";
    return NextResponse.json(
      { success: false, error: "Sunucu hatası oluştu: " + message },
      { status: 500 }
    );
  }
}
