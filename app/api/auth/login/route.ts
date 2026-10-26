import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identity, password, tab } = body;

    if (!identity || !password) {
      return NextResponse.json(
        { success: false, error: "Kimlik ve şifre alanları zorunludur." },
        { status: 400 }
      );
    }

    const cleanIdentity = identity.trim();
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

    const { password_hash, ...safeUser } = user;

    const memberQuery = encodeURIComponent(user.member_no || user.email || user.tc_no || "");

    return NextResponse.json({
      success: true,
      user: safeUser,
      redirectUrl:
        user.role === "admin" || user.role === "editor"
          ? "/admin"
          : `/uye-paneli?q=${memberQuery}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Sunucu hatası oluştu: " + error.message },
      { status: 500 }
    );
  }
}
