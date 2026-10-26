import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    let query = supabase
      .from("contact_messages")
      .select("*")
      .order("id", { ascending: false });

    if (type) {
      query = query.eq("type", type);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json(
        { success: false, error: error.message, messages: [], total: 0 },
        { status: 500 }
      );
    }

    const rows = data || [];
    return NextResponse.json({
      success: true,
      messages: rows,
      total: rows.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message, messages: [], total: 0 },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, department, subject, message, type } = body;

    if (!message || (!name && !email)) {
      return NextResponse.json(
        { success: false, error: "Mesaj, isim veya e-posta alanı boş bırakılamaz." },
        { status: 400 }
      );
    }

    const payload = {
      type: type || "contact_form",
      name: name || "İsimsiz Ziyaretçi",
      email: email || "",
      phone: phone || "",
      department: department || "Genel Sekreterlik",
      subject: subject || "İletişim / Bilgi Talebi",
      message,
      status: "unread",
    };

    const { error } = await supabase.from("contact_messages").insert(payload);
    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Mesajınız AHİD Genel Evrak ve İletişim Masasına başarıyla iletilmiştir.",
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
    const { id, status, admin_notes } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Mesaj ID belirtilmelidir." },
        { status: 400 }
      );
    }

    const updates: any = {};
    if (status) updates.status = status;
    if (admin_notes !== undefined) updates.admin_notes = admin_notes;

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from("contact_messages")
        .update(updates)
        .eq("id", id);

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Talep durumu güncellendi.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
