"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface BoardMember {
  id: number;
  full_name: string;
  title: string;
  organization: string | null;
  category: string;
  photo_url: string | null;
  bio: string | null;
  order_no: number | null;
  is_active: boolean | null;
  term_period: string | null;
  term_label: string | null;
  is_founding_president: boolean | null;
  quote: string | null;
  focus_areas: string | null;
  achievements: string[] | null;
  registry_info: string | null;
}

type TabKey = "presidents" | "advisory" | "supervisory" | "honor" | "youth";

export default function BaskanlarVeKurullarPage() {
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("presidents");

  // Archive request modal state
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
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
    fetch("/api/board")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.members)) {
          setMembers(data.members);
        }
      })
      .catch((err) => console.error("Failed to fetch board members:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleArchiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReqSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...reqForm,
          department: "Kurumsal Arşiv & Sicil Masası",
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

  // Filter members by tab categories
  const presidents = members.filter(
    (m) =>
      m.category === "past_president" ||
      m.category === "president" ||
      m.category === "baskanlar" ||
      m.is_founding_president
  );
  const foundingPresident =
    presidents.find((m) => m.is_founding_president) || null;
  const termPresidents = foundingPresident
    ? presidents.filter((m) => m.id !== foundingPresident.id)
    : presidents;

  const advisoryMembers = members.filter(
    (m) =>
      m.category === "advisory" ||
      m.category === "danisma_kurulu" ||
      m.category === "yuksek_istisare"
  );
  const supervisoryMembers = members.filter(
    (m) =>
      m.category === "supervisory" ||
      m.category === "denetim_kurulu" ||
      m.category === "audit" ||
      m.category === "etik_kurulu"
  );
  const honorMembers = members.filter(
    (m) => m.category === "honor" || m.category === "onur_kurulu"
  );
  const youthMembers = members.filter(
    (m) => m.category === "youth" || m.category === "genc_konsey"
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#f9f9ff] text-[#101c2e]">
      <Navbar />

      <main className="w-full pt-[7.5rem] bg-[#f9f9ff] flex-1">
        {/* Top Heritage Hero Scrim & Editorial Header */}
        <section className="relative w-full bg-gradient-to-b from-[#dee8ff] via-[#f9f9ff] to-[#f9f9ff] px-4 sm:px-8 lg:px-12 py-10">
          <div className="max-w-[1520px] w-full mx-auto flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <nav
                aria-label="Erişim Yolu"
                className="flex items-center gap-1.5 text-xs font-semibold text-[#64748b]"
              >
                <Link className="hover:text-[#002869] transition-colors" href="/">
                  Ana Sayfa
                </Link>
                <span className="material-symbols-outlined text-xs">
                  chevron_right
                </span>
                <Link
                  className="hover:text-[#002869] transition-colors"
                  href="/kurumsal"
                >
                  Kurumsal
                </Link>
                <span className="material-symbols-outlined text-xs">
                  chevron_right
                </span>
                <span className="text-[#002869] font-semibold">
                  Başkanlarımız &amp; Kurullarımız
                </span>
              </nav>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#d9e2ff] text-[#00429a] text-[11px] font-bold tracking-wider uppercase shadow-xs">
                <span className="material-symbols-outlined text-sm">
                  history_edu
                </span>
                <span>1990 — 2026 · Kurumsal Hafıza</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
              <div className="lg:col-span-8 flex flex-col gap-2">
                <div className="inline-flex items-center gap-2 text-[#92400e] text-sm uppercase tracking-wider font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#92400e] animate-pulse" />
                  Başkent Diplomasisi ve İtibar Yönetişimi
                </div>
                <h1 className="font-['Plus_Jakarta_Sans'] text-3xl sm:text-4xl text-[#002869] font-extrabold tracking-tight">
                  1990&apos;dan Bugüne: Başkanlarımız ve Yetkili Kurullarımız
                </h1>
                <p className="text-base sm:text-lg text-[#334155] max-w-3xl leading-relaxed">
                  Başkent Ankara’da halkla ilişkiler mesleğinin kurumsallaşmasına,
                  akademik standartlarına ve kamusal itibarına 1990 yılından bu
                  yana öncülük eden genel başkanlarımız, denetim, danışma ve onur
                  kurullarımızın resmi tarihçesi.
                </p>
              </div>

              <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-2.5 justify-end">
                <Link
                  href="/kaynaklar"
                  className="inline-flex items-center justify-center gap-2 bg-[#002869] text-white hover:bg-[#225aba] px-5 py-3 rounded-lg shadow-sm transition-all text-sm font-semibold"
                >
                  <span className="material-symbols-outlined text-lg">
                    folder_open
                  </span>
                  <span>Resmi Mevzuat &amp; Karar Arşivi</span>
                </Link>
                <button
                  onClick={() => {
                    setReqSuccess(false);
                    setArchiveModalOpen(true);
                  }}
                  className="inline-flex items-center justify-center gap-2 bg-white text-[#002869] hover:bg-[#ebf2fc] px-5 py-3 rounded-lg shadow-xs border border-[#dee8ff] transition-all text-sm font-semibold cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-lg">
                    receipt_long
                  </span>
                  <span>Kurumsal Arşiv Talebi (Dilekçe)</span>
                </button>
              </div>
            </div>

            {/* Key Governance Stats Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              <div className="bg-white p-4 rounded-xl shadow-xs border border-[#e7eeff] flex flex-col">
                <div className="flex items-center justify-between text-[#225aba]">
                  <span className="font-['Plus_Jakarta_Sans'] text-3xl text-[#002869] font-bold">
                    {loading ? "—" : presidents.length}
                  </span>
                  <span className="material-symbols-outlined text-2xl text-[#225aba]">
                    hourglass_top
                  </span>
                </div>
                <span className="text-sm text-[#101c2e] font-semibold mt-1">
                  Dönem Başkanı Kaydı
                </span>
                <span className="text-[11px] font-bold text-[#64748b] uppercase">
                  1990 — 2026 Kronoloji
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-xs border border-[#e7eeff] flex flex-col">
                <div className="flex items-center justify-between text-[#92400e]">
                  <span className="font-['Plus_Jakarta_Sans'] text-3xl text-[#92400e] font-bold">
                    {loading ? "—" : advisoryMembers.length}
                  </span>
                  <span className="material-symbols-outlined text-2xl text-[#92400e]">
                    psychology
                  </span>
                </div>
                <span className="text-sm text-[#101c2e] font-semibold mt-1">
                  Yüksek İstişare Üyesi
                </span>
                <span className="text-[11px] font-bold text-[#64748b] uppercase">
                  Danışma Kurulu
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-xs border border-[#e7eeff] flex flex-col">
                <div className="flex items-center justify-between text-[#002869]">
                  <span className="font-['Plus_Jakarta_Sans'] text-3xl text-[#002869] font-bold">
                    {loading
                      ? "—"
                      : supervisoryMembers.length + honorMembers.length}
                  </span>
                  <span className="material-symbols-outlined text-2xl text-[#002869]">
                    gavel
                  </span>
                </div>
                <span className="text-sm text-[#101c2e] font-semibold mt-1">
                  Denetim &amp; Onur Üyesi
                </span>
                <span className="text-[11px] font-bold text-[#64748b] uppercase">
                  Şeffaflık &amp; Etik Heyeti
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-xs border border-[#e7eeff] flex flex-col">
                <div className="flex items-center justify-between text-[#225aba]">
                  <span className="font-['Plus_Jakarta_Sans'] text-3xl text-[#225aba] font-bold">
                    %100
                  </span>
                  <span className="material-symbols-outlined text-2xl text-[#225aba]">
                    account_balance
                  </span>
                </div>
                <span className="text-sm text-[#101c2e] font-semibold mt-1">
                  DERBİS Akreditasyon
                </span>
                <span className="text-[11px] font-bold text-[#64748b] uppercase">
                  Resmi Sicil Uyumlu
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Section Tabs Navigation */}
        <section className="sticky top-[6.5rem] z-30 bg-white/95 backdrop-blur-md shadow-xs border-y border-[#e7eeff]">
          <div className="max-w-[1520px] w-full mx-auto px-4 sm:px-8 lg:px-12 overflow-x-auto no-scrollbar">
            <div className="flex lg:grid lg:grid-cols-5 gap-2.5 lg:gap-3.5 py-3 lg:py-3.5 w-max lg:w-full">
              {[
                {
                  key: "presidents" as TabKey,
                  icon: "supervisor_account",
                  label: "Dönem Genel Başkanları (1990 - 2026)",
                },
                {
                  key: "advisory" as TabKey,
                  icon: "psychology",
                  label: "Yüksek İstişare & Danışma Kurulu",
                },
                {
                  key: "supervisory" as TabKey,
                  icon: "gavel",
                  label: "Denetim & Disiplin Heyetleri",
                },
                {
                  key: "honor" as TabKey,
                  icon: "military_tech",
                  label: "Onur Kurulu Üyeleri",
                },
                {
                  key: "youth" as TabKey,
                  icon: "school",
                  label: "Genç İletişimciler Konseyi",
                },
              ].map((t) => {
                const isSelected = activeTab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    type="button"
                    className={
                      isSelected
                        ? "shrink-0 lg:w-full inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 lg:py-3.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#002869] shadow-sm transition-all cursor-pointer text-center whitespace-nowrap lg:whitespace-normal"
                        : "shrink-0 lg:w-full inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 lg:py-3.5 rounded-xl text-xs sm:text-sm font-semibold text-[#334155] bg-[#f8faff] hover:text-[#002869] hover:bg-[#ebf2fc] border border-[#e7eeff] transition-all cursor-pointer text-center whitespace-nowrap lg:whitespace-normal"
                    }
                  >
                    <span className="material-symbols-outlined text-lg shrink-0">
                      {t.icon}
                    </span>
                    <span className="leading-snug">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Main Content Layout */}
        <div className="max-w-[1520px] mx-auto w-full px-4 sm:px-8 lg:px-12 py-10 flex flex-col gap-12">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="bg-white rounded-xl p-6 h-64 border border-[#e7eeff]"
                />
              ))}
            </div>
          ) : (
            <>
              {/* TAB 1: Dönem Genel Başkanları */}
              {activeTab === "presidents" && (
                <div className="flex flex-col gap-10">
                  {presidents.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center shadow-xs border border-[#dee8ff] flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-[#ebf2fc] text-[#002869] flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl">
                          history_edu
                        </span>
                      </div>
                      <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#002869]">
                        Henüz Dönem Başkanı Kaydı Eklenmedi
                      </h2>
                      <p className="text-sm text-[#64748b] max-w-xl leading-relaxed">
                        Veritabanında 1990&apos;dan bugüne görev yapmış dönem genel
                        başkanlarına ait kayıt bulunmamaktadır. Yönetim portalı
                        üzerinden başkan ve kurul kayıtları eklendiğinde bu alanda
                        kronolojik olarak görüntülenecektir.
                      </p>
                      <Link
                        href="/kurumsal"
                        className="px-5 py-2.5 rounded-lg bg-[#002869] text-white text-sm font-semibold hover:bg-[#0b3d91] transition-colors"
                      >
                        Kurumsal Sayfaya Dön
                      </Link>
                    </div>
                  ) : (
                    <>
                      {/* Founding President Spotlight Card */}
                      {foundingPresident && (
                        <article className="bg-gradient-to-br from-[#002869] via-[#0b3d91] to-[#253144] rounded-xl text-white overflow-hidden shadow-xl relative">
                          <div className="p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
                            <div className="lg:col-span-4 flex flex-col items-center sm:items-start">
                              <div className="relative w-64 h-80 rounded-lg overflow-hidden shadow-2xl bg-[#253144]">
                                {foundingPresident.photo_url ? (
                                  <img
                                    className="w-full h-full object-cover grayscale contrast-125 hover:grayscale-0 transition-all duration-700"
                                    alt={foundingPresident.full_name}
                                    src={foundingPresident.photo_url}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-white/30">
                                    <span className="material-symbols-outlined text-6xl">
                                      person
                                    </span>
                                  </div>
                                )}
                                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#002869] via-[#002869]/80 to-transparent p-4">
                                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#fde68a] block">
                                    Kurucu Genel Başkan
                                  </span>
                                  <span className="text-xs font-semibold text-white">
                                    {foundingPresident.term_period ||
                                      "1990 — 1994"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="lg:col-span-8 flex flex-col gap-4">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="bg-[#fde68a] text-[#92400e] text-[11px] px-3 py-1 rounded font-bold uppercase tracking-wider">
                                  {foundingPresident.registry_info ||
                                    "Kurucu Genel Başkan · Sicil No: 001"}
                                </span>
                                <span className="bg-white/10 text-white text-[11px] px-3 py-1 rounded tracking-wider">
                                  {foundingPresident.term_period ||
                                    "1990 — 1994 Görev Dönemi"}
                                </span>
                              </div>
                              <div>
                                <h2 className="font-['Plus_Jakarta_Sans'] text-3xl text-white font-extrabold tracking-tight">
                                  {foundingPresident.full_name}
                                </h2>
                                <p className="text-base text-[#dee8ff] mt-1">
                                  {foundingPresident.title}
                                  {foundingPresident.organization
                                    ? ` · ${foundingPresident.organization}`
                                    : ""}
                                </p>
                              </div>

                              {foundingPresident.quote && (
                                <blockquote className="bg-white/5 backdrop-blur-xs p-4 rounded-lg flex flex-col gap-2">
                                  <p className="text-base italic text-[#ecf1ff] leading-relaxed">
                                    “{foundingPresident.quote}”
                                  </p>
                                </blockquote>
                              )}

                              {foundingPresident.bio && (
                                <p className="text-sm text-[#dee8ff] leading-relaxed">
                                  {foundingPresident.bio}
                                </p>
                              )}
                            </div>
                          </div>
                        </article>
                      )}

                      {/* Chronological Leadership Grid */}
                      {termPresidents.length > 0 && (
                        <div className="flex flex-col gap-6">
                          <div>
                            <span className="text-[11px] uppercase tracking-wider text-[#225aba] font-bold">
                              Başkent İletişiminin Mihenk Taşları
                            </span>
                            <h3 className="font-['Plus_Jakarta_Sans'] text-2xl text-[#002869] font-bold">
                              Dönem Genel Başkanları Kronolojisi
                            </h3>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {termPresidents.map((pres) => (
                              <article
                                key={pres.id}
                                className="bg-white rounded-xl p-6 shadow-xs hover:shadow-md border border-[#e7eeff] transition-all flex flex-col justify-between group"
                              >
                                <div className="flex flex-col gap-4">
                                  <div className="flex items-center justify-between">
                                    <span className="bg-[#ebf2fc] text-[#002869] text-[11px] px-2.5 py-1 rounded font-bold uppercase tracking-wider">
                                      {pres.term_period || "Görev Dönemi"}
                                    </span>
                                    <span className="text-[11px] font-bold text-[#64748b]">
                                      {pres.term_label || ""}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-4">
                                    {pres.photo_url ? (
                                      <img
                                        className="w-16 h-16 rounded-full object-cover shrink-0"
                                        alt={pres.full_name}
                                        src={pres.photo_url}
                                      />
                                    ) : (
                                      <div className="w-16 h-16 rounded-full bg-[#ebf2fc] text-[#002869] flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-2xl">
                                          person
                                        </span>
                                      </div>
                                    )}
                                    <div className="min-w-0">
                                      <h4 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-[#101c2e] truncate">
                                        {pres.full_name}
                                      </h4>
                                      <p className="text-xs text-[#64748b] line-clamp-1">
                                        {pres.title}
                                        {pres.organization
                                          ? ` · ${pres.organization}`
                                          : ""}
                                      </p>
                                    </div>
                                  </div>

                                  {(pres.focus_areas || pres.bio) && (
                                    <div className="bg-[#f0f3ff] p-3 rounded-lg">
                                      <span className="text-[11px] uppercase text-[#225aba] font-bold block mb-1">
                                        Dönem Odak Alanları:
                                      </span>
                                      <p className="text-xs text-[#434652] leading-relaxed">
                                        {pres.focus_areas || pres.bio}
                                      </p>
                                    </div>
                                  )}

                                  {pres.achievements &&
                                    pres.achievements.length > 0 && (
                                      <ul className="flex flex-col gap-1.5 text-xs text-[#334155]">
                                        {pres.achievements.map((ach, idx) => (
                                          <li
                                            key={idx}
                                            className="flex items-center gap-2"
                                          >
                                            <span className="material-symbols-outlined text-[#225aba] text-sm">
                                              check_circle
                                            </span>
                                            <span>{ach}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                </div>

                                {pres.registry_info && (
                                  <div className="pt-4 mt-4 border-t border-[#f0f3ff] flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-[#64748b]">
                                      {pres.registry_info}
                                    </span>
                                  </div>
                                )}
                              </article>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* TAB 2: Yüksek İstişare & Danışma Kurulu */}
              {activeTab === "advisory" && (
                <div className="bg-white p-8 rounded-2xl shadow-xs border border-[#e7eeff] flex flex-col gap-6">
                  <div>
                    <span className="text-[11px] text-[#92400e] font-bold uppercase tracking-wider">
                      Kurumsal Akıl ve Stratejik Rehberlik
                    </span>
                    <h3 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#002869]">
                      Yüksek İstişare &amp; Danışma Kurulu
                    </h3>
                    <p className="text-sm text-[#64748b] mt-1 max-w-3xl">
                      Derneğin stratejik hedeflerini, kamu ilişkileri
                      politikalarını ve akademik vizyonunu değerlendiren kıdemli
                      danışma heyetimiz.
                    </p>
                  </div>

                  {advisoryMembers.length === 0 ? (
                    <div className="py-10 text-center bg-[#f0f3ff]/50 rounded-xl flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-3xl text-[#002869]">
                        psychology
                      </span>
                      <p className="text-sm font-semibold text-[#002869]">
                        Yüksek İstişare &amp; Danışma Kurulu üye kaydı
                        bulunmamaktadır.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {advisoryMembers.map((m) => (
                        <div
                          key={m.id}
                          className="bg-[#f0f3ff] p-4 rounded-xl flex items-start gap-4"
                        >
                          <div className="w-12 h-12 rounded-lg bg-[#ebf2fc] flex items-center justify-center text-[#002869] shrink-0">
                            <span className="material-symbols-outlined">
                              account_balance
                            </span>
                          </div>
                          <div>
                            <span className="text-[11px] font-bold text-[#225aba] uppercase">
                              {m.title}
                            </span>
                            <h4 className="font-['Plus_Jakarta_Sans'] text-base text-[#101c2e] font-bold">
                              {m.full_name}
                            </h4>
                            {m.organization && (
                              <p className="text-xs text-[#002869] font-medium">
                                {m.organization}
                              </p>
                            )}
                            {m.bio && (
                              <p className="text-xs text-[#64748b] mt-1">
                                {m.bio}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Denetim & Disiplin Heyetleri */}
              {activeTab === "supervisory" && (
                <div className="bg-white p-8 rounded-2xl shadow-xs border border-[#e7eeff] flex flex-col gap-6">
                  <div>
                    <span className="text-[11px] text-[#002869] font-bold uppercase tracking-wider">
                      Şeffaflık &amp; İdari Denetim
                    </span>
                    <h3 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#002869]">
                      Denetim ve Etik Kurul Heyetleri
                    </h3>
                    <p className="text-sm text-[#64748b] mt-1 max-w-3xl">
                      T.C. Dernekler Mevzuatı ve AHİD Tüzüğü uyarınca idari, mali
                      ve etik süreçlerin denetimini üstlenen bağımsız heyetlerimiz.
                    </p>
                  </div>

                  {supervisoryMembers.length === 0 ? (
                    <div className="py-10 text-center bg-[#f0f3ff]/50 rounded-xl flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-3xl text-[#002869]">
                        gavel
                      </span>
                      <p className="text-sm font-semibold text-[#002869]">
                        Denetim ve Disiplin Kurulu üye kaydı bulunmamaktadır.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {supervisoryMembers.map((m) => (
                        <div
                          key={m.id}
                          className="p-4 bg-[#f0f3ff] rounded-xl flex items-center justify-between"
                        >
                          <div>
                            <span className="text-[11px] text-[#225aba] uppercase font-bold block">
                              {m.title}
                            </span>
                            <span className="text-base font-bold text-[#101c2e]">
                              {m.full_name}
                            </span>
                            {m.organization && (
                              <p className="text-xs text-[#64748b]">
                                {m.organization}
                              </p>
                            )}
                          </div>
                          <span className="material-symbols-outlined text-[#225aba]">
                            verified_user
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: Onur Kurulu Üyeleri */}
              {activeTab === "honor" && (
                <div className="bg-white p-8 rounded-2xl shadow-xs border border-[#e7eeff] flex flex-col gap-6">
                  <div>
                    <span className="text-[11px] text-[#92400e] font-bold uppercase tracking-wider">
                      Mesleki Liyakat &amp; Vefa
                    </span>
                    <h3 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#002869]">
                      Onur Kurulu Üyelerimiz
                    </h3>
                    <p className="text-sm text-[#64748b] mt-1 max-w-3xl">
                      Meslek ahlakı, dernek ilkeleri ve Türkiye&apos;de halkla
                      ilişkiler mesleğine üstün hizmetlerde bulunmuş saygıdeğer
                      üstatlarımız.
                    </p>
                  </div>

                  {honorMembers.length === 0 ? (
                    <div className="py-10 text-center bg-[#f0f3ff]/50 rounded-xl flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-3xl text-[#92400e]">
                        workspace_premium
                      </span>
                      <p className="text-sm font-semibold text-[#002869]">
                        Onur Kurulu üye kaydı bulunmamaktadır.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {honorMembers.map((m) => (
                        <div
                          key={m.id}
                          className="bg-[#f0f3ff] p-6 rounded-xl text-center flex flex-col items-center gap-2"
                        >
                          <div className="w-16 h-16 rounded-full bg-[#ebf2fc] flex items-center justify-center text-[#92400e]">
                            <span className="material-symbols-outlined text-3xl">
                              workspace_premium
                            </span>
                          </div>
                          <h4 className="font-['Plus_Jakarta_Sans'] text-base text-[#101c2e] font-bold">
                            {m.full_name}
                          </h4>
                          <span className="px-2 py-0.5 rounded bg-[#d7e3fc] text-[#002869] text-[11px] font-bold uppercase">
                            {m.title}
                          </span>
                          {m.bio && (
                            <p className="text-xs text-[#64748b] leading-relaxed">
                              {m.bio}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: Genç İletişimciler Konseyi */}
              {activeTab === "youth" && (
                <div className="bg-gradient-to-r from-[#ebf2fc] via-white to-[#f0f3ff] p-8 rounded-2xl shadow-xs border border-[#e7eeff] flex flex-col gap-6">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    <div className="lg:col-span-8 flex flex-col gap-3">
                      <span className="bg-[#225aba] text-white text-[11px] px-3 py-1 rounded w-fit font-bold uppercase tracking-wider">
                        Geleceğin İletişim Liderleri
                      </span>
                      <h3 className="font-['Plus_Jakarta_Sans'] text-2xl sm:text-3xl font-bold text-[#002869]">
                        Genç İletişimciler Danışma Konseyi (AHİD Genç)
                      </h3>
                      <p className="text-sm sm:text-base text-[#334155] max-w-2xl leading-relaxed">
                        Ankara’daki iletişim fakültesi öğrencilerinin ve yeni mezun
                        meslek profesyonellerinin sesi olan konsey; dernek
                        yönetimine genç neslin bakış açısını taşır, dijital
                        trendleri ve akademi-sektör entegrasyonunu hızlandırır.
                      </p>
                    </div>
                    <div className="lg:col-span-4 flex flex-col gap-2.5">
                      <Link
                        href="/uyelik#basvuru-formu"
                        className="w-full inline-flex items-center justify-center gap-2 bg-[#002869] text-white hover:bg-[#225aba] px-5 py-3 rounded-lg text-sm font-bold transition-all shadow-xs"
                      >
                        <span className="material-symbols-outlined text-lg">
                          person_add
                        </span>
                        <span>Genç AHİD&apos;e Katıl (Öğrenci Üyeliği)</span>
                      </Link>
                      <Link
                        href="/etkinlikler"
                        className="w-full inline-flex items-center justify-center gap-2 bg-white text-[#002869] hover:bg-[#ebf2fc] px-5 py-3 rounded-lg text-sm font-semibold border border-[#dee8ff] transition-all"
                      >
                        <span className="material-symbols-outlined text-lg">
                          calendar_month
                        </span>
                        <span>Gençlik Etkinlik Takvimi</span>
                      </Link>
                    </div>
                  </div>

                  {youthMembers.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-[#dee8ff]">
                      {youthMembers.map((m) => (
                        <div
                          key={m.id}
                          className="bg-white p-4 rounded-xl border border-[#e7eeff]"
                        >
                          <span className="text-[11px] font-bold text-[#225aba] uppercase">
                            {m.title}
                          </span>
                          <h4 className="font-bold text-[#101c2e] mt-0.5">
                            {m.full_name}
                          </h4>
                          {m.organization && (
                            <p className="text-xs text-[#64748b]">
                              {m.organization}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Official Historical Archive & Registry Callout Box */}
          <section className="bg-[#dee8ff] rounded-2xl p-6 lg:p-10 shadow-xs relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-8 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[#002869] text-[11px] uppercase font-bold tracking-wider">
                  <span className="material-symbols-outlined text-xl text-[#225aba]">
                    inventory_2
                  </span>
                  <span>Resmi Tescil ve Fiziksel Arşiv Güvencesi</span>
                </div>
                <h3 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#002869]">
                  Eski Dönem Tutanak ve Resmi Arşiv Talep Servisi
                </h3>
                <p className="text-sm sm:text-base text-[#334155] leading-relaxed">
                  1990 yılından bugüne derneğimiz genel kurul zabıtları, tüzük
                  tadil kararları, kurucu heyet üye kayıt defteri ve basılı yayın
                  arşivi Ankara Valiliği İl Sivil Toplumla İlişkiler Müdürlüğü ile
                  koordineli fiziki ve dijital arşivimizde muhafaza edilmektedir.
                </p>
              </div>
              <div className="lg:col-span-4 flex flex-col gap-2.5">
                <button
                  onClick={() => {
                    setReqSuccess(false);
                    setArchiveModalOpen(true);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#002869] text-white hover:bg-[#225aba] px-5 py-3 rounded-lg text-sm font-bold transition-all shadow-sm cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-lg">
                    edit_document
                  </span>
                  <span>Resmi Belge / Tutanak Talep Formu</span>
                </button>
                <a
                  href="tel:+903122319090"
                  className="w-full inline-flex items-center justify-center gap-2 bg-white text-[#434652] hover:text-[#002869] hover:bg-[#ebf2fc] px-5 py-3 rounded-lg text-sm font-semibold transition-all"
                >
                  <span className="material-symbols-outlined text-lg">
                    support_agent
                  </span>
                  <span>Arşiv İrtibat Masası (0312 231 90 90)</span>
                </a>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Archive Request Modal */}
      {archiveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#dee8ff]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#002869]">
                Resmi Tutanak &amp; Kurumsal Arşiv Talebi
              </h3>
              <button
                type="button"
                onClick={() => setArchiveModalOpen(false)}
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
                  Dilekçeniz Kayda Alındı
                </h4>
                <p className="text-sm text-[#64748b]">
                  Kurumsal arşiv talebiniz AHİD Genel Sekreterliğine iletilmiştir.
                </p>
                <button
                  type="button"
                  onClick={() => setArchiveModalOpen(false)}
                  className="mt-2 px-6 py-2.5 rounded-lg bg-[#002869] text-white text-sm font-semibold cursor-pointer"
                >
                  Tamam
                </button>
              </div>
            ) : (
              <form onSubmit={handleArchiveSubmit} className="flex flex-col gap-4">
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
                  placeholder="Talep Edilen Dönem / Genel Kurul Zabıt Konusu"
                  value={reqForm.subject}
                  onChange={(e) =>
                    setReqForm((p) => ({ ...p, subject: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 rounded-lg bg-[#f0f3ff] text-sm outline-none focus:ring-2 focus:ring-[#002869]"
                />
                <textarea
                  rows={4}
                  required
                  placeholder="Akademik araştırma veya resmi talep detaylarınızı belirtiniz..."
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
                  {reqSubmitting ? "İletiliyor..." : "Arşiv Talebini Gönder"}
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
