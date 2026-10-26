"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface DocumentItem {
  id: number;
  title: string;
  subtitle: string | null;
  description: string | null;
  category: string;
  document_code: string | null;
  file_url: string | null;
  file_format: string;
  file_size: string | null;
  revision_date: string | null;
  authority: string | null;
  signature_status: string | null;
  is_featured: boolean | null;
  created_at: string;
}

const DOC_CATEGORIES = [
  "Tümü",
  "Dernek Tüzüğü & İç Yönergeler",
  "Mesleki Etik & İlkeler",
  "Sektörel Raporlar & Barometreler",
  "Başvuru Formları & Şablonlar",
  "Mevzuat & Kanun Metinleri",
];

export default function KaynaklarPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("Tümü");
  const [selectedFormat, setSelectedFormat] = useState("Tüm Formatlar");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Document Verification State (Connected to Supabase /api/documents?verify_code=...)
  const [verifyCode, setVerifyCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    checked: boolean;
    verified: boolean;
    document: DocumentItem | null;
  }>({ checked: false, verified: false, document: null });

  // Archive Request Modal State (Connected to Supabase /api/contact)
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [reqForm, setReqForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [reqSubmitting, setReqSubmitting] = useState(false);
  const [reqSuccess, setReqSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/documents")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.documents)) {
          setDocuments(data.documents);
        }
      })
      .catch((err) => console.error("Failed to fetch documents:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleVerifyDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyCode.trim()) return;
    setVerifying(true);
    try {
      const res = await fetch(
        `/api/documents?verify_code=${encodeURIComponent(verifyCode.trim())}`
      );
      const data = await res.json();
      setVerifyResult({
        checked: true,
        verified: Boolean(data.verified && data.document),
        document: data.document || null,
      });
    } catch (err) {
      console.error(err);
      setVerifyResult({ checked: true, verified: false, document: null });
    } finally {
      setVerifying(false);
    }
  };

  const handleArchiveRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReqSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...reqForm,
          department: "Mevzuat & Resmi Arşiv Masası",
          type: "archive_request",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReqSuccess(true);
        setReqForm({ name: "", email: "", phone: "", subject: "", message: "" });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReqSubmitting(false);
    }
  };

  const filteredDocs = documents
    .filter((doc) => {
      const matchesCat =
        selectedCategory === "Tümü" ||
        doc.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesFormat =
        selectedFormat === "Tüm Formatlar" ||
        doc.file_format.toUpperCase() === selectedFormat.toUpperCase();
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        doc.title.toLowerCase().includes(q) ||
        (doc.subtitle || "").toLowerCase().includes(q) ||
        (doc.description || "").toLowerCase().includes(q) ||
        (doc.document_code || "").toLowerCase().includes(q);
      return matchesCat && matchesFormat && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "az") return a.title.localeCompare(b.title, "tr");
      if (sortBy === "oldest") return a.id - b.id;
      return b.id - a.id;
    });

  const featuredDocs = documents.filter((d) => d.is_featured).slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col bg-[#f9f9ff] text-[#101c2e]">
      <Navbar />

      <main className="w-full pt-[7.5rem] bg-[#f9f9ff] flex-1">
        {/* Sub-Header / Architectural Context Banner */}
        <section className="relative w-full bg-gradient-to-b from-[#dee8ff]/40 via-[#f0f3ff]/30 to-[#f9f9ff] overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 lg:px-14 py-10 relative z-10">
            <nav
              aria-label="Erişim Yolu"
              className="flex items-center gap-1.5 text-xs font-semibold text-[#64748b] mb-4"
            >
              <Link
                className="hover:text-[#002869] transition-colors flex items-center gap-1"
                href="/"
              >
                <span className="material-symbols-outlined text-sm">home</span>
                <span>Ana Sayfa</span>
              </Link>
              <span className="material-symbols-outlined text-xs text-[#c4c6d3]">
                chevron_right
              </span>
              <Link
                className="hover:text-[#002869] transition-colors"
                href="/kurumsal"
              >
                Kurumsal
              </Link>
              <span className="material-symbols-outlined text-xs text-[#c4c6d3]">
                chevron_right
              </span>
              <span className="text-[#002869] font-semibold">
                Kaynaklar &amp; Mevzuat Arşivi
              </span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
              <div className="lg:col-span-8 flex flex-col gap-3">
                <div className="inline-flex items-center gap-1.5 self-start px-3 py-1 rounded-full bg-[#ebf2fc] text-[#002869] text-[11px] font-bold tracking-widest uppercase shadow-xs">
                  <span className="material-symbols-outlined text-sm text-[#002869]">
                    verified
                  </span>
                  <span>
                    T.C. İÇİŞLERİ BAKANLIĞI DERBİS &amp; RESMİ DİJİTAL ARŞİV
                  </span>
                </div>
                <h1 className="font-['Plus_Jakarta_Sans'] text-3xl sm:text-4xl text-[#002869] font-bold tracking-tight">
                  Kaynaklar, Mevzuat &amp; Resmi Belgeler Kütüphanesi
                </h1>
                <p className="text-base sm:text-lg text-[#334155] max-w-3xl leading-relaxed">
                  1990 yılından günümüze Ankara Halkla İlişkiler Derneği tüzüğü,
                  kamu diplomasisi ilkeleri, mesleki etik kılavuzları, bilimsel
                  hakemli araştırmalar ve sektörel mevzuat referans deposu.
                </p>
              </div>

              <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-2.5 justify-end items-stretch">
                <a
                  href="#belge-dogrulama"
                  className="inline-flex items-center justify-center gap-2 bg-[#002869] text-white hover:bg-[#225aba] transition-all text-sm font-semibold px-5 py-3 rounded-lg shadow-xs"
                >
                  <span className="material-symbols-outlined text-base">
                    qr_code_scanner
                  </span>
                  <span>Belge &amp; Sertifika Doğrulama</span>
                </a>
                <button
                  onClick={() => {
                    setReqSuccess(false);
                    setRequestModalOpen(true);
                  }}
                  className="inline-flex items-center justify-center gap-2 bg-white text-[#002869] hover:bg-[#ebf2fc] transition-colors text-sm font-semibold px-5 py-3 rounded-lg shadow-xs border border-[#dee8ff] cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-base">
                    history_edu
                  </span>
                  <span>Resmi Arşiv Talebi Oluştur</span>
                </button>
              </div>
            </div>

            {/* KPI Institutional Snapshot Ribbon */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
              <div className="bg-white rounded-xl p-4 shadow-xs border border-[#e7eeff] flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#ebf2fc] text-[#002869] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-2xl">
                    description
                  </span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#002869] leading-none">
                    {loading ? "—" : documents.length}
                  </span>
                  <span className="text-xs text-[#64748b] font-semibold mt-1 truncate">
                    Onaylı Yönerge &amp; Belge
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-xs border border-[#e7eeff] flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#ebf2fc] text-[#002869] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-2xl">
                    account_balance
                  </span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-[#101c2e] leading-tight">
                    06-038-112
                  </span>
                  <span className="text-xs text-[#64748b] font-semibold truncate">
                    DERBİS Kütük No
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-xs border border-[#e7eeff] flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#ebf2fc] text-[#002869] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-2xl">
                    security
                  </span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-[#101c2e] leading-tight">
                    %100 Dijital İmza
                  </span>
                  <span className="text-xs text-[#64748b] font-semibold truncate">
                    KamuSM Doğrulama Uyumu
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-xs border border-[#e7eeff] flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#ebf2fc] text-[#92400e] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-2xl">
                    verified_user
                  </span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-[#101c2e] leading-tight">
                    5253 Sayılı Kanun
                  </span>
                  <span className="text-xs text-[#64748b] font-semibold truncate">
                    Dernekler Mevzuatı Uyumlu
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content Stream & Catalog Workspace */}
        <section className="max-w-7xl mx-auto px-4 lg:px-14 py-10 w-full">
          {/* Featured Foundation Documents Showcase (Only rendered if featured documents exist in DB) */}
          {featuredDocs.length > 0 && (
            <div className="mb-12">
              <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-2 mb-6">
                <div>
                  <span className="text-[11px] text-[#92400e] uppercase tracking-wider font-bold">
                    TEMEL KURUMSAL MEVZUAT
                  </span>
                  <h2 className="font-['Plus_Jakarta_Sans'] text-2xl sm:text-3xl text-[#002869] font-bold">
                    Öne Çıkan Temel Belgeler
                  </h2>
                </div>
                <span className="text-sm text-[#64748b]">
                  Hukuki ve mesleki bağlayıcılığı haiz temel metinler
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredDocs.map((doc) => (
                  <article
                    key={doc.id}
                    className="bg-white rounded-xl p-6 shadow-xs hover:shadow-md border border-[#e7eeff] transition-all duration-300 flex flex-col justify-between relative overflow-hidden group"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#002869]" />
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#ebf2fc] text-[#002869]">
                          {doc.signature_status || "DERBİS ONAYLI"}
                        </span>
                        <span className="material-symbols-outlined text-[#002869] text-xl">
                          gavel
                        </span>
                      </div>
                      <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-[#002869] group-hover:text-[#225aba] transition-colors mb-2">
                        {doc.title}
                      </h3>
                      <p className="text-sm text-[#334155] leading-relaxed mb-4">
                        {doc.description || doc.subtitle}
                      </p>
                    </div>

                    <div className="pt-4 bg-[#f0f3ff]/50 rounded-lg p-3">
                      <div className="grid grid-cols-3 gap-1 text-center text-[11px] text-[#64748b] mb-3">
                        <div className="flex flex-col">
                          <span className="text-[#101c2e] font-bold">
                            {doc.revision_date || "Güncel"}
                          </span>
                          <span>Revizyon</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[#101c2e] font-bold">
                            {doc.file_size || "PDF"}
                          </span>
                          <span>{doc.file_format}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[#101c2e] font-bold truncate">
                            {doc.authority || "Genel Kurul"}
                          </span>
                          <span>Yetkili Organ</span>
                        </div>
                      </div>
                      {doc.file_url ? (
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-[#002869] text-white hover:bg-[#225aba] transition-colors inline-flex items-center justify-center gap-1 shadow-xs"
                        >
                          <span className="material-symbols-outlined text-sm">
                            download
                          </span>
                          <span>Belgeyi Görüntüle / İndir ({doc.file_format})</span>
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setReqForm((prev) => ({
                              ...prev,
                              subject: `Belge Talebi: ${doc.title}`,
                            }));
                            setReqSuccess(false);
                            setRequestModalOpen(true);
                          }}
                          className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-[#ebf2fc] text-[#002869] hover:bg-[#dee8ff] transition-colors inline-flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">
                            mail
                          </span>
                          <span>Resmi Nüsha Talep Et</span>
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Filter Matrix & Document Search Bar */}
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-[#e7eeff] mb-8 flex flex-col gap-5">
            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#64748b]">
                  search
                </span>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-[#f0f3ff] rounded-xl text-sm text-[#101c2e] placeholder:text-[#747783] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#002869]/20 transition-all"
                  placeholder="Belge adı, karar sayısı, doğrulama kodu veya anahtar kelime ile arayın..."
                  type="text"
                />
              </div>

              <div className="grid grid-cols-2 sm:flex items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
                <select
                  aria-label="Format Filtresi"
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="w-full sm:w-auto bg-[#f0f3ff] hover:bg-[#ebf2fc] text-[#101c2e] text-xs sm:text-sm font-semibold px-3 sm:px-4 py-3 rounded-xl outline-none cursor-pointer transition-colors"
                >
                  <option value="Tüm Formatlar">Tüm Formatlar</option>
                  <option value="PDF">PDF Belgeleri (.pdf)</option>
                  <option value="DOCX">Matbu Formlar (.docx)</option>
                  <option value="ZIP">Arşiv Paketleri (.zip)</option>
                </select>

                <select
                  aria-label="Sıralama Ölçütü"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full sm:w-auto bg-[#f0f3ff] hover:bg-[#ebf2fc] text-[#101c2e] text-xs sm:text-sm font-semibold px-3 sm:px-4 py-3 rounded-xl outline-none cursor-pointer transition-colors"
                >
                  <option value="newest">Yeniden Eskiye</option>
                  <option value="oldest">Eskiden Yeniye</option>
                  <option value="az">Belge Başlığı (A-Z)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {DOC_CATEGORIES.map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={
                      active
                        ? "px-4 py-2 rounded-full text-xs font-semibold bg-[#002869] text-white whitespace-nowrap shadow-xs cursor-pointer"
                        : "px-4 py-2 rounded-full text-xs font-semibold bg-[#f0f3ff] text-[#101c2e] hover:bg-[#ebf2fc] transition-colors whitespace-nowrap cursor-pointer"
                    }
                    type="button"
                  >
                    {cat === "Tümü" ? `Tümü (${documents.length})` : cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comprehensive Document Repository Table */}
          <div className="bg-white rounded-2xl shadow-xs border border-[#e7eeff] overflow-hidden mb-12">
            <div className="px-6 py-4 bg-[#f0f3ff]/60 flex items-center justify-between border-b border-[#e7eeff]">
              <div className="flex items-center gap-2 text-sm text-[#002869] font-bold">
                <span className="material-symbols-outlined text-lg">
                  inventory_2
                </span>
                <span>Resmi Mevzuat ve Doküman Kayıt Defteri</span>
              </div>
              <div className="text-[11px] font-bold text-[#64748b] uppercase">
                TOPLAM {filteredDocs.length} KAYIT
              </div>
            </div>

            {loading ? (
              <div className="p-8 flex flex-col gap-4 animate-pulse">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="h-14 bg-[#f0f3ff] rounded-lg" />
                ))}
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[#ebf2fc] text-[#002869] flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl">
                    folder_off
                  </span>
                </div>
                <h3 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#002869]">
                  Kayıtlı Resmi Belge veya Mevzuat Bulunmuyor
                </h3>
                <p className="text-sm text-[#64748b] max-w-lg">
                  Veritabanında şu anda bu filtreye uygun yüklenmiş resmi belge
                  bulunmamaktadır. Özel arşiv veya ıslak imzalı belge talepleriniz
                  için talep formunu kullanabilirsiniz.
                </p>
                <div className="flex items-center gap-3 pt-2">
                  {(selectedCategory !== "Tümü" ||
                    selectedFormat !== "Tüm Formatlar" ||
                    searchQuery) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory("Tümü");
                        setSelectedFormat("Tüm Formatlar");
                        setSearchQuery("");
                      }}
                      className="px-4 py-2 rounded-lg bg-[#f0f3ff] text-[#002869] text-xs font-semibold hover:bg-[#dee8ff] cursor-pointer"
                    >
                      Filtreyi Sıfırla
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setReqSuccess(false);
                      setRequestModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-lg bg-[#002869] text-white text-xs font-semibold hover:bg-[#225aba] cursor-pointer"
                  >
                    Resmi Arşiv Talebi Oluştur
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#f0f3ff] text-[#64748b] text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-6 font-semibold" scope="col">
                        Doküman Adı &amp; Kurumsal Yetki
                      </th>
                      <th className="py-3.5 px-4 font-semibold" scope="col">
                        Kategori
                      </th>
                      <th className="py-3.5 px-4 font-semibold" scope="col">
                        Revizyon Tarihi
                      </th>
                      <th className="py-3.5 px-4 font-semibold" scope="col">
                        Format &amp; Boyut
                      </th>
                      <th className="py-3.5 px-4 font-semibold" scope="col">
                        Doğrulama Kodu
                      </th>
                      <th
                        className="py-3.5 px-6 font-semibold text-right"
                        scope="col"
                      >
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e7eeff]">
                    {filteredDocs.map((doc) => (
                      <tr
                        key={doc.id}
                        className="hover:bg-[#f0f3ff]/50 transition-colors group"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-[#ebf2fc] text-[#002869] flex items-center justify-center shrink-0 mt-0.5">
                              <span className="material-symbols-outlined text-lg">
                                description
                              </span>
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-[#101c2e] group-hover:text-[#002869] transition-colors">
                                {doc.title}
                              </span>
                              <span className="text-[11px] text-[#64748b]">
                                {doc.subtitle || doc.authority || "AHİD Resmi Yayın"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ebf2fc] text-[#002869]">
                            {doc.category}
                          </span>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap text-[#101c2e] font-medium">
                          {doc.revision_date || "Güncel"}
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#334155]">
                            <span className="material-symbols-outlined text-base text-[#ba1a1a]">
                              picture_as_pdf
                            </span>
                            <span>
                              {doc.file_size || "1.0 MB"} {doc.file_format}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-xs text-[#002869] font-semibold font-mono">
                            <span className="material-symbols-outlined text-sm">
                              verified
                            </span>
                            <span>
                              {doc.document_code || doc.signature_status || "Onaylı"}
                            </span>
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          {doc.file_url ? (
                            <a
                              href={doc.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#002869] text-white hover:bg-[#225aba] transition-colors text-xs font-semibold shadow-xs"
                            >
                              <span className="material-symbols-outlined text-sm">
                                download
                              </span>
                              <span>İndir</span>
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setReqForm((prev) => ({
                                  ...prev,
                                  subject: `Belge Talebi: ${doc.title}`,
                                }));
                                setReqSuccess(false);
                                setRequestModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#ebf2fc] text-[#002869] hover:bg-[#dee8ff] transition-colors text-xs font-semibold cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-sm">
                                mail
                              </span>
                              <span>Talep Et</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Verification Portal & Bilgi Edinme Callout (Dual Bento Section) */}
          <div
            id="belge-dogrulama"
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12"
          >
            {/* Belge Doğrulama ve Karekod Servisi (8 Cols) */}
            <div className="lg:col-span-8 bg-white rounded-2xl p-8 shadow-xs border border-[#e7eeff] relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <span className="text-[11px] text-[#002869] uppercase font-bold tracking-wider">
                    RESMİ DİJİTAL DOĞRULAMA
                  </span>
                  <h3 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#002869] mt-1">
                    Belge Doğrulama &amp; Karekod Sorgu Servisi
                  </h3>
                  <p className="text-sm text-[#334155] mt-2 leading-relaxed">
                    AHİD tarafından tanzim edilen sertifikalar, üyelik evrakları ve
                    komisyon mazbatalarının üzerindeki doğrulama kodunu girerek
                    orijinalliğini veritabanımızdan anlık olarak teyit
                    edebilirsiniz.
                  </p>
                </div>
                <div className="hidden sm:flex w-16 h-16 rounded-2xl bg-[#ebf2fc] text-[#002869] items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-3xl">
                    qr_code_scanner
                  </span>
                </div>
              </div>

              <form
                onSubmit={handleVerifyDocument}
                className="flex flex-col sm:flex-row gap-2.5 items-stretch mb-4"
              >
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748b]">
                    key
                  </span>
                  <input
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#f0f3ff] rounded-lg text-sm text-[#101c2e] uppercase tracking-wider focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#002869]/20"
                    placeholder="Doğrulama kodunu girin (Örn: TR-AHID-2026-ARCH-...)"
                    type="text"
                    required
                  />
                </div>
                <button
                  disabled={verifying}
                  className="px-6 py-3 rounded-lg text-sm font-bold bg-[#002869] text-white hover:bg-[#225aba] transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  type="submit"
                >
                  <span className="material-symbols-outlined text-lg">
                    fact_check
                  </span>
                  <span>{verifying ? "Sorgulanıyor..." : "Doğrula"}</span>
                </button>
              </form>

              {verifyResult.checked && (
                <div
                  className={`p-4 rounded-xl flex items-center justify-between gap-4 ${
                    verifyResult.verified
                      ? "bg-[#ebf2fc] text-[#002869]"
                      : "bg-[#ffdad6]/50 text-[#93000a]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-2xl">
                      {verifyResult.verified ? "check_circle" : "error"}
                    </span>
                    <div>
                      {verifyResult.verified && verifyResult.document ? (
                        <>
                          <div className="text-sm font-bold">
                            Kayıtlı Belge Doğrulandı:{" "}
                            {verifyResult.document.title}
                          </div>
                          <div className="text-xs opacity-80">
                            Yetkili Organ:{" "}
                            {verifyResult.document.authority || "Yönetim Kurulu"} ·
                            Revizyon:{" "}
                            {verifyResult.document.revision_date || "Güncel"} ·
                            Durum:{" "}
                            {verifyResult.document.signature_status || "Onaylı"}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-sm font-bold">
                            Belge Kaydı Bulunamadı
                          </div>
                          <div className="text-xs opacity-80">
                            Girilen doğrulama koduna ({verifyCode}) ait aktif bir
                            dijital belge kaydı veritabanında bulunamadı.
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bilgi Edinme & Arşiv İstemi (4 Cols) */}
            <div className="lg:col-span-4 bg-gradient-to-br from-[#002869] to-[#0b3d91] text-white rounded-2xl p-8 shadow-md flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-white/10 text-[#fde68a] flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-2xl">
                    contact_support
                  </span>
                </div>
                <h3 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#fde68a] mb-2">
                  Arşivde Bulamadığınız Bir Karar mı Var?
                </h3>
                <p className="text-sm text-[#8dadff] leading-relaxed mb-6">
                  1990 yılından itibaren genel kurul zabıtları ve özel basılı
                  nüshalar fiziki arşivimizde muhafaza edilmektedir.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setReqSuccess(false);
                    setRequestModalOpen(true);
                  }}
                  className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold bg-[#fde68a] text-[#92400e] hover:bg-white transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-lg">mail</span>
                  <span>Resmi Belge İstem Formu</span>
                </button>
                <a
                  className="text-center text-[11px] font-bold text-[#8dadff] hover:text-white pt-2 transition-colors uppercase tracking-wider"
                  href="mailto:hukuk@ahid.org.tr"
                >
                  Hukuk Masası: hukuk@ahid.org.tr
                </a>
              </div>
            </div>
          </div>

          {/* Official Legal Governance & DERBİS Compliance Notice Box */}
          <div className="bg-[#dee8ff]/50 rounded-2xl p-8 flex flex-col md:flex-row gap-6 items-start">
            <div className="w-14 h-14 rounded-2xl bg-white text-[#002869] flex items-center justify-center shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-3xl">
                verified_user
              </span>
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-[#002869]">
                  Yasal Güvence, DERBİS Akreditasyonu ve Fikri Mülkiyet Bildirimi
                </h4>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#ebf2fc] text-[#002869]">
                  T.C. 5253 Sayılı Kanun
                </span>
              </div>
              <p className="text-sm text-[#334155] leading-relaxed">
                Bu kütüphanede yer alan tüm resmi yönetmelikler, karar özetleri ve
                yönergeler Ankara Halkla İlişkiler Derneği (Kütük No: 06-038-112)
                tarafından kamuoyunu ve üyeleri bilgilendirme amacıyla
                yayımlanmaktadır. Hakemli raporlar ve barometrelerin akademik atıf
                kuralları haricinde ticari amaçla izinsiz çoğaltılması 5846 sayılı
                Fikir ve Sanat Eserleri Kanunu uyarınca yasaktır.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Resmi Arşiv Talebi Modal */}
      {requestModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#dee8ff]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#002869]">
                Resmi Belge &amp; Arşiv İstem Formu
              </h3>
              <button
                type="button"
                onClick={() => setRequestModalOpen(false)}
                className="p-1.5 rounded-lg text-[#64748b] hover:bg-[#f0f3ff] cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {reqSuccess ? (
              <div className="py-6 text-center flex flex-col items-center gap-3">
                <span className="material-symbols-outlined text-5xl text-emerald-600">
                  check_circle
                </span>
                <h4 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-[#002869]">
                  Arşiv Talebiniz Kaydedildi
                </h4>
                <p className="text-sm text-[#64748b]">
                  Talebiniz AHİD Genel Sekreterliği ve Mevzuat Masasına
                  iletilmiştir. En kısa sürede tarafınıza dönüş yapılacaktır.
                </p>
                <button
                  type="button"
                  onClick={() => setRequestModalOpen(false)}
                  className="mt-2 px-6 py-2.5 rounded-lg bg-[#002869] text-white text-sm font-semibold cursor-pointer"
                >
                  Kapat
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleArchiveRequestSubmit}
                className="flex flex-col gap-4"
              >
                <input
                  type="text"
                  required
                  placeholder="Adınız Soyadınız / Kurumunuz"
                  value={reqForm.name}
                  onChange={(e) =>
                    setReqForm((p) => ({ ...p, name: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 rounded-lg bg-[#f0f3ff] text-sm outline-none focus:ring-2 focus:ring-[#002869]"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="email"
                    required
                    placeholder="E-posta Adresiniz"
                    value={reqForm.email}
                    onChange={(e) =>
                      setReqForm((p) => ({ ...p, email: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 rounded-lg bg-[#f0f3ff] text-sm outline-none focus:ring-2 focus:ring-[#002869]"
                  />
                  <input
                    type="tel"
                    placeholder="Telefon Numaranız"
                    value={reqForm.phone}
                    onChange={(e) =>
                      setReqForm((p) => ({ ...p, phone: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 rounded-lg bg-[#f0f3ff] text-sm outline-none focus:ring-2 focus:ring-[#002869]"
                  />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Talep Edilen Belge / Dönem / Karar No"
                  value={reqForm.subject}
                  onChange={(e) =>
                    setReqForm((p) => ({ ...p, subject: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 rounded-lg bg-[#f0f3ff] text-sm outline-none focus:ring-2 focus:ring-[#002869]"
                />
                <textarea
                  rows={4}
                  required
                  placeholder="Talep gerekçeniz ve detaylar..."
                  value={reqForm.message}
                  onChange={(e) =>
                    setReqForm((p) => ({ ...p, message: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 rounded-lg bg-[#f0f3ff] text-sm outline-none focus:ring-2 focus:ring-[#002869]"
                />
                <button
                  type="submit"
                  disabled={reqSubmitting}
                  className="w-full py-3 rounded-lg bg-[#002869] hover:bg-[#225aba] text-white font-semibold text-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {reqSubmitting
                    ? "Gönderiliyor..."
                    : "Resmi Arşiv Talebini Gönder"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
