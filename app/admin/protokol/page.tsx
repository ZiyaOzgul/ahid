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
    "press" | "diplomatic" | "appointments" | "kep"
  >("press");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  const loadMessages = async () => {
    setLoading(true);
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
    loadMessages();
  }, []);

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
        alert(data.error || "İşlem başarısız.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequest.name || !newRequest.message) {
      alert("Lütfen kurum/yetkili adı ve talep detayını giriniz.");
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
        alert(data.error || "Talep kaydedilemedi.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMessages = messages.filter((m) => {
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
                onClick={() =>
                  showToast("Günün Protokol ve Basın Ajandası yazdırılıyor.")
                }
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
                  Aktif Temas Portföyü
                </span>
                <span className="w-8 h-8 rounded-lg bg-[#ebf2fc] text-[#002869] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">
                    account_box
                  </span>
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#002869]">342</span>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Rehberde Kayıtlı
                </span>
              </div>
              <p className="text-[11px] text-[#64748b] mt-1">
                Bakanlıklar &bull; Elçilikler &bull; Basın
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
                  Bekleyen Basın &amp; Talep
                </span>
                <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">
                    mark_email_unread
                  </span>
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-amber-600">
                  {unreadCount > 0 ? unreadCount : 3}
                </span>
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                  Yanıt Bekliyor
                </span>
              </div>
              <p className="text-[11px] text-[#64748b] mt-1">
                1 Canlı Yayın &bull; 2 Röportaj Talebi
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
                  Haftalık Heyet Ajandası
                </span>
                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">
                    calendar_month
                  </span>
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#002869]">14</span>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  Planlı Randevu
                </span>
              </div>
              <p className="text-[11px] text-[#64748b] mt-1">
                Genel Merkez Yönetim Katı
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
                  KEP &amp; e-Tebligat
                </span>
                <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">
                    mark_email_read
                  </span>
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-emerald-600">%100</span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Zamanında İntikal
                </span>
              </div>
              <p className="text-[11px] text-[#64748b] mt-1">
                0 Hukuki Gecikme &bull; e-İmza Aktif
              </p>
            </div>
          </div>

          {/* 3. Ana Çalışma Alanı: Sol 8 Kolon (Talepler) + Sağ 4 Kolon (Günlük Ajanda & KEP) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Sol 8 Kolon */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              {/* Sekmeler & Arama */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#e2e8f0]">
                <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
                  <button
                    onClick={() => setActiveTab("press")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                      activeTab === "press"
                        ? "bg-[#002869] text-white"
                        : "bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]"
                    }`}
                  >
                    Basın &amp; Medya ({messages.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("diplomatic")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                      activeTab === "diplomatic"
                        ? "bg-[#002869] text-white"
                        : "bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]"
                    }`}
                  >
                    Kamu &amp; Elçilikler
                  </button>
                  <button
                    onClick={() => setActiveTab("appointments")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                      activeTab === "appointments"
                        ? "bg-[#002869] text-white"
                        : "bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]"
                    }`}
                  >
                    Randevu Defteri
                  </button>
                  <button
                    onClick={() => setActiveTab("kep")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                      activeTab === "kep"
                        ? "bg-[#002869] text-white"
                        : "bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]"
                    }`}
                  >
                    KEP &amp; Yazışmalar
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
                          onClick={() =>
                            handleUpdateStatus(msg.id, "replied")
                          }
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

            {/* Sağ 4 Kolon: Günlük Ajanda & KEP Durumu */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              {/* Günlük Heyet Ajandası */}
              <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#002869] text-[20px]">
                      event_note
                    </span>
                    <h3 className="font-bold text-sm text-[#0f172a]">
                      Günün Heyet Ajandası
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold bg-[#ebf2fc] text-[#002869] px-2 py-0.5 rounded-full">
                    Bugün
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="p-3 bg-[#f8fafc] rounded-lg border-l-4 border-l-[#002869] border border-[#e2e8f0] text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[#002869]">11:00</span>
                      <span className="text-[10px] text-slate-500 font-semibold">
                        VIP Salonu
                      </span>
                    </div>
                    <p className="font-bold text-[#0f172a] mt-1">
                      TRT Haber Prodüksiyon Ekibi
                    </p>
                    <p className="text-[11px] text-[#64748b]">
                      11. Ulusal Zirve Basın Sponsorluk Protokolü
                    </p>
                  </div>

                  <div className="p-3 bg-[#f8fafc] rounded-lg border-l-4 border-l-[#225aba] border border-[#e2e8f0] text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[#225aba]">14:30</span>
                      <span className="text-[10px] text-slate-500 font-semibold">
                        Başkanlık Makamı
                      </span>
                    </div>
                    <p className="font-bold text-[#0f172a] mt-1">
                      Ankara Valiliği Basın Müşaviri
                    </p>
                    <p className="text-[11px] text-[#64748b]">
                      Kamu İletişimi Koordinasyon İstişaresi
                    </p>
                  </div>

                  <div className="p-3 bg-[#f8fafc] rounded-lg border-l-4 border-l-amber-500 border border-[#e2e8f0] text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-amber-600">16:45</span>
                      <span className="text-[10px] text-slate-500 font-semibold">
                        Çevrimiçi Toplantı
                      </span>
                    </div>
                    <p className="font-bold text-[#0f172a] mt-1">
                      Genç AHİD Üniversite Temsilcileri
                    </p>
                    <p className="text-[11px] text-[#64748b]">
                      Güz Dönemi İletişim Atölyesi Planlama
                    </p>
                  </div>
                </div>
              </div>

              {/* Resmi KEP & e-İmza Paneli */}
              <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-xs text-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">
                    Resmi KEP &amp; e-İmza Durumu
                  </span>
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">
                    verified_user
                  </span>
                </div>
                <div className="space-y-2 text-[#334155]">
                  <div className="flex justify-between items-center py-1 border-b border-[#f1f5f9]">
                    <span>KEP Adresi</span>
                    <span className="font-mono font-bold text-[#002869]">
                      ahid@hs01.kep.tr
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-[#f1f5f9]">
                    <span>TÜRKTRUST Sertifikası</span>
                    <span className="font-bold text-emerald-600">
                      Geçerli (2028)
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span>Gelen Tebligat Kontrolü</span>
                    <span className="text-slate-500">10 dk önce (Otomatik)</span>
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
                  placeholder="Örn: Anadolu Ajansı / TRT Haber / Dışişleri Bak."
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
    </div>
  );
}
