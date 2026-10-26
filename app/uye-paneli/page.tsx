"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function UyePaneliPage() {
  const [identifierInput, setIdentifierInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<any>(null);
  const [application, setApplication] = useState<any>(null);
  const [dues, setDues] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [lookupError, setLookupError] = useState("");

  // Modals for Fast Action Desk
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: "",
    title: "",
    phone: "",
    email: "",
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editNotice, setEditNotice] = useState("");

  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketName, setTicketName] = useState("");
  const [ticketEmail, setTicketEmail] = useState("");
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(false);

  const fetchPortalData = async (identifier?: string, userId?: string) => {
    setLoading(true);
    setLookupError("");
    try {
      const params = new URLSearchParams();
      if (userId) params.set("user_id", userId);
      else if (identifier) params.set("identifier", identifier);

      const res = await fetch(`/api/member-portal?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setMember(data.member || null);
        setApplication(data.application || null);
        setDues(data.dues || []);
        setRegistrations(data.registrations || []);
        setNotices(data.notices || []);
        setUpcomingEvents(data.upcomingEvents || []);

        if (data.member) {
          setEditForm({
            full_name: data.member.full_name || "",
            title: data.member.title || "",
            phone: data.member.phone || "",
            email: data.member.email || "",
          });
          localStorage.setItem("ahid_member_identifier", data.member.email);
        } else if (identifier && !data.application) {
          setLookupError(
            "Girilen e-posta, T.C. kimlik veya sicil numarasına ait aktif üye ya da başvuru kaydı bulunamadı."
          );
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? localStorage.getItem("ahid_member_identifier")
        : null;
    if (saved) {
      setIdentifierInput(saved);
      fetchPortalData(saved);
    } else {
      fetchPortalData();
    }
  }, []);

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifierInput.trim()) return;
    fetchPortalData(identifierInput.trim());
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("ahid_member_identifier");
    }
    setMember(null);
    setApplication(null);
    setDues([]);
    setRegistrations([]);
    setIdentifierInput("");
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;
    setEditSaving(true);
    setEditNotice("");
    try {
      const res = await fetch("/api/member-portal", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: member.id,
          ...editForm,
        }),
      });
      const data = await res.json();
      if (data.success && data.member) {
        setMember(data.member);
        setEditNotice("Bilgileriniz başarıyla güncellendi.");
        setTimeout(() => setEditModalOpen(false), 1200);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEditSaving(false);
    }
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTicketSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:
            member?.full_name ||
            (application
              ? `${application.first_name} ${application.last_name}`
              : ticketName),
          email: member?.email || application?.email || ticketEmail,
          subject: ticketSubject || "Üye Portalı Resmi Destek / Komisyon Talebi",
          message: ticketMessage,
          department: "Üye İlişkileri Genel Sekreterliği",
          type: "member_support",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTicketSuccess(true);
        setTicketMessage("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTicketSubmitting(false);
    }
  };

  const latestDue = dues[0] || null;

  return (
    <div className="min-h-screen flex flex-col bg-[#f9f9ff] text-[#101c2e]">
      <Navbar />

      <main className="w-full pt-[7.5rem] bg-[#f9f9ff] flex-1">
        {/* Portal Top Utility / Notification Strip */}
        <section className="w-full bg-[#f0f3ff] py-2.5 px-4 lg:px-14 border-b border-[#dee8ff]">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-center sm:text-left">
              <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">
                DERBİS E-Devlet Entegrasyonu: Senkronize Edildi
              </span>
              <span className="hidden sm:inline text-[#64748b] text-xs opacity-40">|</span>
              <span className="text-[11px] text-[#002869] font-bold uppercase">
                Protokol Ref: T.C. İÇB-DER-06-1990
              </span>
            </div>
            <div className="flex items-center gap-4 text-[#64748b] text-xs font-semibold">
              {(member || application) && (
                <button
                  onClick={handleLogout}
                  className="text-[#002869] hover:text-[#225aba] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-sm">
                    logout
                  </span>
                  Oturumu Kapat
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Member Identity / Lookup Header */}
        <section className="w-full bg-white py-10 shadow-xs border-b border-[#e7eeff]">
          <div className="max-w-7xl mx-auto px-4 lg:px-14">
            {!member && !application ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 flex flex-col gap-3">
                  <div className="inline-flex items-center gap-2 self-start px-3 py-1 rounded-full bg-[#ebf2fc] text-[#002869] text-[11px] font-bold uppercase tracking-wider">
                    <span className="material-symbols-outlined text-sm">
                      badge
                    </span>
                    AHİD Dijital Üye &amp; Delege Portalı
                  </div>
                  <h1 className="font-['Plus_Jakarta_Sans'] text-3xl sm:text-4xl text-[#002869] font-bold tracking-tight">
                    Üye Sicil, Aidat ve Başvuru Sorgulama Masası
                  </h1>
                  <p className="text-sm sm:text-base text-[#64748b] leading-relaxed max-w-2xl">
                    Dijital üye kimlik kartınızı görüntülemek, yıllık aidat
                    sicilinizi incelemek, etkinlik katılım sertifikalarınıza
                    erişmek veya üyelik başvuru durumunuzu sorgulamak için kayıtlı
                    e-posta adresinizi, T.C. Kimlik numaranızı veya sicil/başvuru
                    numaranızı girin.
                  </p>
                </div>

                <div className="lg:col-span-5 bg-[#f8fafc] p-6 rounded-2xl border border-[#dee8ff] shadow-xs">
                  <form
                    onSubmit={handleLookupSubmit}
                    className="flex flex-col gap-3"
                  >
                    <label className="text-xs font-bold uppercase tracking-wider text-[#002869]">
                      Üye / Aday Sicil Sorgulama
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748b] text-lg">
                        person_search
                      </span>
                      <input
                        type="text"
                        required
                        value={identifierInput}
                        onChange={(e) => setIdentifierInput(e.target.value)}
                        placeholder="E-posta, T.C. Kimlik No veya Sicil/Başvuru No..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-[#c4c6d3] text-sm text-[#101c2e] focus:outline-none focus:ring-2 focus:ring-[#002869]"
                      />
                    </div>
                    {lookupError && (
                      <p className="text-xs text-[#ba1a1a] font-medium">
                        {lookupError}
                      </p>
                    )}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-[#002869] hover:bg-[#225aba] text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {loading ? "Sorgulanıyor..." : "Portala Eriş"}
                      </button>
                      <Link
                        href="/uyelik#basvuru-formu"
                        className="bg-[#ebf2fc] hover:bg-[#dee8ff] text-[#002869] font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors"
                      >
                        Yeni Başvuru
                      </Link>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-8 flex flex-col md:flex-row items-start md:items-center gap-6">
                  <div className="relative shrink-0">
                    {member?.avatar_url ? (
                      <img
                        className="w-24 h-24 md:w-28 md:h-28 rounded-xl object-cover shadow-md"
                        alt={member.full_name}
                        src={member.avatar_url}
                      />
                    ) : (
                      <div className="w-24 h-24 md:w-28 md:h-28 rounded-xl bg-[#002869] text-white flex items-center justify-center shadow-md">
                        <span className="material-symbols-outlined text-5xl">
                          person
                        </span>
                      </div>
                    )}
                    <div className="absolute -bottom-2 -right-2 bg-[#002869] text-white rounded px-2 py-0.5 shadow-xs flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-[#fde68a]">
                        verified
                      </span>
                      <span className="text-[11px] font-bold uppercase">
                        {member ? member.role || "Asil Üye" : "Aday Üye"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#ebf2fc] text-[#002869] font-bold uppercase">
                        Sicil / No:{" "}
                        {member?.member_no ||
                          application?.application_no ||
                          `#AHID-${member?.id}`}
                      </span>
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold">
                        ●{" "}
                        {member
                          ? "Aktif & Oy Hakkı Sahibi"
                          : `Başvuru Durumu: ${application?.status || "İncelemede"}`}
                      </span>
                    </div>
                    <h1 className="font-['Plus_Jakarta_Sans'] text-2xl sm:text-3xl text-[#002869] tracking-tight font-bold">
                      Hoş Geldiniz,{" "}
                      {member
                        ? member.full_name
                        : `${application.first_name} ${application.last_name}`}
                    </h1>
                    <p className="text-sm text-[#64748b] max-w-2xl">
                      {member?.title ||
                        application?.position ||
                        "AHİD Kurumsal İletişim Üyesi"}{" "}
                      {application?.organization
                        ? `| ${application.organization}`
                        : ""}
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-4 flex flex-col justify-end gap-2 bg-[#f8fafc] p-4 rounded-xl border border-[#e7eeff]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#64748b]">
                      Genel Kurul Yetki Durumu
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold bg-emerald-100/60 px-2 py-0.5 rounded">
                      <span className="material-symbols-outlined text-xs">
                        how_to_reg
                      </span>{" "}
                      {member ? "Hazirun Onaylı" : "Değerlendirmede"}
                    </span>
                  </div>
                  {member && (
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        onClick={() => setEditModalOpen(true)}
                        className="w-full inline-flex items-center justify-center gap-2 bg-[#002869] text-white hover:bg-[#225aba] py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors shadow-xs cursor-pointer"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-sm">
                          manage_accounts
                        </span>
                        <span>Bilgilerimi Güncelle</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Core Dashboard Grid: Cards & Verification */}
        <section className="w-full py-12 px-4 lg:px-14">
          <div className="max-w-7xl mx-auto flex flex-col gap-12">
            {/* Row 1: Primary Status, Digital ID & Dues Bento */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
              {/* Bento Card 1: Official Digital Member Card */}
              <div className="lg:col-span-5 bg-gradient-to-br from-[#002869] via-[#0b3d91] to-[#001947] text-white p-6 rounded-xl shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[320px]">
                <div className="relative z-10 flex items-start justify-between">
                  <div>
                    <span className="text-[11px] text-[#fde68a] uppercase tracking-widest font-bold block mb-1">
                      ANKARA HALKLA İLİŞKİLER DERNEĞİ
                    </span>
                    <p className="font-['Plus_Jakarta_Sans'] text-lg font-bold tracking-tight text-white">
                      DİJİTAL ÜYE KİMLİK KARTI
                    </p>
                    <p className="text-[11px] text-[#d7e3fc]/80 font-bold">
                      REPUBLIC OF TURKEY • PR ASSOCIATION OF ANKARA
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-3xl text-[#fde68a] opacity-90">
                    military_tech
                  </span>
                </div>

                <div className="relative z-10 my-4 grid grid-cols-3 gap-4 items-center">
                  <div className="col-span-2 flex flex-col gap-1">
                    <span className="text-[11px] text-[#b1c5ff]/80 font-bold">
                      ÜYE ADI / MEMBER NAME
                    </span>
                    <span className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-white tracking-wide uppercase">
                      {member
                        ? member.full_name
                        : application
                        ? `${application.first_name} ${application.last_name}`
                        : "SİCİL SORGULAYINIZ"}
                    </span>
                    <span className="text-[11px] text-[#fde68a] font-bold mt-1 uppercase">
                      STATÜ:{" "}
                      {member
                        ? member.role || "ASİL ÜYE"
                        : application
                        ? application.tier || "ADAY ÜYE"
                        : "OTURUM AÇILMADI"}
                    </span>
                    <span className="text-[11px] text-[#d7e3fc] font-mono">
                      NO:{" "}
                      {member?.member_no ||
                        application?.application_no ||
                        "—"}
                    </span>
                  </div>

                  <div className="flex flex-col items-center justify-center bg-white p-2.5 rounded-lg shadow-inner">
                    <svg
                      className="w-16 h-16 text-[#002869]"
                      viewBox="0 0 100 100"
                    >
                      <rect
                        fill="currentColor"
                        height="28"
                        width="28"
                        x="8"
                        y="8"
                      />
                      <rect
                        fill="#ffffff"
                        height="16"
                        width="16"
                        x="14"
                        y="14"
                      />
                      <rect
                        fill="currentColor"
                        height="8"
                        width="8"
                        x="18"
                        y="18"
                      />
                      <rect
                        fill="currentColor"
                        height="28"
                        width="28"
                        x="64"
                        y="8"
                      />
                      <rect
                        fill="#ffffff"
                        height="16"
                        width="16"
                        x="70"
                        y="14"
                      />
                      <rect
                        fill="currentColor"
                        height="8"
                        width="8"
                        x="74"
                        y="18"
                      />
                      <rect
                        fill="currentColor"
                        height="28"
                        width="28"
                        x="8"
                        y="64"
                      />
                      <rect
                        fill="#ffffff"
                        height="16"
                        width="16"
                        x="14"
                        y="70"
                      />
                      <rect
                        fill="currentColor"
                        height="8"
                        width="8"
                        x="18"
                        y="74"
                      />
                      <circle cx="50" cy="50" fill="currentColor" r="6" />
                    </svg>
                    <span className="text-[9px] text-[#002869] font-bold mt-1">
                      DERBİS QR
                    </span>
                  </div>
                </div>

                <div className="relative z-10 pt-2 bg-black/20 -mx-6 -mb-6 px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-[#fde68a]">
                      verified_user
                    </span>
                    <span className="text-[11px] font-bold text-[#dee8ff]">
                      DERBİS DOĞRULAMALI KİMLİK
                    </span>
                  </div>
                  <div className="text-[11px] text-[#d7e3fc] font-mono">
                    {member ? `ID #${member.id}` : "AHİD-1990"}
                  </div>
                </div>
              </div>

              {/* Bento Card 2: Financial Standing & Dues (Aidat Portalı) */}
              <div className="lg:col-span-4 bg-white p-6 rounded-xl shadow-xs border border-[#e7eeff] flex flex-col justify-between">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] text-[#64748b] uppercase tracking-wider font-bold">
                        Finansal Sicil &amp; Dernek Aidatı
                      </span>
                      <h3 className="font-['Plus_Jakarta_Sans'] text-xl text-[#002869] font-bold mt-1">
                        Aidat &amp; Mali Sicil
                      </h3>
                    </div>
                    <span className="p-2 rounded bg-[#ebf2fc] text-[#002869]">
                      <span className="material-symbols-outlined text-2xl">
                        account_balance_wallet
                      </span>
                    </span>
                  </div>

                  {!member ? (
                    <div className="bg-[#f0f3ff] p-5 rounded-lg text-center flex flex-col gap-2">
                      <p className="text-xs text-[#434652] leading-relaxed">
                        Aidat makbuzlarınızı ve cari dönem mali sicilinizi
                        görüntülemek için yukarıdaki alandan üye sicil sorgulaması
                        yapınız.
                      </p>
                    </div>
                  ) : dues.length === 0 ? (
                    <div className="bg-[#f0f3ff] p-5 rounded-lg flex flex-col gap-1">
                      <span className="text-sm font-bold text-[#002869]">
                        Kayıtlı Aidat Borcu Bulunmuyor
                      </span>
                      <p className="text-xs text-[#64748b]">
                        Üye sicilinizde ödenmemiş dönem aidatı veya bekleyen mali
                        yükümlülük kaydı bulunmamaktadır.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-[#f0f3ff] p-4 rounded-lg flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-[#101c2e]">
                            {latestDue.period} Dönemi
                          </span>
                          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-bold uppercase">
                            {latestDue.status === "paid" ? "ÖDENDİ" : latestDue.status}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#002869]">
                            ₺{Number(latestDue.amount).toLocaleString("tr-TR")}
                          </span>
                        </div>
                        {latestDue.receipt_no && (
                          <p className="text-[11px] text-[#64748b] mt-1">
                            Makbuz Ref: {latestDue.receipt_no}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-[#f0f3ff]">
                  <span className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">
                      shield_lock
                    </span>{" "}
                    DERBİS Mali Uyum
                  </span>
                  <Link
                    href="/iletisim"
                    className="text-xs text-[#002869] font-bold hover:underline inline-flex items-center gap-1"
                  >
                    Saymanlık İrtibat{" "}
                    <span className="material-symbols-outlined text-sm">
                      arrow_forward
                    </span>
                  </Link>
                </div>
              </div>

              {/* Bento Card 3: Events & Academic Certificates Status */}
              <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-xs border border-[#e7eeff] flex flex-col justify-between">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] text-[#64748b] uppercase tracking-wider font-bold">
                        Mesleki Kredi &amp; Katılım
                      </span>
                      <h3 className="font-['Plus_Jakarta_Sans'] text-xl text-[#002869] font-bold mt-1">
                        Gelişim Karnesi
                      </h3>
                    </div>
                    <span className="p-2 rounded bg-[#ebf2fc] text-[#002869]">
                      <span className="material-symbols-outlined text-2xl">
                        workspace_premium
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center gap-4 bg-[#f8fafc] p-4 rounded-lg">
                    <div className="w-12 h-12 rounded-full bg-[#ebf2fc] text-[#002869] flex items-center justify-center font-bold text-lg shrink-0">
                      {registrations.length}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-['Plus_Jakarta_Sans'] text-base font-bold text-[#002869]">
                        {registrations.length} Etkinlik Kaydı
                      </span>
                      <span className="text-[11px] text-[#64748b]">
                        Onaylı Katılım &amp; LCV
                      </span>
                    </div>
                  </div>

                  {registrations.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {registrations.slice(0, 2).map((reg) => (
                        <div
                          key={reg.id}
                          className="p-2.5 rounded bg-[#ebf2fc]/60 flex items-center justify-between"
                        >
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold text-[#002869] truncate">
                              {reg.events?.title || `Etkinlik #${reg.event_id}`}
                            </span>
                            <span className="text-[11px] text-[#64748b]">
                              {reg.ticket_type || "Katılımcı"}
                            </span>
                          </div>
                          <span className="material-symbols-outlined text-[#002869] text-base">
                            verified
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#64748b] leading-relaxed">
                      Henüz kayıtlı etkinlik katılımınız veya sertifikanız
                      bulunmamaktadır.
                    </p>
                  )}
                </div>

                <div className="pt-4">
                  <Link
                    href="/etkinlikler"
                    className="w-full py-2 bg-[#e7eeff] text-[#002869] hover:bg-[#d7e3fc] text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <span>Etkinlik Takvimine Git</span>
                    <span className="material-symbols-outlined text-sm">
                      open_in_new
                    </span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Row 2: Executive Fast-Action Desk (Hızlı İşlem Masası) */}
            <div className="flex flex-col gap-4">
              <div>
                <span className="text-[11px] text-[#92400e] uppercase tracking-widest font-bold">
                  Resmi Büro İşlemleri
                </span>
                <h2 className="font-['Plus_Jakarta_Sans'] text-2xl text-[#002869] font-bold">
                  Hızlı İşlem &amp; Başvuru Masası
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-xs hover:shadow-md border border-[#e7eeff] transition-all duration-200 group flex flex-col justify-between">
                  <div className="flex flex-col gap-2">
                    <div className="w-12 h-12 rounded-lg bg-[#ebf2fc] text-[#002869] flex items-center justify-center group-hover:bg-[#002869] group-hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-2xl">
                        manage_accounts
                      </span>
                    </div>
                    <h4 className="font-['Plus_Jakarta_Sans'] text-lg text-[#002869] font-bold">
                      Bilgilerimi Güncelle
                    </h4>
                    <p className="text-xs text-[#64748b] leading-relaxed">
                      İletişim adresleri, temsil edilen ajans, kurum unvanı veya
                      akademik statü değişiklik beyanı.
                    </p>
                  </div>
                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        if (member) {
                          setEditModalOpen(true);
                        } else {
                          setTicketSubject("Üye Sicil Bilgileri Güncelleme Talebi");
                          setTicketSuccess(false);
                          setTicketModalOpen(true);
                        }
                      }}
                      className="inline-flex items-center gap-1 text-xs text-[#002869] font-bold group-hover:text-[#225aba] cursor-pointer"
                    >
                      Formu Aç{" "}
                      <span className="material-symbols-outlined text-sm">
                        arrow_forward
                      </span>
                    </button>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-xs hover:shadow-md border border-[#e7eeff] transition-all duration-200 group flex flex-col justify-between">
                  <div className="flex flex-col gap-2">
                    <div className="w-12 h-12 rounded-lg bg-[#ebf2fc] text-[#002869] flex items-center justify-center group-hover:bg-[#002869] group-hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-2xl">
                        assignment_ind
                      </span>
                    </div>
                    <h4 className="font-['Plus_Jakarta_Sans'] text-lg text-[#002869] font-bold">
                      Mevzuat &amp; Belgeler
                    </h4>
                    <p className="text-xs text-[#64748b] leading-relaxed">
                      Dernek tüzüğü, genel kurul yetki belgesi şablonları ve resmi
                      yönergelere erişin.
                    </p>
                  </div>
                  <div className="pt-4">
                    <Link
                      className="inline-flex items-center gap-1 text-xs text-[#002869] font-bold group-hover:text-[#225aba]"
                      href="/kaynaklar"
                    >
                      Belge Kütüphanesi{" "}
                      <span className="material-symbols-outlined text-sm">
                        arrow_forward
                      </span>
                    </Link>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-xs hover:shadow-md border border-[#e7eeff] transition-all duration-200 group flex flex-col justify-between">
                  <div className="flex flex-col gap-2">
                    <div className="w-12 h-12 rounded-lg bg-[#ebf2fc] text-[#002869] flex items-center justify-center group-hover:bg-[#002869] group-hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-2xl">
                        contacts
                      </span>
                    </div>
                    <h4 className="font-['Plus_Jakarta_Sans'] text-lg text-[#002869] font-bold">
                      Başkanlar &amp; Kurullar
                    </h4>
                    <p className="text-xs text-[#64748b] leading-relaxed">
                      1990&apos;dan bugüne görev yapan başkanlarımız ve yetkili kurul
                      heyetlerimiz.
                    </p>
                  </div>
                  <div className="pt-4">
                    <Link
                      className="inline-flex items-center gap-1 text-xs text-[#002869] font-bold group-hover:text-[#225aba]"
                      href="/baskanlar-ve-kurullar"
                    >
                      Kurulları İncele{" "}
                      <span className="material-symbols-outlined text-sm">
                        arrow_forward
                      </span>
                    </Link>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-xs hover:shadow-md border border-[#e7eeff] transition-all duration-200 group flex flex-col justify-between">
                  <div className="flex flex-col gap-2">
                    <div className="w-12 h-12 rounded-lg bg-amber-50 text-[#92400e] flex items-center justify-center group-hover:bg-[#92400e] group-hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-2xl">
                        diversity_3
                      </span>
                    </div>
                    <h4 className="font-['Plus_Jakarta_Sans'] text-lg text-[#002869] font-bold">
                      Komisyon Başvurusu
                    </h4>
                    <p className="text-xs text-[#64748b] leading-relaxed">
                      Yapay Zekâ ve Dijital Etik, Kamu Diplomasisi veya Genç
                      İletişimciler komisyonlarına çalışma talebi iletin.
                    </p>
                  </div>
                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setTicketSubject("Çalışma Komisyonu Katılım Başvurusu");
                        setTicketSuccess(false);
                        setTicketModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1 text-xs text-[#002869] font-bold group-hover:text-[#225aba] cursor-pointer"
                    >
                      Komisyona Katıl{" "}
                      <span className="material-symbols-outlined text-sm">
                        arrow_forward
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Member Notices & Upcoming Calendar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: Official Member Notices */}
              <div className="lg:col-span-8 bg-white p-6 rounded-xl shadow-xs border border-[#e7eeff] flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-[#92400e] uppercase tracking-widest font-bold">
                      Resmi Bildiriler
                    </span>
                    <h3 className="font-['Plus_Jakarta_Sans'] text-xl text-[#002869] font-bold">
                      Duyurular &amp; Yönetim Kararları
                    </h3>
                  </div>
                  <Link
                    href="/haberler"
                    className="text-xs bg-[#ebf2fc] text-[#002869] px-3 py-1 rounded-full font-bold hover:bg-[#dee8ff]"
                  >
                    Tümünü Gör ({notices.length})
                  </Link>
                </div>

                {notices.length === 0 ? (
                  <div className="p-8 rounded-xl bg-[#f8fafc] text-center flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-3xl text-[#64748b]">
                      notifications_off
                    </span>
                    <p className="text-sm font-semibold text-[#002869]">
                      Henüz Yayınlanmış Tebliğ veya Duyuru Bulunmuyor
                    </p>
                    <p className="text-xs text-[#64748b]">
                      Yönetim kurulu tarafından yeni duyuru eklendiğinde bu alanda
                      görüntülenecektir.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {notices.map((n) => (
                      <article
                        key={n.id}
                        className="p-4 rounded-lg bg-[#f8fafc] hover:bg-[#f0f3ff] transition-colors flex flex-col sm:flex-row items-start justify-between gap-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2.5 rounded bg-[#0b3d91] text-white shrink-0 mt-0.5">
                            <span className="material-symbols-outlined text-xl">
                              campaign
                            </span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] px-2 py-0.5 rounded bg-[#ebf2fc] text-[#002869] font-bold">
                                {n.category}
                              </span>
                              <span className="text-[11px] text-[#64748b]">
                                • {n.published_at || "Güncel"}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-[#002869]">
                              {n.title}
                            </h4>
                            <p className="text-xs text-[#64748b] line-clamp-2">
                              {n.summary}
                            </p>
                          </div>
                        </div>
                        <Link
                          href={`/haberler/${n.slug}`}
                          className="shrink-0 sm:self-center text-xs text-[#002869] hover:text-[#225aba] font-bold flex items-center gap-1"
                        >
                          İncele{" "}
                          <span className="material-symbols-outlined text-sm">
                            chevron_right
                          </span>
                        </Link>
                      </article>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Executive Calendar & Direct Officer Contact */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                <div className="bg-white p-6 rounded-xl shadow-xs border border-[#e7eeff] flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-['Plus_Jakarta_Sans'] text-lg text-[#002869] font-bold">
                      Gündemdeki Takvim
                    </h4>
                    <span className="material-symbols-outlined text-[#002869] text-xl">
                      calendar_today
                    </span>
                  </div>

                  {upcomingEvents.length === 0 ? (
                    <p className="text-xs text-[#64748b] py-4 text-center bg-[#f8fafc] rounded-lg">
                      Yaklaşan etkinlik kaydı bulunmamaktadır.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {upcomingEvents.map((ev) => (
                        <Link
                          key={ev.id}
                          href={`/etkinlikler/${ev.id}`}
                          className="flex items-start gap-3 p-2.5 rounded-lg bg-[#f8fafc] hover:bg-[#ebf2fc] transition-colors"
                        >
                          <div className="bg-[#002869] text-white text-center rounded p-2 min-w-[48px] shrink-0">
                            <span className="text-[10px] font-bold block uppercase">
                              ETK
                            </span>
                            <span className="text-sm font-bold block">
                              #{ev.id}
                            </span>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold text-[#002869] truncate">
                              {ev.title}
                            </span>
                            <span className="text-[11px] text-[#64748b]">
                              {ev.event_date} • {ev.location || "Ankara"}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Secretariat Direct Desk Card */}
                <div className="bg-[#dee8ff] p-6 rounded-xl flex flex-col justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#002869] text-xl">
                        support_agent
                      </span>
                      <span className="text-sm font-bold text-[#002869]">
                        Üye İlişkileri Genel Sekreterliği
                      </span>
                    </div>
                    <p className="text-xs text-[#334155]">
                      Sicil düzeltmeleri, resmi yazı talepleri ve tüzük danışmanlığı
                      için doğrudan genel sekreterlikle temas kurabilirsiniz.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setTicketSubject("Üye İlişkileri Resmi Destek Talebi");
                      setTicketSuccess(false);
                      setTicketModalOpen(true);
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 bg-[#002869] text-white hover:bg-[#225aba] py-2.5 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-sm">
                      drafts
                    </span>
                    <span>Resmi Destek Bileti Oluştur</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Edit Member Info Modal */}
      {editModalOpen && member && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#dee8ff]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-[#002869]">
                Üye Sicil Bilgilerini Güncelle
              </h3>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="p-1 text-[#64748b] hover:bg-[#f0f3ff] rounded cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleUpdateProfile} className="flex flex-col gap-3">
              <input
                type="text"
                required
                placeholder="Ad Soyad"
                value={editForm.full_name}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, full_name: e.target.value }))
                }
                className="w-full px-4 py-2.5 rounded-lg bg-[#f0f3ff] text-sm"
              />
              <input
                type="text"
                placeholder="Kurum / Unvan"
                value={editForm.title}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, title: e.target.value }))
                }
                className="w-full px-4 py-2.5 rounded-lg bg-[#f0f3ff] text-sm"
              />
              <input
                type="tel"
                placeholder="Telefon"
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, phone: e.target.value }))
                }
                className="w-full px-4 py-2.5 rounded-lg bg-[#f0f3ff] text-sm"
              />
              <input
                type="email"
                required
                placeholder="E-posta"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, email: e.target.value }))
                }
                className="w-full px-4 py-2.5 rounded-lg bg-[#f0f3ff] text-sm"
              />
              {editNotice && (
                <p className="text-xs text-emerald-700 font-semibold">
                  {editNotice}
                </p>
              )}
              <button
                type="submit"
                disabled={editSaving}
                className="w-full py-2.5 rounded-lg bg-[#002869] text-white text-sm font-semibold hover:bg-[#225aba] cursor-pointer"
              >
                {editSaving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Support / Commission Ticket Modal */}
      {ticketModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#dee8ff]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-[#002869]">
                {ticketSubject || "Resmi Destek & Başvuru Masası"}
              </h3>
              <button
                type="button"
                onClick={() => setTicketModalOpen(false)}
                className="p-1 text-[#64748b] hover:bg-[#f0f3ff] rounded cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {ticketSuccess ? (
              <div className="py-6 text-center flex flex-col items-center gap-3">
                <span className="material-symbols-outlined text-5xl text-emerald-600">
                  check_circle
                </span>
                <p className="text-sm font-semibold text-[#002869]">
                  Talebiniz Genel Sekreterlik sistemine kaydedildi.
                </p>
                <button
                  type="button"
                  onClick={() => setTicketModalOpen(false)}
                  className="px-5 py-2 rounded-lg bg-[#002869] text-white text-xs font-semibold cursor-pointer"
                >
                  Kapat
                </button>
              </div>
            ) : (
              <form onSubmit={handleTicketSubmit} className="flex flex-col gap-3">
                {!member && !application && (
                  <>
                    <input
                      type="text"
                      required
                      placeholder="Adınız Soyadınız"
                      value={ticketName}
                      onChange={(e) => setTicketName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg bg-[#f0f3ff] text-sm"
                    />
                    <input
                      type="email"
                      required
                      placeholder="E-posta Adresiniz"
                      value={ticketEmail}
                      onChange={(e) => setTicketEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg bg-[#f0f3ff] text-sm"
                    />
                  </>
                )}
                <input
                  type="text"
                  required
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  placeholder="Konu"
                  className="w-full px-4 py-2.5 rounded-lg bg-[#f0f3ff] text-sm"
                />
                <textarea
                  rows={4}
                  required
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  placeholder="Mesajınız veya komisyon başvuru detayınız..."
                  className="w-full px-4 py-2.5 rounded-lg bg-[#f0f3ff] text-sm"
                />
                <button
                  type="submit"
                  disabled={ticketSubmitting}
                  className="w-full py-2.5 rounded-lg bg-[#002869] text-white text-sm font-semibold hover:bg-[#225aba] cursor-pointer"
                >
                  {ticketSubmitting ? "Gönderiliyor..." : "Talebi İlet"}
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
