import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { escapeLikePattern } from "@/lib/constants";
import { supabaseServer } from "@/lib/supabase-server";

export interface SearchResultItem {
  id: string;
  type: "news" | "event" | "article" | "document" | "board";
  typeLabel: string;
  title: string;
  subtitle: string;
  href: string;
  date?: string | null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawQuery = (searchParams.get("q") || "").trim();
  const limitParam = Number(searchParams.get("limit") || "12");
  const limit = Number.isFinite(limitParam)
    ? Math.max(1, Math.min(30, limitParam))
    : 12;

  if (rawQuery.length < 2) {
    return NextResponse.json({ results: [], query: rawQuery });
  }

  const session = await getSessionFromRequest(request);
  const escaped = escapeLikePattern(rawQuery);
  const pattern = `%${escaped}%`;
  const perTable = Math.max(3, Math.ceil(limit / 3));

  let newsQuery = supabaseServer
    .from("news_announcements")
    .select("id, title, slug, category, summary, published_at, is_member_only")
    .or(`title.ilike.${pattern},summary.ilike.${pattern},category.ilike.${pattern}`)
    .order("published_at", { ascending: false })
    .limit(perTable);

  if (!session) {
    newsQuery = newsQuery.eq("is_member_only", false);
  }

  const eventsQuery = supabaseServer
    .from("events")
    .select("id, title, category, location, event_date")
    .or(`title.ilike.${pattern},summary.ilike.${pattern},location.ilike.${pattern}`)
    .order("event_date", { ascending: false })
    .limit(perTable);

  const articlesQuery = supabaseServer
    .from("articles")
    .select("id, title, slug, author_name, category, published_at")
    .or(`title.ilike.${pattern},summary.ilike.${pattern},author_name.ilike.${pattern}`)
    .order("published_at", { ascending: false })
    .limit(perTable);

  const docsQuery = supabaseServer
    .from("documents")
    .select("id, title, document_code, category, revision_date")
    .or(`title.ilike.${pattern},document_code.ilike.${pattern},description.ilike.${pattern}`)
    .order("created_at", { ascending: false })
    .limit(perTable);

  const boardQuery = supabaseServer
    .from("board_members")
    .select("id, full_name, title, organization, category")
    .or(`full_name.ilike.${pattern},title.ilike.${pattern},organization.ilike.${pattern}`)
    .order("order_no", { ascending: true })
    .limit(perTable);

  const [newsRes, eventsRes, articlesRes, docsRes, boardRes] = await Promise.all([
    newsQuery,
    eventsQuery,
    articlesQuery,
    docsQuery,
    boardQuery,
  ]);

  const results: SearchResultItem[] = [];

  for (const item of newsRes.data || []) {
    results.push({
      id: `news-${item.id}`,
      type: "news",
      typeLabel: "Haber & Duyuru",
      title: item.title,
      subtitle: `${item.category}${item.summary ? ` · ${item.summary.slice(0, 75)}` : ""}`,
      href: `/haberler/${encodeURIComponent(item.slug || item.id)}`,
      date: item.published_at,
    });
  }

  for (const item of eventsRes.data || []) {
    results.push({
      id: `event-${item.id}`,
      type: "event",
      typeLabel: "Etkinlik",
      title: item.title,
      subtitle: `${item.category}${item.location ? ` · ${item.location}` : ""}`,
      href: `/etkinlikler/${encodeURIComponent(item.id)}`,
      date: item.event_date,
    });
  }

  for (const item of articlesRes.data || []) {
    results.push({
      id: `article-${item.id}`,
      type: "article",
      typeLabel: "Yayın & Görüş",
      title: item.title,
      subtitle: `${item.author_name || "AHİD Yazar"}${item.category ? ` · ${item.category}` : ""}`,
      href: `/yayinlar/${encodeURIComponent(item.slug || item.id)}`,
      date: item.published_at,
    });
  }

  for (const item of docsRes.data || []) {
    results.push({
      id: `doc-${item.id}`,
      type: "document",
      typeLabel: "Resmi Belge",
      title: item.title,
      subtitle: `${item.document_code || item.category}`,
      href: item.document_code
        ? `/kaynaklar?kod=${encodeURIComponent(item.document_code)}`
        : "/kaynaklar",
      date: item.revision_date,
    });
  }

  for (const item of boardRes.data || []) {
    results.push({
      id: `board-${item.id}`,
      type: "board",
      typeLabel: "Kurul Üyesi",
      title: item.full_name,
      subtitle: `${item.title || ""}${item.organization ? ` · ${item.organization}` : ""}`,
      href: "/baskanlar-ve-kurullar",
    });
  }

  return NextResponse.json({
    query: rawQuery,
    results: results.slice(0, limit),
  });
}
