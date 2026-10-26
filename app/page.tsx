"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CountUpNumber from "@/components/CountUpNumber";

export default function HomePage() {
  const [cms, setCms] = useState<Record<string, string>>({});
  const [liveStats, setLiveStats] = useState<{
    members: number;
    years: number;
    events: number;
    partners: number;
  }>({
    members: 0,
    years: 36,
    events: 0,
    partners: 0,
  });

  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [activeFilter, setActiveFilter] = useState("Tümü");
  const [news, setNews] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/cms?page=home").then((res) => res.json()).catch(() => ({})),
      fetch("/api/articles").then((res) => res.json()).catch(() => ({})),
      fetch("/api/events").then((res) => res.json()).catch(() => ({})),
    ])
      .then(([cmsData, articlesData, eventsData]) => {
        if (cmsData?.success && cmsData.variables) setCms(cmsData.variables);
        if (cmsData?.success && cmsData.liveStats) setLiveStats(cmsData.liveStats);
        if (articlesData?.success && articlesData.articles) setNews(articlesData.articles);
        if (eventsData?.success && eventsData.events) setEvents(eventsData.events);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const rawSeconds = parseInt(cms.summit_countdown_seconds || "0", 10);
    if (!rawSeconds || rawSeconds <= 0) {
      setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      return;
    }
    let totalSeconds = rawSeconds;
    const interval = setInterval(() => {
      if (totalSeconds <= 0) return;
      totalSeconds--;
      setCountdown({
        days: Math.floor(totalSeconds / 86400),
        hours: Math.floor((totalSeconds % 86400) / 3600),
        minutes: Math.floor((totalSeconds % 3600) / 60),
        seconds: totalSeconds % 60,
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cms.summit_countdown_seconds]);

  const featuredEvent = events.find((e) => e.is_featured) || events[0];

  const filteredNews = news.filter((item) => {
    if (activeFilter === "Tümü") return true;
    if (activeFilter === "Ziyaretler") return item.category === "bulten" || item.category === "usta_saygi";
    if (activeFilter === "Akademi") return item.category === "akademik";
    if (activeFilter === "Duyurular") return item.category === "kose_yazisi";
    return true;
  });

  const featuredArticle = news.find((a) => a.category === "akademik" || a.category === "kose_yazisi") || news[0];
  const masterTributes = news.filter((a) => a.category === "usta_saygi").slice(0, 2);

  return (
    <>
      <Navbar />
      <main className="w-full pt-[7.5rem] bg-surface min-h-[calc(100vh-28rem)]"><div className="flex flex-col w-full">
{/*  HERO SECTION  */}
<section className="relative w-full overflow-hidden bg-gradient-to-b from-surface-ice/60 via-surface to-background py-space-2xl lg:py-space-3xl">
<div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
{/*  Left Column: Institutional Narrative  */}
<div className="lg:col-span-7 flex flex-col items-start">
{/*  Pill Badge  */}
<div className="inline-flex items-center gap-space-xs px-3.5 py-1.5 rounded-full bg-gold-light/40 text-gold-deep border-0 shadow-sm mb-space-md">
<span className="text-base leading-none">🏛️</span>
<span className="font-caption-caps text-caption-caps uppercase tracking-wider font-bold">1990'dan Bugüne İletişim Mesleğinin Güvencesi</span>
</div>
{/*  Headline  */}
<h1 className="font-display-hero text-headline-xl lg:text-display-hero text-primary tracking-tight font-extrabold leading-tight mb-space-md">
            {cms.home_hero_title || "İletişim Mesleğinin Geleceğini Birlikte Kuruyoruz"}
</h1>
{/*  Lead Paragraph  */}
<p className="font-body-lg text-body-lg text-slate-dark max-w-2xl leading-relaxed mb-space-xl">
            {cms.home_hero_subtitle || "Ankara Halkla İlişkiler Derneği; kamu, özel sektör ve akademi ekseninde stratejik iletişimin etik standartlarını yükselten, 30 yılı aşkın köklü mirasıyla sektöre yön veren çatı meslek kuruluşudur."}
          </p>
{/*  CTAs & Action Row  */}
<div className="flex flex-wrap items-center gap-space-md w-full sm:w-auto">
<a className="inline-flex items-center justify-center gap-2 bg-[#0b3d91] hover:bg-[#082b66] text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200" href="/kurumsal">
<span className="">AHİD'i Keşfedin</span>
<span className="material-symbols-outlined text-lg">arrow_forward</span>
</a>
<a className="inline-flex items-center justify-center gap-2 border border-[#cfdaf3] bg-white text-[#0b3d91] hover:bg-[#f0f3ff] hover:border-[#0b3d91]/40 font-semibold px-6 py-3 rounded-lg transition-all duration-200 active:scale-95" href="/uyelik">
<span className="">Üyelik Başvurusu</span>
</a>
<a className="inline-flex items-center gap-1.5 text-secondary hover:text-primary font-label-md text-label-md transition-colors px-2 py-1" href="/yayinlar">
<span className="material-symbols-outlined text-lg text-gold-deep">description</span>
<span className="underline decoration-gold-light decoration-2 underline-offset-4">2026 PR Raporunu İncele</span>
</a>
</div>
{/*  Editorial Micro-Trust Bar  */}
<div className="mt-space-xl pt-space-md flex items-center gap-space-lg text-slate-muted font-body-sm text-body-sm">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary text-base">verified</span>
<span className="">Kamu &amp; Akreditasyon Onaylı</span>
</div>
<div className="hidden sm:flex items-center gap-space-xs">
<span className="material-symbols-outlined text-gold-deep text-base">verified_user</span>
<span className="">IPRA &amp; Ulusal Etik Kodlar</span>
</div>
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary text-base">school</span>
<span className="">14+ İletişim Fakültesi Ağı</span>
</div>
</div>
</div>
{/*  Right Column: Interactive Event Spotlight Card  */}
<div className="lg:col-span-5 relative">
  {featuredEvent || cms.summit_title ? (
    <div className="relative bg-surface-container-lowest rounded-xl shadow-xl overflow-hidden p-space-lg">
      {/*  Top Status Bar  */}
      <div className="flex items-center justify-between mb-space-md">
        <span className="inline-flex items-center gap-1.5 bg-error-container text-error px-2.5 py-1 rounded-full font-caption-caps text-caption-caps font-bold">
          <span className="w-2 h-2 rounded-full bg-error animate-ping"></span>
          CANLI GÜNDEM
        </span>
        <span className="font-caption-caps text-caption-caps uppercase tracking-wider text-slate-muted bg-surface-container px-2.5 py-1 rounded">
          {featuredEvent?.category || cms.summit_date || "Etkinlik"}
        </span>
      </div>
      {/*  Visual Media Showcase  */}
      {featuredEvent?.image_url && (
        <div className="relative h-48 w-full rounded overflow-hidden mb-space-md shadow-sm">
          <img className="w-full h-full object-cover" src={featuredEvent.image_url} alt={featuredEvent.title} />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent flex items-end p-space-md">
            <span className="font-headline-sm text-headline-sm text-on-primary font-bold">{featuredEvent.title}</span>
          </div>
        </div>
      )}
      {!featuredEvent?.image_url && (
        <h3 className="font-headline-sm text-headline-sm text-primary font-bold mb-space-sm">
          {featuredEvent?.title || cms.summit_title}
        </h3>
      )}
      {/*  Details  */}
      <p className="font-body-sm text-body-sm text-slate-dark mb-space-md leading-relaxed">
        {featuredEvent?.summary || featuredEvent?.description || cms.summit_location || ""}
      </p>
      {/*  Action Row  */}
      <div className="flex items-center justify-between pt-2">
        <span className="font-caption-caps text-caption-caps text-slate-muted font-medium">
          {featuredEvent?.event_date || cms.summit_date || ""} {featuredEvent?.location ? `• ${featuredEvent.location}` : ""}
        </span>
        <Link className="inline-flex items-center gap-1 bg-gold-light hover:bg-gold-deep text-gold-deep hover:text-on-primary px-3.5 py-1.5 rounded font-label-sm text-label-sm font-bold shadow-sm transition-all" href={featuredEvent ? `/etkinlikler/${featuredEvent.id}` : "/etkinlikler"}>
          <span className="">Yerinizi Ayırtın</span>
          <span className="material-symbols-outlined text-sm">confirmation_number</span>
        </Link>
      </div>
    </div>
  ) : loading ? (
    <div className="bg-surface-container-lowest rounded-xl shadow-md p-space-xl animate-pulse space-y-4">
      <div className="flex justify-between">
        <div className="h-6 w-28 bg-slate-200 rounded-full" />
        <div className="h-6 w-20 bg-slate-200 rounded" />
      </div>
      <div className="h-44 w-full bg-slate-200 rounded-lg" />
      <div className="h-4 w-3/4 bg-slate-200 rounded" />
      <div className="h-8 w-full bg-slate-200 rounded" />
    </div>
  ) : (
    <div className="relative bg-surface-container-lowest rounded-xl shadow-md border border-dashed border-slate-200 p-space-xl text-center">
      <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">event_note</span>
      <h3 className="font-headline-sm text-headline-sm text-primary font-bold mb-1">Canlı Gündem &amp; Vitrin Etkinliği</h3>
      <p className="font-body-sm text-body-sm text-slate-500 mb-4">
        Veritabanında henüz aktif bir zirve veya vitrin etkinliği bulunmuyor.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Link href="/admin-panel" className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-container transition-colors">
          <span className="material-symbols-outlined text-sm">add_circle</span>
          + Yönetim Panelinden İlk Kaydı Ekle
        </Link>
        <a href="#newsletter" className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg bg-surface-ice text-primary text-xs font-bold hover:bg-surface-container-high transition-colors">
          <span className="material-symbols-outlined text-sm">notifications</span>
          Bültene Abone Ol
        </a>
      </div>
    </div>
  )}
</div>
</div>
</div>
</section>
{/*  METRICS & TRUSTED AFFILIATIONS BAR  */}
<section className="w-full bg-primary text-on-primary py-space-xl shadow-inner relative z-10">
<div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop">
{/*  4 Proven Statistics (Auto-synced with Supabase & Editable via Admin CMS)  */}
<div className="grid grid-cols-2 md:grid-cols-4 gap-space-lg text-center divide-x-0">
<div className="flex flex-col items-center">
<div className="flex items-baseline gap-1 font-display-hero text-headline-xl lg:text-headline-xl font-extrabold text-gold-light">
<CountUpNumber
  value={
    cms.home_stat_members !== undefined && cms.home_stat_members !== ""
      ? cms.home_stat_members
      : liveStats.members
  }
  suffix="+"
/>
</div>
<p className="font-label-md text-label-md font-semibold text-on-primary mt-1">
  {cms.home_stat_members_label || "Seçkin İletişim Profesyoneli"}
</p>
<span className="font-caption-caps text-caption-caps text-on-primary-container">Aktif ve Onursal Üye Tabanı</span>
</div>
<div className="flex flex-col items-center">
<div className="flex items-baseline gap-1 font-display-hero text-headline-xl lg:text-headline-xl font-extrabold text-white">
<CountUpNumber
  value={
    cms.home_stat_years !== undefined && cms.home_stat_years !== ""
      ? cms.home_stat_years
      : liveStats.years
  }
  suffix="+"
/>
</div>
<p className="font-label-md text-label-md font-semibold text-on-primary mt-1">
  {cms.home_stat_years_label || "Yıllık Kurumsal Hafıza"}
</p>
<span className="font-caption-caps text-caption-caps text-on-primary-container">1990&apos;dan Bugüne Kesintisiz</span>
</div>
<div className="flex flex-col items-center">
<div className="flex items-baseline gap-1 font-display-hero text-headline-xl lg:text-headline-xl font-extrabold text-gold-light">
<CountUpNumber
  value={
    cms.home_stat_events !== undefined && cms.home_stat_events !== ""
      ? cms.home_stat_events
      : liveStats.events
  }
  suffix="+"
/>
</div>
<p className="font-label-md text-label-md font-semibold text-on-primary mt-1">
  {cms.home_stat_events_label || "Konferans & Atölye"}
</p>
<span className="font-caption-caps text-caption-caps text-on-primary-container">Başkentte Mesleki Zirveler</span>
</div>
<div className="flex flex-col items-center">
<div className="flex items-baseline gap-1 font-display-hero text-headline-xl lg:text-headline-xl font-extrabold text-white">
<CountUpNumber
  value={
    cms.home_stat_partners !== undefined && cms.home_stat_partners !== ""
      ? cms.home_stat_partners
      : liveStats.partners
  }
  suffix="+"
/>
</div>
<p className="font-label-md text-label-md font-semibold text-on-primary mt-1">
  {cms.home_stat_partners_label || "Akademik & Sektörel Ortaklık"}
</p>
<span className="font-caption-caps text-caption-caps text-on-primary-container">Üniversite ve Kamu Protokolleri</span>
</div>
</div>
{/*  Partner Badges Stream  */}
<div className="mt-space-xl pt-space-lg bg-primary-container/40 rounded-xl px-space-lg py-space-md flex flex-wrap items-center justify-between gap-space-md">
<span className="font-caption-caps text-caption-caps text-gold-light uppercase tracking-widest font-bold">Stratejik Paydaşlar:</span>
<div className="flex flex-wrap items-center gap-space-xl font-label-md text-label-md text-on-primary/80">
<span className="hover:text-gold-light transition-colors flex items-center gap-1">
<span className="material-symbols-outlined text-sm">account_balance</span> Ankara Kent Konseyi
          </span>
<span className="hover:text-gold-light transition-colors flex items-center gap-1">
<span className="material-symbols-outlined text-sm">school</span> Ankara Üniversitesi İletişim Fakültesi
          </span>
<span className="hover:text-gold-light transition-colors flex items-center gap-1">
<span className="material-symbols-outlined text-sm">menu_book</span> Hacı Bayram Veli Üniversitesi
          </span>
<span className="hover:text-gold-light transition-colors flex items-center gap-1">
<span className="material-symbols-outlined text-sm">hub</span> Türkiye İtibar Enstitüsü
          </span>
</div>
</div>
</div>
</section>
{/*  STRATEGIC FOCUS & ABOUT MANIFESTO  */}
<section className="py-space-3xl bg-surface-canvas">
<div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start mb-space-2xl">
<div className="lg:col-span-5">
<span className="font-caption-caps text-caption-caps text-gold-deep uppercase tracking-wider font-bold mb-space-xs block">Kurumsal Misyon &amp; Değerler</span>
<h2 className="font-headline-xl text-headline-xl text-primary font-bold tracking-tight leading-tight mb-space-md">
            Ankara’da İletişim Mesleğinin Standartlarını Birlikte Yükseltiyoruz
          </h2>
<div className="p-space-md bg-surface-ice rounded-lg shadow-sm mb-space-md">
<p className="font-headline-sm text-headline-sm text-primary font-semibold italic">
              "Etik, şeffaf ve güçlü bir iletişim mesleği için bir aradayız."
            </p>
</div>
<p className="font-body-md text-body-md text-slate-dark leading-relaxed mb-space-md">
            Ankara Halkla İlişkiler Derneği; iletişim profesyonellerini, akademisyenleri ve sektör paydaşlarını bir araya getirerek mesleğin etik, şeffaf ve sürdürülebilir biçimde gelişmesine öncülük eder. Mesleki gelişim, sektörel dayanışma ve akademik iş birliği eksenlerinde kararlı çalışmalar yürütürüz.
          </p>
<a className="inline-flex items-center gap-2 font-label-md text-label-md text-primary hover:text-secondary font-bold transition-colors" href="/kurumsal">
<span className="">Kurumsal Belgelerimizi ve Tüzüğümüzü İnceleyin</span>
<span className="material-symbols-outlined text-base">east</span>
</a>
</div>
{/*  3 Interactive Focus Pillar Cards  */}
<div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-3 gap-space-md">
{/*  Pillar 1  */}
<div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
<div>
<div className="w-12 h-12 rounded bg-surface-ice flex items-center justify-center text-primary mb-space-md">
<span className="material-symbols-outlined text-2xl">school</span>
</div>
<h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-space-xs">Akademik &amp; Sektörel Köprü</h3>
<p className="font-body-sm text-body-sm text-slate-muted leading-relaxed">
                İletişim fakülteleriyle ortak sempozyumlar, bilimsel kongreler, öğrenci staj eşleştirmeleri ve kıdemli mentörlük programları.
              </p>
</div>
<div className="pt-space-md mt-space-md flex items-center gap-1 font-label-sm text-label-sm text-secondary font-semibold">
<span className="">Akademi İş Birlikleri</span>
<span className="material-symbols-outlined text-sm">chevron_right</span>
</div>
</div>
{/*  Pillar 2  */}
<div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
<div>
<div className="w-12 h-12 rounded bg-gold-light/40 flex items-center justify-center text-gold-deep mb-space-md">
<span className="material-symbols-outlined text-2xl">verified</span>
</div>
<h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-space-xs">Mesleki Etik &amp; Standartlar</h3>
<p className="font-body-sm text-body-sm text-slate-muted leading-relaxed">
                Dijital PR, dezenformasyonla mücadele, şeffaf itibar yönetimi ve kriz süreçlerinde ulusal mesleki etik rehberliği.
              </p>
</div>
<div className="pt-space-md mt-space-md flex items-center gap-1 font-label-sm text-label-sm text-gold-deep font-semibold">
<span className="">Etik Tüzüğümüz</span>
<span className="material-symbols-outlined text-sm">chevron_right</span>
</div>
</div>
{/*  Pillar 3  */}
<div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
<div>
<div className="w-12 h-12 rounded bg-surface-container flex items-center justify-center text-primary mb-space-md">
<span className="material-symbols-outlined text-2xl">groups</span>
</div>
<h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-space-xs">Güçlü Başkent Network'ü</h3>
<p className="font-body-sm text-body-sm text-slate-muted leading-relaxed">
                Ankara bürokrasisi, kamu kurumları, basın temsilcileri ve özel sektör liderlerini birleştiren periyodik networking buluşmaları.
              </p>
</div>
<div className="pt-space-md mt-space-md flex items-center gap-1 font-label-sm text-label-sm text-primary font-semibold">
<span className="">İletişim Buluşmaları</span>
<span className="material-symbols-outlined text-sm">chevron_right</span>
</div>
</div>
</div>
</div>
{/*  Live Strategic Metric Visualization Inline SVG Banner  */}
<div className="w-full bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col md:flex-row items-center justify-between gap-space-lg">
<div className="flex items-center gap-space-md">
<div className="w-14 h-14 rounded-full bg-primary-container text-on-primary flex items-center justify-center">
<span className="material-symbols-outlined text-2xl">analytics</span>
</div>
<div>
<h4 className="font-headline-sm text-headline-sm font-bold text-primary">Sektörel Etki Raporu &amp; Mesleki Dizilim</h4>
<p className="font-body-sm text-body-sm text-slate-muted">AHİD üyelerinin sektörel dağılımı: %42 Kurumsal İletişim, %28 Akademi, %18 Kamu/Bürokrasi, %12 Medya &amp; Ajans.</p>
</div>
</div>
{/*  Compact Inline Sparkline/Distribution Graphic  */}
<div className="flex items-center gap-4 w-full md:w-auto">
<div className="flex flex-col gap-1 w-full md:w-64">
<div className="flex justify-between font-caption-caps text-caption-caps text-slate-dark">
<span className="">Kurumsal / Ajans</span>
<span className="font-bold text-primary">%54</span>
</div>
<div className="w-full bg-surface-container h-2.5 rounded-full overflow-hidden flex">
<div className="bg-primary h-full" style={{ width: "54%" }}></div>
<div className="bg-secondary h-full" style={{ width: "28%" }}></div>
<div className="bg-gold-light h-full" style={{ width: "18%" }}></div>
</div>
<div className="flex justify-between font-caption-caps text-caption-caps text-slate-muted">
<span className="">Akademi &amp; Kamu Gücü</span>
<span className="font-bold text-secondary">%46</span>
</div>
</div>
<a className="whitespace-nowrap bg-surface-ice text-primary hover:bg-secondary hover:text-on-primary px-4 py-2 rounded font-label-sm text-label-sm font-semibold transition-all shadow-sm" data-path="calismalarimiz" href="#">
            Tüm Çalışmalarımız
          </a>
</div>
</div>
</div>
</section>
{/*  NEWS & AGENDA SECTION  */}
<section className="py-space-3xl bg-surface">
<div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop">
{/*  Section Header & Filter Tabs  */}
<div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-xl">
<div>
<span className="font-caption-caps text-caption-caps text-primary uppercase tracking-wider font-bold block mb-1">Gündem</span>
<h2 className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight">Öne Çıkan Haberler &amp; Ziyaretler</h2>
<p className="font-body-sm text-body-sm text-slate-muted mt-1">Başkentte halkla ilişkiler mesleğini güçlendiren güncel faaliyetlerimiz ve bildirilerimiz.</p>
</div>
{/*  Filter Pills  */}
<div className="flex flex-wrap items-center gap-2" id="news-filter-group">
<button className="px-4 py-1.5 rounded-full font-label-sm text-label-sm font-bold bg-primary text-on-primary shadow-sm" type="button">Tümü</button>
<button className="px-4 py-1.5 rounded-full font-label-sm text-label-sm font-medium bg-surface-container text-on-surface-variant hover:bg-surface-ice transition-colors" type="button">Dernek Haberleri</button>
<button className="px-4 py-1.5 rounded-full font-label-sm text-label-sm font-medium bg-surface-container text-on-surface-variant hover:bg-surface-ice transition-colors" type="button">Ziyaretler &amp; İş Birlikleri</button>
<button className="px-4 py-1.5 rounded-full font-label-sm text-label-sm font-medium bg-surface-container text-on-surface-variant hover:bg-surface-ice transition-colors" type="button">Duyurular</button>
</div>
</div>
{/*  Dynamic Featured News Cards  */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
  {loading ? (
    [1, 2, 3].map((n) => (
      <div key={n} className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm p-5 animate-pulse space-y-4">
        <div className="h-44 w-full bg-slate-200 rounded-lg" />
        <div className="h-5 w-3/4 bg-slate-200 rounded" />
        <div className="h-4 w-full bg-slate-200 rounded" />
        <div className="h-4 w-1/2 bg-slate-200 rounded" />
      </div>
    ))
  ) : filteredNews.length === 0 ? (
    <div className="col-span-full bg-surface-container-lowest p-8 rounded-xl text-center border border-dashed border-slate-200">
      <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">article</span>
      <h4 className="font-headline-sm font-bold text-primary mb-1">Henüz yayınlanmış haber veya makale bulunmuyor</h4>
      <p className="text-sm text-slate-500 mb-4">Veritabanına yeni bir yayın eklendiğinde bu alanda listelenecektir.</p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Link href="/admin-panel" className="inline-flex items-center gap-1 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-container transition-colors">
          <span className="material-symbols-outlined text-sm">add_circle</span>
          + Yönetim Panelinden İlk Kaydı Ekle
        </Link>
        <a href="#newsletter" className="inline-flex items-center gap-1 px-4 py-2 bg-surface-ice text-primary text-xs font-semibold rounded-lg hover:bg-surface-container-high transition-colors">
          Bültene Abone Ol
        </a>
      </div>
    </div>
  ) : (
    filteredNews.slice(0, 3).map((item, idx) => (
      <article key={item.id || idx} className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group">
        {item.image_url && (
          <div className="relative h-52 w-full overflow-hidden bg-surface-container">
            <img
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              alt={item.title}
              src={item.image_url}
            />
            <span className="absolute top-3 left-3 bg-primary text-on-primary font-caption-caps text-caption-caps px-2.5 py-1 rounded shadow-sm">
              {item.category === "akademik" ? "Akademik" : item.category === "usta_saygi" ? "Usta'ya Saygı" : "Köşe Yazısı"}
            </span>
            <span className="absolute bottom-3 right-3 bg-inverse-surface/80 text-inverse-on-surface font-caption-caps text-caption-caps px-2.5 py-1 rounded backdrop-blur-sm">
              {item.published_at || ""}
            </span>
          </div>
        )}
        <div className="p-space-lg flex flex-col flex-1 justify-between">
          <div>
            <Link href={`/yayinlar/${item.slug}`}>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold leading-snug group-hover:text-primary transition-colors mb-space-xs">
                {item.title}
              </h3>
            </Link>
            <p className="font-body-sm text-body-sm text-slate-dark leading-relaxed line-clamp-3">
              {item.summary || ""}
            </p>
          </div>
          <div className="pt-space-md mt-space-md flex items-center justify-between">
            <span className="font-caption-caps text-caption-caps text-slate-muted">{item.author_name}</span>
            <Link className="inline-flex items-center gap-1 font-label-sm text-label-sm text-primary font-bold group-hover:underline" href={`/yayinlar/${item.slug}`}>
              <span>Devamını Oku</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        </div>
      </article>
    ))
  )}
</div>
{/*  View All News Link  */}
<div className="text-center mt-space-xl">
<a className="inline-flex items-center gap-2 px-6 py-3 rounded bg-surface-container-high hover:bg-surface-variant text-primary font-label-md text-label-md font-semibold transition-all" href="/yayinlar">
<span className="">Tüm Basın Bültenleri ve Duyuru Arşivini İncele</span>
<span className="material-symbols-outlined text-base">arrow_forward</span>
</a>
</div>
</div>
</section>
{/*  EVENTS & AHİD CALENDAR  */}
<section className="py-space-3xl bg-surface-container-low">
<div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop">
{/*  Section Header  */}
<div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-xl">
<div>
<span className="font-caption-caps text-caption-caps text-gold-deep uppercase tracking-wider font-bold block mb-1">Takvim &amp; Eğitim</span>
<h2 className="font-headline-xl text-headline-xl text-primary font-bold tracking-tight">Etkinlikler &amp; Masterclass Programları</h2>
<p className="font-body-sm text-body-sm text-slate-muted mt-1">İletişim teknolojileri, kriz yönetimi ve itibar mimarisinde başkent buluşmaları.</p>
</div>
<div className="flex items-center gap-2">
<button className="px-4 py-2 rounded font-label-sm text-label-sm font-bold bg-primary text-on-primary shadow-sm">Yaklaşan Etkinlikler</button>
<button className="px-4 py-2 rounded font-label-sm text-label-sm font-semibold bg-surface-container-lowest text-slate-muted hover:text-primary transition-colors">Geçmiş Etkinlik Arşivi</button>
</div>
</div>
{/*  Featured Main Event Box + Calendar Aside  */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
{/*  Big Featured Masterclass Card  */}
<div className="lg:col-span-8 bg-surface-container-lowest rounded-xl p-space-lg lg:p-space-xl shadow-md flex flex-col justify-between">
  {featuredEvent ? (
    <>
      <div>
        <div className="flex flex-wrap items-center justify-between gap-space-sm mb-space-md">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-ice text-primary font-caption-caps text-caption-caps font-bold">
            <span className="material-symbols-outlined text-sm">event</span>
            {featuredEvent.category}
          </span>
          <span className="inline-flex items-center gap-1 text-gold-deep font-label-sm text-label-sm font-bold bg-gold-light/40 px-3 py-1 rounded">
            <span className="w-2 h-2 rounded-full bg-gold-deep"></span>
            {featuredEvent.registration_open ? "Kayıtlar Açık" : "Planlanan Etkinlik"}
          </span>
        </div>
        <h3 className="font-headline-lg text-headline-lg text-primary font-extrabold mb-space-sm">
          {featuredEvent.title}
        </h3>
        <p className="font-body-md text-body-md text-slate-dark leading-relaxed mb-space-lg">
          {featuredEvent.description || featuredEvent.summary}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md p-space-md bg-surface-ice/50 rounded-lg mb-space-lg">
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-xl">calendar_today</span>
            <div>
              <span className="block font-caption-caps text-caption-caps text-slate-muted uppercase">Tarih &amp; Saat</span>
              <span className="font-label-md text-label-md font-bold text-on-surface">
                {featuredEvent.event_date} {featuredEvent.event_time ? `| ${featuredEvent.event_time}` : ""}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-primary text-xl">location_on</span>
            <div>
              <span className="block font-caption-caps text-caption-caps text-slate-muted uppercase">Etkinlik Alanı</span>
              <span className="font-label-md text-label-md font-bold text-on-surface">{featuredEvent.location}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-space-md pt-space-md">
        <Link className="inline-flex items-center gap-1.5 px-5 py-2 rounded bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-bold shadow transition-all" href={`/etkinlikler/${featuredEvent.id}`}>
          <span className="">Detaylı Program &amp; Kayıt</span>
          <span className="material-symbols-outlined text-base">arrow_forward</span>
        </Link>
      </div>
    </>
  ) : loading ? (
    <div className="animate-pulse space-y-4 py-6">
      <div className="h-6 w-40 bg-slate-200 rounded-full" />
      <div className="h-8 w-3/4 bg-slate-200 rounded" />
      <div className="h-16 w-full bg-slate-200 rounded" />
      <div className="h-20 w-full bg-slate-200 rounded-lg" />
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">calendar_month</span>
      <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Öne Çıkan Etkinlik Bulunmuyor</h3>
      <p className="font-body-sm text-body-sm text-slate-500 mt-1 max-w-md mb-4">
        Veritabanında henüz kayıtlı bir eğitim, zirve veya masterclass etkinliği yer almamaktadır.
      </p>
      <Link href="/admin-panel" className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-container transition-colors">
        <span className="material-symbols-outlined text-sm">add_circle</span>
        + Yönetim Panelinden İlk Kaydı Ekle
      </Link>
    </div>
  )}
</div>
{/*  Mini Calendar & Upcoming List Aside  */}
<div className="lg:col-span-4 flex flex-col gap-space-md">
  {events.length === 0 ? (
    <div className="bg-surface-container-lowest rounded-xl p-6 text-center text-slate-500 text-sm border border-dashed border-slate-200">
      <span className="material-symbols-outlined text-3xl text-slate-400 mb-1">event_busy</span>
      <p className="font-semibold text-slate-700">Planlanmış etkinlik bulunmuyor</p>
      <p className="text-xs text-slate-400 mt-1">Yeni etkinlikler açıklandığında burada görünecektir.</p>
    </div>
  ) : (
    events.slice(0, 2).map((ev, idx) => (
      <div key={ev.id || idx} className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm">
        <span className="font-caption-caps text-caption-caps text-secondary uppercase tracking-wider font-bold mb-1 block">
          {idx === 0 ? "Sıradaki Buluşma" : "Yaklaşan Program"}
        </span>
        <div className="flex items-start gap-space-sm">
          <div className="bg-surface-ice text-primary font-bold rounded p-2 text-center min-w-[50px]">
            <span className="block font-headline-sm text-headline-sm leading-none">
              {ev.event_date ? ev.event_date.split("-")[2] || "15" : "15"}
            </span>
            <span className="font-caption-caps text-caption-caps uppercase">
              {ev.event_date ? "Kas" : "Kas"}
            </span>
          </div>
          <div>
            <h4 className="font-label-md text-label-md font-bold text-on-surface leading-snug">{ev.title}</h4>
            <p className="font-caption-caps text-caption-caps text-slate-muted mt-1">{ev.location}</p>
          </div>
        </div>
      </div>
    ))
  )}
{/*  Calendar CTA Box  */}
<div className="bg-primary text-on-primary rounded-xl p-space-lg shadow-sm flex flex-col justify-between">
<div>
<span className="material-symbols-outlined text-3xl text-gold-light mb-2">calendar_month</span>
<h4 className="font-headline-sm text-headline-sm font-bold mb-1">Tüm Dönem Ajandası</h4>
<p className="font-body-sm text-body-sm text-on-primary-container leading-relaxed mb-space-md">
                2026 akademik yılı süresince planlanan 12 ayrı workshop ve panel takvimini inceleyin.
              </p>
</div>
<a className="inline-flex items-center justify-center gap-1.5 bg-surface-container-lowest text-primary hover:bg-surface-ice px-4 py-2.5 rounded font-label-md text-label-md font-bold transition-all shadow-sm" href="/etkinlikler">
<span className="">Tüm Etkinlik Takvimini Gör</span>
<span className="material-symbols-outlined text-sm">calendar_month</span>
</a>
</div>
</div>
</div>
</div>
</section>
{/*  EDITORIAL & "USTA'YA SAYGI" SECTION  */}
<section className="py-space-3xl bg-surface-canvas">
<div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop">
<div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-2xl">
<div>
<span className="font-caption-caps text-caption-caps text-gold-deep uppercase tracking-wider font-bold block mb-1">Fikri Birikim &amp; Hafıza</span>
<h2 className="font-headline-xl text-headline-xl text-primary font-bold tracking-tight">Editoryal: "Usta'ya Saygı" Köşe Yazıları</h2>
<p className="font-body-sm text-body-sm text-slate-muted mt-1">Türk halkla ilişkiler tarihine yön veren akademisyenlerin ve duayen ustaların kaleminden makaleler.</p>
</div>
<a className="inline-flex items-center gap-1 font-label-md text-label-md text-secondary hover:text-primary font-bold transition-colors" href="/yayinlar">
<span className="">Tüm Editoryal Arşivi İncele</span>
<span className="material-symbols-outlined text-base">arrow_forward</span>
</a>
</div>
{/*  Main Editorial Layout: Asymmetric Split Grid  */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl">
  {!featuredArticle ? (
    <div className="col-span-full bg-surface-container-lowest p-10 rounded-xl text-center border border-dashed border-slate-200">
      <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">article</span>
      <h4 className="font-headline-sm font-bold text-primary mb-1">Editoryal Arşiv</h4>
      <p className="text-sm text-slate-500">Sistemde henüz yayınlanmış bir köşe yazısı veya editoryal makale bulunmamaktadır.</p>
    </div>
  ) : (
    <>
      {/*  Left: Featured In-Depth Essay  */}
      <article className="lg:col-span-7 bg-surface-container-lowest rounded-xl p-space-xl shadow-md flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-space-sm mb-space-md">
            <span className="bg-primary text-on-primary font-caption-caps text-caption-caps px-2.5 py-1 rounded">
              {featuredArticle.category === "akademik" ? "Akademik & Rapor" : "Başyazı & Teori"}
            </span>
            <span className="font-caption-caps text-caption-caps text-slate-muted flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">schedule</span> {featuredArticle.read_time || "6 dk okuma"}
            </span>
            <span className="font-caption-caps text-caption-caps text-slate-muted">{featuredArticle.published_at || "15 Ekim 2026"}</span>
          </div>
          <h3 className="font-headline-lg text-headline-lg text-on-surface font-extrabold leading-tight mb-space-md">
            <a className="hover:text-primary transition-colors" href="/yayinlar">
              {featuredArticle.title}
            </a>
          </h3>
          <p className="font-body-md text-body-md text-slate-dark leading-relaxed mb-space-md">
            {featuredArticle.summary}
          </p>
          <blockquote className="p-space-md bg-surface-ice rounded-lg font-body-sm text-body-sm text-primary italic mb-space-lg shadow-sm">
            "Mesleğin şeffaflığı ve kamu yararını önceleyen etik refleksi, yapay zekâ çağında insan kalabilmenin yegâne anahtarıdır."
          </blockquote>
        </div>
        {/*  Author Info Row  */}
        <div className="flex items-center justify-between pt-space-md">
          <div className="flex items-center gap-space-sm">
            <img className="w-12 h-12 rounded-full object-cover shadow-sm" alt={featuredArticle.author_name} src={featuredArticle.image_url || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400"} />
            <div>
              <span className="block font-label-md text-label-md font-bold text-on-surface">{featuredArticle.author_name}</span>
              <span className="block font-caption-caps text-caption-caps text-slate-muted">{featuredArticle.author_title || "AHİD Yayın Kurulu"}</span>
            </div>
          </div>
          <a className="inline-flex items-center gap-1 font-label-md text-label-md text-primary font-bold hover:underline" href="/yayinlar">
            <span className="">Makaleyi Oku</span>
            <span className="material-symbols-outlined text-base">menu_book</span>
          </a>
        </div>
      </article>

      {/*  Right: "Usta'ya Saygı" Showcase Cards  */}
      <div className="lg:col-span-5 flex flex-col gap-space-md">
        <div className="bg-surface-container-high/60 p-space-md rounded-xl">
          <span className="font-caption-caps text-caption-caps text-gold-deep uppercase tracking-wider font-bold block mb-1">Tarihe Not Düşenler</span>
          <h4 className="font-headline-sm text-headline-sm font-bold text-primary">Usta Kalemlerin Hatıratı</h4>
        </div>
        {masterTributes.length === 0 ? (
          <div className="bg-surface-container-lowest p-6 rounded-xl text-center text-slate-500 text-sm border border-dashed border-slate-200">
            <p className="font-semibold text-slate-700">Ustalara Saygı Arşivi</p>
            <p className="text-xs text-slate-400 mt-1">Bu kategoride henüz yayınlanmış yazı bulunmuyor.</p>
          </div>
        ) : (
          masterTributes.map((tribute, idx) => (
            <div key={tribute.id || idx} className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow transition-all flex items-start gap-space-md">
              <img className="w-16 h-16 rounded object-cover shadow-sm" alt={tribute.title} src={tribute.image_url || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300"} />
              <div className="flex flex-col flex-1">
                <div className="flex items-center justify-between">
                  <h5 className="font-label-md text-label-md font-bold text-on-surface">{tribute.title}</h5>
                  <span className="font-caption-caps text-caption-caps text-slate-muted">Arşiv</span>
                </div>
                <p className="font-body-sm text-body-sm text-slate-dark leading-snug mt-1 line-clamp-2">
                  {tribute.summary}
                </p>
                <a className="font-caption-caps text-caption-caps text-secondary font-bold hover:underline mt-2 inline-flex items-center gap-0.5" href="/yayinlar">
                  <span className="">Hatıratı İncele</span>
                  <span className="material-symbols-outlined text-xs">chevron_right</span>
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  )}
</div>
</div>
</section>
{/*  CALL TO ACTION: MEMBERSHIP ADVOCACY BANNER  */}
<section className="w-full bg-gradient-to-r from-primary via-primary-container to-inverse-surface text-on-primary py-space-3xl relative overflow-hidden">
{/*  Atmospheric Decorative Geometry Background  */}
<div className="absolute inset-0 opacity-10 pointer-events-none">
<svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
<polygon fill="currentColor" points="0,0 100,0 80,100 0,100"></polygon>
</svg>
</div>
<div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop relative z-10">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
<div className="lg:col-span-8">
<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-light/20 text-gold-light font-caption-caps text-caption-caps font-bold mb-space-sm">
<span className="material-symbols-outlined text-sm">badge</span>
            Prestijli Mesleki Birlik
          </span>
<h2 className="font-display-hero text-headline-xl lg:text-headline-xl font-bold tracking-tight mb-space-md text-white">
            Ankara’nın En Güçlü İletişim Network’ünde Yerinizi Alın
          </h2>
<p className="font-body-lg text-body-lg text-secondary-fixed leading-relaxed mb-space-lg max-w-2xl">
            AHİD üyeliği; yalnızca bir dernek kaydı değil, Türkiye'nin karar alıcı başkentinde mesleki itibarınızı belgeleyen resmi bir akreditasyondur.
          </p>
{/*  Membership Value List  */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-y-space-xs gap-x-space-md font-body-sm text-body-sm text-on-primary mb-space-xl">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-gold-light text-base">check_circle</span>
<span className="">Sektörel eğitimlere ve zirvelere ücretsiz/öncelikli katılım</span>
</div>
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-gold-light text-base">check_circle</span>
<span className="">AHİD Akreditasyon ve Mesleki Sertifika Programı</span>
</div>
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-gold-light text-base">check_circle</span>
<span className="">Ankara PR Profesyonelleri Dizini'nde yer alma hakkı</span>
</div>
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-gold-light text-base">check_circle</span>
<span className="">Hakemli yayınlarda ve panellerde konuşmacı/yazar temsiliyeti</span>
</div>
</div>
{/*  Buttons  */}
<div className="flex flex-wrap items-center gap-space-md">
<a className="inline-flex items-center justify-center gap-2 bg-[#c25e00] hover:bg-[#a04703] text-white font-semibold px-6 py-3.5 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200" href="/uyelik">
<span className="">Hemen Üye Başvurusu Yap</span>
<span className="material-symbols-outlined text-lg">arrow_forward</span>
</a>
<a className="inline-flex items-center gap-2 bg-surface-container-lowest/10 hover:bg-surface-container-lowest/20 text-on-primary font-label-md text-label-md px-6 py-3.5 rounded transition-colors backdrop-blur-sm" href="/uyelik">
<span className="">Üyelik Kriterlerini İncele</span>
</a>
</div>
</div>
{/*  Membership Credentials Card Mockup  */}
<div className="lg:col-span-4">
<div className="bg-surface-container-lowest/10 backdrop-blur-md rounded-2xl p-space-lg shadow-2xl text-on-primary">
<div className="flex items-center justify-between mb-space-md">
<div className="flex items-center gap-2">
<span className="font-headline-sm text-headline-sm font-bold text-gold-light">AHİD</span>
<span className="font-caption-caps text-caption-caps text-on-primary-container">Üye Kimliği</span>
</div>
<span className="material-symbols-outlined text-gold-light text-2xl">verified_user</span>
</div>
<div className="h-24 flex items-center justify-center my-space-md bg-surface-container-lowest/5 rounded-lg">
<span className="font-caption-caps text-caption-caps tracking-widest text-slate-muted uppercase">Kurumsal İletişim Akreditasyonu</span>
</div>
<div className="pt-space-sm flex items-center justify-between font-caption-caps text-caption-caps text-on-primary/70">
<span className="">T.C. İÇİŞLERİ BAKANLIĞI KÜTÜK NO</span>
<span className="font-mono text-gold-light">06-034-1990</span>
</div>
</div>
</div>
</div>
</div>
</section>
{/*  CONTACT & LOCATION SECTION  */}
<section className="py-space-3xl bg-surface">
<div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl">
{/*  Left: Contact Details & Quick Inquiry Form  */}
<div className="lg:col-span-6 flex flex-col justify-between">
<div>
<span className="font-caption-caps text-caption-caps text-primary uppercase tracking-wider font-bold block mb-1">Şeffaflık &amp; İletişim</span>
<h2 className="font-headline-xl text-headline-xl text-on-surface font-bold tracking-tight mb-space-sm">
              Bize Ulaşın &amp; Genel Merkez Ziyareti
            </h2>
<p className="font-body-md text-body-md text-slate-muted leading-relaxed mb-space-lg">
              Üyelik süreçleri, kurumsal iş birlikleri, basın talepleri ve akademik ortaklık başvuruları için genel sekreterliğimize yazabilirsiniz.
            </p>
{/*  Detailed Info Items  */}
<div className="space-y-space-md mb-space-lg">
<div className="flex items-start gap-space-sm">
<div className="w-10 h-10 rounded bg-surface-ice flex items-center justify-center text-primary shrink-0 mt-0.5">
<span className="material-symbols-outlined">location_on</span>
</div>
<div>
<span className="block font-label-md text-label-md font-bold text-on-surface">Genel Merkez Adresi</span>
<span className="font-body-sm text-body-sm text-slate-dark">Anıttepe Mah. Kültür Sok. No: 5/4 Tandoğan, Çankaya / Ankara</span>
</div>
</div>
<div className="flex items-start gap-space-sm">
<div className="w-10 h-10 rounded bg-surface-ice flex items-center justify-center text-primary shrink-0 mt-0.5">
<span className="material-symbols-outlined">mail</span>
</div>
<div>
<span className="block font-label-md text-label-md font-bold text-on-surface">Resmi E-Posta</span>
<a className="font-body-sm text-body-sm text-primary hover:underline" href="mailto:info@ahid.org.tr">info@ahid.org.tr</a>
<span className="text-slate-muted text-xs block">Basın İletişimi: basin@ahid.org.tr</span>
</div>
</div>
<div className="flex items-start gap-space-sm">
<div className="w-10 h-10 rounded bg-surface-ice flex items-center justify-center text-primary shrink-0 mt-0.5">
<span className="material-symbols-outlined">call</span>
</div>
<div>
<span className="block font-label-md text-label-md font-bold text-on-surface">Telefon Santrali &amp; Mesai</span>
<span className="font-body-sm text-body-sm text-slate-dark">+90 (312) 231 90 90 — Hafta İçi: 09:00 - 18:00</span>
</div>
</div>
</div>
</div>
{/*  Quick Message Form  */}
<form className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-sm" onSubmit={async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const inputs = form.querySelectorAll("input, textarea");
  const name = (inputs[0] as HTMLInputElement)?.value;
  const email = (inputs[1] as HTMLInputElement)?.value;
  const message = (inputs[2] as HTMLTextAreaElement)?.value;
  try {
    await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message, type: "quick_message" }),
    });
    alert("Talebiniz AHİD Genel Evrak Sistemine kaydedilmiştir. En kısa sürede dönüş sağlanacaktır.");
    form.reset();
  } catch {
    alert("Mesaj iletilemedi, lütfen tekrar deneyiniz.");
  }
}}>
<h4 className="font-label-md text-label-md font-bold text-primary mb-1">Hızlı İletişim / Bilgi Talebi</h4>
<div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
<input className="w-full px-3.5 py-2 rounded bg-surface-canvas text-on-surface font-body-sm text-body-sm outline-none shadow-inner" placeholder="Adınız Soyadınız" required type="text" />
<input className="w-full px-3.5 py-2 rounded bg-surface-canvas text-on-surface font-body-sm text-body-sm outline-none shadow-inner" placeholder="Kurumsal E-posta Adresiniz" required type="email" />
</div>
<textarea className="w-full px-3.5 py-2 rounded bg-surface-canvas text-on-surface font-body-sm text-body-sm outline-none shadow-inner" placeholder="Mesajınız veya sormak istediğiniz konu..." required rows={3}></textarea>
<button className="bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md px-5 py-2.5 rounded shadow-sm hover:shadow transition-all self-end flex items-center gap-1.5" type="submit">
<span className="">Mesajı Gönder</span>
<span className="material-symbols-outlined text-sm">send</span>
</button>
</form>
</div>
{/*  Right: Map Representation & Office Atmosphere  */}
<div className="lg:col-span-6 flex flex-col gap-space-md">
{/*  Static Location Pipeline Box  */}
<div className="relative w-full h-80 rounded-xl overflow-hidden shadow-md">
<div className="w-full h-full bg-cover bg-center" data-location="Anıttepe, Çankaya, Ankara, Turkey" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDHVnC7k_gpQCt0DJ_nukYf_Oe9q8H0iom1VdIQ9-S2kpzd4ZFm_fdxRrtKj31NFxcvdA67bIaU35DyhyUEtgYh5tyiAGkl5arlvfbZOqCqgvx-n7Zkn05_wdyFu5Z1iuk4cTagTxC00ZdrZGaOx-LYRwWL650Gv1CyCpm5y7KP43CHROemeR0ptrAH_Jh_AjHYh_HAliF9S_RssnzQhz6dBoPBaXHGMoCEic19nRUI3AkrC-zgqqzh')" }}></div>
<div className="absolute bottom-4 left-4 right-4 bg-surface-container-lowest/90 backdrop-blur-md p-space-md rounded-lg shadow-lg flex items-center justify-between">
<div>
<span className="font-caption-caps text-caption-caps uppercase text-gold-deep font-bold block">Başkent Koordinasyonu</span>
<span className="font-label-md text-label-md font-bold text-primary">Anıttepe / Tandoğan Yerleşkesi</span>
</div>
<a className="inline-flex items-center gap-1 text-primary hover:text-secondary font-label-sm text-label-sm font-semibold" href="https://maps.google.com" rel="noopener noreferrer" target="_blank">
<span className="">Yol Tarifi Al</span>
<span className="material-symbols-outlined text-sm">directions</span>
</a>
</div>
</div>
{/*  Headquarters Atmosphere Card  */}
<div className="bg-surface-ice rounded-xl p-space-lg flex items-center gap-space-md shadow-sm">
<img className="w-24 h-24 rounded object-cover shadow-sm shrink-0" data-alt="Ankara'da AHİD genel merkez binası giriş salonu ve toplantı odası, ahşap ve lacivert prestijli kurumsal iç mimari, resmi protokol bayrakları." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBwkbSL9p2iY-6-4stXJJk4-p3HOaHl_eiuMLZ2IYKP4tKbkGE5ruCGl4P1cJIZVEEgvzycodmg-T6RxMTKHbd6-VpxQYPhLffuy6feCOePrf8V1hHAJF7M9xeBhaNHXJc7XitXhya6xzTJaxSQbZG15cHhSqCsv2JY1qqoVjmesj7rYPa8h-25P4mfYDMygIKKOIo6Kbkkjk2YdNPnxcAn2_jEv8OKrc2Z3PzArKFDXCa3JxY1dx2V" />
<div>
<h4 className="font-headline-sm text-headline-sm font-bold text-primary mb-1">Kurumsal Ziyaret Protokolü</h4>
<p className="font-body-sm text-body-sm text-slate-dark leading-relaxed">
                Dernek genel merkezimizde akademik heyetler, yabancı delegasyonlar ve medya temsilcileri için randevu bazlı toplantı salonlarımız tahsis edilmektedir.
              </p>
</div>
</div>
</div>
</div>
</div>
</section>
</div>
</main>
      <Footer />
    </>
  );
}
