"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { name: "Ana Sayfa", href: "/", icon: "home" },
    { name: "Kurumsal", href: "/kurumsal", icon: "account_balance" },
    { name: "Başkanlar & Kurullar", href: "/baskanlar-ve-kurullar", icon: "military_tech" },
    { name: "Haberler & Duyuru", href: "/haberler", icon: "newspaper" },
    { name: "Etkinlikler", href: "/etkinlikler", icon: "event" },
    { name: "Yayınlar", href: "/yayinlar", icon: "menu_book" },
    { name: "Kaynaklar", href: "/kaynaklar", icon: "folder_managed" },
    { name: "Üyelik", href: "/uyelik", icon: "how_to_reg" },
    { name: "İletişim", href: "/iletisim", icon: "contact_mail" },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/yayinlar?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,40,105,0.12)] border-b border-[#dee8ff]/80"
          : "bg-[#ffffff]/90 backdrop-blur-xl shadow-[0_4px_20px_rgba(11,61,145,0.06)]"
      }`}
    >
      {/* Top Bar */}
      <div className="bg-[#002869] text-white">
        <div className="max-w-[1680px] w-full mx-auto px-4 sm:px-8 lg:px-12 2xl:px-16 h-10 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-6">
            <a
              className="flex items-center gap-1 hover:text-[#fde68a] transition-colors"
              href="mailto:info@ahid.org.tr"
            >
              <span className="material-symbols-outlined text-base">mail</span>
              <span>info@ahid.org.tr</span>
            </a>
            <div className="hidden md:flex items-center gap-1 text-[#8dadff]">
              <span className="material-symbols-outlined text-base">location_on</span>
              <span>Çankaya, Ankara | Genel Merkez</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 pr-4 border-r border-[#0b3d91]">
              <Link
                className="p-1 text-white hover:text-[#fde68a] transition-colors"
                href="/haberler"
                title="Haberler ve Basın Bültenleri"
              >
                <span className="material-symbols-outlined text-base">feed</span>
              </Link>
              <Link
                className="p-1 text-white hover:text-[#fde68a] transition-colors"
                href="/kaynaklar"
                title="Mevzuat ve Resmi Belgeler"
              >
                <span className="material-symbols-outlined text-base">folder_managed</span>
              </Link>
              <Link
                className="p-1 text-white hover:text-[#fde68a] transition-colors"
                href="/etkinlikler"
                title="Etkinlik Takvimi"
              >
                <span className="material-symbols-outlined text-base">event_note</span>
              </Link>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                className="inline-flex items-center gap-1 bg-white/10 text-white hover:bg-white/20 px-2 sm:px-2.5 py-1 rounded transition-colors text-[11px] sm:text-xs"
                href="/uye-paneli"
              >
                <span className="material-symbols-outlined text-sm">badge</span>
                <span>Üye Paneli</span>
              </Link>
              <Link
                className="inline-flex items-center gap-1 bg-[#0b3d91] text-white hover:bg-[#225aba] px-2.5 sm:px-3 py-1 rounded transition-colors text-[11px] sm:text-xs"
                href="/login"
              >
                <span className="material-symbols-outlined text-sm">vpn_key</span>
                <span>Giriş</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Bar */}
      <div
        className={`max-w-[1680px] w-full mx-auto px-4 sm:px-8 lg:px-12 2xl:px-16 flex items-center justify-between gap-4 lg:gap-8 transition-all duration-300 ${
          scrolled ? "h-16" : "h-20"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center shrink-0">
          <Link className="flex items-center group" href="/">
            <img
              alt="AHİD - Ankara Halkla İlişkiler Derneği"
              className={`w-auto object-contain transition-all duration-300 group-hover:scale-105 ${
                scrolled ? "h-10" : "h-12"
              }`}
              src="/ahid-logo.png"
            />
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden xl:flex flex-1 items-center justify-center gap-1 2xl:gap-3 font-['Inter'] text-sm font-semibold whitespace-nowrap">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  active
                    ? "relative transition-all text-[#002869] font-bold bg-[#ebf2fc] rounded-lg px-4 py-2 shadow-xs after:content-[''] after:absolute after:bottom-0 after:left-3 after:right-3 after:h-[2.5px] after:bg-[#c25e00] after:rounded-full"
                    : "text-[#434652] hover:text-[#002869] hover:bg-[#f0f3ff] transition-colors px-3.5 2xl:px-4 py-2 rounded-lg"
                }
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
          <button
            aria-label="Portalda Ara"
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2 text-[#434652] hover:text-[#002869] hover:bg-[#ebf2fc] rounded-lg transition-colors cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-xl">search</span>
          </button>

          <Link
            className="hidden sm:inline-flex items-center justify-center bg-[#0b3d91] hover:bg-[#002869] text-white font-semibold text-sm px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 active:scale-95"
            href="/uyelik#basvuru-formu"
          >
            Üye Olun
          </Link>

          <div className="pl-1">
            <Link
              className="flex items-center justify-center w-8 h-8 rounded-full bg-[#ebf2fc] text-[#002869] ring-2 ring-[#002869]/20 hover:ring-[#002869] transition-all"
              href="/login"
              title="Üye Profili / Yönetim"
            >
              <span className="material-symbols-outlined text-lg">person</span>
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 text-[#002869] hover:bg-[#ebf2fc] rounded-lg transition-colors ml-1 cursor-pointer"
            aria-label="Menüyü Aç"
          >
            <span className="material-symbols-outlined text-2xl">
              {mobileMenuOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
      </div>

      {/* Search Bar Dropdown */}
      {searchOpen && (
        <div className="bg-[#f0f3ff] border-t border-[#dee8ff] px-4 py-3 shadow-inner">
          <form onSubmit={handleSearchSubmit} className="max-w-4xl mx-auto flex items-center gap-3">
            <span className="material-symbols-outlined text-[#002869]">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="AHİD portali, etkinlikler, mevzuat veya köşe yazılarında arayın... (Enter)"
              className="w-full bg-white px-4 py-2 rounded-lg border border-[#c4c6d3] text-sm text-[#101c2e] focus:outline-none focus:ring-2 focus:ring-[#002869]"
              autoFocus
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#002869] text-white rounded-lg text-xs font-semibold hover:bg-[#0b3d91] transition-colors"
            >
              Ara
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="text-xs font-semibold text-[#64748b] hover:text-[#002869] px-2 py-1"
            >
              Kapat
            </button>
          </form>
        </div>
      )}

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <>
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="xl:hidden fixed inset-0 top-[6.5rem] bg-[#002869]/25 backdrop-blur-xs z-40"
          />
          <div className="xl:hidden relative z-50 bg-white border-t border-[#dee8ff] shadow-2xl px-4 py-5 flex flex-col gap-3 max-h-[calc(100vh-110px)] overflow-y-auto rounded-b-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {navLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={
                      active
                        ? "flex items-center justify-between px-3.5 py-3 rounded-xl bg-[#ebf2fc] text-[#002869] font-bold text-sm border-l-4 border-[#c25e00]"
                        : "flex items-center justify-between px-3.5 py-3 rounded-xl text-[#434652] hover:bg-[#f0f3ff] hover:text-[#002869] font-semibold text-sm transition-colors"
                    }
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-lg text-[#225aba]">
                        {link.icon}
                      </span>
                      <span>{link.name}</span>
                    </span>
                    <span className="material-symbols-outlined text-base text-[#94a3b8]">
                      chevron_right
                    </span>
                  </Link>
                );
              })}
            </div>
            <div className="pt-3 border-t border-[#dee8ff] grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Link
                href="/uyelik#basvuru-formu"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full inline-flex items-center justify-center gap-1.5 bg-[#0b3d91] hover:bg-[#002869] text-white font-semibold py-3 rounded-xl text-sm shadow-xs"
              >
                <span className="material-symbols-outlined text-base">person_add</span>
                <span>Üyelik Başvurusu Yapın</span>
              </Link>
              <Link
                href="/uye-paneli"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full inline-flex items-center justify-center gap-1.5 bg-[#f0f3ff] hover:bg-[#dee8ff] text-[#002869] font-semibold py-3 rounded-xl text-sm"
              >
                <span className="material-symbols-outlined text-base">badge</span>
                <span>Üye Paneli &amp; Sicil Sorgula</span>
              </Link>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full inline-flex items-center justify-center gap-1.5 bg-[#ebf2fc] hover:bg-[#dee8ff] text-[#002869] font-semibold py-3 rounded-xl text-sm"
              >
                <span className="material-symbols-outlined text-base">vpn_key</span>
                <span>Yönetim &amp; Üye Girişi</span>
              </Link>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
