"use client";

import { useEffect, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

const DRAFT_STORAGE_KEY = "ahid_uyelik_draft";

const COMMITTEE_OPTIONS = [
  "Kamu Diplomasisi ve Şeffaflık",
  "Yapay Zekâ ve Dijital Dönüşüm",
  "Mesleki Etik ve Hukuk Kurulu",
  "Gençlik ve Mentorluk Ağı",
  "Akademik Hakemli Yayınlar",
  "Sürdürülebilirlik & KSS",
];

export default function UyelikPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(1);
  const [selectedTier, setSelectedTier] = useState("asil");
  const [selectedCommittees, setSelectedCommittees] = useState<string[]>([]);
  const [interviewOpt, setInterviewOpt] = useState(false);
  const [consentDeontology, setConsentDeontology] = useState(false);
  const [consentKvkk, setConsentKvkk] = useState(false);
  const [consentTruth, setConsentTruth] = useState(false);
  const [membershipOpen, setMembershipOpen] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [appNo, setAppNo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cvUrl, setCvUrl] = useState<string>("");
  const [cvName, setCvName] = useState<string>("");
  const [uploadingCv, setUploadingCv] = useState(false);
  const [isDraggingCv, setIsDraggingCv] = useState(false);
  const [cvError, setCvError] = useState("");
  const [stepError, setStepError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [draftNotice, setDraftNotice] = useState("");
  const [openFaqs, setOpenFaqs] = useState<{ [key: number]: boolean }>({ 1: true });

  useEffect(() => {
    let active = true;
    fetch("/api/cms?page=uyelik")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { settings?: { membership_open?: boolean } } | null) => {
        if (!active || !data?.settings) return;
        if (typeof data.settings.membership_open === "boolean") {
          setMembershipOpen(data.settings.membership_open);
        }
      })
      .catch(() => {});

    const restoreTimer = window.setTimeout(() => {
      if (!active) return;
      try {
        const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (!raw || !formRef.current) return;
        const draft = JSON.parse(raw) as {
          selectedTier?: string;
          selectedCommittees?: string[];
          cvUrl?: string;
          cvName?: string;
          fields?: Record<string, string>;
          interview_opt?: boolean;
        };
        if (draft.selectedTier) setSelectedTier(draft.selectedTier);
        if (Array.isArray(draft.selectedCommittees)) {
          setSelectedCommittees(draft.selectedCommittees);
        }
        if (draft.cvUrl) setCvUrl(draft.cvUrl);
        if (draft.cvName) setCvName(draft.cvName);
        if (typeof draft.interview_opt === "boolean") {
          setInterviewOpt(draft.interview_opt);
        }
        if (draft.fields) {
          Object.entries(draft.fields).forEach(([name, value]) => {
            const el = formRef.current?.elements.namedItem(name) as
              | HTMLInputElement
              | HTMLSelectElement
              | null;
            if (el && typeof value === "string") {
              el.value = value;
            }
          });
        }
      } catch {
        // Ignore malformed local draft
      }
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(restoreTimer);
    };
  }, []);

  const toggleCommittee = (name: string) => {
    setSelectedCommittees((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  };

  const validateStep = (stepNumber: number): boolean => {
    const panel = document.getElementById(`step-panel-${stepNumber}`);
    if (!panel) return true;
    const requiredFields = panel.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
      "input[required], select[required], textarea[required]"
    );
    for (const field of requiredFields) {
      if (field instanceof HTMLInputElement && field.type === "checkbox") {
        if (!field.checked) {
          setStepError("Devam etmek için zorunlu onay kutularını işaretlemeniz gerekmektedir.");
          field.focus();
          return false;
        }
      } else if (!field.value.trim()) {
        setStepError(`Adım ${stepNumber} içerisindeki zorunlu (*) alanları eksiksiz doldurunuz.`);
        field.focus();
        return false;
      } else if (!field.checkValidity()) {
        setStepError(`Lütfen geçerli bir değer giriniz: ${field.validationMessage}`);
        field.focus();
        return false;
      }
    }
    if (stepNumber === 2 && selectedCommittees.length === 0) {
      setStepError("Lütfen görev almak istediğiniz en az 1 çalışma komisyonu seçiniz.");
      return false;
    }
    return true;
  };

  const goToStep = (targetStep: number) => {
    setStepError("");
    setSubmitError("");
    if (targetStep > step) {
      for (let s = step; s < targetStep; s += 1) {
        if (!validateStep(s)) {
          setStep(s);
          return;
        }
      }
    }
    setStep(targetStep);
  };

  const saveDraft = () => {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    const fields: Record<string, string> = {};
    fd.forEach((value, key) => {
      if (typeof value === "string" && key !== "membership_tier") {
        fields[key] = value;
      }
    });
    try {
      localStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({
          selectedTier,
          selectedCommittees,
          cvUrl,
          cvName,
          interview_opt: interviewOpt,
          fields,
        })
      );
      setDraftNotice("Başvuru taslağınız tarayıcınıza kaydedildi. Sayfayı yenileseniz bile form alanları geri yüklenecektir.");
      setTimeout(() => setDraftNotice(""), 5000);
    } catch {
      setSubmitError("Tarayıcı depolama alanı dolu veya erişilemiyor; taslak kaydedilemedi.");
    }
  };

  const uploadCvFile = async (file: File) => {
    setUploadingCv(true);
    setCvError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/cv", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.success && data.url) {
        setCvUrl(data.url);
        setCvName(file.name);
      } else {
        setCvError(data.error || "Özgeçmiş yüklenemedi. Yalnızca geçerli PDF (maksimum 5MB) dosyaları kabul edilmektedir.");
      }
    } catch {
      setCvError("Dosya yükleme sunucusuna bağlanılamadı. Lütfen tekrar deneyin.");
    } finally {
      setUploadingCv(false);
    }
  };

  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadCvFile(file);
  };

  const handleCvDrop = async (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDraggingCv(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await uploadCvFile(file);
  };

  const selectTierAndScroll = (tier: string) => {
    setSelectedTier(tier);
    setStep(1);
    setStepError("");
    setSubmitError("");
    const formEl = document.getElementById("basvuru-formu");
    if (formEl) formEl.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleFaq = (index: number) => {
    setOpenFaqs((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!membershipOpen) {
      setSubmitError("Yeni üyelik başvuruları yönetim kararıyla geçici olarak durdurulmuştur.");
      return;
    }
    setStepError("");
    setSubmitError("");

    for (let s = 1; s <= 4; s += 1) {
      if (!validateStep(s)) {
        setStep(s);
        return;
      }
    }

    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const fullName = ((formData.get("full_name") as string) || "").trim();
    const nameParts = fullName.split(" ").filter(Boolean);
    const firstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(" ") : fullName || "Aday";
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "Üye";

    const ref1 = [
      ((formData.get("ref1_name") as string) || "").trim(),
      ((formData.get("ref1_title") as string) || "").trim(),
      ((formData.get("ref1_contact") as string) || "").trim(),
    ]
      .filter(Boolean)
      .join(" — ");
    const ref2 = [
      ((formData.get("ref2_name") as string) || "").trim(),
      ((formData.get("ref2_title") as string) || "").trim(),
      ((formData.get("ref2_contact") as string) || "").trim(),
    ]
      .filter(Boolean)
      .join(" — ");
    const references: string[] = [];
    if (ref1) references.push(ref1);
    if (ref2) references.push(ref2);
    if (interviewOpt) references.push("Sicil Kurulu çevrim içi/yüz yüze ön mülakat talebi");

    const payload = {
      tier: selectedTier || (formData.get("membership_tier") as string) || "asil",
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
      committees: selectedCommittees,
      references,
    };

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setSubmitError(data.error || "Başvuru kaydedilemedi. Lütfen girdiğiniz bilgileri kontrol ederek tekrar deneyiniz.");
        return;
      }
      setAppNo(data.application_no || "AHID-BASVURU");
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setSubmitted(true);
    } catch {
      setSubmitError("Başvuru sunucusuna bağlanılırken bir hata oluştu. Lütfen bağlantınızı kontrol edip tekrar deneyin.");
    } finally {
      setSubmitting(false);
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
<Link className="hover:text-primary transition-colors" href="/">ANA SAYFA</Link>
<span className="text-outline-variant font-normal">/</span>
<span className="text-slate-dark">ÜYELİK &amp; AKREDİTASYON</span>
<span className="text-outline-variant font-normal">/</span>
<span className="text-primary font-bold">BAŞVURU PORTALI</span>
</nav>
<div className="inline-flex items-center gap-space-xs px-3 py-1 rounded bg-surface-container-high text-primary font-caption-caps text-caption-caps">
<span className="material-symbols-outlined text-sm text-gold-deep" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
<span>T.C. İÇİŞLERİ BAKANLIĞI KÜTÜK NO: 06-039-142 • KAMUSAL VE KURUMSAL İLETİŞİM PLATFORMU</span>
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
<span className="inline-block w-2 h-2 rounded-full bg-gold-deep"></span>
            2025 - 2026 DÖNEMİ AKREDİTASYON VE ADAYLIK KABULÜ AÇIK
          </div>
<h1 className="font-display-hero text-display-hero text-primary tracking-tight font-extrabold max-w-4xl">
            Başkent İletişim Ağına Katılın, Mesleki Prestijinizi Akredite Edin.
          </h1>
<p className="font-body-lg text-body-lg text-slate-dark max-w-3xl leading-relaxed">
            AHİD üyeliği; Türkiye&apos;nin karar alıcı başkentinde kamu bürokrasisi, akademi ve özel sektörün saygın iletişim liderleriyle aynı masada yer almanızı, mesleki akreditasyon kazanmanızı ve sürekli mesleki gelişim (CPD) ağından ayrıcalıklı olarak faydalanmanızı sağlar.
          </p>
<div className="pt-space-xs flex flex-wrap items-center gap-space-md">
<a className="inline-flex items-center gap-2 px-6 py-3 rounded bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container shadow-md transition-all" href="#basvuru-formu">
<span>Hemen Başvuruyu Başlat</span>
<span className="material-symbols-outlined text-sm">arrow_downward</span>
</a>
<a className="inline-flex items-center gap-2 px-5 py-3 rounded bg-surface-container text-primary font-label-md text-label-md hover:bg-surface-container-high transition-colors" href="#uyelik-tipleri">
<span className="material-symbols-outlined text-sm">tune</span>
<span>Üyelik Tipleri ve Kriterler</span>
</a>
</div>
</div>
<div className="lg:col-span-4 flex flex-col gap-space-md">
{/*  Institutional Accreditation Seal Card  */}
<div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-xl relative overflow-hidden border border-surface-container">
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
<span className="font-caption-caps text-caption-caps text-primary font-bold">SİCİL KURULU ONAYLI</span>
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
<span className="font-headline-lg text-headline-lg font-extrabold text-primary">₺2.400</span>
<span className="font-body-sm text-body-sm text-slate-muted">/ yıl</span>
</div>
<div className="font-caption-caps text-caption-caps text-slate-dark mt-1">Yıllık Asıl Üye Aidatı (Onay Sonrası)</div>
</div>
<div className="mt-space-md space-y-space-sm font-body-sm text-body-sm text-slate-dark">
<div className="flex items-start gap-2">
<span className="material-symbols-outlined text-primary text-base mt-0.5">check_circle</span>
<span>Genel Kurulda seçme ve seçilme tam oy hakkı</span>
</div>
<div className="flex items-start gap-2">
<span className="material-symbols-outlined text-primary text-base mt-0.5">check_circle</span>
<span>İhtisas komisyonlarında başkanlık ve yürütme</span>
</div>
<div className="flex items-start gap-2">
<span className="material-symbols-outlined text-primary text-base mt-0.5">check_circle</span>
<span>Etkinlik ve zirve kayıtlarında üye kontenjanı</span>
</div>
<div className="flex items-start gap-2">
<span className="material-symbols-outlined text-primary text-base mt-0.5">check_circle</span>
<span>QR Doğrulamalı Dijital Üye Kimlik Kartı</span>
</div>
</div>
</div>
<div className="mt-space-lg pt-space-md">
<button className="inline-flex items-center justify-center gap-2 bg-[#0b3d91] hover:bg-[#082b66] text-white font-semibold px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 active:scale-95 w-full" onClick={() => selectTierAndScroll("asil")}>
<span>Asil Üyelik İçin Başvur</span>
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
<span>Hakemli İletişim Raporları yayın ve bilim kurulu</span>
</div>
<div className="flex items-start gap-2">
<span className="material-symbols-outlined text-secondary text-base mt-0.5">check_circle</span>
<span>Yıllık İletişim Kongrelerinde oturum başkanlığı</span>
</div>
<div className="flex items-start gap-2">
<span className="material-symbols-outlined text-secondary text-base mt-0.5">check_circle</span>
<span>Sektör-Akademi ortak araştırma fonlarına erişim</span>
</div>
<div className="flex items-start gap-2">
<span className="material-symbols-outlined text-secondary text-base mt-0.5">check_circle</span>
<span>Genel Kurul danışma delegasyonu üyeliği</span>
</div>
</div>
</div>
<div className="mt-space-lg pt-space-md">
<button className="w-full py-2.5 px-4 rounded bg-surface-container text-primary hover:bg-surface-container-high font-label-md text-label-md transition-colors flex items-center justify-center gap-2" onClick={() => selectTierAndScroll("akademik")}>
<span>Akademik Üyelik Seç</span>
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
<span className="font-headline-lg text-headline-lg font-extrabold text-primary">₺8.500</span>
<span className="font-body-sm text-body-sm text-slate-muted">/ yıl</span>
</div>
<div className="font-caption-caps text-caption-caps text-slate-dark mt-1">Kurumsal / Onursal Temsil</div>
</div>
<div className="mt-space-md space-y-space-sm font-body-sm text-body-sm text-slate-dark">
<div className="flex items-start gap-2">
<span className="material-symbols-outlined text-gold-deep text-base mt-0.5">check_circle</span>
<span>Kurumsal çalışma gruplarında temsil hakkı</span>
</div>
<div className="flex items-start gap-2">
<span className="material-symbols-outlined text-gold-deep text-base mt-0.5">check_circle</span>
<span>İletişim Başarı Ödülleri&apos;nde öncelikli kategori hakkı</span>
</div>
<div className="flex items-start gap-2">
<span className="material-symbols-outlined text-gold-deep text-base mt-0.5">check_circle</span>
<span>AHİD etkinliklerinde kurumsal protokol daveti</span>
</div>
<div className="flex items-start gap-2">
<span className="material-symbols-outlined text-gold-deep text-base mt-0.5">check_circle</span>
<span>Yayın ve çalıştay raporlarına tam erişim</span>
</div>
</div>
</div>
<div className="mt-space-lg pt-space-md">
<button className="w-full py-2.5 px-4 rounded bg-surface-container text-primary hover:bg-surface-container-high font-label-md text-label-md transition-colors flex items-center justify-center gap-2" onClick={() => selectTierAndScroll("onursal")}>
<span>Kurumsal Başvuru Yap</span>
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
<span className="font-headline-lg text-headline-lg font-extrabold text-primary">₺600</span>
<span className="font-body-sm text-body-sm text-slate-muted">/ yıl</span>
</div>
<div className="font-caption-caps text-caption-caps text-slate-dark mt-1">Genç Profesyonel / Aday Katkısı</div>
</div>
<div className="mt-space-md space-y-space-sm font-body-sm text-body-sm text-slate-dark">
<div className="flex items-start gap-2">
<span className="material-symbols-outlined text-primary text-base mt-0.5">check_circle</span>
<span>İletişim profesyonelleriyle deneyim söyleşileri</span>
</div>
<div className="flex items-start gap-2">
<span className="material-symbols-outlined text-primary text-base mt-0.5">check_circle</span>
<span>Üye özel bilgi bankası ve yayın arşivi erişimi</span>
</div>
<div className="flex items-start gap-2">
<span className="material-symbols-outlined text-primary text-base mt-0.5">check_circle</span>
<span>Atölye ve seminerlerde öncelikli kontenjan</span>
</div>
<div className="flex items-start gap-2">
<span className="material-symbols-outlined text-primary text-base mt-0.5">check_circle</span>
<span>Genç AHİD Çalışma Grubu komite katılımı</span>
</div>
</div>
</div>
<div className="mt-space-lg pt-space-md">
<button className="inline-flex items-center justify-center gap-2 bg-[#0b3d91] hover:bg-[#082b66] text-white font-semibold px-4 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 active:scale-95 w-full" onClick={() => selectTierAndScroll("genc")}>
<span>Aday Üyelik Başlat</span>
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
<span>SÜRE: ORTALAMA 10 DAKİKA</span>
</div>
</div>
{/*  Step 2  */}
<div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
<div>
<div className="w-10 h-10 rounded-full bg-primary-container text-on-primary font-headline-sm text-headline-sm font-bold flex items-center justify-center mb-space-md">2</div>
<h4 className="font-headline-sm text-headline-sm text-primary font-bold mb-space-xs">Sicil &amp; Referans Tetkiki</h4>
<p className="font-body-sm text-body-sm text-slate-muted leading-relaxed">
              Belirttiğiniz 2 asil üye referansı ile teyit sağlanır; mesleki etik ve deontoloji sicil uygunluğu Sicil Kurulu&apos;nca taranır.
            </p>
</div>
<div className="pt-space-md mt-space-md border-t-0 text-caption-caps font-caption-caps text-slate-dark font-bold flex items-center gap-1">
<span className="material-symbols-outlined text-sm">assignment_turned_in</span>
<span>SÜRE: 3 - 5 İŞ GÜNÜ</span>
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
<span>SÜRE: EN GEÇ 30 GÜN (TÜZÜK MD. 4)</span>
</div>
</div>
{/*  Step 4  */}
<div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between">
<div>
<div className="w-10 h-10 rounded-full bg-gold-deep text-on-primary font-headline-sm text-headline-sm font-bold flex items-center justify-center mb-space-md">4</div>
<h4 className="font-headline-sm text-headline-sm text-primary font-bold mb-space-xs">Akreditasyon &amp; Üye Kartı</h4>
<p className="font-body-sm text-body-sm text-slate-muted leading-relaxed">
              Kabul tebligatınız ve geçici portal giriş bilgileriniz e-posta veya yönetici bilgilendirmesi ile iletilir. Üye No&apos;nuz oluşturulur ve QR kodlu dijital AHİD üye kimliğiniz aktif olur.
            </p>
</div>
<div className="pt-space-md mt-space-md border-t-0 text-caption-caps font-caption-caps text-gold-deep font-bold flex items-center gap-1">
<span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>military_tech</span>
<span>RESMİ AKREDİTASYON TESCİLİ</span>
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
</div>
{/*  Step Indicators Bar  */}
<div className="grid grid-cols-2 md:grid-cols-4 gap-space-sm mt-space-xl pt-space-md">
{[
  { num: 1, label: "1. Üyelik & Kimlik" },
  { num: 2, label: "2. Meslek & Kurum" },
  { num: 3, label: "3. Referans & Dosya" },
  { num: 4, label: "4. Etik & Onay" },
].map((item) => {
  const isActive = step === item.num;
  const isDone = step > item.num;
  return (
    <button
      key={item.num}
      className={`flex items-center gap-space-xs text-left p-2 rounded transition-all cursor-pointer ${
        isActive
          ? "bg-surface-container-highest/25 opacity-100"
          : isDone
          ? "bg-surface-container-highest/15 opacity-95 hover:opacity-100"
          : "opacity-70 hover:opacity-100"
      }`}
      id={`step-btn-${item.num}`}
      onClick={() => goToStep(item.num)}
      type="button"
    >
      <span
        className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
          isActive || isDone
            ? "bg-gold-light text-primary"
            : "bg-surface-container-highest/30 text-on-primary"
        }`}
      >
        {isDone ? "✓" : item.num}
      </span>
      <span className="font-label-sm text-label-sm text-on-primary truncate">{item.label}</span>
    </button>
  );
})}
</div>
</div>
{/*  Form Body Container  */}
<form ref={formRef} className="p-space-lg md:p-space-xl space-y-space-xl" id="membershipForm" noValidate onSubmit={handleFormSubmit}>
{stepError && (
<div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-medium flex items-center gap-2">
<span className="material-symbols-outlined text-base shrink-0">error</span>
<span>{stepError}</span>
</div>
)}
{submitError && (
<div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-medium flex items-center gap-2">
<span className="material-symbols-outlined text-base shrink-0">warning</span>
<span>{submitError}</span>
</div>
)}
{!membershipOpen && (
<div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-sm font-semibold flex items-center gap-2">
<span className="material-symbols-outlined text-base shrink-0">block</span>
<span>Yeni üyelik başvuruları Yönetim Kurulu kararıyla geçici olarak durdurulmuştur. Mevcut üyelikleriniz için Üye Portalı&apos;nı kullanabilirsiniz.</span>
</div>
)}
{draftNotice && (
<div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-2">
<span className="material-symbols-outlined text-base shrink-0">bookmark_added</span>
<span>{draftNotice}</span>
</div>
)}
{/*  STEP 1: Membership Type & Personal Details  */}
<div className="step-panel space-y-space-lg" id="step-panel-1" style={{ display: step === 1 && !submitted ? "block" : "none" }}>
<div>
<h4 className="font-headline-sm text-headline-sm text-primary font-bold">Adım 1: Üyelik Tipi ve Kimlik Bilgileri</h4>
<p className="font-body-sm text-body-sm text-slate-muted">Başvurmak istediğiniz kategoriyi belirleyin ve T.C. İçişleri Bakanlığı Dernekler Kanunu zorunlu kimlik alanlarını doldurun.</p>
</div>
{/*  Radio Tier Selector Cards  */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-sm pt-space-xs">
<label className={`relative flex flex-col p-space-md rounded-lg cursor-pointer hover:bg-surface-ice transition-all ${selectedTier === "asil" ? "bg-surface-ice ring-2 ring-primary/40" : "bg-surface-container-low"}`}>
<input checked={selectedTier === "asil"} onChange={() => setSelectedTier("asil")} className="peer sr-only" name="membership_tier" type="radio" value="asil" />
<div className="flex items-center justify-between mb-2">
<span className="font-label-md text-label-md font-bold text-primary">Asil Üyelik</span>
<span className="material-symbols-outlined text-primary text-base">check_circle</span>
</div>
<span className="font-caption-caps text-caption-caps text-slate-muted">En az 3 yıl sektör deneyimi</span>
<span className="font-label-sm text-label-sm text-primary font-bold mt-2">₺2.400 / yıl</span>
<div className="absolute inset-0 rounded-lg pointer-events-none peer-checked:bg-primary/5"></div>
</label>
<label className={`relative flex flex-col p-space-md rounded-lg cursor-pointer hover:bg-surface-ice transition-all ${selectedTier === "akademik" ? "bg-surface-ice ring-2 ring-secondary/40" : "bg-surface-container-low"}`}>
<input checked={selectedTier === "akademik"} onChange={() => setSelectedTier("akademik")} className="peer sr-only" name="membership_tier" type="radio" value="akademik" />
<div className="flex items-center justify-between mb-2">
<span className="font-label-md text-label-md font-bold text-primary">Akademik</span>
<span className="material-symbols-outlined text-secondary text-base">school</span>
</div>
<span className="font-caption-caps text-caption-caps text-slate-muted">Öğretim üyesi &amp; araştırmacı</span>
<span className="font-label-sm text-label-sm text-secondary font-bold mt-2">₺2.400 / yıl</span>
<div className="absolute inset-0 rounded-lg pointer-events-none peer-checked:bg-primary/5"></div>
</label>
<label className={`relative flex flex-col p-space-md rounded-lg cursor-pointer hover:bg-surface-ice transition-all ${selectedTier === "onursal" ? "bg-surface-ice ring-2 ring-gold-deep/40" : "bg-surface-container-low"}`}>
<input checked={selectedTier === "onursal"} onChange={() => setSelectedTier("onursal")} className="peer sr-only" name="membership_tier" type="radio" value="onursal" />
<div className="flex items-center justify-between mb-2">
<span className="font-label-md text-label-md font-bold text-primary">Kurumsal / Onursal</span>
<span className="material-symbols-outlined text-gold-deep text-base">corporate_fare</span>
</div>
<span className="font-caption-caps text-caption-caps text-slate-muted">Ajans ve kurum temsilciliği</span>
<span className="font-label-sm text-label-sm text-gold-deep font-bold mt-2">₺8.500 / yıl</span>
<div className="absolute inset-0 rounded-lg pointer-events-none peer-checked:bg-primary/5"></div>
</label>
<label className={`relative flex flex-col p-space-md rounded-lg cursor-pointer hover:bg-surface-ice transition-all ${selectedTier === "genc" ? "bg-surface-ice ring-2 ring-primary/40" : "bg-surface-container-low"}`}>
<input checked={selectedTier === "genc"} onChange={() => setSelectedTier("genc")} className="peer sr-only" name="membership_tier" type="radio" value="genc" />
<div className="flex items-center justify-between mb-2">
<span className="font-label-md text-label-md font-bold text-primary">Genç İletişimci</span>
<span className="material-symbols-outlined text-slate-muted text-base">psychology</span>
</div>
<span className="font-caption-caps text-caption-caps text-slate-muted">Son sınıf veya 0-2 yıl yeni mezun</span>
<span className="font-label-sm text-label-sm text-slate-dark font-bold mt-2">₺600 / yıl</span>
<div className="absolute inset-0 rounded-lg pointer-events-none peer-checked:bg-primary/5"></div>
</label>
</div>
{/*  Identity Inputs Grid  */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-space-md pt-space-xs">
<div>
<label className="block font-label-sm text-label-sm text-slate-dark mb-1">Ad Soyad *</label>
<input className="w-full px-4 py-2.5 rounded bg-surface-container-lowest text-on-surface font-body-md text-body-md shadow-sm outline-none focus:bg-surface-ice transition-all" name="full_name" placeholder="Adınız ve Soyadınız" required type="text" />
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
<label className="block font-label-sm text-label-sm text-slate-dark mb-1">Cep Telefonu (Güncel İletişim İçin) *</label>
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
<button className="px-6 py-2.5 rounded bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-all flex items-center gap-2 cursor-pointer" onClick={() => goToStep(2)} type="button">
<span>Devam Et: Mesleki Bilgiler</span>
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
<input className="w-full px-4 py-2.5 rounded bg-surface-container-lowest text-on-surface font-body-md text-body-md shadow-sm outline-none focus:bg-surface-ice transition-all" name="organization" placeholder="Görev Yaptığınız Kurum veya Kuruluş" required type="text" />
</div>
<div>
<label className="block font-label-sm text-label-sm text-slate-dark mb-1">Mevcut Görev / Unvan *</label>
<input className="w-full px-4 py-2.5 rounded bg-surface-container-lowest text-on-surface font-body-md text-body-md shadow-sm outline-none focus:bg-surface-ice transition-all" name="position" placeholder="Mevcut Görev veya Unvanınız" required type="text" />
</div>
<div>
<label className="block font-label-sm text-label-sm text-slate-dark mb-1">Mezun Olunan Üniversite &amp; Fakülte *</label>
<input className="w-full px-4 py-2.5 rounded bg-surface-container-lowest text-on-surface font-body-md text-body-md shadow-sm outline-none focus:bg-surface-ice transition-all" name="university" placeholder="Mezun Olduğunuz Üniversite ve Bölüm" required type="text" />
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
{COMMITTEE_OPTIONS.map((comm) => {
  const active = selectedCommittees.includes(comm);
  return (
    <label
      key={comm}
      className={`flex items-center gap-2 p-2.5 rounded cursor-pointer transition-colors ${
        active
          ? "bg-surface-ice ring-1 ring-primary/30"
          : "bg-surface-container-low hover:bg-surface-ice"
      }`}
    >
      <input
        checked={active}
        onChange={() => toggleCommittee(comm)}
        className="w-4 h-4 rounded text-primary"
        type="checkbox"
      />
      <span className="font-body-sm text-body-sm text-slate-dark">{comm}</span>
    </label>
  );
})}
</div>
</div>
<div className="flex justify-between pt-space-md">
<button className="px-5 py-2.5 rounded bg-surface-container text-slate-dark font-label-md text-label-md hover:bg-surface-container-high transition-colors cursor-pointer" onClick={() => goToStep(1)} type="button">
                ← Geri: Kimlik Bilgileri
              </button>
<button className="px-6 py-2.5 rounded bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-all flex items-center gap-2 cursor-pointer" onClick={() => goToStep(3)} type="button">
<span>Devam Et: Referanslar &amp; Belgeler</span>
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
<span>1. Referans Asil Üye *</span>
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
<span>2. Referans Asil Üye (veya Kurum Amiri) *</span>
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
<input
  checked={interviewOpt}
  onChange={(e) => setInterviewOpt(e.target.checked)}
  className="w-4 h-4 rounded text-primary mt-1"
  id="interview_opt"
  type="checkbox"
/>
<label className="font-body-sm text-body-sm text-slate-dark" htmlFor="interview_opt">
<strong>Ankara dışında görev yapıyorum veya 2 asil üye referansım henüz bulunmuyor:</strong> Sicil Kurulu ile çevrim içi/fiziki 15 dakikalık mülakat yapılmasını ve geçici referans komisyonuna aktarılmamı talep ediyorum.
              </label>
</div>
{/*  File Upload Dropzone  */}
<div>
<label className="block font-label-sm text-label-sm text-slate-dark mb-1 font-bold">Özgeçmiş (CV) Yükleme (PDF)</label>
<label
  onDragOver={(e) => {
    e.preventDefault();
    setIsDraggingCv(true);
  }}
  onDragLeave={() => setIsDraggingCv(false)}
  onDrop={handleCvDrop}
  className={`p-space-xl rounded-xl text-center transition-colors cursor-pointer flex flex-col items-center justify-center border-2 border-dashed ${
    isDraggingCv
      ? "bg-surface-ice border-primary"
      : "bg-surface-container-low border-slate-200 hover:bg-surface-ice"
  }`}
>
<div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-primary mb-space-sm">
<span className="material-symbols-outlined text-2xl">cloud_upload</span>
</div>
<div className="font-label-md text-label-md text-primary font-bold">
  {uploadingCv ? "Supabase Storage&apos;a Yükleniyor..." : "PDF Dosyasını Buraya Sürükleyip Bırakın veya Seçin"}
</div>
<div className="font-body-sm text-body-sm text-slate-muted mt-1">Güvenlik doğrulamalı PDF formatında (Maksimum 5MB)</div>
<input type="file" onChange={handleCvUpload} accept=".pdf,application/pdf" className="mt-3 text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-container" />
{cvName && (
  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
    <span className="material-symbols-outlined text-sm">check_circle</span>
    <span>{cvName} — SUPABASE STORAGE&apos;A YÜKLENDİ</span>
  </div>
)}
{cvError && (
  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-50 text-red-700 border border-red-200 text-xs font-semibold">
    <span className="material-symbols-outlined text-sm">error</span>
    <span>{cvError}</span>
  </div>
)}
</label>
</div>
<div className="flex justify-between pt-space-md">
<button className="px-5 py-2.5 rounded bg-surface-container text-slate-dark font-label-md text-label-md hover:bg-surface-container-high transition-colors cursor-pointer" onClick={() => goToStep(2)} type="button">
                ← Geri: Mesleki Bilgiler
              </button>
<button className="px-6 py-2.5 rounded bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-all flex items-center gap-2 cursor-pointer" onClick={() => goToStep(4)} type="button">
<span>Devam Et: Etik &amp; Taahhütname</span>
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
<p>1. <strong>Doğruluk ve Şeffaflık:</strong> Kamuoyuna yanıltıcı, manipülatif ve teyitsiz bilgi aktarımından kaçınmayı, hakikatin yanında yer almayı ilke edinirim.</p>
<p>2. <strong>Kamusal Sorumluluk:</strong> Temsil ettiğim kamu, özel veya sivil toplum kurumlarının faaliyetlerinde toplum yararını gözetmeyi mesleki öncelik kabul ederim.</p>
<p>3. <strong>Fikri Mülkiyet ve Liyakat:</strong> Meslektaşlarımın eser ve projelerine saygı duyar, haksız rekabet oluşturacak dezenformasyon ve etik dışı lobicilik faaliyetlerinde bulunmam.</p>
<p>4. <strong>Dernek Tüzüğüne Bağlılık:</strong> Ankara Halkla İlişkiler Derneği tüzüğü, Genel Kurul ve Yönetim Kurulu kararlarına uygun hareket edeceğimi peşinen kabul ve taahhüt ederim.</p>
</div>
{/*  Legal Consents Checkboxes  */}
<div className="space-y-space-sm pt-space-xs">
<label className="flex items-start gap-3 p-3 rounded-lg bg-surface-container-lowest shadow-sm cursor-pointer hover:bg-surface-ice">
<input checked={consentDeontology} onChange={(e) => setConsentDeontology(e.target.checked)} className="w-4 h-4 rounded text-primary mt-1" required type="checkbox" />
<span className="font-body-sm text-body-sm text-slate-dark">
<strong>Mesleki Deontoloji Taahhüdü:</strong> AHİD Tüzüğü, Meslek Etiği İlkeleri ve Yönetmelik hükümlerine uymayı, aksi durumda Etik Kurulu yaptırımlarını kabul ettiğimi beyan ederim.
                </span>
</label>
<label className="flex items-start gap-3 p-3 rounded-lg bg-surface-container-lowest shadow-sm cursor-pointer hover:bg-surface-ice">
<input checked={consentKvkk} onChange={(e) => setConsentKvkk(e.target.checked)} className="w-4 h-4 rounded text-primary mt-1" required type="checkbox" />
<span className="font-body-sm text-body-sm text-slate-dark">
<strong>KVKK ve İletişim İzni:</strong> 6698 sayılı Kişisel Verilerin Korunması Kanunu uyarınca verilerimin dernek sicil kütüğünde işlenmesini ve resmi bilgilendirme bültenlerinin iletilmesini onaylıyorum.
                </span>
</label>
<label className="flex items-start gap-3 p-3 rounded-lg bg-surface-container-lowest shadow-sm cursor-pointer hover:bg-surface-ice">
<input checked={consentTruth} onChange={(e) => setConsentTruth(e.target.checked)} className="w-4 h-4 rounded text-primary mt-1" required type="checkbox" />
<span className="font-body-sm text-body-sm text-slate-dark">
                  Verdiğim tüm bilgi ve belgelerin gerçeğe uygun olduğunu, gerçeğe aykırı beyan durumunda üyeliğimin iptal edileceğini teyit ederim.
                </span>
</label>
</div>
{/*  Action Buttons Group  */}
<div className="flex flex-col sm:flex-row items-center justify-between gap-space-md pt-space-md">
<button className="w-full sm:w-auto px-5 py-2.5 rounded bg-surface-container text-slate-dark font-label-md text-label-md hover:bg-surface-container-high transition-colors cursor-pointer" onClick={() => goToStep(3)} type="button">
                ← Geri: Referanslar
              </button>
<div className="flex items-center gap-space-sm w-full sm:w-auto">
<button className="w-full sm:w-auto px-4 py-2.5 rounded bg-surface-container text-primary font-label-md text-label-md hover:bg-surface-container-high transition-colors cursor-pointer" onClick={saveDraft} type="button">
                  Taslağı Kaydet
                </button>
<button disabled={submitting || !membershipOpen} className="inline-flex items-center justify-center gap-2 bg-[#0b3d91] hover:bg-[#082b66] disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 cursor-pointer" type="submit">
<span className="material-symbols-outlined text-base">verified</span>
<span>{submitting ? "Başvuru Gönderiliyor..." : "Başvuruyu Tamamla ve Gönder"}</span>
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
              Başvuru Takip Kodunuz: <strong className="text-primary font-mono font-bold">{appNo}</strong>. Başvuru dosyanız Sicil Kurulu&apos;na sevk edilmiştir. Değerlendirme sonucu e-posta ile tarafınıza bildirilecektir.
            </p>
<div className="pt-space-sm">
<button className="px-6 py-2.5 rounded bg-primary text-on-primary font-label-md text-label-md cursor-pointer" onClick={() => { formRef.current?.reset(); setCvUrl(""); setCvName(""); setSelectedTier("asil"); setSelectedCommittees([]); setInterviewOpt(false); setConsentDeontology(false); setConsentKvkk(false); setConsentTruth(false); setStepError(""); setSubmitError(""); setSubmitted(false); setStep(1); }} type="button">
                Yeni Başvuru / Formu Temizle
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
            AHİD Sicil ve Akreditasyon Kurulu; Türkiye&apos;nin en köklü iletişim fakültelerinden profesörler, kıdemli kamu sözcüleri ve uluslararası halkla ilişkiler ajansı liderlerinden oluşur. Derneğimize üye olan her iletişimci, bağımsız bir liyakat filtresinden geçer.
          </p>
<div className="p-space-md rounded-xl bg-surface-ice flex items-center gap-space-md">
<span className="material-symbols-outlined text-3xl text-primary">diversity_3</span>
<div>
<div className="font-headline-sm text-headline-sm text-primary font-bold">Yılda 2 Dönem Mezuniyet &amp; Berat Töreni</div>
<div className="font-body-sm text-body-sm text-slate-muted">AHİD Genel Merkezinde düzenlenen resmi takdim töreni ile üyelik beratı teslimi.</div>
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
{[
  {
    id: 1,
    question: "Kimler AHİD\u2019e asil üye olabilir?",
    answer:
      "AHİD Tüzüğü md. 4 uyarınca; üniversitelerin lisans programlarından mezun, halkla ilişkiler, kurumsal iletişim, medya ilişkileri, kriz iletişimi veya kamu diplomasisi alanlarında fiilen en az 3 yıl mesleki deneyim kazanmış ve 2 asil üye referansı sunabilen tüm profesyoneller asil üyeliğe başvurabilir.",
  },
  {
    id: 2,
    question: "2 asil üye referansım yoksa nasıl başvurabilirim?",
    answer:
      "Ankara dışından başvuran veya sektöre yeni katılmış saygın profesyoneller için \u201cGeçici İnceleme ve Mülakat Mekanizması\u201d uygulanır. Formdaki mülakat seçeneğini işaretlemeniz halinde, Sicil Kurulu üyelerimiz sizinle çevrim içi 15 dakikalık mesleki tanışma görüşmesi gerçekleştirerek dernek içi referans havuzunu işletir.",
  },
  {
    id: 3,
    question: "Üyelik başvurum ne kadar sürede sonuçlanır?",
    answer:
      "Başvurunuz alındıktan sonra 3-5 iş günü içerisinde sicil ön tetkiki tamamlanır. Yönetim Kurulu her ayın 1. ve 3. haftası toplanarak dernekler kanunundaki 30 günlük yasal süreden çok daha önce kabul kararını kayıtlı e-posta adresiniz üzerinden tarafınıza iletir.",
  },
  {
    id: 4,
    question: "Aidat ödemeleri hangi yöntemlerle yapılır ve belgelendirilir?",
    answer:
      "Kabul kararı onaylandıktan sonra oluşturulan üye hesabınız üzerinden aidat dönemlerinizi görüntüleyebilir, derneğimizin resmi banka hesaplarına havale/EFT yoluyla ödeme yapıp Üye Portalı üzerinden dekont referans numaranızı Saymanlık onayına iletebilirsiniz.",
  },
  {
    id: 5,
    question: "Dijital Üye Kimlik Kartı nasıl doğrulanır?",
    answer:
      "Onaylanan her AHİD üyesi için benzersiz üye numarası ve doğrulama karekodu (QR) üretilir. Kart üzerindeki karekod okutularak üyelik aktifliği resmi portal üzerinden anlık olarak doğrulanabilir.",
  },
].map((faq) => {
  const isOpen = Boolean(openFaqs[faq.id]);
  return (
    <div key={faq.id} className="rounded-xl bg-surface-container-lowest shadow-sm overflow-hidden">
      <button
        aria-controls={`faq-answer-${faq.id}`}
        aria-expanded={isOpen}
        className="w-full p-space-md text-left flex items-center justify-between gap-space-sm hover:bg-surface-ice/40 transition-colors cursor-pointer"
        onClick={() => toggleFaq(faq.id)}
        type="button"
      >
        <span className="font-headline-sm text-headline-sm text-primary font-bold">{faq.question}</span>
        <span
          className={`material-symbols-outlined text-primary transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          id={`faq-icon-${faq.id}`}
        >
          expand_more
        </span>
      </button>
      <div
        className={`${isOpen ? "block" : "hidden"} px-space-md pb-space-md pt-0 font-body-sm text-body-sm text-slate-muted leading-relaxed`}
        id={`faq-answer-${faq.id}`}
      >
        {faq.answer}
      </div>
    </div>
  );
})}
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
<span>ÜYELİK İŞLERİ VE SİCİL KURULU DİREKTÖRLÜĞÜ</span>
</div>
<h3 className="font-headline-lg text-headline-lg font-bold text-on-primary">Sorularınız İçin Sicil Masamız Hizmetinizde</h3>
<p className="font-body-md text-body-md text-on-primary-container max-w-2xl leading-relaxed">
              Üyelik şartları, kurumsal delege tanımlama veya fiziki dosya teslimi süreçlerinde Genel Merkez uzmanlarımızla doğrudan temas kurabilirsiniz.
            </p>
<div className="flex flex-wrap items-center gap-space-lg pt-space-xs font-body-sm text-body-sm text-on-primary">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-gold-light">call</span>
<span>+90 (312) 231 90 90 (Dahili: 104)</span>
</div>
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-gold-light">mail</span>
<a className="underline hover:text-gold-light" href="mailto:sicil@ahid.org.tr">sicil@ahid.org.tr</a>
</div>
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-gold-light">location_on</span>
<span>Tandoğan, Çankaya / Ankara</span>
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
<span>Ziyaret Randevusu Al</span>
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
