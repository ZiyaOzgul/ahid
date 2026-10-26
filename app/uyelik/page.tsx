"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function UyelikPage() {
  const [step, setStep] = useState(1);
  const [selectedTier, setSelectedTier] = useState("asil");
  const [submitted, setSubmitted] = useState(false);
  const [appNo, setAppNo] = useState("AHID-2026-0042");
  const [submitting, setSubmitting] = useState(false);
  const [cvUrl, setCvUrl] = useState<string>("");
  const [cvName, setCvName] = useState<string>("");
  const [uploadingCv, setUploadingCv] = useState(false);
  const [openFaqs, setOpenFaqs] = useState<{ [key: number]: boolean }>({ 1: true });

  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCv(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("bucket", "cv-uploads");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success && data.url) {
        setCvUrl(data.url);
        setCvName(file.name);
      }
    } catch (err) {
      console.error("CV upload error:", err);
    } finally {
      setUploadingCv(false);
    }
  };

  const selectTierAndScroll = (tier: string) => {
    setSelectedTier(tier);
    setStep(1);
    const formEl = document.getElementById("basvuru-formu");
    if (formEl) formEl.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleFaq = (index: number) => {
    setOpenFaqs((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const fullName = ((formData.get("full_name") as string) || "").trim();
    const nameParts = fullName.split(" ").filter(Boolean);
    const firstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(" ") : fullName || "Aday";
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "Üye";

    const payload = {
      tier: (formData.get("membership_tier") as string) || selectedTier || "asil",
      first_name: firstName,
      last_name: lastName,
      tc_no: ((formData.get("tc_no") as string) || "").trim(),
      email: ((formData.get("email") as string) || "").trim(),
      phone: ((formData.get("phone") as string) || "").trim(),
      birth_date: ((formData.get("birth_date") as string) || "").trim(),
      city: ((formData.get("city") as string) || "Ankara").trim(),
      organization: ((formData.get("organization") as string) || "").trim(),
      position: ((formData.get("position") as string) || "").trim(),
      university: ((formData.get("university") as string) || "").trim(),
      graduation_year: ((formData.get("graduation_year") as string) || "").trim(),
      degree: ((formData.get("degree") as string) || "Lisans").trim(),
      experience_years: ((formData.get("experience_years") as string) || "").trim(),
      linkedin_url: ((formData.get("linkedin_url") as string) || "").trim(),
      cv_url: cvUrl || null,
    };

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success && data.application_no) {
        setAppNo(data.application_no);
      }
    } catch (err) {
      console.error("Application error:", err);
    } finally {
      setSubmitting(false);
      setSubmitted(true);
    }
  };

  return (
    <>
      <Navbar />
      <main className="w-full pt-[7.5rem] bg-surface min-h-[calc(100vh-28rem)]"><div className="flex flex-col w-full">
{/*  BREADCRUMB & REGISTRY NOTICE  */}
<section className="w-full bg-surface-container-low">
<div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop py-space-md">
<div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm text-label-sm font-label-sm">
<nav aria-label="Ekmek Kırıntısı" className="flex items-center gap-space-xs text-slate-muted">
<a className="hover:text-primary transition-colors" href="/">ANA SAYFA</a>
<span className="text-outline-variant font-normal">/</span>
<span className="text-slate-dark">ÜYELİK &amp; AKREDİTASYON</span>
<span className="text-outline-variant font-normal">/</span>
<span className="text-primary font-bold">BAŞVURU PORTALI</span>
</nav>
<div className="inline-flex items-center gap-space-xs px-3 py-1 rounded bg-surface-container-high text-primary font-caption-caps text-caption-caps">
<span className="material-symbols-outlined text-sm text-gold-deep" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
<span className="">T.C. İÇİŞLERİ BAKANLIĞI KÜTÜK NO: 06-039-142 • KAMUSAL VE KURUMSAL İLETİŞİM PLATFORMU</span>
</div>
</div>
</div>
</section>
{/*  EDITORIAL HERO INTRO SECTION  */}
<section className="relative w-full overflow-hidden bg-gradient-to-b from-surface-container-low via-surface to-background py-space-2xl">
<div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop relative z-10">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
<div className="lg:col-span-8 flex flex-col gap-space-md">
<div className="inline-flex items-center gap-2 self-start px-3 py-1 rounded-full bg-gold-light/40 text-gold-deep font-caption-caps text-caption-caps shadow-sm">
<span className="inline-block w-2 h-2 rounded-full bg-gold-deep animate-pulse"></span>
            2025 - 2026 DÖNEMİ AKREDİTASYON VE ADAYLIK KABULÜ AÇIK
          </div>
<h1 className="font-display-hero text-display-hero text-primary tracking-tight font-extrabold max-w-4xl">
            Başkent İletişim Ağına Katılın, Mesleki Prestijinizi Akredite Edin.
          </h1>
<p className="font-body-lg text-body-lg text-slate-dark max-w-3xl leading-relaxed">
            AHİD üyeliği; Türkiye'nin karar alıcı başkentinde kamu bürokrasisi, akademi ve özel sektörün saygın iletişim liderleriyle aynı masada yer almanızı, mesleki akreditasyon kazanmanızı ve sürekli mesleki gelişim (CPD) ağından ayrıcalıklı olarak faydalanmanızı sağlar.
          </p>
<div className="pt-space-xs flex flex-wrap items-center gap-space-md">
<a className="inline-flex items-center gap-2 px-6 py-3 rounded bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container shadow-md transition-all" href="#basvuru-formu">
<span className="">Hemen Başvuruyu Başlat</span>
<span className="material-symbols-outlined text-sm">arrow_downward</span>
</a>
<a className="inline-flex items-center gap-2 px-5 py-3 rounded bg-surface-container text-primary font-label-md text-label-md hover:bg-surface-container-high transition-colors" href="#uyelik-tipleri">
<span className="material-symbols-outlined text-sm">tune</span>
<span className="">Üyelik Tipleri ve Kriterler</span>
</a>
</div>
</div>
<div className="lg:col-span-4 flex flex-col gap-space-md">
{/*  Institutional Accreditation Seal Card  */}
<div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-xl relative overflow-hidden">
<div className="absolute top-0 right-0 w-32 h-32 bg-secondary-container/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
<div className="flex items-center gap-space-sm mb-space-sm">
<div className="w-12 h-12 rounded-lg bg-surface-ice flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
</div>
<div>
<div className="font-headline-sm text-headline-sm text-primary font-bold">Resmi AHİD Rozeti</div>
<div className="font-label-sm text-label-sm text-slate-muted">Diplomatik &amp; Kurumsal Statü</div>
</div>
</div>
<p className="font-body-sm text-body-sm text-slate-muted mb-space-md">
              Kabul edilen üyeler, resmi kartvizit, e-posta imzası ve akademik yayınlarda <strong>“AHİD Akredite İletişim Uzmanı”</strong> unvan ve mührünü kullanma hakkına sahip olur.
            </p>
<div className="p-space-sm rounded bg-surface-ice flex items-center justify-between">
<span className="font-caption-caps text-caption-caps text-primary font-bold">KABUL ORANI: %68.4</span>
<span className="font-caption-caps text-caption-caps text-slate-muted">ETİK KURUL DENETİMLİ</span>
</div>
</div>
</div>
</div>
{/*  VALUE HIGHLIGHTS METRICS ROW  */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md mt-space-2xl">
<div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-start gap-space-sm">
<div className="p-2 rounded bg-surface-container text-primary">
<span className="material-symbols-outlined text-xl">groups</span>
</div>
<div>
<div className="font-headline-md text-headline-md font-bold text-primary">850+</div>
<div className="font-label-sm text-label-sm text-slate-dark font-medium">Akredite Üye &amp; Lider</div>
<div className="font-caption-caps text-caption-caps text-slate-muted">Bürokrasi, akademi &amp; özel sektör</div>
</div>
</div>
<div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-start gap-space-sm">
<div className="p-2 rounded bg-surface-container text-primary">
<span className="material-symbols-outlined text-xl">military_tech</span>
</div>
<div>
<div className="font-headline-md text-headline-md font-bold text-primary">CPD</div>
<div className="font-label-sm text-label-sm text-slate-dark font-medium">Mesleki Gelişim Kredisi</div>
<div className="font-caption-caps text-caption-caps text-slate-muted">Uluslararası standartlarda belgelendirme</div>
</div>
</div>
<div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-start gap-space-sm">
<div className="p-2 rounded bg-surface-container text-primary">
<span className="material-symbols-outlined text-xl">policy</span>
</div>
<div>
<div className="font-headline-md text-headline-md font-bold text-primary">Masada Temsil</div>
<div className="font-label-sm text-label-sm text-slate-dark font-medium">Kamu &amp; Regülasyon Ağı</div>
<div className="font-caption-caps text-caption-caps text-slate-muted">Sektörel politika ve istişare kurulları</div>
</div>
</div>
<div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-start gap-space-sm">
<div className="p-2 rounded bg-surface-container text-primary">
<span className="material-symbols-outlined text-xl">event_available</span>
</div>
<div>
<div className="font-headline-md text-headline-md font-bold text-primary">14+ Kongre</div>
<div className="font-label-sm text-label-sm text-slate-dark font-medium">Yıllık Ücretsiz Katılım</div>
<div className="font-caption-caps text-caption-caps text-slate-muted">Masterclass, çalıştay ve yuvarlak masa</div>
</div>
</div>
</div>
</div>
</section>
{/*  MEMBERSHIP TIERS COMPARISON  */}
<section className="w-full py-space-3xl bg-surface-canvas" id="uyelik-tipleri">
<div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop">
<div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-space-2xl">
<span className="font-caption-caps text-caption-caps text-secondary font-bold uppercase tracking-widest mb-space-xs">KATEGORİLER &amp; KATILIM KOŞULLARI</span>
<h2 className="font-headline-xl text-headline-xl text-primary font-bold">Size Uygun Üyelik Statüsünü Seçin</h2>
<p className="font-body-md text-body-md text-slate-muted mt-space-sm">
          AHİD Tüzüğü 4. ve 5. maddelerince belirlenmiş akreditasyon katmanları; kariyer kıdeminiz, akademik statünüz veya kurumsal temsil gücünüze göre şekillendirilmiştir.
        </p>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-lg">
{/*  Tier 1: Asil Üyelik (Featured)  */}
<div className="flex flex-col justify-between p-space-lg rounded-xl bg-surface-container-lowest shadow-xl relative overflow-hidden">
<div className="absolute top-0 left-0 right-0 h-1.5 bg-primary"></div>
<div>
<div className="flex items-center justify-between mb-space-sm">
<span className="px-2.5 py-0.5 rounded font-caption-caps text-caption-caps bg-primary text-on-primary uppercase">En Çok Tercih Edilen</span>
<span className="material-symbols-outlined text-primary">badge</span>
</div>
<h3 className="font-headline-sm text-headline-sm text-primary font-bold">Asil Üyelik</h3>
<p className="font-body-sm text-body-sm text-slate-muted mt-1">Sektörde en az 3 yıl deneyimli halkla ilişkiler ve kurumsal iletişim yöneticileri.</p>
<div className="mt-space-md pt-space-sm pb-space-sm bg-surface-container-low rounded-lg p-3">
<div className="text-slate-muted font-caption-caps text-caption-caps">YILLIK AİDAT</div>
<div className="flex items-baseline gap-1">
<span className="font-headline-lg text-headline-lg font-extrabold text-primary">₺1.200</span>
<span className="font-body-sm text-body-sm text-slate-muted">/ yıl</span>
</div>
<div className="font-caption-caps text-caption-caps text-slate-dark mt-1">+₺500 Tek Seferlik Giriş Ödentisi</div>
</div>
<div className="mt-space-md space-y-space-sm font-body-sm text-body-sm text-slate-dark">
<div className="flex items-start gap-2">
<span className="material-symbols-outlined text-primary text-base mt-0.5">check_circle</span>
<span className="">Genel Kurulda seçme ve seçilme tam oy hakkı</span>
</div>
<div className="flex items-start gap-2">
<span className="material-symbols-outlined text-primary text-base mt-0.5">check_circle</span>
<span className="">İhtisas komisyonlarında başkanlık ve yürütme</span>
</div>
<div className="flex items-start gap-2">
<span className="material-symbols-outlined text-primary text-base mt-0.5">check_circle</span>
<span className="">VIP protokol ve diplomatik resepsiyon katılımı</span>
</div>
<div className="flex items-start gap-2">
<span className="material-symbols-outlined text-primary text-base mt-0.5">check_circle</span>
<span className="">Resmi AHİD Akreditasyon Rozeti &amp; Sertifikası</span>
</div>
</div>
</div>
<div className="mt-space-lg pt-space-md">
<button className="inline-flex items-center justify-center gap-2 bg-[#0b3d91] hover:bg-[#082b66] text-white font-semibold px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 active:scale-95 w-full" onClick={() => selectTierAndScroll("asil")}>
<span className="">Asil Üyelik İçin Başvur</span>
<span className="material-symbols-outlined text-sm">arrow_forward</span>
</button>
</div>
</div>
{/*  Tier 2: Akademik Üyelik  */}
<div className="flex flex-col justify-between p-space-lg rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
<div className="absolute top-0 left-0 right-0 h-1.5 bg-secondary"></div>
<div>
<div className="flex items-center justify-between mb-space-sm">
<span className="px-2.5 py-0.5 rounded font-caption-caps text-caption-caps bg-surface-ice text-secondary font-bold uppercase">Bilim &amp; Araştırma</span>
<span className="material-symbols-outlined text-secondary">school</span>
</div>
<h3 className="font-headline-sm text-headline-sm text-primary font-bold">Akademik Üyelik</h3>
<p className="font-body-sm text-body-sm text-slate-muted mt-1">İletişim fakülteleri öğretim elemanları, doktoralı araştırmacılar ve bilim insanları.</p>
<div className="mt-space-md pt-space-sm pb-space-sm bg-surface-container-low rounded-lg p-3">
<div className="text-slate-muted font-caption-caps text-caption-caps">YILLIK AİDAT</div>
<div className="flex items-baseline gap-1">
<span className="font-headline-lg text-headline-lg font-extrabold text-primary">₺800</span>
<span className="font-body-sm text-body-sm text-slate-muted">/ yıl</span>
</div>
<div className="font-caption-caps text-caption-caps text-secondary font-semibold mt-1">Giriş Ödentisi Alınmaz</div>
</div>
<div className="mt-space-md space-y-space-sm font-body-sm text-body-sm text-slate-dark">
<div className="flex items-start gap-2">
<span className="material-symbols-outlined text-secondary text-base mt-0.5">check_circle</span>
<span className="">Hakemli İletişim Raporları yayın ve bilim kurulu</span>
</div>
<div className="flex items-start gap-2">
<span className="material-symbols-outlined text-secondary text-base mt-0.5">check_circle</span>
<span className="">Yıllık İletişim Kongrelerinde oturum başkanlığı</span>
</div>
<div className="flex items-start gap-2">
<span className="material-symbols-outlined text-secondary text-base mt-0.5">check_circle</span>
<span className="">Sektör-Akademi ortak araştırma fonlarına erişim</span>
</div>
<div className="flex items-start gap-2">
<span className="material-symbols-outlined text-secondary text-base mt-0.5">check_circle</span>
<span className="">Genel Kurul danışma delegasyonu üyeliği</span>
</div>
</div>
</div>
<div className="mt-space-lg pt-space-md">
<button className="w-full py-2.5 px-4 rounded bg-surface-container text-primary hover:bg-surface-container-high font-label-md text-label-md transition-colors flex items-center justify-center gap-2" onClick={() => selectTierAndScroll("akademik")}>
<span className="">Akademik Üyelik Seç</span>
<span className="material-symbols-outlined text-sm">arrow_forward</span>
</button>
</div>
</div>
{/*  Tier 3: Kurumsal & Ajans Üyeliği  */}
<div className="flex flex-col justify-between p-space-lg rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
<div className="absolute top-0 left-0 right-0 h-1.5 bg-gold-deep"></div>
<div>
<div className="flex items-center justify-between mb-space-sm">
<span className="px-2.5 py-0.5 rounded font-caption-caps text-caption-caps bg-gold-light/50 text-gold-deep font-bold uppercase">Kurumsal Temsil</span>
<span className="material-symbols-outlined text-gold-deep">corporate_fare</span>
</div>
<h3 className="font-headline-sm text-headline-sm text-primary font-bold">Kurumsal &amp; Ajans</h3>
<p className="font-body-sm text-body-sm text-slate-muted mt-1">İletişim ve PR ajansları, kamu kuruluşları ve özel sektör direktörlükleri.</p>
<div className="mt-space-md pt-space-sm pb-space-sm bg-surface-container-low rounded-lg p-3">
<div className="text-slate-muted font-caption-caps text-caption-caps">YILLIK KURUMSAL KATILIM</div>
<div className="flex items-baseline gap-1">
<span className="font-headline-lg text-headline-lg font-extrabold text-primary">₺12.000</span>
<span className="font-body-sm text-body-sm text-slate-muted">/ yıl</span>
</div>
<div className="font-caption-caps text-caption-caps text-slate-dark mt-1">5 Delegeye Kadar Dahil</div>
</div>
<div className="mt-space-md space-y-space-sm font-body-sm text-body-sm text-slate-dark">
<div className="flex items-start gap-2">
<span className="material-symbols-outlined text-gold-deep text-base mt-0.5">check_circle</span>
<span className="">Kurum bünyesinden 5 yöneticiye tam üyelik</span>
</div>
<div className="flex items-start gap-2">
<span className="material-symbols-outlined text-gold-deep text-base mt-0.5">check_circle</span>
<span className="">İletişim Başarı Ödülleri'nde öncelikli kategori hakkı</span>
</div>
<div className="flex items-start gap-2">
<span className="material-symbols-outlined text-gold-deep text-base mt-0.5">check_circle</span>
<span className="">AHİD etkinliklerinde kurumsal logo ve marka temsili</span>
</div>
<div className="flex items-start gap-2">
<span className="material-symbols-outlined text-gold-deep text-base mt-0.5">check_circle</span>
<span className="">İstihdam ve yetenek havuzuna doğrudan erişim</span>
</div>
</div>
</div>
<div className="mt-space-lg pt-space-md">
<button className="w-full py-2.5 px-4 rounded bg-surface-container text-primary hover:bg-surface-container-high font-label-md text-label-md transition-colors flex items-center justify-center gap-2" onClick={() => selectTierAndScroll("kurumsal")}>
<span className="">Kurumsal Başvuru Yap</span>
<span className="material-symbols-outlined text-sm">arrow_forward</span>
</button>
</div>
</div>
{/*  Tier 4: Genç İletişimci & Aday  */}
<div className="flex flex-col justify-between p-space-lg rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
<div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-muted"></div>
<div>
<div className="flex items-center justify-between mb-space-sm">
<span className="px-2.5 py-0.5 rounded font-caption-caps text-caption-caps bg-surface-container text-slate-dark font-bold uppercase">Geleceğin Liderleri</span>
<span className="material-symbols-outlined text-slate-muted">psychology</span>
</div>
<h3 className="font-headline-sm text-headline-sm text-primary font-bold">Genç İletişimci</h3>
<p className="font-body-sm text-body-sm text-slate-muted mt-1">İletişim fakültesi son sınıf öğrencileri ve 0-2 yıl deneyimli yeni mezunlar.</p>
<div className="mt-space-md pt-space-sm pb-space-sm bg-surface-container-low rounded-lg p-3">
<div className="text-slate-muted font-caption-caps text-caption-caps">YILLIK DESTEK AİDATI</div>
<div className="flex items-baseline gap-1">
<span className="font-headline-lg text-headline-lg font-extrabold text-primary">₺350</span>
<span className="font-body-sm text-body-sm text-slate-muted">/ yıl</span>
</div>
<div className="font-caption-caps text-caption-caps text-slate-dark mt-1">Sembolik Gençlik Fonu Katkısı</div>
</div>
<div className="mt-space-md space-y-space-sm font-body-sm text-body-sm text-slate-dark">
<div className="flex items-start gap-2">
<span className="material-symbols-outlined text-primary text-base mt-0.5">check_circle</span>
<span className="">Üst Düzey İletişim Direktörleri Mentorluk Programı</span>
</div>
<div className="flex items-start gap-2">
<span className="material-symbols-outlined text-primary text-base mt-0.5">check_circle</span>
<span className="">Ankara PR Staj &amp; İstihdam Portalı erişimi</span>
</div>
<div className="flex items-start gap-2">
<span className="material-symbols-outlined text-primary text-base mt-0.5">check_circle</span>
<span className="">Tüm sertifikalı atölye ve eğitimlere ücretsiz katılım</span>
</div>
<div className="flex items-start gap-2">
<span className="material-symbols-outlined text-primary text-base mt-0.5">check_circle</span>
<span className="">Genç AHİD Çalışma Grubu komite üyeliği</span>
</div>
</div>
</div>
<div className="mt-space-lg pt-space-md">
<button className="inline-flex items-center justify-center gap-2 bg-[#0b3d91] hover:bg-[#082b66] text-white font-semibold px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 active:scale-95 w-full" onClick={() => selectTierAndScroll("genc")}>
<span className="">Aday Üyelik Başlat</span>
<span className="material-symbols-outlined text-sm">arrow_forward</span>
</button>
</div>
</div>
</div>
</div>
</section>
{/*  STEP-BY-STEP MEMBERSHIP APPLICATION PROCESS  */}
<section className="w-full py-space-3xl bg-surface">
<div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop">
<div className="flex flex-col md:flex-row md:items-end justify-between mb-space-2xl gap-space-md">
<div>
<span className="font-caption-caps text-caption-caps text-secondary font-bold uppercase tracking-widest">ŞEFFAF VE LİYAKATLİ DEĞERLENDİRME</span>
<h2 className="font-headline-xl text-headline-xl text-primary font-bold mt-1">4 Aşamalı Akreditasyon Yolculuğu</h2>
</div>
<p className="font-body-sm text-body-sm text-slate-muted max-w-md">
          AHİD Tüzüğü md. 4 ve Mesleki Deontoloji Esasları uyarınca tüm başvurular bağımsız Sicil ve Yönetim Kurulu tarafından titizlikle ele alınır.
        </p>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-lg relative">
{/*  Step 1  */}
<div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
<div>
<div className="w-10 h-10 rounded-full bg-primary text-on-primary font-headline-sm text-headline-sm font-bold flex items-center justify-center mb-space-md">1</div>
<h4 className="font-headline-sm text-headline-sm text-primary font-bold mb-space-xs">Online Başvuru &amp; Özgeçmiş</h4>
<p className="font-body-sm text-body-sm text-slate-muted leading-relaxed">
              Portal üzerinden başvuru formunu doldurun, sektörel deneyim belgelerinizi ve güncel özgeçmişinizi sisteme yükleyin.
            </p>
</div>
<div className="pt-space-md mt-space-md border-t-0 text-caption-caps font-caption-caps text-secondary font-bold flex items-center gap-1">
<span className="material-symbols-outlined text-sm">timer</span>
<span className="">SÜRE: ORTALAMA 10 DAKİKA</span>
</div>
</div>
{/*  Step 2  */}
<div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
<div>
<div className="w-10 h-10 rounded-full bg-primary-container text-on-primary font-headline-sm text-headline-sm font-bold flex items-center justify-center mb-space-md">2</div>
<h4 className="font-headline-sm text-headline-sm text-primary font-bold mb-space-xs">Sicil &amp; Referans Tetkiki</h4>
<p className="font-body-sm text-body-sm text-slate-muted leading-relaxed">
              Belirttiğiniz 2 asil üye referansı ile teyit sağlanır; mesleki etik ve deontoloji sicil uygunluğu Sicil Kurulu'nca taranır.
            </p>
</div>
<div className="pt-space-md mt-space-md border-t-0 text-caption-caps font-caption-caps text-slate-dark font-bold flex items-center gap-1">
<span className="material-symbols-outlined text-sm">assignment_turned_in</span>
<span className="">SÜRE: 3 - 5 İŞ GÜNÜ</span>
</div>
</div>
{/*  Step 3  */}
<div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
<div>
<div className="w-10 h-10 rounded-full bg-secondary text-on-secondary font-headline-sm text-headline-sm font-bold flex items-center justify-center mb-space-md">3</div>
<h4 className="font-headline-sm text-headline-sm text-primary font-bold mb-space-xs">Yönetim Kurulu Kararı</h4>
<p className="font-body-sm text-body-sm text-slate-muted leading-relaxed">
              Her ayın 1. ve 3. haftası toplanan AHİD Yönetim Kurulu, Sicil raporunu inceleyerek nihai üyelik kabul kararını resmileştirir.
            </p>
</div>
<div className="pt-space-md mt-space-md border-t-0 text-caption-caps font-caption-caps text-slate-dark font-bold flex items-center gap-1">
<span className="material-symbols-outlined text-sm">gavel</span>
<span className="">SÜRE: EN GEÇ 30 GÜN (TÜZÜK MD. 4)</span>
</div>
</div>
{/*  Step 4  */}
<div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
<div>
<div className="w-10 h-10 rounded-full bg-gold-deep text-on-primary font-headline-sm text-headline-sm font-bold flex items-center justify-center mb-space-md">4</div>
<h4 className="font-headline-sm text-headline-sm text-primary font-bold mb-space-xs">Akreditasyon &amp; Üye Kartı</h4>
<p className="font-body-sm text-body-sm text-slate-muted leading-relaxed">
              Kabul tebligatınız e-posta ile iletilir. Dijital üye kimliğiniz aktive edilir, fiziki rozet ve beratınız Genel Merkez'de takdim edilir.
            </p>
</div>
<div className="pt-space-md mt-space-md border-t-0 text-caption-caps font-caption-caps text-gold-deep font-bold flex items-center gap-1">
<span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>military_tech</span>
<span className="">RESMİ AKREDİTASYON TESCİLİ</span>
</div>
</div>
</div>
</div>
</section>
{/*  INTERACTIVE STEPPED ONLINE APPLICATION FORM  */}
<section className="w-full py-space-3xl bg-surface-container-low" id="basvuru-formu">
<div className="max-w-5xl mx-auto px-margin-mobile lg:px-margin-desktop">
<div className="bg-surface-container-lowest rounded-2xl shadow-xl overflow-hidden">
{/*  Form Header with Progress Tracker  */}
<div className="bg-primary text-on-primary p-space-lg md:p-space-xl">
<div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md">
<div>
<span className="font-caption-caps text-caption-caps text-gold-light uppercase tracking-widest">RESMİ DİJİTAL BAŞVURU PORTALI</span>
<h3 className="font-headline-lg text-headline-lg font-bold text-on-primary mt-1">Üyelik &amp; Akreditasyon Başvuru Formu</h3>
<p className="font-body-sm text-body-sm text-on-primary-container mt-1">Tüm alanları eksiksiz doldurunuz. Bilgileriniz KVKK ve AHİD Veri Güvenliği Politikası uyarınca korunmaktadır.</p>
</div>
<div className="flex items-center gap-space-xs self-start md:self-auto bg-surface-container-highest/20 px-3 py-1.5 rounded">
<span className="material-symbols-outlined text-sm text-gold-light">lock</span>
<span className="font-caption-caps text-caption-caps text-on-primary">256-BIT SSL ŞİFRELİ</span>
</div>
</div>
{/*  Step Indicators Bar  */}
<div className="grid grid-cols-2 md:grid-cols-4 gap-space-sm mt-space-xl pt-space-md">
<button className="flex items-center gap-space-xs text-left p-2 rounded transition-all bg-surface-container-highest/25" id="step-btn-1" onClick={() => setStep(1)} type="button">
<span className="w-6 h-6 rounded-full bg-gold-light text-primary font-bold text-xs flex items-center justify-center shrink-0">1</span>
<span className="font-label-sm text-label-sm text-on-primary truncate">1. Üyelik &amp; Kimlik</span>
</button>
<button className="flex items-center gap-space-xs text-left p-2 rounded transition-all opacity-70 hover:opacity-100" id="step-btn-2" onClick={() => setStep(2)} type="button">
<span className="w-6 h-6 rounded-full bg-surface-container-highest/30 text-on-primary font-bold text-xs flex items-center justify-center shrink-0">2</span>
<span className="font-label-sm text-label-sm text-on-primary truncate">2. Meslek &amp; Kurum</span>
</button>
<button className="flex items-center gap-space-xs text-left p-2 rounded transition-all opacity-70 hover:opacity-100" id="step-btn-3" onClick={() => setStep(3)} type="button">
<span className="w-6 h-6 rounded-full bg-surface-container-highest/30 text-on-primary font-bold text-xs flex items-center justify-center shrink-0">3</span>
<span className="font-label-sm text-label-sm text-on-primary truncate">3. Referans &amp; Dosya</span>
</button>
<button className="flex items-center gap-space-xs text-left p-2 rounded transition-all opacity-70 hover:opacity-100" id="step-btn-4" onClick={() => setStep(4)} type="button">
<span className="w-6 h-6 rounded-full bg-surface-container-highest/30 text-on-primary font-bold text-xs flex items-center justify-center shrink-0">4</span>
<span className="font-label-sm text-label-sm text-on-primary truncate">4. Etik &amp; Onay</span>
</button>
</div>
</div>
{/*  Form Body Container  */}
<form className="p-space-lg md:p-space-xl space-y-space-xl" id="membershipForm" onSubmit={handleFormSubmit}>
{/*  STEP 1: Membership Type & Personal Details  */}
<div className="step-panel space-y-space-lg" id="step-panel-1" style={{ display: step === 1 && !submitted ? "block" : "none" }}>
<div>
<h4 className="font-headline-sm text-headline-sm text-primary font-bold">Adım 1: Üyelik Tipi ve Kimlik Bilgileri</h4>
<p className="font-body-sm text-body-sm text-slate-muted">Başvurmak istediğiniz kategoriyi belirleyin ve T.C. İçişleri Bakanlığı Dernekler Kanunu zorunlu kimlik alanlarını doldurun.</p>
</div>
{/*  Radio Tier Selector Cards  */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-sm pt-space-xs">
<label className="relative flex flex-col p-space-md rounded-lg bg-surface-container-low cursor-pointer hover:bg-surface-ice transition-colors">
<input defaultChecked className="peer sr-only" name="membership_tier" type="radio" value="asil" />
<div className="flex items-center justify-between mb-2">
<span className="font-label-md text-label-md font-bold text-primary">Asil Üyelik</span>
<span className="material-symbols-outlined text-primary text-base">check_circle</span>
</div>
<span className="font-caption-caps text-caption-caps text-slate-muted">En az 3 yıl sektör deneyimi</span>
<span className="font-label-sm text-label-sm text-primary font-bold mt-2">₺1.200 / yıl</span>
<div className="absolute inset-0 rounded-lg pointer-events-none peer-defaultChecked:bg-primary/5"></div>
</label>
<label className="relative flex flex-col p-space-md rounded-lg bg-surface-container-low cursor-pointer hover:bg-surface-ice transition-colors">
<input className="peer sr-only" name="membership_tier" type="radio" value="akademik" />
<div className="flex items-center justify-between mb-2">
<span className="font-label-md text-label-md font-bold text-primary">Akademik</span>
<span className="material-symbols-outlined text-secondary text-base">school</span>
</div>
<span className="font-caption-caps text-caption-caps text-slate-muted">Öğretim üyesi &amp; araştırmacı</span>
<span className="font-label-sm text-label-sm text-secondary font-bold mt-2">₺800 / yıl</span>
<div className="absolute inset-0 rounded-lg pointer-events-none peer-defaultChecked:bg-primary/5"></div>
</label>
<label className="relative flex flex-col p-space-md rounded-lg bg-surface-container-low cursor-pointer hover:bg-surface-ice transition-colors">
<input className="peer sr-only" name="membership_tier" type="radio" value="kurumsal" />
<div className="flex items-center justify-between mb-2">
<span className="font-label-md text-label-md font-bold text-primary">Kurumsal</span>
<span className="material-symbols-outlined text-gold-deep text-base">corporate_fare</span>
</div>
<span className="font-caption-caps text-caption-caps text-slate-muted">Ajans ve kurum temsilciliği</span>
<span className="font-label-sm text-label-sm text-gold-deep font-bold mt-2">₺12.000 / yıl</span>
<div className="absolute inset-0 rounded-lg pointer-events-none peer-defaultChecked:bg-primary/5"></div>
</label>
<label className="relative flex flex-col p-space-md rounded-lg bg-surface-container-low cursor-pointer hover:bg-surface-ice transition-colors">
<input className="peer sr-only" name="membership_tier" type="radio" value="genc" />
<div className="flex items-center justify-between mb-2">
<span className="font-label-md text-label-md font-bold text-primary">Genç İletişimci</span>
<span className="material-symbols-outlined text-slate-muted text-base">psychology</span>
</div>
<span className="font-caption-caps text-caption-caps text-slate-muted">Son sınıf veya 0-2 yıl yeni mezun</span>
<span className="font-label-sm text-label-sm text-slate-dark font-bold mt-2">₺350 / yıl</span>
<div className="absolute inset-0 rounded-lg pointer-events-none peer-defaultChecked:bg-primary/5"></div>
</label>
</div>
{/*  Identity Inputs Grid  */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-space-md pt-space-xs">
<div>
<label className="block font-label-sm text-label-sm text-slate-dark mb-1">Ad Soyad *</label>
<input className="w-full px-4 py-2.5 rounded bg-surface-container-lowest text-on-surface font-body-md text-body-md shadow-sm outline-none focus:bg-surface-ice transition-all" name="full_name" placeholder="Örn: Dr. Elif Arslan Yıldız" required type="text" />
</div>
<div>
<label className="block font-label-sm text-label-sm text-slate-dark mb-1">T.C. Kimlik No / Pasaport No (Yabancı Uyruklular İçin) *</label>
<input className="w-full px-4 py-2.5 rounded bg-surface-container-lowest text-on-surface font-body-md text-body-md shadow-sm outline-none focus:bg-surface-ice transition-all" maxLength={11} name="tc_no" placeholder="11 haneli T.C. Kimlik numaranız" required type="text" />
</div>
<div>
<label className="block font-label-sm text-label-sm text-slate-dark mb-1">Kurumsal / Şahsi E-posta Adresi *</label>
<input className="w-full px-4 py-2.5 rounded bg-surface-container-lowest text-on-surface font-body-md text-body-md shadow-sm outline-none focus:bg-surface-ice transition-all" name="email" placeholder="ad.soyad@kurum.gov.tr veya com.tr" required type="email" />
</div>
<div>
<label className="block font-label-sm text-label-sm text-slate-dark mb-1">Cep Telefonu (SMS Bildirimleri İçin) *</label>
<input className="w-full px-4 py-2.5 rounded bg-surface-container-lowest text-on-surface font-body-md text-body-md shadow-sm outline-none focus:bg-surface-ice transition-all" name="phone" placeholder="+90 (5XX) XXX XX XX" required type="tel" />
</div>
<div>
<label className="block font-label-sm text-label-sm text-slate-dark mb-1">Doğum Tarihi *</label>
<input className="w-full px-4 py-2.5 rounded bg-surface-container-lowest text-on-surface font-body-md text-body-md shadow-sm outline-none focus:bg-surface-ice transition-all" name="birth_date" required type="date" />
</div>
<div>
<label className="block font-label-sm text-label-sm text-slate-dark mb-1">Şehir / İkametgah İli *</label>
<select className="w-full px-4 py-2.5 rounded bg-surface-container-lowest text-on-surface font-body-md text-body-md shadow-sm outline-none focus:bg-surface-ice transition-all" name="city">
<option value="Ankara">Ankara</option>
<option value="İstanbul">İstanbul</option>
<option value="İzmir">İzmir</option>
<option value="Eskişehir">Eskişehir</option>
<option value="Diğer">Diğer (Yurt İçi / Yurt Dışı)</option>
</select>
</div>
</div>
<div className="flex justify-end pt-space-md">
<button className="px-6 py-2.5 rounded bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-all flex items-center gap-2 cursor-pointer" onClick={() => setStep(2)} type="button">
<span className="">Devam Et: Mesleki Bilgiler</span>
<span className="material-symbols-outlined text-sm">arrow_forward</span>
</button>
</div>
</div>
{/*  STEP 2: Professional & Educational Background  */}
<div className="step-panel hidden space-y-space-lg" id="step-panel-2" style={{ display: step === 2 && !submitted ? "block" : "none" }}>
<div>
<h4 className="font-headline-sm text-headline-sm text-primary font-bold">Adım 2: Mesleki Bilgiler &amp; Kurum Profili</h4>
<p className="font-body-sm text-body-sm text-slate-muted">Halkla ilişkiler, medya ve kurumsal iletişim tecrübenizi Sicil Kurulu değerlendirmesi için belirtiniz.</p>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
<div>
<label className="block font-label-sm text-label-sm text-slate-dark mb-1">Halen Çalışılan Kurum / Kuruluş / Ajans *</label>
<input className="w-full px-4 py-2.5 rounded bg-surface-container-lowest text-on-surface font-body-md text-body-md shadow-sm outline-none focus:bg-surface-ice transition-all" name="organization" placeholder="Örn: T.C. Sanayi Bakanlığı Basın Müşavirliği" required type="text" />
</div>
<div>
<label className="block font-label-sm text-label-sm text-slate-dark mb-1">Mevcut Görev / Unvan *</label>
<input className="w-full px-4 py-2.5 rounded bg-surface-container-lowest text-on-surface font-body-md text-body-md shadow-sm outline-none focus:bg-surface-ice transition-all" name="position" placeholder="Örn: Kurumsal İletişim Müdürü / Öğretim Üyesi" required type="text" />
</div>
<div>
<label className="block font-label-sm text-label-sm text-slate-dark mb-1">Mezun Olunan Üniversite &amp; Fakülte *</label>
<input className="w-full px-4 py-2.5 rounded bg-surface-container-lowest text-on-surface font-body-md text-body-md shadow-sm outline-none focus:bg-surface-ice transition-all" name="university" placeholder="Örn: Ankara Üniversitesi İletişim Fakültesi" required type="text" />
</div>
<div>
<label className="block font-label-sm text-label-sm text-slate-dark mb-1">Mezuniyet Yılı &amp; En Yüksek Eğitim Derecesi *</label>
<div className="grid grid-cols-2 gap-2">
<input className="w-full px-3 py-2.5 rounded bg-surface-container-lowest text-on-surface font-body-md text-body-md shadow-sm outline-none focus:bg-surface-ice transition-all" name="graduation_year" placeholder="Yıl: 2018" type="text" />
<select className="w-full px-3 py-2.5 rounded bg-surface-container-lowest text-on-surface font-body-md text-body-md shadow-sm outline-none focus:bg-surface-ice transition-all" name="degree">
<option value="Lisans">Lisans</option>
<option value="Yüksek Lisans">Yüksek Lisans</option>
<option value="Doktora (Ph.D)">Doktora (Ph.D)</option>
<option value="Doçent / Profesör">Doçent / Profesör</option>
</select>
</div>
</div>
<div>
<label className="block font-label-sm text-label-sm text-slate-dark mb-1">İletişim Sektöründeki Toplam Deneyim Süresi *</label>
<select className="w-full px-4 py-2.5 rounded bg-surface-container-lowest text-on-surface font-body-md text-body-md shadow-sm outline-none focus:bg-surface-ice transition-all" name="experience_years">
<option value="0 - 2 Yıl">0 - 2 Yıl (Aday Üyelik Kapsamı)</option>
<option value="3 - 5 Yıl">3 - 5 Yıl</option>
<option value="6 - 10 Yıl">6 - 10 Yıl</option>
<option value="10 - 15 Yıl">10 - 15 Yıl</option>
<option value="15 Yıl ve Üzeri">15 Yıl ve Üzeri (Kıdemli Liderlik)</option>
</select>
</div>
<div>
<label className="block font-label-sm text-label-sm text-slate-dark mb-1">LinkedIn Profil Bağlantısı (URL)</label>
<input className="w-full px-4 py-2.5 rounded bg-surface-container-lowest text-on-surface font-body-md text-body-md shadow-sm outline-none focus:bg-surface-ice transition-all" name="linkedin_url" placeholder="https://linkedin.com/in/kullaniciadi" type="text" />
</div>
</div>
{/*  Working Committees Preferences  */}
<div className="pt-space-sm">
<label className="block font-label-sm text-label-sm text-slate-dark mb-2 font-bold">
                Görev Almak İstediğiniz AHİD İhtisas Çalışma Komisyonları (En az 1 komisyon seçiniz)
              </label>
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-space-sm">
<label className="flex items-center gap-2 p-2.5 rounded bg-surface-container-low cursor-pointer hover:bg-surface-ice">
<input defaultChecked className="w-4 h-4 rounded text-primary" type="checkbox" />
<span className="font-body-sm text-body-sm text-slate-dark">Kamu Diplomasisi ve Şeffaflık</span>
</label>
<label className="flex items-center gap-2 p-2.5 rounded bg-surface-container-low cursor-pointer hover:bg-surface-ice">
<input defaultChecked className="w-4 h-4 rounded text-primary" type="checkbox" />
<span className="font-body-sm text-body-sm text-slate-dark">Yapay Zekâ ve Dijital Dönüşüm</span>
</label>
<label className="flex items-center gap-2 p-2.5 rounded bg-surface-container-low cursor-pointer hover:bg-surface-ice">
<input className="w-4 h-4 rounded text-primary" type="checkbox" />
<span className="font-body-sm text-body-sm text-slate-dark">Mesleki Etik ve Hukuk Kurulu</span>
</label>
<label className="flex items-center gap-2 p-2.5 rounded bg-surface-container-low cursor-pointer hover:bg-surface-ice">
<input className="w-4 h-4 rounded text-primary" type="checkbox" />
<span className="font-body-sm text-body-sm text-slate-dark">Gençlik ve Mentorluk Ağı</span>
</label>
<label className="flex items-center gap-2 p-2.5 rounded bg-surface-container-low cursor-pointer hover:bg-surface-ice">
<input className="w-4 h-4 rounded text-primary" type="checkbox" />
<span className="font-body-sm text-body-sm text-slate-dark">Akademik Hakemli Yayınlar</span>
</label>
<label className="flex items-center gap-2 p-2.5 rounded bg-surface-container-low cursor-pointer hover:bg-surface-ice">
<input className="w-4 h-4 rounded text-primary" type="checkbox" />
<span className="font-body-sm text-body-sm text-slate-dark">Sürdürülebilirlik &amp; KSS</span>
</label>
</div>
</div>
<div className="flex justify-between pt-space-md">
<button className="px-5 py-2.5 rounded bg-surface-container text-slate-dark font-label-md text-label-md hover:bg-surface-container-high transition-colors" onClick={() => setStep(1)} type="button">
                ← Geri: Kimlik Bilgileri
              </button>
<button className="px-6 py-2.5 rounded bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-all flex items-center gap-2" onClick={() => setStep(3)} type="button">
<span className="">Devam Et: Referanslar &amp; Belgeler</span>
<span className="material-symbols-outlined text-sm">arrow_forward</span>
</button>
</div>
</div>
{/*  STEP 3: References & Portfolio/CV Upload  */}
<div className="step-panel hidden space-y-space-lg" id="step-panel-3" style={{ display: step === 3 && !submitted ? "block" : "none" }}>
<div>
<h4 className="font-headline-sm text-headline-sm text-primary font-bold">Adım 3: Asil Üye Referansları ve Dosya Yükleme</h4>
<p className="font-body-sm text-body-sm text-slate-muted">AHİD Tüzüğü md. 4 gereğince en az 2 asil üye referansı zorunludur. Referansınız bulunmuyorsa mülakat opsiyonunu işaretleyebilirsiniz.</p>
</div>
{/*  References Grid  */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg">
<div className="p-space-md rounded-xl bg-surface-container-low">
<div className="flex items-center gap-2 mb-space-sm text-primary font-label-md text-label-md font-bold">
<span className="material-symbols-outlined text-base">recommend</span>
<span className="">1. Referans Asil Üye *</span>
</div>
<div className="space-y-space-sm">
<input className="w-full px-3 py-2 rounded bg-surface-container-lowest text-on-surface font-body-sm text-body-sm shadow-sm outline-none" name="ref1_name" placeholder="Referans Üye Adı Soyadı" type="text" />
<input className="w-full px-3 py-2 rounded bg-surface-container-lowest text-on-surface font-body-sm text-body-sm shadow-sm outline-none" name="ref1_title" placeholder="Kurumu / Unvanı" type="text" />
<input className="w-full px-3 py-2 rounded bg-surface-container-lowest text-on-surface font-body-sm text-body-sm shadow-sm outline-none" name="ref1_contact" placeholder="Telefonu veya E-posta Adresi" type="text" />
</div>
</div>
<div className="p-space-md rounded-xl bg-surface-container-low">
<div className="flex items-center gap-2 mb-space-sm text-primary font-label-md text-label-md font-bold">
<span className="material-symbols-outlined text-base">recommend</span>
<span className="">2. Referans Asil Üye (veya Kurum Amiri) *</span>
</div>
<div className="space-y-space-sm">
<input className="w-full px-3 py-2 rounded bg-surface-container-lowest text-on-surface font-body-sm text-body-sm shadow-sm outline-none" name="ref2_name" placeholder="Referans Üye Adı Soyadı" type="text" />
<input className="w-full px-3 py-2 rounded bg-surface-container-lowest text-on-surface font-body-sm text-body-sm shadow-sm outline-none" name="ref2_title" placeholder="Kurumu / Unvanı" type="text" />
<input className="w-full px-3 py-2 rounded bg-surface-container-lowest text-on-surface font-body-sm text-body-sm shadow-sm outline-none" name="ref2_contact" placeholder="Telefonu veya E-posta Adresi" type="text" />
</div>
</div>
</div>
{/*  Alternative Interview Option Checkbox  */}
<div className="p-space-md rounded-lg bg-surface-ice flex items-start gap-space-sm">
<input className="w-4 h-4 rounded text-primary mt-1" id="interview_opt" type="checkbox" />
<label className="font-body-sm text-body-sm text-slate-dark" htmlFor="interview_opt">
<strong>Ankara dışında görev yapıyorum veya 2 asil üye referansım henüz bulunmuyor:</strong> Sicil Kurulu ile çevrim içi/fiziki 15 dakikalık mülakat yapılmasını ve geçici referans komisyonuna aktarılmamı talep ediyorum.
              </label>
</div>
{/*  File Upload Dropzone  */}
<div>
<label className="block font-label-sm text-label-sm text-slate-dark mb-1 font-bold">Özgeçmiş (CV) ve Varsa Portfolyo / Çalışma Özetleri</label>
<label className="p-space-xl rounded-xl bg-surface-container-low text-center hover:bg-surface-ice transition-colors cursor-pointer flex flex-col items-center justify-center">
<div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-primary mb-space-sm">
<span className="material-symbols-outlined text-2xl">cloud_upload</span>
</div>
<div className="font-label-md text-label-md text-primary font-bold">
  {uploadingCv ? "Supabase Storage'a Yükleniyor..." : "Dosyaları Buraya Sürükleyip Bırakın veya Seçin"}
</div>
<div className="font-body-sm text-body-sm text-slate-muted mt-1">PDF, DOCX formatında (Maksimum 10MB • Supabase Storage)</div>
<input type="file" onChange={handleCvUpload} accept=".pdf,.doc,.docx" className="mt-3 text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-container" />
{cvName && (
  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
    <span className="material-symbols-outlined text-sm">check_circle</span>
    <span>{cvName} — SUPABASE STORAGE&apos;A YÜKLENDİ</span>
  </div>
)}
</label>
</div>
<div className="flex justify-between pt-space-md">
<button className="px-5 py-2.5 rounded bg-surface-container text-slate-dark font-label-md text-label-md hover:bg-surface-container-high transition-colors" onClick={() => setStep(2)} type="button">
                ← Geri: Mesleki Bilgiler
              </button>
<button className="px-6 py-2.5 rounded bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-all flex items-center gap-2" onClick={() => setStep(4)} type="button">
<span className="">Devam Et: Etik &amp; Taahhütname</span>
<span className="material-symbols-outlined text-sm">arrow_forward</span>
</button>
</div>
</div>
{/*  STEP 4: Ethics Commitment & Final Submission  */}
<div className="step-panel hidden space-y-space-lg" id="step-panel-4" style={{ display: step === 4 && !submitted ? "block" : "none" }}>
<div>
<h4 className="font-headline-sm text-headline-sm text-primary font-bold">Adım 4: Mesleki Deontoloji Taahhüdü ve Onay</h4>
<p className="font-body-sm text-body-sm text-slate-muted">AHİD, 1990 yılından bu yana kamusal şeffaflık ve iletişim etiğini en üst standartta savunmaktadır.</p>
</div>
{/*  Deontology Charter Box  */}
<div className="p-space-lg rounded-xl bg-surface-container-low max-h-48 overflow-y-auto font-body-sm text-body-sm text-slate-dark space-y-2">
<p className="font-bold text-primary">TÜRKİYE HALKLA İLİŞKİLER VE İLETİŞİM MESLEK ETİĞİ İLKELERİ BİLDİRGESİ:</p>
<p className="">1. <strong>Doğruluk ve Şeffaflık:</strong> Kamuoyuna yanıltıcı, manipülatif ve teyitsiz bilgi aktarımından kaçınmayı, hakikatin yanında yer almayı ilke edinirim.</p>
<p className="">2. <strong>Kamusal Sorumluluk:</strong> Temsil ettiğim kamu, özel veya sivil toplum kurumlarının faaliyetlerinde toplum yararını gözetmeyi mesleki öncelik kabul ederim.</p>
<p className="">3. <strong>Fikri Mülkiyet ve Liyakat:</strong> Meslektaşlarımın eser ve projelerine saygı duyar, haksız rekabet oluşturacak dezenformasyon ve etik dışı lobicilik faaliyetlerinde bulunmam.</p>
<p className="">4. <strong>Dernek Tüzüğüne Bağlılık:</strong> Ankara Halkla İlişkiler Derneği tüzüğü, Genel Kurul ve Yönetim Kurulu kararlarına uygun hareket edeceğimi peşinen kabul ve taahhüt ederim.</p>
</div>
{/*  Legal Consents Checkboxes  */}
<div className="space-y-space-sm pt-space-xs">
<label className="flex items-start gap-3 p-3 rounded-lg bg-surface-container-lowest shadow-sm cursor-pointer hover:bg-surface-ice">
<input defaultChecked className="w-4 h-4 rounded text-primary mt-1" required type="checkbox" />
<span className="font-body-sm text-body-sm text-slate-dark">
<strong>Mesleki Deontoloji Taahhüdü:</strong> AHİD Tüzüğü, Meslek Etiği İlkeleri ve Yönetmelik hükümlerine uymayı, aksi durumda Etik Kurulu yaptırımlarını kabul ettiğimi beyan ederim.
                </span>
</label>
<label className="flex items-start gap-3 p-3 rounded-lg bg-surface-container-lowest shadow-sm cursor-pointer hover:bg-surface-ice">
<input defaultChecked className="w-4 h-4 rounded text-primary mt-1" required type="checkbox" />
<span className="font-body-sm text-body-sm text-slate-dark">
<strong>KVKK ve İletişim İzni:</strong> 6698 sayılı Kişisel Verilerin Korunması Kanunu uyarınca verilerimin dernek sicil kütüğünde işlenmesini ve resmi bilgilendirme bültenlerinin iletilmesini onaylıyorum.
                </span>
</label>
<label className="flex items-start gap-3 p-3 rounded-lg bg-surface-container-lowest shadow-sm cursor-pointer hover:bg-surface-ice">
<input defaultChecked className="w-4 h-4 rounded text-primary mt-1" required type="checkbox" />
<span className="font-body-sm text-body-sm text-slate-dark">
                  Verdiğim tüm bilgi ve belgelerin gerçeğe uygun olduğunu, gerçeğe aykırı beyan durumunda üyeliğimin iptal edileceğini teyit ederim.
                </span>
</label>
</div>
{/*  Action Buttons Group  */}
<div className="flex flex-col sm:flex-row items-center justify-between gap-space-md pt-space-md">
<button className="w-full sm:w-auto px-5 py-2.5 rounded bg-surface-container text-slate-dark font-label-md text-label-md hover:bg-surface-container-high transition-colors" onClick={() => setStep(3)} type="button">
                ← Geri: Referanslar
              </button>
<div className="flex items-center gap-space-sm w-full sm:w-auto">
<button className="w-full sm:w-auto px-4 py-2.5 rounded bg-surface-container text-primary font-label-md text-label-md hover:bg-surface-container-high transition-colors" onClick={() => alert("Başvuru taslağınız yerel tarayıcınıza kaydedildi. Dilediğiniz zaman kaldığınız yerden devam edebilirsiniz.")} type="button">
                  Taslağı Kaydet
                </button>
<button className="inline-flex items-center justify-center gap-2 bg-[#0b3d91] hover:bg-[#082b66] text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200" type="submit">
<span className="material-symbols-outlined text-base">verified</span>
<span className="">Başvuruyu Tamamla ve Gönder</span>
</button>
</div>
</div>
</div>
{/*  SUCCESS POPUP / BANNER (Hidden by default, triggered on submit)  */}
<div className="hidden p-space-xl rounded-xl bg-surface-container-lowest text-center space-y-space-md" id="submit-success-card" style={{ display: submitted ? "block" : "none" }}>
<div className="w-16 h-16 rounded-full bg-surface-container text-primary mx-auto flex items-center justify-center">
<span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
</div>
<h4 className="font-headline-lg text-headline-lg text-primary font-bold">Başvurunuz Başarıyla Alındı!</h4>
<p className="font-body-md text-body-md text-slate-muted max-w-lg mx-auto">
              Başvuru Takip Kodunuz: <strong className="text-primary font-mono font-bold">{appNo}</strong>. Başvuru dosyanız Sicil Kurulu'na sevk edilmiştir. Gelişmeler e-posta ve SMS ile tarafınıza bildirilecektir.
            </p>
<div className="pt-space-sm">
<button className="px-6 py-2.5 rounded bg-primary text-on-primary font-label-md text-label-md" onClick={() => { setSubmitted(false); setStep(1); }} type="button">
                Yeni Başvuru / Sayfayı Yenile
              </button>
</div>
</div>
</form>
</div>
</div>
</section>
{/*  EDITORIAL SPOTLIGHT: ACCREDITATION BOARD & SCIENTIFIC COMMITTEE  */}
<section className="w-full py-space-3xl bg-surface">
<div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
<div className="lg:col-span-5 flex flex-col gap-space-md">
<span className="font-caption-caps text-caption-caps text-gold-deep font-bold uppercase tracking-wider">KURUMSAL DENETİM &amp; MEVZUAT</span>
<h2 className="font-headline-xl text-headline-xl text-primary font-bold">Başkentin En Prestijli İletişim Ağına Katılın</h2>
<p className="font-body-md text-body-md text-slate-muted leading-relaxed">
            AHİD Sicil ve Akreditasyon Kurulu; Türkiye'nin en köklü iletişim fakültelerinden profesörler, kıdemli kamu sözcüleri ve uluslararası halkla ilişkiler ajansı liderlerinden oluşur. Derneğimize üye olan her iletişimci, bağımsız bir liyakat filtresinden geçer.
          </p>
<div className="p-space-md rounded-xl bg-surface-ice flex items-center gap-space-md">
<span className="material-symbols-outlined text-3xl text-primary">diversity_3</span>
<div>
<div className="font-headline-sm text-headline-sm text-primary font-bold">Yılda 2 Dönem Mezuniyet &amp; Berat Töreni</div>
<div className="font-body-sm text-body-sm text-slate-muted">Ankara HiltonSA veya ODTÜ Mezunları Derneği'nde resmi diplomatik resepsiyon ile üyelik beratı teslimi.</div>
</div>
</div>
</div>
<div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-space-md">
  <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-start gap-space-sm">
    <div className="w-12 h-12 rounded-full bg-surface-ice text-primary flex items-center justify-center shrink-0">
      <span className="material-symbols-outlined text-2xl">verified_user</span>
    </div>
    <div>
      <div className="font-headline-sm text-headline-sm text-primary font-bold">Sicil &amp; Akreditasyon Kurulu</div>
      <div className="font-body-sm text-body-sm text-slate-muted">Mesleki deneyim, referans ve diploma doğrulama incelemesi</div>
    </div>
  </div>
  <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-start gap-space-sm">
    <div className="w-12 h-12 rounded-full bg-surface-ice text-primary flex items-center justify-center shrink-0">
      <span className="material-symbols-outlined text-2xl">gavel</span>
    </div>
    <div>
      <div className="font-headline-sm text-headline-sm text-primary font-bold">Hukuk &amp; Deontoloji Komisyonu</div>
      <div className="font-body-sm text-body-sm text-slate-muted">Ulusal ve uluslararası meslek etiği ilkelerine uyum denetimi</div>
    </div>
  </div>
  <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-start gap-space-sm">
    <div className="w-12 h-12 rounded-full bg-surface-ice text-primary flex items-center justify-center shrink-0">
      <span className="material-symbols-outlined text-2xl">school</span>
    </div>
    <div>
      <div className="font-headline-sm text-headline-sm text-primary font-bold">Akademik Değerlendirme Masası</div>
      <div className="font-body-sm text-body-sm text-slate-muted">İletişim fakülteleri ve lisansüstü çalışmalar koordinasyonu</div>
    </div>
  </div>
  <div className="p-space-md rounded-xl bg-surface-container-lowest shadow-sm flex items-start gap-space-sm">
    <div className="w-12 h-12 rounded-full bg-surface-ice text-primary flex items-center justify-center shrink-0">
      <span className="material-symbols-outlined text-2xl">hub</span>
    </div>
    <div>
      <div className="font-headline-sm text-headline-sm text-primary font-bold">Genç İletişimciler Koordinatörlüğü</div>
      <div className="font-body-sm text-body-sm text-slate-muted">Aday üyelik, mentorluk ve mesleğe hazırlık programları</div>
    </div>
  </div>
</div>
</div>
</div>
</section>
{/*  FREQUENTLY ASKED QUESTIONS (ACCORDION)  */}
<section className="w-full py-space-3xl bg-surface-canvas">
<div className="max-w-4xl mx-auto px-margin-mobile lg:px-margin-desktop">
<div className="text-center max-w-2xl mx-auto mb-space-2xl">
<span className="font-caption-caps text-caption-caps text-secondary font-bold uppercase tracking-widest">SIKÇA SORULAN SORULAR</span>
<h2 className="font-headline-xl text-headline-xl text-primary font-bold mt-1">Üyelik Sürecine Dair Merak Edilenler</h2>
<p className="font-body-sm text-body-sm text-slate-muted mt-space-xs">Resmi tüzük maddelerimiz ve akreditasyon işleyişi hakkında detaylı yanıtlar.</p>
</div>
<div className="space-y-space-sm" id="faq-accordion">
{/*  FAQ 1  */}
<div className="rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden">
<button className="w-full p-space-md text-left flex items-center justify-between gap-space-sm hover:bg-surface-ice/40 transition-colors" onClick={() => toggleFaq(1)} type="button">
<span className="font-headline-sm text-headline-sm text-primary font-bold">Kimler AHİD'e asil üye olabilir?</span>
<span className="material-symbols-outlined text-primary transition-transform" id="faq-icon-1">expand_more</span>
</button>
<div className="hidden px-space-md pb-space-md pt-0 font-body-sm text-body-sm text-slate-muted leading-relaxed" id="faq-answer-1">
            AHİD Tüzüğü md. 4 uyarınca; üniversitelerin lisans programlarından mezun, halkla ilişkiler, kurumsal iletişim, medya ilişkileri, kriz iletişimi veya kamu diplomasisi alanlarında fiilen en az 3 yıl mesleki deneyim kazanmış ve 2 asil üye referansı sunabilen tüm profesyoneller asil üyeliğe başvurabilir.
          </div>
</div>
{/*  FAQ 2  */}
<div className="rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden">
<button className="w-full p-space-md text-left flex items-center justify-between gap-space-sm hover:bg-surface-ice/40 transition-colors" onClick={() => toggleFaq(2)} type="button">
<span className="font-headline-sm text-headline-sm text-primary font-bold">2 asil üye referansım yoksa nasıl başvurabilirim?</span>
<span className="material-symbols-outlined text-primary transition-transform" id="faq-icon-2">expand_more</span>
</button>
<div className="hidden px-space-md pb-space-md pt-0 font-body-sm text-body-sm text-slate-muted leading-relaxed" id="faq-answer-2">
            Ankara dışından başvuran veya sektöre yeni katılmış saygın profesyoneller için “Geçici İnceleme ve Mülakat Mekanizması” uygulanır. Formdaki mülakat seçeneğini işaretlemeniz halinde, Sicil Kurulu üyelerimiz sizinle çevrim içi 15 dakikalık mesleki tanışma görüşmesi gerçekleştirerek dernek içi referans havuzunu işletir.
          </div>
</div>
{/*  FAQ 3  */}
<div className="rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden">
<button className="w-full p-space-md text-left flex items-center justify-between gap-space-sm hover:bg-surface-ice/40 transition-colors" onClick={() => toggleFaq(3)} type="button">
<span className="font-headline-sm text-headline-sm text-primary font-bold">Üyelik başvurum ne kadar sürede sonuçlanır?</span>
<span className="material-symbols-outlined text-primary transition-transform" id="faq-icon-3">expand_more</span>
</button>
<div className="hidden px-space-md pb-space-md pt-0 font-body-sm text-body-sm text-slate-muted leading-relaxed" id="faq-answer-3">
            Başvurunuz alındıktan sonra 3-5 iş günü içerisinde sicil ön tetkiki tamamlanır. Yönetim Kurulu her ayın 1. ve 3. haftası toplanarak dernekler kanunundaki 30 günlük yasal süreden çok daha önce (ortalama 10-14 gün içerisinde) kabul kararını e-posta ve resmi SMS ile sonuçlandırır.
          </div>
</div>
{/*  FAQ 4  */}
<div className="rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden">
<button className="w-full p-space-md text-left flex items-center justify-between gap-space-sm hover:bg-surface-ice/40 transition-colors" onClick={() => toggleFaq(4)} type="button">
<span className="font-headline-sm text-headline-sm text-primary font-bold">Aidat ödemeleri hangi yöntemlerle yapılır ve faturalandırılır mı?</span>
<span className="material-symbols-outlined text-primary transition-transform" id="faq-icon-4">expand_more</span>
</button>
<div className="hidden px-space-md pb-space-md pt-0 font-body-sm text-body-sm text-slate-muted leading-relaxed" id="faq-answer-4">
            Kabul kararı tebliğ edildikten sonra derneğimizin VakıfBank ve Ziraat Bankası resmi dernek hesaplarına havale/EFT ile ya da AHİD Üye Portalı üzerinden 3D Secure kredi kartı ile ödenebilir. Ödemeler dernek alındı belgesi (makbuz) veya kurumsal fatura şeklinde tevsik edilir.
          </div>
</div>
{/*  FAQ 5  */}
<div className="rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden">
<button className="w-full p-space-md text-left flex items-center justify-between gap-space-sm hover:bg-surface-ice/40 transition-colors" onClick={() => toggleFaq(5)} type="button">
<span className="font-headline-sm text-headline-sm text-primary font-bold">AHİD Akreditasyon belgesi uluslararası alanda geçerli midir?</span>
<span className="material-symbols-outlined text-primary transition-transform" id="faq-icon-5">expand_more</span>
</button>
<div className="hidden px-space-md pb-space-md pt-0 font-body-sm text-body-sm text-slate-muted leading-relaxed" id="faq-answer-5">
            Evet; AHİD, Global Alliance for Public Relations and Communication Management ilkeleriyle uyumlu müfredat ve sürekli mesleki gelişim (CPD) kredilendirmesi uygular. Verilen akreditasyon sertifikaları karekodlu ve İngilizce/Türkçe çift dilli olarak doğrulanabilir.
          </div>
</div>
</div>
</div>
</section>
{/*  MEMBERSHIP SUPPORT & CONTACT DIRECTORY CARD  */}
<section className="w-full py-space-2xl bg-surface">
<div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop">
<div className="p-space-xl rounded-2xl bg-primary text-on-primary shadow-xl">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
<div className="lg:col-span-8 space-y-space-sm">
<div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-surface-container-highest/20 font-caption-caps text-caption-caps text-gold-light">
<span className="material-symbols-outlined text-sm">support_agent</span>
<span className="">ÜYELİK İŞLERİ VE SİCİL KURULU DİREKTÖRLÜĞÜ</span>
</div>
<h3 className="font-headline-lg text-headline-lg font-bold text-on-primary">Sorularınız İçin Sicil Masamız Hizmetinizde</h3>
<p className="font-body-md text-body-md text-on-primary-container max-w-2xl leading-relaxed">
              Üyelik şartları, kurumsal delege tanımlama veya fiziki dosya teslimi süreçlerinde Genel Merkez uzmanlarımızla doğrudan temas kurabilirsiniz.
            </p>
<div className="flex flex-wrap items-center gap-space-lg pt-space-xs font-body-sm text-body-sm text-on-primary">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-gold-light">call</span>
<span className="">+90 (312) 231 90 90 (Dahili: 104)</span>
</div>
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-gold-light">mail</span>
<a className="underline hover:text-gold-light" href="mailto:sicil@ahid.org.tr">sicil@ahid.org.tr</a>
</div>
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-gold-light">location_on</span>
<span className="">Tandoğan, Çankaya / Ankara</span>
</div>
</div>
</div>
<div className="lg:col-span-4 bg-surface-container-highest/10 p-space-md rounded-xl text-center space-y-space-xs">
<div className="font-label-md text-label-md text-gold-light font-bold">Fiziki Başvuru &amp; Ziyaret Saatleri</div>
<div className="font-body-sm text-body-sm text-on-primary-container">
              Hafta içi 09:00 - 18:00 saatleri arasında Anıttepe Genel Merkezimizi randevusuz ziyaret ederek basılı form ile de başvurabilirsiniz.
            </div>
<div className="pt-space-xs">
<a className="inline-flex items-center gap-2 px-4 py-2 rounded bg-surface-container-lowest text-primary font-label-md text-label-md hover:bg-surface-ice transition-colors" href="mailto:sicil@ahid.org.tr?subject=Üyelik%20Randevu%20Talebi">
<span className="material-symbols-outlined text-sm">event</span>
<span className="">Ziyaret Randevusu Al</span>
</a>
</div>
</div>
</div>
</div>
</div>
</section>
{/*  Interactive JavaScript for Multi-step Form & FAQ Accordion  */}

</div></main>
      <Footer />
    </>
  );
}
