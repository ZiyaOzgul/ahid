"use client";

import { useEffect, useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";

interface ContactMessage {
  id: number;
  type?: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  subject?: string;
  message: string;
  status: string;
  admin_notes?: string;
  created_at?: string;
}

export default function AdminProtokolPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "all" | "press" | "diplomatic" | "appointments" | "archive"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Reply Composer State
  const [replyTarget, setReplyTarget] = useState<ContactMessage | null>(null);
  const [replySubject, setReplySubject] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [replySending, setReplySending] = useState(false);
  const [replyResult, setReplyResult] = useState<{
    sent: boolean;
    message: string;
    mailtoUrl?: string;
  } | null>(null);

  // New Protocol/Contact Message Form
  const [newRequest, setNewRequest] = useState({
    name: "",
    email: "",
    phone: "",
    department: "Basın Müşavirliği & Medya",
    subject: "Canlı Yayın & Röportaj Talebi",
    message: "",
    type: "protocol_request",
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadMessages = async (withSpinner = false) => {
    if (withSpinner) setLoading(true);
    try {
      const res = await fetch("/api/contact");
      const data = await res.json();
      if (data.success && Array.isArray(data.messages)) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error("Protokol talepleri yüklenirken hata:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetch("/api/contact")
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (data.success && Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
      })
      .catch((err) =>
        console.error("Protokol talepleri yüklenirken hata:", err)
      )
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyTarget || !replyMessage.trim()) return;
    setReplySending(true);
    setReplyResult(null);
    try {
      const res = await fetch("/api/contact", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: replyTarget.id,
          status: "replied",
          reply_subject: replySubject.trim(),
          reply_message: replyMessage.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.message) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === replyTarget.id ? (data.message as ContactMessage) : m
            )
          );
        }
        const emailInfo = data.emailResult as
          | { sent?: boolean; message?: string; mailtoUrl?: string }
          | undefined;
        setReplyResult({
          sent: Boolean(emailInfo?.sent),
          message:
            emailInfo?.message ||
            "Yanıt kaydı arşive işlendi.",
          mailtoUrl: emailInfo?.mailtoUrl,
        });
        setReplyMessage("");
        showToast(
          emailInfo?.sent
            ? "Yanıt alıcıya Resend ile gönderildi."
            : "Yanıt kaydedildi. Mail istemcisi ile gönderebilirsiniz."
        );
      } else {
        showToast(data.error || "Yanıt gönderilemedi.");
      }
    } catch {
      showToast("Sunucu iletişim hatası.");
    } finally {
      setReplySending(false);
    }
  };

  const handleUpdateStatus = async (
    id: number,
    newStatus: string,
    notes?: string
  ) => {
    try {
      const res = await fetch("/api/contact", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status: newStatus,
          admin_notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === id
              ? {
                  ...m,
                  status: newStatus,
                  admin_notes: notes || m.admin_notes,
                }
              : m
          )
        );
        showToast(
          newStatus === "approved"
            ? "Talep onaylandı ve Genel Merkez ajandasına randevu işlendi!"
            : newStatus === "replied"
            ? "Talebe resmi yanıt iletildi."
            : "Kayıt protokol arşivine aktarıldı."
        );
      } else {
        showToast(data.error || "İşlem başarısız.");
      }
    } catch (err) {
      console.error(err);
      showToast("Sunucu ile iletişim sırasında hata oluştu.");
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequest.name || !newRequest.message) {
      showToast("Lütfen kurum/yetkili adı ve talep detayını giriniz.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRequest),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Protokol / basın talebi başarıyla işleme alındı!");
        setIsAddModalOpen(false);
        setNewRequest({
          name: "",
          email: "",
          phone: "",
          department: "Basın Müşavirliği & Medya",
          subject: "Canlı Yayın & Röportaj Talebi",
          message: "",
          type: "protocol_request",
        });
        loadMessages();
      } else {
        showToast(data.error || "Talep kaydedilemedi.");
      }
    } catch (err) {
      console.error(err);
      showToast("Talep kaydedilirken hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const matchesTab = (
    m: ContactMessage,
    tab: "all" | "press" | "diplomatic" | "appointments" | "archive"
  ) => {
    if (tab === "all") return true;
    const haystack = `${m.department || ""} ${m.subject || ""} ${m.type || ""} ${m.message || ""}`.toLowerCase();
    if (tab === "press") {
      return /basın|basin|medya|röportaj|yayın|dergi|tv|gazete/.test(haystack);
    }
    if (tab === "diplomatic") {
      return /kamu|bakanlık|valilik|protokol|ziyaret|heyet|resmi|belediye/.test(haystack);
    }
    if (tab === "appointments") {
      return (
        m.status === "approved" ||
        m.type === "protocol_request" ||
        m.type === "protocol_appointment" ||
        /randevu|görüşme|toplantı/.test(haystack)
      );
    }
    if (tab === "archive") {
      return (
        m.status === "archived" ||
        m.status === "replied" ||
        /tebligat|arşiv|yazışma|genel/.test(haystack)
      );
    }
    return true;
  };

  const filteredMessages = messages.filter((m) => {
    if (!matchesTab(m, activeTab)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = m.name.toLowerCase().includes(q);
      const matchSub = (m.subject || "").toLowerCase().includes(q);
      const matchDept = (m.department || "").toLowerCase().includes(q);
      const matchBody = m.message.toLowerCase().includes(q);
      if (!matchName && !matchSub && !matchDept && !matchBody) return false;
    }
    return true;
  });

  const unreadCount = messages.filter((m) => m.status === "unread").length;
  const approvedCount = messages.filter((m) => m.status === "approved").length;
  const resolvedCount = messages.filter((m) =>
    ["approved", "replied", "archived"].includes(m.status)
  ).length;
  const responseRate =
    messages.length > 0 ? Math.round((resolvedCount / messages.length) * 100) : 100;
  const agendaItems = messages
    .filter(
      (m) =>
        m.status === "approved" ||
        m.type === "protocol_request" ||
        matchesTab(m, "appointments")
    )
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#101c2e]">
      {/* Toast Notice */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#002869] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <span className="material-symbols-outlined text-green-400">
            check_circle
          </span>
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Admin Sidebar & Header */}
      <AdminSidebar
        currentPath="/admin/protokol"
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <AdminHeader
        title="Protokol & İletişim Masası"
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Content */}
      <main className="relative pt-20 lg:ml-72 bg-[#f9f9ff] min-h-screen px-4 lg:px-8 py-6">
        <div className="flex flex-col w-full gap-6 pb-12">
          {/* 1. Üst Başlık & Eylem Çubuğu */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-6 rounded-xl shadow-xs border border-[#e2e8f0]">
            <div className="flex flex-col gap-1 max-w-2xl">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#ebf2fc] text-[#002869]">
                  <span className="material-symbols-outlined text-[22px]">
                    contact_mail
                  </span>
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-[#002869] tracking-tight">
                  Protokol &amp; İletişim CRM Masası
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
                  DİPLOMATİK KOORDİNASYON
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#64748b] leading-relaxed">
                Kamu kurumları, büyükelçilikler, basın kuruluşları ve üst düzey
                randevu/mülakat koordinasyon defteri.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#f1f5f9] text-[#334155] hover:bg-[#e2e8f0] text-xs font-semibold transition-colors cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">
                  print
                </span>
                <span>Ajandayı Yazdır</span>
              </button>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#002869] text-white hover:bg-[#1a4087] text-xs font-bold transition-all shadow-xs cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">
                  add_comment
                </span>
                <span>Yeni Protokol Talebi Aç</span>
              </button>
            </div>
          </div>

          {/* 2. KPI Kartları */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
                  Toplam Protokol &amp; İletişim Kaydı
                </span>
                <span className="w-8 h-8 rounded-lg bg-[#ebf2fc] text-[#002869] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">
                    account_box
                  </span>
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#002869]">{messages.length}</span>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Canlı Kayıt
                </span>
              </div>
              <p className="text-[11px] text-[#64748b] mt-1">
                Basın, Kamu Kurumları &amp; Üye İletişim
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
                  Okunmamış &amp; Bekleyen Talep
                </span>
                <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">
                    mark_email_unread
                  </span>
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-amber-600">
                  {unreadCount}
                </span>
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                  Yanıt Bekliyor
                </span>
              </div>
              <p className="text-[11px] text-[#64748b] mt-1">
                Genel Sekreterlik inceleme kuyruğu
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
                  Onaylı Heyet &amp; Randevular
                </span>
                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">
                    calendar_month
                  </span>
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#002869]">{agendaItems.length}</span>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  {approvedCount} Onaylı
                </span>
              </div>
              <p className="text-[11px] text-[#64748b] mt-1">
                Genel Merkez Yönetim Katı Ajandası
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
                  Talep Çözümleme Oranı
                </span>
                <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">
                    mark_email_read
                  </span>
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-emerald-600">%{responseRate}</span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {resolvedCount} / {messages.length} İşlendi
                </span>
              </div>
              <p className="text-[11px] text-[#64748b] mt-1">
                Yanıtlanan ve arşivlenen kayıtlar
              </p>
            </div>
          </div>

          {/* 3. Ana Çalışma Alanı: Sol 8 Kolon (Talepler) + Sağ 4 Kolon (Günlük Ajanda & İletişim) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Sol 8 Kolon */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              {/* Sekmeler & Arama */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#e2e8f0]">
                <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
                  <button
                    onClick={() => setActiveTab("all")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                      activeTab === "all"
                        ? "bg-[#002869] text-white"
                        : "bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]"
                    }`}
                  >
                    Tümü ({messages.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("press")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                      activeTab === "press"
                        ? "bg-[#002869] text-white"
                        : "bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]"
                    }`}
                  >
                    Basın &amp; Medya ({messages.filter((m) => matchesTab(m, "press")).length})
                  </button>
                  <button
                    onClick={() => setActiveTab("diplomatic")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                      activeTab === "diplomatic"
                        ? "bg-[#002869] text-white"
                        : "bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]"
                    }`}
                  >
                    Kamu &amp; Protokol ({messages.filter((m) => matchesTab(m, "diplomatic")).length})
                  </button>
                  <button
                    onClick={() => setActiveTab("appointments")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                      activeTab === "appointments"
                        ? "bg-[#002869] text-white"
                        : "bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]"
                    }`}
                  >
                    Randevu Defteri ({messages.filter((m) => matchesTab(m, "appointments")).length})
                  </button>
                  <button
                    onClick={() => setActiveTab("archive")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                      activeTab === "archive"
                        ? "bg-[#002869] text-white"
                        : "bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]"
                    }`}
                  >
                    Arşiv &amp; Yazışma ({messages.filter((m) => matchesTab(m, "archive")).length})
                  </button>
                </div>

                <div className="relative w-full sm:w-64">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#94a3b8] text-[18px]">
                    search
                  </span>
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Kurum, isim veya konu..."
                    className="w-full bg-[#f8fafc] text-xs rounded-lg pl-9 pr-3 py-2 border border-[#cbd5e1] focus:outline-none focus:border-[#002869]"
                    type="text"
                  />
                </div>
              </div>

              {/* Talep Kartları Listesi */}
              {loading ? (
                <div className="bg-white p-12 rounded-xl text-center text-[#64748b] border border-[#e2e8f0]">
                  <span className="material-symbols-outlined text-3xl animate-spin text-[#002869]">
                    progress_activity
                  </span>
                  <p className="mt-2 text-xs">Talepler yükleniyor...</p>
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="bg-white p-12 rounded-xl text-center text-[#64748b] border border-[#e2e8f0]">
                  <span className="material-symbols-outlined text-4xl text-slate-300">
                    inbox
                  </span>
                  <p className="mt-2 text-xs font-bold text-slate-600">
                    Kayıtlı talep bulunamadı
                  </p>
                </div>
              ) : (
                filteredMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-xs hover:border-[#cbd5e1] transition-all"
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 text-[10px] font-bold uppercase tracking-wider">
                          {msg.status === "unread"
                            ? "Yeni Müracaat"
                            : msg.status === "approved"
                            ? "Randevu Onaylandı"
                            : "Yanıtlandı"}
                        </span>
                        <span className="text-xs font-semibold text-[#64748b]">
                          {msg.department || "Genel Sekreterlik"}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#64748b]">
                        {msg.created_at
                          ? new Date(msg.created_at).toLocaleDateString(
                              "tr-TR",
                              {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )
                          : "Bugün"}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-[#0f172a]">
                      {msg.subject || "İletişim & Görüşme Talebi"}
                    </h3>

                    <p className="text-xs text-[#475569] mt-2 leading-relaxed bg-[#f8fafc] p-3 rounded-lg border border-[#e2e8f0]">
                      {msg.message}
                    </p>

                    {msg.admin_notes && (
                      <p className="text-[11px] text-[#002869] mt-2 whitespace-pre-line bg-[#f0f3ff] p-2.5 rounded-lg border border-[#dee8ff]">
                        {msg.admin_notes}
                      </p>
                    )}

                    <div className="mt-4 pt-3 border-t border-[#f1f5f9] flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#002869] text-white flex items-center justify-center font-bold text-xs">
                          {msg.name[0]}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#0f172a]">
                            {msg.name}
                          </p>
                          <p className="text-[10px] text-[#64748b]">
                            {msg.email} {msg.phone && `&bull; ${msg.phone}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            handleUpdateStatus(msg.id, "approved")
                          }
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                        >
                          Randevu Ver
                        </button>
                        <button
                          onClick={() => {
                            setReplyTarget(msg);
                            setReplySubject(
                              `Ynt: ${msg.subject || "AHİD İletişim Talebiniz"}`
                            );
                            setReplyMessage("");
                            setReplyResult(null);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#ebf2fc] hover:bg-[#dee8ff] text-[#002869] cursor-pointer"
                        >
                          Yanıtla
                        </button>
                        <button
                          onClick={() =>
                            handleUpdateStatus(msg.id, "archived")
                          }
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                          title="Arşivle"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            archive
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Sağ 4 Kolon: Günlük Ajanda & İletişim Özeti */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              {/* Protokol Heyet Ajandası (Veritabanı Kayıtları) */}
              <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#002869] text-[20px]">
                      event_note
                    </span>
                    <h3 className="font-bold text-sm text-[#0f172a]">
                      Protokol &amp; Randevu Ajandası
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold bg-[#ebf2fc] text-[#002869] px-2 py-0.5 rounded-full">
                    {agendaItems.length} Kayıt
                  </span>
                </div>

                {agendaItems.length === 0 ? (
                  <div className="mt-4 p-4 bg-[#f8fafc] rounded-lg border border-dashed border-[#cbd5e1] text-center text-xs text-[#64748b]">
                    Onaylanmış randevu veya protokol görüşmesi bulunmuyor. Soldaki listeden bir talebi onaylayarak ajandaya ekleyebilirsiniz.
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {agendaItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 bg-[#f8fafc] rounded-lg border-l-4 border-l-[#002869] border border-[#e2e8f0] text-xs"
                      >
                        <div className="flex justify-between items-center gap-2">
                          <span className="font-bold text-[#002869] truncate">
                            {item.department || "Protokol Masası"}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                              item.status === "approved"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {item.status === "approved" ? "Onaylı" : "Bekliyor"}
                          </span>
                        </div>
                        <p className="font-bold text-[#0f172a] mt-1">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-[#64748b] line-clamp-2 mt-0.5">
                          {item.subject || item.message}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Kurumsal İletişim Özeti */}
              <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-xs text-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">
                    Resmi İletişim Kanalları
                  </span>
                  <span className="material-symbols-outlined text-[16px] text-[#002869]">
                    contact_mail
                  </span>
                </div>
                <div className="space-y-2 text-[#334155]">
                  <div className="flex justify-between items-center py-1 border-b border-[#f1f5f9]">
                    <span>Genel Sekreterlik</span>
                    <span className="font-semibold text-[#002869]">
                      info@ahid.org.tr
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-[#f1f5f9]">
                    <span>Yanıtlanan / Arşiv</span>
                    <span className="font-bold text-emerald-700">
                      {resolvedCount} kayıt
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span>Okunmamış Kayıt</span>
                    <span className="font-bold text-amber-600">{unreadCount} talep</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Yeni Protokol Talebi Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#e2e8f0]">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
              <h3 className="font-bold text-base text-[#002869]">
                Yeni Protokol veya Basın Talebi Aç
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#64748b] hover:text-[#002869] cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form
              onSubmit={handleCreateRequest}
              className="mt-4 space-y-3 text-xs"
            >
              <div>
                <label className="block text-[#475569] font-semibold mb-1">
                  Kurum / Yetkili Adı *
                </label>
                <input
                  required
                  value={newRequest.name}
                  onChange={(e) =>
                    setNewRequest({ ...newRequest, name: e.target.value })
                  }
                  placeholder="Kurum veya Birim Adı"
                  className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg p-2 focus:outline-none focus:border-[#002869]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#475569] font-semibold mb-1">
                    İletişim E-Postası
                  </label>
                  <input
                    type="email"
                    value={newRequest.email}
                    onChange={(e) =>
                      setNewRequest({ ...newRequest, email: e.target.value })
                    }
                    placeholder="protokol@kurum.gov.tr"
                    className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg p-2 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#475569] font-semibold mb-1">
                    Telefon
                  </label>
                  <input
                    value={newRequest.phone}
                    onChange={(e) =>
                      setNewRequest({ ...newRequest, phone: e.target.value })
                    }
                    placeholder="0312 xxx xx xx"
                    className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg p-2 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#475569] font-semibold mb-1">
                  Talep Konusu *
                </label>
                <input
                  required
                  value={newRequest.subject}
                  onChange={(e) =>
                    setNewRequest({ ...newRequest, subject: e.target.value })
                  }
                  className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg p-2 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#475569] font-semibold mb-1">
                  Talep Detayı ve Randevu Notu *
                </label>
                <textarea
                  rows={3}
                  required
                  value={newRequest.message}
                  onChange={(e) =>
                    setNewRequest({ ...newRequest, message: e.target.value })
                  }
                  placeholder="Görüşme talebinin kapsamı, heyet sayısı ve tarih önerisi..."
                  className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg p-2 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-[#e2e8f0] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-[#002869] text-white hover:bg-[#1a4087] font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Kaydediliyor..." : "Talebi Deftere Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resmi Yanıt Oluşturma Modal */}
      {replyTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#e2e8f0]">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
              <div>
                <h3 className="font-bold text-base text-[#002869]">
                  Resmi Yanıt Gönder
                </h3>
                <p className="text-[11px] text-[#64748b]">
                  Alıcı: {replyTarget.name} ({replyTarget.email})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReplyTarget(null)}
                className="text-[#64748b] hover:text-[#002869] cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSendReply} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-[#475569] font-semibold mb-1">
                  Konu *
                </label>
                <input
                  required
                  value={replySubject}
                  onChange={(e) => setReplySubject(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg p-2 focus:outline-none focus:border-[#002869]"
                />
              </div>

              <div>
                <label className="block text-[#475569] font-semibold mb-1">
                  Yanıt Metni *
                </label>
                <textarea
                  rows={5}
                  required
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Sayın ilgili, talebiniz değerlendirilmiş olup..."
                  className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg p-2 focus:outline-none focus:border-[#002869]"
                />
              </div>

              {replyResult && (
                <div
                  className={`p-3 rounded-lg border text-xs space-y-2 ${
                    replyResult.sent
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-amber-50 border-amber-200 text-amber-800"
                  }`}
                >
                  <p className="font-semibold">{replyResult.message}</p>
                  {!replyResult.sent && replyResult.mailtoUrl && (
                    <a
                      href={replyResult.mailtoUrl}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#002869] text-white font-bold hover:bg-[#1a4087]"
                    >
                      <span className="material-symbols-outlined text-sm">
                        mail
                      </span>
                      E-posta İstemcisinde Aç (mailto)
                    </a>
                  )}
                </div>
              )}

              <div className="pt-3 border-t border-[#e2e8f0] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReplyTarget(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold cursor-pointer"
                >
                  Kapat
                </button>
                <button
                  type="submit"
                  disabled={replySending}
                  className="px-5 py-2 rounded-lg bg-[#002869] text-white hover:bg-[#1a4087] font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {replySending ? "İşleniyor..." : "Yanıtı Kaydet & Gönder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
