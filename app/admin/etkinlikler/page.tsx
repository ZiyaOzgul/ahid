"use client";

import { useEffect, useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";

interface EventItem {
  id: number;
  title: string;
  category: string;
  event_date: string;
  event_time?: string;
  location: string;
  summary?: string;
  description?: string;
  image_url?: string;
  is_featured?: boolean;
  registration_open?: boolean;
  registrations_count?: number;
}

export default function AdminEtkinliklerPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("Tümü");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Turnike / Gate Feed simulation
  const [qrFeed, setQrFeed] = useState([
    {
      id: 1,
      name: "Dr. Selin Karaca",
      role: "Protokol / Konuşmacı",
      gate: "Turnike A-1 (Protokol Kapısı)",
      time: "1 dk önce",
      status: "verified",
    },
    {
      id: 2,
      name: "Murat Özkan",
      role: "TRT Basın Delegesi",
      gate: "Turnike B-3 (Basın Girişi)",
      time: "3 dk önce",
      status: "verified",
    },
    {
      id: 3,
      name: "Cemil Vural",
      role: "Genç AHİD Katılımcı",
      gate: "Turnike C-2 (Genel Giriş)",
      time: "5 dk önce",
      status: "verified",
    },
  ]);
  const [testQrCode, setTestQrCode] = useState("");

  // New Event Form State
  const [newEvent, setNewEvent] = useState({
    title: "",
    category: "Ulusal Zirve",
    event_date: "",
    event_time: "09:30",
    location: "Ankara Ticaret Odası (ATO) Kongre Salonu",
    summary: "",
    description: "",
    image_url:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1000&auto=format&fit=crop&q=80",
    is_featured: true,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/events");
      const data = await res.json();
      if (data.success && Array.isArray(data.events)) {
        setEvents(data.events);
      }
    } catch (err) {
      console.error("Etkinlikler yüklenirken hata:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.event_date) {
      alert("Lütfen başlık ve tarih alanlarını doldurunuz.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEvent),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Yeni zirve / etkinlik başarıyla takvime eklendi!");
        setIsAddModalOpen(false);
        setNewEvent({
          title: "",
          category: "Ulusal Zirve",
          event_date: "",
          event_time: "09:30",
          location: "Ankara Ticaret Odası (ATO) Kongre Salonu",
          summary: "",
          description: "",
          image_url: "",
          is_featured: false,
        });
        loadEvents();
      } else {
        alert(data.error || "Etkinlik eklenemedi.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleRegistration = async (id: number, current: boolean) => {
    try {
      const res = await fetch("/api/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, registration_open: !current }),
      });
      const data = await res.json();
      if (data.success) {
        setEvents((prev) =>
          prev.map((e) =>
            e.id === id ? { ...e, registration_open: !current } : e
          )
        );
        showToast(
          !current
            ? "Etkinlik kayıtları açıldı."
            : "Etkinlik kayıtları kapatıldı."
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteEvent = async (id: number) => {
    if (!confirm("Bu etkinliği silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/events?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setEvents((prev) => prev.filter((e) => e.id !== id));
        showToast("Etkinlik programdan kaldırıldı.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleManualQrPass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testQrCode.trim()) return;
    const newFeedItem = {
      id: Date.now(),
      name: testQrCode.trim(),
      role: "Manuel Bilet Onayı",
      gate: "Turnike A-1 (Hızlı Geçiş)",
      time: "Az önce",
      status: "verified",
    };
    setQrFeed((prev) => [newFeedItem, ...prev]);
    setTestQrCode("");
    showToast("QR Barkod Doğrulandı! Turnike geçiş izni verildi.");
  };

  const filteredEvents = events.filter((ev) => {
    if (selectedCategory !== "Tümü" && ev.category !== selectedCategory)
      return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        ev.title.toLowerCase().includes(q) ||
        (ev.location || "").toLowerCase().includes(q) ||
        (ev.summary || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

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
        currentPath="/admin/etkinlikler"
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <AdminHeader
        title="Etkinlik & Zirve Masası"
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
                    event_available
                  </span>
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-[#002869] tracking-tight">
                  Etkinlik &amp; Zirve Yönetimi Masası
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                  CANLI AKREDİTASYON
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#64748b] leading-relaxed">
                Protokol oturumları, ulusal zirveler, akreditasyon kapı geçişleri
                ve katılımcı listeleri operasyon merkezi.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() =>
                  showToast("Akreditasyon delege listesi PDF olarak derlendi.")
                }
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#f1f5f9] text-[#334155] hover:bg-[#e2e8f0] text-xs font-semibold transition-colors cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">
                  picture_as_pdf
                </span>
                <span>Akreditasyon Listesi İndir</span>
              </button>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#002869] text-white hover:bg-[#1a4087] text-xs font-bold transition-all shadow-xs cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">
                  add_circle
                </span>
                <span>Yeni Zirve / Etkinlik Oluştur</span>
              </button>
            </div>
          </div>

          {/* 2. KPI Kartları */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
                  Yıllık Katılımcı Hacmi
                </span>
                <span className="w-8 h-8 rounded-lg bg-[#ebf2fc] text-[#002869] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">
                    groups
                  </span>
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#002869]">4,250</span>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  +%18 Artış
                </span>
              </div>
              <p className="text-[11px] text-[#64748b] mt-1">
                Ulusal ve bölgesel forumlar toplamı
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
                  Yaklaşan Zirve
                </span>
                <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">
                    timer
                  </span>
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-amber-600">
                  14 Gün Kaldı
                </span>
              </div>
              <p className="text-[11px] text-[#64748b] mt-1">
                11. Ulusal Halkla İlişkiler Zirvesi
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
                  Akredite Basın &amp; Protokol
                </span>
                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">
                    verified
                  </span>
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#002869]">185</span>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  Vanguard Onaylı
                </span>
              </div>
              <p className="text-[11px] text-[#64748b] mt-1">
                TRT, AA, İHA ve Kamu Basın Müşavirleri
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
                  Salon Doluluk Oranı
                </span>
                <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">
                    chair
                  </span>
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-emerald-600">%92</span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  736 / 800 Koltuk
                </span>
              </div>
              <p className="text-[11px] text-[#64748b] mt-1">
                ATO Meclis Salonu &bull; Ana Oturum
              </p>
            </div>
          </div>

          {/* 3. Ana Grid Alanı: Sol 8 Kolon (Etkinlikler) + Sağ 4 Kolon (Canlı Kapı & Turnike) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Sol 8 Kolon */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              {/* Filtre Barı */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#e2e8f0]">
                <div className="relative w-full sm:w-72">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#94a3b8] text-[18px]">
                    search
                  </span>
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Zirve, çalıştay veya lokasyon ara..."
                    className="w-full bg-[#f8fafc] text-xs rounded-lg pl-9 pr-3 py-2 border border-[#cbd5e1] focus:outline-none focus:border-[#002869]"
                    type="text"
                  />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
                  {[
                    "Tümü",
                    "Ulusal Zirve",
                    "Çalıştay & Panel",
                    "Ödül Töreni",
                  ].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                        selectedCategory === cat
                          ? "bg-[#002869] text-white shadow-xs"
                          : "bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Etkinlik Kartları Listesi */}
              {loading ? (
                <div className="bg-white p-12 rounded-xl text-center text-[#64748b] border border-[#e2e8f0]">
                  <span className="material-symbols-outlined text-3xl animate-spin text-[#002869]">
                    progress_activity
                  </span>
                  <p className="mt-2 text-xs">Etkinlikler yükleniyor...</p>
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="bg-white p-12 rounded-xl text-center text-[#64748b] border border-[#e2e8f0]">
                  <span className="material-symbols-outlined text-4xl text-slate-300">
                    event_busy
                  </span>
                  <p className="mt-2 text-xs font-bold text-slate-600">
                    Kayıtlı etkinlik bulunamadı
                  </p>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="mt-3 px-4 py-2 bg-[#002869] text-white rounded-lg text-xs font-bold"
                  >
                    İlk Etkinliği Oluştur
                  </button>
                </div>
              ) : (
                filteredEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="bg-white rounded-xl border border-[#e2e8f0] shadow-xs overflow-hidden hover:border-[#cbd5e1] transition-all"
                  >
                    <div className="h-1.5 bg-gradient-to-r from-[#002869] via-[#225aba] to-[#4e7ec9]" />

                    <div className="p-5 flex flex-col md:flex-row gap-5">
                      {/* Event Banner Preview */}
                      {ev.image_url ? (
                        <div className="w-full md:w-44 h-32 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                          <img
                            src={ev.image_url}
                            alt={ev.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-full md:w-44 h-32 rounded-lg bg-[#ebf2fc] text-[#002869] flex flex-col items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-3xl">
                            event
                          </span>
                          <span className="text-[10px] font-bold mt-1">
                            AHİD ZİRVE
                          </span>
                        </div>
                      )}

                      {/* Event Details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="px-2.5 py-0.5 rounded-full bg-[#ebf2fc] text-[#002869] text-[10px] font-bold uppercase">
                              {ev.category}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                ev.registration_open !== false
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >
                              {ev.registration_open !== false
                                ? "Kayıtlar Açık"
                                : "Kayıt Kapalı"}
                            </span>
                          </div>

                          <h3 className="text-base font-bold text-[#0f172a] hover:text-[#002869] transition-colors">
                            {ev.title}
                          </h3>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#64748b] mt-2">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[16px] text-[#225aba]">
                                calendar_today
                              </span>
                              {ev.event_date} {ev.event_time && `&bull; ${ev.event_time}`}
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[16px] text-[#225aba]">
                                location_on
                              </span>
                              {ev.location}
                            </span>
                          </div>

                          {ev.summary && (
                            <p className="text-xs text-[#475569] mt-2 line-clamp-2">
                              {ev.summary}
                            </p>
                          )}
                        </div>

                        {/* Capacity and Actions Toolbar */}
                        <div className="mt-4 pt-3 border-t border-[#f1f5f9] flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-[#002869] h-2 rounded-full"
                                style={{ width: "85%" }}
                              />
                            </div>
                            <span className="text-[11px] text-[#64748b] font-medium">
                              {ev.registrations_count || 320} Kayıt
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                handleToggleRegistration(
                                  ev.id,
                                  ev.registration_open !== false
                                )
                              }
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#334155] cursor-pointer"
                            >
                              {ev.registration_open !== false
                                ? "Kaydı Kapat"
                                : "Kaydı Aç"}
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(ev.id)}
                              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Etkinliği Kaldır"
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                delete
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Sağ 4 Kolon: Turnike & Kapı Geçiş Terminali */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              {/* Turnike Monitörü */}
              <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className="font-bold text-sm text-[#0f172a]">
                      Canlı Kapı &amp; Turnike Terminali
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                    Çevrimiçi
                  </span>
                </div>

                {/* Hızlı QR Test Geçiş Girişi */}
                <form onSubmit={handleManualQrPass} className="mt-4">
                  <label className="block text-[11px] font-bold text-[#475569] mb-1">
                    Manuel Delege Barkodu / QR Oku
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={testQrCode}
                      onChange={(e) => setTestQrCode(e.target.value)}
                      placeholder="Delege Adı veya QR No girin..."
                      className="flex-1 bg-[#f8fafc] text-xs rounded-lg px-3 py-2 border border-[#cbd5e1] focus:outline-none focus:border-[#002869]"
                    />
                    <button
                      type="submit"
                      className="px-3 py-2 bg-[#002869] text-white rounded-lg text-xs font-bold hover:bg-[#1a4087] cursor-pointer"
                    >
                      Onayla
                    </button>
                  </div>
                </form>

                {/* Turnike İstatistikleri */}
                <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                  <div className="p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
                    <span className="text-[10px] text-[#64748b] uppercase font-bold block">
                      Turnike Geçiş
                    </span>
                    <span className="text-lg font-bold text-[#002869]">
                      482 Kişi
                    </span>
                  </div>
                  <div className="p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
                    <span className="text-[10px] text-[#64748b] uppercase font-bold block">
                      Kalan Bilet
                    </span>
                    <span className="text-lg font-bold text-amber-600">
                      64 Koltuk
                    </span>
                  </div>
                </div>

                {/* Canlı Akış Feed Listesi */}
                <div className="mt-4">
                  <h4 className="text-xs font-bold text-[#475569] uppercase tracking-wider mb-2">
                    Son Geçiş Kayıtları
                  </h4>
                  <div className="space-y-2">
                    {qrFeed.map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-lg bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="material-symbols-outlined text-emerald-600 text-[18px]">
                            qr_code_scanner
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-[#0f172a] truncate">
                              {item.name}
                            </p>
                            <p className="text-[10px] text-[#64748b]">
                              {item.role} &bull; {item.gate}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium shrink-0">
                          {item.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Kurumsal Lojistik Kartı */}
              <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-xs text-xs">
                <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider block mb-2">
                  Lojistik &amp; Protokol Sorumluları
                </span>
                <div className="space-y-2 text-[#334155]">
                  <div className="flex justify-between items-center py-1 border-b border-[#f1f5f9]">
                    <span>Ana Salon Koordinatörü</span>
                    <span className="font-bold text-[#002869]">
                      Burak Söylemez
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-[#f1f5f9]">
                    <span>Basın Akreditasyon Masası</span>
                    <span className="font-bold text-[#002869]">
                      Zeynep Güler
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span>Protokol Karşılama</span>
                    <span className="font-bold text-[#002869]">
                      Ahmet Yılmaz
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Yeni Etkinlik Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#e2e8f0] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
              <h3 className="font-bold text-base text-[#002869]">
                Yeni Zirve veya Etkinlik Programla
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#64748b] hover:text-[#002869] cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form
              onSubmit={handleCreateEvent}
              className="mt-4 space-y-3 text-xs"
            >
              <div>
                <label className="block text-[#475569] font-semibold mb-1">
                  Etkinlik / Zirve Başlığı *
                </label>
                <input
                  required
                  value={newEvent.title}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, title: e.target.value })
                  }
                  placeholder="Örn: 11. Ulusal Halkla İlişkiler ve İletişim Zirvesi"
                  className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg p-2 focus:outline-none focus:border-[#002869]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#475569] font-semibold mb-1">
                    Kategori
                  </label>
                  <select
                    value={newEvent.category}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, category: e.target.value })
                    }
                    className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg p-2 focus:outline-none"
                  >
                    <option value="Ulusal Zirve">Ulusal Zirve</option>
                    <option value="Çalıştay & Panel">Çalıştay &amp; Panel</option>
                    <option value="Ödül Töreni">Ödül Töreni</option>
                    <option value="Akademik Sempozyum">
                      Akademik Sempozyum
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#475569] font-semibold mb-1">
                    Tarih *
                  </label>
                  <input
                    required
                    value={newEvent.event_date}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, event_date: e.target.value })
                    }
                    placeholder="Örn: 24 Mayıs 2026"
                    className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg p-2 focus:outline-none focus:border-[#002869]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#475569] font-semibold mb-1">
                    Saat
                  </label>
                  <input
                    value={newEvent.event_time}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, event_time: e.target.value })
                    }
                    placeholder="09:30 - 18:00"
                    className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg p-2 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#475569] font-semibold mb-1">
                    Lokasyon / Salon
                  </label>
                  <input
                    value={newEvent.location}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, location: e.target.value })
                    }
                    placeholder="ATO Meclis Salonu - Ankara"
                    className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg p-2 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#475569] font-semibold mb-1">
                  Kısa Özet &amp; Kapsam
                </label>
                <textarea
                  rows={2}
                  value={newEvent.summary}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, summary: e.target.value })
                  }
                  placeholder="Etkinliğin ana teması ve katılımcı hedefi..."
                  className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg p-2 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#475569] font-semibold mb-1">
                  Afiş Görsel URL
                </label>
                <input
                  value={newEvent.image_url}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, image_url: e.target.value })
                  }
                  placeholder="https://..."
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
                  {isSubmitting ? "Kaydediliyor..." : "Etkinliği Yayınla"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
