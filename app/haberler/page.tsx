"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface NewsItem {
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

const CATEGORIES = [
  "Tümü",
  "Basın Bültenleri",
  "Resmi Duyurular",
  "Protokol & Ziyaretler",
  "Medya Yansımaları",
  "Akademik Raporlar",
];

export default function HaberlerPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("Tümü");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  useEffect(() => {
    fetch("/api/news")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.items)) {
          setItems(data.items);
        }
      })
      .catch((err) => console.error("Failed to fetch news:", err))
      .finally(() => setLoading(false));
  }, []);

  const filteredItems = items
    .filter((item) => {
      const matchesCat =
        selectedCategory === "Tümü" ||
        item.category.toLowerCase() === selectedCategory.toLowerCase() ||
        (selectedCategory === "Basın Bültenleri" &&
          item.category.toLowerCase().includes("bülten")) ||
        (selectedCategory === "Resmi Duyurular" &&
          item.category.toLowerCase().includes("duyuru")) ||
        (selectedCategory === "Protokol & Ziyaretler" &&
          item.category.toLowerCase().includes("protokol"));
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        (item.summary || "").toLowerCase().includes(q) ||
        (item.bulletin_no || "").toLowerCase().includes(q) ||
        (item.location || "").toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    })
    .sort((a, b) => (sortOrder === "newest" ? b.id - a.id : a.id - b.id));

  const featuredItem =
    filteredItems.find((i) => i.is_featured) || filteredItems[0] || null;
  const gridItems = featuredItem
    ? filteredItems.filter((i) => i.id !== featuredItem.id)
    : filteredItems;

  const pressReleaseCount = items.filter((i) =>
    i.category.toLowerCase().includes("bülten")
  ).length;
  const declarationCount = items.filter(
    (i) =>
      i.category.toLowerCase().includes("duyuru") ||
      i.category.toLowerCase().includes("deklarasyon")
  ).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#f9f9ff] text-[#101c2e]">
      <Navbar />

      <main className="w-full pt-[7.5rem] bg-[#f9f9ff] flex-1">
        <div className="relative w-full overflow-hidden">
          <div className="absolute -top-32 right-1/4 w-96 h-96 bg-[#0b3d91]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-48 -left-20 w-80 h-80 bg-[#fde68a]/20 rounded-full blur-3xl pointer-events-none" />

          {/* Editorial Header & Breadcrumb Container */}
          <section className="max-w-7xl mx-auto px-4 lg:px-14 pt-6 pb-10 w-full relative z-10">
            <nav
              aria-label="Erişim Yolu"
              className="flex items-center gap-1.5 text-xs font-semibold text-[#64748b] mb-6"
            >
              <Link
                className="hover:text-[#002869] transition-colors flex items-center gap-1"
                href="/"
              >
                <span className="material-symbols-outlined text-base">home</span>
                <span>Ana Sayfa</span>
              </Link>
              <span className="material-symbols-outlined text-xs text-[#c4c6d3]">
                chevron_right
              </span>
              <span className="text-[#002869] font-semibold">
                Haberler &amp; Basın Duyuruları
              </span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end mb-6">
              <div className="lg:col-span-8 flex flex-col gap-3">
                <div className="inline-flex items-center gap-2 self-start bg-[#dee8ff] px-3 py-1 rounded-full text-[#002869] text-[11px] font-bold tracking-widest uppercase">
                  <span className="w-2 h-2 rounded-full bg-[#0b3d91] animate-pulse" />
                  Resmi Bildiriler &amp; Yayın Akışı
                </div>
                <h1 className="font-['Plus_Jakarta_Sans'] text-3xl sm:text-4xl text-[#002869] font-bold tracking-tight">
                  Haberler, Basın Bültenleri ve Resmi Duyurular
                </h1>
                <p className="text-base sm:text-lg text-[#334155] max-w-3xl leading-relaxed">
                  İletişim dünyasından güncel gelişmeler, Ankara merkezli kurumsal
                  ziyaretler, akademik iş birlikleri ve resmi dernek deklarasyonları
                  arşivi.
                </p>
              </div>

              <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-2.5 lg:items-end justify-end">
                <Link
                  className="inline-flex items-center justify-center gap-2 bg-[#002869] text-white hover:bg-[#225aba] px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm w-full sm:w-auto text-center"
                  href="/kaynaklar"
                >
                  <span className="material-symbols-outlined text-base">
                    archive
                  </span>
                  <span>Resmi Belge &amp; Basın Kiti Arşivi</span>
                </Link>
                <div className="flex items-center gap-2">
                  <a
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#e7eeff] text-[#002869] text-xs font-semibold hover:bg-[#dee8ff] transition-colors"
                    href="#bulten-akisi"
                  >
                    <span className="material-symbols-outlined text-sm text-[#fe942d]">
                      rss_feed
                    </span>
                    <span>Canlı Bülten Akışı</span>
                  </a>
                  <span className="text-xs text-[#64748b] hidden sm:inline">•</span>
                  <span className="text-xs text-[#64748b] flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-[#002869]">
                      verified
                    </span>
                    DERBİS Senkronize
                  </span>
                </div>
              </div>
            </div>

            {/* Live Badges Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#e7eeff]">
              <div className="bg-white p-3.5 rounded-lg flex items-center gap-3 border border-[#f0f3ff] shadow-xs">
                <div className="w-10 h-10 rounded-lg bg-[#ebf2fc] flex items-center justify-center text-[#002869] shrink-0">
                  <span className="material-symbols-outlined text-xl">
                    library_books
                  </span>
                </div>
                <div>
                  <span className="block font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#002869] leading-tight">
                    {loading ? "—" : items.length}
                  </span>
                  <span className="text-xs text-[#64748b] font-medium">
                    Resmi Kayıt
                  </span>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-lg flex items-center gap-3 border border-[#f0f3ff] shadow-xs">
                <div className="w-10 h-10 rounded-lg bg-[#ebf2fc] flex items-center justify-center text-[#002869] shrink-0">
                  <span className="material-symbols-outlined text-xl">
                    campaign
                  </span>
                </div>
                <div>
                  <span className="block font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#002869] leading-tight">
                    {loading ? "—" : pressReleaseCount}
                  </span>
                  <span className="text-xs text-[#64748b] font-medium">
                    Basın Bülteni
                  </span>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-lg flex items-center gap-3 border border-[#f0f3ff] shadow-xs">
                <div className="w-10 h-10 rounded-lg bg-[#ebf2fc] flex items-center justify-center text-[#002869] shrink-0">
                  <span className="material-symbols-outlined text-xl">
                    history_edu
                  </span>
                </div>
                <div>
                  <span className="block font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#002869] leading-tight">
                    {loading ? "—" : declarationCount}
                  </span>
                  <span className="text-xs text-[#64748b] font-medium">
                    Duyuru &amp; Deklarasyon
                  </span>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-lg flex items-center gap-3 border border-[#f0f3ff] shadow-xs">
                <div className="w-10 h-10 rounded-lg bg-[#fde68a]/40 flex items-center justify-center text-[#92400e] shrink-0">
                  <span className="material-symbols-outlined text-xl">
                    verified_user
                  </span>
                </div>
                <div>
                  <span className="block font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#92400e] leading-tight">
                    1990
                  </span>
                  <span className="text-xs text-[#64748b] font-medium">
                    Kuruluş &amp; Miras
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Filter & Live Action Matrix */}
          <section className="max-w-7xl mx-auto px-4 lg:px-14 pb-10 w-full">
            <div className="bg-white p-4 lg:p-6 rounded-xl shadow-xs border border-[#e7eeff] flex flex-col gap-4">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-xl">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748b] text-xl">
                    search
                  </span>
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-[#f0f3ff] text-[#101c2e] placeholder:text-[#747783] rounded-lg text-sm outline-none transition-all duration-150 focus:bg-white focus:ring-2 focus:ring-[#002869]/20"
                    placeholder="Arşivde bülten, konu, numara veya kurum adı arayın..."
                    type="text"
                  />
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto w-full md:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      setSortOrder((prev) =>
                        prev === "newest" ? "oldest" : "newest"
                      )
                    }
                    className="flex items-center gap-2 bg-[#f0f3ff] px-4 py-2.5 rounded-lg text-[#002869] text-sm font-semibold cursor-pointer hover:bg-[#e7eeff] transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">
                      calendar_month
                    </span>
                    <span>
                      Yayın Tarihine Göre:{" "}
                      {sortOrder === "newest" ? "En Yeni" : "En Eski"}
                    </span>
                    <span className="material-symbols-outlined text-base">
                      swap_vert
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 overflow-x-auto no-scrollbar pb-1 sm:flex-wrap">
                {CATEGORIES.map((cat) => {
                  const active = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={
                        active
                          ? "shrink-0 px-4 py-2 rounded-full text-xs font-semibold bg-[#0b3d91] text-white shadow-xs transition-all cursor-pointer whitespace-nowrap"
                          : "shrink-0 px-4 py-2 rounded-full text-xs font-semibold bg-[#f0f3ff] text-[#434652] hover:bg-[#ebf2fc] hover:text-[#002869] transition-all cursor-pointer whitespace-nowrap"
                      }
                    >
                      {cat === "Tümü" ? `Tümü (${items.length})` : cat}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Loading State */}
          {loading ? (
            <section className="max-w-7xl mx-auto px-4 lg:px-14 pb-16 w-full">
              <div className="bg-white rounded-xl p-8 shadow-xs border border-[#e7eeff] animate-pulse mb-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-7 h-80 bg-[#e7eeff] rounded-xl" />
                  <div className="lg:col-span-5 flex flex-col justify-center gap-4">
                    <div className="h-4 w-32 bg-[#e7eeff] rounded" />
                    <div className="h-8 w-full bg-[#e7eeff] rounded" />
                    <div className="h-20 w-full bg-[#e7eeff] rounded" />
                    <div className="h-10 w-40 bg-[#e7eeff] rounded" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="bg-white rounded-xl p-5 shadow-xs border border-[#e7eeff] animate-pulse flex flex-col gap-4"
                  >
                    <div className="h-48 bg-[#e7eeff] rounded-lg" />
                    <div className="h-4 w-24 bg-[#e7eeff] rounded" />
                    <div className="h-6 w-full bg-[#e7eeff] rounded" />
                    <div className="h-16 w-full bg-[#e7eeff] rounded" />
                  </div>
                ))}
              </div>
            </section>
          ) : filteredItems.length === 0 ? (
            /* Empty State when DB has 0 matching rows */
            <section
              id="bulten-akisi"
              className="max-w-7xl mx-auto px-4 lg:px-14 pb-16 w-full"
            >
              <div className="bg-white rounded-2xl p-12 text-center shadow-xs border border-[#dee8ff] flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#ebf2fc] text-[#002869] flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl">
                    newspaper
                  </span>
                </div>
                <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#002869]">
                  Henüz Yayınlanmış Haber veya Resmi Duyuru Bulunmuyor
                </h2>
                <p className="text-sm text-[#64748b] max-w-xl leading-relaxed">
                  Veritabanında bu kategori veya arama kriterine ait kayıtlı basın
                  bülteni ya da resmi duyuru bulunmamaktadır. Yönetim portalı
                  üzerinden yeni bülten eklendiğinde burada anlık olarak
                  listelenecektir.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  {selectedCategory !== "Tümü" || searchQuery ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory("Tümü");
                        setSearchQuery("");
                      }}
                      className="px-5 py-2.5 rounded-lg bg-[#002869] text-white text-sm font-semibold hover:bg-[#0b3d91] transition-colors cursor-pointer"
                    >
                      Filtreleri Temizle
                    </button>
                  ) : null}
                  <Link
                    href="/iletisim"
                    className="px-5 py-2.5 rounded-lg bg-[#ebf2fc] text-[#002869] text-sm font-semibold hover:bg-[#dee8ff] transition-colors"
                  >
                    Basın Bürosu ile İletişime Geçin
                  </Link>
                </div>
              </div>
            </section>
          ) : (
            <>
              {/* Lead Editorial Showcase Card */}
              {featuredItem && (
                <section
                  id="bulten-akisi"
                  className="max-w-7xl mx-auto px-4 lg:px-14 pb-14 w-full"
                >
                  <div className="bg-white rounded-xl overflow-hidden shadow-md border border-[#e7eeff] group hover:shadow-xl transition-all duration-300">
                    <div className="grid grid-cols-1 lg:grid-cols-12">
                      <div className="lg:col-span-7 relative min-h-[320px] lg:min-h-[420px] overflow-hidden bg-[#002869]">
                        {featuredItem.image_url ? (
                          <img
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                            alt={featuredItem.title}
                            src={featuredItem.image_url}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#002869] to-[#0b3d91] text-white/20">
                            <span className="material-symbols-outlined text-7xl">
                              campaign
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#002869]/80 via-[#002869]/20 to-transparent" />
                        <div className="absolute top-6 left-6 flex flex-wrap gap-2 items-center">
                          <span className="bg-[#fde68a] text-[#92400e] text-[11px] px-3 py-1 rounded-full uppercase tracking-wider font-bold shadow-xs">
                            Öne Çıkan Manşet
                          </span>
                          <span className="bg-[#002869]/80 backdrop-blur-md text-white text-[11px] px-3 py-1 rounded-full uppercase tracking-wider font-bold">
                            {featuredItem.category}
                          </span>
                        </div>
                        <div className="absolute bottom-6 left-6 text-white flex items-center gap-2 text-xs font-semibold">
                          <span className="material-symbols-outlined text-base">
                            event
                          </span>
                          <span>
                            {featuredItem.published_at || "Güncel"} |{" "}
                            {featuredItem.location || "Çankaya, Ankara"}
                          </span>
                        </div>
                      </div>

                      <div className="lg:col-span-5 p-8 lg:p-10 flex flex-col justify-between bg-white">
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center gap-2 text-[#64748b] text-xs font-semibold">
                            <span className="material-symbols-outlined text-sm text-[#002869]">
                              verified
                            </span>
                            <span>
                              {featuredItem.bulletin_no
                                ? `Bülten No: ${featuredItem.bulletin_no}`
                                : "AHİD Genel Sekreterliği Resmi Bildirisi"}
                            </span>
                          </div>
                          <h2 className="font-['Plus_Jakarta_Sans'] text-2xl sm:text-3xl text-[#002869] font-bold leading-tight group-hover:text-[#225aba] transition-colors">
                            {featuredItem.title}
                          </h2>
                          <p className="text-base text-[#64748b] leading-relaxed">
                            {featuredItem.summary}
                          </p>
                          {featuredItem.highlights &&
                            featuredItem.highlights.length > 0 && (
                              <div className="bg-[#ebf2fc] p-4 rounded-lg flex flex-col gap-2 mt-2">
                                {featuredItem.highlights.map((hl, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-2 text-sm text-[#334155]"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#002869]" />
                                    <span>{hl}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>

                        <div className="pt-6 flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#64748b] flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">
                              schedule
                            </span>{" "}
                            {featuredItem.read_time || "3 dk okuma süresi"}
                          </span>
                          <Link
                            className="inline-flex items-center gap-2 bg-[#0b3d91] text-white hover:bg-[#225aba] px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 shadow-xs"
                            href={`/haberler/${featuredItem.slug}`}
                          >
                            <span>Detayları Oku</span>
                            <span className="material-symbols-outlined text-base">
                              arrow_forward
                            </span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* 3-Column Editorial Grid */}
              {gridItems.length > 0 && (
                <section className="max-w-7xl mx-auto px-4 lg:px-14 pb-16 w-full">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-[#64748b] font-bold block mb-1">
                        Arşiv Bültenleri
                      </span>
                      <h3 className="font-['Plus_Jakarta_Sans'] text-2xl text-[#002869] font-bold">
                        Güncel Haber ve Bildiri Akışı
                      </h3>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 text-[#64748b] text-xs font-semibold">
                      <span>Toplam {filteredItems.length} Kayıt Gösteriliyor</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {gridItems.map((item) => (
                      <article
                        key={item.id}
                        className="bg-white rounded-xl overflow-hidden shadow-xs hover:shadow-md border border-[#e7eeff] transition-all duration-300 flex flex-col group"
                      >
                        <div className="relative h-56 overflow-hidden bg-[#e7eeff]">
                          {item.image_url ? (
                            <img
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                              alt={item.title}
                              src={item.image_url}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#ebf2fc] to-[#d7e3fc] text-[#002869]/30">
                              <span className="material-symbols-outlined text-5xl">
                                article
                              </span>
                            </div>
                          )}
                          <div className="absolute top-4 left-4">
                            <span className="bg-[#ebf2fc] text-[#002869] text-[11px] px-3 py-1 rounded-full uppercase tracking-wider font-bold">
                              {item.category}
                            </span>
                          </div>
                          {item.bulletin_no && (
                            <div className="absolute bottom-3 right-3 bg-[#253144]/80 backdrop-blur-xs text-white text-[11px] font-bold px-2.5 py-1 rounded">
                              {item.bulletin_no}
                            </div>
                          )}
                        </div>

                        <div className="p-6 flex flex-col flex-1 justify-between gap-4">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-xs font-semibold text-[#64748b]">
                              <span className="material-symbols-outlined text-sm">
                                calendar_today
                              </span>
                              <span>{item.published_at || "Güncel"}</span>
                              {item.location && (
                                <>
                                  <span className="text-[#c4c6d3]">•</span>
                                  <span>{item.location}</span>
                                </>
                              )}
                            </div>
                            <h4 className="font-['Plus_Jakarta_Sans'] text-lg text-[#002869] font-bold leading-snug group-hover:text-[#225aba] transition-colors">
                              {item.title}
                            </h4>
                            <p className="text-sm text-[#334155] line-clamp-3 leading-relaxed">
                              {item.summary}
                            </p>
                          </div>

                          <div className="pt-2 flex items-center justify-between border-t border-[#f0f3ff]">
                            <Link
                              className="text-sm text-[#002869] font-semibold hover:text-[#225aba] inline-flex items-center gap-1 group/btn"
                              href={`/haberler/${item.slug}`}
                            >
                              <span>Bülteni İncele</span>
                              <span className="material-symbols-outlined text-sm group-hover/btn:translate-x-1 transition-transform">
                                east
                              </span>
                            </Link>
                            <span className="text-xs text-[#64748b]">
                              {item.read_time || "3 dk"}
                            </span>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {/* Diplomatic Informative Note Banner */}
          <section className="max-w-7xl mx-auto px-4 lg:px-14 pb-20 w-full">
            <div className="bg-gradient-to-r from-[#ebf2fc] via-[#f0f3ff] to-[#e7eeff] p-6 lg:p-8 rounded-xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#002869] text-white flex items-center justify-center shrink-0 shadow-md">
                  <span className="material-symbols-outlined text-2xl">
                    info
                  </span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-[#002869]">
                      Kurumsal Basın ve Arşiv Koordinasyonu
                    </span>
                    <span className="hidden sm:inline-block px-2.5 py-0.5 rounded text-[11px] bg-[#fde68a] text-[#92400e] font-bold uppercase">
                      DERBİS &amp; Basın Masası
                    </span>
                  </div>
                  <p className="text-sm text-[#334155] mt-1">
                    Resmi basın bültenlerimiz, kurumsal logolarımız ve yüksek
                    çözünürlüklü medya kitimiz için Kaynaklar &amp; Belgeler
                    kütüphanemizi ziyaret edebilir veya basın büromuzla iletişime
                    geçebilirsiniz.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-end">
                <a
                  className="inline-flex items-center justify-center gap-2 bg-white text-[#002869] hover:bg-[#f9f9ff] px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-xs"
                  href="mailto:basin@ahid.org.tr"
                >
                  <span className="material-symbols-outlined text-base">
                    outgoing_mail
                  </span>
                  <span>Basın İrtibat</span>
                </a>
                <Link
                  className="inline-flex items-center justify-center gap-2 bg-[#002869] text-white hover:bg-[#225aba] px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-xs"
                  href="/kaynaklar"
                >
                  <span className="material-symbols-outlined text-base">
                    folder_open
                  </span>
                  <span>Kaynaklar &amp; Belgeler</span>
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
