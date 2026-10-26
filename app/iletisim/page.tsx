"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function IletisimPage() {
  const [copied, setCopied] = useState(false);
  const [contactStatus, setContactStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [protocolStatus, setProtocolStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleCopyCoord = () => {
    navigator.clipboard.writeText("39.9285, 32.8415");
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setContactStatus("loading");
    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = (formData.get("name") as string) || "";
    const organization = (formData.get("organization") as string) || "";
    const email = (formData.get("email") as string) || "";
    const phone = (formData.get("phone") as string) || "";
    const topic = (formData.get("topic") as string) || "Genel";
    const message = (formData.get("message") as string) || "";

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          subject: `İletişim: ${topic}${organization ? ` (${organization})` : ""}`,
          message,
          type: "contact_form",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setContactStatus("success");
        form.reset();
      } else {
        setContactStatus("error");
      }
    } catch {
      setContactStatus("error");
    }
  };

  const handleProtocolSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProtocolStatus("loading");
    const form = e.currentTarget;
    const formData = new FormData(form);
    const department = (formData.get("department") as string) || "Yönetim Kurulu";
    const date = (formData.get("date") as string) || "";
    const time = (formData.get("time") as string) || "";
    const partySize = (formData.get("party_size") as string) || "1";
    const phone = (formData.get("phone") as string) || "";
    const agenda = (formData.get("agenda") as string) || "";

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Protokol Heyeti (${partySize} Kişi)`,
          email: "protokol@ahid.org.tr",
          phone,
          department,
          subject: `Protokol Randevusu: ${department} (${date} ${time})`,
          message: agenda || "Protokol randevu talebi oluşturuldu.",
          type: "protocol_appointment",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setProtocolStatus("success");
        form.reset();
      } else {
        setProtocolStatus("error");
      }
    } catch {
      setProtocolStatus("error");
    }
  };

  return (
    <>
      <Navbar />
      <main className="w-full pt-[7.5rem] bg-surface min-h-[calc(100vh-28rem)]"><div className="flex flex-col w-full">
{/*  Top Ambient Glow  */}
<div className="relative w-full overflow-hidden">
<div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-secondary-container/15 blur-[120px] pointer-events-none rounded-full"></div>
{/*  Section 1: Breadcrumb & Diplomatic Hero Header  */}
<section className="relative max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop pt-6 pb-12">
{/*  Institutional Breadcrumb  */}
<nav aria-label="Erişim Yolu" className="flex items-center gap-space-xs text-label-sm font-label-sm text-slate-muted mb-6">
<a className="hover:text-primary transition-colors flex items-center gap-1" href="/">
<span className="material-symbols-outlined text-sm">home</span>
<span className="">ANA SAYFA</span>
</a>
<span className="material-symbols-outlined text-xs text-outline-variant">chevron_right</span>
<span className="text-primary font-bold tracking-wider">İLETİŞİM &amp; GENEL MERKEZ</span>
</nav>
{/*  Authority Badge  */}
<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-ice text-primary text-caption-caps font-caption-caps tracking-widest uppercase mb-4 shadow-sm">
<span className="w-2 h-2 rounded-full bg-gold-deep animate-pulse"></span>
<span className="">T.C. İÇİŞLERİ BAKANLIĞI KÜTÜK NO: 06-039-142 • RESMİ DERNEK MERKEZİ</span>
</div>
{/*  Main Headline & Subtitle  */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop items-end pb-8">
<div className="lg:col-span-8 flex flex-col gap-3">
<h1 className="font-headline-xl text-headline-xl lg:text-display-hero text-primary font-extrabold tracking-tight leading-[1.12]">
            Başkentin Kalbinde, <br className="hidden sm:inline" />
<span className="text-secondary">İletişim Mesleğinin</span> Hizmetindeyiz
          </h1>
<p className="font-body-lg text-body-lg text-slate-dark max-w-3xl leading-relaxed">
            Ankara Halkla İlişkiler Derneği Genel Merkezi; üyelik işlemleri, sektörel komisyon toplantıları, akademik protokol görüşmeleri ve basın bilgilendirmeleri için başkentteki iletişim camiasına ve paydaşlarına açıktır.
          </p>
</div>
<div className="lg:col-span-4 flex lg:justify-end gap-3">
<a className="inline-flex items-center justify-center gap-2 bg-[#0b3d91] hover:bg-[#082b66] text-white font-semibold px-5 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 active:scale-95" href="#randevu-bolumu">
<span className="material-symbols-outlined text-base">calendar_month</span>
<span className="">Protokol Randevusu Al</span>
</a>
<a className="inline-flex items-center justify-center gap-2 border border-[#cfdaf3] bg-white text-[#0b3d91] hover:bg-[#f0f3ff] hover:border-[#0b3d91]/40 font-semibold px-5 py-2.5 rounded-lg transition-all duration-200 active:scale-95" href="#ulasim-harita">
<span className="material-symbols-outlined text-base">directions</span>
<span className="">Ulaşım Rotası</span>
</a>
</div>
</div>
{/*  Quick Highlights Strip (4 Informational Cards)  */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
{/*  1: Adres  */}
<div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
<div className="flex items-start justify-between">
<div className="w-10 h-10 rounded-lg bg-surface-ice text-primary flex items-center justify-center">
<span className="material-symbols-outlined text-xl">location_city</span>
</div>
<span className="font-caption-caps text-caption-caps text-gold-deep bg-gold-light/30 px-2 py-0.5 rounded">Çankaya</span>
</div>
<div className="mt-4">
<div className="font-label-sm text-label-sm uppercase tracking-wider text-slate-muted mb-1">Genel Merkez Adresi</div>
<p className="font-label-md text-label-md text-on-surface font-semibold leading-snug">
              Anıttepe Mah. Kültür Sok. No: 5/4 Tandoğan, Çankaya / Ankara
            </p>
<div className="text-caption-caps font-caption-caps text-secondary mt-1 flex items-center gap-1">
<span className="material-symbols-outlined text-xs">subway</span> Metro &amp; YHT Yakını (350m)
            </div>
</div>
</div>
{/*  2: Santral & Saatler  */}
<div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
<div className="flex items-start justify-between">
<div className="w-10 h-10 rounded-lg bg-surface-ice text-primary flex items-center justify-center">
<span className="material-symbols-outlined text-xl">call</span>
</div>
<span className="font-caption-caps text-caption-caps text-secondary bg-surface-ice px-2 py-0.5 rounded">Santral</span>
</div>
<div className="mt-4">
<div className="font-label-sm text-label-sm uppercase tracking-wider text-slate-muted mb-1">Santral &amp; Çağrı Masası</div>
<a className="font-label-md text-label-md text-on-surface font-semibold hover:text-primary transition-colors block" href="tel:+903122319090">
              +90 (312) 231 90 90
            </a>
<div className="text-caption-caps font-caption-caps text-slate-muted mt-1 flex items-center gap-1">
<span className="material-symbols-outlined text-xs">schedule</span> Hafta İçi: 09:00 - 18:00
            </div>
</div>
</div>
{/*  3: Resmi KEP & E-posta  */}
<div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
<div className="flex items-start justify-between">
<div className="w-10 h-10 rounded-lg bg-surface-ice text-primary flex items-center justify-center">
<span className="material-symbols-outlined text-xl">mark_email_read</span>
</div>
<span className="font-caption-caps text-caption-caps text-primary bg-primary/10 px-2 py-0.5 rounded">Kurumsal KEP</span>
</div>
<div className="mt-4">
<div className="font-label-sm text-label-sm uppercase tracking-wider text-slate-muted mb-1">Resmi Yazışma &amp; KEP</div>
<a className="font-label-md text-label-md text-primary font-semibold truncate block" href="mailto:iletisim@ahid.org.tr">
              iletisim@ahid.org.tr
            </a>
<div className="text-caption-caps font-caption-caps text-slate-muted mt-1 truncate" title="ahid@hs01.kep.tr">
              KEP: ahid@hs01.kep.tr
            </div>
</div>
</div>
{/*  4: Basın & Medya İrtibatı  */}
<div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
<div className="flex items-start justify-between">
<div className="w-10 h-10 rounded-lg bg-surface-ice text-primary flex items-center justify-center">
<span className="material-symbols-outlined text-xl">campaign</span>
</div>
<span className="font-caption-caps text-caption-caps text-gold-deep bg-gold-light/30 px-2 py-0.5 rounded">Medya Masası</span>
</div>
<div className="mt-4">
<div className="font-label-sm text-label-sm uppercase tracking-wider text-slate-muted mb-1">Basın &amp; Akreditasyon</div>
<a className="font-label-md text-label-md text-on-surface font-semibold hover:text-primary transition-colors block" href="mailto:basin@ahid.org.tr">
              basin@ahid.org.tr
            </a>
<div className="text-caption-caps font-caption-caps text-slate-muted mt-1">
              Tel: +90 (312) 231 90 92
            </div>
</div>
</div>
</div>
</section>
</div>
{/*  Section 2: Interactive Diplomatic Map & Transportation Hub  */}
<section className="w-full bg-surface-container-low py-space-2xl" id="ulasim-harita">
<div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop">
<div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
<div>
<span className="font-caption-caps text-caption-caps text-secondary uppercase tracking-widest block mb-1">Konum &amp; Erişilebilirlik</span>
<h2 className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">Harita ve Başkent Ulaşım Rehberi</h2>
</div>
<div className="flex flex-wrap items-center gap-2">
<button className="inline-flex items-center gap-1.5 px-3 py-2 rounded text-label-sm font-label-sm bg-surface-container-lowest text-primary shadow-sm hover:bg-surface-ice transition-colors" id="copy-coord-btn" onClick={(e) => { navigator.clipboard.writeText("39.9285, 32.8415"); (e.target as HTMLElement).innerText = "Kordinatlar Kopyalandı!"; }}>
<span className="material-symbols-outlined text-base text-gold-deep">content_copy</span>
<span className="">39.9285° K, 32.8415° D</span>
</button>
<a className="inline-flex items-center gap-1.5 px-3 py-2 rounded text-label-sm font-label-sm bg-primary text-on-primary shadow-sm hover:bg-primary-container transition-colors" href="https://maps.google.com/?q=39.9285,32.8415" rel="noopener noreferrer" target="_blank">
<span className="material-symbols-outlined text-base">map</span>
<span className="">Google Haritalar</span>
</a>
<a className="inline-flex items-center gap-1.5 px-3 py-2 rounded text-label-sm font-label-sm bg-surface-container-lowest text-slate-dark shadow-sm hover:bg-surface-ice transition-colors" href="https://yandex.com.tr/haritalar/?text=39.9285,32.8415" rel="noopener noreferrer" target="_blank">
<span className="material-symbols-outlined text-base">navigation</span>
<span className="">Yandex Navigasyon</span>
</a>
</div>
</div>
<div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop items-stretch">
{/*  Main Map Visual Element (8 cols)  */}
<div className="lg:col-span-8 flex flex-col bg-surface-container-lowest rounded-2xl shadow-md overflow-hidden relative min-h-[460px]">
{/*  Interactive Map Surface Layer  */}
<div className="relative w-full h-full min-h-[420px] bg-slate-100 flex items-center justify-center overflow-hidden" data-location="Anıttepe, Çankaya, Ankara">
{/*  Simulated Map Canvas Graphic (Bespoke Editorial Cartography Vector)  */}
<svg className="absolute inset-0 w-full h-full object-cover" fill="none" viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg">
<rect fill="#EBF2FC" height="500" width="800"></rect>
{/*  Park / Green Areas (Anıtkabir Park Woods)  */}
<path d="M 60 180 Q 120 140 220 180 T 320 280 Q 280 400 140 420 Z" fill="#D7E8DA" opacity="0.8"></path>
<text fill="#3D6647" fontFamily="Plus Jakarta Sans" fontSize="12" fontWeight="700" letterSpacing="2" opacity="0.75" x="180" y="270">ANITKABİR BARIŞ PARKI</text>
<rect fill="#C9DFC8" height="55" opacity="0.6" rx="4" width="110" x="165" y="290"></rect>
{/*  Main Arteries & Boulevards  */}
<path d="M 0 110 L 800 110" stroke="#CBD5E1" strokeWidth="14"></path>
<path d="M 0 110 L 800 110" stroke="#FFFFFF" strokeWidth="10"></path>
<text fill="#64748B" fontFamily="Inter" fontSize="9" fontWeight="600" letterSpacing="1" x="440" y="104">GAZİ MUSTAFA KEMAL BULVARI (GMK)</text>
{/*  Celal Bayar Bulvarı & YHT line  */}
<path d="M 0 40 Q 400 60 800 30" stroke="#94A3B8" strokeDasharray="8 6" strokeWidth="8"></path>
<text fill="#475569" fontFamily="Inter" fontSize="9" fontWeight="600" x="310" y="32">ANKARA YHT HIZLI TREN HATTI &amp; CELAL BAYAR BULVARI</text>
{/*  Connecting Streets  */}
<path d="M 360 40 L 360 500" stroke="#E2E8F0" strokeWidth="16"></path>
<path d="M 360 40 L 360 500" stroke="#FFFFFF" strokeWidth="10"></path>
<text fill="#64748B" fontFamily="Inter" fontSize="9" fontWeight="600" x="372" y="210">KÜLTÜR SOKAK</text>
<path d="M 120 40 L 460 480" stroke="#E2E8F0" strokeWidth="10"></path>
<path d="M 220 110 L 680 460" stroke="#E2E8F0" strokeWidth="8"></path>
<path d="M 0 320 L 800 360" stroke="#FFFFFF" strokeWidth="10"></path>
<text fill="#64748B" fontFamily="Inter" fontSize="9" fontWeight="600" x="560" y="348">GENÇLİK CADDESİ</text>
<circle cx="580" cy="110" fill="#2563EB" opacity="0.15" r="14"></circle>
<circle cx="580" cy="110" fill="#002869" r="8"></circle>
<text fill="#002869" fontFamily="Inter" fontSize="10" fontWeight="700" x="540" y="85">Anadolu (Tandoğan) Metro</text>
<rect fill="#002869" height="24" rx="4" width="28" x="180" y="35"></rect>
<text fill="#002869" fontFamily="Inter" fontSize="10" fontWeight="700" x="215" y="52">Ankara YHT Garı</text>
</svg>
{/*  Custom Interactive AHİD Pin Overlay (Centered on Kültür Sokak)  */}
<div className="absolute left-[44%] top-[42%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-auto group cursor-pointer">
{/*  Pulse Radar Effect  */}
<span className="absolute w-16 h-16 rounded-full bg-primary/20 animate-ping"></span>
<span className="absolute w-8 h-8 rounded-full bg-gold-deep/30 animate-pulse"></span>
{/*  Institutional Marker Body  */}
<div className="relative z-10 flex items-center gap-2 bg-primary text-on-primary px-3.5 py-2 rounded-xl shadow-2xl transition-transform transform group-hover:scale-105">
<span className="material-symbols-outlined text-gold-light text-xl">account_balance</span>
<div className="flex flex-col text-left">
<span className="font-headline-sm text-xs font-bold leading-none text-on-primary">AHİD GENEL MERKEZ</span>
<span className="font-caption-caps text-[9px] text-surface-ice tracking-wider">Kültür Sk. No: 5/4</span>
</div>
</div>
<div className="w-3 h-3 bg-primary rotate-45 -mt-1.5 shadow-md"></div>
<div className="w-2.5 h-1 bg-black/40 rounded-full blur-[1px] mt-0.5"></div>
</div>
{/*  Landmark Overlay Card: Anadolu Metro  */}
<div className="absolute right-8 top-16 bg-surface-container-lowest/95 backdrop-blur-md px-3 py-2 rounded shadow-sm text-on-surface text-label-sm font-label-sm hidden sm:flex items-center gap-2 pointer-events-none">
<span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
<span className="">Anadolu Metro Girişi: <strong>350 Metre (5 Dk)</strong></span>
</div>
{/*  Landmark Overlay Card: Ankara YHT Garı  */}
<div className="absolute left-6 top-8 bg-surface-container-lowest/95 backdrop-blur-md px-3 py-2 rounded shadow-sm text-on-surface text-label-sm font-label-sm hidden sm:flex items-center gap-2 pointer-events-none">
<span className="material-symbols-outlined text-base text-primary">train</span>
<span className="">Yüksek Hızlı Tren Garı: <strong>1.2 Km (4 Dk Araç)</strong></span>
</div>
{/*  In-Map Floating Tools  */}
<div className="absolute bottom-4 left-4 flex items-center gap-1.5 bg-surface-container-lowest/90 backdrop-blur-md p-1.5 rounded-lg shadow-sm">
<button className="w-8 h-8 rounded bg-surface hover:bg-surface-variant flex items-center justify-center text-primary font-bold text-sm" title="Yakınlaştır">+</button>
<button className="w-8 h-8 rounded bg-surface hover:bg-surface-variant flex items-center justify-center text-primary font-bold text-sm" title="Uzaklaştır">-</button>
<span className="w-[1px] h-4 bg-outline-variant mx-1"></span>
<button className="px-2.5 py-1 text-label-sm font-label-sm rounded bg-surface text-on-surface hover:bg-surface-ice">Uydu</button>
<button className="px-2.5 py-1 text-label-sm font-label-sm rounded bg-primary text-on-primary font-medium">Harita</button>
</div>
<div className="absolute bottom-4 right-4 bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-2 text-caption-caps font-caption-caps text-slate-muted">
<span className="material-symbols-outlined text-sm text-secondary">explore</span>
<span className="">Anıttepe &amp; Tandoğan Bölgesi • Çankaya</span>
</div>
</div>
{/*  Bottom Route Quick Bar  */}
<div className="bg-surface-container px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 text-body-sm font-body-sm text-slate-dark">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-primary text-lg">navigation</span>
<span className="">Navigasyon Koordinatları: <strong>39°55'42.6"N 32°50'29.4"E</strong> (Anıttepe)</span>
</div>
<div className="flex items-center gap-4 text-label-sm font-label-sm">
<a className="text-primary hover:underline font-semibold flex items-center gap-1" href="https://maps.apple.com/?ll=39.9285,32.8415" target="_blank">
<span className="">Apple Haritalar</span>
<span className="material-symbols-outlined text-xs">arrow_outward</span>
</a>
<a className="text-primary hover:underline font-semibold flex items-center gap-1" href="https://www.waze.com/ul?ll=39.9285,32.8415&amp;navigate=yes" target="_blank">
<span className="">Waze</span>
<span className="material-symbols-outlined text-xs">arrow_outward</span>
</a>
</div>
</div>
</div>
{/*  Right Side: Transportation Guide Directory (4 cols)  */}
<div className="lg:col-span-4 flex flex-col justify-between gap-3 bg-surface-container-lowest p-6 rounded-2xl shadow-sm">
<div>
<div className="flex items-center gap-2 mb-2">
<span className="material-symbols-outlined text-primary">commute</span>
<h3 className="font-headline-sm text-headline-sm text-primary font-bold">Ulaşım Seçenekleri</h3>
</div>
<p className="font-body-sm text-body-sm text-slate-muted mb-6">
              AHİD Genel Merkezi, Ankara'nın merkezi aktarma noktalarına ve bürokrasi aksına komşu konumdadır.
            </p>
{/*  Guide Items  */}
<div className="flex flex-col gap-4">
{/*  Metro  */}
<div className="flex gap-3.5 items-start">
<div className="w-9 h-9 rounded bg-surface-ice text-primary flex items-center justify-center shrink-0 mt-0.5">
<span className="material-symbols-outlined text-lg">subway</span>
</div>
<div>
<h4 className="font-label-md text-label-md text-on-surface font-bold">Metro &amp; Ankaray Hattı</h4>
<p className="font-body-sm text-body-sm text-slate-muted leading-relaxed mt-0.5">
<strong>Anadolu (Tandoğan) İstasyonu</strong> 1 No'lu Anıttepe çıkışından itibaren yalnızca 350 metre yürüme mesafesinde (5 dakika).
                  </p>
</div>
</div>
{/*  YHT  */}
<div className="flex gap-3.5 items-start">
<div className="w-9 h-9 rounded bg-surface-ice text-primary flex items-center justify-center shrink-0 mt-0.5">
<span className="material-symbols-outlined text-lg">train</span>
</div>
<div>
<h4 className="font-label-md text-label-md text-on-surface font-bold">Yüksek Hızlı Tren (YHT)</h4>
<p className="font-body-sm text-body-sm text-slate-muted leading-relaxed mt-0.5">
<strong>Ankara YHT Garı'na</strong> araçla 4 dakika, Ankaray ile Tandoğan durağından 1 istasyon mesafededir. İstanbul ve Konya yolcuları için doğrudan erişim.
                  </p>
</div>
</div>
{/*  Havalimanı  */}
<div className="flex gap-3.5 items-start">
<div className="w-9 h-9 rounded bg-surface-ice text-primary flex items-center justify-center shrink-0 mt-0.5">
<span className="material-symbols-outlined text-lg">flight_takeoff</span>
</div>
<div>
<h4 className="font-label-md text-label-md text-on-surface font-bold">Esenboğa Havalimanı</h4>
<p className="font-body-sm text-body-sm text-slate-muted leading-relaxed mt-0.5">
                    HAVAŞ veya BelkoAir 442 otobüslerinin <strong>Gar / AKM</strong> durağında indikten sonra 5 dakika taksi mesafesi (~31 km).
                  </p>
</div>
</div>
{/*  Otopark  */}
<div className="flex gap-3.5 items-start">
<div className="w-9 h-9 rounded bg-surface-ice text-primary flex items-center justify-center shrink-0 mt-0.5">
<span className="material-symbols-outlined text-lg">local_parking</span>
</div>
<div>
<h4 className="font-label-md text-label-md text-on-surface font-bold">Otopark ve Ziyaretçi Girişi</h4>
<p className="font-body-sm text-body-sm text-slate-muted leading-relaxed mt-0.5">
                    Bina önünde ve Kültür Sokak üzerinde AHİD üyelerine ve randevulu heyetlere tahsisli misafir park alanı mevcuttur.
                  </p>
</div>
</div>
</div>
</div>
{/*  Bottom Notice  */}
<div className="mt-4 p-3.5 rounded-lg bg-surface-ice flex items-center gap-3">
<span className="material-symbols-outlined text-secondary text-xl">accessible</span>
<span className="font-body-sm text-body-sm text-on-surface">
              Genel merkez binamız tekerlekli sandalye erişimine uygun rampa ve asansör altyapısına sahiptir.
            </span>
</div>
</div>
</div>
</div>
</section>
{/*  Section 3: Multi-Department Directory & Institutional Desks (Birim ve Masa Rehberi)  */}
<section className="max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop py-space-3xl w-full">
<div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-12">
<span className="font-caption-caps text-caption-caps text-gold-deep bg-gold-light/40 px-3 py-1 rounded-full uppercase tracking-wider mb-2 font-bold">
        Yetkili İrtibat Masaları
      </span>
<h2 className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">
        Birim ve İhtisas Masası Rehberi
      </h2>
<p className="font-body-md text-body-md text-slate-muted mt-2">
        Talebinizin doğrudan ilgili birim başkanlığına ve kurula iletilmesi için aşağıdaki dahili hat ve kurumsal e-posta kanallarını kullanabilirsiniz.
      </p>
</div>
{/*  5 Specific Department Cards Grid  */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
{/*  Birim 1: Üyelik, Sicil ve Akreditasyon  */}
<div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
<div>
<div className="flex items-center justify-between mb-4">
<span className="w-10 h-10 rounded-lg bg-surface-ice text-primary flex items-center justify-center">
<span className="material-symbols-outlined text-xl">badge</span>
</span>
<span className="font-caption-caps text-caption-caps text-slate-muted font-bold tracking-wider">DAHİLİ: 104</span>
</div>
<h3 className="font-headline-sm text-headline-sm text-primary font-bold group-hover:text-secondary transition-colors">
            Üyelik, Sicil &amp; Akreditasyon
          </h3>
<p className="font-body-sm text-body-sm text-slate-muted mt-2 leading-relaxed">
            Yeni asil üyelik başvuruları, kıdemli iletişimci akreditasyonu, üye kimlik kartları, aidat tahakkuk ve CPD sürekli gelişim puanlaması.
          </p>
<div className="mt-5 p-3 rounded bg-surface-canvas flex items-center gap-3">
<div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
              SD
            </div>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-on-surface font-semibold">Selin Doğanay</span>
<span className="font-caption-caps text-caption-caps text-slate-muted">Sicil Kurulu Raportörü</span>
</div>
</div>
</div>
<div className="pt-5 mt-4 flex items-center justify-between">
<a className="inline-flex items-center gap-1.5 font-label-md text-label-md text-primary font-semibold hover:text-secondary transition-colors" href="mailto:sicil@ahid.org.tr">
<span className="material-symbols-outlined text-base">mail</span>
<span className="">sicil@ahid.org.tr</span>
</a>
<span className="material-symbols-outlined text-outline-variant text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
</div>
</div>
{/*  Birim 2: Akademik İlişkiler ve Yayın Kurulu  */}
<div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
<div>
<div className="flex items-center justify-between mb-4">
<span className="w-10 h-10 rounded-lg bg-surface-ice text-primary flex items-center justify-center">
<span className="material-symbols-outlined text-xl">menu_book</span>
</span>
<span className="font-caption-caps text-caption-caps text-slate-muted font-bold tracking-wider">DAHİLİ: 106</span>
</div>
<h3 className="font-headline-sm text-headline-sm text-primary font-bold group-hover:text-secondary transition-colors">
            Akademik İlişkiler &amp; Yayın Kurulu
          </h3>
<p className="font-body-sm text-body-sm text-slate-muted mt-2 leading-relaxed">
            Hakemli bülten makale kabulü, "Usta'ya Saygı" arşivi monografi çalışmaları, üniversitelerin iletişim fakülteleri ile ortak sempozyumlar.
          </p>
<div className="mt-5 p-3 rounded bg-surface-canvas flex items-center gap-3">
<div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
              ST
            </div>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-on-surface font-semibold">Dr. M. Sezai Türk</span>
<span className="font-caption-caps text-caption-caps text-slate-muted">Yayın Kurulu Sorumlusu</span>
</div>
</div>
</div>
<div className="pt-5 mt-4 flex items-center justify-between">
<a className="inline-flex items-center gap-1.5 font-label-md text-label-md text-primary font-semibold hover:text-secondary transition-colors" href="mailto:yayin@ahid.org.tr">
<span className="material-symbols-outlined text-base">mail</span>
<span className="">yayin@ahid.org.tr</span>
</a>
<span className="material-symbols-outlined text-outline-variant text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
</div>
</div>
{/*  Birim 3: Etkinlik, Zirve ve Masterclass Koordinasyonu  */}
<div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
<div>
<div className="flex items-center justify-between mb-4">
<span className="w-10 h-10 rounded-lg bg-surface-ice text-primary flex items-center justify-center">
<span className="material-symbols-outlined text-xl">event_available</span>
</span>
<span className="font-caption-caps text-caption-caps text-slate-muted font-bold tracking-wider">DAHİLİ: 108</span>
</div>
<h3 className="font-headline-sm text-headline-sm text-primary font-bold group-hover:text-secondary transition-colors">
            Etkinlik, Zirve &amp; Masterclass
          </h3>
<p className="font-body-sm text-body-sm text-slate-muted mt-2 leading-relaxed">
            Başkent İletişim Zirvesi biletleme işlemleri, Altın Pusula Ankara jüri başvuruları, kurumsal sponsorluk ve atölye katılımları.
          </p>
<div className="mt-5 p-3 rounded bg-surface-canvas flex items-center gap-3">
<div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
              KA
            </div>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-on-surface font-semibold">Kürşat Aydoğdu</span>
<span className="font-caption-caps text-caption-caps text-slate-muted">Etkinlik Komitesi Bşk.</span>
</div>
</div>
</div>
<div className="pt-5 mt-4 flex items-center justify-between">
<a className="inline-flex items-center gap-1.5 font-label-md text-label-md text-primary font-semibold hover:text-secondary transition-colors" href="mailto:etkinlik@ahid.org.tr">
<span className="material-symbols-outlined text-base">mail</span>
<span className="">etkinlik@ahid.org.tr</span>
</a>
<span className="material-symbols-outlined text-outline-variant text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
</div>
</div>
{/*  Birim 4: Basın Sözcülüğü ve Kamu Diplomasisi  */}
<div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
<div>
<div className="flex items-center justify-between mb-4">
<span className="w-10 h-10 rounded-lg bg-surface-ice text-primary flex items-center justify-center">
<span className="material-symbols-outlined text-xl">newspaper</span>
</span>
<span className="font-caption-caps text-caption-caps text-slate-muted font-bold tracking-wider">DAHİLİ: 110</span>
</div>
<h3 className="font-headline-sm text-headline-sm text-primary font-bold group-hover:text-secondary transition-colors">
            Basın Sözcülüğü &amp; Diplomasi
          </h3>
<p className="font-body-sm text-body-sm text-slate-muted mt-2 leading-relaxed">
            Ulusal ve yerel medya mensupları için basın bültenleri, televizyon/canlı yayın röportaj koordinasyonu ve resmi demeç akışı.
          </p>
<div className="mt-5 p-3 rounded bg-surface-canvas flex items-center gap-3">
<div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
              BÇ
            </div>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-on-surface font-semibold">Berrin Çağlar</span>
<span className="font-caption-caps text-caption-caps text-slate-muted">Basın Danışmanı &amp; Sözcü</span>
</div>
</div>
</div>
<div className="pt-5 mt-4 flex items-center justify-between">
<a className="inline-flex items-center gap-1.5 font-label-md text-label-md text-primary font-semibold hover:text-secondary transition-colors" href="mailto:basin@ahid.org.tr">
<span className="material-symbols-outlined text-base">mail</span>
<span className="">basin@ahid.org.tr</span>
</a>
<span className="material-symbols-outlined text-outline-variant text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
</div>
</div>
{/*  Birim 5: Hukuk, Tüzük ve Deontoloji Masası  */}
<div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
<div>
<div className="flex items-center justify-between mb-4">
<span className="w-10 h-10 rounded-lg bg-surface-ice text-primary flex items-center justify-center">
<span className="material-symbols-outlined text-xl">gavel</span>
</span>
<span className="font-caption-caps text-caption-caps text-slate-muted font-bold tracking-wider">DAHİLİ: 112</span>
</div>
<h3 className="font-headline-sm text-headline-sm text-primary font-bold group-hover:text-secondary transition-colors">
            Hukuk, Tüzük &amp; Deontoloji
          </h3>
<p className="font-body-sm text-body-sm text-slate-muted mt-2 leading-relaxed">
            Mesleki etik kurulu şikayet başvuruları, dernekler mevzuatı danışmanlığı, telif hakları incelemeleri ve resmi KVKK süreçleri.
          </p>
<div className="mt-5 p-3 rounded bg-surface-canvas flex items-center gap-3">
<div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
              BT
            </div>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-on-surface font-semibold">Av. Burcu Turgut</span>
<span className="font-caption-caps text-caption-caps text-slate-muted">Genel Merkez Hukuk Müşaviri</span>
</div>
</div>
</div>
<div className="pt-5 mt-4 flex items-center justify-between">
<a className="inline-flex items-center gap-1.5 font-label-md text-label-md text-primary font-semibold hover:text-secondary transition-colors" href="mailto:hukuk@ahid.org.tr">
<span className="material-symbols-outlined text-base">mail</span>
<span className="">hukuk@ahid.org.tr</span>
</a>
<span className="material-symbols-outlined text-outline-variant text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
</div>
</div>
{/*  Birim 6: Genel Sekreterlik & Protokol İdaresi  */}
<div className="bg-primary text-on-primary p-6 rounded-xl shadow-md flex flex-col justify-between group relative overflow-hidden">
<div className="relative z-10">
<div className="flex items-center justify-between mb-4">
<span className="w-10 h-10 rounded-lg bg-white/10 text-gold-light flex items-center justify-center">
<span className="material-symbols-outlined text-xl">domain</span>
</span>
<span className="font-caption-caps text-caption-caps text-on-primary-container font-bold tracking-wider">DAHİLİ: 101</span>
</div>
<h3 className="font-headline-sm text-headline-sm text-on-primary font-bold">
            Genel Sekreterlik &amp; Yönetim
          </h3>
<p className="font-body-sm text-body-sm text-surface-ice/85 mt-2 leading-relaxed">
            Bakanlıklar, kamu kurumları ve uluslararası mesleki federasyonlar arası ikili protokol görüşmeleri, resmi heyet kabulleri ve genel kurul takvimi.
          </p>
<div className="mt-5 p-3 rounded bg-white/10 backdrop-blur-sm flex items-center gap-3">
<span className="material-symbols-outlined text-gold-light">shield_person</span>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-on-primary font-semibold">AHİD İcra Kurulu</span>
<span className="font-caption-caps text-caption-caps text-surface-ice/70">Protokol ve İdari Koordinasyon</span>
</div>
</div>
</div>
<div className="relative z-10 pt-5 mt-4 flex items-center justify-between">
<a className="inline-flex items-center gap-1.5 font-label-md text-label-md text-gold-light font-semibold hover:text-white transition-colors" href="mailto:sekreterya@ahid.org.tr">
<span className="material-symbols-outlined text-base">mail</span>
<span className="">sekreterya@ahid.org.tr</span>
</a>
<span className="material-symbols-outlined text-gold-light text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
</div>
</div>
</div>
</section>
{/*  Section 4: Two-Way Action Hub: Digital Contact Form & Protocol Visit Appointment  */}
<section className="w-full bg-surface-canvas py-space-3xl" id="randevu-bolumu">
<div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop items-start">
{/*  Left Column: Official Digital Contact Form (7 cols)  */}
<div className="lg:col-span-7 bg-surface-container-lowest p-8 lg:p-10 rounded-2xl shadow-sm">
<div className="flex items-center gap-2 mb-2">
<span className="w-3 h-3 rounded-full bg-secondary"></span>
<span className="font-caption-caps text-caption-caps text-secondary font-bold uppercase tracking-wider">Resmi Yazışma Kanalı</span>
</div>
<h2 className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">
            Dijital İletişim ve Bilgi Edinme Formu
          </h2>
<p className="font-body-sm text-body-sm text-slate-muted mt-2 mb-8 leading-relaxed">
            Mesleki sorularınız, kurumsal iş birliği önerileriniz veya bilgi edinme başvurularınız kayıt altına alınarak en geç 2 iş günü içerisinde yanıtlanır.
          </p>

{contactStatus === "success" && (
  <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3">
    <span className="material-symbols-outlined text-2xl text-emerald-600">check_circle</span>
    <div>
      <h4 className="font-bold text-sm">Mesajınız Başarıyla İletildi!</h4>
      <p className="text-xs text-emerald-700 mt-0.5">AHİD Genel Evrak Masası ve Supabase veritabanına kaydedildi. En kısa sürede geri dönüş yapılacaktır.</p>
    </div>
  </div>
)}

{contactStatus === "error" && (
  <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-3">
    <span className="material-symbols-outlined text-2xl text-red-600">error</span>
    <div>
      <h4 className="font-bold text-sm">Mesaj Gönderilemedi</h4>
      <p className="text-xs text-red-700 mt-0.5">Lütfen bağlantınızı kontrol edip tekrar deneyiniz veya santralimizle iletişime geçiniz.</p>
    </div>
  </div>
)}

<form className="space-y-5" onSubmit={handleContactSubmit}>
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
<div>
<label className="block font-label-sm text-label-sm text-slate-dark mb-1.5">Adınız ve Soyadınız *</label>
<input className="w-full px-4 py-3 rounded-lg bg-surface font-body-md text-body-md text-on-surface placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-secondary" name="name" placeholder="Örn: Dr. Ayşe Yılmaz" required type="text" />
</div>
<div>
<label className="block font-label-sm text-label-sm text-slate-dark mb-1.5">Temsil Edilen Kurum / Kuruluş</label>
<input className="w-full px-4 py-3 rounded-lg bg-surface font-body-md text-body-md text-on-surface placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-secondary" name="organization" placeholder="Örn: Ankara Üniversitesi / Kurumsal İletişim Direktörlüğü" type="text" />
</div>
</div>
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
<div>
<label className="block font-label-sm text-label-sm text-slate-dark mb-1.5">Kurumsal E-posta Adresi *</label>
<input className="w-full px-4 py-3 rounded-lg bg-surface font-body-md text-body-md text-on-surface placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-secondary" name="email" placeholder="ayse.yilmaz@kurum.org.tr" required type="email" />
</div>
<div>
<label className="block font-label-sm text-label-sm text-slate-dark mb-1.5">Telefon Numarası *</label>
<input className="w-full px-4 py-3 rounded-lg bg-surface font-body-md text-body-md text-on-surface placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-secondary" name="phone" placeholder="+90 (5XX) XXX XX XX" required type="tel" />
</div>
</div>
<div>
<label className="block font-label-sm text-label-sm text-slate-dark mb-1.5">Başvuru Konusu / İlgili İhtisas Alanı *</label>
<select className="w-full px-4 py-3 rounded-lg bg-surface font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary" name="topic" required>
<option value="">Seçiniz...</option>
<option value="Üyelik ve Akreditasyon">Üyelik, Sicil &amp; CPD Akreditasyonu</option>
<option value="Etkinlik ve Zirve">Etkinlikler, Zirve Katılımı &amp; Sponsorluk</option>
<option value="Akademik Yayın">Akademik Yayın &amp; Hakemli Makale Önerisi</option>
<option value="Basın Sözcülüğü">Basın Röportajı &amp; Medya İrtibatı</option>
<option value="Mesleki Deontoloji">Mesleki Deontoloji &amp; Etik Kurulu Başvurusu</option>
<option value="Diğer Kurumsal Konular">Diğer Kurumsal Konular</option>
</select>
</div>
<div>
<label className="block font-label-sm text-label-sm text-slate-dark mb-1.5">Mesajınız / Başvuru Detayı *</label>
<textarea className="w-full px-4 py-3 rounded-lg bg-surface font-body-md text-body-md text-on-surface placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-secondary" name="message" placeholder="Lütfen konuyu, varsa kurum unvanınızı ve dernekten talebinizi açıklayınız..." required rows={4}></textarea>
</div>
<div className="flex items-start gap-3 pt-1">
<input className="mt-1 w-4 h-4 rounded text-primary focus:ring-secondary" id="kvkk-check" required type="checkbox" />
<label className="font-body-sm text-body-sm text-slate-muted leading-tight" htmlFor="kvkk-check">
                6698 sayılı KVKK kapsamında tarafıma ait kişisel verilerin AHİD İletişim Masası tarafından işlenmesini, resmi iletişim amacıyla arşivlenmesini kabul ediyorum.
              </label>
</div>
<div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-4">
<button className="w-full inline-flex items-center justify-center gap-2 bg-[#c25e00] hover:bg-[#a04703] text-white font-semibold px-6 py-3.5 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 disabled:opacity-50 cursor-pointer" disabled={contactStatus === "loading"} type="submit">
<span className="material-symbols-outlined text-base">send</span>
<span className="">{contactStatus === "loading" ? "İletiliyor..." : "Mesajı Güvenli İlet"}</span>
</button>
<div className="flex items-center gap-2 text-caption-caps font-caption-caps text-slate-muted">
<span className="material-symbols-outlined text-base text-secondary">verified_user</span>
<span className="">256-Bit SSL Uçtan Uca Şifreli İletim</span>
</div>
</div>
</form>
</div>
{/*  Right Column: Protocol Visit Appointment Portal (5 cols)  */}
<div className="lg:col-span-5 bg-gradient-to-br from-primary via-primary-container to-primary text-on-primary p-8 lg:p-10 rounded-2xl shadow-xl flex flex-col justify-between">
<div>
<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-gold-light text-caption-caps font-caption-caps tracking-widest uppercase mb-4">
<span className="material-symbols-outlined text-xs">meeting_room</span>
<span className="">HEYET &amp; DİPLOMATİK GÖRÜŞMELER</span>
</div>
<h3 className="font-headline-lg text-headline-lg text-on-primary font-bold tracking-tight">
              Genel Merkez Protokol Randevusu
            </h3>
<p className="font-body-sm text-body-sm text-surface-ice/85 mt-2 mb-6 leading-relaxed">
              Yönetim Kurulu Başkanı, Genel Sekreterlik veya İhtisas Komisyonları ile yüz yüze toplantı gerçekleştirmek isteyen kurum temsilcileri için resmi randevu modülüdür.
            </p>

{protocolStatus === "success" && (
  <div className="mb-5 p-4 rounded-xl bg-white/20 border border-white/30 text-white flex items-center gap-3">
    <span className="material-symbols-outlined text-2xl text-gold-light">task_alt</span>
    <div>
      <h4 className="font-bold text-sm">Randevu Talebiniz Alındı!</h4>
      <p className="text-xs text-surface-ice/90 mt-0.5">Genel Sekreterlik Özel Kalemine sevk edilmiştir. SMS ve telefon ile teyit verilecektir.</p>
    </div>
  </div>
)}

{protocolStatus === "error" && (
  <div className="mb-5 p-4 rounded-xl bg-red-900/40 border border-red-300 text-white flex items-center gap-3">
    <span className="material-symbols-outlined text-2xl text-red-300">error</span>
    <div>
      <h4 className="font-bold text-sm">Randevu Kaydedilemedi</h4>
      <p className="text-xs text-red-200 mt-0.5">Lütfen doğrudan sekreterya dahili hattımızı arayınız.</p>
    </div>
  </div>
)}

<form className="space-y-4" onSubmit={handleProtocolSubmit}>
<div>
<label className="block font-label-sm text-label-sm text-gold-light mb-1">Görüşülmek İstenen Makam / Kurul *</label>
<select className="w-full px-3.5 py-2.5 rounded bg-white/10 text-on-primary text-body-sm font-body-sm border border-white/20 focus:outline-none focus:bg-white/20" name="department" required>
<option className="text-on-surface" value="Yönetim Kurulu Başkanlığı">Yönetim Kurulu Başkanlığı</option>
<option className="text-on-surface" value="Genel Sekreterlik İcra Masası">Genel Sekreterlik İcra Masası</option>
<option className="text-on-surface" value="Akademik Yayın ve İnceleme Kurulu">Akademik Yayın ve İnceleme Kurulu</option>
<option className="text-on-surface" value="Sicil ve Mesleki Deontoloji Masası">Sicil ve Mesleki Deontoloji Masası</option>
<option className="text-on-surface" value="Genç AHİD İletişim Elçileri Masası">Genç AHİD İletişim Elçileri Masası</option>
</select>
</div>
<div className="grid grid-cols-2 gap-3">
<div>
<label className="block font-label-sm text-label-sm text-gold-light mb-1">Tercih Edilen Tarih *</label>
<input className="w-full px-3 py-2 rounded bg-white/10 text-on-primary text-body-sm font-body-sm border border-white/20 focus:outline-none focus:bg-white/20" name="date" required type="date" />
</div>
<div>
<label className="block font-label-sm text-label-sm text-gold-light mb-1">Saat Dilimi *</label>
<select className="w-full px-3 py-2 rounded bg-white/10 text-on-primary text-body-sm font-body-sm border border-white/20 focus:outline-none focus:bg-white/20" name="time" required>
<option className="text-on-surface">10:30 - 11:30</option>
<option className="text-on-surface">14:00 - 15:00</option>
<option className="text-on-surface">16:00 - 17:00</option>
</select>
</div>
</div>
<div className="grid grid-cols-2 gap-3">
<div>
<label className="block font-label-sm text-label-sm text-gold-light mb-1">Heyet Kişi Sayısı *</label>
<input className="w-full px-3.5 py-2.5 rounded bg-white/10 text-on-primary text-body-sm font-body-sm border border-white/20 focus:outline-none focus:bg-white/20" max="15" min="1" name="party_size" placeholder="Örn: 3" required type="number" />
</div>
<div>
<label className="block font-label-sm text-label-sm text-gold-light mb-1">İrtibat Yetkilisi Tel *</label>
<input className="w-full px-3.5 py-2.5 rounded bg-white/10 text-on-primary text-body-sm font-body-sm border border-white/20 focus:outline-none focus:bg-white/20" name="phone" placeholder="+90 (312)..." required type="tel" />
</div>
</div>
<div>
<label className="block font-label-sm text-label-sm text-gold-light mb-1">Görüşme Gündemi &amp; Amaç Özeti *</label>
<textarea className="w-full px-3.5 py-2.5 rounded bg-white/10 text-on-primary text-body-sm font-body-sm border border-white/20 focus:outline-none focus:bg-white/20" name="agenda" placeholder="Protokol ziyareti konusu veya iş birliği gündemi..." required rows={2}></textarea>
</div>
<button className="w-full inline-flex items-center justify-center gap-2 bg-[#c25e00] hover:bg-[#a04703] text-white font-semibold px-6 py-3.5 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 disabled:opacity-50 cursor-pointer" disabled={protocolStatus === "loading"} type="submit">
<span className="material-symbols-outlined text-base">event_note</span>
<span className="">{protocolStatus === "loading" ? "Oluşturuluyor..." : "Randevu Talebini Oluştur"}</span>
</button>
</form>
</div>
<div className="mt-6 pt-6 border-t border-white/15 flex items-start gap-3 text-caption-caps font-caption-caps text-surface-ice/75">
<span className="material-symbols-outlined text-lg text-gold-light shrink-0">info</span>
<span className="">
<strong>Protokol Uyarısı:</strong> Ziyaret başvuruları güvenlik teyidi ve dernek toplantı takvimi gereği en az 24 saat önceden Genel Sekreterlik Özel Kalemince teyit edilmektedir.
            </span>
</div>
</div>
</div>
</div>
</section>
{/*  Section 5: Institutional Rules & FAQ (Kurumsal Ziyaret Kuralları & SSS)  */}
<section className="max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop py-space-3xl w-full">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-desktop items-start">
{/*  Left Column: Institutional Guidelines (5 cols)  */}
<div className="lg:col-span-5 flex flex-col gap-6">
<div>
<span className="font-caption-caps text-caption-caps text-secondary uppercase tracking-widest block mb-1">Mevzuat ve İlkeler</span>
<h2 className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">
            Genel Merkez Kurumsal İlkeleri &amp; Evrak Kabulü
          </h2>
<p className="font-body-md text-body-md text-slate-muted mt-2 leading-relaxed">
            Dernek tüzel kişiliğinin resmi işleyişi ve ziyaretçi kabulüne dair esaslar T.C. Dernekler Yönetmeliği ve AHİD İç Tüzüğü uyarınca yürütülmektedir.
          </p>
</div>
{/*  Rule Card: Evrak & Kargo  */}
<div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm">
<div className="flex items-center gap-3 mb-2">
<div className="w-8 h-8 rounded bg-surface-ice text-primary flex items-center justify-center">
<span className="material-symbols-outlined text-lg">local_shipping</span>
</div>
<h3 className="font-headline-sm text-sm font-bold text-primary">Resmi Evrak, Tebligat &amp; Kargo Kabulü</h3>
</div>
<p className="font-body-sm text-body-sm text-slate-muted leading-relaxed">
            Fiziki evraklar, kitap bağışları ve kargolar mesai günlerinde 09:00 - 17:30 saatleri arasında evrak kayıt bürosuna teslim edilebilir. Tüm teslimatlar barkod numarası ile kaydedilir.
          </p>
</div>
{/*  Rule Card: Engelli Erişimi  */}
<div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm">
<div className="flex items-center gap-3 mb-2">
<div className="w-8 h-8 rounded bg-surface-ice text-primary flex items-center justify-center">
<span className="material-symbols-outlined text-lg">accessible_forward</span>
</div>
<h3 className="font-headline-sm text-sm font-bold text-primary">Engelsiz Erişim ve Toplantı Donanımı</h3>
</div>
<p className="font-body-sm text-body-sm text-slate-muted leading-relaxed">
            Genel Merkez bünyesindeki 45 kişilik seminer salonu ve icra kurulu odası; işitme indüksiyon döngüsü, asansörlü giriş ve engelli donanımlarıyla tam erişilebilirdir.
          </p>
</div>
{/*  Rule Card: KEP İhbarı  */}
<div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm">
<div className="flex items-center gap-3 mb-2">
<div className="w-8 h-8 rounded bg-surface-ice text-primary flex items-center justify-center">
<span className="material-symbols-outlined text-lg">security</span>
</div>
<h3 className="font-headline-sm text-sm font-bold text-primary">KEP (Kayıtlı Elektronik Posta) Tebliği</h3>
</div>
<p className="font-body-sm text-body-sm text-slate-muted leading-relaxed">
            Tebligat Kanunu kapsamında resmi bildirimler ve hukuki yazışmalar doğrudan <strong className="text-primary font-mono text-xs">ahid@hs01.kep.tr</strong> adresine iletilmelidir.
          </p>
</div>
</div>
{/*  Right Column: Interactive FAQ Accordion (7 cols)  */}
<div className="lg:col-span-7 flex flex-col gap-4">
<div>
<span className="font-caption-caps text-caption-caps text-gold-deep bg-gold-light/40 px-3 py-1 rounded-full uppercase tracking-wider mb-2 inline-block font-bold">
            Sıkça Sorulan Sorular
          </span>
<h3 className="font-headline-md text-headline-md text-primary font-bold">
            Ziyaret ve İletişim Hakkında Merak Edilenler
          </h3>
</div>
{/*  FAQ Item 1  */}
<details className="bg-surface-container-lowest p-5 rounded-xl shadow-sm group [&amp;[open]]:shadow-md transition-all">
<summary className="font-label-md text-label-md text-on-surface font-semibold flex items-center justify-between cursor-pointer list-none">
<span className="">Genel Merkez binasını randevusuz ziyaret edebilir miyim?</span>
<span className="material-symbols-outlined text-primary group-open:rotate-180 transition-transform">expand_more</span>
</summary>
<div className="mt-3 pt-3 border-t border-surface-container font-body-sm text-body-sm text-slate-muted leading-relaxed">
            Yeni üyelik müracaatı ve aidat/belge teslimi için hafta içi mesai saatlerinde randevusuz olarak Sicil Masasını ziyaret edebilirsiniz. Ancak Yönetim Kurulu üyeleri veya İcra Heyeti ile yapılacak resmi görüşmeler için en az 1 gün öncesinden randevu kaydı oluşturulması zorunludur.
          </div>
</details>
{/*  FAQ Item 2  */}
<details className="bg-surface-container-lowest p-5 rounded-xl shadow-sm group [&amp;[open]]:shadow-md transition-all">
<summary className="font-label-md text-label-md text-on-surface font-semibold flex items-center justify-between cursor-pointer list-none">
<span className="">İletişim fakültesi öğrencileri için genel merkez kütüphanesi açık mı?</span>
<span className="material-symbols-outlined text-primary group-open:rotate-180 transition-transform">expand_more</span>
</summary>
<div className="mt-3 pt-3 border-t border-surface-container font-body-sm text-body-sm text-slate-muted leading-relaxed">
            Evet, AHİD Basın ve Halkla İlişkiler İhtisas Kütüphanesi; Ankara'daki tüm iletişim fakültesi lisans, yüksek lisans ve doktora öğrencilerine açıktır. Öğrenci kimliği ibraz edilerek Salı ve Perşembe günleri 10:00 - 16:00 saatleri arasında kaynaklardan faydalanılabilir.
          </div>
</details>
{/*  FAQ Item 3  */}
<details className="bg-surface-container-lowest p-5 rounded-xl shadow-sm group [&amp;[open]]:shadow-md transition-all">
<summary className="font-label-md text-label-md text-on-surface font-semibold flex items-center justify-between cursor-pointer list-none">
<span className="">Kurumsal etkinlikler veya basın toplantıları için salon tahsisi yapılıyor mu?</span>
<span className="material-symbols-outlined text-primary group-open:rotate-180 transition-transform">expand_more</span>
</summary>
<div className="mt-3 pt-3 border-t border-surface-container font-body-sm text-body-sm text-slate-muted leading-relaxed">
            Dernek asil üyelerimizin temsil ettiği kurumsal yapılar ve kamu paydaşlarımız; kamu yararına düzenlenen sektörel basın toplantıları, panel ve yuvarlak masa görüşmeleri için Genel Merkez Seminer Salonu rezervasyon talebinde bulunabilirler.
          </div>
</details>
{/*  FAQ Item 4  */}
<details className="bg-surface-container-lowest p-5 rounded-xl shadow-sm group [&amp;[open]]:shadow-md transition-all">
<summary className="font-label-md text-label-md text-on-surface font-semibold flex items-center justify-between cursor-pointer list-none">
<span className="">Resmi tatiller ve hafta sonları santral hizmet veriyor mu?</span>
<span className="material-symbols-outlined text-primary group-open:rotate-180 transition-transform">expand_more</span>
</summary>
<div className="mt-3 pt-3 border-t border-surface-container font-body-sm text-body-sm text-slate-muted leading-relaxed">
            Resmi tatiller ve hafta sonlarında santralimiz sesli yanıt sistemine geçer. Acil basın açıklamaları ve kriz iletişimi gerektiren durumlar için <strong className="text-primary">basin@ahid.org.tr</strong> e-posta adresimiz nöbetçi basın sözcüsü tarafından 7/24 izlenmektedir.
          </div>
</details>
{/*  FAQ Item 5  */}
<details className="bg-surface-container-lowest p-5 rounded-xl shadow-sm group [&amp;[open]]:shadow-md transition-all">
<summary className="font-label-md text-label-md text-on-surface font-semibold flex items-center justify-between cursor-pointer list-none">
<span className="">Usta'ya Saygı röportaj serisi için kaynak ve fiziksel arşiv incelemesi nasıl talep edilir?</span>
<span className="material-symbols-outlined text-primary group-open:rotate-180 transition-transform">expand_more</span>
</summary>
<div className="mt-3 pt-3 border-t border-surface-container font-body-sm text-body-sm text-slate-muted leading-relaxed">
            1990 yılından bu yana kayıt altına alınan ses kayıtları, fotoğraf negatifleri ve basılı bültenler; Akademik Yayın Kurulu sekretaryasına dilekçe ile başvurularak dernek merkezinde araştırmacılara sunulmaktadır.
          </div>
</details>
{/*  Help Desk Banner  */}
<div className="mt-4 p-5 rounded-xl bg-surface-ice flex flex-col sm:flex-row items-center justify-between gap-4">
<div className="flex items-center gap-3">
<span className="material-symbols-outlined text-primary text-2xl">support_agent</span>
<div>
<div className="font-label-md text-label-md text-primary font-bold">Farklı bir sorunuz mu var?</div>
<div className="font-body-sm text-body-sm text-slate-muted">Hafta içi danışma hattımız hizmetinizdedir.</div>
</div>
</div>
<a className="inline-flex items-center gap-1.5 bg-primary text-on-primary font-label-sm text-label-sm px-4 py-2 rounded shadow-sm hover:bg-primary-container transition-colors shrink-0" href="tel:+903122319090">
<span className="material-symbols-outlined text-base">call</span>
<span className="">+90 (312) 231 90 90</span>
</a>
</div>
</div>
</div>
</section>
</div></main>
      <Footer />
    </>
  );
}
