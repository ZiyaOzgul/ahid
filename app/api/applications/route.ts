import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let query = supabase
      .from("membership_applications")
      .select("*")
      .order("id", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json(
        { success: false, error: error.message, applications: [], total: 0 },
        { status: 500 }
      );
    }

    const rows = data || [];
    return NextResponse.json({
      success: true,
      applications: rows,
      total: rows.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message, applications: [], total: 0 },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const applicationNo = `AHID-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;

    const applicationData = {
      application_no: applicationNo,
      tier: body.tier || "asil",
      first_name: body.first_name || "İsimsiz",
      last_name: body.last_name || "Başvuru",
      tc_no: body.tc_no || "00000000000",
      email: body.email || "",
      phone: body.phone || "",
      birth_date: body.birth_date || "",
      city: body.city || "Ankara",
      organization: body.organization || "",
      position: body.position || "",
      university: body.university || "",
      graduation_year: body.graduation_year || "",
      degree: body.degree || "Lisans",
      experience_years: body.experience_years || "",
      linkedin_url: body.linkedin_url || "",
      cv_url: body.cv_url || null,
      status: "pending",
      admin_notes: "Yeni başvuru alındı (Supabase)",
    };

    const { error } = await supabase
      .from("membership_applications")
      .insert(applicationData);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      application_no: applicationNo,
      message: "Üyelik başvurunuz başarıyla kaydedilmiştir. Sicil Kurulu incelemesi başlatıldı.",
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
        { success: false, error: "Başvuru ID belirtilmelidir." },
        { status: 400 }
      );
    }

    const updates: any = {};
    if (status) updates.status = status;
    if (admin_notes !== undefined) updates.admin_notes = admin_notes;

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from("membership_applications")
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
      message: "Başvuru durumu güncellendi.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
