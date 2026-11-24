"use client";

import { useEffect, useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";

interface ArticleItem {
  id: number;
  title: string;
  slug?: string;
  author_name: string;
  author_title?: string;
  author_avatar?: string;
  category: string;
  summary?: string;
  content?: string;
  read_time?: string;
  published_at?: string;
  image_url?: string;
  views_count?: number;
}

function escapeHtml(val?: string | null): string {
  return String(val || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default function AdminYazilarPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "all" | "kose" | "ustayasaygi" | "academic"
  >("all");
  const [selectedArticle, setSelectedArticle] = useState<ArticleItem | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [showRevisionBox, setShowRevisionBox] = useState(false);
  const [revisionNote, setRevisionNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Article Form State
  const [newArticle, setNewArticle] = useState({
    title: "",
    author_name: "",
    author_title: "Halkla İlişkiler Danışmanı",
    author_avatar: "",
    category: "Köşe Yazıları",
    read_time: "5 dk okuma",
    summary: "",
    content: "",
    image_url:
      "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=1000&auto=format&fit=crop&q=80",
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadArticles = async (withSpinner = false) => {
    if (withSpinner) setLoading(true);
    try {
      const res = await fetch("/api/articles");
      const data = await res.json();
      if (data.success && Array.isArray(data.articles)) {
        setArticles(data.articles);
        setSelectedArticle((prev) => prev || data.articles[0] || null);
      }
    } catch (err) {
      console.error("Yazılar yüklenirken hata:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetch("/api/articles")
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (data.success && Array.isArray(data.articles)) {
          setArticles(data.articles);
          setSelectedArticle(data.articles[0] || null);
        }
      })
      .catch((err) => console.error("Yazılar yüklenirken hata:", err))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const resetArticleForm = () => {
    setEditingArticleId(null);
    setNewArticle({
      title: "",
      author_name: "",
      author_title: "Halkla İlişkiler Danışmanı",
      author_avatar: "",
      category: "Köşe Yazıları",
      read_time: "5 dk okuma",
      summary: "",
      content: "",
      image_url:
        "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=1000&auto=format&fit=crop&q=80",
    });
  };

  const handleOpenEditArticle = (art: ArticleItem) => {
    setEditingArticleId(art.id);
    setNewArticle({
      title: art.title,
      author_name: art.author_name,
      author_title: art.author_title || "Halkla İlişkiler Danışmanı",
      author_avatar: art.author_avatar || "",
      category: art.category || "Köşe Yazıları",
      read_time: art.read_time || "5 dk okuma",
      summary: art.summary || "",
      content: art.content || "",
      image_url: art.image_url || "",
    });
    setIsAddModalOpen(true);
  };

  const handleCreateOrUpdateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArticle.title || !newArticle.author_name) {
      showToast("Lütfen başlık ve yazar adı alanlarını doldurunuz.");
      return;
    }
    setIsSubmitting(true);
    try {
      const method = editingArticleId ? "PATCH" : "POST";
      const payload = editingArticleId
        ? { id: editingArticleId, ...newArticle }
        : newArticle;
      const res = await fetch("/api/articles", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          editingArticleId
            ? "Makale / yayın güncellendi!"
            : "Yeni makale / yayın başarıyla eklendi!"
        );
        setIsAddModalOpen(false);
        resetArticleForm();
        loadArticles();
      } else {
        showToast(data.error || "İşlem başarısız oldu.");
      }
    } catch (err) {
      console.error(err);
      showToast("Bağlantı hatası oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteArticle = async (id: number) => {
    try {
      const res = await fetch(`/api/articles?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setArticles((prev) => prev.filter((a) => a.id !== id));
        if (selectedArticle?.id === id) {
          setSelectedArticle(null);
        }
        setConfirmDeleteId(null);
        showToast("Makale başarıyla silindi.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePublishSelected = async () => {
    if (!selectedArticle) return;
    const publishedDate =
      selectedArticle.published_at ||
      new Date().toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    try {
      const res = await fetch("/api/articles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedArticle.id,
          published_at: publishedDate,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setArticles((prev) =>
          prev.map((a) =>
            a.id === selectedArticle.id ? { ...a, published_at: publishedDate } : a
          )
        );
        setSelectedArticle({ ...selectedArticle, published_at: publishedDate });
        showToast(`"${selectedArticle.title}" yayın kaydı doğrulandı!`);
      }
    } catch {
      showToast("Yayın durumu güncellenemedi.");
    }
  };

  const handleSendRevisionNote = async () => {
    if (!selectedArticle || !revisionNote.trim()) {
      showToast("Lütfen revizyon notunu giriniz.");
      return;
    }
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "editorial_revision",
          name: selectedArticle.author_name,
          department: "Yayın & Editör Kurulu",
          subject: `Revizyon Talebi: ${selectedArticle.title}`,
          message: revisionNote.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Revizyon notu protokol/editoryal kayıtlarına işlendi.");
        setRevisionNote("");
        setShowRevisionBox(false);
      } else {
        showToast(data.error || "Revizyon notu gönderilemedi.");
      }
    } catch {
      showToast("Bağlantı hatası oluştu.");
    }
  };

  const handleCompileBulletin = () => {
    const html = `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"><title>AHİD Yıllık Yayın Bülteni</title><style>body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;color:#101c2e}h1{color:#002869}article{border-bottom:1px solid #e2e8f0;padding:16px 0}</style></head><body><h1>AHİD — Ankara Halkla İlişkiler Derneği Yayın Bülteni</h1><p>Derleme Tarihi: ${escapeHtml(new Date().toLocaleDateString("tr-TR"))} • Toplam ${articles.length} Yayın</p>${articles
      .map(
        (a) =>
          `<article><h2>${escapeHtml(a.title)}</h2><p><strong>${escapeHtml(a.author_name)}</strong> (${escapeHtml(a.category)}) • ${escapeHtml(a.published_at || "Güncel")}</p><p>${escapeHtml(a.summary || "")}</p></article>`
      )
      .join("")}</body></html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ahid-yillik-bulten-${new Date().getFullYear()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`${articles.length} yayını içeren bülten dosyası indirildi.`);
  };

  const koseCount = articles.filter((a) =>
    a.category.toLowerCase().includes("köşe")
  ).length;
  const ustaCount = articles.filter((a) =>
    a.category.toLowerCase().includes("usta")
  ).length;
  const academicCount = articles.filter((a) =>
    a.category.toLowerCase().includes("akademik")
  ).length;
  const totalViewsCount = articles.reduce(
    (sum, a) => sum + Number(a.views_count || 0),
    0
  );
  const shortContentCount = articles.filter(
    (a) => !a.content || a.content.trim().length < 40
  ).length;

  const filteredArticles = articles.filter((art) => {
    if (activeTab === "kose" && !art.category.toLowerCase().includes("köşe"))
      return false;
    if (activeTab === "ustayasaygi" && !art.category.toLowerCase().includes("usta"))
      return false;
    if (activeTab === "academic" && !art.category.toLowerCase().includes("akademik"))
      return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        art.title.toLowerCase().includes(q) ||
        art.author_name.toLowerCase().includes(q) ||
        (art.summary || "").toLowerCase().includes(q) ||
        art.category.toLowerCase().includes(q)
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
        currentPath="/admin/yazilar"
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <AdminHeader
        title="Köşe Yazıları & Yayınlar Masası"
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
                    menu_book
                  </span>
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-[#002869] tracking-tight">
                  Köşe Yazıları &amp; Yayınlar Masası
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
                  EDİTORYAL DENETİM
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#64748b] leading-relaxed">
                Yönetim kurulu, üye iletişimciler ve &quot;Usta&apos;ya Saygı&quot; serisi
                editoryal onay, revizyon ve indeksleme merkezi.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleCompileBulletin}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#f1f5f9] text-[#334155] hover:bg-[#e2e8f0] text-xs font-semibold transition-colors cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">
                  download
                </span>
                <span>Yıllık Bülten Derle (HTML)</span>
              </button>

              <button
                onClick={() => {
                  resetArticleForm();
                  setIsAddModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#002869] text-white hover:bg-[#1a4087] text-xs font-bold transition-all shadow-xs cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">
                  post_add
                </span>
                <span>Yeni Makale / Bülten Ekle</span>
              </button>
            </div>
          </div>

          {/* 2. KPI Kartları */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
                  Toplam Yayın &amp; Makale
                </span>
                <span className="w-8 h-8 rounded-lg bg-[#ebf2fc] text-[#002869] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">
                    article
                  </span>
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#002869]">
                  {articles.length}
                </span>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Yayında
                </span>
              </div>
              <p className="text-[11px] text-[#64748b] mt-1">
                {koseCount} Köşe Yazısı &bull; {ustaCount} Usta&apos;ya Saygı &bull; {academicCount} Akademik
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
                  Tam Metin / İnceleme Notu
                </span>
                <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">
                    fact_check
                  </span>
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-amber-600">
                  {shortContentCount}
                </span>
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                  Kısa Özet / Metin
                </span>
              </div>
              <p className="text-[11px] text-[#64748b] mt-1">
                {articles.length - shortContentCount} yayının tam metni girili
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
                  Toplam Okuma Sayısı
                </span>
                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">
                    trending_up
                  </span>
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#002869]">
                  {totalViewsCount.toLocaleString("tr-TR")}
                </span>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  Canlı Sayaç
                </span>
              </div>
              <p className="text-[11px] text-[#64748b] mt-1">
                Makale detay ziyaretlerinden toplanır
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
                  En Güncel Yayın
                </span>
                <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">
                    auto_stories
                  </span>
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-sm font-bold text-emerald-700 line-clamp-1">
                  {articles[0]?.title || "Henüz yayın yok"}
                </span>
              </div>
              <p className="text-[11px] text-[#64748b] mt-1 truncate">
                {articles[0]
                  ? `${articles[0].author_name} • ${articles[0].published_at || "Yayında"}`
                  : "Yeni makale ekleyebilirsiniz"}
              </p>
            </div>
          </div>

          {/* 3. Sekmeler & Filtre */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#e2e8f0]">
            <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                  activeTab === "all"
                    ? "bg-[#002869] text-white"
                    : "bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]"
                }`}
              >
                Tüm Yayınlar ({articles.length})
              </button>
              <button
                onClick={() => setActiveTab("kose")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                  activeTab === "kose"
                    ? "bg-[#002869] text-white"
                    : "bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]"
                }`}
              >
                Köşe Yazıları ({koseCount})
              </button>
              <button
                onClick={() => setActiveTab("ustayasaygi")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                  activeTab === "ustayasaygi"
                    ? "bg-[#002869] text-white"
                    : "bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]"
                }`}
              >
                Usta&apos;ya Saygı ({ustaCount})
              </button>
              <button
                onClick={() => setActiveTab("academic")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                  activeTab === "academic"
                    ? "bg-[#002869] text-white"
                    : "bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]"
                }`}
              >
                Akademik ({academicCount})
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#94a3b8] text-[18px]">
                search
              </span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Başlık, yazar veya konu ara..."
                className="w-full bg-[#f8fafc] text-xs rounded-lg pl-9 pr-3 py-2 border border-[#cbd5e1] focus:outline-none focus:border-[#002869]"
                type="text"
              />
            </div>
          </div>

          {/* 4. İki Kolonlu Editoryal Çalışma Alanı: Sol 7 Kolon (Kuyruk), Sağ 5 Kolon (Sticky Inspector) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Sol 7 Kolon: Makale Kuyruğu */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              {loading ? (
                <div className="bg-white p-12 rounded-xl text-center text-[#64748b] border border-[#e2e8f0]">
                  <span className="material-symbols-outlined text-3xl animate-spin text-[#002869]">
                    progress_activity
                  </span>
                  <p className="mt-2 text-xs">Yayınlar yükleniyor...</p>
                </div>
              ) : filteredArticles.length === 0 ? (
                <div className="bg-white p-12 rounded-xl text-center text-[#64748b] border border-[#e2e8f0]">
                  <span className="material-symbols-outlined text-4xl text-slate-300">
                    library_books
                  </span>
                  <p className="mt-2 text-xs font-bold text-slate-600">
                    Makale bulunamadı
                  </p>
                </div>
              ) : (
                filteredArticles.map((art) => {
                  const isSelected = selectedArticle?.id === art.id;
                  return (
                    <div
                      key={art.id}
                      onClick={() => setSelectedArticle(art)}
                      className={`p-5 rounded-xl border transition-all cursor-pointer bg-white ${
                        isSelected
                          ? "border-[#002869] shadow-md ring-2 ring-[#002869]/10"
                          : "border-[#e2e8f0] shadow-xs hover:border-[#cbd5e1]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#ebf2fc] text-[#002869] text-[10px] font-bold uppercase">
                          {art.category}
                        </span>
                        <span className="text-[11px] text-[#64748b]">
                          {art.published_at || "Bugün"} &bull;{" "}
                          {art.read_time || "5 dk okuma"}
                        </span>
                      </div>

                      <h3 className="font-bold text-sm text-[#0f172a] hover:text-[#002869] transition-colors leading-snug">
                        {art.title}
                      </h3>

                      <p className="text-xs text-[#475569] mt-2 line-clamp-2">
                        {art.summary || art.content || "İçerik özeti henüz girilmedi."}
                      </p>

                      {/* Yazar & Eylemler */}
                      <div className="mt-4 pt-3 border-t border-[#f1f5f9] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#002869] text-white flex items-center justify-center font-bold text-[10px]">
                            {art.author_name[0]}
                          </div>
                          <div>
                            <span className="font-bold text-xs text-[#1e293b]">
                              {art.author_name}
                            </span>
                            <span className="text-[10px] text-[#64748b] ml-1.5">
                              {art.author_title || "Yazar"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditArticle(art);
                            }}
                            className="p-1 rounded-md text-[#002869] hover:bg-[#ebf2fc] transition-colors cursor-pointer"
                            title="Düzenle"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              edit
                            </span>
                          </button>
                          {confirmDeleteId === art.id ? (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1"
                            >
                              <button
                                onClick={() => handleDeleteArticle(art.id)}
                                className="px-2 py-0.5 rounded bg-red-600 text-white text-[11px] font-bold cursor-pointer"
                              >
                                Sil
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px] cursor-pointer"
                              >
                                İptal
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(art.id);
                              }}
                              className="p-1 rounded-md text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Makaleyi Kaldır"
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                delete
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Sağ 5 Kolon: Sticky Inspector Panel */}
            <div className="lg:col-span-5 bg-white rounded-xl border border-[#e2e8f0] shadow-xs p-5 sticky top-24">
              {selectedArticle ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#002869] text-[20px]">
                        rate_review
                      </span>
                      <h3 className="font-bold text-sm text-[#0f172a]">
                        Editoryal Denetim Paneli
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold bg-[#ebf2fc] text-[#002869] px-2 py-0.5 rounded-full">
                      ID: #{selectedArticle.id}
                    </span>
                  </div>

                  {/* Makale Önizleme Başlığı */}
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#225aba]">
                      {selectedArticle.category}
                    </span>
                    <h4 className="font-bold text-sm text-[#0f172a] mt-1 leading-snug">
                      {selectedArticle.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-2 text-xs text-[#64748b]">
                      <span className="font-semibold text-[#1e293b]">
                        {selectedArticle.author_name}
                      </span>
                      <span>&bull;</span>
                      <span>{selectedArticle.read_time || "5 dk okuma"}</span>
                    </div>
                  </div>

                  {/* Canlı Editoryal Metrikler */}
                  {(() => {
                    const bodyText = (selectedArticle.content || selectedArticle.summary || "").trim();
                    const wordCount = bodyText ? bodyText.split(/\s+/).filter(Boolean).length : 0;
                    const charCount = bodyText.length;
                    const estMinutes = Math.max(1, Math.ceil(wordCount / 180));
                    return (
                      <div className="space-y-2 pt-2 border-t border-[#e2e8f0]">
                        <span className="text-xs font-bold text-[#475569] uppercase tracking-wider">
                          İçerik Analizi &amp; İstatistikler
                        </span>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
                            <span className="text-[10px] text-[#64748b] uppercase font-bold block">
                              Kelime / Karakter
                            </span>
                            <span className="font-bold text-[#002869]">
                              {wordCount} kelime • {charCount} krk
                            </span>
                          </div>
                          <div className="p-2.5 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
                            <span className="text-[10px] text-[#64748b] uppercase font-bold block">
                              Tahmini Okuma / Okunma
                            </span>
                            <span className="font-bold text-[#002869]">
                              {estMinutes} dk • {selectedArticle.views_count || 0} görüntüleme
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Görsel Önizleme */}
                  {selectedArticle.image_url && (
                    <div className="rounded-lg overflow-hidden h-28 bg-slate-100">
                      <img
                        src={selectedArticle.image_url}
                        alt="Önizleme"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Karar Eylemleri */}
                  <div className="pt-2 border-t border-[#e2e8f0] flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handlePublishSelected}
                        className="py-2.5 px-3 bg-[#002869] hover:bg-[#1a4087] text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          publish
                        </span>
                        Yayını Doğrula
                      </button>
                      <button
                        onClick={() => handleOpenEditArticle(selectedArticle)}
                        className="py-2.5 px-3 bg-[#ebf2fc] hover:bg-[#dee8ff] text-[#002869] rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          edit
                        </span>
                        Düzenle
                      </button>
                    </div>

                    <button
                      onClick={() => setShowRevisionBox((prev) => !prev)}
                      className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-amber-200"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        rate_review
                      </span>
                      Revizyon Notu İlet
                    </button>

                    {showRevisionBox && (
                      <div className="p-3 rounded-lg bg-[#f8fafc] border border-[#e2e8f0] space-y-2">
                        <textarea
                          rows={2}
                          value={revisionNote}
                          onChange={(e) => setRevisionNote(e.target.value)}
                          placeholder="Yazar için editoryal revizyon notunuz..."
                          className="w-full bg-white border border-[#cbd5e1] rounded-lg p-2 text-xs focus:outline-none"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowRevisionBox(false)}
                            className="px-2.5 py-1 text-xs rounded bg-slate-200 text-slate-700 cursor-pointer"
                          >
                            İptal
                          </button>
                          <button
                            type="button"
                            onClick={handleSendRevisionNote}
                            className="px-3 py-1 text-xs rounded bg-amber-600 text-white font-bold hover:bg-amber-700 cursor-pointer"
                          >
                            Kaydet &amp; İlet
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-[#64748b]">
                  <span className="material-symbols-outlined text-4xl text-slate-300">
                    touch_app
                  </span>
                  <p className="mt-2 text-xs font-medium">
                    İncelemek istediğiniz yayını soldaki listeden seçiniz.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Yeni Makale / Yayın Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#e2e8f0] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
              <h3 className="font-bold text-base text-[#002869]">
                {editingArticleId ? "Makale / Yayını Düzenle" : "Yeni Makale veya Yayın Ekle"}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  resetArticleForm();
                }}
                className="text-[#64748b] hover:text-[#002869] cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form
              onSubmit={handleCreateOrUpdateArticle}
              className="mt-4 space-y-3 text-xs"
            >
              <div>
                <label className="block text-[#475569] font-semibold mb-1">
                  Yayın / Makale Başlığı *
                </label>
                <input
                  required
                  value={newArticle.title}
                  onChange={(e) =>
                    setNewArticle({ ...newArticle, title: e.target.value })
                  }
                  placeholder="Örn: Dijital Diplomasi ve Kamusal İtibar Yönetimi"
                  className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg p-2 focus:outline-none focus:border-[#002869]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#475569] font-semibold mb-1">
                    Yazar Adı *
                  </label>
                  <input
                    required
                    value={newArticle.author_name}
                    onChange={(e) =>
                      setNewArticle({
                        ...newArticle,
                        author_name: e.target.value,
                      })
                    }
                    placeholder="Prof. Dr. ..."
                    className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg p-2 focus:outline-none focus:border-[#002869]"
                  />
                </div>
                <div>
                  <label className="block text-[#475569] font-semibold mb-1">
                    Yazar Ünvanı
                  </label>
                  <input
                    value={newArticle.author_title}
                    onChange={(e) =>
                      setNewArticle({
                        ...newArticle,
                        author_title: e.target.value,
                      })
                    }
                    placeholder="İletişim Danışmanı"
                    className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg p-2 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#475569] font-semibold mb-1">
                    Kategori
                  </label>
                  <select
                    value={newArticle.category}
                    onChange={(e) =>
                      setNewArticle({
                        ...newArticle,
                        category: e.target.value,
                      })
                    }
                    className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg p-2 focus:outline-none"
                  >
                    <option value="Köşe Yazıları">Köşe Yazıları</option>
                    <option value="Usta'ya Saygı Arşivi">
                      Usta&apos;ya Saygı Arşivi
                    </option>
                    <option value="Akademik & Hakemli">
                      Akademik &amp; Hakemli
                    </option>
                    <option value="Kamuoyu Bülteni">Kamuoyu Bülteni</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#475569] font-semibold mb-1">
                    Okuma Süresi
                  </label>
                  <input
                    value={newArticle.read_time}
                    onChange={(e) =>
                      setNewArticle({
                        ...newArticle,
                        read_time: e.target.value,
                      })
                    }
                    placeholder="5 dk okuma"
                    className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg p-2 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#475569] font-semibold mb-1">
                  Özet
                </label>
                <textarea
                  rows={2}
                  value={newArticle.summary}
                  onChange={(e) =>
                    setNewArticle({ ...newArticle, summary: e.target.value })
                  }
                  placeholder="Yazının ana fikri ve kamusal etki kapsamı..."
                  className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg p-2 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#475569] font-semibold mb-1">
                  Tam Metin / Makale İçeriği
                </label>
                <textarea
                  rows={4}
                  value={newArticle.content}
                  onChange={(e) =>
                    setNewArticle({ ...newArticle, content: e.target.value })
                  }
                  placeholder="Yayınlanacak tam makale metni..."
                  className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg p-2 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#475569] font-semibold mb-1">
                  Kapak Görsel URL
                </label>
                <input
                  value={newArticle.image_url}
                  onChange={(e) =>
                    setNewArticle({ ...newArticle, image_url: e.target.value })
                  }
                  placeholder="https://..."
                  className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-lg p-2 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-[#e2e8f0] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    resetArticleForm();
                  }}
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
                    : editingArticleId
                    ? "Değişiklikleri Kaydet"
                    : "Makaleyi Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
