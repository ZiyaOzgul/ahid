"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface AdminHeaderProps {
  title?: string;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  link: string;
  type: string;
  unread: boolean;
}

export default function AdminHeader({
  title = "Yönetim Portalı",
  sidebarOpen,
  setSidebarOpen,
}: AdminHeaderProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    role: string;
  }>({
    name: "Ahmet Yılmaz",
    email: "admin@ahid.org.tr",
    role: "Genel Sekreterlik",
  });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  const getReadIds = (): string[] => {
    try {
      const saved = localStorage.getItem("ahid_read_notifications");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.success) {
        const readIds = getReadIds();
        const items: NotificationItem[] = (data.notifications || []).map(
          (n: NotificationItem) => ({
            ...n,
            unread: !readIds.includes(n.id),
          })
        );
        setNotifications(items);
        setUnreadCount(items.filter((i) => i.unread).length);
      }
    } catch (err) {
      console.error("Notifications fetch error:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const allIds = notifications.map((n) => n.id);
      const existing = getReadIds();
      const merged = Array.from(new Set([...existing, ...allIds]));
      localStorage.setItem("ahid_read_notifications", JSON.stringify(merged));
      setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
      setUnreadCount(0);
      await fetch("/api/notifications", { method: "PATCH" });
    } catch (e) {
      console.error(e);
    }
  };

  const handleNotificationClick = (id: string) => {
    try {
      const existing = getReadIds();
      if (!existing.includes(id)) {
        const next = [...existing, id];
        localStorage.setItem("ahid_read_notifications", JSON.stringify(next));
      }
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
    setDropdownOpen(false);
  };

  useEffect(() => {
    fetchNotifications();

    // Check localStorage user session if exists
    try {
      const saved = localStorage.getItem("ahid_auth");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.email) {
          setCurrentUser({
            name: parsed.full_name || parsed.email.split("@")[0],
            email: parsed.email,
            role: parsed.role === "admin" ? "Sistem Yöneticisi" : "Editör",
          });
        }
      }
    } catch (e) {
      // ignore
    }

    // Auto-refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(e.target as Node)
      ) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    try {
      localStorage.removeItem("ahid_auth");
    } catch (e) {}
    router.push("/login");
  };

  return (
    <header className="fixed top-0 left-0 lg:left-72 right-0 h-16 bg-white/95 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-4 lg:px-8 border-b border-[#e2e8f0]">
      {/* Left items: Hamburger + Breadcrumb + Search */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <button
          onClick={() => setSidebarOpen((prev) => !prev)}
          className="lg:hidden p-2 text-[#002869] hover:bg-[#ebf2fc] rounded-lg transition-colors cursor-pointer shrink-0"
          aria-label="Menüyü Aç"
          type="button"
        >
          <span className="material-symbols-outlined text-2xl">
            {sidebarOpen ? "close" : "menu"}
          </span>
        </button>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[#64748b] text-xs sm:text-sm truncate">
          <Link
            href="/admin"
            className="flex items-center gap-1 hover:text-[#002869] transition-colors"
          >
            <span className="material-symbols-outlined text-[18px] shrink-0">
              home
            </span>
            <span className="hidden sm:inline">Yönetim</span>
          </Link>
          <span>/</span>
          <span className="text-[#101c2e] font-semibold truncate">{title}</span>
        </div>

        {/* Search */}
        <div className="hidden md:flex relative items-center ml-2">
          <span className="material-symbols-outlined absolute left-3 text-[#94a3b8] text-[18px]">
            search
          </span>
          <input
            className="bg-[#f1f5f9] text-[#1e293b] text-xs sm:text-sm rounded-lg pl-9 pr-4 py-1.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#002869]/20 transition-all w-52 lg:w-64 border border-transparent focus:border-[#cbd5e1]"
            placeholder="İçerik, üye veya işlem ara..."
            type="text"
          />
        </div>
      </div>

      {/* Right items: System badge + Dynamic Notification Bell + Profile */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-full bg-[#ebf2fc] text-[#002869]">
          <span className="w-2 h-2 rounded-full bg-[#225aba]" />
          <span className="text-[11px] font-bold tracking-wide uppercase">
            DERBİS &amp; KEP ENTEGRE
          </span>
        </div>

        {/* Notification Bell Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => {
              setDropdownOpen((prev) => !prev);
              setUserDropdownOpen(false);
            }}
            className="relative p-2 rounded-lg text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a] transition-colors cursor-pointer"
            title="Bildirimler"
            type="button"
            aria-label="Bildirimler"
          >
            <span className="material-symbols-outlined text-[22px]">
              notifications
            </span>

            {/* Bildirim Işığı - SADECE bildirim varsa yanar! Yoksa tamamen gizlenir */}
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-sm">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Popover Panel */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-[#e2e8f0] z-50 overflow-hidden animate-in fade-in duration-150">
              <div className="px-4 py-3 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-[#0f172a]">
                    Bildirimler
                  </span>
                  {unreadCount > 0 ? (
                    <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      {unreadCount} Yeni
                    </span>
                  ) : (
                    <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      Tümü Okundu
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-emerald-700 hover:underline font-semibold cursor-pointer"
                      title="Tümünü Okundu İşaretle"
                      type="button"
                    >
                      Okundu İşaretle
                    </button>
                  )}
                  <button
                    onClick={fetchNotifications}
                    className="text-xs text-[#225aba] hover:underline flex items-center gap-1 cursor-pointer"
                    title="Yenile"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      refresh
                    </span>
                  </button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-[#f1f5f9]">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-[#64748b] flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-4xl text-slate-300">
                      notifications_off
                    </span>
                    <p className="font-medium text-slate-600">
                      Bekleyen yeni bildirim yok
                    </p>
                    <p className="text-xs text-slate-400">
                      Tüm üyelik başvuruları ve protokol talepleri güncel.
                    </p>
                  </div>
                ) : (
                  notifications.map((item) => (
                    <Link
                      key={item.id}
                      href={item.link}
                      onClick={() => handleNotificationClick(item.id)}
                      className={`p-3.5 hover:bg-[#f8fafc] transition-colors flex gap-3 items-start block ${
                        item.unread ? "bg-blue-50/40" : "opacity-75"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          item.type === "application"
                            ? "bg-blue-100 text-blue-700"
                            : item.type === "contact"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {item.type === "application"
                            ? "badge"
                            : item.type === "contact"
                            ? "mail"
                            : "article"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold text-[#0f172a] truncate flex items-center gap-1.5">
                            {item.unread && (
                              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                            )}
                            {item.title}
                          </p>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {item.time}
                          </span>
                        </div>
                        <p className="text-xs text-[#475569] mt-0.5 line-clamp-2">
                          {item.message}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>

              <div className="p-2 bg-[#f8fafc] border-t border-[#e2e8f0] text-center">
                <Link
                  href="/admin/uyelik"
                  onClick={() => setDropdownOpen(false)}
                  className="text-xs font-semibold text-[#002869] hover:underline"
                >
                  Üyelik ve İletişim Masasına Git &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="hidden sm:block h-6 w-px bg-[#e2e8f0]" />

        {/* User Profile & Dropdown */}
        <div className="relative" ref={userDropdownRef}>
          <button
            onClick={() => {
              setUserDropdownOpen((prev) => !prev);
              setDropdownOpen(false);
            }}
            className="flex items-center gap-2 sm:gap-3 p-1 rounded-lg hover:bg-[#f1f5f9] transition-colors cursor-pointer text-left"
            type="button"
          >
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs text-[#0f172a] font-bold leading-tight">
                {currentUser.name}
              </span>
              <span className="text-[10px] font-semibold text-[#64748b]">
                {currentUser.role}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#002869] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <span className="material-symbols-outlined text-[18px]">
                person
              </span>
            </div>
          </button>

          {/* User Dropdown */}
          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-[#e2e8f0] z-50 py-1 overflow-hidden animate-in fade-in">
              <div className="px-4 py-2.5 border-b border-[#f1f5f9]">
                <p className="text-xs font-bold text-[#0f172a]">
                  {currentUser.name}
                </p>
                <p className="text-[11px] text-[#64748b] truncate">
                  {currentUser.email}
                </p>
              </div>
              <Link
                href="/admin/sistem"
                onClick={() => setUserDropdownOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-xs text-[#334155] hover:bg-[#f8fafc] transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">
                  manage_accounts
                </span>
                Sistem &amp; Yetki Ayarları
              </Link>
              <Link
                href="/"
                target="_blank"
                onClick={() => setUserDropdownOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-xs text-[#334155] hover:bg-[#f8fafc] transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">
                  visibility
                </span>
                Web Sitesini Önizle
              </Link>
              <div className="border-t border-[#f1f5f9] my-1" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">
                  logout
                </span>
                Güvenli Çıkış Yap
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
