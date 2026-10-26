import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const [
      cmsRes,
      usersCountRes,
      approvedAppsCountRes,
      eventsCountRes,
      boardCountRes,
      docsCountRes,
    ] = await Promise.all([
      supabase
        .from("cms_variables")
        .select("*")
        .order("page", { ascending: true })
        .order("id", { ascending: true }),
      supabase.from("users").select("id", { count: "exact", head: true }),
      supabase
        .from("membership_applications")
        .select("id", { count: "exact", head: true })
        .eq("status", "approved"),
      supabase.from("events").select("id", { count: "exact", head: true }),
      supabase.from("board_members").select("id", { count: "exact", head: true }),
      supabase.from("documents").select("id", { count: "exact", head: true }),
    ]);

    if (cmsRes.error) {
      return NextResponse.json(
        { success: false, error: cmsRes.error.message, variables: {}, raw: [] },
        { status: 500 }
      );
    }

    const rows = cmsRes.data || [];
    const variablesMap: Record<string, string> = {};
    for (const row of rows) {
      variablesMap[row.key] = row.value;
    }

    const currentYear = new Date().getFullYear();
    const yearsSince1990 = Math.max(1, currentYear - 1990);
    const liveMembersCount =
      (usersCountRes.count ?? 0) + (approvedAppsCountRes.count ?? 0);
    const liveEventsCount = eventsCountRes.count ?? 0;
    const livePartnersCount =
      (boardCountRes.count ?? 0) + (docsCountRes.count ?? 0);

    return NextResponse.json({
      success: true,
      variables: variablesMap,
      liveStats: {
        members: liveMembersCount,
        years: yearsSince1990,
        events: liveEventsCount,
        partners: livePartnersCount,
      },
      raw: rows,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message, variables: {}, raw: [] },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const payload: Record<string, any> | undefined =
      body.updates || body.variables;

    if (!payload || typeof payload !== "object") {
      return NextResponse.json(
        { success: false, error: "Geçersiz güncelleme verisi." },
        { status: 400 }
      );
    }

    const targetPage = body.page || "home";

    for (const [key, value] of Object.entries(payload)) {
      await supabase.from("cms_variables").upsert(
        {
          key,
          value: String(value ?? ""),
          page: targetPage,
          section: "cms",
          description: key,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      );
    }

    return NextResponse.json({
      success: true,
      message: "CMS değişkenleri başarıyla güncellendi ve yayına alındı.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
