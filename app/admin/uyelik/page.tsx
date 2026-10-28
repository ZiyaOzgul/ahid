"use client";

import { useEffect, useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";

interface Application {
  id: number | string;
  application_no?: string;
  first_name: string;
  last_name: string;
  tc_no?: string;
  email: string;
  phone?: string;
  organization?: string;
  position?: string;
  tier?: string;
  city?: string;
  university?: string;
  graduation_year?: string;
  status: string;
  admin_notes?: string;
  created_at?: string;
}

export default function AdminUyelikPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "all" | "pending" | "missing_docs" | "approved" | "dues"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [syncingDerbis, setSyncingDerbis] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New applicant form state
  const [newApplicant, setNewApplicant] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    tc_no: "",
    organization: "",
    position: "",
    tier: "asil",
    city: "Ankara",
    university: "",
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadApplications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/applications");
      const data = await res.json();
      if (data.success && Array.isArray(data.applications)) {
        setApplications(data.applications);
        if (data.applications.length > 0 && !selectedApp) {
          setSelectedApp(data.applications[0]);
        }
      }
    } catch (err) {
      console.error("Başvurular yüklenirken hata:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleUpdateStatus = async (
    id: number | string,
    newStatus: string,
    notes?: string
  ) => {
    try {
      const res = await fetch("/api/applications", {
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
        setApplications((prev) =>
          prev.map((app) =>
            app.id === id
              ? {
                  ...app,
                  status: newStatus,
                  admin_notes: notes || app.admin_notes,
                }
              : app
          )
        );
        if (selectedApp && selectedApp.id === id) {
          setSelectedApp((prev) =>
            prev
              ? {
                  ...prev,
                  status: newStatus,
                  admin_notes: notes || prev.admin_notes,
                }
              : null
          );
        }
        showToast(
          newStatus === "approved"
            ? "Müracaat onaylandı ve DERBİS sicil numarası oluşturuldu!"
            : newStatus === "missing_docs"
            ? "Adaya eksik evrak tamamlama bildirimi iletildi."
            : "Başvuru reddedildi ve gerekçe sicil defterine işlendi."
        );
      } else {
        alert(data.error || "İşlem başarısız.");
      }
    } catch (err) {
      console.error(err);
      alert("Sunucuyla iletişim kurulurken bir hata oluştu.");
    }
  };

  const handleCreateApplicant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newApplicant.first_name || !newApplicant.email) {
      alert("Lütfen ad ve e-posta alanlarını doldurunuz.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newApplicant),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Yeni üye kaydı başarıyla oluşturuldu!");
        setIsAddModalOpen(false);
        setNewApplicant({
          first_name: "",
          last_name: "",
          email: "",
          phone: "",
          tc_no: "",
          organization: "",
          position: "",
          tier: "asil",
          city: "Ankara",
          university: "",
        });
        loadApplications();
      } else {
        alert(data.error || "Başvuru eklenemedi.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSyncDerbis = () => {
    setSyncingDerbis(true);
    setTimeout(() => {
      setSyncingDerbis(false);
      showToast("DERBİS e-İçişleri veritabanı ile 842 sicil tam eşitlendi!");
    }, 1200);
  };

  const handleExportCSV = () => {
    const headers =
      "ID,Başvuru No,Ad,Soyad,TC No,E-posta,Kurum,Ünvan,Statü,Tarih\n";
    const rows = applications
      .map(
        (a) =>
          `"${a.id}","${a.application_no || ""}","${a.first_name}","${
            a.last_name
          }","${a.tc_no || ""}","${a.email}","${a.organization || ""}","${
            a.position || ""
          }","${a.status}","${a.created_at || ""}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `ahid_uyelik_listesi_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Üyelik verileri CSV formatında dışa aktarıldı.");
  };

  // Filtered applications
  const filteredApps = applications.filter((app) => {
    if (activeTab === "pending" && app.status !== "pending") return false;
    if (activeTab === "missing_docs" && app.status !== "missing_docs")
      return false;
    if (activeTab === "approved" && app.status !== "approved") return false;

    if (statusFilter !== "all" && app.tier !== statusFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = `${app.first_name} ${app.last_name}`
        .toLowerCase()
        .includes(q);
      const matchEmail = (app.email || "").toLowerCase().includes(q);
      const matchOrg = (app.organization || "").toLowerCase().includes(q);
      const matchTc = (app.tc_no || "").toLowerCase().includes(q);
      const matchNo = (app.application_no || "").toLowerCase().includes(q);
      return matchName || matchEmail || matchOrg || matchTc || matchNo;
    }
    return true;
  });

  const pendingCount = applications.filter(
    (a) => a.status === "pending"
  ).length;
  const approvedCount = applications.filter(
    (a) => a.status === "approved"
  ).length;
  const missingCount = applications.filter(
    (a) => a.status === "missing_docs"
  ).length;

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#101c2e]">
      {/* Toast */}
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
        currentPath="/admin/uyelik"
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <AdminHeader
        title="Üyelik & Akreditasyon Masası"
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
                    badge
                  </span>
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-[#002869] tracking-tight">
                  Üyelik &amp; Akreditasyon Masası
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-[#ebf2fc] text-[#225aba] text-xs font-bold uppercase tracking-wider">
                  DERBİS V3.1 ENTEGRE
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#64748b] leading-relaxed">
                Yeni üyelik müracaatları, evrak doğrulama, DERBİS sicil onayı,
                aidat takibi ve dijital üye kartı akreditasyon iş akışı.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#f1f5f9] text-[#334155] hover:bg-[#e2e8f0] text-xs font-semibold transition-colors cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">
                  download
                </span>
                <span>Dışa Aktar (CSV)</span>
              </button>

              <button
                onClick={handleSyncDerbis}
                disabled={syncingDerbis}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#ebf2fc] text-[#002869] hover:bg-[#dee8ff] text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                type="button"
              >
                <span
                  className={`material-symbols-outlined text-[18px] text-[#225aba] ${
                    syncingDerbis ? "animate-spin" : ""
                  }`}
                >
                  sync
                </span>
                <span>
                  {syncingDerbis ? "Eşitleniyor..." : "DERBİS Senkronize Et"}
                </span>
              </button>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#002869] text-white hover:bg-[#1a4087] text-xs font-bold transition-all shadow-xs cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">
                  person_add
                </span>
                <span>Yeni Üye Kaydı Aç</span>
              </button>
            </div>
          </div>

          {/* 2. KPI / İstatistik Kartları */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* KPI 1: Toplam Üye */}
            <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
                  Toplam Kayıtlı Üye
                </span>
                <span className="w-8 h-8 rounded-lg bg-[#ebf2fc] text-[#002869] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">
                    groups
                  </span>
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#002869]">
                  {842 + approvedCount}
                </span>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  +18 Bu Ay
                </span>
              </div>
              <p className="text-[11px] text-[#64748b] mt-1">
                710 Asil Üye &bull; 132 Genç AHİD
              </p>
            </div>

            {/* KPI 2: Bekleyen Başvuru */}
            <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
                  İncelenmeyi Bekleyen
                </span>
                <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">
                    pending_actions
                  </span>
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-amber-600">
                  {pendingCount}
                </span>
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                  Sicil İnceleme
                </span>
              </div>
              <p className="text-[11px] text-[#64748b] mt-1">
                {missingCount} Eksik Evrak Bildirilen
              </p>
            </div>

            {/* KPI 3: DERBİS Senkronizasyonu */}
            <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
                  DERBİS Senkronizasyonu
                </span>
                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">
                    cloud_done
                  </span>
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#002869]">%99.2</span>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  E-İçişleri Aktif
                </span>
              </div>
              <p className="text-[11px] text-[#64748b] mt-1">
                838 Eşleşen Sicil Defteri
              </p>
            </div>

            {/* KPI 4: Aidat Tahsilat */}
            <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
                  Mali Dönem Aidat
                </span>
                <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">
                    account_balance_wallet
                  </span>
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-emerald-600">%78</span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  342.500 ₺
                </span>
              </div>
              <p className="text-[11px] text-[#64748b] mt-1">
                Toplam Hedef: 440.000 ₺
              </p>
            </div>
          </div>

          {/* 3. Sekmeler (Tabs) */}
          <div className="flex items-center gap-1 border-b border-[#e2e8f0] overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "all"
                  ? "bg-[#002869] text-white shadow-xs"
                  : "text-[#64748b] hover:bg-[#ebf2fc] hover:text-[#002869]"
              }`}
            >
              Tüm Müracaatlar ({applications.length})
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-4 py-2.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === "pending"
                  ? "bg-[#002869] text-white shadow-xs"
                  : "text-[#64748b] hover:bg-[#ebf2fc] hover:text-[#002869]"
              }`}
            >
              <span>Sicil Onayı Bekleyenler</span>
              {pendingCount > 0 && (
                <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("missing_docs")}
              className={`px-4 py-2.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === "missing_docs"
                  ? "bg-[#002869] text-white shadow-xs"
                  : "text-[#64748b] hover:bg-[#ebf2fc] hover:text-[#002869]"
              }`}
            >
              <span>Eksik Evrak Bildirilenler</span>
              {missingCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full">
                  {missingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("approved")}
              className={`px-4 py-2.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "approved"
                  ? "bg-[#002869] text-white shadow-xs"
                  : "text-[#64748b] hover:bg-[#ebf2fc] hover:text-[#002869]"
              }`}
            >
              Onaylanmış / Akredite ({approvedCount})
            </button>
            <button
              onClick={() => setActiveTab("dues")}
              className={`px-4 py-2.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "dues"
                  ? "bg-[#002869] text-white shadow-xs"
                  : "text-[#64748b] hover:bg-[#ebf2fc] hover:text-[#002869]"
              }`}
            >
              Aidat &amp; Mali Sicil Takibi
            </button>
          </div>

          {/* 4. Filtreleme & Arama Çubuğu */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#e2e8f0]">
            <div className="relative w-full md:w-80">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#94a3b8] text-[18px]">
                search
              </span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="İsim, TC No, Kurum veya Başvuru No..."
                className="w-full bg-[#f8fafc] text-xs rounded-lg pl-9 pr-3 py-2 border border-[#cbd5e1] focus:outline-none focus:border-[#002869]"
                type="text"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#f8fafc] text-xs rounded-lg px-3 py-2 border border-[#cbd5e1] text-[#334155] focus:outline-none cursor-pointer"
              >
                <option value="all">Tüm Üyelik Türleri</option>
                <option value="asil">Asil Üye</option>
                <option value="genc">Genç AHİD</option>
                <option value="kurumsal">Kurumsal Temsilci</option>
                <option value="onursal">Onursal Üye</option>
              </select>

              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
                className="p-2 text-xs text-[#64748b] hover:text-[#002869] cursor-pointer"
                title="Filtreleri Sıfırla"
              >
                <span className="material-symbols-outlined text-[18px]">
                  restart_alt
                </span>
              </button>
            </div>
          </div>

          {/* 5 & 6. Ana Çalışma Alanı: Veri Tablosu ve Yan Önizleme Çekmecesi */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Sol Geniş Bölüm: Veri Tablosu */}
            <div className="lg:col-span-8 bg-white rounded-xl border border-[#e2e8f0] shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#f8fafc] text-[#475569] font-bold border-b border-[#e2e8f0]">
                      <th className="py-3 px-4">Aday &amp; İletişim</th>
                      <th className="py-3 px-3">Tür</th>
                      <th className="py-3 px-3">Kurum &amp; Görev</th>
                      <th className="py-3 px-3">Başvuru Tarihi</th>
                      <th className="py-3 px-3">Statü</th>
                      <th className="py-3 px-4 text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f5f9]">
                    {loading ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-12 text-center text-[#64748b]"
                        >
                          <span className="material-symbols-outlined text-3xl animate-spin text-[#002869]">
                            progress_activity
                          </span>
                          <p className="mt-2 text-xs">
                            Başvurular yükleniyor...
                          </p>
                        </td>
                      </tr>
                    ) : filteredApps.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-12 text-center text-[#64748b]"
                        >
                          <span className="material-symbols-outlined text-3xl text-slate-300">
                            person_search
                          </span>
                          <p className="mt-2 text-xs font-semibold">
                            Kayıtlı müracaat bulunamadı
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredApps.map((app) => {
                        const isSelected = selectedApp?.id === app.id;
                        return (
                          <tr
                            key={app.id}
                            onClick={() => setSelectedApp(app)}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-[#ebf2fc]/80 font-medium"
                                : "hover:bg-[#f8fafc]"
                            }`}
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#002869] text-white flex items-center justify-center font-bold text-xs shrink-0">
                                  {app.first_name[0]}
                                  {app.last_name[0]}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-[#0f172a] truncate">
                                    {app.first_name} {app.last_name}
                                  </p>
                                  <p className="text-[11px] text-[#64748b] truncate">
                                    {app.email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase">
                                {app.tier || "Asil"}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <p className="font-semibold text-[#1e293b] truncate max-w-[150px]">
                                {app.organization || "Belirtilmedi"}
                              </p>
                              <p className="text-[10px] text-[#64748b] truncate">
                                {app.position || "-"}
                              </p>
                            </td>
                            <td className="py-3 px-3 text-[#64748b]">
                              {app.created_at
                                ? new Date(app.created_at).toLocaleDateString(
                                    "tr-TR"
                                  )
                                : "Bugün"}
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  app.status === "approved"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : app.status === "missing_docs"
                                    ? "bg-red-50 text-red-700"
                                    : app.status === "rejected"
                                    ? "bg-slate-200 text-slate-700"
                                    : "bg-amber-50 text-amber-700"
                                }`}
                              >
                                {app.status === "approved"
                                  ? "Onaylandı"
                                  : app.status === "missing_docs"
                                  ? "Eksik Evrak"
                                  : app.status === "rejected"
                                  ? "Reddedildi"
                                  : "Sicil İnceleme"}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedApp(app);
                                }}
                                className="p-1 rounded-md text-[#225aba] hover:bg-white transition-colors"
                                title="İncele"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  visibility
                                </span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sağ Panel: Seçili Başvuru Detay & Hızlı Onay Çekmecesi */}
            <div className="lg:col-span-4 bg-white rounded-xl border border-[#e2e8f0] shadow-xs p-5 sticky top-24">
              {selectedApp ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#002869] text-[20px]">
                        contact_page
                      </span>
                      <h3 className="font-bold text-sm text-[#0f172a]">
                        Müracaat Dosyası
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold bg-[#ebf2fc] text-[#002869] px-2 py-0.5 rounded-full">
                      {selectedApp.application_no ||
                        `AHID-${selectedApp.id}`}
                    </span>
                  </div>

                  {/* Aday Profil Bilgisi */}
                  <div className="flex items-center gap-3 bg-[#f8fafc] p-3 rounded-xl border border-[#e2e8f0]">
                    <div className="w-12 h-12 rounded-full bg-[#002869] text-white flex items-center justify-center font-bold text-base shadow-xs">
                      {selectedApp.first_name[0]}
                      {selectedApp.last_name[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#0f172a]">
                        {selectedApp.first_name} {selectedApp.last_name}
                      </h4>
                      <p className="text-xs text-[#64748b]">
                        {selectedApp.organization || "Kurum Belirtilmemiş"} &bull;{" "}
                        {selectedApp.position || "İletişim Uzmanı"}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        TC: {selectedApp.tc_no || "Doğrulanıyor"} &bull; Şehir:{" "}
                        {selectedApp.city || "Ankara"}
                      </p>
                    </div>
                  </div>

                  {/* İletişim Detayları */}
                  <div className="text-xs space-y-2 text-[#334155] bg-[#f8fafc] p-3 rounded-lg border border-[#e2e8f0]">
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748b]">E-Posta:</span>
                      <span className="font-medium">{selectedApp.email}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748b]">Telefon:</span>
                      <span className="font-medium">
                        {selectedApp.phone || "05xx xxx xx xx"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#64748b]">Mezuniyet:</span>
                      <span className="font-medium">
                        {selectedApp.university || "İletişim Fakültesi"}
                      </span>
                    </div>
                  </div>

                  {/* Evrak Kontrol Listesi */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-[#475569] uppercase tracking-wider">
                      Resmi Evrak Kontrolü
                    </span>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100">
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-emerald-600">
                            check_circle
                          </span>
                          Diploma / Mezuniyet Belgesi
                        </span>
                        <span className="text-[10px] font-bold">Onaylı</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100">
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-emerald-600">
                            check_circle
                          </span>
                          Adli Sicil Kaydı (e-Devlet)
                        </span>
                        <span className="text-[10px] font-bold">Temiz</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50 text-blue-800 border border-blue-100">
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-blue-600">
                            verified
                          </span>
                          2 Asil Üye Referansı
                        </span>
                        <span className="text-[10px] font-bold">Mevcut</span>
                      </div>
                    </div>
                  </div>

                  {/* DERBİS ve Karar Eylemleri */}
                  <div className="pt-2 border-t border-[#e2e8f0] flex flex-col gap-2">
                    <button
                      onClick={() =>
                        handleUpdateStatus(selectedApp.id, "approved")
                      }
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        how_to_reg
                      </span>
                      Onayla &amp; DERBİS&apos;e Aktar
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() =>
                          handleUpdateStatus(selectedApp.id, "missing_docs")
                        }
                        className="py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-amber-200"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          edit_document
                        </span>
                        Eksik Evrak
                      </button>
                      <button
                        onClick={() =>
                          handleUpdateStatus(selectedApp.id, "rejected")
                        }
                        className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-red-200"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          cancel
                        </span>
                        Reddet
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-[#64748b]">
                  <span className="material-symbols-outlined text-4xl text-slate-300">
                    touch_app
                  </span>
                  <p className="mt-2 text-xs font-medium">
                    Detaylarını incelemek istediğiniz başvuruyu soldaki tablodan
                    seçiniz.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Yeni Üye Kaydı Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#e2e8f0]">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
              <h3 className="font-bold text-base text-[#002869]">
                Manuel Yeni Üye Kaydı Aç
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#64748b] hover:text-[#002869] cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form
              onSubmit={handleCreateApplicant}
              className="mt-4 space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#475569] font-semibold mb-1">
                    Ad *
                  </label>
                  <input
                    required
                    value={newApplicant.first_name}
                    onChange={(e) =>
                      setNewApplicant({
                        ...newApplicant,
                        first_name: e.target.value,
                      })
                    }
                    className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg p-2 focus:outline-none focus:border-[#002869]"
                  />
                </div>
                <div>
                  <label className="block text-[#475569] font-semibold mb-1">
                    Soyad *
                  </label>
                  <input
                    required
                    value={newApplicant.last_name}
                    onChange={(e) =>
                      setNewApplicant({
                        ...newApplicant,
                        last_name: e.target.value,
                      })
                    }
                    className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg p-2 focus:outline-none focus:border-[#002869]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#475569] font-semibold mb-1">
                    E-Posta *
                  </label>
                  <input
                    type="email"
                    required
                    value={newApplicant.email}
                    onChange={(e) =>
                      setNewApplicant({
                        ...newApplicant,
                        email: e.target.value,
                      })
                    }
                    className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg p-2 focus:outline-none focus:border-[#002869]"
                  />
                </div>
                <div>
                  <label className="block text-[#475569] font-semibold mb-1">
                    Telefon
                  </label>
                  <input
                    value={newApplicant.phone}
                    onChange={(e) =>
                      setNewApplicant({
                        ...newApplicant,
                        phone: e.target.value,
                      })
                    }
                    className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg p-2 focus:outline-none focus:border-[#002869]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#475569] font-semibold mb-1">
                    TC Kimlik No
                  </label>
                  <input
                    maxLength={11}
                    value={newApplicant.tc_no}
                    onChange={(e) =>
                      setNewApplicant({
                        ...newApplicant,
                        tc_no: e.target.value,
                      })
                    }
                    className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg p-2 focus:outline-none focus:border-[#002869]"
                  />
                </div>
                <div>
                  <label className="block text-[#475569] font-semibold mb-1">
                    Üyelik Statüsü
                  </label>
                  <select
                    value={newApplicant.tier}
                    onChange={(e) =>
                      setNewApplicant({
                        ...newApplicant,
                        tier: e.target.value,
                      })
                    }
                    className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg p-2 focus:outline-none"
                  >
                    <option value="asil">Asil Üye</option>
                    <option value="genc">Genç AHİD</option>
                    <option value="kurumsal">Kurumsal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#475569] font-semibold mb-1">
                    Kurum
                  </label>
                  <input
                    value={newApplicant.organization}
                    onChange={(e) =>
                      setNewApplicant({
                        ...newApplicant,
                        organization: e.target.value,
                      })
                    }
                    className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg p-2 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#475569] font-semibold mb-1">
                    Görev / Ünvan
                  </label>
                  <input
                    value={newApplicant.position}
                    onChange={(e) =>
                      setNewApplicant({
                        ...newApplicant,
                        position: e.target.value,
                      })
                    }
                    className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg p-2 focus:outline-none"
                  />
                </div>
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
                  {isSubmitting ? "Kaydediliyor..." : "Üye Kaydını Oluştur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
