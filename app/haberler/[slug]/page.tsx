import { Suspense } from "react";
import type { Metadata } from "next";
import { supabaseServer } from "@/lib/supabase-server";
import NewsDetailClient from "./NewsDetailClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);

  try {
    const { data } = await supabaseServer
      .from("news_announcements")
      .select("title, summary, is_member_only")
      .eq("slug", decoded)
      .maybeSingle();

    if (!data) {
      return {
        title: "Haber & Duyuru — AHİD",
      };
    }

    return {
      title: `${data.title} — AHİD Basın Odası`,
      description: data.is_member_only
        ? "Bu kurumsal duyuru yalnızca AHİD üyelerine özeldir."
        : data.summary || "Ankara Halkla İlişkiler Derneği resmi duyuru ve basın bülteni.",
    };
  } catch {
    return {
      title: "Haber & Duyuru — AHİD",
    };
  }
}

async function NewsDetailContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <NewsDetailClient slug={decodeURIComponent(slug)} />;
}

export default function NewsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f9f9ff]" />}>
      <NewsDetailContent params={params} />
    </Suspense>
  );
}
