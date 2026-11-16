import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("response" in auth) return auth.response;

  try {
    const [duesRes, usersRes] = await Promise.all([
      supabase
        .from("member_dues")
        .select("*, users(id, full_name, email, member_no, role)")
        .order("id", { ascending: false }),
      supabase
        .from("users")
        .select("id, full_name, email, member_no, role")
        .order("id", { ascending: true }),
    ]);

    if (duesRes.error) {
      return NextResponse.json(
        { success: false, error: duesRes.error.message, dues: [], members: [] },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      dues: duesRes.data || [],
      members: usersRes.data || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message, dues: [], members: [] },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("response" in auth) return auth.response;

  try {
    const body = await req.json();
    const { user_id, period, amount, status, receipt_no } = body;

    if (!user_id || !period || amount === undefined) {
      return NextResponse.json(
        { success: false, error: "Üye seçimi, dönem ve tutar zorunludur." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("member_dues")
      .insert({
        user_id: Number(user_id),
        period: String(period).trim(),
        amount: Number(amount),
        status: status || "pending",
        receipt_no:
          receipt_no ||
          (status === "paid"
            ? `AHID-MKB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
            : null),
      })
      .select("*, users(id, full_name, email, member_no, role)")
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      due: data,
      message: "Aidat tahakkuk/makbuz kaydı eklendi.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("response" in auth) return auth.response;

  try {
    const body = await req.json();
    const { id, status, receipt_no } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: "Kayıt ID ve durum zorunludur." },
        { status: 400 }
      );
    }

    const updates: { status: string; receipt_no?: string } = { status };
    if (receipt_no !== undefined) {
      updates.receipt_no = receipt_no;
    } else if (status === "paid") {
      updates.receipt_no = `AHID-MKB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const { data, error } = await supabase
      .from("member_dues")
      .update(updates)
      .eq("id", Number(id))
      .select("*, users(id, full_name, email, member_no, role)")
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      due: data,
      message: "Aidat durumu güncellendi.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
