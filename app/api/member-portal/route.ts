import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryIdentifier = searchParams.get("identifier")?.trim();
    const userId = searchParams.get("user_id");

    let member: any = null;
    let application: any = null;
    let dues: any[] = [];
    let registrations: any[] = [];

    if (userId) {
      const { data } = await supabase
        .from("users")
        .select("id, email, full_name, role, member_no, tc_no, phone, title, avatar_url, created_at")
        .eq("id", Number(userId))
        .maybeSingle();
      member = data;
    } else if (queryIdentifier) {
      const { data } = await supabase
        .from("users")
        .select("id, email, full_name, role, member_no, tc_no, phone, title, avatar_url, created_at")
        .or(
          `email.eq.${queryIdentifier},member_no.eq.${queryIdentifier},tc_no.eq.${queryIdentifier}`
        )
        .maybeSingle();
      member = data;

      if (!member) {
        const { data: appData } = await supabase
          .from("membership_applications")
          .select("*")
          .or(
            `email.eq.${queryIdentifier},application_no.eq.${queryIdentifier},tc_no.eq.${queryIdentifier}`
          )
          .order("id", { ascending: false })
          .limit(1)
          .maybeSingle();
        application = appData;
      }
    }

    if (member) {
      const [duesRes, regRes] = await Promise.all([
        supabase
          .from("member_dues")
          .select("*")
          .eq("user_id", member.id)
          .order("id", { ascending: false }),
        supabase
          .from("event_registrations")
          .select("*, events(id, title, event_date, event_time, location, category)")
          .or(`user_id.eq.${member.id},email.eq.${member.email}`)
          .order("id", { ascending: false }),
      ]);
      dues = duesRes.data || [];
      registrations = regRes.data || [];
    } else if (application) {
      const { data: regData } = await supabase
        .from("event_registrations")
        .select("*, events(id, title, event_date, event_time, location, category)")
        .eq("email", application.email)
        .order("id", { ascending: false });
      registrations = regData || [];
    }

    const [noticesRes, eventsRes] = await Promise.all([
      supabase
        .from("news_announcements")
        .select("*")
        .order("id", { ascending: false })
        .limit(5),
      supabase
        .from("events")
        .select("*")
        .order("id", { ascending: false })
        .limit(4),
    ]);

    return NextResponse.json({
      success: true,
      member,
      application,
      dues,
      registrations,
      notices: noticesRes.data || [],
      upcomingEvents: eventsRes.data || [],
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
    const { id, full_name, title, phone, email } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Üye ID belirtilmelidir." },
        { status: 400 }
      );
    }

    const updates: {
      full_name?: string;
      title?: string | null;
      phone?: string | null;
      email?: string;
    } = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (title !== undefined) updates.title = title;
    if (phone !== undefined) updates.phone = phone;
    if (email !== undefined) updates.email = email;

    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", Number(id))
      .select("id, email, full_name, role, member_no, tc_no, phone, title, avatar_url, created_at")
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      member: data,
      message: "Üye bilgileriniz DERBİS ve portal siciline kaydedildi.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
