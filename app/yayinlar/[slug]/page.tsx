import { Suspense } from "react";
import type { Metadata } from "next";
import { supabaseServer } from "@/lib/supabase-server";
import ArticleDetailClient from "./ArticleDetailClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);

  try {
    const { data } = await supabaseServer
      .from("articles")
      .select("title, summary, author_name")
      .eq("slug", decoded)
      .maybeSingle();

    if (!data) {
      return { title: "Yayın & Köşe Yazısı — AHİD" };
    }

    return {
      title: `${data.title} — ${data.author_name} | AHİD`,
      description:
        data.summary ||
        `${data.author_name} tarafından AHİD için kaleme alınan yayın.`,
    };
  } catch {
    return { title: "Yayın & Köşe Yazısı — AHİD" };
  }
}

async function ArticleDetailContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ArticleDetailClient slug={decodeURIComponent(slug)} />;
}

export default function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface" />}>
      <ArticleDetailContent params={params} />
    </Suspense>
  );
}
