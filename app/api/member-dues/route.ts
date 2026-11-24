import { NextResponse } from "next/server";
import { isAdminRole, requireAdmin, requireAuth } from "@/lib/auth";
import { parsePositiveId } from "@/lib/constants";
import { recordAuditLog } from "@/lib/audit";
import { supabaseServer } from "@/lib/supabase-server";
import type { TablesUpdate } from "@/types/database.types";

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) return auth.response;

  const { searchParams } = new URL(request.url);
  const requestedUserId = parsePositiveId(searchParams.get("user_id"));
  const status = searchParams.get("status");
  const isAdmin = isAdminRole(auth.user.role);

  let query = supabaseServer
    .from("member_dues")
    .select("*, users(id, full_name, member_no, email)")
    .order("created_at", { ascending: false });

  if (!isAdmin) {
    query = query.eq("user_id", auth.user.id);
  } else if (requestedUserId) {
    query = query.eq("user_id", requestedUserId);
  }

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const [duesRes, membersRes] = await Promise.all([
    query,
    isAdmin
      ? supabaseServer
          .from("users")
          .select("id, full_name, member_no, email, role")
          .order("full_name", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (duesRes.error) {
    return NextResponse.json({ error: duesRes.error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    dues: duesRes.data || [],
    data: duesRes.data || [],
    members: membersRes.data || [],
  });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if ("response" in auth) return auth.response;

  try {
    const body = (await request.json()) as {
      user_id?: number | string;
      period?: string;
      amount?: number;
      status?: string;
      receipt_no?: string | null;
      receipt_url?: string | null;
    };

    const userId = parsePositiveId(body.user_id);
    if (!userId || !body.period || body.amount === undefined) {
      return NextResponse.json(
        { error: "Üye ID, dönem ve tutar zorunludur." },
        { status: 400 }
      );
    }

    const status = body.status === "paid" ? "paid" : "pending";
    const { data, error } = await supabaseServer
      .from("member_dues")
      .insert({
        user_id: userId,
        period: body.period.trim(),
        amount: Number(body.amount),
        status,
        paid_at: status === "paid" ? new Date().toISOString() : null,
        receipt_no: body.receipt_no?.trim() || null,
        receipt_url: body.receipt_url?.trim() || null,
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
      action: "DUES_CREATED",
      target: body.period,
      details: `Üye aidatı oluşturuldu (Tutar: ₺${body.amount}, Durum: ${status})`,
      status: "success",
    });

    return NextResponse.json({ success: true, due: data, data }, { status: 201 });
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
      status?: "paid" | "pending" | "overdue";
      receipt_no?: string | null;
      receipt_url?: string | null;
      amount?: number;
    };

    const dueId = parsePositiveId(body.id);
    if (!dueId) {
      return NextResponse.json(
        { error: "Geçerli aidat ID zorunludur." },
        { status: 400 }
      );
    }

    const updatePayload: TablesUpdate<"member_dues"> = {};
    if (body.status !== undefined) {
      updatePayload.status = body.status;
      updatePayload.paid_at =
        body.status === "paid" ? new Date().toISOString() : null;
    }
    if (body.receipt_no !== undefined) updatePayload.receipt_no = body.receipt_no;
    if (body.receipt_url !== undefined) {
      updatePayload.receipt_url = body.receipt_url;
    }
    if (body.amount !== undefined) updatePayload.amount = Number(body.amount);

    const { data, error } = await supabaseServer
      .from("member_dues")
      .update(updatePayload)
      .eq("id", dueId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await recordAuditLog({
      actorUserId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: "DUES_UPDATED",
      target: data.period,
      details: `Aidat kaydı güncellendi (Durum: ${data.status})`,
      status: "success",
    });

    return NextResponse.json({ success: true, due: data, data });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Geçersiz istek." },
      { status: 400 }
    );
  }
}
