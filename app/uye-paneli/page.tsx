"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ROLE_LABELS } from "@/lib/constants";

interface MemberRecord {
  id: number;
  full_name: string;
  email: string;
  role: string;
  title: string | null;
  member_no: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at?: string | null;
}

interface ApplicationRecord {
  id: number;
  application_no?: string | null;
  first_name: string;
  last_name: string;
  email: string;
  position?: string | null;
  organization?: string | null;
  tier?: string | null;
  status: string;
}

interface DueRecord {
  id: number;
  user_id: number;
  period: string;
  amount: number;
  status: string;
  due_date?: string | null;
  paid_at?: string | null;
  receipt_no?: string | null;
  receipt_url?: string | null;
}

interface EventSummary {
  id: number;
  title: string;
  event_date: string;
  location: string | null;
}

interface RegistrationRecord {
  id: number;
  event_id: number;
  ticket_type: string | null;
  status: string;
  events?: EventSummary | null;
}

interface NoticeRecord {
  id: number;
  title: string;
  slug: string;
  category: string;
  summary: string | null;
  published_at: string | null;
}

interface VerifiedMemberCard {
  verified: boolean;
  member_no?: string | null;
  full_name?: string;
  title?: string;
  status?: string;
  message?: string;
}

function getDueStatusBadge(status?: string) {
  const s = (status || "").toLowerCase();
  if (s === "paid") {
    return {
      label: "ÖDENDİ",
      classes: "bg-emerald-600 text-white",
    };
  }
  if (s === "overdue") {
    return {
      label: "GECİKMİŞ",
      classes: "bg-red-600 text-white",
    };
  }
  return {
    label: "ÖDEME BEKLİYOR",
    classes: "bg-amber-600 text-white",
  };
}

function UyePaneliContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verifyMemberNo = (searchParams.get("dogrula") || "").trim();

  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [verifiedCard, setVerifiedCard] = useState<VerifiedMemberCard | null>(null);

  const [member, setMember] = useState<MemberRecord | null>(null);
  const [application, setApplication] = useState<ApplicationRecord | null>(null);
  const [dues, setDues] = useState<DueRecord[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>([]);
  const [notices, setNotices] = useState<NoticeRecord[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<EventSummary[]>([]);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [bankInfo, setBankInfo] = useState<{ bank_name?: string; bank_iban?: string }>({});

  // Edit profile modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: "",
    title: "",
    phone: "",
    password: "",
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editNotice, setEditNotice] = useState("");
  const [editError, setEditError] = useState("");

  // Receipt notification modal
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedDueId, setSelectedDueId] = useState<number | null>(null);
  const [receiptNo, setReceiptNo] = useState("");
  const [receiptSaving, setReceiptSaving] = useState(false);
  const [receiptFeedback, setReceiptFeedback] = useState("");
  const [receiptError, setReceiptError] = useState("");

  // Support / Commission Ticket Modal
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketName, setTicketName] = useState("");
  const [ticketEmail, setTicketEmail] = useState("");
  const [ticketSubmitting, setTicketSubmitting] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(false);
  const [ticketError, setTicketError] = useState("");

  const loadPortalData = useCallback(async () => {
    try {
      if (verifyMemberNo) {
        const res = await fetch(
          `/api/member-portal?verify_member_no=${encodeURIComponent(verifyMemberNo)}`,
          { cache: "no-store" }
        );
        const data = (await res.json()) as VerifiedMemberCard;
        setVerifiedCard(data);
        setLoading(false);
        return;
      }

      const [portalRes, eventsRes, cmsRes] = await Promise.all([
        fetch("/api/member-portal", { cache: "no-store" }),
        fetch("/api/events").catch(() => null),
        fetch("/api/cms?page=system_settings").catch(() => null),
      ]);

      if (eventsRes && eventsRes.ok) {
        const evData = await eventsRes.json();
        if (evData?.success && Array.isArray(evData.events)) {
          setUpcomingEvents((evData.events as EventSummary[]).slice(0, 4));
        }
      }

      if (cmsRes && cmsRes.ok) {
        const cmsData = await cmsRes.json();
        if (cmsData?.success && cmsData.variables) {
          setBankInfo({
            bank_name: cmsData.variables.bank_name || "",
            bank_iban: cmsData.variables.bank_iban || "",
          });
        }
      }

      if (portalRes.status === 401) {
        setAuthRequired(true);
        setMember(null);
        setLoading(false);
        return;
      }

      const data = await portalRes.json();
      if (portalRes.ok && data?.success) {
        setAuthRequired(false);
        setMember((data.member as MemberRecord) || null);
        setApplication((data.application as ApplicationRecord) || null);
        setDues(Array.isArray(data.dues) ? (data.dues as DueRecord[]) : []);
        setRegistrations(
          Array.isArray(data.registrations)
            ? (data.registrations as RegistrationRecord[])
            : []
        );
        setNotices(Array.isArray(data.notices) ? (data.notices as NoticeRecord[]) : []);
        setQrDataUrl(typeof data.qrDataUrl === "string" ? data.qrDataUrl : "");

        if (data.member) {
          setEditForm({
            full_name: data.member.full_name || "",
            title: data.member.title || "",
            phone: data.member.phone || "",
            password: "",
          });
        }
      } else {
        setAuthRequired(true);
      }
    } catch (err) {
      console.error("Portal yükleme hatası:", err);
      setAuthRequired(true);
    } finally {
      setLoading(false);
    }
  }, [verifyMemberNo]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!active) return;
      await loadPortalData();
    };
    void run();
    return () => {
      active = false;
    };
  }, [loadPortalData]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore network issue on logout
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("ahid_member_identifier");
    }
    setMember(null);
    setApplication(null);
    setDues([]);
    setRegistrations([]);
    setAuthRequired(true);
    router.push("/login");
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;
    setEditSaving(true);
    setEditNotice("");
    setEditError("");
    try {
      const payload: Record<string, unknown> = {
        id: member.id,
        full_name: editForm.full_name,
        title: editForm.title,
        phone: editForm.phone,
      };
      if (editForm.password.trim()) {
        payload.password = editForm.password.trim();
      }

      const res = await fetch("/api/member-portal", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success && data.member) {
        setMember(data.member as MemberRecord);
        setEditForm((prev) => ({ ...prev, password: "" }));
        setEditNotice("Sicil bilgileriniz ve güvenlik tercihleriniz güncellendi.");
        setTimeout(() => setEditModalOpen(false), 1200);
      } else {
        setEditError(
          data.error || "Profil bilgileri güncellenemedi. Lütfen tekrar deneyin."
        );
      }
    } catch {
      setEditError("Sunucuya bağlanılamadı. Lütfen bağlantınızı kontrol edin.");
    } finally {
      setEditSaving(false);
    }
  };

  const handleSubmitReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDueId || !receiptNo.trim()) {
      setReceiptError("Lütfen geçerli bir dekont veya EFT referans numarası giriniz.");
      return;
    }
    setReceiptSaving(true);
    setReceiptError("");
    setReceiptFeedback("");
    try {
      const res = await fetch("/api/member-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_receipt",
          dues_id: selectedDueId,
          receipt_no: receiptNo.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.due) {
        setDues((prev) =>
          prev.map((d) => (d.id === selectedDueId ? (data.due as DueRecord) : d))
        );
        setReceiptFeedback(
          data.message ||
            "Dekont referans numaranız AHİD Saymanlık incelemesine iletildi."
        );
        setReceiptNo("");
      } else {
        setReceiptError(data.error || "Dekont bildirimi kaydedilemedi.");
      }
    } catch {
      setReceiptError("Sunucu bağlantı hatası.");
    } finally {
      setReceiptSaving(false);
    }
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTicketSubmitting(true);
    setTicketError("");
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
      if (res.ok && data.success) {
        setTicketSuccess(true);
        setTicketMessage("");
      } else {
        setTicketError(data.error || "Talep gönderilirken bir sorun oluştu.");
      }
    } catch {
      setTicketError("Sunucuya bağlanılamadı.");
    } finally {
      setTicketSubmitting(false);
    }
  };

  const latestDue = dues[0] || null;
  const dueBadge = getDueStatusBadge(latestDue?.status);

  // Public QR verification view
  if (verifyMemberNo) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f9f9ff] text-[#101c2e]">
        <Navbar />
        <main className="w-full pt-[7.5rem] pb-16 px-4 flex-1 flex items-center justify-center">
          <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg border border-[#dee8ff] p-8">
            <div className="flex items-center gap-3 pb-4 border-b border-[#e7eeff]">
              <div className="w-11 h-11 rounded-xl bg-[#ebf2fc] text-[#002869] flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">qr_code_scanner</span>
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#92400e]">
                  AHİD Üye Sicil Kartı Doğrulama
                </span>
                <h1 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#002869]">
                  Dijital Üye Kimlik Teyidi
                </h1>
              </div>
            </div>

            {loading ? (
              <div className="py-10 text-center text-sm text-[#64748b]">
                Üye numarası doğrulanıyor...
              </div>
            ) : verifiedCard?.verified ? (
              <div className="mt-6 space-y-4">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                  <span className="material-symbols-outlined text-3xl text-emerald-600">
                    verified
                  </span>
                  <div>
                    <p className="text-sm font-bold text-emerald-900">
                      Geçerli AHİD Üye Kimliği
                    </p>
                    <p className="text-xs text-emerald-700">
                      {verifiedCard.status || "Aktif AHİD Üyesi"}
                    </p>
                  </div>
                </div>
                <div className="bg-[#f8fafc] rounded-xl p-4 border border-[#e2e8f0] space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">Üye Adı</span>
                    <span className="font-bold text-[#002869]">{verifiedCard.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">Sicil / Üye No</span>
                    <span className="font-mono font-bold text-[#002869]">
                      {verifiedCard.member_no || verifyMemberNo}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">Ünvan / Görev</span>
                    <span className="font-semibold text-[#101c2e]">
                      {verifiedCard.title || "Dernek Üyesi"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 p-5 rounded-xl bg-red-50 border border-red-200 text-center space-y-2">
                <span className="material-symbols-outlined text-3xl text-red-600">
                  gpp_bad
                </span>
                <p className="text-sm font-bold text-red-900">
                  Kimlik Kaydı Doğrulanamadı
                </p>
                <p className="text-xs text-red-700">
                  {verifiedCard?.message ||
                    "Bu sicil numarasına ait aktif bir AHİD üye kaydı bulunamadı."}
                </p>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-[#e7eeff] flex justify-between items-center text-xs">
              <Link href="/uye-paneli" className="text-[#002869] font-bold hover:underline">
                Üye Portalına Dön
              </Link>
              <Link href="/" className="text-[#64748b] hover:text-[#002869]">
                Ana Sayfa
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f9f9ff] text-[#101c2e]">
      <Navbar />

      <main className="w-full pt-[7.5rem] bg-[#f9f9ff] flex-1">
        {/* Portal Top Utility / Notification Strip */}
        <section className="w-full bg-[#f0f3ff] py-2.5 px-4 lg:px-14 border-b border-[#dee8ff]">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-center sm:text-left">
              <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-[#002869] shrink-0" />
              <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">
                AHİD Üye İşleri ve Sicil Portalı
              </span>
              <span className="hidden sm:inline text-[#64748b] text-xs opacity-40">|</span>
              <span className="text-[11px] text-[#002869] font-bold uppercase">
                T.C. Ankara Valiliği Kütük No: 06-039-142
              </span>
            </div>
            <div className="flex items-center gap-4 text-[#64748b] text-xs font-semibold">
              {member && (
                <button
                  onClick={handleLogout}
                  className="text-[#002869] hover:text-[#225aba] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  type="button"
                >
                  <span className="material-symbols-outlined text-sm">logout</span>
                  Oturumu Kapat
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Member Identity / Auth Header */}
        <section className="w-full bg-white py-10 shadow-xs border-b border-[#e7eeff]">
          <div className="max-w-7xl mx-auto px-4 lg:px-14">
            {loading ? (
              <div className="py-12 text-center text-sm text-[#64748b]">
                Üye oturumu ve sicil verileri doğrulanıyor...
              </div>
            ) : authRequired || (!member && !application) ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 flex flex-col gap-3">
                  <div className="inline-flex items-center gap-2 self-start px-3 py-1 rounded-full bg-[#ebf2fc] text-[#002869] text-[11px] font-bold uppercase tracking-wider">
                    <span className="material-symbols-outlined text-sm">lock</span>
                    KVKK Güvenli Üye Oturumu
                  </div>
                  <h1 className="font-['Plus_Jakarta_Sans'] text-3xl sm:text-4xl text-[#002869] font-bold tracking-tight">
                    Üye Sicil, Aidat ve Dijital Kimlik Portalı
                  </h1>
                  <p className="text-sm sm:text-base text-[#64748b] leading-relaxed max-w-2xl">
                    Kişisel verilerinizin korunması amacıyla dijital üye kimlik kartınız,
                    aidat siciliniz ve üyelere özel dokümanlar yalnızca kimlik doğrulaması
                    yapılmış aktif oturumunuzda görüntülenir.
                  </p>
                </div>

                <div className="lg:col-span-5 bg-[#f8fafc] p-6 rounded-2xl border border-[#dee8ff] shadow-xs space-y-4">
                  <div>
                    <h2 className="text-sm font-bold text-[#002869]">
                      Üye Hesabınızla Giriş Yapın
                    </h2>
                    <p className="text-xs text-[#64748b] mt-1">
                      Üyeliğiniz Yönetim Kurulu tarafından onaylandığında oluşturulan
                      e-posta adresiniz ve şifreniz ile oturum açabilirsiniz.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <Link
                      href="/login?redirect=/uye-paneli"
                      className="flex-1 bg-[#002869] hover:bg-[#225aba] text-white font-semibold py-2.5 px-4 rounded-xl text-sm text-center transition-colors inline-flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-base">login</span>
                      Üye Girişi Yap
                    </Link>
                    <Link
                      href="/uyelik#basvuru-formu"
                      className="bg-[#ebf2fc] hover:bg-[#dee8ff] text-[#002869] font-semibold py-2.5 px-4 rounded-xl text-sm text-center transition-colors"
                    >
                      Üyelik Başvurusu
                    </Link>
                  </div>
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
                        <span className="material-symbols-outlined text-5xl">person</span>
                      </div>
                    )}
                    <div className="absolute -bottom-2 -right-2 bg-[#002869] text-white rounded px-2 py-0.5 shadow-xs flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-[#fde68a]">
                        verified
                      </span>
                      <span className="text-[11px] font-bold uppercase">
                        {member
                          ? ROLE_LABELS[member.role] || member.role || "Asil Üye"
                          : "Aday Üye"}
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
                        : `${application?.first_name || ""} ${application?.last_name || ""}`}
                    </h1>
                    <p className="text-sm text-[#64748b] max-w-2xl">
                      {member?.title ||
                        application?.position ||
                        "AHİD Kurumsal İletişim Üyesi"}{" "}
                      {application?.organization ? `| ${application.organization}` : ""}
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
                        onClick={() => {
                          setEditNotice("");
                          setEditError("");
                          setEditModalOpen(true);
                        }}
                        className="w-full inline-flex items-center justify-center gap-2 bg-[#002869] text-white hover:bg-[#225aba] py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors shadow-xs cursor-pointer"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-sm">
                          manage_accounts
                        </span>
                        <span>Bilgilerimi &amp; Şifremi Güncelle</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Core Dashboard Grid: Cards & Verification */}
        {member && (
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
                        {member.full_name}
                      </span>
                      <span className="text-[11px] text-[#fde68a] font-bold mt-1 uppercase">
                        STATÜ: {ROLE_LABELS[member.role] || member.role || "ASİL ÜYE"}
                      </span>
                      <span className="text-[11px] text-[#d7e3fc] font-mono">
                        NO: {member.member_no || `AHID-${member.id}`}
                      </span>
                    </div>

                    <div className="flex flex-col items-center justify-center bg-white p-2 rounded-lg shadow-inner">
                      {qrDataUrl ? (
                        <img
                          src={qrDataUrl}
                          alt="Üye QR Kodu"
                          className="w-20 h-20 object-contain"
                        />
                      ) : (
                        <span className="material-symbols-outlined text-5xl text-[#002869]">
                          qr_code_2
                        </span>
                      )}
                      <span className="text-[9px] text-[#002869] font-bold mt-1">
                        AHİD QR
                      </span>
                    </div>
                  </div>

                  <div className="relative z-10 pt-2 bg-black/20 -mx-6 -mb-6 px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-[#fde68a]">
                        verified_user
                      </span>
                      <span className="text-[11px] font-bold text-[#dee8ff]">
                        AHİD DİJİTAL ÜYE KİMLİĞİ
                      </span>
                    </div>
                    <div className="text-[11px] text-[#d7e3fc] font-mono">
                      ID #{member.id}
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

                    {dues.length === 0 ? (
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
                      <div className="bg-[#f0f3ff] p-4 rounded-lg flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-[#101c2e]">
                            {latestDue.period} Dönemi
                          </span>
                          <span
                            className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase ${dueBadge.classes}`}
                          >
                            {dueBadge.label}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-[#002869]">
                            ₺{Number(latestDue.amount).toLocaleString("tr-TR")}
                          </span>
                        </div>
                        {latestDue.receipt_no && (
                          <p className="text-[11px] text-[#475569]">
                            Bildirilen Dekont / Ref: <strong>{latestDue.receipt_no}</strong>
                          </p>
                        )}
                        {latestDue.status !== "paid" && (
                          <div className="pt-2 border-t border-[#dee8ff] space-y-2">
                            <p className="text-[11px] text-[#475569] leading-relaxed">
                              Ödemeler yalnızca AHİD resmi banka hesabına Havale / EFT yoluyla
                              yapılır.
                              {bankInfo.bank_name ? ` (${bankInfo.bank_name})` : ""}
                              {bankInfo.bank_iban ? ` • IBAN: ${bankInfo.bank_iban}` : ""}
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDueId(latestDue.id);
                                setReceiptNo(latestDue.receipt_no || "");
                                setReceiptFeedback("");
                                setReceiptError("");
                                setReceiptModalOpen(true);
                              }}
                              className="w-full py-2 px-3 rounded-lg bg-[#002869] text-white hover:bg-[#1a4087] text-xs font-bold transition-colors cursor-pointer"
                            >
                              Dekont / Havale Referansı Bildir
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 flex items-center justify-between border-t border-[#f0f3ff]">
                    <span className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">
                        account_balance
                      </span>{" "}
                      AHİD Saymanlık Kaydı
                    </span>
                    <Link
                      href="/iletisim?konu=Saymanlık%20ve%20Aidat%20Bilgisi"
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
                        Henüz kayıtlı etkinlik katılımınız bulunmamaktadır.
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
                        Telefon, unvan/kurum değişikliği ve portal giriş şifrenizi güncelleyin.
                      </p>
                    </div>
                    <div className="pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setEditNotice("");
                          setEditError("");
                          setEditModalOpen(true);
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
                          setTicketError("");
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
                        Üyelere Özel Bildiriler
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
                        Henüz Yayınlanmış Üyelere Özel Duyuru Bulunmuyor
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
                              <span className="text-sm font-bold block">#{ev.id}</span>
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
                        setTicketError("");
                        setTicketModalOpen(true);
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 bg-[#002869] text-white hover:bg-[#225aba] py-2.5 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-sm">drafts</span>
                      <span>Resmi Destek Bileti Oluştur</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
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
              <div className="px-3 py-2 rounded-lg bg-[#f8fafc] border border-[#e2e8f0] text-xs text-[#64748b]">
                Kayıtlı E-posta: <strong className="text-[#101c2e]">{member.email}</strong>
              </div>
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
                type="password"
                minLength={8}
                placeholder="Yeni Şifre (değiştirmek istemiyorsanız boş bırakın)"
                value={editForm.password}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, password: e.target.value }))
                }
                className="w-full px-4 py-2.5 rounded-lg bg-[#f0f3ff] text-sm"
              />
              {editNotice && (
                <p className="text-xs text-emerald-700 font-semibold">{editNotice}</p>
              )}
              {editError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">
                  {editError}
                </div>
              )}
              <button
                type="submit"
                disabled={editSaving}
                className="w-full py-2.5 rounded-lg bg-[#002869] text-white text-sm font-semibold hover:bg-[#225aba] cursor-pointer disabled:opacity-50"
              >
                {editSaving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Dues Receipt Notification Modal */}
      {receiptModalOpen && member && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#dee8ff]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-[#002869]">
                Aidat Havale / EFT Dekont Bildirimi
              </h3>
              <button
                type="button"
                onClick={() => setReceiptModalOpen(false)}
                className="p-1 text-[#64748b] hover:bg-[#f0f3ff] rounded cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmitReceipt} className="flex flex-col gap-3">
              <p className="text-xs text-[#64748b] leading-relaxed">
                Banka üzerinden yaptığınız aidat transferinin dekont veya işlem referans
                numarasını giriniz. Saymanlık kontrolü ardından siciliniz &quot;Ödendi&quot;
                olarak güncellenecektir.
              </p>
              <input
                type="text"
                required
                value={receiptNo}
                onChange={(e) => setReceiptNo(e.target.value)}
                placeholder="Örn: EFT-2026-849201"
                className="w-full px-4 py-2.5 rounded-lg bg-[#f0f3ff] text-sm font-mono"
              />
              {receiptFeedback && (
                <p className="text-xs text-emerald-700 font-semibold">{receiptFeedback}</p>
              )}
              {receiptError && (
                <p className="text-xs text-red-700 font-semibold">{receiptError}</p>
              )}
              <button
                type="submit"
                disabled={receiptSaving}
                className="w-full py-2.5 rounded-lg bg-[#002869] text-white text-sm font-semibold hover:bg-[#225aba] cursor-pointer disabled:opacity-50"
              >
                {receiptSaving ? "İletiliyor..." : "Dekont Referansını Bildir"}
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
                {ticketError && (
                  <p className="text-xs text-red-700 font-semibold">{ticketError}</p>
                )}
                <button
                  type="submit"
                  disabled={ticketSubmitting}
                  className="w-full py-2.5 rounded-lg bg-[#002869] text-white text-sm font-semibold hover:bg-[#225aba] cursor-pointer disabled:opacity-50"
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

export default function UyePaneliPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen pt-32 flex flex-col items-center justify-center bg-[#f9f9ff]">
          <div className="w-10 h-10 border-4 border-[#002869] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-3 text-[#64748b] text-sm">Üye Portalı Yükleniyor...</p>
        </div>
      }
    >
      <UyePaneliContent />
    </Suspense>
  );
}
