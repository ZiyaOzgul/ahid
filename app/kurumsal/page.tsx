"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function KurumsalPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/board").then((res) => res.json()),
      fetch("/api/documents").then((res) => res.json()),
    ])
      .then(([boardData, docsData]) => {
        if (boardData?.success && boardData.members) {
          setMembers(boardData.members);
        }
        if (docsData?.success && docsData.documents) {
          setDocuments(docsData.documents);
        }
      })
      .catch((err) => console.error("Error loading kurumsal data:", err))
      .finally(() => setLoading(false));
  }, []);

  const isYonetim = (c: string) => c === "yonetim" || c === "yonetim_kurulu";
  const president = members.find((m) => isYonetim(m.category) && m.order_no === 1);
  const executiveMembers = members.filter((m) => isYonetim(m.category) && (!president || m.id !== president.id) && m.order_no !== 1);
  const supervisoryMembers = members.filter((m) => m.category === "denetim" || m.category === "denetim_kurulu" || m.category === "danisma_kurulu");
  const honoraryMembers = members.filter((m) => m.category === "gecmis_baskan" || m.category === "onur_kurulu");

  return (
    <>
      <Navbar />
      <main className="w-full pt-[7.5rem] bg-surface min-h-[calc(100vh-28rem)]"><div className="flex flex-col w-full">
{/*  SECTION 1: Page Header & Sub-Nav Hero (Bleed & Frosted Depth)  */}
<section className="relative w-full bg-primary text-on-primary overflow-hidden">
{/*  Atmospheric vector glow overlay  */}
<div className="absolute inset-0 pointer-events-none opacity-25">
<div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-secondary-container blur-3xl"></div>
<div className="absolute bottom-0 left-1/4 w-[36rem] h-64 rounded-full bg-primary-container blur-2xl"></div>
</div>
<div className="relative max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop py-space-xl lg:py-space-2xl">
{/*  Institutional Breadcrumb  */}
<nav aria-label="Breadcrumb" className="flex items-center gap-2 font-caption-caps text-caption-caps tracking-widest uppercase text-inverse-primary/80 mb-space-md">
<a className="hover:text-gold-light transition-colors" href="#">Ana Sayfa</a>
<span className="material-symbols-outlined text-xs">chevron_right</span>
<a className="hover:text-gold-light transition-colors" href="#">Kurumsal</a>
<span className="material-symbols-outlined text-xs">chevron_right</span>
<span className="text-gold-light">Yönetim &amp; Organizasyon</span>
</nav>
{/*  Editorial Headline Grid  */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-end">
<div className="lg:col-span-8 flex flex-col gap-space-sm">
<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-lowest/10 backdrop-blur-md w-fit">
<span className="w-2 h-2 rounded-full bg-gold-light animate-pulse"></span>
<span className="font-caption-caps text-caption-caps tracking-wider uppercase text-gold-light">T.C. Ankara Valiliği Dernekler Masası Kütük No: 06-039-142</span>
</div>
<h1 className="font-headline-xl text-headline-xl lg:text-display-hero text-on-primary font-bold tracking-tight leading-tight">
            34 Yıllık Kurumsal Hafıza ile <br className="hidden sm:inline" />
<span className="text-gold-light">İletişim Mesleğinin</span> Öncü Gücü
          </h1>
<p className="font-body-lg text-body-lg text-surface-container-high/90 max-w-3xl leading-relaxed mt-space-xs">
            1990'dan günümüze başkent Ankara'da kamu diplomasisi, akademi ve kurumsal iletişim sektör standartlarını yükselten, etik ve saygın mesleki birlik.
          </p>
</div>
{/*  Metric Pillar Badge  */}
<div className="lg:col-span-4 flex lg:justify-end">
<div className="bg-surface-container-lowest/10 backdrop-blur-md p-space-md rounded-xl w-full sm:w-auto min-w-[260px] shadow-lg">
<div className="flex items-center justify-between pb-3">
<span className="font-label-sm text-label-sm text-inverse-primary uppercase tracking-wider">Çalışma Dönemi</span>
<span className="font-caption-caps text-caption-caps bg-gold-light/20 text-gold-light px-2 py-0.5 rounded">Aktif Kurul</span>
</div>
<div className="font-headline-lg text-headline-lg font-bold text-on-primary">2024 — 2026</div>
<p className="font-body-sm text-body-sm text-surface-container-high/80 mt-1">18. Olağan Seçimli Genel Kurul Kararı</p>
<div className="mt-3 pt-3 flex items-center justify-between text-caption-caps font-caption-caps text-inverse-primary/90">
<span className="">Toplam Kurul Üyesi: <strong>{members.length} Uzman</strong></span>
<span className="">Ankara / Çankaya</span>
</div>
</div>
</div>
</div>
{/*  Quick Anchor Pills Sub-Navigation  */}
<div className="mt-space-xl pt-space-md flex flex-wrap gap-2">
<a className="px-4 py-2 rounded-full font-label-sm text-label-sm bg-surface-container-lowest/10 hover:bg-gold-light hover:text-primary transition-all text-on-primary flex items-center gap-1.5" href="#tarihce">
<span className="material-symbols-outlined text-base">history_edu</span>
          Hakkımızda &amp; Tarihçe
        </a>
<a className="px-4 py-2 rounded-full font-label-sm text-label-sm bg-surface-container-lowest/10 hover:bg-gold-light hover:text-primary transition-all text-on-primary flex items-center gap-1.5" href="#misyon-vizyon">
<span className="material-symbols-outlined text-base">flag</span>
          Misyon &amp; Değerler
        </a>
<a className="px-4 py-2 rounded-full font-label-sm text-label-sm bg-gold-light text-primary font-bold shadow-md flex items-center gap-1.5" href="#yonetim-kurulu">
<span className="material-symbols-outlined text-base">groups</span>
          Yönetim Kurulu
        </a>
<Link className="px-4 py-2 rounded-full font-label-sm text-label-sm bg-surface-container-lowest/10 hover:bg-gold-light hover:text-primary transition-all text-on-primary flex items-center gap-1.5" href="/baskanlar-ve-kurullar">
<span className="material-symbols-outlined text-base">account_balance</span>
          1990&apos;dan Bugüne Başkanlar &amp; Kurullar
        </Link>
<Link className="px-4 py-2 rounded-full font-label-sm text-label-sm bg-surface-container-lowest/10 hover:bg-gold-light hover:text-primary transition-all text-on-primary flex items-center gap-1.5" href="/kaynaklar">
<span className="material-symbols-outlined text-base">folder_open</span>
          Tüzük &amp; Resmi Belgeler Kütüphanesi
        </Link>
</div>
</div>
</section>
{/*  SECTION 2: Kurumsal Hikaye & Tarihçe Split (Narrative + Interactive Milestones)  */}
<section className="w-full py-space-2xl bg-surface-canvas" id="tarihce">
<div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl">
{/*  Storytelling Left Column  */}
<div className="lg:col-span-6 flex flex-col justify-between">
<div>
<div className="flex items-center gap-2 mb-space-xs">
<span className="h-0.5 w-8 bg-tertiary-container"></span>
<span className="font-caption-caps text-caption-caps text-tertiary-container font-bold uppercase tracking-widest">Kuruluş &amp; Misak</span>
</div>
<h2 className="font-headline-lg text-headline-lg text-primary font-bold leading-tight tracking-tight mb-space-md">
              Ankara'nın Stratejik İletişim Aklı, Kamu ve Akademi Köprüsü
            </h2>
<div className="space-y-space-md font-body-md text-body-md text-slate-dark leading-relaxed">
<p className="">
<strong>1990 yılında başkentte kurulan Ankara Halkla İlişkiler Derneği (AHİD)</strong>, Cumhuriyetimizin iletişim vizyonunu kamu yönetimi, diplomasi bürokrasisi ve özel sektör ekseninde şekillendirmek üzere yola çıkmıştır.
              </p>
<p className="">
                Türkiye'de halkla ilişkiler eğitiminin beşiği sayılan <em>Ankara Üniversitesi İletişim Fakültesi (İLEF)</em> ve <em>Gazi/Hacı Bayram Veli Üniversitesi İletişim Fakültesi</em> gibi köklü kürsülerle el ele veren derneğimiz; teorik derinliği, bakanlıklar, savunma sanayii ve uluslararası temsilciliklerin iletişim operasyonlarıyla harmanlayan benzersiz bir ekosistem kurmuştur.
              </p>
<p className="p-space-md bg-surface-container-low rounded-xl text-primary font-body-sm text-body-sm shadow-sm">
                “İletişim, bir kurumun kamuoyuna verdiği taahhüttür. AHİD, başkentin çok sesli, etik ve bağımsız iletişim standartlarının 34 yıldır sarsılmaz teminatıdır.”
              </p>
</div>
</div>
{/*  Quick Stat Counters  */}
<div className="grid grid-cols-3 gap-space-sm pt-space-lg mt-space-md">
<div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm">
<div className="font-headline-lg text-headline-lg font-bold text-primary">34+</div>
<div className="font-caption-caps text-caption-caps text-slate-muted uppercase">Yıllık Tecrübe</div>
</div>
<div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm">
<div className="font-headline-lg text-headline-lg font-bold text-tertiary-container">580+</div>
<div className="font-caption-caps text-caption-caps text-slate-muted uppercase">Aktif Profesyonel</div>
</div>
<div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm">
<div className="font-headline-lg text-headline-lg font-bold text-secondary">42</div>
<div className="font-caption-caps text-caption-caps text-slate-muted uppercase">Akademik Yayın</div>
</div>
</div>
</div>
{/*  Milestones Right Column  */}
<div className="lg:col-span-6 bg-surface-container-lowest p-space-lg lg:p-space-xl rounded-xl shadow-md">
<div className="flex items-center justify-between mb-space-md pb-space-sm">
<h3 className="font-headline-sm text-headline-sm text-primary font-bold">Tarihsel Dönüm Noktaları</h3>
<span className="font-caption-caps text-caption-caps bg-surface-ice text-primary px-3 py-1 rounded-full">1990 - 2026</span>
</div>
<div className="relative pl-6 space-y-space-lg">
{/*  Timeline Item 1  */}
<div className="relative">
<span className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-primary ring-4 ring-surface-ice"></span>
<div className="flex items-baseline gap-2 mb-1">
<span className="font-label-md text-label-md font-bold text-primary">1990</span>
<span className="font-caption-caps text-caption-caps bg-gold-light/40 text-gold-deep px-2 py-0.5 rounded">Resmi Kuruluş</span>
</div>
<h4 className="font-headline-sm text-headline-sm text-on-surface font-semibold mb-1">Başkentte Mesleki Örgütlenme</h4>
<p className="font-body-sm text-body-sm text-slate-muted">
                Kamu kuruluşlarının basın müşavirleri ve Ankara'nın ilk bağımsız ajans kurucuları bir araya gelerek AHİD tüzel kişiliğini ilan etti.
              </p>
</div>
{/*  Timeline Item 2  */}
<div className="relative">
<span className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-secondary ring-4 ring-surface-ice"></span>
<div className="flex items-baseline gap-2 mb-1">
<span className="font-label-md text-label-md font-bold text-secondary">2002</span>
<span className="font-caption-caps text-caption-caps bg-surface-ice text-primary px-2 py-0.5 rounded">Akademi Protokolü</span>
</div>
<h4 className="font-headline-sm text-headline-sm text-on-surface font-semibold mb-1">Üniversite &amp; Kürsü Entegrasyonu</h4>
<p className="font-body-sm text-body-sm text-slate-muted">
                İletişim fakülteleri ile kalıcı staj, tez ve sempozyum iş birliği protokolleri yürürlüğe girdi; dernek bülteni akademik hakemliğe açıldı.
              </p>
</div>
{/*  Timeline Item 3  */}
<div className="relative">
<span className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-tertiary-container ring-4 ring-surface-ice"></span>
<div className="flex items-baseline gap-2 mb-1">
<span className="font-label-md text-label-md font-bold text-tertiary-container">2015</span>
<span className="font-caption-caps text-caption-caps bg-surface-ice text-primary px-2 py-0.5 rounded">Etik Beyannamesi</span>
</div>
<h4 className="font-headline-sm text-headline-sm text-on-surface font-semibold mb-1">Başkent İletişim Deontoloji Kodu</h4>
<p className="font-body-sm text-body-sm text-slate-muted">
                Kamuoyu yanıltıcı enformasyonla mücadele ve kriz iletişiminde şeffaflık ilkelerini içeren ulusal referans metni yayımlandı.
              </p>
</div>
{/*  Timeline Item 4  */}
<div className="relative">
<span className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-gold-deep ring-4 ring-gold-light"></span>
<div className="flex items-baseline gap-2 mb-1">
<span className="font-label-md text-label-md font-bold text-gold-deep">2026 &amp; Gelecek</span>
<span className="font-caption-caps text-caption-caps bg-gold-light text-gold-deep font-bold px-2 py-0.5 rounded">Yapay Zekâ Çağı</span>
</div>
<h4 className="font-headline-sm text-headline-sm text-on-surface font-semibold mb-1">Algoritmik Halkla İlişkiler &amp; Veri Etiği</h4>
<p className="font-body-sm text-body-sm text-slate-muted">
                Yapay zekâ destekli kurumsal itibar izleme laboratuvarı ve genç iletişimciler için Başkent Dijital Mentorluk Programı başlatıldı.
              </p>
</div>
</div>
</div>
</div>
</div>
</section>
{/*  SECTION 3: Misyon, Vizyon & Temel Kurumsal Değerler  */}
<section className="w-full py-space-2xl bg-surface" id="misyon-vizyon">
<div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop">
<div className="text-center max-w-2xl mx-auto mb-space-xl">
<span className="font-caption-caps text-caption-caps text-primary font-bold uppercase tracking-widest bg-surface-ice px-3 py-1 rounded-full">Kurumsal Kimlik İlkeleri</span>
<h2 className="font-headline-lg text-headline-lg text-primary font-bold mt-space-xs tracking-tight">Misyon, Vizyon ve Etik Taahhüt</h2>
<p className="font-body-md text-body-md text-slate-muted mt-2">Mesleğimizi yarınlara taşıyan sarsılmaz kurumsal prensiplerimiz.</p>
</div>
{/*  Bento-style Vision & Mission Cards  */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg mb-space-xl">
{/*  Misyon Card  */}
<div className="bg-gradient-to-br from-primary-container to-primary text-on-primary p-space-xl rounded-xl shadow-md flex flex-col justify-between">
<div>
<div className="w-12 h-12 rounded-lg bg-surface-container-lowest/15 flex items-center justify-center mb-space-md">
<span className="material-symbols-outlined text-gold-light text-2xl">campaign</span>
</div>
<span className="font-caption-caps text-caption-caps uppercase tracking-wider text-gold-light">Temel Görevimiz</span>
<h3 className="font-headline-md text-headline-md font-bold mt-1 mb-space-sm">Misyonumuz</h3>
<p className="font-body-md text-body-md text-inverse-on-surface/90 leading-relaxed">
              Başkent Ankara'nın kamu, yerel yönetim, akademi ve özel sektör dinamiklerini harmanlayarak; halkla ilişkiler mesleğinin stratejik itibarını güçlendirmek, kamuoyunu aydınlatma ahlakını savunmak ve üyelerimizin haklarını ulusal ölçekte temsil etmektir.
            </p>
</div>
<div className="pt-space-md flex items-center gap-2 text-label-sm font-label-sm text-gold-light">
<span className="material-symbols-outlined text-base">check_circle</span>
<span className="">Kamu Yararı ve Toplumsal Fayda Merkezli İletişim</span>
</div>
</div>
{/*  Vizyon Card  */}
<div className="bg-surface-container-low text-on-surface p-space-xl rounded-xl shadow-sm flex flex-col justify-between">
<div>
<div className="w-12 h-12 rounded-lg bg-surface-ice flex items-center justify-center mb-space-md">
<span className="material-symbols-outlined text-primary text-2xl">visibility</span>
</div>
<span className="font-caption-caps text-caption-caps uppercase tracking-wider text-primary font-bold">Gelecek Ufkumuz</span>
<h3 className="font-headline-md text-headline-md font-bold text-primary mt-1 mb-space-sm">Vizyonumuz</h3>
<p className="font-body-md text-body-md text-slate-dark leading-relaxed">
              Türkiye'de kurumsal iletişim ve halkla ilişkiler disiplininde Avrupa ve Avrasya standartlarında akredite bir meslek otoritesi olmak; dijital çağda dezenformasyona karşı güvenilir bilgi üretiminin öncüsü haline gelmektir.
            </p>
</div>
<div className="pt-space-md flex items-center gap-2 text-label-sm font-label-sm text-primary">
<span className="material-symbols-outlined text-base">verified</span>
<span className="">Uluslararası Akreditasyon &amp; Prestijli Temsil</span>
</div>
</div>
</div>
{/*  4 Core Pillars Grid  */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
{/*  Value 1  */}
<div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-shadow">
<div className="w-10 h-10 rounded-lg bg-surface-ice flex items-center justify-center text-primary mb-3">
<span className="material-symbols-outlined">balance</span>
</div>
<h4 className="font-headline-sm text-headline-sm text-primary font-semibold mb-1">Şeffaflık &amp; Etik</h4>
<p className="font-body-sm text-body-sm text-slate-muted">Kamuoyuna açık, dürüst ve denetlenebilir bilgi dolaşımını her kurumsal çıkarın üstünde tutarız.</p>
</div>
{/*  Value 2  */}
<div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-shadow">
<div className="w-10 h-10 rounded-lg bg-surface-ice flex items-center justify-center text-primary mb-3">
<span className="material-symbols-outlined">school</span>
</div>
<h4 className="font-headline-sm text-headline-sm text-primary font-semibold mb-1">Akademik İş Birliği</h4>
<p className="font-body-sm text-body-sm text-slate-muted">Uygulamadaki iletişim stratejilerini bilimsel kuram ve hakemli saha araştırmalarıyla besleriz.</p>
</div>
{/*  Value 3  */}
<div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-shadow">
<div className="w-10 h-10 rounded-lg bg-surface-ice flex items-center justify-center text-primary mb-3">
<span className="material-symbols-outlined">handshake</span>
</div>
<h4 className="font-headline-sm text-headline-sm text-primary font-semibold mb-1">Sektörel Dayanışma</h4>
<p className="font-body-sm text-body-sm text-slate-muted">Ankara'daki genç iletişimcilerden duayen yöneticilere kadar tüm üyelerimizi mesleki ağ ile kucaklarız.</p>
</div>
{/*  Value 4  */}
<div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-shadow">
<div className="w-10 h-10 rounded-lg bg-surface-ice flex items-center justify-center text-primary mb-3">
<span className="material-symbols-outlined">public</span>
</div>
<h4 className="font-headline-sm text-headline-sm text-primary font-semibold mb-1">Kamu Yararı</h4>
<p className="font-body-sm text-body-sm text-slate-muted">Toplumun doğru, tarafsız haber alma ve kamusal süreçlere katılımcı olma hakkını savunuruz.</p>
</div>
</div>
</div>
</section>
{/*  SECTION 4: 2024-2026 Yönetim Kurulu (Primary Hero Grid)  */}
<section className="w-full py-space-3xl bg-surface-canvas" id="yonetim-kurulu">
<div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop">
{/*  Section Title & Mandate Badge  */}
<div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-2xl">
<div>
<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-ice text-primary text-caption-caps font-caption-caps mb-space-xs font-bold uppercase tracking-wider">
<span className="material-symbols-outlined text-sm">how_to_reg</span>
            18. Dönem İcrai Heyeti
          </div>
<h2 className="font-headline-xl text-headline-xl text-primary font-bold tracking-tight">2024 — 2026 Dönemi Yönetim Kurulu</h2>
<p className="font-body-md text-body-md text-slate-muted mt-1">12 Eylül 2024 tarihli Olağan Genel Kurul kararıyla göreve seçilen icra kurulumuz.</p>
</div>
<div className="flex items-center gap-space-sm bg-surface-container-lowest px-4 py-2.5 rounded-xl shadow-sm">
<span className="material-symbols-outlined text-tertiary-container">event</span>
<div className="text-left font-body-sm text-body-sm">
<span className="text-slate-muted block text-caption-caps font-caption-caps">Görev Süresi:</span>
<span className="font-bold text-on-surface">Eylül 2024 — Eylül 2026</span>
</div>
</div>
</div>
{/*  PRESIDENT SPOTLIGHT CARD (Asymmetric & Prestigious)  */}
{president ? (
  <div className="bg-surface-container-lowest rounded-xl shadow-md overflow-hidden mb-space-xl">
    <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
      {/*  President Image Column  */}
      <div className="lg:col-span-5 h-80 sm:h-96 lg:h-full min-h-[380px] relative overflow-hidden bg-surface-container">
        <img className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500" data-alt={president.full_name} src={president.photo_url || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600"} />
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 rounded-full bg-primary text-on-primary font-caption-caps text-caption-caps uppercase tracking-wider font-bold shadow-md">
            {president.title || "Yönetim Kurulu Başkanı"}
          </span>
        </div>
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-primary/80 to-transparent lg:hidden"></div>
      </div>
      {/*  President Profile & Vision Column  */}
      <div className="lg:col-span-7 p-space-lg lg:p-space-xl flex flex-col justify-between">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-space-xs">
            <span className="font-caption-caps text-caption-caps text-tertiary-container uppercase font-bold tracking-widest">AHİD 18. Dönem Genel Başkanı</span>
            <div className="flex items-center gap-1 text-slate-muted">
              <a className="p-1 hover:text-primary transition-colors" href="#" title="Paylaş"><span className="material-symbols-outlined text-lg">share</span></a>
              <a className="p-1 hover:text-primary transition-colors" href="mailto:baskan@ahid.org.tr" title="E-Posta"><span className="material-symbols-outlined text-lg">mail</span></a>
            </div>
          </div>
          <h3 className="font-headline-lg text-headline-lg text-primary font-bold">{president.full_name}</h3>
          <p className="font-label-md text-label-md text-secondary font-medium mt-1">{president.organization || "Stratejik İletişim & Kamu Diplomasisi Kıdemli Uzmanı"}</p>
          <p className="font-body-md text-body-md text-slate-dark mt-space-md leading-relaxed">
            {president.bio || "Başkent bürokrasisinde stratejik iletişim yönetimi ve kamu diplomasisi projelerine liderlik etmektedir."}
          </p>
          <div className="mt-space-md pt-space-md bg-surface-container-low p-space-md rounded-lg">
            <div className="font-caption-caps text-caption-caps text-primary font-bold uppercase tracking-wider mb-1">Başkanın Dönem Vizyon Mesajı</div>
            <p className="font-body-sm text-body-sm text-slate-dark italic">
              “Başkent Ankara; yalnızca idari bir merkez değil, Türkiye'nin düşünce ve iletişim pusulasıdır. Yeni dönemde AHİD'i küresel standartlarda bir fikir ve meslek kürsüsüne dönüştürmekten onur duyuyoruz.”
            </p>
          </div>
        </div>
        <div className="mt-space-lg flex flex-wrap items-center gap-space-md pt-space-sm font-label-sm text-label-sm text-slate-muted">
          <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-base text-primary">domain</span> T.C. İletişim &amp; Kamu Danışmanı</span>
          <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-base text-primary">school</span> Ankara Üniversitesi İLEF Mezunu</span>
        </div>
      </div>
    </div>
  </div>
) : loading ? (
  <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm animate-pulse mb-space-xl grid grid-cols-1 lg:grid-cols-12 gap-6">
    <div className="lg:col-span-5 h-72 bg-slate-200 rounded-xl" />
    <div className="lg:col-span-7 space-y-4 py-4">
      <div className="h-5 w-40 bg-slate-200 rounded" />
      <div className="h-8 w-64 bg-slate-200 rounded" />
      <div className="h-24 w-full bg-slate-200 rounded" />
    </div>
  </div>
) : (
  <div className="bg-surface-container-lowest p-8 rounded-xl text-center border border-dashed border-slate-200 mb-space-xl">
    <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">person_off</span>
    <h4 className="font-headline-sm font-bold text-primary mb-1">Yönetim Kurulu Başkanı</h4>
    <p className="text-sm text-slate-500 mb-4">Sistemde henüz kayıtlı bir yönetim kurulu başkanı bulunmamaktadır.</p>
    <Link href="/admin-panel" className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-container transition-colors">
      <span className="material-symbols-outlined text-sm">add_circle</span>
      + Yönetim Panelinden İlk Kaydı Ekle
    </Link>
  </div>
)}
{/*  BOARD MEMBERS GRID  */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">
  {loading ? (
    [1, 2, 3].map((n) => (
      <div key={n} className="bg-surface-container-lowest rounded-xl p-5 shadow-sm animate-pulse space-y-4">
        <div className="h-56 w-full bg-slate-200 rounded-lg" />
        <div className="h-5 w-1/2 bg-slate-200 rounded" />
        <div className="h-12 w-full bg-slate-200 rounded" />
      </div>
    ))
  ) : executiveMembers.length === 0 ? (
    <div className="col-span-full bg-surface-container-lowest p-8 rounded-xl text-center border border-dashed border-slate-200">
      <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">groups</span>
      <h4 className="font-headline-sm font-bold text-primary mb-1">Yönetim Kurulu Üye Listesi</h4>
      <p className="text-sm text-slate-500 mb-4">Sistemde kayıtlı ilave yönetim kurulu üyesi bulunmamaktadır.</p>
      <Link href="/admin-panel" className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-container transition-colors">
        <span className="material-symbols-outlined text-sm">add_circle</span>
        + Yönetim Panelinden Kurul Üyesi Ekle
      </Link>
    </div>
  ) : (
    executiveMembers.map((member, idx) => (
      <div key={member.id || idx} className="bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group">
        <div>
          <div className="h-64 overflow-hidden relative bg-surface-container">
            <img
              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
              alt={member.full_name}
              src={member.photo_url || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600"}
            />
            <div className="absolute top-3 left-3">
              <span className="px-2.5 py-1 rounded bg-secondary-container/90 text-on-secondary-container font-caption-caps text-caption-caps font-bold">
                {member.title}
              </span>
            </div>
          </div>
          <div className="p-space-lg">
            <span className="font-caption-caps text-caption-caps text-slate-muted uppercase font-bold tracking-wider block">
              {member.organization || "Yönetim Masası"}
            </span>
            <h4 className="font-headline-sm text-headline-sm text-primary font-bold mt-1">{member.full_name}</h4>
            <p className="font-body-sm text-body-sm text-slate-muted mt-space-sm line-clamp-3">
              {member.bio || "AHİD 18. Dönem Yönetim Kurulu üyesi olarak derneğin mesleki standartlarını geliştirmeye yönelik çalışmaları yürütmektedir."}
            </p>
          </div>
        </div>
        <div className="px-space-lg pb-space-lg pt-2 flex items-center justify-between text-slate-muted font-label-sm text-label-sm">
          <span className="text-caption-caps font-caption-caps text-slate-muted">Asil Üye</span>
          <div className="flex items-center gap-2">
            <a className="hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined text-lg">alternate_email</span></a>
            <a className="hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined text-lg">share</span></a>
          </div>
        </div>
      </div>
    ))
  )}
</div>
</div>
</section>
{/*  SECTION 5: Danışma Kurulu & Denetim Kurulu (Tabbed / Dual Side-by-Side)  */}
<section className="w-full py-space-2xl bg-surface" id="danisma-ve-denetim">
<div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl">
{/*  Denetim Kurulu Panel (Left 5 Cols)  */}
<div className="lg:col-span-5 bg-surface-container-low p-space-lg lg:p-space-xl rounded-xl shadow-sm flex flex-col justify-between">
<div>
<div className="flex items-center gap-2 mb-2">
<span className="material-symbols-outlined text-primary text-xl">gavel</span>
<span className="font-caption-caps text-caption-caps uppercase tracking-wider text-primary font-bold">İç Denetim ve Şeffaflık</span>
</div>
<h3 className="font-headline-md text-headline-md font-bold text-primary mb-space-sm">Denetim Kurulu</h3>
<p className="font-body-sm text-body-sm text-slate-muted leading-relaxed mb-space-md">
              Dernekler Kanunu ve tüzüğümüz uyarınca mali disiplini, etik uygulamaları ve karar defterlerini bağımsız olarak denetleyen asil üyelerimiz.
            </p>
{/*  Denetim Üyeleri List  */}
<div className="space-y-space-sm">
  {supervisoryMembers.length === 0 ? (
    <div className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm text-center text-slate-500 text-sm">
      Kayıtlı denetim kurulu üyesi bulunmamaktadır.
    </div>
  ) : (
    supervisoryMembers.map((m, idx) => (
      <div key={m.id || idx} className="bg-surface-container-lowest p-space-md rounded-lg shadow-sm flex items-center justify-between">
        <div>
          <h4 className="font-headline-sm text-headline-sm text-on-surface font-semibold">{m.full_name}</h4>
          <p className="font-body-sm text-body-sm text-slate-muted">{m.title} {m.organization ? `• ${m.organization}` : ""}</p>
        </div>
        <span className="font-caption-caps text-caption-caps bg-surface-ice text-primary px-2.5 py-1 rounded">Asil Üye</span>
      </div>
    ))
  )}
</div>
</div>
<div className="mt-space-lg pt-space-sm font-caption-caps text-caption-caps text-slate-muted flex items-center gap-1.5">
<span className="material-symbols-outlined text-sm text-primary">verified</span>
<span className="">2024 Yılı 6 Aylık İç Denetim Raporu İbra Edilmiştir.</span>
</div>
</div>
{/*  Yüksek İstişare & Danışma Kurulu (Right 7 Cols)  */}
<div className="lg:col-span-7 bg-surface-container-lowest p-space-lg lg:p-space-xl rounded-xl shadow-md">
<div className="flex items-center justify-between mb-space-sm">
<div>
<div className="flex items-center gap-2 mb-1">
<span className="material-symbols-outlined text-gold-deep text-xl">award_star</span>
<span className="font-caption-caps text-caption-caps uppercase tracking-wider text-gold-deep font-bold">Bilgelik &amp; Kurumsal Hafıza</span>
</div>
<h3 className="font-headline-md text-headline-md font-bold text-primary">Yüksek İstişare ve Danışma Kurulu</h3>
</div>
<span className="hidden sm:inline-block font-caption-caps text-caption-caps bg-gold-light/40 text-gold-deep px-3 py-1 rounded-full font-bold">Onursal Meclis</span>
</div>
<p className="font-body-sm text-body-sm text-slate-muted leading-relaxed mb-space-lg">
            Derneğin kurucu iradesini, duayen akademisyenleri ve geçmiş dönem başkanlarını barındıran; derneğe stratejik rota çizen istişare heyeti.
          </p>
<div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
  {honoraryMembers.length === 0 ? (
    <div className="col-span-full p-space-md rounded-lg bg-surface-container-low text-center text-slate-500 text-sm">
      Kayıtlı onur veya danışma kurulu üyesi bulunmamaktadır.
    </div>
  ) : (
    honoraryMembers.map((m, idx) => (
      <div key={m.id || idx} className="p-space-md rounded-lg bg-surface-container-low">
        <span className="font-caption-caps text-caption-caps text-gold-deep font-bold uppercase">{m.title}</span>
        <h4 className="font-headline-sm text-headline-sm text-primary font-bold mt-1">{m.full_name}</h4>
        <p className="font-body-sm text-body-sm text-slate-muted mt-1">
          {m.bio || m.organization || "Türk halkla ilişkiler mesleğinin kurucu değerlerini temsil eden onursal meclis üyemiz."}
        </p>
      </div>
    ))
  )}
</div>
</div>
</div>
</div>
</section>
{/*  SECTION 6: Resmi Belgeler, Tüzük & Şeffaflık İndirme Merkezi  */}
<section className="w-full py-space-2xl bg-surface-canvas" id="resmi-belgeler">
<div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop">
<div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-xl">
<div>
<span className="font-caption-caps text-caption-caps text-primary font-bold uppercase tracking-widest bg-surface-ice px-3 py-1 rounded-full">Resmi Mevzuat &amp; Arşiv</span>
<h2 className="font-headline-lg text-headline-lg text-primary font-bold mt-space-xs tracking-tight">Tüzük, Yönetmelik ve Şeffaflık Belgeleri</h2>
<p className="font-body-md text-body-md text-slate-muted mt-1">Kamusal denetime açık, güncel dernek kurumsal dokümantasyonu.</p>
</div>
<Link
  href="/kaynaklar"
  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm font-semibold hover:bg-primary-container transition-all"
>
  <span className="material-symbols-outlined text-base">folder_managed</span>
  <span>Tüm Mevzuat &amp; Belge Kütüphanesine Git</span>
</Link>
</div>
{/*  Document Cards Matrix (Dynamic from Supabase)  */}
{documents.length === 0 ? (
  <div className="bg-surface-container-lowest p-8 rounded-xl text-center border border-dashed border-slate-200">
    <span className="material-symbols-outlined text-3xl text-slate-400 mb-1">folder_open</span>
    <p className="font-semibold text-primary">Veritabanında henüz yayınlanmış resmi belge veya tüzük kaydı bulunmuyor</p>
    <p className="text-xs text-slate-500 mt-1 mb-4">Yönetim panelinden eklenen tüzük, yönetmelik ve faaliyet raporları otomatik olarak burada ve Kaynaklar Kütüphanesinde listelenir.</p>
    <Link
      href="/kaynaklar"
      className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
    >
      <span>Kaynaklar &amp; Resmi Belgeler Portalını İncele</span>
      <span className="material-symbols-outlined text-sm">arrow_forward</span>
    </Link>
  </div>
) : (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
    {documents.slice(0, 4).map((doc) => (
      <div key={doc.id} className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-space-sm">
            <span className="font-caption-caps text-caption-caps bg-error-container text-on-error-container px-2 py-0.5 rounded font-bold">
              {doc.file_type || "PDF"} {doc.file_size ? `• ${doc.file_size}` : ""}
            </span>
            <span className="material-symbols-outlined text-slate-muted text-lg">download</span>
          </div>
          <h4 className="font-headline-sm text-headline-sm text-primary font-bold leading-snug">{doc.title}</h4>
          <p className="font-body-sm text-body-sm text-slate-muted mt-2 line-clamp-3">
            {doc.description || doc.category}
          </p>
        </div>
        <div className="pt-space-md mt-space-sm">
          <a
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-300 text-slate-dark bg-surface-container-lowest hover:bg-slate-50 hover:text-primary transition-all duration-200 font-label-sm text-label-sm font-semibold active:scale-95 shadow-sm"
            href={doc.file_url || "/kaynaklar"}
            target={doc.file_url ? "_blank" : undefined}
            rel="noreferrer"
          >
            <span className="material-symbols-outlined text-sm">visibility</span>
            Belgeyi İncele
          </a>
        </div>
      </div>
    ))}
  </div>
)}
</div>
</section>
{/*  SECTION 7: Onur & Geçmiş Dönem Başkanları Şeref Tribünü  */}
<section className="w-full py-space-2xl bg-surface" id="gecmis-baskanlar">
<div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop">
<div className="text-center max-w-2xl mx-auto mb-space-xl">
<span className="font-caption-caps text-caption-caps text-primary font-bold uppercase tracking-widest bg-surface-ice px-3 py-1 rounded-full">Kurumsal Süreklilik</span>
<h2 className="font-headline-lg text-headline-lg text-primary font-bold mt-space-xs tracking-tight">Geçmiş Dönem Başkanlarımız</h2>
<p className="font-body-md text-body-md text-slate-muted mt-2">1990&apos;dan bugüne derneğimizin bayrağını onurla taşıyan başkanlarımıza minnetle.</p>
<div className="mt-4">
  <Link
    href="/baskanlar-ve-kurullar"
    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-surface-ice text-primary hover:bg-primary hover:text-on-primary font-label-sm text-label-sm font-bold transition-all"
  >
    <span className="material-symbols-outlined text-base">military_tech</span>
    <span>1990&apos;dan Bugüne Başkanlarımız &amp; Kurullarımız Portalına Git</span>
  </Link>
</div>
</div>
{honoraryMembers.length === 0 ? (
  <div className="bg-surface-container-low p-8 rounded-xl text-center border border-dashed border-slate-200 max-w-xl mx-auto">
    <span className="material-symbols-outlined text-3xl text-slate-400 mb-1">history</span>
    <p className="font-semibold text-primary">Henüz geçmiş dönem başkan veya onur kurulu kaydı bulunmuyor</p>
    <p className="text-xs text-slate-500 mt-1">Veritabanına &quot;onur_kurulu&quot; kategorisinde üye eklendiğinde burada görüntülenecektir.</p>
  </div>
) : (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-space-md">
    {honoraryMembers.map((m) => (
      <div key={m.id} className="bg-surface-container-low p-space-md rounded-xl text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-surface-ice flex items-center justify-center text-primary mb-2 shadow-sm overflow-hidden">
          {m.photo_url ? (
            <img src={m.photo_url} alt={m.full_name} className="w-full h-full object-cover" />
          ) : (
            <span className="material-symbols-outlined text-2xl">person</span>
          )}
        </div>
        <div className="font-caption-caps text-caption-caps text-gold-deep font-bold">{m.organization || "AHİD"}</div>
        <h4 className="font-headline-sm text-headline-sm text-primary font-semibold text-sm mt-1">{m.full_name}</h4>
        <span className="font-caption-caps text-caption-caps text-slate-muted">{m.title}</span>
      </div>
    ))}
  </div>
)}
</div>
</section>
{/*  SECTION 8: Vanguard CTA Banner (Corporate Participation & Governance Callout)  */}
<section className="w-full pb-space-2xl bg-surface">
<div className="max-w-7xl mx-auto px-margin-mobile lg:px-margin-desktop">
<div className="relative rounded-2xl bg-primary text-on-primary p-space-xl lg:p-space-2xl overflow-hidden shadow-xl">
{/*  Vector Accent Shape in Background  */}
<div className="absolute -right-24 -bottom-24 w-96 h-96 rounded-full bg-secondary opacity-30 blur-3xl pointer-events-none"></div>
<div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-center">
<div className="lg:col-span-8 flex flex-col gap-space-sm">
<span className="font-caption-caps text-caption-caps uppercase tracking-wider text-gold-light font-bold">Mesleki Birlik ve Güç Birliği</span>
<h2 className="font-headline-xl text-headline-xl text-on-primary font-bold tracking-tight">
              Ankara'nın İletişim Vizyonuna Siz de Yön Verin
            </h2>
<p className="font-body-lg text-body-lg text-surface-container-high/90 max-w-2xl leading-relaxed">
              AHİD komisyonlarında görev alarak kamu diplomasisi, etik denetimi ve yapay zekâ stratejileri çalışma gruplarımıza dahil olabilir, Ankara'nın en saygın halkla ilişkiler ağına katılabilirsiniz.
            </p>
</div>
<div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-space-sm lg:items-end justify-center">
<Link className="inline-flex items-center justify-center gap-2 bg-[#c25e00] hover:bg-[#a04703] text-white font-semibold font-label-md text-label-md px-6 py-3.5 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 w-full sm:w-auto text-center" href="/uyelik#basvuru-formu"><span className="material-symbols-outlined text-base">how_to_reg</span><span className="">Üyelik Başvurusu Yap</span></Link>
<Link className="inline-flex items-center justify-center gap-2 border border-white/30 text-white font-semibold font-label-md text-label-md px-6 py-3.5 rounded-lg hover:bg-white/10 active:scale-95 transition-all duration-200 w-full sm:w-auto text-center backdrop-blur-sm" href="/iletisim"><span className="material-symbols-outlined text-base">mail</span><span className="">Kurumsal İletişime Geç</span></Link>
</div>
</div>
</div>
</div>
</section>
</div></main>
      <Footer />
    </>
  );
}
