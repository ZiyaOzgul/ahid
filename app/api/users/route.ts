import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { data: users, error } = await supabase
      .from("users")
      .select("id, email, full_name, role, created_at")
      .order("id", { ascending: true });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message, users: [] },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      users: users || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message, users: [] },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, full_name, role } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "E-posta ve şifre zorunludur." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("users")
      .insert({
        email: email.trim().toLowerCase(),
        password_hash: password,
        full_name: full_name || email.split("@")[0],
        role: role || "editor",
      })
      .select("id, email, full_name, role, created_at")
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: data,
      message: "Kullanıcı başarıyla oluşturuldu.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, role, full_name, password } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Kullanıcı ID zorunludur." },
        { status: 400 }
      );
    }

    const updates: any = {};
    if (role) updates.role = role;
    if (full_name !== undefined) updates.full_name = full_name;
    if (password) updates.password_hash = password;

    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", id)
      .select("id, email, full_name, role, created_at")
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: data,
      message: "Kullanıcı yetkisi güncellendi.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Kullanıcı ID zorunludur." },
        { status: 400 }
      );
    }

    // Do not allow deleting superadmin (id 1 or 3)
    if (Number(id) === 1 || Number(id) === 3) {
      return NextResponse.json(
        { success: false, error: "Ana yönetici hesabı silinemez." },
        { status: 403 }
      );
    }

    const { error } = await supabase.from("users").delete().eq("id", Number(id));

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Kullanıcı başarıyla silindi.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
