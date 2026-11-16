"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CountUpNumber from "@/components/CountUpNumber";

const TR_MONTHS: Record<string, { num: number; short: string }> = {
  ocak: { num: 0, short: "Oca" },
  subat: { num: 1, short: "Şub" },
  şubat: { num: 1, short: "Şub" },
  mart: { num: 2, short: "Mar" },
  nisan: { num: 3, short: "Nis" },
  mayis: { num: 4, short: "May" },
  mayıs: { num: 4, short: "May" },
  haziran: { num: 5, short: "Haz" },
  temmuz: { num: 6, short: "Tem" },
  agustos: { num: 7, short: "Ağu" },
  ağustos: { num: 7, short: "Ağu" },
  eylul: { num: 8, short: "Eyl" },
  eylül: { num: 8, short: "Eyl" },
  ekim: { num: 9, short: "Eki" },
  kasim: { num: 10, short: "Kas" },
  kasım: { num: 10, short: "Kas" },
  aralik: { num: 11, short: "Ara" },
  aralık: { num: 11, short: "Ara" },
};

const SHORT_MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

function parseEventDateInfo(dateStr?: string): { day: string; monthShort: string; timestamp: number } {
  if (!dateStr) return { day: "—", monthShort: "Etkinlik", timestamp: 0 };
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const y = Number(isoMatch[1]);
    const m = Number(isoMatch[2]) - 1;
    const d = Number(isoMatch[3]);
    return {
      day: String(d).padStart(2, "0"),
      monthShort: SHORT_MONTHS[m] || "Etkinlik",
      timestamp: new Date(y, m, d).getTime(),
    };
  }
  const trMatch = dateStr.trim().match(/^(\d{1,2})\s+([A-Za-zÇĞİÖŞÜçğıöşü]+)\s+(\d{4})/);
  if (trMatch) {
    const d = Number(trMatch[1]);
    const monthKey = trMatch[2].toLowerCase();
    const y = Number(trMatch[3]);
    const monthMeta = TR_MONTHS[monthKey];
    if (monthMeta) {
      return {
        day: String(d).padStart(2, "0"),
        monthShort: monthMeta.short,
        timestamp: new Date(y, monthMeta.num, d).getTime(),
      };
    }
  }
  const parsed = new Date(dateStr);
  if (!Number.isNaN(parsed.getTime())) {
    return {
      day: String(parsed.getDate()).padStart(2, "0"),
      monthShort: SHORT_MONTHS[parsed.getMonth()] || "Etkinlik",
      timestamp: parsed.getTime(),
    };
  }
  return { day: "—", monthShort: "Yakında", timestamp: 0 };
}

