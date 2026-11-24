import { Suspense } from "react";
import type { Metadata } from "next";
import { parsePositiveId } from "@/lib/constants";
import { supabaseServer } from "@/lib/supabase-server";
import EventDetailClient from "./EventDetailClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const numericId = parsePositiveId(id);
  if (!numericId) {
    return { title: "Etkinlik Detayı — AHİD" };
  }

  try {
    const { data } = await supabaseServer
      .from("events")
      .select("title, summary, location, event_date")
      .eq("id", numericId)
      .maybeSingle();

    if (!data) {
      return { title: "Etkinlik Detayı — AHİD" };
    }

    return {
      title: `${data.title} — AHİD Etkinlikleri`,
      description:
        data.summary ||
        `${data.event_date} tarihinde ${data.location || "Ankara"} konumunda düzenlenecek AHİD etkinliği.`,
    };
  } catch {
    return { title: "Etkinlik Detayı — AHİD" };
  }
}

async function EventDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EventDetailClient eventId={id} />;
}

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface" />}>
      <EventDetailContent params={params} />
    </Suspense>
  );
}
