"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

function normalizeEventCategory(cat?: string): "summit" | "masterclass" | "forum" | "award" {
  const c = (cat || "").toLowerCase();
  if (/zirve|summit/.test(c)) return "summit";
  if (/masterclass|atölye|atolye|çalıştay|calistay|eğitim|egitim|sertifika/.test(c)) return "masterclass";
  if (/ödül|odul|award|altın|altin/.test(c)) return "award";
  if (/forum|panel|sempozyum|kongre/.test(c)) return "forum";
  return "forum";
}

function getCategoryLabel(ev: any): string {
  const norm = normalizeEventCategory(ev?.category);
  if (ev?.category && !["summit", "masterclass", "forum", "award"].includes(ev.category)) {
    return ev.category;
  }
  if (norm === "summit") return "Ulusal Zirve";
  if (norm === "masterclass") return "Masterclass";
  if (norm === "award") return "Ödül Töreni";
  return "Panel & Forum";
}

function toIcsDate(dateStr?: string): string {
  const digits = (dateStr || "").replace(/[^0-9]/g, "");
  if (digits.length >= 8) return digits.slice(0, 8);
  return "20261115";
}

export default function EtkinliklerPage() {
  const [viewMode, setViewMode] = useState<"list" | "month">("list");
  const [events, setEvents] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [agendaSearch, setAgendaSearch] = useState<string>("");
  const [agendaFormat, setAgendaFormat] = useState<string>("Tüm Formatlar");
  const [agendaCategory, setAgendaCategory] = useState<string>("Tüm Kategoriler");
  const [agendaRequirement, setAgendaRequirement] = useState<string>("Tümü (Ücretsiz & Ücretli)");
  const [calendarFeedback, setCalendarFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [registeringEvent, setRegisteringEvent] = useState<any | null>(null);
  const [regStatus, setRegStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [regErrorMessage, setRegErrorMessage] = useState<string>("");

  useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.events) {
          setEvents(data.events);
        }
      })
      .catch((err) => console.error("Error fetching events:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!registeringEvent) return;
    setRegStatus("loading");
    const form = e.currentTarget;
    const formData = new FormData(form);
    const payload = {
      event_id: registeringEvent.id,
      participant_name: formData.get("participant_name"),
      participant_email: formData.get("participant_email"),
      participant_phone: formData.get("participant_phone"),
      organization: formData.get("organization"),
      position: formData.get("position"),
      notes: formData.get("notes"),
    };

    try {
      const res = await fetch("/api/events/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setRegStatus("success");
      } else {
        setRegStatus("error");
        setRegErrorMessage(data.error || "Kayıt işlemi tamamlanamadı.");
      }
    } catch {
      setRegStatus("error");
      setRegErrorMessage("Sunucu ile bağlantı kurulamadı.");
    }
  };

  const filteredEvents = events.filter((ev) => {
    const matchesCategory =
      activeCategory === "all" ||
      normalizeEventCategory(ev.category) === activeCategory;

    const matchesSearch =
      !searchQuery ||
      (ev.title && ev.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (ev.location && ev.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (ev.summary && ev.summary.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  const agendaFilteredEvents = events.filter((ev) => {
    const hay = `${ev.title || ""} ${ev.location || ""} ${ev.summary || ""} ${ev.description || ""} ${ev.category || ""}`.toLowerCase();
    if (agendaSearch.trim() && !hay.includes(agendaSearch.trim().toLowerCase())) {
      return false;
    }
    if (agendaFormat === "Yüz Yüze (Ankara)" && /online|webinar|çevrim içi|hibrit/.test(hay)) {
      return false;
    }
    if (agendaFormat === "Hibrit (Ankara + Canlı Yayın)" && !/hibrit|canlı|yayın/.test(hay)) {
      return false;
    }
    if (agendaFormat === "Tamamen Çevrim İçi (Webinar)" && !/online|webinar|çevrim/.test(hay)) {
      return false;
    }
    const normCat = normalizeEventCategory(ev.category);
    if (agendaCategory === "Zirve ve Kongreler" && normCat !== "summit") return false;
    if (agendaCategory === "Masterclass & Sertifika" && normCat !== "masterclass") return false;
    if (agendaCategory === "Akademi Panelleri" && normCat !== "forum") return false;
    if (agendaCategory === "Mesleki Sosyalleşme" && normCat !== "award") return false;

    if (agendaRequirement === "AHİD Üyelerine Özel" && !/üye|uye|özel|ozel|davet/.test(hay)) {
      return false;
    }
    if (agendaRequirement === "Sertifikalı Masterclass (Ücretli)" && normCat !== "masterclass") {
      return false;
    }
    return true;
  });

  const handleDownloadIcs = () => {
    const list = agendaFilteredEvents.length > 0 ? agendaFilteredEvents : events;
    if (list.length === 0) {
      setCalendarFeedback("Takvime aktarılacak etkinlik bulunamadı.");
      setTimeout(() => setCalendarFeedback(null), 3000);
      return;
    }
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//AHID//Etkinlik Takvimi//TR",
      "CALSCALE:GREGORIAN",
    ];
    for (const ev of list) {
      const ymd = toIcsDate(ev.event_date);
      lines.push("BEGIN:VEVENT");
      lines.push(`UID:ahid-event-${ev.id}@ahid.org.tr`);
      lines.push(`DTSTART;VALUE=DATE:${ymd}`);
      lines.push(`SUMMARY:${String(ev.title || "AHİD Etkinliği").replace(/[\r\n,;]/g, " ")}`);
      lines.push(`LOCATION:${String(ev.location || "Ankara").replace(/[\r\n,;]/g, " ")}`);
      lines.push(`DESCRIPTION:${String(ev.summary || ev.description || "").replace(/[\r\n]/g, " ")}`);
      lines.push("END:VEVENT");
    }
    lines.push("END:VCALENDAR");
    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ahid-etkinlik-takvimi.ics";
    a.click();
    URL.revokeObjectURL(url);
    setCalendarFeedback(`${list.length} etkinlik .ics takvim dosyası olarak indirildi.`);
    setTimeout(() => setCalendarFeedback(null), 3500);
  };

  const handleOpenGoogleCalendar = () => {
    const target = featuredEvent || agendaFilteredEvents[0] || events[0];
    if (!target) {
      setCalendarFeedback("Google Takvime eklenecek aktif etkinlik bulunamadı.");
      setTimeout(() => setCalendarFeedback(null), 3000);
      return;
    }
    const ymd = toIcsDate(target.event_date);
    const url = new URL("https://calendar.google.com/calendar/render");
    url.searchParams.set("action", "TEMPLATE");
    url.searchParams.set("text", target.title || "AHİD Etkinliği");
    url.searchParams.set("dates", `${ymd}/${ymd}`);
    url.searchParams.set("details", target.summary || target.description || "AHİD Etkinlik Programı");
    url.searchParams.set("location", target.location || "Ankara");
    window.open(url.toString(), "_blank", "noopener,noreferrer");
  };

  const featuredEvent = events.find((e) => e.is_featured) || events[0];


  return (
    <>
      <Navbar />
      <main className="w-full pt-[7.5rem] bg-surface min-h-[calc(100vh-28rem)]"><div className="flex flex-col w-full">
{/*  SECTION 1: BREADCRUMB & HERO INTRO  */}
<section className="relative w-full bg-surface-container-low overflow-hidden pb-space-2xl">
<div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop pt-space-lg">
{/*  Breadcrumb  */}
<nav className="flex items-center gap-space-xs font-caption-caps text-caption-caps text-slate-muted uppercase tracking-wider mb-space-md">
<Link className="hover:text-primary transition-colors" href="/">Ana Sayfa</Link>
<span className="material-symbols-outlined text-xs">chevron_right</span>
<span className="text-primary font-bold">Etkinlikler &amp; Ödüller</span>
</nav>
{/*  Grid layout for Hero intro  */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop items-end">
<div className="lg:col-span-8 flex flex-col gap-space-sm">
<div className="inline-flex items-center gap-2 self-start bg-surface-ice px-3 py-1 rounded-full text-primary font-caption-caps text-caption-caps tracking-widest uppercase">
<span className="material-symbols-outlined text-sm text-secondary">verified</span>
<span>Resmi Ajanda ve Prestij Programları 2026</span>
</div>
<h1 className="font-headline-xl text-headline-xl text-primary font-extrabold tracking-tight">
            Başkentin İletişim Zirveleri, Mesleki Buluşmalar ve Prestij Ödülleri
          </h1>
<p className="font-body-lg text-body-lg text-slate-muted max-w-3xl pt-space-xs">
            AHİD çatısı altında düzenlenen ulusal zirveler, sektörel masterclass programları, akademi panelleri ve Türkiye&apos;nin en saygın halkla ilişkiler ödülleri ile kamuoyu iletişiminde çıtayı yükseltiyoruz.
          </p>
</div>
<div className="lg:col-span-4 flex flex-col justify-end">
<div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center justify-between">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-full bg-gold-light/40 flex items-center justify-center text-gold-deep">
<span className="material-symbols-outlined text-xl">military_tech</span>
</div>
<div>
<div className="font-caption-caps text-caption-caps text-slate-muted uppercase">Günün Durumu</div>
<div className="font-label-md text-label-md text-primary font-bold">2026 Sezonu Açık Kayıt Dönemi</div>
</div>
</div>
<span className="inline-flex w-2.5 h-2.5 rounded-full bg-emerald-500" title="Aktif Kayıtlar Açık"></span>
</div>
</div>
</div>
{/*  Quick Nav Filter Tabs  */}
<div className="mt-space-xl flex flex-wrap items-center gap-space-xs bg-surface-container-lowest p-1.5 rounded-xl shadow-sm">
<button
  onClick={() => setActiveCategory("all")}
  className={`px-4 py-2 rounded font-label-md text-label-md transition-all ${activeCategory === "all" ? "bg-primary text-on-primary font-bold shadow-sm" : "text-slate-muted hover:text-primary hover:bg-surface-ice"}`}
  type="button"
>
  Tümü ({events.length})
</button>
<button
  onClick={() => setActiveCategory("summit")}
  className={`px-4 py-2 rounded font-label-md text-label-md transition-all ${activeCategory === "summit" ? "bg-primary text-on-primary font-bold shadow-sm" : "text-slate-muted hover:text-primary hover:bg-surface-ice"}`}
  type="button"
>
  Zirveler ({events.filter((e) => normalizeEventCategory(e.category) === "summit").length})
</button>
<button
  onClick={() => setActiveCategory("masterclass")}
  className={`px-4 py-2 rounded font-label-md text-label-md transition-all ${activeCategory === "masterclass" ? "bg-primary text-on-primary font-bold shadow-sm" : "text-slate-muted hover:text-primary hover:bg-surface-ice"}`}
  type="button"
>
  Masterclass &amp; Atölyeler ({events.filter((e) => normalizeEventCategory(e.category) === "masterclass").length})
</button>
<button
  onClick={() => setActiveCategory("forum")}
  className={`px-4 py-2 rounded font-label-md text-label-md transition-all ${activeCategory === "forum" ? "bg-primary text-on-primary font-bold shadow-sm" : "text-slate-muted hover:text-primary hover:bg-surface-ice"}`}
  type="button"
>
  Forum &amp; Paneller ({events.filter((e) => normalizeEventCategory(e.category) === "forum").length})
</button>
<button
  onClick={() => setActiveCategory("award")}
  className={`px-4 py-2 rounded font-label-md text-label-md transition-all flex items-center gap-1.5 ${activeCategory === "award" ? "bg-primary text-on-primary font-bold shadow-sm" : "text-slate-muted hover:text-primary hover:bg-surface-ice"}`}
  type="button"
>
  <span className="material-symbols-outlined text-sm text-gold-deep">workspace_premium</span>
  <span>AHİD Ödülleri ({events.filter((e) => normalizeEventCategory(e.category) === "award").length})</span>
</button>
</div>
{/*  Institutional Highlights Counter Strip  */}
<div className="mt-space-lg grid grid-cols-2 md:grid-cols-4 gap-gutter-desktop">
<div className="bg-surface-container-lowest/80 p-space-md rounded-xl backdrop-blur-sm shadow-sm flex flex-col">
<div className="font-headline-lg text-headline-lg font-extrabold text-primary">120+</div>
<div className="font-label-sm text-label-sm text-slate-muted uppercase tracking-wider mt-0.5">Gerçekleşen Etkinlik</div>
</div>
<div className="bg-surface-container-lowest/80 p-space-md rounded-xl backdrop-blur-sm shadow-sm flex flex-col">
<div className="font-headline-lg text-headline-lg font-extrabold text-secondary">4.500+</div>
<div className="font-label-sm text-label-sm text-slate-muted uppercase tracking-wider mt-0.5">Katılımcı &amp; Delege</div>
</div>
<div className="bg-surface-container-lowest/80 p-space-md rounded-xl backdrop-blur-sm shadow-sm flex flex-col">
<div className="font-headline-lg text-headline-lg font-extrabold text-gold-deep">8. Dönem</div>
<div className="font-label-sm text-label-sm text-slate-muted uppercase tracking-wider mt-0.5">Altın Başak &amp; Başkent Ödülü</div>
</div>
<div className="bg-surface-container-lowest/80 p-space-md rounded-xl backdrop-blur-sm shadow-sm flex flex-col">
<div className="font-headline-lg text-headline-lg font-extrabold text-primary-container">14</div>
<div className="font-label-sm text-label-sm text-slate-muted uppercase tracking-wider mt-0.5">Akredite Masterclass</div>
</div>
</div>
</div>
</section>
{/*  SECTION 2: FEATURED MEGA EVENT (AMİRAL GEMİSİ)  */}
{featuredEvent && (
<section className="max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop -mt-8 w-full z-10">
<div className="bg-primary text-on-primary rounded-xl overflow-hidden shadow-xl grid grid-cols-1 lg:grid-cols-12 relative">
<div className="absolute inset-0 bg-gradient-to-r from-primary via-primary-container/95 to-secondary/80 pointer-events-none"></div>
{/*  Left Narrative / Info Column  */}
<div className="relative z-10 lg:col-span-7 p-space-lg lg:p-space-xl flex flex-col justify-between">
<div>
{/*  Badges  */}
<div className="flex flex-wrap items-center gap-space-xs mb-space-md">
<span className="inline-flex items-center gap-1 bg-gold-light text-gold-deep font-caption-caps text-caption-caps px-3 py-1 rounded-full font-bold">
<span className="material-symbols-outlined text-xs">local_fire_department</span>
<span>ÖNE ÇIKAN ETKİNLİK</span>
</span>
<span className="bg-surface-variant/20 text-inverse-primary font-caption-caps text-caption-caps px-3 py-1 rounded-full">
              Kayıtlar Açık
            </span>
<span className="bg-surface-variant/20 text-inverse-primary font-caption-caps text-caption-caps px-3 py-1 rounded-full">
              CPD 16 Kredi
            </span>
</div>
<h2 className="font-headline-xl text-headline-xl font-extrabold text-on-primary leading-tight">
            {featuredEvent.title}
          </h2>
<p className="font-body-md text-body-md text-on-primary-container mt-space-sm max-w-xl">
            {featuredEvent.summary || featuredEvent.description || "AHİD çatısı altında düzenlenen ulusal zirve ve mesleki prestij programı."}
          </p>
{/*  Logistics Matrix  */}
<div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm mt-space-lg pt-space-md bg-white/5 p-space-md rounded-xl backdrop-blur-sm">
<div>
<div className="font-caption-caps text-caption-caps text-gold-light uppercase font-semibold">Tarih</div>
<div className="font-label-md text-label-md text-on-primary mt-0.5">{featuredEvent.event_date}</div>
</div>
<div>
<div className="font-caption-caps text-caption-caps text-gold-light uppercase font-semibold">Lokasyon</div>
<div className="font-label-md text-label-md text-on-primary mt-0.5">{featuredEvent.location}</div>
</div>
<div>
<div className="font-caption-caps text-caption-caps text-gold-light uppercase font-semibold">Saat</div>
<div className="font-label-md text-label-md text-on-primary mt-0.5">{featuredEvent.event_time || "09:30"}</div>
</div>
<div>
<div className="font-caption-caps text-caption-caps text-gold-light uppercase font-semibold">Sertifikasyon</div>
<div className="font-label-md text-label-md text-on-primary mt-0.5">AHİD CPD Onaylı</div>
</div>
</div>
</div>
{/*  Action CTAs  */}
<div className="flex flex-wrap items-center gap-space-sm mt-space-xl pt-space-sm">
<button onClick={() => { setRegisteringEvent(featuredEvent); setRegStatus("idle"); setRegErrorMessage(""); }} className="inline-flex items-center justify-center gap-2 bg-[#c25e00] hover:bg-[#a04703] text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 cursor-pointer" type="button">
<span className="material-symbols-outlined text-base">how_to_reg</span>
<span>Kayıt Ol &amp; Yerini Ayırt (Üyelere Ücretsiz)</span>
</button>
<Link className="inline-flex items-center justify-center gap-2 bg-surface-container-lowest/10 hover:bg-surface-container-lowest/20 text-on-primary font-label-md text-label-md px-5 py-3 rounded backdrop-blur-sm transition-all" href={`/etkinlikler/${featuredEvent.id}`}>
<span className="material-symbols-outlined text-base">event_note</span>
<span>Detaylı Programı İncele</span>
</Link>
</div>
</div>
{/*  Right Visual Feature Column  */}
<div className="relative lg:col-span-5 min-h-[320px] lg:min-h-full">
<img className="w-full h-full object-cover object-center" alt={featuredEvent.title} src={featuredEvent.image_url || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800"} />
<div className="absolute inset-0 bg-gradient-to-t from-primary via-transparent to-transparent lg:hidden"></div>
</div>
</div>
</section>
)}
{/*  SECTION 3: YAKLAŞAN ETKİNLİKLER & MASTERCLASS TAKVİMİ  */}
<section className="max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop py-space-2xl w-full">
<div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-xl">
<div>
<div className="inline-flex items-center gap-2 font-caption-caps text-caption-caps text-secondary font-bold uppercase tracking-widest mb-1">
<span className="material-symbols-outlined text-sm">schedule</span>
<span>Profesyonel Gelişim Takvimi</span>
</div>
<h2 className="font-headline-lg text-headline-lg font-bold text-primary">
          Yaklaşan Etkinlikler ve Masterclass Programları
        </h2>
<p className="font-body-md text-body-md text-slate-muted mt-1">
          Mesleki yeterliliklerinizi akredite edin; sektörün öncü isimleriyle yüz yüze temas kurun.
        </p>
</div>
<a className="inline-flex items-center gap-1 font-label-md text-label-md text-secondary hover:text-primary transition-colors" href="#etkinlik-ajanda">
<span>Tüm Takvim Filtreleri</span>
<span className="material-symbols-outlined text-base">arrow_forward</span>
</a>
</div>
{/*  Search bar and category counter  */}
<div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
  <div className="relative w-full sm:w-96">
    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">search</span>
    <input
      type="text"
      placeholder="Etkinlik adı, salon veya anahtar kelime ara..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="w-full bg-surface-container-lowest pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-primary shadow-xs"
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
  <div className="text-sm font-semibold text-slate-500">
    Toplam <span className="text-primary font-bold">{filteredEvents.length}</span> etkinlik listeleniyor
  </div>
</div>

{/*  Event Cards Grid  */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter-desktop">
  {loading ? (
    [1, 2, 3].map((n) => (
      <div key={n} className="bg-surface-container-lowest rounded-xl p-5 shadow-sm animate-pulse space-y-4">
        <div className="h-44 w-full bg-slate-200 rounded-lg" />
        <div className="h-5 w-3/4 bg-slate-200 rounded" />
        <div className="h-12 w-full bg-slate-200 rounded" />
        <div className="h-9 w-full bg-slate-200 rounded" />
      </div>
    ))
  ) : filteredEvents.length === 0 ? (
    <div className="col-span-full bg-surface-container-lowest p-12 rounded-xl text-center border border-dashed border-slate-200">
      <span className="material-symbols-outlined text-5xl text-slate-400 mb-3">event_busy</span>
      <h3 className="font-headline-sm font-bold text-primary mb-2">Kayıtlı etkinlik bulunmuyor</h3>
      <p className="text-slate-500 text-sm max-w-md mx-auto mb-5">
        Veritabanında henüz planlanmış bir etkinlik yer almamaktadır. Yönetim panelinden yeni etkinlik ekleyebilirsiniz.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {(activeCategory !== "all" || searchQuery) && (
          <button
            onClick={() => {
              setActiveCategory("all");
              setSearchQuery("");
            }}
            className="px-5 py-2.5 bg-surface-ice text-primary rounded-lg text-xs font-bold hover:bg-surface-container-high transition-all cursor-pointer"
          >
            Filtreleri Temizle
          </button>
        )}
        <Link
          href="/iletisim"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary text-white rounded-lg text-xs font-bold shadow hover:bg-primary-container transition-all"
        >
          <span className="material-symbols-outlined text-sm">mail</span>
          Etkinlik &amp; Program Bilgisi Talep Et
        </Link>
      </div>
    </div>
  ) : (
    filteredEvents.map((ev, idx) => (
      <article
        key={ev.id || idx}
        className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
      >
        <div>
          <div className="relative h-48 w-full overflow-hidden bg-surface-container">
            <img
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              alt={ev.title}
              src={ev.image_url || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1000"}
            />
            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
              <span className="bg-primary text-on-primary font-caption-caps text-caption-caps px-2.5 py-1 rounded-full uppercase font-bold tracking-wider">
                {getCategoryLabel(ev)}
              </span>
              {ev.registration_open && (
                <span className="bg-emerald-600 text-white font-caption-caps text-caption-caps px-2.5 py-1 rounded-full font-bold">
                  Kayıt Açık
                </span>
              )}
            </div>
            <div className="absolute bottom-3 right-3 bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1 rounded text-primary font-label-sm text-label-sm font-bold">
              {ev.event_date}
            </div>
          </div>
          <div className="p-space-lg flex flex-col gap-space-sm">
            <div className="flex items-center gap-2 text-slate-muted font-body-sm text-body-sm">
              <span className="material-symbols-outlined text-sm text-secondary">location_on</span>
              <span>{ev.location || "Ankara"}</span>
            </div>
            <h3 className="font-headline-sm text-headline-sm font-bold text-primary group-hover:text-secondary transition-colors">
              <Link href={`/etkinlikler/${ev.id}`}>{ev.title}</Link>
            </h3>
            <p className="font-body-sm text-body-sm text-slate-muted line-clamp-3">
              {ev.summary || ev.description || "AHİD mesleki etkinlik programı kapsamında düzenlenmektedir."}
            </p>
            <div className="mt-space-sm pt-space-sm bg-surface-container-low p-space-sm rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">schedule</span>
                <span className="font-label-sm text-label-sm font-semibold text-primary">
                  Saat: {ev.event_time || "10:00"}
                </span>
              </div>
              <span className="font-caption-caps text-caption-caps text-slate-muted">AHİD Akrediteli</span>
            </div>
          </div>
        </div>
        <div className="p-space-lg pt-0 flex items-center justify-between">
          <span className="font-label-md text-label-md text-primary font-bold">
            {ev.registration_open ? "Katılım Açık" : "Kontenjan Doldu"}
          </span>
          <button
            onClick={() => {
              setRegisteringEvent(ev);
              setRegStatus("idle");
              setRegErrorMessage("");
            }}
            className="inline-flex items-center justify-center bg-[#0b3d91] hover:bg-[#082b66] text-white font-semibold px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 active:scale-95 cursor-pointer"
            type="button"
          >
            <span>Kayıt Ol</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </article>
    ))
  )}
</div>
</section>
{/*  SECTION 4: INTERACTIVE CALENDAR & FILTERS MODULE  */}
<section id="etkinlik-ajanda" className="scroll-mt-28 max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop w-full pb-space-2xl">
<div className="bg-surface-container-lowest p-space-lg lg:p-space-xl rounded-xl shadow-md">
{/*  Calendar Header & Controls  */}
<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md pb-space-lg">
<div>
<h3 className="font-headline-md text-headline-md font-bold text-primary flex items-center gap-2">
<span className="material-symbols-outlined text-secondary">calendar_month</span>
<span>AHİD Yıllık Ajanda &amp; Etkinlik Filtreleme</span>
</h3>
<p className="font-body-sm text-body-sm text-slate-muted mt-1">
            Programları formatına, konusuna ve tarih aralığına göre arayın veya kişisel takviminize entegre edin.
          </p>
</div>
{/*  Export & Toggle CTAs  */}
<div className="flex flex-wrap items-center gap-space-xs">
<button onClick={handleOpenGoogleCalendar} className="inline-flex items-center gap-1.5 px-3 py-2 rounded bg-surface-ice hover:bg-surface-variant text-primary font-label-sm text-label-sm transition-colors cursor-pointer" type="button">
<span className="material-symbols-outlined text-sm">add_to_drive</span>
<span>Google Takvime Ekle</span>
</button>
<button onClick={handleDownloadIcs} className="inline-flex items-center gap-1.5 px-3 py-2 rounded bg-surface-ice hover:bg-surface-variant text-primary font-label-sm text-label-sm transition-colors cursor-pointer" type="button">
<span className="material-symbols-outlined text-sm">download</span>
<span>iCal İndir (.ics)</span>
</button>
<div className="flex items-center bg-surface-container-low p-1 rounded">
<button
  className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer transition-colors ${viewMode === "list" ? "bg-surface-container-lowest text-primary shadow-xs" : "text-slate-muted hover:text-primary"}`}
  id="viewListBtn"
  onClick={() => setViewMode("list")}
  type="button"
>
  Liste
</button>
<button
  className={`px-2.5 py-1 text-xs font-semibold rounded cursor-pointer transition-colors ${viewMode === "month" ? "bg-surface-container-lowest text-primary shadow-xs" : "text-slate-muted hover:text-primary"}`}
  id="viewMonthBtn"
  onClick={() => setViewMode("month")}
  type="button"
>
  Ay
</button>
</div>
</div>
</div>
{calendarFeedback && (
  <div className="mb-4 px-4 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
    {calendarFeedback}
  </div>
)}
{/*  Filters Row  */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-sm pt-space-md">
<div>
<label className="block font-caption-caps text-caption-caps text-slate-muted uppercase mb-1">Arama</label>
<div className="relative">
<input
  value={agendaSearch}
  onChange={(e) => setAgendaSearch(e.target.value)}
  className="w-full bg-surface text-on-surface px-3 py-2 pl-9 rounded text-body-sm font-body-sm outline-none shadow-xs"
  placeholder="Konu, salon veya anahtar kelime..."
  type="text"
/>
<span className="material-symbols-outlined absolute left-2.5 top-2.5 text-slate-muted text-sm">search</span>
</div>
</div>
<div>
<label className="block font-caption-caps text-caption-caps text-slate-muted uppercase mb-1">Format</label>
<select
  value={agendaFormat}
  onChange={(e) => setAgendaFormat(e.target.value)}
  className="w-full bg-surface text-on-surface px-3 py-2 rounded text-body-sm font-body-sm outline-none shadow-xs"
>
<option>Tüm Formatlar</option>
<option>Yüz Yüze (Ankara)</option>
<option>Hibrit (Ankara + Canlı Yayın)</option>
<option>Tamamen Çevrim İçi (Webinar)</option>
</select>
</div>
<div>
<label className="block font-caption-caps text-caption-caps text-slate-muted uppercase mb-1">Kategori</label>
<select
  value={agendaCategory}
  onChange={(e) => setAgendaCategory(e.target.value)}
  className="w-full bg-surface text-on-surface px-3 py-2 rounded text-body-sm font-body-sm outline-none shadow-xs"
>
<option>Tüm Kategoriler</option>
<option>Zirve ve Kongreler</option>
<option>Masterclass &amp; Sertifika</option>
<option>Akademi Panelleri</option>
<option>Mesleki Sosyalleşme</option>
</select>
</div>
<div>
<label className="block font-caption-caps text-caption-caps text-slate-muted uppercase mb-1">Katılım Şartı</label>
<select
  value={agendaRequirement}
  onChange={(e) => setAgendaRequirement(e.target.value)}
  className="w-full bg-surface text-on-surface px-3 py-2 rounded text-body-sm font-body-sm outline-none shadow-xs"
>
<option>Tümü (Ücretsiz &amp; Ücretli)</option>
<option>Tamamen Ücretsiz / Herkese Açık</option>
<option>AHİD Üyelerine Özel</option>
<option>Sertifikalı Masterclass (Ücretli)</option>
</select>
</div>
</div>
{/*  Calendar Agenda Table / Stream View  */}
<div className="mt-space-lg flex flex-col gap-space-xs">
  {agendaFilteredEvents.length === 0 ? (
    <div className="p-8 rounded-lg bg-surface-container-low text-center text-slate-500">
      <span className="material-symbols-outlined text-3xl text-slate-400 mb-1">event_busy</span>
      <p className="font-semibold text-primary">Seçilen kriterlere uygun etkinlik bulunmuyor</p>
      <p className="text-xs text-slate-400 mt-1">Ajanda filtrelerini sıfırlayarak tüm programı görüntüleyebilirsiniz.</p>
      <button
        type="button"
        onClick={() => {
          setAgendaSearch("");
          setAgendaFormat("Tüm Formatlar");
          setAgendaCategory("Tüm Kategoriler");
          setAgendaRequirement("Tümü (Ücretsiz & Ücretli)");
        }}
        className="mt-3 px-4 py-1.5 rounded bg-primary text-white text-xs font-semibold cursor-pointer"
      >
        Ajanda Filtrelerini Sıfırla
      </button>
    </div>
  ) : viewMode === "month" ? (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-sm">
      {agendaFilteredEvents.map((ev) => (
        <div key={ev.id} className="p-space-md rounded-lg bg-surface-container-low border border-slate-200/70 flex flex-col justify-between gap-3">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="bg-primary/10 text-primary font-caption-caps text-caption-caps px-2 py-0.5 rounded font-bold uppercase">
                {getCategoryLabel(ev)}
              </span>
              <span className="text-xs font-bold text-secondary">{ev.event_date}</span>
            </div>
            <Link href={`/etkinlikler/${ev.id}`} className="font-label-md text-label-md font-bold text-primary hover:underline block">
              {ev.title}
            </Link>
            <p className="font-body-sm text-body-sm text-slate-muted mt-1">{ev.location}</p>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
            <span className="text-xs text-slate-500">{ev.event_time || "10:00"}</span>
            <button
              type="button"
              onClick={() => { setRegisteringEvent(ev); setRegStatus("idle"); setRegErrorMessage(""); }}
              className="px-3 py-1.5 bg-primary hover:bg-secondary text-on-primary rounded font-label-sm text-label-sm transition-colors cursor-pointer"
            >
              Başvur
            </button>
          </div>
        </div>
      ))}
    </div>
  ) : (
    agendaFilteredEvents.map((ev) => (
      <div key={ev.id} className="p-space-md rounded-lg bg-surface-container-low hover:bg-surface-ice transition-all flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div className="flex items-start sm:items-center gap-space-md">
          <div className="flex flex-col items-center justify-center bg-surface-container-lowest text-primary rounded px-3 py-2 min-w-[70px] shadow-xs">
            <span className="font-caption-caps text-caption-caps uppercase text-secondary font-bold">TARİH</span>
            <span className="font-headline-sm text-headline-sm font-extrabold leading-none">{ev.event_date}</span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-primary/10 text-primary font-caption-caps text-caption-caps px-2 py-0.5 rounded font-bold uppercase">{getCategoryLabel(ev)}</span>
              <span className="text-slate-muted font-body-sm text-body-sm">{ev.event_time || ""}</span>
            </div>
            <Link href={`/etkinlikler/${ev.id}`} className="font-label-md text-label-md font-bold text-primary hover:underline">
              {ev.title}
            </Link>
            <p className="font-body-sm text-body-sm text-slate-muted">{ev.location}</p>
          </div>
        </div>
        <div className="flex items-center gap-space-sm self-end md:self-center">
          <button
            type="button"
            onClick={() => { setRegisteringEvent(ev); setRegStatus("idle"); setRegErrorMessage(""); }}
            className="px-4 py-2 bg-primary hover:bg-secondary text-on-primary rounded font-label-sm text-label-sm transition-colors cursor-pointer"
          >
            Başvur
          </button>
        </div>
      </div>
    ))
  )}
</div>
</div>
</section>
{/*  SECTION 5: AHİD İLETİŞİM ÖDÜLLERİ 2026 (PRESTIGE SECTION)  */}
<section className="w-full bg-gradient-to-b from-primary via-primary-container to-primary text-on-primary py-space-3xl relative overflow-hidden">
{/*  Glow and ambient decor  */}
<div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-gold-light/10 blur-3xl pointer-events-none"></div>
<div className="absolute bottom-0 left-10 w-96 h-96 rounded-full bg-secondary-container/10 blur-3xl pointer-events-none"></div>
<div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop relative z-10">
{/*  Section Header with Gold Laurel Embellishment  */}
<div className="flex flex-col items-center text-center max-w-3xl mx-auto">
<div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold-deep/30 text-gold-light font-caption-caps text-caption-caps uppercase tracking-widest font-bold mb-space-sm">
<span className="material-symbols-outlined text-base">military_tech</span>
<span>Türkiye'nin En Prestijli Halkla İlişkiler Akreditasyonu</span>
</div>
<h2 className="font-display-hero text-headline-xl lg:text-display-hero font-extrabold text-on-primary tracking-tight">
          2026 AHİD İletişim ve Halkla İlişkiler Başarı Ödülleri
        </h2>
<div className="w-20 h-1 bg-gold-light rounded-full my-space-md"></div>
<p className="font-body-lg text-body-lg text-inverse-on-surface">
          Kamu, özel sektör ve sivil toplumda etik, şeffaf ve toplumsal etki yaratan en başarılı iletişim kampanyalarını onurlandırıyor, mesleki mükemmeliyeti taçlandırıyoruz.
        </p>
</div>
{/*  4 Award Categories Bento Grid  */}
<div className="mt-space-2xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter-desktop">
{/*  Category 1  */}
<div className="bg-surface-container-lowest/10 backdrop-blur-md rounded-xl p-space-lg flex flex-col justify-between hover:bg-surface-container-lowest/15 transition-all group">
<div>
<div className="w-12 h-12 rounded-lg bg-gold-light/20 flex items-center justify-center text-gold-light mb-space-md group-hover:scale-110 transition-transform">
<span className="material-symbols-outlined text-2xl">account_balance</span>
</div>
<div className="font-caption-caps text-caption-caps text-gold-light uppercase tracking-wider font-semibold">Kategori 01</div>
<h3 className="font-headline-sm text-headline-sm font-bold text-on-primary mt-1">
              Yılın Kamu Diplomasisi ve Şeffaflık Kampanyası
            </h3>
<p className="font-body-sm text-body-sm text-on-primary-container mt-2">
              Vatandaş odaklı bilgilendirme projeleri, kamu kurumlarının kriz anlarındaki şeffaf yönetişim başarıları.
            </p>
</div>
<div className="pt-space-md mt-space-md flex items-center text-gold-light font-caption-caps text-caption-caps uppercase">
<span>Bağımsız Jüri Denetiminde</span>
</div>
</div>
{/*  Category 2  */}
<div className="bg-surface-container-lowest/10 backdrop-blur-md rounded-xl p-space-lg flex flex-col justify-between hover:bg-surface-container-lowest/15 transition-all group">
<div>
<div className="w-12 h-12 rounded-lg bg-gold-light/20 flex items-center justify-center text-gold-light mb-space-md group-hover:scale-110 transition-transform">
<span className="material-symbols-outlined text-2xl">shield</span>
</div>
<div className="font-caption-caps text-caption-caps text-gold-light uppercase tracking-wider font-semibold">Kategori 02</div>
<h3 className="font-headline-sm text-headline-sm font-bold text-on-primary mt-1">
              En Başarılı Kriz ve İtibar Yönetimi Vakası
            </h3>
<p className="font-body-sm text-body-sm text-on-primary-container mt-2">
              Özel sektör ya da kamuya yönelik ani kriz anlarında kurumsal itibarı koruyan ve hasarı önleyen çevik stratejiler.
            </p>
</div>
<div className="pt-space-md mt-space-md flex items-center text-gold-light font-caption-caps text-caption-caps uppercase">
<span>Vaka Analizi Esaslı</span>
</div>
</div>
{/*  Category 3  */}
<div className="bg-surface-container-lowest/10 backdrop-blur-md rounded-xl p-space-lg flex flex-col justify-between hover:bg-surface-container-lowest/15 transition-all group">
<div>
<div className="w-12 h-12 rounded-lg bg-gold-light/20 flex items-center justify-center text-gold-light mb-space-md group-hover:scale-110 transition-transform">
<span className="material-symbols-outlined text-2xl">menu_book</span>
</div>
<div className="font-caption-caps text-caption-caps text-gold-light uppercase tracking-wider font-semibold">Kategori 03</div>
<h3 className="font-headline-sm text-headline-sm font-bold text-on-primary mt-1">
              Yılın Akademik Araştırma ve Literatür Ödülü
            </h3>
<p className="font-body-sm text-body-sm text-on-primary-container mt-2">
              Türkiye'de halkla ilişkiler disiplinine özgün katkı sağlayan hakemli makale, doktora tezi ya da araştırma kitapları.
            </p>
</div>
<div className="pt-space-md mt-space-md flex items-center text-gold-light font-caption-caps text-caption-caps uppercase">
<span>Akademik Kurul Seçimi</span>
</div>
</div>
{/*  Category 4  */}
<div className="bg-surface-container-lowest/10 backdrop-blur-md rounded-xl p-space-lg flex flex-col justify-between hover:bg-surface-container-lowest/15 transition-all group">
<div>
<div className="w-12 h-12 rounded-lg bg-gold-light/20 flex items-center justify-center text-gold-light mb-space-md group-hover:scale-110 transition-transform">
<span className="material-symbols-outlined text-2xl">auto_awesome</span>
</div>
<div className="font-caption-caps text-caption-caps text-gold-light uppercase tracking-wider font-semibold">Kategori 04</div>
<h3 className="font-headline-sm text-headline-sm font-bold text-on-primary mt-1">
              Geleceğin İletişimcisi: Genç Yetenekler
            </h3>
<p className="font-body-sm text-body-sm text-on-primary-container mt-2">
              İletişim fakültesi lisans ve yüksek lisans öğrencilerinin hazırladığı yaratıcı ve uygulanabilir sosyal sorumluluk kampanyaları.
            </p>
</div>
<div className="pt-space-md mt-space-md flex items-center text-gold-light font-caption-caps text-caption-caps uppercase">
<span>Staj &amp; Burs Ödüllü</span>
</div>
</div>
</div>
{/*  Timeline & Stages Indicator  */}
<div className="mt-space-2xl bg-surface-container-lowest/10 backdrop-blur-md p-space-lg lg:p-space-xl rounded-xl">
<div className="flex flex-col md:flex-row items-center justify-between mb-space-lg pb-space-sm">
<div>
<h3 className="font-headline-sm text-headline-sm font-bold text-on-primary">
              2026 Ödül Süreci ve Değerlendirme Takvimi
            </h3>
<p className="font-body-sm text-body-sm text-on-primary-container">Şeffaf jüri puanlama sistemi 4 aşamada yürütülmektedir.</p>
</div>
<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-secondary-container/40 text-on-primary font-caption-caps text-caption-caps uppercase font-bold mt-2 md:mt-0">
<span className="w-2 h-2 rounded-full bg-gold-light"></span>
<span>Aşama 2 Devam Ediyor</span>
</span>
</div>
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md relative">
{/*  Step 1  */}
<div className="p-space-md rounded-lg bg-white/5 flex flex-col justify-between">
<div>
<div className="flex items-center justify-between mb-2">
<span className="font-caption-caps text-caption-caps text-slate-muted uppercase font-bold">1. AŞAMA</span>
<span className="material-symbols-outlined text-emerald-400 text-lg">check_circle</span>
</div>
<div className="font-label-md text-label-md font-bold text-on-primary">Başvuru Kabulü</div>
<div className="font-body-sm text-body-sm text-on-primary-container mt-1">1 Eylül - 15 Ekim 2026</div>
</div>
<div className="mt-3">
<span className="inline-flex text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-medium">Tamamlandı</span>
</div>
</div>
{/*  Step 2 (Active)  */}
<div className="p-space-md rounded-lg bg-gold-deep/20 shadow-md flex flex-col justify-between">
<div>
<div className="flex items-center justify-between mb-2">
<span className="font-caption-caps text-caption-caps text-gold-light uppercase font-bold">2. AŞAMA</span>
<span className="material-symbols-outlined text-gold-light text-lg">pending</span>
</div>
<div className="font-label-md text-label-md font-bold text-gold-light">Bağımsız Jüri İncelemesi</div>
<div className="font-body-sm text-body-sm text-on-primary-container mt-1">16 Ekim - 5 Kasım 2026</div>
</div>
<div className="mt-3">
<span className="inline-flex text-xs px-2 py-0.5 rounded bg-gold-deep text-gold-light font-bold">Devam Ediyor</span>
</div>
</div>
{/*  Step 3  */}
<div className="p-space-md rounded-lg bg-white/5 flex flex-col justify-between">
<div>
<div className="flex items-center justify-between mb-2">
<span className="font-caption-caps text-caption-caps text-slate-muted uppercase font-bold">3. AŞAMA</span>
<span className="material-symbols-outlined text-slate-muted text-lg">radio_button_unchecked</span>
</div>
<div className="font-label-md text-label-md font-bold text-on-primary">Kısa Liste Açıklanması</div>
<div className="font-body-sm text-body-sm text-on-primary-container mt-1">10 Kasım 2026</div>
</div>
<div className="mt-3">
<span className="inline-flex text-xs px-2 py-0.5 rounded bg-white/10 text-on-primary-container">Bekleniyor</span>
</div>
</div>
{/*  Step 4  */}
<div className="p-space-md rounded-lg bg-white/5 flex flex-col justify-between">
<div>
<div className="flex items-center justify-between mb-2">
<span className="font-caption-caps text-caption-caps text-slate-muted uppercase font-bold">4. AŞAMA</span>
<span className="material-symbols-outlined text-gold-light text-lg">celebration</span>
</div>
<div className="font-label-md text-label-md font-bold text-on-primary">Büyük Gala &amp; Ödül Töreni</div>
<div className="font-body-sm text-body-sm text-on-primary-container mt-1">15 Aralık 2026 | Ankara</div>
</div>
<div className="mt-3">
<span className="inline-flex text-xs px-2 py-0.5 rounded bg-white/10 text-on-primary-container">Protokol Davetli</span>
</div>
</div>
</div>
</div>
{/*  Jury Preview Row  */}
<div className="mt-space-xl flex flex-col md:flex-row items-center justify-between gap-space-lg bg-black/20 p-space-lg rounded-xl">
<div className="flex flex-col">
<div className="font-caption-caps text-caption-caps text-gold-light uppercase font-bold tracking-wider">Bağımsız Jüri Heyeti</div>
<div className="font-label-md text-label-md font-bold text-on-primary mt-1">Sektörün ve Akademinin Tarafsız Otoriteleri</div>
<p className="font-body-sm text-body-sm text-on-primary-container max-w-md mt-0.5">AHİD Etik Tüzüğü gereğince jüri üyeleri ad-soyad ve kurum gizlilik beyannamesiyle puanlama yapmaktadır.</p>
</div>
<div className="flex items-center gap-space-md">
<div className="flex -space-x-3 overflow-hidden" aria-label="Akademi, Medya ve Kurumsal İletişim Jüri Temsilcileri">
<div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary-container text-gold-light ring-2 ring-gold-light text-xs font-bold tracking-wider" title="Akademi Temsilcisi">
  AK
</div>
<div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-on-primary ring-2 ring-gold-light text-xs font-bold tracking-wider" title="Medya Temsilcisi">
  MD
</div>
<div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-gold-light ring-2 ring-gold-light text-xs font-bold tracking-wider" title="Kurumsal İletişim Temsilcisi">
  PR
</div>
</div>
<div className="font-body-sm text-body-sm">
<div className="font-bold text-on-primary">Seçkin Jüri Kurulu</div>
<Link className="text-gold-light hover:underline font-label-sm text-label-sm" href="/baskanlar-ve-kurullar">Jüri &amp; Kurullarımızı İncele →</Link>
</div>
</div>
<div className="flex flex-wrap items-center gap-space-xs">
<Link className="px-5 py-2.5 rounded bg-gold-deep hover:bg-gold-light hover:text-gold-deep text-on-tertiary font-label-sm text-label-sm font-semibold transition-all shadow-md" href="/kaynaklar">
            Ödül &amp; Mevzuat Şartnamesi
          </Link>
<Link className="px-5 py-2.5 rounded bg-surface-container-lowest/15 hover:bg-surface-container-lowest/25 text-on-primary font-label-sm text-label-sm transition-all" href="/yayinlar#abonelik">
            Kısa Liste Bildirimi Al
          </Link>
</div>
</div>
</div>
</section>
{/*  SECTION 6: GEÇMİŞ ETKİNLİKLER & MEDYA ARŞİVİ  */}
<section className="max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop py-space-3xl w-full">
<div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-xl">
<div>
<div className="inline-flex items-center gap-2 font-caption-caps text-caption-caps text-secondary font-bold uppercase tracking-widest mb-1">
<span className="material-symbols-outlined text-sm">history_edu</span>
<span>Kurumsal Bellek &amp; Arşiv</span>
</div>
<h2 className="font-headline-lg text-headline-lg font-bold text-primary">
          Geçmiş Zirveler, Bildiriler ve Medya Kayıtları
        </h2>
<p className="font-body-md text-body-md text-slate-muted mt-1">
          1990 yılından bu yana başkentte gerçekleştirdiğimiz oturumların sunumları ve medya arşivi erişiminize açıktır.
        </p>
</div>
<a className="inline-flex items-center gap-1 bg-surface-ice hover:bg-primary hover:text-on-primary text-primary px-4 py-2 rounded font-label-md text-label-md transition-colors" href="#etkinlik-ajanda">
<span>Tüm Ajanda Arşivini İncele</span>
<span className="material-symbols-outlined text-sm">archive</span>
</a>
</div>
{/*  Archive Mosaic Bento Grid  */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-gutter-desktop">
  <div className="md:col-span-2 bg-surface-container-lowest rounded-xl p-10 text-center border border-dashed border-slate-200 flex flex-col items-center justify-center">
    <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">inventory_2</span>
    <h3 className="font-headline-sm text-headline-sm font-bold text-primary">Geçmiş Etkinlik Arşivi</h3>
    <p className="font-body-sm text-body-sm text-slate-500 mt-1 max-w-md">
      Tamamlanan zirve ve oturum kayıtları veritabanına eklendikçe bu arşiv alanında listelenecektir.
    </p>
  </div>
{/*  Past Event 3 (Media Archive Callout)  */}
<div className="bg-surface-container-low rounded-xl p-space-lg flex flex-col justify-between">
<div>
<div className="w-10 h-10 rounded-full bg-secondary text-on-secondary flex items-center justify-center mb-space-sm">
<span className="material-symbols-outlined text-xl">play_circle</span>
</div>
<h3 className="font-headline-sm text-headline-sm font-bold text-primary">
            AHİD Basın &amp; Medya Arşivi
          </h3>
<p className="font-body-sm text-body-sm text-slate-muted mt-2">
            Zirve oturum özetleri, usta söyleşileri ve dernek basın bültenlerini kurumsal yayın kütüphanemizden inceleyin.
          </p>
<div className="mt-space-md flex flex-col gap-2">
<div className="flex items-center gap-2 text-sm text-primary font-medium">
<span className="material-symbols-outlined text-secondary text-base">newspaper</span>
<span>Basın Bültenleri &amp; Duyurular</span>
</div>
<div className="flex items-center gap-2 text-sm text-primary font-medium">
<span className="material-symbols-outlined text-secondary text-base">folder_open</span>
<span>Mevzuat &amp; Sektörel Raporlar</span>
</div>
</div>
</div>
<Link className="mt-space-lg w-full py-2.5 rounded bg-primary text-on-primary hover:bg-secondary text-center font-label-md text-label-md transition-colors font-semibold shadow-sm" href="/haberler">
          Basın &amp; Medya Arşivine Git
        </Link>
</div>
</div>
</section>
{/*  SECTION 7: CALL TO ACTION (SPONSORLUK & KONUŞMACI ÇAĞRISI)  */}
<section className="max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop pb-space-3xl w-full">
<div className="bg-surface-container-lowest rounded-xl p-space-lg lg:p-space-2xl shadow-lg relative overflow-hidden">
<div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-surface-ice pointer-events-none"></div>
<div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
<div className="lg:col-span-8 flex flex-col gap-space-xs">
<span className="font-caption-caps text-caption-caps text-gold-deep font-bold uppercase tracking-wider">İş Birliği &amp; Paydaşlık</span>
<h2 className="font-headline-lg text-headline-lg font-bold text-primary">
            Etkinliklerimize Sponsor Olun veya Konuşmacı Olarak Deneyiminizi Paylaşın
          </h2>
<p className="font-body-md text-body-md text-slate-muted max-w-2xl mt-1">
            Ankara&apos;nın en etkin iletişim ağında markanızı konumlandırın ya da uzmanlığınızla meslektaşlarımıza rehberlik edin. Başvuru talepleriniz komitemiz tarafından değerlendirilir.
          </p>
</div>
<div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-space-sm justify-center">
<Link className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-secondary text-on-primary font-label-md text-label-md px-5 py-3 rounded shadow-md hover:shadow-lg transition-all font-semibold text-center" href="/iletisim?konu=Sponsorluk">
<span className="material-symbols-outlined text-base">handshake</span>
<span>Etkinlik Sponsorluk Talebi (2026)</span>
</Link>
<Link className="inline-flex items-center justify-center gap-2 bg-surface-ice hover:bg-primary-fixed text-primary font-label-md text-label-md px-5 py-3 rounded transition-all text-center" href="/iletisim?konu=Konusmaci">
<span className="material-symbols-outlined text-base">mic</span>
<span>Konuşmacı Başvuru Formu</span>
</Link>
</div>
</div>
</div>
</section>
</div>

{/*  Event Registration Modal  */}
{registeringEvent && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
    <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-slate-100 my-8">
      <button
        onClick={() => setRegisteringEvent(null)}
        className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 cursor-pointer"
        type="button"
      >
        <span className="material-symbols-outlined text-xl">close</span>
      </button>

      {regStatus === "success" ? (
        <div className="py-8 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-4xl">check_circle</span>
          </div>
          <h3 className="font-headline-sm font-bold text-primary">Kayıt Başarıyla Alındı!</h3>
          <p className="font-body-sm text-slate-muted mt-2 max-w-sm">
            <strong>{registeringEvent.title}</strong> etkinliğine katılım kaydınız Supabase veritabanımıza kaydedilmiştir. Giriş detayları e-posta adresinize iletilecektir.
          </p>
          <button
            onClick={() => setRegisteringEvent(null)}
            className="mt-6 px-6 py-2.5 bg-primary text-white font-semibold rounded-lg shadow hover:bg-primary-container cursor-pointer"
            type="button"
          >
            Kapat
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded bg-surface-ice text-primary font-caption-caps text-caption-caps font-bold">
              {registeringEvent.category === "summit" ? "Ulusal Zirve" : "Etkinlik Kayıt"}
            </span>
            <span className="text-xs text-slate-400">{registeringEvent.event_date}</span>
          </div>
          <h3 className="font-headline-sm font-bold text-primary">{registeringEvent.title}</h3>
          <p className="font-body-sm text-slate-500 mt-1 mb-5">
            Kontenjanda yerinizi ayırtmak için lütfen aşağıdaki bilgileri eksiksiz doldurunuz.
          </p>

          {regStatus === "error" && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
              {regErrorMessage || "Kayıt sırasında bir hata oluştu."}
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Katılımcı Adı ve Soyadı *</label>
              <input
                type="text"
                name="participant_name"
                required
                placeholder="Adınız ve Soyadınız"
                className="w-full px-3.5 py-2.5 rounded-lg bg-surface text-sm border border-slate-200 focus:outline-none focus:border-primary"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">E-Posta Adresi *</label>
                <input
                  type="email"
                  name="participant_email"
                  required
                  placeholder="ad.soyad@kurum.com"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-surface text-sm border border-slate-200 focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cep Telefonu *</label>
                <input
                  type="tel"
                  name="participant_phone"
                  required
                  placeholder="+90 (5XX) XXX XX XX"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-surface text-sm border border-slate-200 focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kurum / Ajans / Üniversite</label>
                <input
                  type="text"
                  name="organization"
                  placeholder="Kurum veya Üniversite Adı"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-surface text-sm border border-slate-200 focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Unvan / Görev</label>
                <input
                  type="text"
                  name="position"
                  placeholder="Unvanınız"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-surface text-sm border border-slate-200 focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Özel Not / Katılım Talebi</label>
              <textarea
                name="notes"
                rows={2}
                placeholder="Varsa çalıştaya ilişkin özel not veya soru iletiniz..."
                className="w-full px-3.5 py-2.5 rounded-lg bg-surface text-sm border border-slate-200 focus:outline-none focus:border-primary"
              ></textarea>
            </div>
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setRegisteringEvent(null)}
                className="px-4 py-2.5 rounded-lg text-slate-600 hover:bg-slate-100 text-sm font-semibold cursor-pointer"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={regStatus === "loading"}
                className="px-6 py-2.5 rounded-lg bg-primary text-white text-sm font-bold shadow hover:bg-primary-container disabled:opacity-50 cursor-pointer"
              >
                {regStatus === "loading" ? "Kaydediliyor..." : "Kaydı Onayla ve Tamamla"}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  </div>
)}
</main>
      <Footer />
    </>
  );
}
