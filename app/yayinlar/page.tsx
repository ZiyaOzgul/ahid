"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function YayinlarPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen pt-32 flex flex-col items-center justify-center bg-surface">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-3 text-slate-muted font-body-sm">Yayınlar Masası Yükleniyor...</p>
        </div>
      }
    >
      <YayinlarContent />
    </Suspense>
  );
}

function YayinlarContent() {
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("q") || "";
  const categoryParam = searchParams.get("category") || "all";

  const [articles, setArticles] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>(categoryParam);
  const [searchQuery, setSearchQuery] = useState<string>(queryParam);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [loading, setLoading] = useState(true);

  // Sync state if URL search params change
  useEffect(() => {
    if (searchParams.get("q") !== null) {
      setSearchQuery(searchParams.get("q") || "");
    }
    if (searchParams.get("category") !== null) {
      setActiveCategory(searchParams.get("category") || "all");
    }
  }, [searchParams]);

  useEffect(() => {
    fetch("/api/articles")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.articles) {
          setArticles(data.articles);
        }
      })
      .catch((err) => console.error("Error loading articles:", err))
      .finally(() => setLoading(false));
  }, []);

  const filteredArticles = articles
    .filter((art) => {
      const matchesCat =
        activeCategory === "all" ||
        art.category === activeCategory;
      const matchesSearch =
        !searchQuery ||
        (art.title && art.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (art.summary && art.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (art.author_name && art.author_name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCat && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "author") {
        return (a.author_name || "").localeCompare(b.author_name || "");
      }
      return (b.id || 0) - (a.id || 0);
    });

  const featuredArticle = articles.find((a) => a.is_featured) || articles[0];
  const ustaSaygiArticles = articles.filter((a) => a.category === "usta_saygi");

  return (
    <>
      <Navbar />
      <main className="w-full pt-[7.5rem] bg-surface min-h-[calc(100vh-28rem)]"><div className="flex flex-col w-full">
{/*  BREADCRUMB & INTRO HERO  */}
<section className="relative w-full bg-surface-canvas overflow-hidden pb-space-2xl">
{/*  Atmospheric subtle background glow  */}
<div className="absolute -top-24 right-0 w-[550px] h-[550px] bg-secondary-fixed/30 rounded-full blur-3xl pointer-events-none"></div>
<div className="absolute top-40 -left-20 w-[420px] h-[420px] bg-surface-ice rounded-full blur-2xl pointer-events-none"></div>
<div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop pt-space-lg relative z-10">
{/*  Breadcrumb Navigation  */}
<nav aria-label="Erişim Yolu" className="flex items-center gap-space-xs font-caption-caps text-caption-caps text-slate-muted mb-space-lg">
<a className="hover:text-primary transition-colors" href="#">ANA SAYFA</a>
<span className="material-symbols-outlined text-xs">chevron_right</span>
<a className="hover:text-primary transition-colors" href="#">YAYINLAR &amp; ARŞİV</a>
<span className="material-symbols-outlined text-xs">chevron_right</span>
<span className="text-primary font-bold">KÖŞE YAZILARI &amp; USTA'YA SAYGI</span>
</nav>
{/*  Main Header Badge & Titles  */}
<div className="flex flex-col max-w-4xl">
<div className="inline-flex items-center gap-2 self-start px-3 py-1 bg-surface-ice text-primary rounded font-caption-caps text-caption-caps uppercase tracking-wider mb-space-md shadow-sm">
<span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
<span className="">TÜRK HALKLA İLİŞKİLER HAFIZASI VE DÜŞÜNCE PLATFORMU</span>
</div>
<h1 className="font-headline-xl text-headline-xl text-primary tracking-tight font-bold mb-space-md">
          Başkent İletişim Düşüncesi, Akademik Makaleler ve Usta Kalemler
        </h1>
<p className="font-body-lg text-body-lg text-slate-dark max-w-3xl leading-relaxed">
          1990'dan günümüze Ankara'nın kamu diplomasisi, kurumsal itibar, mesleki deontoloji ve iletişim bilimleri hafızasını şekillendiren köşe yazıları, hakemli makaleler ve duayen hatıratları tek bir açık arşivde.
        </p>
</div>
{/*  Quick Metrics Ribbon  */}
<div className="mt-space-xl grid grid-cols-2 md:grid-cols-4 gap-space-md">
<div className="bg-surface-container-lowest p-space-md rounded shadow-sm flex flex-col justify-between">
<span className="font-caption-caps text-caption-caps text-slate-muted uppercase tracking-wider">Koleksiyon</span>
<div className="flex items-baseline gap-2 mt-1">
<span className="font-headline-lg text-headline-lg text-primary font-bold">{articles.length > 0 ? articles.length : "0"}</span>
<span className="font-body-sm text-body-sm text-slate-dark">Makale &amp; Yazı</span>
</div>
<div className="w-full bg-surface-ice h-1 mt-3 rounded overflow-hidden">
<div className="bg-primary h-full w-4/5"></div>
</div>
</div>
<div className="bg-surface-container-lowest p-space-md rounded shadow-sm flex flex-col justify-between">
<span className="font-caption-caps text-caption-caps text-slate-muted uppercase tracking-wider">Yazarlar</span>
<div className="flex items-baseline gap-2 mt-1">
<span className="font-headline-lg text-headline-lg text-secondary font-bold">
  {Array.from(new Set(articles.map((a) => a.author_name).filter(Boolean))).length || (articles.length > 0 ? 1 : 0)}
</span>
<span className="font-body-sm text-body-sm text-slate-dark">Duayen &amp; Akademisyen</span>
</div>
<div className="w-full bg-surface-ice h-1 mt-3 rounded overflow-hidden">
<div className="bg-secondary h-full w-3/4"></div>
</div>
</div>
<div className="bg-surface-container-lowest p-space-md rounded shadow-sm flex flex-col justify-between">
<span className="font-caption-caps text-caption-caps text-slate-muted uppercase tracking-wider">Hakemli Yayın</span>
<div className="flex items-baseline gap-2 mt-1">
<span className="font-headline-lg text-headline-lg text-gold-deep font-bold">
  {articles.filter((a) => a.category === "akademik").length}
</span>
<span className="font-body-sm text-body-sm text-slate-dark">Araştırma Raporu</span>
</div>
<div className="w-full bg-surface-ice h-1 mt-3 rounded overflow-hidden">
<div className="bg-gold-deep h-full w-3/5"></div>
</div>
</div>
<div className="bg-surface-container-lowest p-space-md rounded shadow-sm flex flex-col justify-between">
<span className="font-caption-caps text-caption-caps text-slate-muted uppercase tracking-wider">Lisans Türü</span>
<div className="flex items-center gap-2 mt-1">
<span className="material-symbols-outlined text-primary text-2xl">lock_open</span>
<span className="font-label-md text-label-md text-primary font-bold">Açık Erişim</span>
</div>
<span className="font-body-sm text-body-sm text-slate-muted mt-2">CC BY-NC-ND 4.0</span>
</div>
</div>
</div>
</section>
{/*  INTERACTIVE FILTER & SEARCH SYSTEM  */}
<section className="w-full bg-surface py-space-xl">
<div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop">
<div className="bg-surface-container-lowest p-space-lg rounded shadow-sm flex flex-col gap-space-lg">
{/*  Search Field and Sort  */}
<div className="flex flex-col lg:flex-row gap-space-md items-center justify-between">
<div className="relative w-full lg:w-2/3">
<span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-muted">search</span>
<input
  className="w-full bg-surface-canvas font-body-md text-body-md text-on-surface pl-12 pr-10 py-3 rounded outline-none placeholder:text-slate-muted focus:bg-surface-container-lowest focus:shadow-md transition-all"
  placeholder="Yazı başlığı, yazar veya anahtar kelime ara... (ör. Kriz, Yapay Zeka, Asna)"
  type="text"
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
/>
{searchQuery && (
  <button
    onClick={() => setSearchQuery("")}
    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
  >
    <span className="material-symbols-outlined text-sm">close</span>
  </button>
)}
</div>
<div className="flex items-center gap-space-sm w-full lg:w-auto justify-end">
<span className="font-caption-caps text-caption-caps text-slate-muted uppercase tracking-wider whitespace-nowrap">Sırala:</span>
<div className="relative w-full sm:w-60">
<select
  value={sortBy}
  onChange={(e) => setSortBy(e.target.value)}
  className="w-full bg-surface-canvas font-label-md text-label-md text-on-surface px-4 py-3 rounded outline-none cursor-pointer appearance-none"
>
<option value="newest">En Yeniler (Kronolojik)</option>
<option value="author">Yazar Adına Göre (A-Z)</option>
</select>
<span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-muted pointer-events-none text-base">expand_more</span>
</div>
</div>
</div>
{/*  Category Horizontal Tabs  */}
<div className="flex items-center gap-space-xs overflow-x-auto pb-2 scrollbar-none">
<button
  onClick={() => setActiveCategory("all")}
  className={`px-4 py-2 rounded whitespace-nowrap transition-all ${activeCategory === "all" ? "bg-primary text-on-primary font-bold shadow-sm" : "bg-surface-ice hover:bg-surface-variant text-primary"}`}
>
  Tüm Yazılar ({articles.length})
</button>
<button
  onClick={() => setActiveCategory("usta_saygi")}
  className={`px-4 py-2 rounded whitespace-nowrap transition-all ${activeCategory === "usta_saygi" ? "bg-primary text-on-primary font-bold shadow-sm" : "bg-surface-ice hover:bg-surface-variant text-primary"}`}
>
  Usta'ya Saygı ({articles.filter(a => a.category === "usta_saygi").length})
</button>
<button
  onClick={() => setActiveCategory("akademik")}
  className={`px-4 py-2 rounded whitespace-nowrap transition-all ${activeCategory === "akademik" ? "bg-primary text-on-primary font-bold shadow-sm" : "bg-surface-ice hover:bg-surface-variant text-primary"}`}
>
  Akademik Makaleler ({articles.filter(a => a.category === "akademik").length})
</button>
<button
  onClick={() => setActiveCategory("kose_yazisi")}
  className={`px-4 py-2 rounded whitespace-nowrap transition-all ${activeCategory === "kose_yazisi" ? "bg-primary text-on-primary font-bold shadow-sm" : "bg-surface-ice hover:bg-surface-variant text-primary"}`}
>
  Köşe Yazıları ({articles.filter(a => a.category === "kose_yazisi").length})
</button>
<button
  onClick={() => setActiveCategory("bulten")}
  className={`px-4 py-2 rounded whitespace-nowrap transition-all ${activeCategory === "bulten" ? "bg-primary text-on-primary font-bold shadow-sm" : "bg-surface-ice hover:bg-surface-variant text-primary"}`}
>
  Bültenler & Raporlar ({articles.filter(a => a.category === "bulten").length})
</button>
</div>
</div>
</div>
</section>
{/*  FEATURED EDITORIAL SPOTLIGHT (AYIN BAŞYAZISI)  */}
<section className="w-full bg-surface py-space-xl">
<div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop">
{featuredArticle ? (
  <div className="relative bg-primary text-on-primary rounded-xl overflow-hidden shadow-xl">
    <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-secondary-container/20 rounded-full blur-3xl pointer-events-none"></div>
    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
      <span className="material-symbols-outlined text-[160px]">history_edu</span>
    </div>
    <div className="relative z-10 p-space-xl lg:p-space-2xl grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
      <div className="lg:col-span-8 flex flex-col gap-space-md">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container-lowest/10 backdrop-blur-md text-gold-light rounded font-caption-caps text-caption-caps tracking-wider self-start">
          <span className="material-symbols-outlined text-sm">stars</span>
          <span className="">EDİTÖRÜN SEÇİMİ / AYIN BAŞYAZISI</span>
        </div>
        <h2 className="font-headline-lg text-headline-lg text-on-primary font-bold tracking-tight">
          {featuredArticle.title}
        </h2>
        <blockquote className="bg-primary-container/40 p-space-md rounded-lg pl-space-lg text-on-primary-container font-body-lg text-body-lg italic leading-relaxed">
          “{featuredArticle.summary || featuredArticle.content || ""}”
        </blockquote>
        <div className="flex flex-wrap items-center gap-space-lg pt-space-xs">
          <div className="flex items-center gap-space-sm">
            {featuredArticle.image_url ? (
              <img className="w-12 h-12 rounded-full object-cover shadow-sm" src={featuredArticle.image_url} alt={featuredArticle.author_name || "Yazar"} />
            ) : (
              <div className="w-12 h-12 rounded-full bg-white/20 text-white font-bold flex items-center justify-center text-lg">
                {(featuredArticle.author_name || "A")[0]}
              </div>
            )}
            <div>
              <h3 className="font-label-md text-label-md text-on-primary font-bold">{featuredArticle.author_name}</h3>
              <p className="font-caption-caps text-caption-caps text-on-primary-container">
                {featuredArticle.author_title || featuredArticle.category}
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-space-md text-on-primary-container font-caption-caps text-caption-caps">
            {featuredArticle.read_time && (
              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">schedule</span> {featuredArticle.read_time}</span>
            )}
            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">visibility</span> {featuredArticle.views_count || 1} Okunma</span>
          </div>
        </div>
      </div>
      <div className="lg:col-span-4 bg-surface-container-lowest/10 backdrop-blur-md p-space-lg rounded-xl flex flex-col gap-space-md">
        <span className="font-caption-caps text-caption-caps text-gold-light uppercase tracking-wider font-bold">Yayın Bilgisi</span>
        <p className="font-body-sm text-body-sm text-surface-ice">
          {featuredArticle.summary}
        </p>
        <div className="bg-primary/50 p-space-sm rounded mt-2 flex items-center justify-between font-caption-caps text-caption-caps text-on-primary-container">
          <span className="">Kategori: {featuredArticle.category}</span>
          <Link href={`/yayinlar/${featuredArticle.slug}`} className="bg-gold-deep text-on-primary px-2.5 py-1 rounded font-bold hover:opacity-90">
            Yazıyı Oku →
          </Link>
        </div>
      </div>
    </div>
  </div>
) : loading ? (
  <div className="bg-surface-container-lowest rounded-xl p-10 shadow-sm animate-pulse space-y-4">
    <div className="h-5 w-44 bg-slate-200 rounded-full" />
    <div className="h-8 w-2/3 bg-slate-200 rounded" />
    <div className="h-20 w-full bg-slate-200 rounded-lg" />
  </div>
) : (
  <div className="bg-surface-container-lowest rounded-xl p-10 text-center border border-dashed border-slate-200">
    <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">auto_stories</span>
    <h2 className="font-headline-sm text-headline-sm text-primary font-bold">Henüz Başyazı Yayınlanmadı</h2>
    <p className="font-body-sm text-body-sm text-slate-500 mt-1 mb-4">
      Veritabanında henüz öne çıkan bir başyazı veya akademik makale bulunmuyor.
    </p>
    <Link href="/admin-panel" className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-container transition-colors">
      <span className="material-symbols-outlined text-sm">add_circle</span>
      + Yönetim Panelinden İlk Kaydı Ekle
    </Link>
  </div>
)}
</div>
</section>
{/*  USTA'YA SAYGI ÖZEL HATIRAT & DUAYEN PORTRELERİ  */}
<section className="w-full bg-surface-ice py-space-2xl">
<div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop">
{/*  Section Title & Narrative  */}
<div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-xl">
<div className="max-w-3xl">
<div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container-highest text-primary font-caption-caps text-caption-caps uppercase rounded mb-space-sm">
<span className="material-symbols-outlined text-sm">history_edu</span>
<span className="">ÖZEL KOLEKSİYON</span>
</div>
<h2 className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">
            Usta'ya Saygı Serisi: Türk PR Mesleğinin Kurucu İsimleri ve Mirası
          </h2>
<p className="font-body-md text-body-md text-slate-dark mt-2">
            Mesleğimizin Türkiye'deki ilk adımlarını atan, etik temellerini kuran ve derneğimizin 34 yıllık yolculuğuna ışık tutan usta iletişimcilerin kaleminden tarihi metinler ve hayat dersleri.
          </p>
</div>
</div>
{/*  Duayen Cards Grid  */}
{ustaSaygiArticles.length === 0 ? (
  <div className="bg-surface-container-lowest rounded-xl p-10 text-center border border-dashed border-slate-200">
    <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">history_edu</span>
    <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Usta'ya Saygı Koleksiyonunda Kayıt Yok</h3>
    <p className="font-body-sm text-body-sm text-slate-500 mt-1">
      Veritabanına &quot;usta_saygi&quot; kategorisinde makale eklendiğinde burada listelenecektir.
    </p>
  </div>
) : (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-lg">
    {ustaSaygiArticles.map((item) => (
      <article key={item.id} className="bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden group">
        <div className="p-space-lg flex flex-col flex-grow">
          <div className="flex items-center justify-between mb-space-md">
            <span className="px-2.5 py-1 bg-gold-light/40 text-gold-deep rounded font-caption-caps text-caption-caps uppercase tracking-wider font-bold">Usta Hatıratı</span>
            <span className="font-caption-caps text-caption-caps text-slate-muted">{item.published_at || ""}</span>
          </div>
          <div className="flex items-center gap-space-sm mb-space-md">
            {item.author_avatar || item.image_url ? (
              <img className="w-14 h-14 rounded-full object-cover shadow-sm" src={item.author_avatar || item.image_url} alt={item.author_name} />
            ) : (
              <div className="w-14 h-14 rounded-full bg-surface-ice text-primary font-bold flex items-center justify-center text-lg">
                {(item.author_name || "U")[0]}
              </div>
            )}
            <div>
              <h3 className="font-headline-sm text-headline-sm text-primary font-bold">{item.author_name}</h3>
              <p className="font-caption-caps text-caption-caps text-slate-muted">{item.author_title || "Duayen İletişimci"}</p>
            </div>
          </div>
          <blockquote className="font-body-sm text-body-sm text-slate-dark italic leading-relaxed mb-space-md flex-grow">
            “{item.summary || item.title}”
          </blockquote>
          <p className="font-caption-caps text-caption-caps text-slate-muted mb-space-sm">{item.title}</p>
        </div>
        <div className="bg-surface-canvas px-space-lg py-space-sm flex items-center justify-between">
          <span className="font-caption-caps text-caption-caps text-slate-muted flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">menu_book</span> {item.read_time || "Okuma"}
          </span>
        </div>
      </article>
    ))}
  </div>
)}
</div>
</section>
{/*  LATEST ARTICLES & ACADEMIC ANALYSIS GRID  */}
<section className="w-full bg-surface py-space-2xl">
<div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop">
<div className="flex items-center justify-between mb-space-xl">
<div>
<span className="font-caption-caps text-caption-caps text-slate-muted uppercase tracking-wider">GÜNCEL YAYINLAR</span>
<h2 className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">
            Son Yayınlanan Köşe Yazıları ve Akademik Analizler
          </h2>
</div>
<div className="hidden sm:flex items-center gap-2 font-caption-caps text-caption-caps text-slate-muted">
<span className="w-2 h-2 rounded-full bg-secondary"></span>
<span className="">Haftalık Olarak Güncellenmektedir</span>
</div>
</div>
{/*  Dynamic Articles Grid  */}
{loading ? (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">
    {[1, 2, 3].map((n) => (
      <div key={n} className="bg-surface-container-lowest rounded-xl p-6 shadow-sm animate-pulse space-y-4 border border-slate-100">
        <div className="flex justify-between">
          <div className="h-5 w-24 bg-slate-200 rounded" />
          <div className="h-4 w-20 bg-slate-200 rounded" />
        </div>
        <div className="h-6 w-3/4 bg-slate-200 rounded" />
        <div className="h-16 w-full bg-slate-200 rounded" />
        <div className="flex items-center gap-3 pt-2">
          <div className="w-10 h-10 rounded-full bg-slate-200" />
          <div className="h-4 w-32 bg-slate-200 rounded" />
        </div>
      </div>
    ))}
  </div>
) : filteredArticles.length === 0 ? (
  <div className="bg-surface-container-lowest p-12 rounded-xl text-center border border-dashed border-slate-200">
    <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">auto_stories</span>
    <h3 className="font-headline-sm font-bold text-primary mb-2">Kayıtlı Yayın Bulunamadı</h3>
    <p className="text-slate-500 text-sm max-w-md mx-auto mb-5">
      {searchQuery || activeCategory !== "all"
        ? "Arama kriterlerinize veya seçilen kategoriye uygun yayın bulunamadı. Filtreleri temizleyerek tekrar deneyebilirsiniz."
        : "Henüz yayınlanmış bir makale veya köşe yazısı veritabanında bulunmamaktadır."}
    </p>
    <div className="flex flex-wrap items-center justify-center gap-3">
      {(searchQuery || activeCategory !== "all") && (
        <button
          onClick={() => {
            setSearchQuery("");
            setActiveCategory("all");
          }}
          className="px-5 py-2.5 bg-surface-ice text-primary rounded-lg text-xs font-bold hover:bg-surface-container-high transition-all cursor-pointer"
        >
          Filtreleri Temizle
        </button>
      )}
      <Link
        href="/admin-panel"
        className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary text-white rounded-lg text-xs font-bold shadow hover:bg-primary-container transition-all"
      >
        <span className="material-symbols-outlined text-sm">add_circle</span>
        + Yönetim Panelinden İlk Kaydı Ekle
      </Link>
    </div>
  </div>
) : (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">
    {filteredArticles.map((art) => (
      <article
        key={art.id}
        className="bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden border border-slate-100"
      >
        <div className="p-space-lg flex flex-col flex-grow">
          <div className="flex items-center justify-between mb-space-sm">
            <span className="px-2.5 py-0.5 bg-surface-ice text-primary rounded font-caption-caps text-caption-caps font-semibold">
              {art.category === "usta_saygi"
                ? "Usta'ya Saygı"
                : art.category === "akademik"
                ? "Akademik Makale"
                : art.category === "kose_yazisi"
                ? "Köşe Yazısı"
                : art.category === "bulten"
                ? "Bülten & Rapor"
                : art.category || "Genel"}
            </span>
            <span className="font-caption-caps text-caption-caps text-slate-muted">
              {art.published_at || "Güncel"}
            </span>
          </div>
          <h3 className="font-headline-sm text-headline-sm text-primary font-bold mt-2 hover:text-secondary transition-colors">
            <Link href={`/yayinlar/${art.slug}`}>{art.title}</Link>
          </h3>
          <p className="font-body-sm text-body-sm text-slate-dark mt-space-sm leading-relaxed flex-grow line-clamp-3">
            {art.summary || (art.content ? art.content.slice(0, 160) + "..." : "Yazı özeti yakında eklenecektir.")}
          </p>
          <div className="flex items-center gap-space-sm mt-space-md pt-space-sm">
            {art.image_url ? (
              <img
                className="w-10 h-10 rounded-full object-cover"
                src={art.image_url}
                alt={art.author_name || "Yazar"}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-surface-ice text-primary flex items-center justify-center font-bold text-sm">
                {(art.author_name || "A")[0]}
              </div>
            )}
            <div>
              <h4 className="font-label-sm text-label-sm text-on-surface font-bold">
                {art.author_name || "AHİD Yayın Kurulu"}
              </h4>
              <p className="font-caption-caps text-caption-caps text-slate-muted">
                {art.board_members?.role_title || "Yazar"}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-surface-canvas px-space-lg py-space-sm flex items-center justify-between text-slate-muted font-caption-caps text-caption-caps">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">visibility</span> {art.views_count || 0} Okunma
          </span>
          <Link
            className="font-label-sm text-label-sm text-primary font-bold hover:text-secondary inline-flex items-center gap-1"
            href={`/yayinlar/${art.slug}`}
          >
            Tam Metin <span className="material-symbols-outlined text-xs">arrow_forward</span>
          </Link>
        </div>
      </article>
    ))}
  </div>
)}
{/*  Pagination Component  */}
<div className="mt-space-2xl flex flex-col sm:flex-row items-center justify-between gap-space-md bg-surface-container-lowest p-space-md rounded-xl shadow-sm">
<span className="font-caption-caps text-caption-caps text-slate-muted">
  Sayfa <span className="font-bold text-on-surface">1</span> / 1 (Toplam {filteredArticles.length} Makale Listelendi)
</span>
<div className="flex items-center gap-1">
<button className="w-10 h-10 flex items-center justify-center rounded text-slate-muted hover:bg-surface-ice disabled:opacity-30 disabled:pointer-events-none" disabled>
<span className="material-symbols-outlined text-sm">chevron_left</span>
</button>
<button className="w-10 h-10 flex items-center justify-center rounded bg-primary text-on-primary font-label-md text-label-md">1</button>
<button className="w-10 h-10 flex items-center justify-center rounded text-on-surface hover:bg-surface-ice font-label-md text-label-md">2</button>
<button className="w-10 h-10 flex items-center justify-center rounded text-on-surface hover:bg-surface-ice font-label-md text-label-md">3</button>
<span className="w-10 h-10 flex items-center justify-center text-slate-muted">...</span>
<button className="w-10 h-10 flex items-center justify-center rounded text-on-surface hover:bg-surface-ice font-label-md text-label-md">38</button>
<button className="w-10 h-10 flex items-center justify-center rounded text-on-surface hover:bg-surface-ice">
<span className="material-symbols-outlined text-sm">chevron_right</span>
</button>
</div>
</div>
</div>
</section>
{/*  CALL FOR PAPERS & AUTHORS COLLABORATION BANNER  */}
<section className="w-full bg-surface-ice py-space-2xl">
<div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl bg-surface-container-lowest p-space-xl lg:p-space-2xl rounded-2xl shadow-md">
{/*  Left: Call for Papers  */}
<div className="lg:col-span-7 flex flex-col justify-between">
<div>
<div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-ice text-primary rounded font-caption-caps text-caption-caps uppercase font-bold mb-space-sm">
<span className="material-symbols-outlined text-sm">edit_document</span>
<span className="">AKADEMİK &amp; SEKTÖREL KATKI ÇAĞRISI</span>
</div>
<h3 className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">
              AHİD Yayın Kurulu'na Yazı veya Akademik Makale Gönderin
            </h3>
<p className="font-body-md text-body-md text-slate-dark mt-space-sm leading-relaxed">
              İletişim bilimi, kamu diplomasisi, kurum içi iletişim ve dijital itibar konularında kaleme aldığınız özgün analizleri AHİD'in 30 bini aşkın kurumsal ve akademik okuyucu kitlesiyle buluşturun.
            </p>
<div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm my-space-md font-body-sm text-body-sm text-slate-muted">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-secondary text-base">check_circle</span>
<span className="">800 - 2.500 kelime arası metinler</span>
</div>
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-secondary text-base">check_circle</span>
<span className="">Mesleki Deontoloji İlkelerine Uygunluk</span>
</div>
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-secondary text-base">check_circle</span>
<span className="">Akademik Hakem Kurulu İncelemesi</span>
</div>
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-secondary text-base">check_circle</span>
<span className="">DOI ve Açık Erişim İndeksleme</span>
</div>
</div>
</div>
<div className="flex flex-wrap items-center gap-space-sm pt-space-sm">
<a className="inline-flex items-center gap-2 bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md px-6 py-3 rounded shadow-md transition-all" href="#">
<span className="material-symbols-outlined text-sm">upload_file</span>
<span className="">Online Makale / Yazı Teslim Et</span>
</a>
<a className="inline-flex items-center gap-2 bg-surface-ice hover:bg-surface-variant text-primary font-label-md text-label-md px-5 py-3 rounded transition-colors" href="#">
<span className="material-symbols-outlined text-sm">description</span>
<span className="">Yazı Gönderim Yönergesi (PDF)</span>
</a>
</div>
</div>
{/*  Right: Newsletter & Archive Digest Subscription  */}
<div className="lg:col-span-5 bg-surface-ice p-space-lg rounded-xl flex flex-col justify-between">
<div>
<div className="flex items-center gap-2 text-gold-deep mb-2">
<span className="material-symbols-outlined text-xl">mark_email_read</span>
<span className="font-caption-caps text-caption-caps uppercase tracking-wider font-bold">HAFTALIK YAZI SEÇKİSİ</span>
</div>
<h4 className="font-headline-sm text-headline-sm text-primary font-bold">
              Başkentin İletişim Hafızası Her Perşembe E-Postanızda
            </h4>
<p className="font-body-sm text-body-sm text-slate-dark mt-2 leading-relaxed">
              Editörlerimizce derlenen özetler, duayen hatıratları ve uluslararası PR literatüründen en güncel çeviriler düzenli bültenimizde.
            </p>
</div>
<form className="flex flex-col gap-space-sm mt-space-md">
<input className="w-full bg-surface-container-lowest font-body-sm text-body-sm text-on-surface px-4 py-3 rounded outline-none placeholder:text-slate-muted focus:shadow-sm" placeholder="Kurumsal e-posta adresiniz..." required type="email" />
<button className="w-full inline-flex items-center justify-center gap-2 bg-[#0b3d91] hover:bg-[#082b66] text-white font-semibold px-5 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 active:scale-95" type="submit">
<span className="">Seçkiye Ücretsiz Abone Ol</span>
<span className="material-symbols-outlined text-sm">arrow_forward</span>
</button>
<p className="font-caption-caps text-caption-caps text-slate-muted text-center mt-1">
              Dilediğiniz an abonelikten çıkabilirsiniz. KVKK uyumludur.
            </p>
</form>
</div>
</div>
</div>
</section>
</div></main>
      <Footer />
    </>
  );
}
