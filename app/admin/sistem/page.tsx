"use client";

import { useEffect, useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { ROLE_LABELS } from "@/lib/constants";

interface AdminUser {
  id: number;
  email: string;
  full_name?: string | null;
  role: string;
  title?: string | null;
  member_no?: string | null;
  created_at?: string | null;
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor_email: string;
  actor_role: string;
  action: string;
  target: string;
  details: string;
  status: "success" | "warning" | "error";
}

interface SystemPolicyState {
  membership_open: boolean;
  require_captcha: boolean;
  strict_session_timeout: boolean;
  public_verification_enabled: boolean;
  maintenance_mode: boolean;
}

interface ContactSettingsState {
  contact_notify_email: string;
  contact_phone: string;
  contact_address: string;
  contact_hours: string;
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
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{
    id: number;
    email: string;
    role: string;
    full_name: string;
  } | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [liveStats, setLiveStats] = useState({
    members: 0,
    approvedApplications: 0,
    pendingApplications: 0,
    unreadMessages: 0,
  });

  const [activeTab, setActiveTab] = useState<"rbac" | "policies" | "contact">(
    "rbac"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savingPolicyKey, setSavingPolicyKey] = useState<string | null>(null);
  const [savingContact, setSavingContact] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [createdCreds, setCreatedCreds] = useState<{
    email: string;
    full_name: string;
    role: string;
    temporary_password?: string;
  } | null>(null);

  const [policies, setPolicies] = useState<SystemPolicyState>({
    membership_open: true,
    require_captcha: true,
    strict_session_timeout: false,
    public_verification_enabled: true,
    maintenance_mode: false,
  });

  const [contactConfig, setContactConfig] = useState<ContactSettingsState>({
    contact_notify_email: "iletisim@ahid.org.tr",
    contact_phone: "+90 (312) 442 06 00",
    contact_address: "Turan Güneş Bulvarı No: 42/8, Çankaya / Ankara",
    contact_hours: "Hafta içi 09:00 – 18:00",
  });

  const [newUser, setNewUser] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "editor",
    title: "",
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const refreshAuditAndUsers = async () => {
    try {
      const [uRes, aRes] = await Promise.all([
        fetch("/api/users").then((r) => r.json()).catch(() => null),
        fetch("/api/audit?limit=25").then((r) => r.json()).catch(() => null),
      ]);
      if (uRes?.success && Array.isArray(uRes.users)) {
        setUsers(uRes.users as AdminUser[]);
      }
      if (aRes?.success && Array.isArray(aRes.logs)) {
        setAuditLogs(aRes.logs as AuditLogEntry[]);
      }
    } catch {
      // ignore background refresh error
    }
  };

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/auth/session", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch("/api/users").then((r) => r.json()).catch(() => null),
      fetch("/api/cms?page=system").then((r) => r.json()).catch(() => null),
      fetch("/api/audit?limit=25").then((r) => r.json()).catch(() => null),
    ])
      .then(([sessionData, usersData, cmsData, auditData]) => {
        if (!active) return;
        if (sessionData?.authenticated && sessionData.user) {
          setCurrentUser(sessionData.user);
        }
        if (usersData?.success && Array.isArray(usersData.users)) {
          setUsers(usersData.users as AdminUser[]);
        }
        if (cmsData?.success) {
          if (cmsData.settings) {
            const s = cmsData.settings;
            setPolicies({
              membership_open: s.membership_open !== false,
              require_captcha: s.require_captcha !== false,
              strict_session_timeout: Boolean(s.strict_session_timeout),
              public_verification_enabled:
                s.public_verification_enabled !== false,
              maintenance_mode: Boolean(s.maintenance_mode),
            });
            setContactConfig({
              contact_notify_email:
                s.contact_notify_email || "iletisim@ahid.org.tr",
              contact_phone: s.contact_phone || "+90 (312) 442 06 00",
              contact_address:
                s.contact_address ||
                "Turan Güneş Bulvarı No: 42/8, Çankaya / Ankara",
              contact_hours: s.contact_hours || "Hafta içi 09:00 – 18:00",
            });
          }
          if (cmsData.liveStats) {
            setLiveStats({
              members: cmsData.liveStats.members || 0,
              approvedApplications: cmsData.liveStats.approvedApplications || 0,
              pendingApplications: cmsData.liveStats.pendingApplications || 0,
              unreadMessages: cmsData.liveStats.unreadMessages || 0,
            });
          }
        }
        if (auditData?.success && Array.isArray(auditData.logs)) {
          setAuditLogs(auditData.logs as AuditLogEntry[]);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const isSuperAdmin = currentUser?.role?.toLowerCase() === "admin";

  const handleTogglePolicy = async (
    key: keyof SystemPolicyState,
    enabledMsg: string,
    disabledMsg: string
  ) => {
    const nextVal = !policies[key];
    setSavingPolicyKey(key);
    setPolicies((prev) => ({ ...prev, [key]: nextVal }));
    try {
      const res = await fetch("/api/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page: "system",
          section: "policies",
          key,
          value: String(nextVal),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(nextVal ? enabledMsg : disabledMsg);
        await refreshAuditAndUsers();
      } else {
        setPolicies((prev) => ({ ...prev, [key]: !nextVal }));
        showToast(data.error || "Politika ayarı kaydedilemedi.");
      }
    } catch {
      setPolicies((prev) => ({ ...prev, [key]: !nextVal }));
      showToast("Politika kaydedilirken ağ hatası oluştu.");
    } finally {
      setSavingPolicyKey(null);
    }
  };

  const handleSaveContactConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingContact(true);
    try {
      const res = await fetch("/api/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variables: [
            {
              page: "system",
              section: "contact",
              key: "notify_email",
              value: contactConfig.contact_notify_email.trim(),
            },
            {
              page: "system",
              section: "contact",
              key: "phone",
              value: contactConfig.contact_phone.trim(),
            },
            {
              page: "system",
              section: "contact",
              key: "address",
              value: contactConfig.contact_address.trim(),
            },
            {
              page: "system",
              section: "contact",
              key: "hours",
              value: contactConfig.contact_hours.trim(),
            },
          ],
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Kurumsal iletişim ve bildirim ayarları kaydedildi.");
        await refreshAuditAndUsers();
      } else {
        showToast(data.error || "İletişim ayarları kaydedilemedi.");
      }
    } catch {
      showToast("Bağlantı hatası oluştu.");
    } finally {
      setSavingContact(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.full_name.trim() || !newUser.email.trim()) {
      showToast("Lütfen ad soyad ve e-posta alanlarını doldurunuz.");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: Record<string, string> = {
        full_name: newUser.full_name.trim(),
        email: newUser.email.trim(),
        role: newUser.role,
        title: newUser.title.trim(),
      };
      if (newUser.password.trim()) {
        payload.password = newUser.password.trim();
      }
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAddModalOpen(false);
        setCreatedCreds({
          email: data.user?.email || newUser.email,
          full_name: data.user?.full_name || newUser.full_name,
          role: data.user?.role || newUser.role,
          temporary_password: data.temporary_password,
        });
        setNewUser({
          full_name: "",
          email: "",
          password: "",
          role: "editor",
          title: "",
        });
        showToast("Yeni kullanıcı hesabı oluşturuldu.");
        await refreshAuditAndUsers();
      } else {
        showToast(data.error || "Kullanıcı oluşturulamadı.");
      }
    } catch {
      showToast("Kullanıcı oluşturulurken hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRole = async (id: number, nextRole: string) => {
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, role: nextRole }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, role: nextRole } : u))
        );
        showToast(`Kullanıcı rolü "${ROLE_LABELS[nextRole] || nextRole}" olarak güncellendi.`);
        await refreshAuditAndUsers();
      } else {
        showToast(data.error || "Rol güncellenemedi.");
      }
    } catch {
      showToast("Rol güncellenirken hata oluştu.");
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (currentUser && id === currentUser.id) {
      showToast("Aktif oturum açtığınız kendi hesabınızı silemezsiniz.");
      return;
    }
    try {
      const res = await fetch(`/api/users?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
        setConfirmDeleteId(null);
        showToast("Kullanıcı hesabı silindi.");
        await refreshAuditAndUsers();
      } else {
        showToast(data.error || "Kullanıcı silinemedi.");
      }
    } catch {
      showToast("Kullanıcı silinirken hata oluştu.");
    }
  };

  const activeSecurityCount = [
    policies.require_captcha,
    policies.strict_session_timeout,
    policies.public_verification_enabled,
    policies.membership_open,
    !policies.maintenance_mode,
  ].filter(Boolean).length;

  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      (u.full_name || "").toLowerCase().includes(q) ||
      (u.member_no || "").toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const policyCards: {
    key: keyof SystemPolicyState;
    title: string;
    desc: string;
    enabledMsg: string;
    disabledMsg: string;
    inverted?: boolean;
  }[] = [
    {
      key: "membership_open",
      title: "Yeni Üyelik Başvurularına Açık",
      desc: "Devre dışı bırakıldığında /uyelik başvuru formu yeni başvuruları durdurur.",
      enabledMsg: "Yeni üyelik başvuruları açıldı.",
      disabledMsg: "Yeni üyelik başvuruları geçici olarak kapatıldı.",
    },
    {
      key: "require_captcha",
      title: "Giriş Ekranı Güvenlik Kodu (CAPTCHA)",
      desc: "/login ve /api/auth/login üzerinde imzalı SVG doğrulama zorunluluğu.",
      enabledMsg: "Giriş CAPTCHA doğrulaması aktifleştirildi.",
      disabledMsg: "Giriş CAPTCHA doğrulaması devre dışı bırakıldı.",
    },
    {
      key: "strict_session_timeout",
      title: "Kısa Süreli Sıkı Oturum (2 Saat)",
      desc: "Açık olduğunda yeni giriş oturum çerezleri 2 saatlik geçerlilik süresiyle sınırlanır.",
      enabledMsg: "2 saatlik sıkı oturum politikası aktifleştirildi.",
      disabledMsg: "Standart oturum süresi politikasına geçildi.",
    },
    {
      key: "public_verification_enabled",
      title: "Genel Belge Doğrulama Servisi",
      desc: "/kaynaklar belge kodu sorgulama ve QR doğrulama servisini yönetir.",
      enabledMsg: "Belge doğrulama servisi açıldı.",
      disabledMsg: "Belge doğrulama servisi geçici olarak durduruldu.",
    },
    {
      key: "maintenance_mode",
      title: "Planlı Bakım Modu Bayrağı",
      desc: "Bakım penceresi sırasında portal üst uyarı bayrağını işaretler.",
      enabledMsg: "Bakım modu bayrağı aktifleştirildi.",
      disabledMsg: "Bakım modu bayrağı kapatıldı.",
      inverted: true,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#101c2e]">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#002869] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3">
          <span className="material-symbols-outlined text-green-400">
            check_circle
          </span>
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

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

      <main className="relative pt-20 lg:ml-72 bg-[#f9f9ff] min-h-screen px-4 lg:px-8 py-6">
        <div className="flex flex-col w-full gap-6 pb-12">
          {/* 1. Üst Başlık */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-6 rounded-xl shadow-xs border border-[#e2e8f0]">
            <div className="flex flex-col gap-1 max-w-2xl">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#ebf2fc] text-[#002869]">
                  <span className="material-symbols-outlined text-[22px]">
                    admin_panel_settings
                  </span>
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-[#002869] tracking-tight">
                  Sistem Politikaları &amp; RBAC Yetkilendirme
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                  {isSuperAdmin ? "SÜPER YÖNETİCİ" : "EDİTÖR GÖRÜNÜMÜ"}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#64748b] leading-relaxed">
                Üye ve yönetici rol yönetimi, sistem güvenlik politikaları, kurumsal
                iletişim yapılandırması ve canlı denetim izleri.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setIsAddModalOpen(true)}
                disabled={!isSuperAdmin}
                title={
                  isSuperAdmin
                    ? "Yeni kullanıcı hesabı tanımla"
                    : "Bu işlem için Süper Yönetici (admin) yetkisi gereklidir"
                }
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#002869] text-white hover:bg-[#1a4087] text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">
                  person_add
                </span>
                <span>Yeni Kullanıcı / Yetkili Ekle</span>
              </button>
            </div>
          </div>

          {!loading && !isSuperAdmin && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-xl flex items-center gap-2 text-xs">
              <span className="material-symbols-outlined text-amber-700 text-[18px]">
                lock_person
              </span>
              <span>
                <strong>Bilgilendirme:</strong> Mevcut oturumunuz Editör
                düzeyindedir. Kullanıcı ekleme, rol değiştirme ve silme işlemleri
                yalnızca <strong>Süper Yönetici (admin)</strong> yetkisiyle
                yapılabilir.
              </span>
            </div>
          )}

          {/* 2. KPI Kartları */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
                  Aktif Politika Durumu
                </span>
                <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">
                    shield
                  </span>
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-emerald-600">
                  {activeSecurityCount} / 5
                </span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Kalıcı CMS
                </span>
              </div>
              <p className="text-[11px] text-[#64748b] mt-1">
                Supabase `cms_variables` sistem kuralları
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
                  Kayıtlı Hesaplar
                </span>
                <span className="w-8 h-8 rounded-lg bg-[#ebf2fc] text-[#002869] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">
                    manage_accounts
                  </span>
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#002869]">
                  {users.length}
                </span>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  {users.filter((u) => u.role === "admin").length} Admin &bull;{" "}
                  {users.filter((u) => u.role === "editor").length} Editör
                </span>
              </div>
              <p className="text-[11px] text-[#64748b] mt-1">
                {users.filter((u) => u.role === "member").length} Dernek Üyesi hesabı
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
                  Üyelik &amp; İletişim Akışı
                </span>
                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">
                    analytics
                  </span>
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#002869]">
                  {liveStats.pendingApplications} Bekleyen
                </span>
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                  {liveStats.unreadMessages} Yeni Mesaj
                </span>
              </div>
              <p className="text-[11px] text-[#64748b] mt-1">
                {liveStats.approvedApplications} Onaylı Başvuru &bull; {liveStats.members} Üye
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
                  Denetim Günlüğü (Audit)
                </span>
                <span className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">
                    receipt_long
                  </span>
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-purple-600">
                  {auditLogs.length}
                </span>
                <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                  Gerçek Zamanlı
                </span>
              </div>
              <p className="text-[11px] text-[#64748b] mt-1">
                Yönetici işlem kayıtları (/api/audit)
              </p>
            </div>
          </div>

          {/* 3. Ana Alan: Sol 8 Kolon + Sağ 4 Kolon */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 flex flex-col gap-5">
              {/* Sekmeler */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#e2e8f0]">
                <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setActiveTab("rbac")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                      activeTab === "rbac"
                        ? "bg-[#002869] text-white"
                        : "bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]"
                    }`}
                  >
                    Kullanıcılar &amp; RBAC ({users.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("policies")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                      activeTab === "policies"
                        ? "bg-[#002869] text-white"
                        : "bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]"
                    }`}
                  >
                    Güvenlik &amp; Erişim Politikaları
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("contact")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                      activeTab === "contact"
                        ? "bg-[#002869] text-white"
                        : "bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]"
                    }`}
                  >
                    Kurumsal İletişim Ayarları
                  </button>
                </div>

                {activeTab === "rbac" && (
                  <div className="relative w-full sm:w-60">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#94a3b8] text-[18px]">
                      search
                    </span>
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Ad, e-posta veya sicil no..."
                      className="w-full bg-[#f8fafc] text-xs rounded-lg pl-9 pr-3 py-2 border border-[#cbd5e1] focus:outline-none focus:border-[#002869]"
                      type="text"
                    />
                  </div>
                )}
              </div>

              {/* RBAC Tab */}
              {activeTab === "rbac" && (
                <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-xs overflow-hidden">
                  <div className="p-4 border-b border-[#e2e8f0] flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-[#0f172a]">
                        Yetkili Hesaplar &amp; Dernek Üye Listesi
                      </h3>
                      <p className="text-xs text-[#64748b]">
                        Rol değişiklikleri ve yeni kullanıcı tanımlama Süper Yönetici yetkisine bağlıdır
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#f8fafc] text-[#475569] font-bold border-b border-[#e2e8f0]">
                          <th className="py-3 px-4">Kullanıcı</th>
                          <th className="py-3 px-3">E-Posta</th>
                          <th className="py-3 px-3">Sicil / Ünvan</th>
                          <th className="py-3 px-3">Rol</th>
                          <th className="py-3 px-4 text-right">İşlem</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f1f5f9]">
                        {loading ? (
                          <tr>
                            <td colSpan={5} className="py-12 text-center text-[#64748b]">
                              Kullanıcılar yükleniyor...
                            </td>
                          </tr>
                        ) : filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-10 text-center text-[#64748b]">
                              Arama kriterine uyan hesap bulunamadı.
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-[#f8fafc]">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-[#002869] text-white flex items-center justify-center font-bold text-xs shrink-0">
                                    {u.full_name
                                      ? u.full_name[0]
                                      : u.email[0].toUpperCase()}
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
                              <td className="py-3 px-3 text-[11px] text-[#475569]">
                                <span className="font-mono font-semibold text-[#002869] block">
                                  {u.member_no || "—"}
                                </span>
                                <span className="text-[10px] text-[#64748b]">
                                  {u.title || "Belirtilmedi"}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    u.role === "admin"
                                      ? "bg-purple-100 text-purple-800"
                                      : u.role === "editor"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-slate-100 text-slate-700"
                                  }`}
                                >
                                  {ROLE_LABELS[u.role] || u.role}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                {isSuperAdmin ? (
                                  <div className="flex items-center justify-end gap-1">
                                    <select
                                      value={u.role}
                                      onChange={(e) =>
                                        void handleUpdateRole(u.id, e.target.value)
                                      }
                                      className="bg-[#f8fafc] border border-[#cbd5e1] rounded px-2 py-1 text-[11px] font-semibold text-[#002869] cursor-pointer"
                                    >
                                      <option value="member">Dernek Üyesi</option>
                                      <option value="editor">Editör</option>
                                      <option value="admin">Süper Yönetici</option>
                                    </select>

                                    {currentUser?.id !== u.id &&
                                      (confirmDeleteId === u.id ? (
                                        <div className="flex items-center gap-1">
                                          <button
                                            type="button"
                                            onClick={() => void handleDeleteUser(u.id)}
                                            className="px-2 py-1 text-[10px] font-bold text-white bg-red-600 hover:bg-red-700 rounded cursor-pointer"
                                          >
                                            Sil
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setConfirmDeleteId(null)}
                                            className="px-2 py-1 text-[10px] font-semibold text-slate-600 bg-slate-100 rounded cursor-pointer"
                                          >
                                            İptal
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => setConfirmDeleteId(u.id)}
                                          className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                                          title="Hesabı Sil"
                                        >
                                          <span className="material-symbols-outlined text-[16px]">
                                            delete
                                          </span>
                                        </button>
                                      ))}
                                  </div>
                                ) : (
                                  <span className="text-[10px] font-semibold text-[#64748b]">
                                    Salt Okunur
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* System Policy Switches Tab */}
              {activeTab === "policies" && (
                <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-xs space-y-4">
                  <div>
                    <h3 className="font-bold text-sm text-[#0f172a]">
                      Canlı Sistem Politikaları &amp; Güvenlik Anahtarları
                    </h3>
                    <p className="text-xs text-[#64748b] mt-0.5">
                      Bu anahtarlar doğrudan API uç noktalarının davranışını yönetir
                      ve Supabase üzerinde saklanır.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {policyCards.map((card) => {
                      const active = policies[card.key];
                      const activeColor = card.inverted
                        ? active
                          ? "bg-red-600"
                          : "bg-slate-300"
                        : active
                        ? "bg-[#002869]"
                        : "bg-slate-300";
                      return (
                        <div
                          key={card.key}
                          className="p-4 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] flex items-center justify-between gap-3"
                        >
                          <div>
                            <p className="font-bold text-[#0f172a]">{card.title}</p>
                            <p className="text-[11px] text-[#64748b] mt-0.5 leading-relaxed">
                              {card.desc}
                            </p>
                          </div>
                          <button
                            type="button"
                            disabled={savingPolicyKey === card.key}
                            onClick={() =>
                              void handleTogglePolicy(
                                card.key,
                                card.enabledMsg,
                                card.disabledMsg
                              )
                            }
                            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer disabled:opacity-60 shrink-0 ${activeColor}`}
                          >
                            <span
                              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                                active ? "left-6" : "left-1"
                              }`}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Contact & Notification Config Tab */}
              {activeTab === "contact" && (
                <form
                  onSubmit={handleSaveContactConfig}
                  className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-xs space-y-4 text-xs"
                >
                  <div>
                    <h3 className="font-bold text-sm text-[#0f172a]">
                      Kurumsal İletişim &amp; Bildirim Yapılandırması
                    </h3>
                    <p className="text-xs text-[#64748b] mt-0.5">
                      İletişim formlarından gelen bildirimlerin iletildiği e-posta ve
                      kurumsal adres bilgileri.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[#475569] mb-1">
                        Bildirim E-Posta Adresi
                      </label>
                      <input
                        type="email"
                        required
                        value={contactConfig.contact_notify_email}
                        onChange={(e) =>
                          setContactConfig((prev) => ({
                            ...prev,
                            contact_notify_email: e.target.value,
                          }))
                        }
                        className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg p-2.5 focus:outline-none focus:border-[#002869]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#475569] mb-1">
                        Kurumsal Telefon
                      </label>
                      <input
                        type="text"
                        value={contactConfig.contact_phone}
                        onChange={(e) =>
                          setContactConfig((prev) => ({
                            ...prev,
                            contact_phone: e.target.value,
                          }))
                        }
                        className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg p-2.5 focus:outline-none focus:border-[#002869]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#475569] mb-1">
                        Genel Merkez Adresi
                      </label>
                      <input
                        type="text"
                        value={contactConfig.contact_address}
                        onChange={(e) =>
                          setContactConfig((prev) => ({
                            ...prev,
                            contact_address: e.target.value,
                          }))
                        }
                        className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg p-2.5 focus:outline-none focus:border-[#002869]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#475569] mb-1">
                        Çalışma Saatleri
                      </label>
                      <input
                        type="text"
                        value={contactConfig.contact_hours}
                        onChange={(e) =>
                          setContactConfig((prev) => ({
                            ...prev,
                            contact_hours: e.target.value,
                          }))
                        }
                        className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg p-2.5 focus:outline-none focus:border-[#002869]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-[#e2e8f0]">
                    <button
                      type="submit"
                      disabled={savingContact}
                      className="px-5 py-2 rounded-lg bg-[#002869] text-white hover:bg-[#1a4087] font-bold cursor-pointer disabled:opacity-50"
                    >
                      {savingContact
                        ? "Kaydediliyor..."
                        : "İletişim Yapılandırmasını Kaydet"}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Sağ 4 Kolon: Gerçek Audit Log Akışı */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <h3 className="font-bold text-sm text-[#0f172a]">
                      Sistem Denetim Kayıtları
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold bg-[#ebf2fc] text-[#002869] px-2 py-0.5 rounded-full">
                    {auditLogs.length} Kayıt
                  </span>
                </div>

                <div className="mt-4 space-y-3 max-h-[460px] overflow-y-auto pr-1">
                  {auditLogs.length === 0 ? (
                    <p className="text-xs text-[#64748b] py-4 text-center">
                      Henüz kaydedilmiş denetim olayı bulunmuyor.
                    </p>
                  ) : (
                    auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0] text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-[#002869] truncate">
                            {log.action}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium shrink-0">
                            {formatAuditTime(log.timestamp)}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#334155] mt-1">
                          {log.details}
                        </p>
                        <p className="text-[10px] font-mono text-slate-500 mt-1 truncate">
                          {log.actor_email} • {log.target}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-xs text-xs">
                <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider block mb-2">
                  Oturum &amp; Altyapı Durumu
                </span>
                <div className="space-y-2 text-[#334155]">
                  <div className="flex justify-between items-center py-1 border-b border-[#f1f5f9]">
                    <span>Supabase Veritabanı</span>
                    <span className="font-bold text-emerald-600">
                      {loading ? "Bağlanıyor..." : "Aktif"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-[#f1f5f9]">
                    <span>Oturum İmzası</span>
                    <span className="font-bold text-emerald-600">
                      HMAC-SHA256 HttpOnly
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span>Parola Hashleme</span>
                    <span className="font-bold text-emerald-600">scrypt</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Yeni Kullanıcı / Yetkili Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#e2e8f0]">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
              <h3 className="font-bold text-base text-[#002869]">
                Yeni Kullanıcı / Yetkili Tanımla
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#64748b] hover:text-[#002869] cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-[#475569] font-semibold mb-1">
                  Ad Soyad *
                </label>
                <input
                  required
                  value={newUser.full_name}
                  onChange={(e) =>
                    setNewUser({ ...newUser, full_name: e.target.value })
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
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  placeholder="ad.soyad@ahid.org.tr"
                  className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg p-2 focus:outline-none focus:border-[#002869]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#475569] font-semibold mb-1">
                    Yetki Düzeyi (Rol)
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) =>
                      setNewUser({ ...newUser, role: e.target.value })
                    }
                    className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg p-2 focus:outline-none"
                  >
                    <option value="editor">Editör / Kurul Yetkilisi</option>
                    <option value="admin">Süper Yönetici (Tam Yetki)</option>
                    <option value="member">Dernek Üyesi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#475569] font-semibold mb-1">
                    Kurum / Ünvan
                  </label>
                  <input
                    value={newUser.title}
                    onChange={(e) =>
                      setNewUser({ ...newUser, title: e.target.value })
                    }
                    placeholder="Örn: Genel Sekreterlik"
                    className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg p-2 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#475569] font-semibold mb-1">
                  Şifre (Boş bırakılırsa otomatik geçici şifre üretilir)
                </label>
                <input
                  type="password"
                  minLength={8}
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                  placeholder="En az 8 karakter veya boş bırakın"
                  className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg p-2 focus:outline-none focus:border-[#002869]"
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
                  {isSubmitting ? "Kaydediliyor..." : "Hesabı Oluştur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Üretilen Geçici Şifre Gösterim Modal */}
      {createdCreds && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#e2e8f0] space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-[#e2e8f0]">
              <div>
                <span className="text-[11px] font-bold uppercase text-emerald-700">
                  Kullanıcı Oluşturuldu
                </span>
                <h3 className="font-bold text-base text-[#002869] mt-0.5">
                  Hesap Giriş Bilgileri
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCreatedCreds(null)}
                className="text-[#64748b] hover:text-[#002869] cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="bg-[#f8fafc] p-4 rounded-xl border border-[#e2e8f0] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#64748b]">Ad Soyad:</span>
                <span className="font-bold text-[#0f172a]">
                  {createdCreds.full_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748b]">E-Posta:</span>
                <span className="font-mono font-semibold text-[#002869]">
                  {createdCreds.email}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748b]">Rol:</span>
                <span className="font-bold">
                  {ROLE_LABELS[createdCreds.role] || createdCreds.role}
                </span>
              </div>
              {createdCreds.temporary_password && (
                <div className="pt-2 border-t border-[#e2e8f0] flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[#64748b] block">
                      Üretilen Tek Kullanımlık Geçici Şifre:
                    </span>
                    <code className="font-mono text-sm font-bold text-[#92400e]">
                      {createdCreds.temporary_password}
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        createdCreds.temporary_password || ""
                      );
                      showToast("Geçici şifre kopyalandı.");
                    }}
                    className="px-2.5 py-1.5 rounded bg-[#ebf2fc] text-[#002869] font-bold cursor-pointer hover:bg-[#dee8ff]"
                  >
                    Kopyala
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setCreatedCreds(null)}
                className="px-5 py-2 rounded-lg bg-[#002869] text-white text-xs font-bold cursor-pointer hover:bg-[#1a4087]"
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
