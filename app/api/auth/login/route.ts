import { NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  signSessionToken,
  verifyCaptchaChallenge,
} from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getSystemSettings } from "@/lib/system-settings";
import { recordAuditLog } from "@/lib/audit";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const limit = checkRateLimit(`login:${ip}`, 10, 15 * 60_000);
    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: `Çok fazla başarısız veya ardışık giriş denemesi. Lütfen ${limit.resetInSeconds} saniye sonra tekrar deneyin.`,
        },
        { status: 429 }
      );
    }

    const body = (await request.json()) as {
      email?: string;
      tcNo?: string;
      identity?: string;
      identifier?: string;
      password?: string;
      captchaToken?: string;
      captchaAnswer?: string;
    };

    const identifier = (
      body.identifier ||
      body.identity ||
      body.email ||
      body.tcNo ||
      ""
    ).trim();
    const password = body.password || "";

    if (!identifier) {
      return NextResponse.json(
        { error: "E-posta adresi, Üye No veya T.C. Kimlik Numarası gereklidir." },
        { status: 400 }
      );
    }
    if (!password) {
      return NextResponse.json(
        { error: "Şifre gereklidir." },
        { status: 400 }
      );
    }

    const settings = await getSystemSettings();
    if (settings.require_captcha) {
      const captchaOk = await verifyCaptchaChallenge(
        body.captchaToken,
        body.captchaAnswer
      );
      if (!captchaOk) {
        return NextResponse.json(
          {
            error:
              "Güvenlik doğrulama kodu hatalı veya süresi dolmuş. Lütfen kodu yenileyip tekrar deneyin.",
          },
          { status: 400 }
        );
      }
    }

    let query = supabaseServer
      .from("users")
      .select(
        "id, email, tc_no, password_hash, full_name, role, title, member_no, avatar_url"
      );

    if (identifier.includes("@")) {
      query = query.eq("email", identifier.toLowerCase());
    } else if (/^\d{11}$/.test(identifier)) {
      query = query.eq("tc_no", identifier);
    } else {
      query = query.eq("member_no", identifier.toUpperCase());
    }

    const { data: user, error: queryError } = await query.maybeSingle();

    if (queryError) {
      return NextResponse.json(
        { error: "Veritabanı sorgu hatası oluştu." },
        { status: 500 }
      );
    }

    if (!user) {
      await recordAuditLog({
        actorEmail: identifier,
        actorRole: "anonymous",
        action: "AUTH_LOGIN_FAILED",
        target: "users",
        details: `Kullanıcı bulunamadı (${ip})`,
        status: "warning",
      });
      return NextResponse.json(
        { error: "Girdiğiniz kimlik bilgileri hatalı." },
        { status: 401 }
      );
    }

    const passwordCheck = verifyPassword(password, user.password_hash);
    if (!passwordCheck.valid) {
      await recordAuditLog({
        actorEmail: user.email,
        actorRole: user.role,
        action: "AUTH_LOGIN_FAILED",
        target: "users",
        details: `Hatalı şifre denemesi (${ip})`,
        status: "warning",
      });
      return NextResponse.json(
        { error: "Şifreniz hatalı. Lütfen kontrol edip tekrar deneyin." },
        { status: 401 }
      );
    }

    // Transparently upgrade legacy plaintext passwords to scrypt hashes on login
    if (passwordCheck.needsRehash) {
      const upgradedHash = hashPassword(password);
      await supabaseServer
        .from("users")
        .update({ password_hash: upgradedHash })
        .eq("id", user.id);
    }

    const ttlSeconds = settings.strict_session_timeout
      ? 60 * 60 * 2
      : 60 * 60 * 24;

    const token = await signSessionToken(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        member_no: user.member_no,
      },
      ttlSeconds
    );

    await recordAuditLog({
      actorUserId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: "AUTH_LOGIN_SUCCESS",
      target: "session",
      details: `Başarılı oturum açıldı (Süre: ${ttlSeconds / 3600} saat, IP: ${ip})`,
      status: "success",
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        title: user.title,
        member_no: user.member_no,
        avatar_url: user.avatar_url,
      },
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ttlSeconds,
    });

    return response;
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Oturum açma işlemi sırasında hata oluştu.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
