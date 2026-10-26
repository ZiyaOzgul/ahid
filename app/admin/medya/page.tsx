"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

interface MediaAsset {
  id: number;
  file_name: string;
  title: string | null;
  file_url: string;
  bucket: string;
  format: string | null;
  file_size: string | null;
  dimensions: string | null;
  aspect_ratio: string | null;
  category: string;
  alt_text: string | null;
  usage_locations: string[] | null;
  is_live: boolean | null;
  created_at: string;
}

const MEDIA_CATEGORIES = [
  "Tümü",
  "Ana Sayfa Hero & Banner",
  "Etkinlikler & Zirve Afişleri",
  "Yönetim Kurulu & Protokol Portreleri",
  "Usta'ya Saygı Hatırat",
  "Basın Kiti & Logolar",
  "Arşiv & Belge Taramaları",
  "Genel Kurumsal",
];

export default function AdminMedyaPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("Tümü");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [uploading, setUploading] = useState(false);
  const [uploadCategory, setUploadCategory] = useState("Genel Kurumsal");
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [savingInspector, setSavingInspector] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [altTextDraft, setAltTextDraft] = useState("");
  const [categoryDraft, setCategoryDraft] = useState("Genel Kurumsal");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/media");
      const data = await res.json();
      if (data.success && Array.isArray(data.assets)) {
        setAssets(data.assets);
        if (data.assets.length > 0 && !selectedAsset) {
          setSelectedAsset(data.assets[0]);
          setAltTextDraft(data.assets[0].alt_text || "");
          setCategoryDraft(data.assets[0].category || "Genel Kurumsal");
        }
      }
    } catch (err) {
      console.error("Failed to fetch media assets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  const handleSelectAsset = (asset: MediaAsset) => {
    setSelectedAsset(asset);
    setAltTextDraft(asset.alt_text || "");
    setCategoryDraft(asset.category || "Genel Kurumsal");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fd = new FormData();
        fd.append("file", file);
        fd.append("bucket", "media");
        fd.append("category", uploadCategory);
        fd.append("alt_text", file.name);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (data.success && data.asset) {
          setAssets((prev) => [data.asset, ...prev]);
          setSelectedAsset(data.asset);
          setAltTextDraft(data.asset.alt_text || "");
          setCategoryDraft(data.asset.category || "Genel Kurumsal");
        }
      }
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveInspector = async () => {
    if (!selectedAsset) return;
    setSavingInspector(true);
    try {
      const res = await fetch("/api/media", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedAsset.id,
          alt_text: altTextDraft,
          category: categoryDraft,
        }),
      });
      const data = await res.json();
      if (data.success && data.asset) {
        setAssets((prev) =>
          prev.map((a) => (a.id === data.asset.id ? data.asset : a))
        );
        setSelectedAsset(data.asset);
        setSavedNotice(true);
        setTimeout(() => setSavedNotice(false), 2500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingInspector(false);
    }
  };

  const handleDeleteAsset = async (id: number) => {
    try {
      const res = await fetch(`/api/media?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        const remaining = assets.filter((a) => a.id !== id);
        setAssets(remaining);
        if (selectedAsset?.id === id) {
          setSelectedAsset(remaining[0] || null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyUrl = () => {
    if (!selectedAsset) return;
    navigator.clipboard.writeText(selectedAsset.file_url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 1800);
  };

  const filteredAssets = assets.filter((asset) => {
    const matchesCat =
      selectedCategory === "Tümü" || asset.category === selectedCategory;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      asset.file_name.toLowerCase().includes(q) ||
      (asset.title || "").toLowerCase().includes(q) ||
      (asset.alt_text || "").toLowerCase().includes(q) ||
      asset.category.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#101c2e]">
      {savedNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#002869] text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3">
          <span className="material-symbols-outlined text-green-400">
            check_circle
          </span>
          <span className="text-sm font-semibold">
            Medya meta verileri Supabase veritabanına kaydedildi!
          </span>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.svg,.pdf"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-72 bg-[#f0f3ff] shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex flex-col justify-between overflow-y-auto transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col">
          <div className="px-6 pt-6 pb-5 flex items-center gap-3 bg-[#e7eeff]">
            <Link
              href="/"
              className="w-10 h-10 rounded-lg bg-white p-1 flex items-center justify-center shadow-xs shrink-0"
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

          <div className="mx-4 mt-4 p-3 rounded-lg bg-[#ebf2fc] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#225aba] animate-pulse" />
              <span className="text-xs text-[#002869] font-semibold">
                Supabase Storage Aktif
              </span>
            </div>
            <span className="text-[11px] font-bold bg-white text-[#225aba] px-2 py-0.5 rounded-full shadow-xs">
              CDN
            </span>
          </div>

          <nav className="flex flex-col gap-1 px-3 mt-4 text-sm font-semibold">
            <Link
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#434652] hover:bg-[#dee8ff] hover:text-[#101c2e] transition-all"
              href="/admin"
            >
              <span className="material-symbols-outlined text-[20px]">
                dashboard
              </span>
              <span>Genel Bakış &amp; CMS</span>
            </Link>
            <Link
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#002869] text-white shadow-xs transition-all"
              href="/admin/medya"
            >
              <span className="material-symbols-outlined text-[20px]">
                photo_library
              </span>
              <span>Medya &amp; Fotoğraf Yöneticisi</span>
            </Link>
            <Link
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#434652] hover:bg-[#dee8ff] hover:text-[#101c2e] transition-all"
              href="/haberler"
            >
              <span className="material-symbols-outlined text-[20px]">
                newspaper
              </span>
              <span>Haberler &amp; Duyurular</span>
            </Link>
            <Link
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#434652] hover:bg-[#dee8ff] hover:text-[#101c2e] transition-all"
              href="/kaynaklar"
            >
              <span className="material-symbols-outlined text-[20px]">
                folder_open
              </span>
              <span>Kaynaklar &amp; Mevzuat</span>
            </Link>
            <Link
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#434652] hover:bg-[#dee8ff] hover:text-[#101c2e] transition-all"
              href="/baskanlar-ve-kurullar"
            >
              <span className="material-symbols-outlined text-[20px]">
                supervisor_account
              </span>
              <span>Başkanlar &amp; Kurullar</span>
            </Link>
            <Link
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#434652] hover:bg-[#dee8ff] hover:text-[#101c2e] transition-all"
              href="/uye-paneli"
            >
              <span className="material-symbols-outlined text-[20px]">
                badge
              </span>
              <span>Üye Paneli Önizleme</span>
            </Link>
          </nav>
        </div>

        <div className="p-4 bg-white m-3 rounded-xl shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#64748b] uppercase">
              Kurumsal Güven
            </span>
            <span className="material-symbols-outlined text-[16px] text-[#225aba]">
              verified_user
            </span>
          </div>
          <p className="text-xs text-[#334155] leading-tight">
            Supabase Storage (`media` bucket) ve DERBİS Medya Kütüphanesi
            aktif.
          </p>
        </div>
      </aside>

      {/* Header */}
      <header className="fixed top-0 left-0 lg:left-72 right-0 h-16 bg-white/90 backdrop-blur-xl shadow-xs z-40 flex items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 text-[#002869] hover:bg-[#ebf2fc] rounded-lg cursor-pointer shrink-0"
            type="button"
          >
            <span className="material-symbols-outlined text-2xl">
              {sidebarOpen ? "close" : "menu"}
            </span>
          </button>
          <div className="flex items-center gap-1.5 sm:gap-2 text-[#64748b] text-xs font-semibold truncate">
            <Link href="/admin" className="hidden sm:inline hover:text-[#002869]">
              Yönetim Portalı
            </Link>
            <span className="hidden sm:inline">/</span>
            <span className="text-[#101c2e] font-bold truncate">
              Medya &amp; Fotoğraf Galerisi
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/admin"
            className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#ebf2fc] text-[#002869] text-xs font-bold hover:bg-[#dee8ff] whitespace-nowrap"
          >
            ← CMS Masası
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative pt-20 lg:ml-72 bg-[#f9f9ff] min-h-screen px-4 lg:px-8 py-6">
        <div className="flex flex-col w-full gap-6">
          {/* Sub-navigation & Mode Tabs Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-2.5 rounded-xl shadow-xs border border-[#e7eeff]">
            <div className="flex flex-wrap items-center gap-1.5">
              <Link
                className="px-4 py-2.5 rounded-lg text-sm font-semibold text-[#64748b] hover:text-[#002869] hover:bg-[#f0f3ff] transition-colors flex items-center gap-2"
                href="/admin"
              >
                <span className="material-symbols-outlined text-[19px]">
                  tune
                </span>
                <span>Sayfa Değişkenleri &amp; Canlı İçerik Düzenleyici</span>
              </Link>
              <span className="px-4 py-2.5 rounded-lg text-sm bg-[#002869] text-white shadow-xs flex items-center gap-2 font-semibold">
                <span className="material-symbols-outlined text-[19px]">
                  photo_library
                </span>
                <span>Medya &amp; Fotoğraf Yöneticisi</span>
                <span className="bg-[#0b3d91] px-2 py-0.5 rounded-full text-[11px] text-white font-bold">
                  {assets.length}
                </span>
              </span>
            </div>

            <div className="flex items-center gap-3 px-4 py-2 bg-[#ebf2fc] rounded-lg">
              <span className="text-[11px] font-bold text-[#002869] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#225aba] animate-ping" />
                Supabase Storage (`media`)
              </span>
              <span className="text-xs font-bold text-[#334155]">
                {assets.length} Kayıtlı Varlık
              </span>
            </div>
          </div>

          {/* Quick Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-4 py-2.5 rounded-lg bg-[#002869] hover:bg-[#225aba] text-white text-sm font-semibold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[20px]">
                  cloud_upload
                </span>
                <span>
                  {uploading
                    ? "Supabase'e Yükleniyor..."
                    : "+ Yeni Medya Yükle (Dropzone / Batch)"}
                </span>
              </button>

              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                className="px-3.5 py-2.5 rounded-lg bg-white border border-[#e7eeff] text-[#002869] text-xs font-semibold outline-none"
              >
                {MEDIA_CATEGORIES.filter((c) => c !== "Tümü").map((c) => (
                  <option key={c} value={c}>
                    Yükleme Kategorisi: {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search, Category Chips & View Controls */}
          <div className="flex flex-col gap-4 bg-white p-4 rounded-xl shadow-xs border border-[#e7eeff]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="relative flex-1 min-w-[260px] max-w-xl">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748b] text-[20px]">
                  search
                </span>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#f0f3ff] text-[#101c2e] text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#002869]/20 transition-all"
                  placeholder="Görsel adı, alt metin veya kategori ara..."
                  type="text"
                />
              </div>

              <div className="flex items-center bg-[#f0f3ff] p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-white text-[#002869] shadow-xs"
                      : "text-[#64748b]"
                  }`}
                  title="Izgara Görünümü"
                >
                  <span className="material-symbols-outlined text-[19px]">
                    grid_view
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded cursor-pointer ${
                    viewMode === "list"
                      ? "bg-white text-[#002869] shadow-xs"
                      : "text-[#64748b]"
                  }`}
                  title="Liste Görünümü"
                >
                  <span className="material-symbols-outlined text-[19px]">
                    view_list
                  </span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {MEDIA_CATEGORIES.map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={
                      active
                        ? "px-3 py-1.5 rounded-full text-[11px] bg-[#002869] text-white font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                        : "px-3 py-1.5 rounded-full text-[11px] bg-[#ebf2fc] text-[#002869] hover:bg-[#e7eeff] transition-colors font-semibold flex items-center gap-1.5 cursor-pointer"
                    }
                  >
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Workspace Grid: 8-Column Media Gallery + 4-Column Inspector */}
          <div className="grid grid-cols-12 gap-6 items-start">
            {/* Left Column: Gallery Media Cards Grid (Col-Span 8) */}
            <div className="col-span-12 xl:col-span-8 flex flex-col gap-6">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="bg-white rounded-xl h-56 border border-[#e7eeff]"
                    />
                  ))}
                </div>
              ) : filteredAssets.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center shadow-xs border border-[#dee8ff] flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#ebf2fc] text-[#002869] flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl">
                      perm_media
                    </span>
                  </div>
                  <h3 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#002869]">
                    Medya Kütüphanesinde Kayıtlı Dosya Bulunmuyor
                  </h3>
                  <p className="text-sm text-[#64748b] max-w-md">
                    Supabase `media_assets` tablosu şu anda boş. Yeni görsel veya
                    belge yüklediğinizde burada anında listelenecek ve CDN
                    bağlantısı üretilecektir.
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-5 py-2.5 rounded-lg bg-[#002869] text-white text-sm font-semibold hover:bg-[#225aba] cursor-pointer"
                  >
                    + İlk Medya Dosyasını Yükle
                  </button>
                </div>
              ) : (
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                      : "flex flex-col gap-3"
                  }
                >
                  {filteredAssets.map((asset) => {
                    const isSelected = selectedAsset?.id === asset.id;
                    return (
                      <div
                        key={asset.id}
                        onClick={() => handleSelectAsset(asset)}
                        className={`group relative bg-white rounded-xl overflow-hidden shadow-xs hover:shadow-md border border-[#e7eeff] transition-all cursor-pointer ${
                          isSelected ? "ring-2 ring-[#002869]" : ""
                        }`}
                      >
                        <div className="relative w-full aspect-video bg-[#e7eeff] overflow-hidden">
                          <img
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            alt={asset.alt_text || asset.file_name}
                            src={asset.file_url}
                          />
                          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-full bg-[#002869]/90 text-white text-[10px] font-bold">
                              {asset.aspect_ratio || "16:9"}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-[#225aba] text-white text-[10px] font-bold">
                              {asset.format || "IMG"}
                            </span>
                          </div>
                        </div>

                        <div className="p-3.5 flex flex-col gap-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm text-[#101c2e] font-bold truncate">
                                {asset.file_name}
                              </span>
                              <span className="text-[11px] text-[#64748b]">
                                {asset.dimensions || "HD"} •{" "}
                                {asset.file_size || "—"}
                              </span>
                            </div>
                            {isSelected && (
                              <span className="material-symbols-outlined text-[#225aba] text-[20px]">
                                check_circle
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-xs text-[#64748b] pt-2 bg-[#f0f3ff] px-2.5 py-1.5 rounded-lg">
                            <span className="text-[11px] text-[#002869] font-semibold truncate">
                              {asset.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Batch Drag-and-Drop Dropzone Section */}
              <div className="bg-white p-6 rounded-2xl shadow-xs border border-[#e7eeff] flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#ebf2fc] flex items-center justify-center text-[#002869]">
                      <span className="material-symbols-outlined text-[24px]">
                        cloud_upload
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-['Plus_Jakarta_Sans'] text-lg text-[#002869] font-bold">
                        Toplu Medya Yükleme Alanı (Supabase Storage)
                      </span>
                      <span className="text-xs text-[#64748b]">
                        PNG, JPG, WebP, SVG • Maksimum 25 MB
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center py-10 px-6 rounded-xl bg-[#f0f3ff] hover:bg-[#ebf2fc] border-2 border-dashed border-[#c4c6d3] transition-all cursor-pointer text-center group"
                >
                  <div className="w-14 h-14 rounded-full bg-white group-hover:bg-[#002869] group-hover:text-white text-[#002869] transition-all flex items-center justify-center mb-3 shadow-xs">
                    <span className="material-symbols-outlined text-[28px]">
                      upload_file
                    </span>
                  </div>
                  <p className="text-sm text-[#101c2e] font-bold mb-1">
                    {uploading
                      ? "Dosyalar Supabase Storage'a yükleniyor..."
                      : "Dosyaları seçmek için tıklayın"}
                  </p>
                  <p className="text-xs text-[#64748b] max-w-md">
                    Yüklenen görseller doğrudan Supabase `media` bucket&apos;ına ve
                    `media_assets` veritabanı tablosuna kaydedilir.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Selected Asset Inspector & Tooling Panel (Col-Span 4) */}
            <div className="col-span-12 xl:col-span-4 flex flex-col gap-6">
              <div className="bg-white p-5 rounded-xl shadow-xs border border-[#e7eeff] flex flex-col gap-5 sticky top-20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#002869] text-[22px]">
                      troubleshoot
                    </span>
                    <span className="font-['Plus_Jakarta_Sans'] text-lg text-[#002869] font-bold">
                      Varlık Müfettişi
                    </span>
                  </div>
                  {selectedAsset && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                      Aktif Varlık
                    </span>
                  )}
                </div>

                {!selectedAsset ? (
                  <div className="py-12 text-center text-xs text-[#64748b] bg-[#f0f3ff] rounded-xl p-4">
                    Detaylarını incelemek veya düzenlemek için sol taraftan bir
                    medya varlığı seçin.
                  </div>
                ) : (
                  <>
                    <div className="relative w-full aspect-video bg-[#e7eeff] rounded-lg overflow-hidden">
                      <img
                        className="w-full h-full object-cover"
                        alt={selectedAsset.alt_text || selectedAsset.file_name}
                        src={selectedAsset.file_url}
                      />
                    </div>

                    <div className="flex flex-col gap-2.5 bg-[#f0f3ff] p-3.5 rounded-lg text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[#64748b] font-semibold">
                          Dosya Adı:
                        </span>
                        <span className="text-[#101c2e] font-bold truncate max-w-[180px]">
                          {selectedAsset.file_name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#64748b] font-semibold">
                          Format &amp; Boyut:
                        </span>
                        <span className="text-[#101c2e] font-semibold">
                          {selectedAsset.format} • {selectedAsset.file_size}
                        </span>
                      </div>
                    </div>

                    {/* CDN URL & Copy Button */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-[#64748b] uppercase">
                        Supabase Public CDN URL
                      </label>
                      <div className="flex items-center gap-1.5 bg-[#f0f3ff] p-1.5 rounded-lg">
                        <input
                          className="w-full bg-transparent text-xs text-[#334155] px-2 focus:outline-none"
                          readOnly
                          type="text"
                          value={selectedAsset.file_url}
                        />
                        <button
                          type="button"
                          onClick={handleCopyUrl}
                          className="px-2.5 py-1.5 bg-[#002869] hover:bg-[#225aba] text-white rounded text-[11px] font-bold transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {copiedUrl ? "done" : "content_copy"}
                          </span>
                          <span>{copiedUrl ? "Kopyalandı" : "Kopyala"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Category & Alt Text Editor */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] font-bold text-[#64748b] uppercase">
                        Kategori
                      </label>
                      <select
                        value={categoryDraft}
                        onChange={(e) => setCategoryDraft(e.target.value)}
                        className="w-full bg-[#f0f3ff] text-[#101c2e] text-xs font-semibold p-2.5 rounded-lg outline-none"
                      >
                        {MEDIA_CATEGORIES.filter((c) => c !== "Tümü").map(
                          (c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-[#64748b] uppercase">
                        SEO &amp; Erişilebilirlik (Alt Metin)
                      </label>
                      <textarea
                        value={altTextDraft}
                        onChange={(e) => setAltTextDraft(e.target.value)}
                        className="w-full bg-[#f0f3ff] text-[#101c2e] text-xs p-3 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#002869]/20 resize-none"
                        placeholder="Ekran okuyucular ve arama motorları için açıklayıcı metin..."
                        rows={3}
                      />
                    </div>

                    <div className="flex flex-col gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleSaveInspector}
                        disabled={savingInspector}
                        className="w-full py-2.5 rounded-lg bg-[#225aba] hover:bg-[#002869] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          save
                        </span>
                        <span>
                          {savingInspector
                            ? "Kaydediliyor..."
                            : "Meta Verileri Güncelle"}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteAsset(selectedAsset.id)}
                        className="w-full py-2 rounded-lg bg-[#ffdad6] hover:bg-[#ba1a1a]/20 text-[#93000a] text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          delete
                        </span>
                        <span>Medyayı Veritabanından Sil</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
