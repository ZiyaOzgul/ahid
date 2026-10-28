"use client";

import Link from "next/link";

interface AdminSidebarProps {
  currentPath: string;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const navItems = [
  { label: "Genel Bakış & CMS", path: "/admin", icon: "dashboard" },
  { label: "Medya Galerisi", path: "/admin/medya", icon: "photo_library" },
  { label: "Üyelik & Akreditasyon", path: "/admin/uyelik", icon: "badge" },
  { label: "Etkinlik & Zirve", path: "/admin/etkinlikler", icon: "event_available" },
  { label: "Köşe Yazıları & Yayınlar", path: "/admin/yazilar", icon: "menu_book" },
  { label: "Protokol & İletişim", path: "/admin/protokol", icon: "contact_mail" },
  { label: "Sistem & Güvenlik", path: "/admin/sistem", icon: "admin_panel_settings" },
];

export default function AdminSidebar({
  currentPath,
  sidebarOpen,
  setSidebarOpen,
}: AdminSidebarProps) {
  return (
    <>
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed left-0 top-0 h-full w-72 bg-[#f0f3ff] shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex flex-col justify-between overflow-y-auto transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col">
          {/* Logo Brand Header */}
          <div className="px-6 pt-6 pb-5 flex items-center gap-3 bg-[#e7eeff]">
            <Link
              href="/"
              className="w-10 h-10 rounded-lg bg-white p-1 flex items-center justify-center shadow-xs shrink-0"
              title="Ana Sayfaya Git"
            >
              <img
                src="/ahid-logo.png"
                alt="AHİD Logo"
                className="w-full h-full object-contain"
              />
            </Link>
            <div className="flex flex-col">
              <span className="font-['Plus_Jakarta_Sans'] text-lg text-[#002869] tracking-tight font-bold">
                AHİD PORTAL
              </span>
              <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">
                Yönetim ve CMS Masası
              </span>
            </div>
          </div>

          {/* Server Connection Status */}
          <div className="mx-4 mt-4 p-3 rounded-lg bg-[#ebf2fc] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#225aba] animate-pulse" />
              <span className="text-xs text-[#002869] font-semibold">
                Portal Sunucu Aktif
              </span>
            </div>
            <span className="text-[11px] font-bold bg-white text-[#225aba] px-2 py-0.5 rounded-full shadow-xs">
              v3.4.2
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1 px-3 mt-4 text-sm">
            {navItems.map((item) => {
              const isActive =
                item.path === "/admin"
                  ? currentPath === "/admin"
                  : currentPath.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? "bg-[#002869] text-white shadow-xs font-semibold"
                      : "text-[#434652] hover:bg-[#dee8ff] hover:text-[#101c2e] font-medium"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <div className="my-2 border-t border-[#dce3f5]" />

            <Link
              href="/"
              target="_blank"
              className="flex items-center justify-between px-3 py-2 text-xs text-[#64748b] hover:text-[#002869] rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">
                  open_in_new
                </span>
                <span>Web Sitesini Aç</span>
              </div>
            </Link>

            <Link
              href="/uye-paneli"
              className="flex items-center justify-between px-3 py-2 text-xs text-[#64748b] hover:text-[#002869] rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">
                  person_search
                </span>
                <span>Üye Paneli Önizleme</span>
              </div>
            </Link>
          </nav>
        </div>

        {/* Security & Protocol badge */}
        <div className="p-4 bg-white m-3 rounded-xl shadow-xs border border-[#e2e8f0]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#64748b] uppercase">
              Kurumsal Güven
            </span>
            <span className="material-symbols-outlined text-[16px] text-[#225aba]">
              verified_user
            </span>
          </div>
          <p className="text-xs text-[#334155] leading-tight">
            Resmi Protokol Veritabanı ve KEP Altyapısı Korunmaktadır.
          </p>
        </div>
      </aside>
    </>
  );
}
