import type { MetadataRoute } from "next";
import { SITE_BASE_URL } from "@/lib/constants";
import { supabaseServer } from "@/lib/supabase-server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/kurumsal",
    "/baskanlar-ve-kurullar",
    "/haberler",
    "/etkinlikler",
    "/yayinlar",
    "/kaynaklar",
    "/uyelik",
    "/iletisim",
  ].map((path) => ({
    url: `${SITE_BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1.0 : 0.8,
  }));

  try {
    const [newsRes, eventsRes, articlesRes] = await Promise.all([
      supabaseServer
        .from("news_announcements")
        .select("slug, id, published_at, is_member_only")
        .eq("is_member_only", false)
        .limit(100),
      supabaseServer.from("events").select("id, created_at").limit(100),
      supabaseServer.from("articles").select("slug, id, published_at").limit(100),
    ]);

    const newsRoutes: MetadataRoute.Sitemap = (newsRes.data || []).map((n) => ({
      url: `${SITE_BASE_URL}/haberler/${encodeURIComponent(n.slug || n.id)}`,
      lastModified: n.published_at ? new Date(n.published_at) : new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const eventRoutes: MetadataRoute.Sitemap = (eventsRes.data || []).map((e) => ({
      url: `${SITE_BASE_URL}/etkinlikler/${encodeURIComponent(e.id)}`,
      lastModified: e.created_at ? new Date(e.created_at) : new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const articleRoutes: MetadataRoute.Sitemap = (articlesRes.data || []).map(
      (a) => ({
        url: `${SITE_BASE_URL}/yayinlar/${encodeURIComponent(a.slug || a.id)}`,
        lastModified: a.published_at ? new Date(a.published_at) : new Date(),
        changeFrequency: "monthly",
        priority: 0.7,
      })
    );

    return [...staticRoutes, ...newsRoutes, ...eventRoutes, ...articleRoutes];
  } catch {
    return staticRoutes;
  }
}
