import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  getSystemSettings,
  invalidateSystemSettingsCache,
} from "@/lib/system-settings";
import { recordAuditLog } from "@/lib/audit";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page");

  let query = supabaseServer
    .from("cms_variables")
    .select("*")
    .neq("page", "system_audit");

  if (page && page !== "system_audit") {
    query = query.eq("page", page);
  }

  const [
    cmsRes,
    usersCountRes,
    approvedAppsCountRes,
    pendingAppsCountRes,
    eventsCountRes,
    newsCountRes,
    articlesCountRes,
    docsCountRes,
    boardCountRes,
    newsletterCountRes,
    unreadMessagesCountRes,
    systemSettings,
  ] = await Promise.all([
    query,
    supabaseServer.from("users").select("id", { count: "exact", head: true }),
    supabaseServer
      .from("membership_applications")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved"),
    supabaseServer
      .from("membership_applications")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabaseServer.from("events").select("id", { count: "exact", head: true }),
    supabaseServer
      .from("news_announcements")
      .select("id", { count: "exact", head: true }),
    supabaseServer.from("articles").select("id", { count: "exact", head: true }),
    supabaseServer.from("documents").select("id", { count: "exact", head: true }),
    supabaseServer
      .from("board_members")
      .select("id", { count: "exact", head: true }),
    supabaseServer
      .from("newsletter_subscribers")
      .select("id", { count: "exact", head: true }),
    supabaseServer
      .from("contact_messages")
      .select("id", { count: "exact", head: true })
      .eq("status", "new"),
    getSystemSettings(),
  ]);

  if (cmsRes.error) {
    return NextResponse.json({ error: cmsRes.error.message }, { status: 500 });
  }

  const usersCount = usersCountRes.count || 0;
  const approvedAppsCount = approvedAppsCountRes.count || 0;
  const rows = cmsRes.data || [];
  const variables: Record<string, string> = {};
  for (const row of rows) {
    variables[row.key] = row.value;
  }

  return NextResponse.json({
    success: true,
    variables,
    rawRows: rows,
    data: rows,
    settings: systemSettings,
    liveStats: {
      members: usersCount,
      users: usersCount,
      approvedApplications: approvedAppsCount,
      pendingApplications: pendingAppsCountRes.count || 0,
      events: eventsCountRes.count || 0,
      news: newsCountRes.count || 0,
      articles: articlesCountRes.count || 0,
      documents: docsCountRes.count || 0,
      boardMembers: boardCountRes.count || 0,
      partners: boardCountRes.count || 0,
      subscribers: newsletterCountRes.count || 0,
      unreadMessages: unreadMessagesCountRes.count || 0,
    },
  });
}

interface CmsVarInput {
  page: string;
  section?: string;
  key: string;
  value: string;
  description?: string;
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if ("response" in auth) return auth.response;

  try {
    const body = (await request.json()) as
      | CmsVarInput
      | {
          page?: string;
          section?: string;
          variables?: CmsVarInput[] | Record<string, string>;
          updates?: Record<string, string>;
        };

    let items: CmsVarInput[] = [];
    if ("variables" in body && Array.isArray(body.variables)) {
      items = body.variables;
    } else if (
      "variables" in body &&
      body.variables &&
      typeof body.variables === "object" &&
      body.page
    ) {
      items = Object.entries(body.variables).map(([key, value]) => ({
        page: body.page as string,
        section: body.section || "general",
        key,
        value: String(value ?? ""),
      }));
    } else if (
      "updates" in body &&
      body.updates &&
      typeof body.updates === "object" &&
      body.page
    ) {
      items = Object.entries(body.updates).map(([key, value]) => ({
        page: body.page as string,
        section: body.section || "general",
        key,
        value: String(value ?? ""),
      }));
    } else if ("key" in body && body.page && body.key) {
      items = [body as CmsVarInput];
    }

    if (items.length === 0) {
      return NextResponse.json(
        { error: "Kaydedilecek CMS değişkeni belirtilmedi." },
        { status: 400 }
      );
    }

    const saved = [];
    for (const item of items) {
      if (!item.page || !item.key || item.value === undefined) continue;
      if (item.page === "system_audit") continue;

      const section = item.section || "general";
      const { data: existing } = await supabaseServer
        .from("cms_variables")
        .select("id")
        .eq("page", item.page)
        .eq("section", section)
        .eq("key", item.key)
        .maybeSingle();

      if (existing?.id) {
        const { data, error } = await supabaseServer
          .from("cms_variables")
          .update({
            value: String(item.value),
            description: item.description,
            updated_at: new Date().toISOString(),
            updated_by: auth.user.id,
          })
          .eq("id", existing.id)
          .select()
          .single();
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        saved.push(data);
      } else {
        const { data, error } = await supabaseServer
          .from("cms_variables")
          .insert({
            page: item.page,
            section,
            key: item.key,
            value: String(item.value),
            description: item.description,
            updated_by: auth.user.id,
          })
          .select()
          .single();
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        saved.push(data);
      }
    }

    invalidateSystemSettingsCache();

    const touchesSystem = items.some((i) => i.page === "system");
    await recordAuditLog({
      actorUserId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.user.role,
      action: touchesSystem ? "SYSTEM_SETTINGS_UPDATED" : "CMS_UPDATED",
      target: items.map((i) => `${i.page}.${i.key}`).join(", "),
      details: `${saved.length} yapılandırma kaydı güncellendi.`,
      status: "success",
    });

    return NextResponse.json({
      success: true,
      data: saved.length === 1 ? saved[0] : saved,
      savedCount: saved.length,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Geçersiz istek." },
      { status: 400 }
    );
  }
}
