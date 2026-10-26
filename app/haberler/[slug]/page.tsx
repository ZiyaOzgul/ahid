"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

function HaberDetayContent() {
  const params = useParams();
  const slug = params?.slug as string;
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/news?slug=${encodeURIComponent(slug)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.item) {
          setItem(data.item);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f9f9ff] text-[#101c2e]">
      <Navbar />
      <main className="w-full pt-[7.5rem] flex-1">
        <section className="max-w-4xl mx-auto px-4 lg:px-8 py-10">
          <nav className="flex items-center gap-2 text-xs font-semibold text-[#64748b] mb-6">
            <Link href="/" className="hover:text-[#002869]">
              Ana Sayfa
            </Link>
            <span>/</span>
            <Link href="/haberler" className="hover:text-[#002869]">
              Haberler &amp; Duyurular
            </Link>
            <span>/</span>
            <span className="text-[#002869] truncate max-w-xs">
              {item?.title || "Bülten Detayı"}
            </span>
          </nav>

          {loading ? (
            <div className="bg-white rounded-2xl p-8 shadow-xs border border-[#e7eeff] animate-pulse flex flex-col gap-4">
              <div className="h-6 w-32 bg-[#e7eeff] rounded" />
              <div className="h-10 w-3/4 bg-[#e7eeff] rounded" />
              <div className="h-72 w-full bg-[#e7eeff] rounded-xl" />
              <div className="h-32 w-full bg-[#e7eeff] rounded" />
            </div>
          ) : !item ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-xs border border-[#dee8ff] flex flex-col items-center gap-4">
              <span className="material-symbols-outlined text-5xl text-[#002869]">
                find_in_page
              </span>
              <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#002869]">
                Bülten veya Duyuru Bulunamadı
              </h1>
              <p className="text-sm text-[#64748b]">
                Aradığınız basın bülteni yayından kaldırılmış veya taşınmış olabilir.
              </p>
              <Link
                href="/haberler"
                className="px-5 py-2.5 rounded-lg bg-[#002869] text-white text-sm font-semibold hover:bg-[#0b3d91]"
              >
                Haberler &amp; Duyurulara Dön
              </Link>
            </div>
          ) : (
            <article className="bg-white rounded-2xl overflow-hidden shadow-xs border border-[#e7eeff]">
              {item.image_url && (
                <div className="h-80 sm:h-96 w-full overflow-hidden bg-[#002869]">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-6 sm:p-10 flex flex-col gap-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-[#ebf2fc] text-[#002869] text-xs font-bold uppercase tracking-wider">
                    {item.category}
                  </span>
                  {item.bulletin_no && (
                    <span className="px-3 py-1 rounded-full bg-[#fde68a]/40 text-[#92400e] text-xs font-bold">
                      Bülten No: {item.bulletin_no}
                    </span>
                  )}
                  <span className="text-xs text-[#64748b] flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">
                      calendar_today
                    </span>
                    {item.published_at || "Güncel"}
                  </span>
                  {item.location && (
                    <span className="text-xs text-[#64748b] flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">
                        location_on
                      </span>
                      {item.location}
                    </span>
                  )}
                </div>

                <h1 className="font-['Plus_Jakarta_Sans'] text-2xl sm:text-4xl font-bold text-[#002869] leading-tight">
                  {item.title}
                </h1>

                {item.summary && (
                  <p className="text-lg font-medium text-[#334155] leading-relaxed border-l-4 border-[#002869] pl-4 bg-[#f0f3ff]/60 py-3 rounded-r-lg">
                    {item.summary}
                  </p>
                )}

                <div className="prose max-w-none text-[#101c2e] leading-relaxed whitespace-pre-line text-base">
                  {item.content || item.summary}
                </div>

                <div className="pt-6 border-t border-[#e7eeff] flex items-center justify-between">
                  <Link
                    href="/haberler"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#002869] hover:text-[#225aba]"
                  >
                    <span className="material-symbols-outlined text-base">
                      arrow_back
                    </span>
                    <span>Tüm Haber ve Duyurulara Dön</span>
                  </Link>
                </div>
              </div>
            </article>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default function HaberDetayPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f9f9ff] flex items-center justify-center text-[#002869] font-semibold">
          Yükleniyor...
        </div>
      }
    >
      <HaberDetayContent />
    </Suspense>
  );
}