function getArticleBucket(category?: string): "usta_saygi" | "akademik" | "kose_yazisi" {
  const c = (category || "").toLowerCase();
  if (/usta|saygı|saygi|hatırat|vefa/.test(c)) return "usta_saygi";
  if (/akademik|rapor|makale|bilimsel|bülten|bulten/.test(c)) return "akademik";
  return "kose_yazisi";
}

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

  const [activeFilter, setActiveFilter] = useState<
    "Tümü" | "Köşe Yazıları" | "Usta'ya Saygı" | "Akademik"
  >("Tümü");
  const [eventTab, setEventTab] = useState<"upcoming" | "past">("upcoming");
  const [news, setNews] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [contactSending, setContactSending] = useState(false);
  const [contactNotice, setContactNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [todayMs, setTodayMs] = useState<number | null>(null);

  useEffect(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    setTodayMs(todayStart.getTime());

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

  const displayedEvents = events.filter((ev) => {
    if (todayMs === null) return eventTab === "upcoming";
    const { timestamp } = parseEventDateInfo(ev.event_date);
    if (eventTab === "past") {
      return timestamp > 0 && timestamp < todayMs;
    }
    return timestamp === 0 || timestamp >= todayMs;
  });

  const activeEventsList =
    displayedEvents.length > 0 || eventTab === "past" ? displayedEvents : events;
  const featuredEvent =
    activeEventsList.find((e) => e.is_featured) ||
    activeEventsList[0] ||
    (eventTab === "upcoming" ? events.find((e) => e.is_featured) || events[0] : null);

  const filteredNews = news.filter((item) => {
    if (activeFilter === "Tümü") return true;
    const bucket = getArticleBucket(item.category);
    if (activeFilter === "Köşe Yazıları") return bucket === "kose_yazisi";
    if (activeFilter === "Usta'ya Saygı") return bucket === "usta_saygi";
    if (activeFilter === "Akademik") return bucket === "akademik";
    return true;
  });

  const featuredArticle =
    news.find((a) => getArticleBucket(a.category) === "akademik") ||
    news.find((a) => getArticleBucket(a.category) === "kose_yazisi") ||
    news[0];
  const masterTributes = news
    .filter((a) => getArticleBucket(a.category) === "usta_saygi")
    .slice(0, 2);
  const spotlightImage =
    featuredEvent?.image_url || cms.summit_image || cms.home_hero_image || "";
  const hasCountdown =
    countdown.days + countdown.hours + countdown.minutes + countdown.seconds > 0;

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
<span className="material-symbols-outlined text-base">account_balance</span>
<span className="font-caption-caps text-caption-caps uppercase tracking-wider font-bold">1990&apos;dan Bugüne İletişim Mesleğinin Güvencesi</span>
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
<Link className="inline-flex items-center justify-center gap-2 bg-[#0b3d91] hover:bg-[#082b66] text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200" href="/kurumsal">
<span>AHİD&apos;i Keşfedin</span>
<span className="material-symbols-outlined text-lg">arrow_forward</span>
</Link>
<Link className="inline-flex items-center justify-center gap-2 border border-[#cfdaf3] bg-white text-[#0b3d91] hover:bg-[#f0f3ff] hover:border-[#0b3d91]/40 font-semibold px-6 py-3 rounded-lg transition-all duration-200 active:scale-95" href="/uyelik">
<span>Üyelik Başvurusu</span>
</Link>
<Link className="inline-flex items-center gap-1.5 text-secondary hover:text-primary font-label-md text-label-md transition-colors px-2 py-1" href="/yayinlar">
<span className="material-symbols-outlined text-lg text-gold-deep">description</span>
<span className="underline decoration-gold-light decoration-2 underline-offset-4">2026 PR Raporunu İncele</span>
</Link>
</div>
{/*  Editorial Micro-Trust Bar  */}
<div className="mt-space-xl pt-space-md flex items-center gap-space-lg text-slate-muted font-body-sm text-body-sm">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary text-base">verified</span>
<span>Kamu &amp; Akreditasyon Onaylı</span>
</div>
<div className="hidden sm:flex items-center gap-space-xs">
<span className="material-symbols-outlined text-gold-deep text-base">verified_user</span>
<span>Mesleki Etik İlkeleri</span>
</div>
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-primary text-base">school</span>
<span>14+ İletişim Fakültesi Ağı</span>
</div>
</div>
</div>
{/*  Right Column: Interactive Event Spotlight Card  */}
<div className="lg:col-span-5 relative">
  {featuredEvent || cms.summit_title ? (
    <div className="relative bg-surface-container-lowest rounded-xl shadow-xl overflow-hidden p-space-lg">
      {/*  Top Status Bar  */}
      <div className="flex items-center justify-between mb-space-md">
        <span className="inline-flex items-center gap-1.5 bg-surface-ice text-primary px-2.5 py-1 rounded-full font-caption-caps text-caption-caps font-bold">
          <span className="w-2 h-2 rounded-full bg-gold-deep"></span>
          ÖNE ÇIKAN GÜNDEM
        </span>
        <span className="font-caption-caps text-caption-caps uppercase tracking-wider text-slate-muted bg-surface-container px-2.5 py-1 rounded">
          {featuredEvent?.category || cms.summit_quota || cms.summit_date || "Etkinlik"}
        </span>
      </div>
      {/*  Visual Media Showcase  */}
      {spotlightImage && (
        <div className="relative h-48 w-full rounded overflow-hidden mb-space-md shadow-sm">
          <img
            className="w-full h-full object-cover"
            src={spotlightImage}
            alt={featuredEvent?.title || cms.home_hero_image_alt || "AHİD Gündem"}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent flex items-end p-space-md">
            <span className="font-headline-sm text-headline-sm text-on-primary font-bold">
              {featuredEvent?.title || cms.summit_title}
            </span>
          </div>
        </div>
      )}
      {!spotlightImage && (
        <h3 className="font-headline-sm text-headline-sm text-primary font-bold mb-space-sm">
          {featuredEvent?.title || cms.summit_title}
        </h3>
      )}
      {/*  Details  */}
      <p className="font-body-sm text-body-sm text-slate-dark mb-space-md leading-relaxed">
        {featuredEvent?.summary ||
          featuredEvent?.description ||
          cms.summit_description ||
          cms.summit_location ||
          ""}
      </p>
      {hasCountdown && (
        <div className="grid grid-cols-4 gap-2 mb-space-md text-center bg-surface-ice/70 p-2.5 rounded-lg">
          <div>
            <span className="block font-headline-sm font-bold text-primary leading-none">{countdown.days}</span>
            <span className="text-[10px] uppercase text-slate-muted font-bold">Gün</span>
          </div>
          <div>
            <span className="block font-headline-sm font-bold text-primary leading-none">{countdown.hours}</span>
            <span className="text-[10px] uppercase text-slate-muted font-bold">Saat</span>
          </div>
          <div>
            <span className="block font-headline-sm font-bold text-primary leading-none">{countdown.minutes}</span>
            <span className="text-[10px] uppercase text-slate-muted font-bold">Dk</span>
          </div>
          <div>
            <span className="block font-headline-sm font-bold text-primary leading-none">{countdown.seconds}</span>
            <span className="text-[10px] uppercase text-slate-muted font-bold">Sn</span>
          </div>
        </div>
      )}
      {/*  Action Row  */}
      <div className="flex items-center justify-between pt-2">
        <span className="font-caption-caps text-caption-caps text-slate-muted font-medium">
          {featuredEvent?.event_date || cms.summit_date || ""} {featuredEvent?.location ? `• ${featuredEvent.location}` : ""}
        </span>
        <Link className="inline-flex items-center gap-1 bg-gold-light hover:bg-gold-deep text-gold-deep hover:text-on-primary px-3.5 py-1.5 rounded font-label-sm text-label-sm font-bold shadow-sm transition-all" href={featuredEvent ? `/etkinlikler/${featuredEvent.id}` : "/etkinlikler"}>
          <span>Yerinizi Ayırtın</span>
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
        Yeni zirve ve etkinlik takvimi yakında açıklanacaktır.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Link href="/etkinlikler" className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-container transition-colors">
          <span className="material-symbols-outlined text-sm">calendar_month</span>
          Etkinlik Takvimi
        </Link>
        <Link href="/yayinlar#abonelik" className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg bg-surface-ice text-primary text-xs font-bold hover:bg-surface-container-high transition-colors">
          <span className="material-symbols-outlined text-sm">notifications</span>
          Bültene Abone Ol
        </Link>
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
<div className="mt-space-xl bg-primary-container/40 border border-white/10 rounded-xl px-space-lg py-space-md flex flex-wrap items-center justify-between gap-space-md">
<span className="font-caption-caps text-caption-caps text-gold-light uppercase tracking-widest font-bold shrink-0">Stratejik Paydaşlar:</span>
<div className="flex flex-wrap items-center gap-x-8 gap-y-4 font-label-md text-label-md text-on-primary/90">
<span className="hover:text-gold-light transition-all flex items-center gap-2.5 group">
<img
  src="/partners/ankara-kent-konseyi-icon.png"
  alt="Ankara Kent Konseyi Logosu"
  className="w-8 h-8 object-contain brightness-0 invert opacity-95 group-hover:scale-105 transition-transform shrink-0"
/>
<span className="font-semibold">Ankara Kent Konseyi</span>
</span>
<span className="hover:text-gold-light transition-all flex items-center gap-2.5 group">
<img
  src="/partners/ankara-universitesi.png"
  alt="Ankara Üniversitesi Logosu"
  className="w-8 h-8 object-contain drop-shadow-xs group-hover:scale-105 transition-transform shrink-0"
/>
<span className="font-semibold">Ankara Üniversitesi İletişim Fakültesi</span>
</span>
<span className="hover:text-gold-light transition-all flex items-center gap-2.5 group">
<img
  src="/partners/haci-bayram-veli-icon.svg"
  alt="Ankara Hacı Bayram Veli Üniversitesi Logosu"
  className="w-8 h-8 object-contain drop-shadow-xs group-hover:scale-105 transition-transform shrink-0"
/>
<span className="font-semibold">Hacı Bayram Veli Üniversitesi</span>
</span>
<span className="hover:text-gold-light transition-all flex items-center gap-2.5 group">
<img
  src="/partners/turkiye-itibar-enstitusu-icon.png"
  alt="Türkiye İtibar Enstitüsü Logosu"
  className="w-8 h-7 object-contain opacity-95 group-hover:scale-105 transition-transform shrink-0"
/>
<span className="font-semibold">Türkiye İtibar Enstitüsü</span>
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
<span>Kurumsal Belgelerimizi ve Tüzüğümüzü İnceleyin</span>
<span className="material-symbols-outlined text-base">east</span>
</a>
</div>
{/*  3 Interactive Focus Pillar Cards  */}
<div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-3 gap-space-md">
{/*  Pillar 1  */}
<Link href="/kurumsal" className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
<div>
<div className="w-12 h-12 rounded bg-surface-ice flex items-center justify-center text-primary mb-space-md">
<span className="material-symbols-outlined text-2xl">school</span>
</div>
<h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-space-xs group-hover:text-primary transition-colors">Akademik &amp; Sektörel Köprü</h3>
<p className="font-body-sm text-body-sm text-slate-muted leading-relaxed">
                İletişim fakülteleriyle ortak sempozyumlar, bilimsel kongreler, öğrenci staj eşleştirmeleri ve kıdemli mentörlük programları.
              </p>
</div>
<div className="pt-space-md mt-space-md flex items-center gap-1 font-label-sm text-label-sm text-secondary font-semibold">
<span>Akademi İş Birlikleri</span>
<span className="material-symbols-outlined text-sm">chevron_right</span>
</div>
</Link>
{/*  Pillar 2  */}
<Link href="/kaynaklar" className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
<div>
<div className="w-12 h-12 rounded bg-gold-light/40 flex items-center justify-center text-gold-deep mb-space-md">
<span className="material-symbols-outlined text-2xl">verified</span>
</div>
<h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-space-xs group-hover:text-primary transition-colors">Mesleki Etik &amp; Standartlar</h3>
<p className="font-body-sm text-body-sm text-slate-muted leading-relaxed">
                Dijital PR, dezenformasyonla mücadele, şeffaf itibar yönetimi ve kriz süreçlerinde ulusal mesleki etik rehberliği.
              </p>
</div>
<div className="pt-space-md mt-space-md flex items-center gap-1 font-label-sm text-label-sm text-gold-deep font-semibold">
<span>Etik Tüzüğümüz</span>
<span className="material-symbols-outlined text-sm">chevron_right</span>
</div>
</Link>
{/*  Pillar 3  */}
<Link href="/etkinlikler" className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
<div>
<div className="w-12 h-12 rounded bg-surface-container flex items-center justify-center text-primary mb-space-md">
<span className="material-symbols-outlined text-2xl">groups</span>
</div>
<h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-space-xs group-hover:text-primary transition-colors">Güçlü Başkent Network&apos;ü</h3>
<p className="font-body-sm text-body-sm text-slate-muted leading-relaxed">
                Ankara bürokrasisi, kamu kurumları, basın temsilcileri ve özel sektör liderlerini birleştiren periyodik networking buluşmaları.
              </p>
</div>
<div className="pt-space-md mt-space-md flex items-center gap-1 font-label-sm text-label-sm text-primary font-semibold">
<span>İletişim Buluşmaları</span>
<span className="material-symbols-outlined text-sm">chevron_right</span>
</div>
</Link>
</div>
</div>
{/*  Institutional Ecosystem Banner  */}
<div className="w-full bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col md:flex-row items-center justify-between gap-space-lg">
<div className="flex items-center gap-space-md">
<div className="w-14 h-14 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0">
<span className="material-symbols-outlined text-2xl">hub</span>
</div>
<div>
<h4 className="font-headline-sm text-headline-sm font-bold text-primary">Başkent İletişim Ekosistemi &amp; Odak Alanları</h4>
<p className="font-body-sm text-body-sm text-slate-muted">AHİD çatısı altında bir araya gelen dört temel mesleki paydaş grubuyla ortak standartlar geliştiriyoruz.</p>
</div>
</div>
<div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-start md:justify-end">
<span className="px-3 py-1.5 rounded-lg bg-surface-ice text-primary text-xs font-semibold">Kurumsal İletişim</span>
<span className="px-3 py-1.5 rounded-lg bg-surface-ice text-primary text-xs font-semibold">Akademi</span>
<span className="px-3 py-1.5 rounded-lg bg-surface-ice text-primary text-xs font-semibold">Kamu &amp; Diplomasi</span>
<span className="px-3 py-1.5 rounded-lg bg-surface-ice text-primary text-xs font-semibold">Medya &amp; Ajans</span>
<Link className="whitespace-nowrap bg-primary text-on-primary hover:bg-secondary px-4 py-2 rounded font-label-sm text-label-sm font-semibold transition-all shadow-sm" href="/haberler">
            Tüm Çalışmalarımız
          </Link>
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
{(["Tümü", "Köşe Yazıları", "Usta'ya Saygı", "Akademik"] as const).map((tab) => (
  <button
    key={tab}
    type="button"
    onClick={() => setActiveFilter(tab)}
    className={`px-4 py-1.5 rounded-full font-label-sm text-label-sm transition-colors cursor-pointer ${
      activeFilter === tab
        ? "font-bold bg-primary text-on-primary shadow-sm"
        : "font-medium bg-surface-container text-on-surface-variant hover:bg-surface-ice"
    }`}
  >
    {tab}
  </button>
))}
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
      <h4 className="font-headline-sm font-bold text-primary mb-1">Bu kategoride henüz yayınlanmış içerik bulunmuyor</h4>
      <p className="text-sm text-slate-500 mb-4">Tüm yayınları görüntüleyebilir veya aylık bültenimize abone olabilirsiniz.</p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {activeFilter !== "Tümü" && (
          <button
            type="button"
            onClick={() => setActiveFilter("Tümü")}
            className="inline-flex items-center gap-1 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-container transition-colors cursor-pointer"
          >
            Tüm Yayınları Göster
          </button>
        )}
        <Link href="/yayinlar#abonelik" className="inline-flex items-center gap-1 px-4 py-2 bg-surface-ice text-primary text-xs font-semibold rounded-lg hover:bg-surface-container-high transition-colors">
          Bültene Abone Ol
        </Link>
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
              {item.category || (getArticleBucket(item.category) === "akademik" ? "Akademik" : getArticleBucket(item.category) === "usta_saygi" ? "Usta'ya Saygı" : "Köşe Yazısı")}
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
<Link className="inline-flex items-center gap-2 px-6 py-3 rounded bg-surface-container-high hover:bg-surface-variant text-primary font-label-md text-label-md font-semibold transition-all" href="/yayinlar">
<span>Tüm Basın Bültenleri ve Duyuru Arşivini İncele</span>
<span className="material-symbols-outlined text-base">arrow_forward</span>
</Link>
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
<button
  type="button"
  onClick={() => setEventTab("upcoming")}
  className={`px-4 py-2 rounded font-label-sm text-label-sm transition-colors cursor-pointer ${
    eventTab === "upcoming"
      ? "font-bold bg-primary text-on-primary shadow-sm"
      : "font-semibold bg-surface-container-lowest text-slate-muted hover:text-primary"
  }`}
>
  Yaklaşan Etkinlikler
</button>
<button
  type="button"
  onClick={() => setEventTab("past")}
  className={`px-4 py-2 rounded font-label-sm text-label-sm transition-colors cursor-pointer ${
    eventTab === "past"
      ? "font-bold bg-primary text-on-primary shadow-sm"
      : "font-semibold bg-surface-container-lowest text-slate-muted hover:text-primary"
  }`}
>
  Geçmiş Etkinlik Arşivi
</button>
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
            {featuredEvent.registration_open ? "Kayıtlar Açık" : eventTab === "past" ? "Tamamlanan Program" : "Planlanan Etkinlik"}
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
          <span>Detaylı Program &amp; Kayıt</span>
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
      <h3 className="font-headline-sm text-headline-sm text-primary font-bold">
        {eventTab === "past" ? "Geçmiş Etkinlik Kaydı Bulunmuyor" : "Öne Çıkan Etkinlik Bulunmuyor"}
      </h3>
      <p className="font-body-sm text-body-sm text-slate-500 mt-1 max-w-md mb-4">
        {eventTab === "past"
          ? "Tarihi tamamlanmış arşiv etkinliği bulunmadı. Güncel etkinlikleri inceleyebilirsiniz."
          : "Yaklaşan etkinlik, zirve veya masterclass takvimi açıklandığında bu alanda görüntülenecektir."}
      </p>
      <Link href="/etkinlikler" className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-container transition-colors">
        <span className="material-symbols-outlined text-sm">calendar_month</span>
        Etkinlikler Sayfasına Git
      </Link>
    </div>
  )}
</div>
{/*  Mini Calendar & Upcoming List Aside  */}
<div className="lg:col-span-4 flex flex-col gap-space-md">
  {activeEventsList.length === 0 ? (
    <div className="bg-surface-container-lowest rounded-xl p-6 text-center text-slate-500 text-sm border border-dashed border-slate-200">
      <span className="material-symbols-outlined text-3xl text-slate-400 mb-1">event_busy</span>
      <p className="font-semibold text-slate-700">Planlanmış etkinlik bulunmuyor</p>
      <p className="text-xs text-slate-400 mt-1">Yeni etkinlikler açıklandığında burada görünecektir.</p>
    </div>
  ) : (
    activeEventsList.slice(0, 2).map((ev, idx) => {
      const dateInfo = parseEventDateInfo(ev.event_date);
      return (
        <Link
          key={ev.id || idx}
          href={`/etkinlikler/${ev.id}`}
          className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm hover:shadow-md transition-all block group"
        >
          <span className="font-caption-caps text-caption-caps text-secondary uppercase tracking-wider font-bold mb-1 block">
            {eventTab === "past" ? "Arşiv Kaydı" : idx === 0 ? "Sıradaki Buluşma" : "Yaklaşan Program"}
          </span>
          <div className="flex items-start gap-space-sm">
            <div className="bg-surface-ice text-primary font-bold rounded p-2 text-center min-w-[50px]">
              <span className="block font-headline-sm text-headline-sm leading-none">
                {dateInfo.day}
              </span>
              <span className="font-caption-caps text-caption-caps uppercase">
                {dateInfo.monthShort}
              </span>
            </div>
            <div>
              <h4 className="font-label-md text-label-md font-bold text-on-surface leading-snug group-hover:text-primary transition-colors">{ev.title}</h4>
              <p className="font-caption-caps text-caption-caps text-slate-muted mt-1">{ev.location}</p>
            </div>
          </div>
        </Link>
      );
    })
  )}
{/*  Calendar CTA Box  */}
<div className="bg-primary text-on-primary rounded-xl p-space-lg shadow-sm flex flex-col justify-between">
<div>
<span className="material-symbols-outlined text-3xl text-gold-light mb-2">calendar_month</span>
<h4 className="font-headline-sm text-headline-sm font-bold mb-1">Tüm Dönem Ajandası</h4>
<p className="font-body-sm text-body-sm text-on-primary-container leading-relaxed mb-space-md">
                {events.length > 0
                  ? `Akademik yıl boyunca planlanan ${events.length} aktif zirve, çalıştay ve panel takvimini inceleyin.`
                  : "Derneğimizin sempozyum, çalıştay ve zirve takvimini inceleyin."}
              </p>
</div>
<Link className="inline-flex items-center justify-center gap-1.5 bg-surface-container-lowest text-primary hover:bg-surface-ice px-4 py-2.5 rounded font-label-md text-label-md font-bold transition-all shadow-sm" href="/etkinlikler">
<span>Tüm Etkinlik Takvimini Gör</span>
<span className="material-symbols-outlined text-sm">calendar_month</span>
</Link>
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
<Link className="inline-flex items-center gap-1 font-label-md text-label-md text-secondary hover:text-primary font-bold transition-colors" href="/yayinlar">
<span>Tüm Editoryal Arşivi İncele</span>
<span className="material-symbols-outlined text-base">arrow_forward</span>
</Link>
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
              {featuredArticle.category || (getArticleBucket(featuredArticle.category) === "akademik" ? "Akademik & Rapor" : "Başyazı & Teori")}
            </span>
            <span className="font-caption-caps text-caption-caps text-slate-muted flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">schedule</span> {featuredArticle.read_time || "6 dk okuma"}
            </span>
            <span className="font-caption-caps text-caption-caps text-slate-muted">{featuredArticle.published_at || "15 Ekim 2026"}</span>
          </div>
          <h3 className="font-headline-lg text-headline-lg text-on-surface font-extrabold leading-tight mb-space-md">
            <Link className="hover:text-primary transition-colors" href={featuredArticle.slug ? `/yayinlar/${featuredArticle.slug}` : "/yayinlar"}>
              {featuredArticle.title}
            </Link>
          </h3>
          <p className="font-body-md text-body-md text-slate-dark leading-relaxed mb-space-lg">
            {featuredArticle.summary}
          </p>
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
          <Link className="inline-flex items-center gap-1 font-label-md text-label-md text-primary font-bold hover:underline" href={featuredArticle.slug ? `/yayinlar/${featuredArticle.slug}` : "/yayinlar"}>
            <span>Makaleyi Oku</span>
            <span className="material-symbols-outlined text-base">menu_book</span>
          </Link>
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
                <Link className="font-caption-caps text-caption-caps text-secondary font-bold hover:underline mt-2 inline-flex items-center gap-0.5" href={tribute.slug ? `/yayinlar/${tribute.slug}` : "/yayinlar"}>
                  <span>Hatıratı İncele</span>
                  <span className="material-symbols-outlined text-xs">chevron_right</span>
                </Link>
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
<span>Sektörel eğitimlere ve zirvelere ücretsiz/öncelikli katılım</span>
</div>
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-gold-light text-base">check_circle</span>
<span>AHİD Akreditasyon ve Mesleki Sertifika Programı</span>
</div>
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-gold-light text-base">check_circle</span>
<span>Ankara PR Profesyonelleri Dizini'nde yer alma hakkı</span>
</div>
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-gold-light text-base">check_circle</span>
<span>Hakemli yayınlarda ve panellerde konuşmacı/yazar temsiliyeti</span>
</div>
</div>
{/*  Buttons  */}
<div className="flex flex-wrap items-center gap-space-md">
<Link className="inline-flex items-center justify-center gap-2 bg-[#c25e00] hover:bg-[#a04703] text-white font-semibold px-6 py-3.5 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200" href="/uyelik">
<span>Hemen Üye Başvurusu Yap</span>
<span className="material-symbols-outlined text-lg">arrow_forward</span>
</Link>
<Link className="inline-flex items-center gap-2 bg-surface-container-lowest/10 hover:bg-surface-container-lowest/20 text-on-primary font-label-md text-label-md px-6 py-3.5 rounded transition-colors" href="/uyelik">
<span>Üyelik Kriterlerini İncele</span>
</Link>
</div>
</div>
{/*  Membership Credentials Card  */}
<div className="lg:col-span-4">
<div className="bg-surface-container-lowest/15 border border-white/15 rounded-2xl p-space-lg shadow-2xl text-on-primary">
<div className="flex items-center justify-between mb-space-md">
<div className="flex items-center gap-2">
<span className="font-headline-sm text-headline-sm font-bold text-gold-light">AHİD</span>
<span className="font-caption-caps text-caption-caps text-on-primary-container">Üye Kimliği</span>
</div>
<span className="material-symbols-outlined text-gold-light text-2xl">verified_user</span>
</div>
<div className="h-24 flex items-center justify-center my-space-md bg-surface-container-lowest/5 rounded-lg">
<span className="font-caption-caps text-caption-caps tracking-widest text-on-primary/80 uppercase">Kurumsal İletişim Akreditasyonu</span>
</div>
<div className="pt-space-sm flex items-center justify-between font-caption-caps text-caption-caps text-on-primary/70">
<span>T.C. İÇİŞLERİ BAKANLIĞI KÜTÜK NO</span>
<span className="font-mono text-gold-light">06-039-142</span>
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
<form
  className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm flex flex-col gap-space-sm"
  onSubmit={async (e) => {
    e.preventDefault();
    setContactSending(true);
    setContactNotice(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contactForm.name,
          email: contactForm.email,
          message: contactForm.message,
          type: "quick_message",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setContactNotice({
          type: "error",
          text: data.error || "Mesaj iletilemedi, lütfen bilgilerinizi kontrol ediniz.",
        });
        return;
      }
      setContactNotice({
        type: "success",
        text: "Talebiniz AHİD Genel Evrak Sistemine kaydedilmiştir. En kısa sürede dönüş sağlanacaktır.",
      });
      setContactForm({ name: "", email: "", message: "" });
    } catch {
      setContactNotice({
        type: "error",
        text: "Mesaj iletilirken bağlantı hatası oluştu, lütfen tekrar deneyiniz.",
      });
    } finally {
      setContactSending(false);
    }
  }}
>
<h4 className="font-label-md text-label-md font-bold text-primary mb-1">Hızlı İletişim / Bilgi Talebi</h4>
{contactNotice && (
  <div
    className={`p-3 rounded-lg text-xs font-semibold ${
      contactNotice.type === "success"
        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
        : "bg-red-50 text-red-700 border border-red-200"
    }`}
  >
    {contactNotice.text}
  </div>
)}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
<input
  className="w-full px-3.5 py-2 rounded bg-surface-canvas text-on-surface font-body-sm text-body-sm outline-none shadow-inner"
  placeholder="Adınız Soyadınız"
  required
  type="text"
  value={contactForm.name}
  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
/>
<input
  className="w-full px-3.5 py-2 rounded bg-surface-canvas text-on-surface font-body-sm text-body-sm outline-none shadow-inner"
  placeholder="Kurumsal E-posta Adresiniz"
  required
  type="email"
  value={contactForm.email}
  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
/>
</div>
<textarea
  className="w-full px-3.5 py-2 rounded bg-surface-canvas text-on-surface font-body-sm text-body-sm outline-none shadow-inner"
  placeholder="Mesajınız veya sormak istediğiniz konu..."
  required
  rows={3}
  value={contactForm.message}
  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
></textarea>
<button
  disabled={contactSending}
  className="bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md px-5 py-2.5 rounded shadow-sm hover:shadow transition-all self-end flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
  type="submit"
>
<span>{contactSending ? "Gönderiliyor..." : "Mesajı Gönder"}</span>
<span className="material-symbols-outlined text-sm">send</span>
</button>
</form>
</div>
{/*  Right: Map Representation & Office Atmosphere  */}
<div className="lg:col-span-6 flex flex-col gap-space-md">
{/*  Static Location Pipeline Box  */}
<div className="relative w-full h-80 rounded-xl overflow-hidden shadow-md bg-primary-container">
<img
  alt="Ankara Anıttepe kurumsal genel merkez çevresi"
  className="w-full h-full object-cover opacity-85"
  src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=900&q=80"
/>
<div className="absolute bottom-4 left-4 right-4 bg-surface-container-lowest/90 backdrop-blur-md p-space-md rounded-lg shadow-lg flex items-center justify-between">
<div>
<span className="font-caption-caps text-caption-caps uppercase text-gold-deep font-bold block">Başkent Koordinasyonu</span>
<span className="font-label-md text-label-md font-bold text-primary">Anıttepe / Tandoğan Yerleşkesi</span>
</div>
<a className="inline-flex items-center gap-1 text-primary hover:text-secondary font-label-sm text-label-sm font-semibold" href="https://www.google.com/maps/search/?api=1&query=39.9285,32.8415" rel="noopener noreferrer" target="_blank">
<span>Yol Tarifi Al</span>
<span className="material-symbols-outlined text-sm">directions</span>
</a>
</div>
</div>
{/*  Headquarters Atmosphere Card  */}
<div className="bg-surface-ice rounded-xl p-space-lg flex items-center gap-space-md shadow-sm">
<img className="w-24 h-24 rounded object-cover shadow-sm shrink-0" alt="AHİD Genel Merkez toplantı salonu" src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80" />
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
