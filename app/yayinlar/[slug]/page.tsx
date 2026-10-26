"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

function ArticleDetailContent() {
  const params = useParams();
  const slug = params?.slug as string;

  const [article, setArticle] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/articles?slug=${encodeURIComponent(slug)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.article) {
          setArticle(data.article);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        setProgress(Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)));
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <>
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-transparent z-[60]">
        <div
          className="h-full bg-[#c25e00] transition-all duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      <Navbar />

      <main className="w-full pt-[7.5rem] bg-surface min-h-[calc(100vh-24rem)] pb-20">
        <div className="max-w-4xl mx-auto px-margin-mobile lg:px-margin-desktop py-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6 font-medium">
            <Link href="/" className="hover:text-primary transition-colors">Ana Sayfa</Link>
            <span>/</span>
            <Link href="/yayinlar" className="hover:text-primary transition-colors">Yayınlar &amp; Akademik</Link>
            <span>/</span>
            <span className="text-primary font-semibold truncate max-w-[240px]">
              {article?.title || "Yayın Detayı"}
            </span>
          </nav>

          {loading ? (
            <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-sm animate-pulse space-y-6">
              <div className="h-5 w-32 bg-slate-200 rounded-full" />
              <div className="h-10 w-3/4 bg-slate-200 rounded-lg" />
              <div className="flex items-center gap-4 pt-2">
                <div className="w-12 h-12 rounded-full bg-slate-200" />
                <div className="space-y-2">
                  <div className="h-4 w-40 bg-slate-200 rounded" />
                  <div className="h-3 w-28 bg-slate-200 rounded" />
                </div>
              </div>
              <div className="h-64 w-full bg-slate-200 rounded-xl" />
              <div className="space-y-3">
                <div className="h-4 w-full bg-slate-200 rounded" />
                <div className="h-4 w-11/12 bg-slate-200 rounded" />
                <div className="h-4 w-4/5 bg-slate-200 rounded" />
              </div>
            </div>
          ) : !article ? (
            <div className="bg-surface-container-lowest rounded-2xl p-12 text-center border border-dashed border-slate-200">
              <span className="material-symbols-outlined text-5xl text-slate-400 mb-3">article</span>
              <h1 className="font-headline-md text-headline-md text-primary font-bold">
                Aradığınız Yayın Bulunamadı
              </h1>
              <p className="font-body-sm text-body-sm text-slate-500 mt-2 max-w-md mx-auto">
                Bu makale kaldırılmış olabilir veya bağlantı adresi geçersizdir.
              </p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <Link
                  href="/yayinlar"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-container transition-colors"
                >
                  <span className="material-symbols-outlined text-base">arrow_back</span>
                  Yayınlar Arşivine Dön
                </Link>
                <Link
                  href="/admin-panel"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg border border-slate-200 text-primary text-sm font-semibold hover:bg-surface-ice transition-colors"
                >
                  <span className="material-symbols-outlined text-base">add_circle</span>
                  Yönetim Panelinden Yayın Ekle
                </Link>
              </div>
            </div>
          ) : (
            <article className="bg-surface-container-lowest rounded-2xl p-8 lg:p-12 shadow-sm border border-slate-100">
              {/* Category & Meta */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <span className="px-3 py-1 rounded-full bg-surface-ice text-primary text-xs font-bold uppercase tracking-wider">
                  {article.category === "usta_saygi"
                    ? "Usta'ya Saygı"
                    : article.category === "akademik"
                    ? "Akademik Perspektif"
                    : article.category === "kose_yazisi"
                    ? "Köşe Yazısı"
                    : article.category === "bulten"
                    ? "Bülten & Rapor"
                    : article.category}
                </span>
                <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                  {article.published_at && (
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">calendar_today</span>
                      {article.published_at}
                    </span>
                  )}
                  {article.read_time && (
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      {article.read_time}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">visibility</span>
                    {article.views_count || 1} Okunma
                  </span>
                </div>
              </div>

              {/* Title */}
              <h1 className="font-headline-xl text-headline-lg lg:text-headline-xl text-primary font-extrabold leading-tight mb-6">
                {article.title}
              </h1>

              {/* Author Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-slate-100 mb-8">
                <div className="flex items-center gap-3">
                  {article.board_members?.photo_url || article.author_avatar ? (
                    <img
                      src={article.board_members?.photo_url || article.author_avatar}
                      alt={article.author_name}
                      className="w-12 h-12 rounded-full object-cover shadow-sm"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-surface-ice text-primary font-bold flex items-center justify-center text-lg">
                      {(article.author_name || "A")[0]}
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-primary text-sm flex items-center gap-2">
                      {article.author_name}
                      {article.board_members && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-gold-light/40 text-gold-deep font-bold">
                          <span className="material-symbols-outlined text-xs">verified</span>
                          AHİD Kurul Üyesi
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">
                      {article.board_members?.title || article.author_title || "İletişim Uzmanı"}
                      {article.board_members?.organization ? ` • ${article.board_members.organization}` : ""}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-ice text-primary text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {copied ? "check" : "share"}
                    </span>
                    {copied ? "Bağlantı Kopyalandı" : "Paylaş"}
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-ice text-primary text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">print</span>
                    Yazdır
                  </button>
                </div>
              </div>

              {/* Cover Image */}
              {article.image_url && (
                <div className="w-full h-72 sm:h-96 rounded-xl overflow-hidden mb-8 shadow-sm">
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Summary Lead */}
              {article.summary && (
                <blockquote className="p-5 rounded-xl bg-surface-ice/60 border-l-4 border-[#c25e00] text-primary font-medium italic text-base leading-relaxed mb-8">
                  {article.summary}
                </blockquote>
              )}

              {/* Body Content */}
              <div className="prose max-w-none text-slate-700 leading-relaxed space-y-4 whitespace-pre-line text-base">
                {article.content || article.summary}
              </div>

              {/* Linked Board Member Card */}
              {article.board_members && (
                <div className="mt-12 p-6 rounded-xl bg-surface-container-low flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-200/70">
                  <div className="flex items-center gap-4">
                    {article.board_members.photo_url ? (
                      <img
                        src={article.board_members.photo_url}
                        alt={article.board_members.full_name}
                        className="w-16 h-16 rounded-full object-cover shadow-sm"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary text-white font-bold flex items-center justify-center text-xl">
                        {article.board_members.full_name[0]}
                      </div>
                    )}
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#c25e00]">
                        Yazarın Kurumsal Profili
                      </span>
                      <h3 className="font-bold text-primary text-base">
                        {article.board_members.full_name}
                      </h3>
                      <p className="text-xs text-slate-600">
                        {article.board_members.title} • {article.board_members.organization}
                      </p>
                      {article.board_members.bio && (
                        <p className="text-xs text-slate-500 mt-1">{article.board_members.bio}</p>
                      )}
                    </div>
                  </div>
                  <Link
                    href="/kurumsal#yonetim-kurulu"
                    className="px-4 py-2 rounded-lg bg-white text-primary text-xs font-bold shadow-xs hover:bg-surface-ice transition-colors shrink-0"
                  >
                    Kurulda Gör →
                  </Link>
                </div>
              )}
            </article>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

export default function ArticleDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface" />}>
      <ArticleDetailContent />
    </Suspense>
  );
}
