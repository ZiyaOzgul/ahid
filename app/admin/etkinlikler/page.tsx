"use client";

import { useEffect, useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { EVENT_DEFAULT_CAPACITY } from "@/lib/constants";

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

interface RegistrationItem {
  id: number;
  event_id: number;
  full_name: string;
  email: string;
  phone?: string | null;
  organization?: string | null;
  title?: string | null;
  ticket_type?: string | null;
  status: string;
  created_at?: string;
  events?: {
    id: number;
    title: string;
    event_date?: string;
    location?: string;
  } | null;
}

export default function AdminEtkinliklerPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("Tümü");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [testQrCode, setTestQrCode] = useState("");

  // New / Edit Event Form State
  const [newEvent, setNewEvent] = useState({
    title: "",
    category: "Ulusal Zirve",
    event_date: "",
    event_time: "09:30",
    location: "AHİD Genel Merkez Konferans Salonu",
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

  const loadEvents = async (withSpinner = false) => {
    if (withSpinner) setLoading(true);
    try {
      const [evRes, regRes] = await Promise.all([
        fetch("/api/events"),
        fetch("/api/events/register"),
      ]);
      const evData = await evRes.json();
      const regData = await regRes.json();
      if (evData.success && Array.isArray(evData.events)) {
        setEvents(evData.events);
      }
      if (regData.success && Array.isArray(regData.registrations)) {
        setRegistrations(regData.registrations);
      }
    } catch (err) {
      console.error("Etkinlikler yüklenirken hata:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/events").then((r) => r.json()).catch(() => null),
      fetch("/api/events/register").then((r) => r.json()).catch(() => null),
    ]).then(([evData, regData]) => {
      if (!active) return;
      if (evData?.success && Array.isArray(evData.events)) {
        setEvents(evData.events);
      }
      if (regData?.success && Array.isArray(regData.registrations)) {
        setRegistrations(regData.registrations);
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const resetEventForm = () => {
    setEditingEventId(null);
    setNewEvent({
      title: "",
      category: "Ulusal Zirve",
      event_date: "",
      event_time: "09:30",
      location: "AHİD Genel Merkez Konferans Salonu",
      summary: "",
      description: "",
      image_url:
        "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1000&auto=format&fit=crop&q=80",
      is_featured: false,
    });
  };

  const handleOpenEdit = (ev: EventItem) => {
    setEditingEventId(ev.id);
    setNewEvent({
      title: ev.title,
      category: ev.category || "Ulusal Zirve",
      event_date: ev.event_date,
      event_time: ev.event_time || "09:30",
      location: ev.location || "",
      summary: ev.summary || "",
      description: ev.description || "",
      image_url: ev.image_url || "",
      is_featured: Boolean(ev.is_featured),
    });
    setIsAddModalOpen(true);
  };

  const handleCreateOrUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.event_date) {
      showToast("Lütfen başlık ve tarih alanlarını doldurunuz.");
      return;
    }
    setIsSubmitting(true);
    try {
      const method = editingEventId ? "PATCH" : "POST";
      const payload = editingEventId ? { id: editingEventId, ...newEvent } : newEvent;
      const res = await fetch("/api/events", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          editingEventId
            ? "Etkinlik bilgileri güncellendi!"
            : "Yeni zirve / etkinlik başarıyla takvime eklendi!"
        );
        setIsAddModalOpen(false);
        resetEventForm();
        loadEvents();
      } else {
        showToast(data.error || "İşlem tamamlanamadı.");
      }
    } catch (err) {
      console.error(err);
      showToast("Sunucu bağlantı hatası.");
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
    try {
      const res = await fetch(`/api/events?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setEvents((prev) => prev.filter((e) => e.id !== id));
        setConfirmDeleteId(null);
        showToast("Etkinlik programdan kaldırıldı.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckInParticipant = async (regId: number, currentStatus: string) => {
    const nextStatus = currentStatus === "checked_in" ? "confirmed" : "checked_in";
    try {
      const res = await fetch("/api/events/register", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: regId, status: nextStatus }),
      });
      const data = await res.json();
      if (data.success && data.registration) {
        setRegistrations((prev) =>
          prev.map((r) => (r.id === regId ? data.registration : r))
        );
        showToast(
          nextStatus === "checked_in"
            ? "Katılımcı girişi onaylandı."
            : "Katılımcı durumu onaylı kayda döndürüldü."
        );
      }
    } catch {
      showToast("Akreditasyon durumu güncellenemedi.");
    }
  };

  const handleManualQrPass = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = testQrCode.trim().toLowerCase();
    if (!q) return;

    const match = registrations.find(
      (r) =>
        String(r.id) === q ||
        `ahid-${r.id}` === q ||
        r.full_name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q)
    );

    if (!match) {
      showToast("Eşleşen kayıtlı katılımcı bulunamadı.");
      return;
    }

    await handleCheckInParticipant(match.id, match.status);
    setTestQrCode("");
  };

  const handleDownloadAccreditationCsv = () => {
    const header = ["Kayit ID", "Etkinlik", "Ad Soyad", "E-Posta", "Telefon", "Kurum", "Unvan", "Bilet", "Durum"];
    const rows = registrations.map((r) => [
      r.id,
      r.events?.title || `Etkinlik #${r.event_id}`,
      r.full_name,
      r.email,
      r.phone || "",
      r.organization || "",
      r.title || "",
      r.ticket_type || "standart",
      r.status,
    ]);
    const csv = [header, ...rows]
      .map((cols) => cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ahid-etkinlik-akreditasyon-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`${registrations.length} katılımcı kaydı CSV olarak indirildi.`);
  };

  const checkedInCount = registrations.filter((r) => r.status === "checked_in").length;
  const openEventsCount = events.filter((e) => e.registration_open !== false).length;
  const nextFeaturedEvent = events.find((e) => e.is_featured) || events[0] || null;
  const openRatio = events.length > 0 ? Math.round((openEventsCount / events.length) * 100) : 0;

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
                onClick={handleDownloadAccreditationCsv}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#f1f5f9] text-[#334155] hover:bg-[#e2e8f0] text-xs font-semibold transition-colors cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">
                  download
                </span>
                <span>Akreditasyon Listesi İndir (CSV)</span>
              </button>

              <button
                onClick={() => {
                  resetEventForm();
                  setIsAddModalOpen(true);
                }}
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
                  Aktif Program Sayısı
                </span>
                <span className="w-8 h-8 rounded-lg bg-[#ebf2fc] text-[#002869] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">
                    event_available
                  </span>
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#002869]">{events.length}</span>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {openEventsCount} Kayda Açık
                </span>
              </div>
              <p className="text-[11px] text-[#64748b] mt-1">
                Canlı takvimde yayınlanan etkinlikler
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
                  Öne Çıkan Etkinlik
                </span>
                <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">
                    timer
                  </span>
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-lg font-bold text-amber-600 truncate">
                  {nextFeaturedEvent ? nextFeaturedEvent.event_date : "Planlanıyor"}
                </span>
              </div>
              <p className="text-[11px] text-[#64748b] mt-1 truncate">
                {nextFeaturedEvent ? nextFeaturedEvent.title : "Henüz öne çıkan etkinlik yok"}
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
                  Toplam Katılımcı Kaydı
                </span>
                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">
                    groups
                  </span>
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#002869]">{registrations.length}</span>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  {checkedInCount} Giriş Yaptı
                </span>
              </div>
              <p className="text-[11px] text-[#64748b] mt-1">
                Kayıtlı delege ve katılımcılar
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
                  Kayıt Açıklık Oranı
                </span>
                <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">
                    verified
                  </span>
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-emerald-600">%{openRatio}</span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {openEventsCount} / {events.length} Açık
                </span>
              </div>
              <p className="text-[11px] text-[#64748b] mt-1">
                Katılımcı başvurusuna açık oturumlar
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
                                className="bg-[#002869] h-2 rounded-full transition-all"
                                style={{
                                  width: `${
                                    (ev.registrations_count || 0) === 0
                                      ? 0
                                      : Math.min(
                                          100,
                                          Math.max(
                                            4,
                                            Math.round(
                                              ((ev.registrations_count || 0) /
                                                EVENT_DEFAULT_CAPACITY) *
                                                100
                                            )
                                          )
                                        )
                                  }%`,
                                }}
                              />
                            </div>
                            <span className="text-[11px] text-[#64748b] font-medium">
                              {ev.registrations_count ?? 0} / {EVENT_DEFAULT_CAPACITY} Katılımcı
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenEdit(ev)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#ebf2fc] hover:bg-[#dee8ff] text-[#002869] cursor-pointer"
                            >
                              Düzenle
                            </button>
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
                            {confirmDeleteId === ev.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDeleteEvent(ev.id)}
                                  className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-xs font-bold cursor-pointer"
                                >
                                  Sil
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs cursor-pointer"
                                >
                                  İptal
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteId(ev.id)}
                                className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Etkinliği Kaldır"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  delete
                                </span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Sağ 4 Kolon: Katılımcı Akreditasyon & Check-In Masası */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <h3 className="font-bold text-sm text-[#0f172a]">
                      Katılımcı Akreditasyon Masası
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold bg-[#ebf2fc] text-[#002869] px-2 py-0.5 rounded-full">
                    Canlı Liste
                  </span>
                </div>

                {/* Hızlı Katılımcı Check-In Arama */}
                <form onSubmit={handleManualQrPass} className="mt-4">
                  <label className="block text-[11px] font-bold text-[#475569] mb-1">
                    Katılımcı Check-In (Ad, E-Posta veya Kayıt No)
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={testQrCode}
                      onChange={(e) => setTestQrCode(e.target.value)}
                      placeholder="Örn: Ad Soyad, e-posta veya ID..."
                      className="flex-1 bg-[#f8fafc] text-xs rounded-lg px-3 py-2 border border-[#cbd5e1] focus:outline-none focus:border-[#002869]"
                    />
                    <button
                      type="submit"
                      className="px-3 py-2 bg-[#002869] text-white rounded-lg text-xs font-bold hover:bg-[#1a4087] cursor-pointer"
                    >
                      Check-In
                    </button>
                  </div>
                </form>

                {/* Gerçek Kayıt İstatistikleri */}
                <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                  <div className="p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
                    <span className="text-[10px] text-[#64748b] uppercase font-bold block">
                      Toplam Kayıtlı
                    </span>
                    <span className="text-lg font-bold text-[#002869]">
                      {registrations.length} Kişi
                    </span>
                  </div>
                  <div className="p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
                    <span className="text-[10px] text-[#64748b] uppercase font-bold block">
                      Giriş Onaylanan
                    </span>
                    <span className="text-lg font-bold text-emerald-600">
                      {checkedInCount} Kişi
                    </span>
                  </div>
                </div>

                {/* Gerçek Katılımcı Kayıtları Listesi */}
                <div className="mt-4">
                  <h4 className="text-xs font-bold text-[#475569] uppercase tracking-wider mb-2">
                    Kayıtlı Katılımcılar
                  </h4>
                  {registrations.length === 0 ? (
                    <div className="p-4 rounded-lg bg-[#f8fafc] border border-dashed border-[#cbd5e1] text-center text-xs text-[#64748b]">
                      Henüz etkinlik katılım kaydı bulunmuyor.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {registrations.map((reg) => (
                        <div
                          key={reg.id}
                          className="p-2.5 rounded-lg bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-[#0f172a] truncate">
                              {reg.full_name}
                            </p>
                            <p className="text-[10px] text-[#64748b] truncate">
                              {reg.events?.title || `Etkinlik #${reg.event_id}`} &bull; {reg.ticket_type || "Standart"}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCheckInParticipant(reg.id, reg.status)}
                            className={`px-2 py-1 rounded text-[10px] font-bold shrink-0 cursor-pointer ${
                              reg.status === "checked_in"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-blue-50 text-[#002869] hover:bg-blue-100"
                            }`}
                          >
                            {reg.status === "checked_in" ? "Giriş Onaylı ✓" : "Giriş Onayla"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Etkinlik & Akreditasyon Özeti Kartı */}
              <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-xs text-xs">
                <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider block mb-2">
                  Program &amp; Katılım Özeti
                </span>
                <div className="space-y-2 text-[#334155]">
                  <div className="flex justify-between items-center py-1 border-b border-[#f1f5f9]">
                    <span>Toplam Etkinlik</span>
                    <span className="font-bold text-[#002869]">
                      {events.length} Program
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-[#f1f5f9]">
                    <span>Öne Çıkan (Vitrin)</span>
                    <span className="font-bold text-[#002869] truncate max-w-[160px]" title={events.find((e) => e.is_featured)?.title || "Belirlenmedi"}>
                      {events.find((e) => e.is_featured)?.title || "Belirlenmedi"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span>Akreditasyon Onay Oranı</span>
                    <span className="font-bold text-emerald-700">
                      {registrations.length > 0
                        ? `%${Math.round((checkedInCount / registrations.length) * 100)}`
                        : "Henüz kayıt yok"}
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
                {editingEventId ? "Etkinlik Bilgilerini Düzenle" : "Yeni Zirve veya Etkinlik Programla"}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  resetEventForm();
                }}
                className="text-[#64748b] hover:text-[#002869] cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form
              onSubmit={handleCreateOrUpdateEvent}
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
                    placeholder="Etkinlik Mekanı / Salon Adı"
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
                  {isSubmitting
                    ? "Kaydediliyor..."
                    : editingEventId
                    ? "Değişiklikleri Kaydet"
                    : "Etkinliği Yayınla"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
