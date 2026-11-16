"use client";

import { useEffect, useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";

interface AdminUser {
  id: number;
  email: string;
  full_name?: string;
  role: string;
  created_at?: string;
}

interface AuditEntry {
  id: string;
  user: string;
  action: string;
  detail: string;
  time: string;
  status: "success" | "warning";
}

function formatAuditTime(dateStr?: string) {
  if (!dateStr) return "Yakın zaman";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "Yakın zaman";
  return d.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminSistemPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"rbac" | "api" | "kvkk">("rbac");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [systemLockdown, setSystemLockdown] = useState(false);
  const [lockdownConfirm, setLockdownConfirm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [savingPolicyKey, setSavingPolicyKey] = useState<string | null>(null);
  const [dbStats, setDbStats] = useState({ applications: 0, contacts: 0 });

  // System switches state (persisted in cms_variables)
  const [toggles, setToggles] = useState({
    derbisSync: true,
    kepSigning: true,
    kvkkMasking: true,
    twoFactor: true,
  });

  // Live audit logs derived from Supabase records + session mutations
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);

  // New Admin Form State
  const [newAdmin, setNewAdmin] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "editor",
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const appendAudit = (entry: Omit<AuditEntry, "id" | "time">) => {
    setAuditLogs((prev) => [
      {
        ...entry,
        id: `session-${Date.now()}`,
        time: "Şimdi",
      },
      ...prev.slice(0, 5),
    ]);
  };

  const loadSystemData = async () => {
    setLoading(true);
    try {
      const [usersRes, cmsRes, appsRes, contactRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/cms"),
        fetch("/api/applications").catch(() => null),
        fetch("/api/contact").catch(() => null),
      ]);

      const usersData = await usersRes.json();
      const cmsData = await cmsRes.json();
      const appsData = appsRes ? await appsRes.json().catch(() => null) : null;
      const contactData = contactRes ? await contactRes.json().catch(() => null) : null;

      if (usersData.success && Array.isArray(usersData.users)) {
        setUsers(usersData.users);
      }

      if (cmsData?.success && cmsData.variables) {
        const v = cmsData.variables as Record<string, string>;
        setToggles({
          derbisSync: v.system_derbis_sync !== "false",
          kepSigning: v.system_kep_signing !== "false",
          kvkkMasking: v.system_kvkk_masking !== "false",
          twoFactor: v.system_two_factor !== "false",
        });
        setSystemLockdown(v.system_lockdown === "true");
      }

      const apps = Array.isArray(appsData?.applications) ? appsData.applications : [];
      const contacts = Array.isArray(contactData?.messages) ? contactData.messages : [];
      setDbStats({ applications: apps.length, contacts: contacts.length });

      const entries: AuditEntry[] = [];
      for (const u of (usersData.users || []).slice(0, 2)) {
        entries.push({
          id: `user-${u.id}`,
          user: u.full_name || u.email,
          action: `${u.role === "admin" ? "Süper Yönetici" : "Editör"} yetkisi tanımlı`,
          detail: u.email,
          time: formatAuditTime(u.created_at),
          status: "success",
        });
      }
      for (const app of apps.slice(0, 2)) {
        entries.push({
          id: `app-${app.id}`,
          user: app.full_name || "Başvuru Sahibi",
          action: `Üyelik başvurusu (${app.status === "approved" ? "Onaylı" : app.status === "rejected" ? "Reddedildi" : "İncelemede"})`,
          detail: app.organization || app.membership_type || "Üyelik Sicili",
          time: formatAuditTime(app.created_at),
          status: "success",
        });
      }
      for (const msg of contacts.slice(0, 2)) {
        entries.push({
          id: `msg-${msg.id}`,
          user: msg.name || "İletişim Talebi",
          action: `Protokol / iletişim kaydı (${msg.status || "unread"})`,
          detail: msg.subject || msg.department || "Genel Sekreterlik",
          time: formatAuditTime(msg.created_at),
          status: msg.status === "unread" ? "warning" : "success",
        });
      }
      setAuditLogs(entries.slice(0, 6));
    } catch (err) {
      console.error("Sistem verileri yüklenirken hata:", err);
      showToast("Sistem verileri yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSystemData();
  }, []);

  const handleTogglePolicy = async (
    key: keyof typeof toggles,
    cmsKey: string,
    enabledMsg: string,
    disabledMsg: string
  ) => {
    const nextVal = !toggles[key];
    setSavingPolicyKey(key);
    setToggles((prev) => ({ ...prev, [key]: nextVal }));
    try {
      const res = await fetch("/api/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page: "system",
          updates: { [cmsKey]: String(nextVal) },
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(nextVal ? enabledMsg : disabledMsg);
        appendAudit({
          user: "Yönetim Paneli",
          action: nextVal ? enabledMsg : disabledMsg,
          detail: `CMS Anahtarı: ${cmsKey}`,
          status: nextVal ? "success" : "warning",
        });
      } else {
        setToggles((prev) => ({ ...prev, [key]: !nextVal }));
        showToast(data.error || "Politika ayarı kaydedilemedi.");
      }
    } catch (err) {
      console.error(err);
      setToggles((prev) => ({ ...prev, [key]: !nextVal }));
      showToast("Politika kaydedilirken ağ hatası oluştu.");
    } finally {
      setSavingPolicyKey(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdmin.email || !newAdmin.password) {
      showToast("Lütfen e-posta ve şifre alanlarını doldurunuz.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAdmin),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Yeni yetkili kullanıcı hesabı başarıyla tanımlandı!");
        appendAudit({
          user: newAdmin.full_name || newAdmin.email,
          action: `Yeni ${newAdmin.role} hesabı oluşturuldu`,
          detail: newAdmin.email,
          status: "success",
        });
        setIsAddModalOpen(false);
        setNewAdmin({
          email: "",
          password: "",
          full_name: "",
          role: "editor",
        });
        loadSystemData();
      } else {
        showToast(data.error || "Kullanıcı oluşturulamadı.");
      }
    } catch (err) {
      console.error(err);
      showToast("Kullanıcı oluşturulurken hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRole = async (id: number, currentRole: string) => {
    const nextRole = currentRole === "admin" ? "editor" : "admin";
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, role: nextRole }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, role: nextRole } : u))
        );
        showToast(`Kullanıcı rolü "${nextRole.toUpperCase()}" olarak güncellendi.`);
        appendAudit({
          user: `Kullanıcı #${id}`,
          action: `Rolü ${nextRole.toUpperCase()} olarak güncellendi`,
          detail: "RBAC Matrisi",
          status: "success",
        });
      } else {
        showToast(data.error || "Rol güncellenemedi.");
      }
    } catch (err) {
      console.error(err);
      showToast("Rol güncellenirken hata oluştu.");
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (id === 1 || id === 3) {
      showToast("Ana sistem yöneticisi hesabı silinemez.");
      return;
    }
    try {
      const res = await fetch(`/api/users?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
        setConfirmDeleteId(null);
        showToast("Kullanıcı hesabı ve yetkileri iptal edildi.");
        appendAudit({
          user: `Kullanıcı #${id}`,
          action: "Yönetici / editör hesabı silindi",
          detail: "RBAC Yetki İptali",
          status: "warning",
        });
      } else {
        showToast(data.error || "Kullanıcı silinemedi.");
      }
    } catch (err) {
      console.error(err);
      showToast("Kullanıcı silinirken hata oluştu.");
    }
  };

  const handleToggleLockdown = async () => {
    const nextLockdown = !systemLockdown;
    try {
      const res = await fetch("/api/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page: "system",
          updates: { system_lockdown: String(nextLockdown) },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSystemLockdown(nextLockdown);
        setLockdownConfirm(false);
        showToast(
          nextLockdown
            ? "ACİL DURUM KİLİDİ AKTİF: Sistem koruma durumu kaydedildi."
            : "Acil durum yetki kilidi kaldırıldı."
        );
        appendAudit({
          user: "Yönetim Paneli",
          action: nextLockdown ? "Acil Yetki Kilidi aktif edildi" : "Acil Yetki Kilidi kaldırıldı",
          detail: "system_lockdown",
          status: nextLockdown ? "warning" : "success",
        });
      } else {
        showToast(data.error || "Kilit durumu güncellenemedi.");
      }
    } catch (err) {
      console.error(err);
      showToast("Kilit güncellenirken hata oluştu.");
    }
  };

  const enabledPoliciesCount = Object.values(toggles).filter(Boolean).length;
  const securityScore = Math.round((enabledPoliciesCount / 4) * 100);
  const totalRecordsCount = users.length + dbStats.applications + dbStats.contacts;

  const filteredUsers = users.filter((u) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        u.email.toLowerCase().includes(q) ||
        (u.full_name || "").toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
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
        currentPath="/admin/sistem"
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <AdminHeader
        title="Sistem & Güvenlik Masası"
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
                    admin_panel_settings
                  </span>
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-[#002869] tracking-tight">
                  Sistem, Güvenlik &amp; Yetkilendirme Masası
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                  RBAC AKTİF
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#64748b] leading-relaxed">
                RBAC rol matrisi, API servis anahtarları, KVKK log kayıtları ve
                iki adımlı doğrulama (2FA) yönetim merkezi.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {lockdownConfirm ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-300 text-xs">
                  <span className="font-bold text-red-700">
                    {systemLockdown ? "Kilidi Kaldır?" : "Yetki Kilidini Onayla?"}
                  </span>
                  <button
                    onClick={handleToggleLockdown}
                    type="button"
                    className="px-2.5 py-1 rounded bg-red-600 text-white font-bold hover:bg-red-700 cursor-pointer"
                  >
                    Evet
                  </button>
                  <button
                    onClick={() => setLockdownConfirm(false)}
                    type="button"
                    className="px-2.5 py-1 rounded bg-white text-slate-700 border border-slate-300 font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    İptal
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setLockdownConfirm(true)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                    systemLockdown
                      ? "bg-red-600 text-white hover:bg-red-700 border-red-700"
                      : "bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
                  }`}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {systemLockdown ? "lock_open" : "lock"}
                  </span>
                  <span>
                    {systemLockdown ? "Yetki Kilidini Kaldır" : "Acil Yetki Kilidi"}
                  </span>
                </button>
              )}

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#002869] text-white hover:bg-[#1a4087] text-xs font-bold transition-all shadow-xs cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">
                  person_add
                </span>
                <span>Yeni Yönetici / Editör Ekle</span>
              </button>
            </div>
          </div>

          {systemLockdown && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-red-600 text-[20px]">
                  gpp_maybe
                </span>
                <span className="font-bold">
                  Acil Yetki Kilidi Aktif: Sistem koruma bayrağı veritabanında işaretli durumda.
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleLockdown}
                className="px-3 py-1 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 cursor-pointer"
              >
                Kilidi Kaldır
              </button>
            </div>
          )}

          {/* 2. KPI / Güvenlik Göstergeleri */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
                  Politika Uyum Skoru
                </span>
                <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">
                    shield
                  </span>
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-emerald-600">
                  %{securityScore}
                </span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {securityScore >= 75 ? "Yüksek Koruma" : "Temel Düzey"}
                </span>
              </div>
              <p className="text-[11px] text-[#64748b] mt-1">
                {enabledPoliciesCount} / 4 güvenlik politikası aktif
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
                  Tanımlı Yönetici / Editör
                </span>
                <span className="w-8 h-8 rounded-lg bg-[#ebf2fc] text-[#002869] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">
                    manage_accounts
                  </span>
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#002869]">
                  {users.length} Hesap
                </span>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  Canlı Liste
                </span>
              </div>
              <p className="text-[11px] text-[#64748b] mt-1">
                {users.filter((u) => u.role === "admin").length} Süper Yönetici &bull;{" "}
                {users.filter((u) => u.role !== "admin").length} Editör
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
                  Aktif Sistem Politikaları
                </span>
                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">
                    hub
                  </span>
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#002869]">
                  {enabledPoliciesCount} / 4
                </span>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  Kalıcı CMS
                </span>
              </div>
              <p className="text-[11px] text-[#64748b] mt-1">
                DERBİS, KEP, KVKK Maskeleme, 2FA
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
                  İzlenen Sistem Kaydı
                </span>
                <span className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">
                    receipt_long
                  </span>
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-purple-600">
                  {totalRecordsCount}
                </span>
                <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                  Supabase DB
                </span>
              </div>
              <p className="text-[11px] text-[#64748b] mt-1">
                {dbStats.applications} Başvuru &bull; {dbStats.contacts} İletişim
              </p>
            </div>
          </div>

          {/* 3. Ana Grid Alanı: Sol 8 Kolon (Rol Matrisi & Ayarlar) + Sağ 4 Kolon (Canlı Log & Sertifikalar) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Sol 8 Kolon */}
            <div className="lg:col-span-8 flex flex-col gap-5">
              {/* Sekmeler & Arama */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#e2e8f0]">
                <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
                  <button
                    onClick={() => setActiveTab("rbac")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                      activeTab === "rbac"
                        ? "bg-[#002869] text-white"
                        : "bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]"
                    }`}
                  >
                    RBAC Rol Matrisi ({users.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("api")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                      activeTab === "api"
                        ? "bg-[#002869] text-white"
                        : "bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]"
                    }`}
                  >
                    API Entegrasyonları
                  </button>
                  <button
                    onClick={() => setActiveTab("kvkk")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                      activeTab === "kvkk"
                        ? "bg-[#002869] text-white"
                        : "bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]"
                    }`}
                  >
                    KVKK &amp; Veri Güvenliği
                  </button>
                </div>

                <div className="relative w-full sm:w-60">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#94a3b8] text-[18px]">
                    search
                  </span>
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Kullanıcı veya e-posta..."
                    className="w-full bg-[#f8fafc] text-xs rounded-lg pl-9 pr-3 py-2 border border-[#cbd5e1] focus:outline-none focus:border-[#002869]"
                    type="text"
                  />
                </div>
              </div>

              {/* RBAC Kullanıcı Tablosu */}
              {activeTab === "rbac" && (
              <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-xs overflow-hidden">
                <div className="p-4 border-b border-[#e2e8f0] flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-[#0f172a]">
                      Yetkili Sistem Yöneticileri &amp; Editörler
                    </h3>
                    <p className="text-xs text-[#64748b]">
                      Supabase veritabanında kayıtlı idari erişim listesi
                    </p>
                  </div>
                  <span className="text-xs font-bold bg-[#ebf2fc] text-[#002869] px-2.5 py-1 rounded-full">
                    Canlı Veri
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#f8fafc] text-[#475569] font-bold border-b border-[#e2e8f0]">
                        <th className="py-3 px-4">Yönetici / Kullanıcı</th>
                        <th className="py-3 px-3">E-Posta</th>
                        <th className="py-3 px-3">Yetki Düzeyi</th>
                        <th className="py-3 px-3">2FA Politikası</th>
                        <th className="py-3 px-4 text-right">Eylemler</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1f5f9]">
                      {loading ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="py-12 text-center text-[#64748b]"
                          >
                            <span className="material-symbols-outlined text-3xl animate-spin text-[#002869]">
                              progress_activity
                            </span>
                            <p className="mt-2 text-xs">
                              Kullanıcılar yükleniyor...
                            </p>
                          </td>
                        </tr>
                      ) : filteredUsers.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="py-10 text-center text-[#64748b] text-xs"
                          >
                            Aramanızla eşleşen yönetici veya editör bulunamadı.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-[#f8fafc]">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-[#002869] text-white flex items-center justify-center font-bold text-xs">
                                  {u.full_name ? u.full_name[0] : u.email[0].toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-bold text-[#0f172a]">
                                    {u.full_name || u.email.split("@")[0]}
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    ID: #{u.id}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 font-mono text-[11px] text-[#334155]">
                              {u.email}
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  u.role === "admin"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {u.role === "admin" ? "Süper Yönetici" : "Editör"}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                  toggles.twoFactor
                                    ? "text-emerald-700 bg-emerald-50"
                                    : "text-amber-700 bg-amber-50"
                                }`}
                              >
                                <span className="material-symbols-outlined text-[14px]">
                                  {toggles.twoFactor ? "verified" : "policy"}
                                </span>
                                {toggles.twoFactor ? "Zorunlu Politika" : "Opsiyonel"}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateRole(u.id, u.role)}
                                  className="px-2 py-1 text-[11px] font-semibold text-[#002869] bg-[#ebf2fc] hover:bg-[#dee8ff] rounded cursor-pointer"
                                  title="Rolü Değiştir"
                                >
                                  {u.role === "admin"
                                    ? "Editör Yap"
                                    : "Admin Yap"}
                                </button>
                                {u.id !== 1 && u.id !== 3 && (
                                  confirmDeleteId === u.id ? (
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteUser(u.id)}
                                        className="px-2 py-1 text-[10px] font-bold text-white bg-red-600 hover:bg-red-700 rounded cursor-pointer"
                                      >
                                        Sil
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setConfirmDeleteId(null)}
                                        className="px-2 py-1 text-[10px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded cursor-pointer"
                                      >
                                        İptal
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteId(u.id)}
                                      className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                                      title="Sil"
                                    >
                                      <span className="material-symbols-outlined text-[16px]">
                                        delete
                                      </span>
                                    </button>
                                  )
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              )}

              {activeTab === "api" && (
              <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-[#0f172a]">
                      API &amp; Entegrasyon Katmanı Durumu
                    </h3>
                    <p className="text-xs text-[#64748b]">
                      Sunucu uç noktaları ve harici bildirim servisi tercihleri
                    </p>
                  </div>
                  <span className="text-xs font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full">
                    Supabase Bağlı
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-[#e2e8f0]">
                    <p className="font-bold text-[#002869]">Yönetici Oturum API (/api/auth/*)</p>
                    <p className="text-[11px] text-[#64748b] mt-1">
                      HMAC-SHA256 imzalı HttpOnly oturum çerezi ve Next.js proxy.ts koruması etkin.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-[#e2e8f0]">
                    <p className="font-bold text-[#002869]">Üyelik &amp; Aidat Servisleri</p>
                    <p className="text-[11px] text-[#64748b] mt-1">
                      {dbStats.applications} başvuru ve {dbStats.contacts} iletişim kaydı Supabase tablolarıyla senkron.
                    </p>
                  </div>
                </div>
              </div>
              )}

              {activeTab === "kvkk" && (
              <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-[#0f172a]">
                      6698 Sayılı KVKK &amp; Veri Koruma Politikası
                    </h3>
                    <p className="text-xs text-[#64748b]">
                      Hassas kişisel verilerin yönetici panellerindeki görünüm ve saklama politikaları
                    </p>
                  </div>
                  <span className="text-xs font-bold bg-[#ebf2fc] text-[#002869] px-2.5 py-1 rounded-full">
                    {toggles.kvkkMasking ? "Maskeleme Açık" : "Standart Görünüm"}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-[#e2e8f0]">
                    <span className="text-[10px] font-bold text-[#64748b] uppercase">Yönetici Hesapları</span>
                    <p className="text-lg font-bold text-[#002869] mt-1">{users.length}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-[#e2e8f0]">
                    <span className="text-[10px] font-bold text-[#64748b] uppercase">Üyelik Başvurusu</span>
                    <p className="text-lg font-bold text-[#002869] mt-1">{dbStats.applications}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-[#e2e8f0]">
                    <span className="text-[10px] font-bold text-[#64748b] uppercase">İletişim &amp; Protokol</span>
                    <p className="text-lg font-bold text-[#002869] mt-1">{dbStats.contacts}</p>
                  </div>
                </div>
              </div>
              )}

              {/* Kritik Güvenlik Anahtarları & Toggles */}
              <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-xs">
                <h3 className="font-bold text-sm text-[#0f172a] mb-1">
                  Kritik Sistem Politikaları &amp; Güvenlik Anahtarları
                </h3>
                <p className="text-xs text-[#64748b] mb-4">
                  Değişiklikler anlık olarak Supabase CMS yapılandırmasına kaydedilir
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] flex items-center justify-between">
                    <div>
                      <p className="font-bold text-[#0f172a]">
                        DERBİS Otomatik Eşitleme
                      </p>
                      <p className="text-[11px] text-[#64748b] mt-0.5">
                        Üyelik onayında resmi sicil eşitleme tercihi
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={savingPolicyKey === "derbisSync"}
                      onClick={() =>
                        handleTogglePolicy(
                          "derbisSync",
                          "system_derbis_sync",
                          "DERBİS otomatik eşitleme politikası aktif edildi.",
                          "DERBİS eşitleme politikası pasife alındı."
                        )
                      }
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer disabled:opacity-60 ${
                        toggles.derbisSync ? "bg-[#002869]" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          toggles.derbisSync ? "left-6" : "left-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="p-3.5 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] flex items-center justify-between">
                    <div>
                      <p className="font-bold text-[#0f172a]">
                        KEP &amp; e-İmza Zorunluluğu
                      </p>
                      <p className="text-[11px] text-[#64748b] mt-0.5">
                        Resmi evraklarda KEP ve e-imza kontrol tercihi
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={savingPolicyKey === "kepSigning"}
                      onClick={() =>
                        handleTogglePolicy(
                          "kepSigning",
                          "system_kep_signing",
                          "KEP ve e-İmza kontrolü zorunlu kılındı.",
                          "KEP kontrolü opsiyonel yapıldı."
                        )
                      }
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer disabled:opacity-60 ${
                        toggles.kepSigning ? "bg-[#002869]" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          toggles.kepSigning ? "left-6" : "left-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="p-3.5 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] flex items-center justify-between">
                    <div>
                      <p className="font-bold text-[#0f172a]">
                        KVKK Hassas Veri Maskeleme
                      </p>
                      <p className="text-[11px] text-[#64748b] mt-0.5">
                        Kişisel iletişim ve başvuru detaylarını maskele
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={savingPolicyKey === "kvkkMasking"}
                      onClick={() =>
                        handleTogglePolicy(
                          "kvkkMasking",
                          "system_kvkk_masking",
                          "KVKK veri maskeleme aktif edildi.",
                          "KVKK maskeleme devre dışı bırakıldı."
                        )
                      }
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer disabled:opacity-60 ${
                        toggles.kvkkMasking ? "bg-[#002869]" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          toggles.kvkkMasking ? "left-6" : "left-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="p-3.5 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] flex items-center justify-between">
                    <div>
                      <p className="font-bold text-[#0f172a]">
                        İki Faktörlü Doğrulama (2FA)
                      </p>
                      <p className="text-[11px] text-[#64748b] mt-0.5">
                        Yönetici güvenlik doğrulaması politika bayrağı
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={savingPolicyKey === "twoFactor"}
                      onClick={() =>
                        handleTogglePolicy(
                          "twoFactor",
                          "system_two_factor",
                          "2FA güvenlik politikası zorunlu yapıldı.",
                          "2FA zorunluluk politikası kaldırıldı."
                        )
                      }
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer disabled:opacity-60 ${
                        toggles.twoFactor ? "bg-[#002869]" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          toggles.twoFactor ? "left-6" : "left-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sağ 4 Kolon: Canlı Denetim Kaydı & Sistem Sağlığı */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              {/* Canlı Denetim İzi (Audit Log) */}
              <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <h3 className="font-bold text-sm text-[#0f172a]">
                      Son Sistem &amp; Veritabanı Kayıtları
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold bg-[#ebf2fc] text-[#002869] px-2 py-0.5 rounded-full">
                    {auditLogs.length} Kayıt
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {auditLogs.length === 0 ? (
                    <p className="text-xs text-[#64748b] py-4 text-center">
                      Henüz denetim kaydı bulunmuyor.
                    </p>
                  ) : (
                    auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0] text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-[#0f172a] truncate">
                            {log.user}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium shrink-0">
                            {log.time}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#475569] mt-1">
                          {log.action}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400 mt-1 truncate">
                          {log.detail}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Sistem ve Oturum Sağlığı */}
              <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-xs text-xs">
                <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider block mb-2">
                  Sistem &amp; Oturum Sağlığı
                </span>
                <div className="space-y-2 text-[#334155]">
                  <div className="flex justify-between items-center py-1 border-b border-[#f1f5f9]">
                    <span>Supabase Veritabanı</span>
                    <span className="font-bold text-emerald-600">
                      {loading ? "Kontrol ediliyor..." : "Bağlı"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-[#f1f5f9]">
                    <span>Yönetici Oturum Doğrulama</span>
                    <span className="font-bold text-emerald-600">
                      HMAC-SHA256
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span>Acil Yetki Kilidi</span>
                    <span
                      className={`font-bold ${
                        systemLockdown ? "text-red-600" : "text-emerald-600"
                      }`}
                    >
                      {systemLockdown ? "Kilitli" : "Normal Çalışma"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Yeni Yönetici Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#e2e8f0]">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
              <h3 className="font-bold text-base text-[#002869]">
                Yeni Yetkili / Editör Tanımla
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#64748b] hover:text-[#002869] cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-[#475569] font-semibold mb-1">
                  Ad Soyad
                </label>
                <input
                  required
                  value={newAdmin.full_name}
                  onChange={(e) =>
                    setNewAdmin({ ...newAdmin, full_name: e.target.value })
                  }
                  placeholder="Ad Soyad"
                  className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg p-2 focus:outline-none focus:border-[#002869]"
                />
              </div>

              <div>
                <label className="block text-[#475569] font-semibold mb-1">
                  Kurumsal E-Posta *
                </label>
                <input
                  type="email"
                  required
                  value={newAdmin.email}
                  onChange={(e) =>
                    setNewAdmin({ ...newAdmin, email: e.target.value })
                  }
                  placeholder="ad.soyad@ahid.org.tr"
                  className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg p-2 focus:outline-none focus:border-[#002869]"
                />
              </div>

              <div>
                <label className="block text-[#475569] font-semibold mb-1">
                  Geçici Şifre *
                </label>
                <input
                  type="password"
                  required
                  value={newAdmin.password}
                  onChange={(e) =>
                    setNewAdmin({ ...newAdmin, password: e.target.value })
                  }
                  placeholder="En az 6 karakter"
                  className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg p-2 focus:outline-none focus:border-[#002869]"
                />
              </div>

              <div>
                <label className="block text-[#475569] font-semibold mb-1">
                  Yetki Düzeyi (RBAC Rolü)
                </label>
                <select
                  value={newAdmin.role}
                  onChange={(e) =>
                    setNewAdmin({ ...newAdmin, role: e.target.value })
                  }
                  className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg p-2 focus:outline-none"
                >
                  <option value="editor">Editör (İçerik &amp; Makale Düzenleme)</option>
                  <option value="admin">Sistem Yöneticisi (Tam Yetki &amp; RBAC)</option>
                </select>
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
                  {isSubmitting ? "Kaydediliyor..." : "Yetkiyi Oluştur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
