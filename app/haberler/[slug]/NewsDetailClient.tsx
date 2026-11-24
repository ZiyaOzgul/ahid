"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export interface NewsDetail {
  id: number;
  title: string;
  slug: string;
  category: string;
  bulletin_no: string | null;
  location: string | null;
  summary: string | null;
  content: string | null;
  highlights: string[] | null;
  image_url: string | null;
  is_featured: boolean | null;
  is_member_only: boolean | null;
  read_time: string | null;
  published_at: string | null;
  created_at: string;
}

export default function NewsDetailClient({ slug }: { slug: string }) {
  const [item, setItem] = useState<NewsDetail | null>(null);
  const [memberPreview, setMemberPreview] = useState<{
    title: string;
    category: string;
    published_at: string | null;
  } | null>(null);
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [loading, setLoading] = useState(Boolean(slug));
  const [notFoundError, setNotFoundError] = useState(!slug);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let active = true;
    fetch(`/api/news?slug=${encodeURIComponent(slug)}`)
      .then(async (res) => {
        const data = (await res.json()) as {
          success?: boolean;
          item?: NewsDetail;
          requiresMemberAuth?: boolean;
          preview?: { title: string; category: string; published_at: string | null };
        };
        if (!active) return;
        if (res.status === 401 && data.requiresMemberAuth) {
          setRequiresAuth(true);
          setMemberPreview(data.preview || null);
        } else if (res.ok && data.success && data.item) {
          setItem(data.item);
        } else {
          setNotFoundError(true);
        }
      })
      .catch(() => {
        if (active) setNotFoundError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  const handleCopyLink = () => {
    if (typeof window === "undefined") return;
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f9f9ff] text-[#101c2e]">
      <Navbar />

      <main className="flex-1 pt-[7.5rem] pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-8 flex items-center gap-2 text-xs text-slate-500"
        >
          <Link href="/" className="hover:text-[#002869] font-medium transition-colors">
            Ana Sayfa
          </Link>
          <span>/</span>
          <Link
            href="/haberler"
            className="hover:text-[#002869] font-medium transition-colors"
          >
            Haberler &amp; Basın Odası
          </Link>
          {item && (
            <>
              <span>/</span>
              <span className="text-[#002869] font-semibold line-clamp-1">
                {item.title}
              </span>
            </>
          )}
        </nav>

        {loading && (
          <div className="bg-white rounded-2xl p-10 shadow-sm border border-[#dee8ff] text-center text-sm text-slate-500">
            Bülten içeriği yükleniyor...
          </div>
        )}

        {!loading && requiresAuth && (
          <div className="bg-white rounded-2xl p-10 sm:p-14 shadow-sm border border-amber-200 text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-amber-50 text-[#9b4900] mx-auto flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">lock</span>
            </div>
            <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-[#9b4900] text-xs font-bold uppercase tracking-wider">
              Üyelere Özel İçerik
            </span>
            <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-extrabold text-[#002869]">
              {memberPreview?.title || "Bu Duyuru Yalnızca AHİD Üyelerine Özeldir"}
            </h1>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Bu kurumsal bülten veya sirkülerin tam metni yalnızca oturum açmış
              AHİD üyelerinin erişimine açıktır.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href={`/login?redirect=${encodeURIComponent(`/haberler/${slug}`)}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#002869] text-white text-xs font-bold hover:bg-[#194d9f] transition-colors"
              >
                <span className="material-symbols-outlined text-base">login</span>
                Üye Girişi Yap
              </Link>
              <Link
                href="/haberler"
                className="px-5 py-2.5 rounded-lg bg-[#eef3ff] text-[#002869] text-xs font-bold hover:bg-[#dee8ff] transition-colors"
              >
                Tüm Bültenlere Dön
              </Link>
            </div>
          </div>
        )}

        {!loading && !requiresAuth && (notFoundError || !item) && (
          <div className="bg-white rounded-2xl p-10 sm:p-14 shadow-sm border border-[#dee8ff] text-center space-y-5">
            <div className="w-16 h-16 rounded-full bg-[#eef3ff] text-[#002869] mx-auto flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">newspaper</span>
            </div>
            <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-extrabold text-[#002869]">
              Bülten veya Haber Kaydı Bulunamadı
            </h1>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Aradığınız basın bülteni ya da resmi duyuru yayından kaldırılmış veya
              bağlantısı güncellenmiş olabilir.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/haberler"
                className="px-5 py-2.5 rounded-lg bg-[#002869] text-white text-xs font-bold hover:bg-[#194d9f] transition-colors"
              >
                Tüm Haber &amp; Bültenlere Dön
              </Link>
              <Link
                href="/"
                className="px-5 py-2.5 rounded-lg bg-[#eef3ff] text-[#002869] text-xs font-bold hover:bg-[#dee8ff] transition-colors"
              >
                Ana Sayfa
              </Link>
            </div>
          </div>
        )}

        {!loading && item && (
          <article className="bg-white rounded-2xl p-6 sm:p-10 lg:p-12 shadow-sm border border-[#dee8ff]">
            {/* Top Category & Meta */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded bg-[#eef3ff] text-[#002869] text-xs font-bold uppercase tracking-wider">
                  {item.category}
                </span>
                {item.bulletin_no && (
                  <span className="px-2.5 py-1 rounded bg-[#fef6e6] text-[#9b4900] text-xs font-mono font-bold">
                    {item.bulletin_no}
                  </span>
                )}
                {item.is_member_only && (
                  <span className="px-2.5 py-1 rounded bg-amber-100 text-[#9b4900] text-xs font-bold inline-flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">lock</span>
                    Üyelere Özel
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
                {item.published_at && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">
                      calendar_today
                    </span>
                    {item.published_at}
                  </span>
                )}
                {item.location && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">
                      location_on
                    </span>
                    {item.location}
                  </span>
                )}
                {item.read_time && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">
                      schedule
                    </span>
                    {item.read_time}
                  </span>
                )}
              </div>
            </div>

            {/* Title */}
            <h1 className="font-['Plus_Jakarta_Sans'] text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#002869] leading-tight mb-6">
              {item.title}
            </h1>

            {/* Action Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-slate-100 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#002869] text-white font-bold flex items-center justify-center text-sm">
                  AH
                </div>
                <div>
                  <div className="font-bold text-[#002869] text-sm">
                    AHİD Kurumsal İletişim &amp; Basın Masası
                  </div>
                  <div className="text-xs text-slate-500">
                    Ankara Halkla İlişkiler Derneği Resmi Yayın Organı
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#f0f3ff] hover:bg-[#dee8ff] text-[#002869] text-xs font-semibold transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">
                    {copied ? "check" : "share"}
                  </span>
                  {copied ? "Bağlantı Kopyalandı" : "Paylaş"}
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#f0f3ff] hover:bg-[#dee8ff] text-[#002869] text-xs font-semibold transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">print</span>
                  Yazdır
                </button>
              </div>
            </div>

            {/* Cover Image */}
            {item.image_url && (
              <div className="w-full h-72 sm:h-96 rounded-xl overflow-hidden mb-8 shadow-sm bg-slate-100">
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Summary Lead */}
            {item.summary && (
              <blockquote className="p-5 rounded-xl bg-[#f0f3ff]/80 border-l-4 border-[#c25e00] text-[#002869] font-medium italic text-base leading-relaxed mb-8">
                {item.summary}
              </blockquote>
            )}

            {/* Key Highlights */}
            {Array.isArray(item.highlights) && item.highlights.length > 0 && (
              <div className="mb-8 p-5 rounded-xl bg-[#f9f9ff] border border-[#dee8ff]">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#002869] mb-3 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-[#c25e00]">
                    star
                  </span>
                  Öne Çıkan Başlıklar
                </h2>
                <ul className="space-y-2 text-sm text-slate-700">
                  {item.highlights.map((hl, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-xs text-[#002869] mt-1 shrink-0">
                        arrow_right
                      </span>
                      <span>{hl}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Body Content */}
            <div className="prose max-w-none text-slate-700 leading-relaxed space-y-4 whitespace-pre-line text-base">
              {item.content ||
                item.summary ||
                "Bu bülten için detaylı metin henüz eklenmemiştir."}
            </div>

            {/* Bottom Navigation */}
            <div className="mt-10 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
              <Link
                href="/haberler"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#002869] hover:text-[#c25e00] transition-colors"
              >
                <span className="material-symbols-outlined text-sm">
                  arrow_back
                </span>
                Basın Odası ve Tüm Bültenlere Dön
              </Link>
              <Link
                href="/iletisim"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#002869] transition-colors"
              >
                <span className="material-symbols-outlined text-sm">mail</span>
                Basın Masası İletişim
              </Link>
            </div>
          </article>
        )}
      </main>

      <Footer />
    </div>
  );
}
