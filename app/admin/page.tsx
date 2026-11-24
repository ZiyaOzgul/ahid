"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import {
  BOARD_CATEGORIES,
  BOARD_CATEGORY_LABELS,
  DOCUMENT_CATEGORIES,
  NEWS_CATEGORIES,
  normalizeBoardCategory,
  parseApplicationMeta,
} from "@/lib/constants";

interface ApplicationRow {
  id: number;
  application_no?: string | null;
  first_name: string;
  last_name: string;
  tier?: string | null;
  organization?: string | null;
  position?: string | null;
  email: string;
  phone?: string | null;
  city?: string | null;
  status: string;
  admin_notes?: string | null;
}

interface ContactMessageRow {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  type?: string | null;
}

interface BoardMemberRow {
  id: number;
  full_name: string;
  title: string;
  organization?: string | null;
  category: string;
  term_period?: string | null;
  term_label?: string | null;
  bio?: string | null;
  photo_url?: string | null;
  order_no: number | null;
}

interface NewsItemRow {
  id: number;
  title: string;
  slug: string;
  category: string;
  bulletin_no?: string | null;
  summary?: string | null;
  content?: string | null;
  image_url?: string | null;
  is_featured?: boolean | null;
  is_member_only?: boolean | null;
  published_at?: string | null;
}

interface DocumentRow {
  id: number;
  title: string;
  category: string;
  document_code?: string | null;
  description?: string | null;
  file_url?: string | null;
  file_format?: string | null;
  file_size?: string | null;
}

interface MediaAssetRow {
  file_url: string;
  file_name: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [messages, setMessages] = useState<ContactMessageRow[]>([]);
  const [articlesCount, setArticlesCount] = useState<number>(0);
  const [eventsCount, setEventsCount] = useState<number>(0);
  const [mediaAssetsCount, setMediaAssetsCount] = useState<number>(0);
  const [boardMembers, setBoardMembers] = useState<BoardMemberRow[]>([]);
  const [newsList, setNewsList] = useState<NewsItemRow[]>([]);
  const [docsList, setDocsList] = useState<DocumentRow[]>([]);
  const [showAddBoard, setShowAddBoard] = useState(false);
  const [editingBoardId, setEditingBoardId] = useState<number | null>(null);
  const [newBoardMember, setNewBoardMember] = useState({
    full_name: "",
    title: "",
    organization: "",
    category: "yonetim_kurulu",
    term_period: "2024 — 2026",
    term_label: "",
    bio: "",
    photo_url: "",
    order_no: 1,
  });
  const [editingNewsId, setEditingNewsId] = useState<number | null>(null);
  const [newNews, setNewNews] = useState({
    title: "",
    category: NEWS_CATEGORIES[0],
    bulletin_no: "",
    summary: "",
    content: "",
    image_url: "",
    is_featured: false,
    is_member_only: false,
  });
  const [newDoc, setNewDoc] = useState({
    title: "",
    category: DOCUMENT_CATEGORIES[0].id,
    document_code: "",
    description: "",
    file_url: "",
    file_format: "PDF",
    file_size: "",
  });
  const [uploadingDocFile, setUploadingDocFile] = useState(false);
  const [heroDragActive, setHeroDragActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastText, setToastText] = useState("Tüm CMS değişkenleri veritabanına kaydedildi!");
  const [lastSavedAt, setLastSavedAt] = useState<string>("Canlı Veritabanı");
  const [targetTemplate, setTargetTemplate] = useState<string>("home");
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<"cms" | "inbox">("cms");
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [uploadedMedia, setUploadedMedia] = useState<{ url: string; name: string }[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [cmsVars, setCmsVars] = useState<Record<string, string>>({});
  const [liveStats, setLiveStats] = useState<{
    members: number;
    years: number;
    events: number;
    partners: number;
  }>({
    members: 0,
    years: 36,
    events: 0,
    partners: 0,
  });

  const showToast = (msg: string) => {
    setToastText(msg);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3200);
  };

  const handleFieldImageUpload = async (
    file: File | undefined,
    cmsKey: "home_hero_image" | "summit_image",
    category: string
  ) => {
    if (!file) return;
    setUploadingField(cmsKey);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("bucket", "media");
      fd.append("category", category);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success && data.url) {
        setCmsVars((prev) => ({ ...prev, [cmsKey]: data.url }));
        setUploadedMedia((prev) => [{ url: data.url, name: file.name }, ...prev]);
        setMediaAssetsCount((c) => c + 1);
        showToast("Görsel yüklendi. Yayınlamak için 'Canlıya Aktar' butonuna basın.");
      } else {
        showToast(data.error || "Görsel yüklenemedi.");
      }
    } catch {
      showToast("Görsel yükleme sırasında bağlantı hatası.");
    } finally {
      setUploadingField(null);
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMedia(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("bucket", "media");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success && data.url) {
        setUploadedMedia((prev) => [{ url: data.url, name: file.name }, ...prev]);
        setMediaAssetsCount((c) => c + 1);
        showToast("Medya dosyası kütüphaneye yüklendi.");
      }
    } catch (err) {
      console.error("Media upload error:", err);
    } finally {
      setUploadingMedia(false);
    }
  };

  useEffect(() => {
    // 1. Load CMS variables
    fetch("/api/cms")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.variables) {
          setCmsVars(data.variables);
        }
        if (data.success && data.liveStats) {
          setLiveStats(data.liveStats);
        }
      })
      .catch((err) => console.error(err));

    // 2. Load applications
    fetch("/api/applications")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.applications) {
          setApplications(data.applications);
        }
      })
      .catch((err) => console.error(err));

    // 3. Load contact messages
    fetch("/api/contact")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.messages) {
          setMessages(data.messages);
        }
      })
      .catch((err) => console.error(err));

    // 4. Load articles count
    fetch("/api/articles")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.articles) {
          setArticlesCount(data.articles.length);
        }
      })
      .catch((err) => console.error(err));

    // 5. Load events count
    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.events) {
          setEventsCount(data.events.length);
        }
      })
      .catch((err) => console.error(err));

    // 6. Load board members
    fetch("/api/board")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.members) {
          setBoardMembers(data.members);
        }
      })
      .catch((err) => console.error(err));

    // 7. Load media assets count
    fetch("/api/media")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.assets) {
          setMediaAssetsCount(data.assets.length);
          setUploadedMedia(
            (data.assets as MediaAssetRow[])
              .slice(0, 6)
              .map((a) => ({ url: a.file_url, name: a.file_name }))
          );
        }
      })
      .catch((err) => console.error(err));

    // 8. Load news & documents
    fetch("/api/news")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.items) setNewsList(data.items);
      })
      .catch((err) => console.error(err));

    fetch("/api/documents")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.documents) setDocsList(data.documents);
      })
      .catch((err) => console.error(err));
  }, []);

  const resetBoardForm = () => {
    setEditingBoardId(null);
    setNewBoardMember({
      full_name: "",
      title: "",
      organization: "",
      category: "yonetim_kurulu",
      term_period: "2024 — 2026",
      term_label: "",
      bio: "",
      photo_url: "",
      order_no: 1,
    });
  };

  const handleStartEditBoardMember = (member: BoardMemberRow) => {
    setEditingBoardId(member.id);
    setNewBoardMember({
      full_name: member.full_name,
      title: member.title,
      organization: member.organization || "",
      category: normalizeBoardCategory(member.category),
      term_period: member.term_period || "2024 — 2026",
      term_label: member.term_label || "",
      bio: member.bio || "",
      photo_url: member.photo_url || "",
      order_no: member.order_no ?? 1,
    });
    setShowAddBoard(true);
  };

  const handleAddBoardMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardMember.full_name || !newBoardMember.title) return;
    try {
      const isEdit = Boolean(editingBoardId);
      const res = await fetch("/api/board", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEdit ? { id: editingBoardId, ...newBoardMember } : newBoardMember
        ),
      });
      const data = await res.json();
      if (data.success && data.member) {
        const updated = data.member as BoardMemberRow;
        if (isEdit) {
          setBoardMembers((prev) =>
            prev.map((m) => (m.id === updated.id ? updated : m))
          );
          showToast("Kurul üyesi bilgileri güncellendi.");
        } else {
          setBoardMembers((prev) => [...prev, updated]);
          showToast("Yeni kurul üyesi veritabanına eklendi.");
        }
        setShowAddBoard(false);
        resetBoardForm();
      } else {
        showToast(data.error || "Kurul üyesi kaydedilemedi.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBoardMember = async (id: number) => {
    try {
      const res = await fetch(`/api/board?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setBoardMembers((prev) => prev.filter((m) => m.id !== id));
        showToast("Kurul üyesi kaydı silindi.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const resetNewsForm = () => {
    setEditingNewsId(null);
    setNewNews({
      title: "",
      category: NEWS_CATEGORIES[0],
      bulletin_no: "",
      summary: "",
      content: "",
      image_url: "",
      is_featured: false,
      is_member_only: false,
    });
  };

  const handleStartEditNews = (item: NewsItemRow) => {
    setEditingNewsId(item.id);
    setNewNews({
      title: item.title,
      category: item.category || NEWS_CATEGORIES[0],
      bulletin_no: item.bulletin_no || "",
      summary: item.summary || "",
      content: item.content || "",
      image_url: item.image_url || "",
      is_featured: Boolean(item.is_featured),
      is_member_only: Boolean(item.is_member_only),
    });
  };

  const handleCreateNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNews.title) return;
    try {
      const isEdit = Boolean(editingNewsId);
      const res = await fetch("/api/news", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit ? { id: editingNewsId, ...newNews } : newNews),
      });
      const data = await res.json();
      if (data.success && data.item) {
        const saved = data.item as NewsItemRow;
        if (isEdit) {
          setNewsList((prev) => prev.map((n) => (n.id === saved.id ? saved : n)));
          showToast("Haber/duyuru kaydı güncellendi.");
        } else {
          setNewsList((prev) => [saved, ...prev]);
          showToast("Yeni haber/duyuru yayınlandı.");
        }
        resetNewsForm();
      } else {
        showToast(data.error || "Haber kaydedilemedi.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNews = async (id: number) => {
    try {
      const res = await fetch(`/api/news?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setNewsList((prev) => prev.filter((n) => n.id !== id));
        showToast("Haber kaydı silindi.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDocFileUpload = async (file: File | undefined) => {
    if (!file) return;
    setUploadingDocFile(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("bucket", "documents");
      fd.append("category", "Resmi Doküman");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.success && data.url) {
        const ext = file.name.split(".").pop()?.toUpperCase() || "PDF";
        setNewDoc((prev) => ({
          ...prev,
          file_url: data.url,
          file_format: ext,
          file_size: data.meta?.fileSize || prev.file_size,
        }));
        showToast("Doküman dosyası Supabase Storage'a yüklendi.");
      } else {
        showToast(data.error || "Doküman dosyası yüklenemedi.");
      }
    } catch {
      showToast("Doküman yükleme bağlantısı kurulamadı.");
    } finally {
      setUploadingDocFile(false);
    }
  };

  const handleCreateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoc.title) return;
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDoc),
      });
      const data = await res.json();
      if (data.success && data.document) {
        setDocsList((prev) => [data.document as DocumentRow, ...prev]);
        setNewDoc({
          title: "",
          category: DOCUMENT_CATEGORIES[0].id,
          document_code: "",
          description: "",
          file_url: "",
          file_format: "PDF",
          file_size: "",
        });
        showToast("Resmi belge kütüphaneye kaydedildi.");
      } else {
        showToast(data.error || "Belge kaydedilemedi.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDoc = async (id: number) => {
    try {
      const res = await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setDocsList((prev) => prev.filter((d) => d.id !== id));
        showToast("Doküman kaydı silindi.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCmsChange = (key: string, value: string) => {
    setCmsVars((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page: "home",
          variables: cmsVars,
        }),
      });
      const data = await res.json();
      if (data.success) {
        try {
          localStorage.removeItem("ahid_cms_draft");
        } catch {}
        setLastSavedAt(
          new Date().toLocaleTimeString("tr-TR", {
            hour: "2-digit",
            minute: "2-digit",
          })
        );
        showToast("Tüm CMS değişkenleri canlı veritabanına kaydedildi!");
      } else {
        showToast(data.error || "CMS kaydı başarısız oldu.");
      }
    } catch (err) {
      console.error(err);
      showToast("Bağlantı hatası nedeniyle kayıt tamamlanamadı.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = () => {
    try {
      localStorage.setItem("ahid_cms_draft", JSON.stringify(cmsVars));
      setLastSavedAt(
        new Date().toLocaleTimeString("tr-TR", {
          hour: "2-digit",
          minute: "2-digit",
        }) + " (Taslak)"
      );
      showToast("Değişiklikler tarayıcı taslağı olarak saklandı.");
    } catch {
      showToast("Taslak kaydedilemedi.");
    }
  };

  const handleExportApplicationsCsv = () => {
    const header = [
      "Basvuru No",
      "Ad",
      "Soyad",
      "Uyelik Turu",
      "Kurum",
      "Pozisyon",
      "E-Posta",
      "Telefon",
      "Sehir",
      "Durum",
    ];
    const rows = applications.map((a) => [
      a.application_no || "",
      a.first_name || "",
      a.last_name || "",
      a.tier || "",
      a.organization || "",
      a.position || "",
      a.email || "",
      a.phone || "",
      a.city || "",
      a.status || "",
    ]);
    const csv = [header, ...rows]
      .map((cols) =>
        cols
          .map((c) => `"${String(c).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ahid-basvurular-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`${applications.length} başvuru CSV olarak indirildi.`);
  };

  const handleUpdateStatus = async (id: string | number, status: string) => {
    try {
      await fetch("/api/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      setApplications((prev) =>
        prev.map((app) => (app.id === id ? { ...app, status } : app))
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#101c2e]">
      {/* Toast Notification on Save */}
      {savedNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#002869] text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3">
          <span className="material-symbols-outlined text-green-400">check_circle</span>
          <span className="text-sm font-semibold">{toastText}</span>
        </div>
      )}

      {/* Admin Sidebar & Header */}
      <AdminSidebar
        currentPath="/admin"
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <AdminHeader
        title="Genel Bakış & CMS Masası"
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Content Area */}
      <main className="relative pt-20 lg:ml-72 bg-background min-h-screen px-4 lg:px-8 py-6"><div className="flex flex-col w-full gap-8">
{/*  Top Command & Status Bar  */}
<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-xl shadow-sm">
<div className="flex flex-col gap-1">
<div className="flex items-center gap-3">
<span className="font-caption-caps text-caption-caps text-secondary font-bold uppercase tracking-wider bg-surface-ice px-2.5 py-1 rounded-full">CMS Dinamik Veri &amp; Değişken Motoru</span>
<span className="flex items-center gap-1.5 font-label-sm text-label-sm text-slate-muted">
<span className="w-2 h-2 rounded-full bg-secondary"></span>
          Canlı Senkronizasyon Aktif
        </span>
</div>
<h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold">Sayfa İçerik &amp; Değişken Yönetim Masası</h1>
<p className="font-body-sm text-body-sm text-slate-dark max-w-2xl">
        AHİD ana sayfa manşetleri, yönetim kurulu üye profilleri, afişler ve anlık form başvurularını tek merkezden revize edin. Yapılan değişiklikler CDN üzerinden anında yayına yansır.
      </p>
</div>
<div className="flex flex-wrap items-center gap-3">
<div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-container-low text-slate-dark font-label-sm text-label-sm">
<span className="material-symbols-outlined text-[18px] text-secondary">cloud_done</span>
<span>Durum: <strong className="text-on-surface">{lastSavedAt}</strong></span>
</div>
<Link href="/" target="_blank" className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-container-high text-primary hover:bg-surface-variant font-label-md text-label-md font-semibold transition-all shadow-sm">
<span className="material-symbols-outlined text-[18px]">visibility</span>
<span>Önizleme Al</span>
</Link>
<button onClick={handleSaveAll} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-on-primary hover:bg-primary-container font-label-md text-label-md font-bold transition-all shadow-md cursor-pointer disabled:opacity-75" type="button">
<span className="material-symbols-outlined text-[18px]">publish</span>
<span>{saving ? "Aktarılıyor..." : "Canlıya Aktar"}</span>
</button>
</div>
</div>
{/*  Operational Metric Tiles  */}
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
{/*  Metric 1  */}
<Link href="/admin/uyelik" className="bg-surface-container-lowest p-5 rounded-xl shadow-sm flex flex-col justify-between gap-3 relative overflow-hidden group hover:shadow-md transition-all border border-transparent hover:border-[#002869]/20">
<div className="flex items-center justify-between">
<span className="font-caption-caps text-caption-caps text-slate-muted uppercase">Üyelik Aday Masası</span>
<span className="p-2 rounded-lg bg-surface-ice text-primary">
<span className="material-symbols-outlined text-[20px]">badge</span>
</span>
</div>
<div className="flex items-baseline justify-between mt-1">
<div>
<span className="font-headline-lg text-headline-lg text-primary font-bold">{applications.length}</span>
<span className="font-body-sm text-body-sm text-slate-muted ml-1">kayıtlı başvuru</span>
</div>
<span className="font-caption-caps text-caption-caps bg-gold-light text-gold-deep px-2 py-0.5 rounded-full font-bold">
  {applications.filter(a => a.status === 'pending').length} Bekleyen
</span>
</div>
<span className="font-label-sm text-label-sm text-slate-dark flex items-center justify-between pt-2 border-t border-surface-container-low">
  <span>{applications.filter(a => a.status === "under_review").length} dosya Kurul incelemesinde</span>
  <span className="text-xs font-bold text-primary group-hover:translate-x-0.5 transition-transform">&rarr;</span>
</span>
</Link>
{/*  Metric 2  */}
<Link href="/admin/protokol" className="bg-surface-container-lowest p-5 rounded-xl shadow-sm flex flex-col justify-between gap-3 relative overflow-hidden group hover:shadow-md transition-all border border-transparent hover:border-[#002869]/20">
<div className="flex items-center justify-between">
<span className="font-caption-caps text-caption-caps text-slate-muted uppercase">Protokol &amp; İletişim</span>
<span className="p-2 rounded-lg bg-surface-ice text-secondary">
<span className="material-symbols-outlined text-[20px]">event_seat</span>
</span>
</div>
<div className="flex items-baseline justify-between mt-1">
<div>
<span className="font-headline-lg text-headline-lg text-secondary font-bold">{messages.length}</span>
<span className="font-body-sm text-body-sm text-slate-muted ml-1">aktif talep</span>
</div>
<span className="font-caption-caps text-caption-caps bg-surface-ice text-secondary px-2 py-0.5 rounded-full font-bold">
  {messages.filter(m => m.type === 'protocol_appointment').length} Randevu
</span>
</div>
<span className="font-label-sm text-label-sm text-slate-dark flex items-center justify-between pt-2 border-t border-surface-container-low">
  <span>Gelen mesajlar ve randevu talepleri</span>
  <span className="text-xs font-bold text-secondary group-hover:translate-x-0.5 transition-transform">&rarr;</span>
</span>
</Link>
{/*  Metric 3  */}
<Link href="/admin/yazilar" className="bg-surface-container-lowest p-5 rounded-xl shadow-sm flex flex-col justify-between gap-3 relative overflow-hidden group hover:shadow-md transition-all border border-transparent hover:border-[#002869]/20">
<div className="flex items-center justify-between">
<span className="font-caption-caps text-caption-caps text-slate-muted uppercase">Yayın &amp; Makaleler</span>
<span className="p-2 rounded-lg bg-surface-ice text-primary">
<span className="material-symbols-outlined text-[20px]">article</span>
</span>
</div>
<div className="flex items-baseline justify-between mt-1">
<div>
<span className="font-headline-lg text-headline-lg text-primary font-bold">{articlesCount}</span>
<span className="font-body-sm text-body-sm text-slate-muted ml-1">yayın kayıtlı</span>
</div>
<span className="font-caption-caps text-caption-caps bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">Yayın Arşivi</span>
</div>
<span className="font-label-sm text-label-sm text-slate-dark flex items-center justify-between pt-2 border-t border-surface-container-low">
  <span>Köşe yazıları ve akademik makaleler</span>
  <span className="text-xs font-bold text-primary group-hover:translate-x-0.5 transition-transform">&rarr;</span>
</span>
</Link>
{/*  Metric 4  */}
<Link href="/admin/etkinlikler" className="bg-surface-container-lowest p-5 rounded-xl shadow-sm flex flex-col justify-between gap-3 relative overflow-hidden group hover:shadow-md transition-all border border-transparent hover:border-[#002869]/20">
<div className="flex items-center justify-between">
<span className="font-caption-caps text-caption-caps text-slate-muted uppercase">Etkinlikler &amp; Zirve</span>
<span className="p-2 rounded-lg bg-surface-ice text-secondary">
<span className="material-symbols-outlined text-[20px]">event_available</span>
</span>
</div>
<div className="flex items-baseline justify-between mt-1">
<div>
<span className="font-headline-lg text-headline-lg text-on-surface font-bold">{eventsCount} <span className="text-body-lg text-slate-muted">Program</span></span>
</div>
<span className="font-caption-caps text-caption-caps bg-surface-ice text-secondary px-2 py-0.5 rounded-full font-bold">Takvim</span>
</div>
<span className="font-label-sm text-label-sm text-slate-dark flex items-center justify-between pt-2 border-t border-surface-container-low">
  <span>Zirve ve masterclass programları</span>
  <span className="text-xs font-bold text-secondary group-hover:translate-x-0.5 transition-transform">&rarr;</span>
</span>
</Link>
</div>
{/*  Workspace Tabs  */}
<div className="flex flex-wrap items-center gap-2 border-b-0 bg-surface-container-low p-1.5 rounded-xl w-fit">
<button
  onClick={() => {
    setActiveWorkspaceTab("cms");
    document.getElementById("cms-hero-section")?.scrollIntoView({ behavior: "smooth" });
  }}
  className={`flex items-center gap-2.5 px-5 py-2.5 rounded-lg font-label-md text-label-md font-bold transition-all cursor-pointer ${
    activeWorkspaceTab === "cms"
      ? "bg-primary text-on-primary shadow-sm"
      : "text-slate-dark hover:bg-surface-container"
  }`}
  type="button"
>
<span className="material-symbols-outlined text-[20px]">edit_document</span>
<span>Sayfa Değişkenleri &amp; Canlı İçerik Düzenleyici</span>
</button>
<Link href="/admin/medya" className="flex items-center gap-2.5 px-5 py-2.5 rounded-lg text-slate-dark hover:bg-surface-container font-label-md text-label-md font-semibold transition-all">
<span className="material-symbols-outlined text-[20px]">photo_library</span>
<span>Medya &amp; Fotoğraf Yöneticisi</span>
<span className="bg-surface-variant text-primary font-caption-caps text-caption-caps px-2 py-0.5 rounded-full">{mediaAssetsCount}</span>
</Link>
<button
  onClick={() => {
    setActiveWorkspaceTab("inbox");
    document.getElementById("admin-inbox-panel")?.scrollIntoView({ behavior: "smooth" });
  }}
  className={`flex items-center gap-2.5 px-5 py-2.5 rounded-lg font-label-md text-label-md font-semibold transition-all cursor-pointer ${
    activeWorkspaceTab === "inbox"
      ? "bg-primary text-on-primary shadow-sm"
      : "text-slate-dark hover:bg-surface-container"
  }`}
  type="button"
>
<span className="material-symbols-outlined text-[20px]">move_to_inbox</span>
<span>Gelen Form &amp; Başvuru Kutusu</span>
<span className="bg-error-container text-on-error-container font-caption-caps text-caption-caps px-2 py-0.5 rounded-full font-bold">{applications.length + messages.length} Kayıt</span>
</button>
</div>
{/*  Core Content Grid: Left Main Editor (8 cols) & Right Inbox Stream (4 cols)  */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
{/*  Left Column: Variable & Asset CMS Editor (8 Cols)  */}
<div className="lg:col-span-8 flex flex-col gap-8">
{/*  Target Page Switcher Card  */}
<div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-lg bg-surface-ice text-primary flex items-center justify-center">
<span className="material-symbols-outlined text-[22px]">auto_stories</span>
</div>
<div>
<span className="font-caption-caps text-caption-caps text-slate-muted uppercase">Düzenlenen Şablon</span>
<div className="font-headline-sm text-headline-sm text-primary font-bold">Ana Sayfa (Portal Hero &amp; Manşet)</div>
</div>
</div>
<div className="flex items-center gap-3">
<label className="font-label-sm text-label-sm text-slate-muted hidden sm:inline">Hedef Sayfa:</label>
<div className="relative">
<select
  value={targetTemplate}
  onChange={(e) => {
    const val = e.target.value;
    setTargetTemplate(val);
    if (val === "home") {
      document.getElementById("cms-hero-section")?.scrollIntoView({ behavior: "smooth" });
    } else if (val === "summit") {
      document.getElementById("cms-summit-section")?.scrollIntoView({ behavior: "smooth" });
    } else if (val === "events") {
      router.push("/admin/etkinlikler");
    } else if (val === "articles") {
      router.push("/admin/yazilar");
    } else if (val === "protocol") {
      router.push("/admin/protokol");
    }
  }}
  className="appearance-none bg-surface-container-low font-label-md text-label-md text-on-surface font-semibold pl-4 pr-10 py-2.5 rounded-lg focus:outline-none focus:bg-surface-container-lowest shadow-sm cursor-pointer"
>
<option value="home">Ana Sayfa (Hero &amp; Sayaçlar)</option>
<option value="summit">Zirve &amp; Afiş Yönetimi Bölümü</option>
<option value="events">Etkinlikler Modülüne Git →</option>
<option value="articles">Köşe Yazıları &amp; Yayın Odasına Git →</option>
<option value="protocol">İletişim &amp; Protokol Masasına Git →</option>
</select>
<span className="material-symbols-outlined text-[20px] text-slate-muted absolute right-2.5 top-2.5 pointer-events-none">expand_more</span>
</div>
</div>
</div>
{/*  Section 1: Hero & Üst Tanıtım Alanı  */}
<div id="cms-hero-section" className="bg-surface-container-lowest p-7 rounded-xl shadow-sm flex flex-col gap-6">
<div className="flex items-center justify-between">
<div className="flex items-center gap-3">
<span className="w-2.5 h-6 bg-primary rounded-full"></span>
<div>
<h2 className="font-headline-sm text-headline-sm text-primary font-bold">1. Hero &amp; Üst Tanıtım Alanı Değişkenleri</h2>
<p className="font-body-sm text-body-sm text-slate-muted">Canlı sitedeki manşet görseli, tipografik slogan ve temel kurum göstergeleri</p>
</div>
</div>
<span className="font-caption-caps text-caption-caps bg-surface-ice text-primary px-3 py-1 rounded-full font-semibold">Bölüm Kimliği: hero_section_v1</span>
</div>
<div className="flex flex-col gap-4">
<div className="flex flex-col gap-1.5">
<label className="font-label-sm text-label-sm text-slate-dark font-semibold">Ana Manşet Başlığı (Slogan)</label>
<input className="bg-surface-container-low font-body-md text-body-md text-on-surface p-3 rounded-lg focus:outline-none focus:bg-surface-container-lowest shadow-sm" type="text" value={cmsVars.home_hero_title || ""} onChange={(e) => handleCmsChange("home_hero_title", e.target.value)}/>
</div>
<div className="flex flex-col gap-1.5">
<label className="font-label-sm text-label-sm text-slate-dark font-semibold">Alt Tanıtım Paragrafı (Kurumsal Özet)</label>
<textarea className="bg-surface-container-low font-body-sm text-body-sm text-on-surface p-3 rounded-lg focus:outline-none focus:bg-surface-container-lowest shadow-sm leading-relaxed" rows={3}value={cmsVars.home_hero_subtitle || ""} onChange={(e) => handleCmsChange("home_hero_subtitle", e.target.value)}></textarea>
</div>
</div>
{/*  Image Upload & Dropzone Split Grid  */}
<div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-2">
{/*  Active Hero Photo Preview  */}
<div className="md:col-span-5 flex flex-col gap-2">
<span className="font-label-sm text-label-sm text-slate-dark font-semibold">Mevcut Hero Görseli</span>
<div className="relative rounded-lg overflow-hidden group shadow-sm bg-surface-container">
<img
  className="w-full h-44 object-cover"
  alt={cmsVars.home_hero_image_alt || "AHİD Ankara İletişim Zirvesi ve Yönetim Binası"}
  src={cmsVars.home_hero_image || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1000&auto=format&fit=crop&q=80"}
/>
<div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
<a
  href={cmsVars.home_hero_image || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1000&auto=format&fit=crop&q=80"}
  target="_blank"
  rel="noopener noreferrer"
  className="p-2 rounded-lg bg-surface-container-lowest text-primary hover:bg-surface-ice font-label-sm text-label-sm"
  title="Tam Boyut Gör"
>
<span className="material-symbols-outlined text-[18px]">zoom_in</span>
</a>
<button
  onClick={() => handleCmsChange("home_hero_image", "")}
  className="p-2 rounded-lg bg-surface-container-lowest text-error hover:bg-error-container font-label-sm text-label-sm cursor-pointer"
  type="button"
  title="Varsayılana Sıfırla"
>
<span className="material-symbols-outlined text-[18px]">delete</span>
</button>
</div>
<div className="absolute bottom-2 left-2 right-2 bg-surface/90 backdrop-blur-md px-2.5 py-1.5 rounded flex items-center justify-between">
<span className="font-caption-caps text-caption-caps text-primary font-bold truncate">
  {cmsVars.home_hero_image ? "Özel Yüklenmiş Görsel" : "Varsayılan Vitrin Görseli"}
</span>
<span className="font-caption-caps text-caption-caps text-slate-muted">Aktif</span>
</div>
</div>
<div className="flex flex-col gap-1 mt-1">
<label className="font-label-sm text-label-sm text-slate-muted">Görsel Alt Metni (SEO &amp; Erişilebilirlik)</label>
<input
  className="bg-surface-container-low font-body-sm text-body-sm text-on-surface px-3 py-1.5 rounded-lg focus:outline-none focus:bg-surface-container-lowest shadow-sm"
  type="text"
  value={cmsVars.home_hero_image_alt ?? "AHİD Ankara İletişim Zirvesi ve Yönetim Binası"}
  onChange={(e) => handleCmsChange("home_hero_image_alt", e.target.value)}
/>
</div>
</div>
{/*  Dropzone Uploader  */}
<div className="md:col-span-7 flex flex-col gap-2">
<span className="font-label-sm text-label-sm text-slate-dark font-semibold">Görsel Değiştir veya Yeni Yükle</span>
<label
  onDragOver={(e) => {
    e.preventDefault();
    setHeroDragActive(true);
  }}
  onDragLeave={() => setHeroDragActive(false)}
  onDrop={(e) => {
    e.preventDefault();
    setHeroDragActive(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      void handleFieldImageUpload(droppedFile, "home_hero_image", "Ana Sayfa Hero");
    }
  }}
  className={`h-44 rounded-lg transition-colors flex flex-col items-center justify-center p-4 text-center cursor-pointer group border border-dashed ${
    heroDragActive
      ? "bg-surface-ice border-primary"
      : "bg-surface-container-low hover:bg-surface-ice border-slate-300"
  }`}
>
<div className="w-12 h-12 rounded-full bg-surface-container-lowest text-secondary flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform">
<span className="material-symbols-outlined text-[26px]">
  {uploadingField === "home_hero_image" ? "progress_activity" : "cloud_upload"}
</span>
</div>
<span className="font-label-md text-label-md text-primary font-bold">
  {uploadingField === "home_hero_image" ? "Supabase Storage'a yükleniyor..." : "Yeni hero fotoğrafı seçin"}
</span>
<p className="font-caption-caps text-caption-caps text-slate-muted mt-0.5">PNG, JPG, WebP • Önerilen: 2560x1080px (Maks 10MB)</p>
<span className="mt-2.5 px-3 py-1 rounded bg-surface-container-lowest text-secondary font-label-sm text-label-sm font-semibold shadow-sm hover:bg-surface-container-high transition-colors">
  Bilgisayardan Dosya Seç
</span>
<input
  type="file"
  accept="image/*"
  className="hidden"
  onChange={(e) => handleFieldImageUpload(e.target.files?.[0], "home_hero_image", "Ana Sayfa Hero")}
/>
</label>
<div className="flex items-center gap-2 text-slate-muted font-caption-caps text-caption-caps">
<span className="material-symbols-outlined text-[16px] text-secondary">info</span>
<span>Yüklenen fotoğraflar otomatik olarak AVIF ve WebP formatında optimize edilir.</span>
</div>
</div>
</div>
{/*  Metric Counter Variables  */}
<div className="flex flex-col gap-3 pt-2">
<div className="flex flex-wrap items-center justify-between gap-2">
  <div>
    <span className="font-label-sm text-label-sm text-slate-dark font-semibold block">
      Ana Sayfa Sayısal Başarı Göstergeleri (0&apos;dan Artarak Gelen Canlı Sayaçlar)
    </span>
    <span className="text-xs text-slate-500">
      Boş bırakıldığında Supabase veritabanındaki gerçek kayıt sayıları ({liveStats.members} üye, {liveStats.years} yıl, {liveStats.events} etkinlik, {liveStats.partners} paydaş/belge) otomatik gösterilir; özel sayı girerseniz girdiğiniz değere 0&apos;dan artarak ulaşır.
    </span>
  </div>
  <div className="flex items-center gap-2">
    <button
      type="button"
      onClick={() => {
        setCmsVars((prev) => ({
          ...prev,
          home_stat_members: "",
          home_stat_years: "",
          home_stat_events: "",
          home_stat_partners: "",
        }));
      }}
      className="px-3 py-1.5 rounded-lg bg-surface-ice text-primary hover:bg-surface-container-high text-xs font-bold transition-colors cursor-pointer"
    >
      Otomatik DB Verisine Sıfırla
    </button>
    <button
      type="button"
      onClick={handleSaveAll}
      disabled={saving}
      className="px-3.5 py-1.5 rounded-lg bg-primary text-white hover:bg-primary-container text-xs font-bold transition-colors cursor-pointer"
    >
      {saving ? "Kaydediliyor..." : "Sayaçları Kaydet"}
    </button>
  </div>
</div>
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
<div className="p-3 rounded-lg bg-surface-container-low flex flex-col gap-1">
<span className="font-caption-caps text-caption-caps text-slate-muted">Seçkin İletişim Profesyoneli</span>
<div className="flex items-center justify-between gap-2">
<input
  className="bg-surface-container-lowest font-headline-sm text-headline-sm text-primary font-bold px-2.5 py-1 rounded w-full text-left focus:outline-none shadow-sm"
  type="number"
  min={0}
  placeholder={`Oto: ${liveStats.members}`}
  value={cmsVars.home_stat_members ?? ""}
  onChange={(e) => handleCmsChange("home_stat_members", e.target.value)}
/>
<span className="font-caption-caps text-caption-caps text-slate-dark font-semibold shrink-0">+ Üye</span>
</div>
</div>
<div className="p-3 rounded-lg bg-surface-container-low flex flex-col gap-1">
<span className="font-caption-caps text-caption-caps text-slate-muted">Yıllık Kurumsal Hafıza</span>
<div className="flex items-center justify-between gap-2">
<input
  className="bg-surface-container-lowest font-headline-sm text-headline-sm text-primary font-bold px-2.5 py-1 rounded w-full text-left focus:outline-none shadow-sm"
  type="number"
  min={0}
  placeholder={`Oto: ${liveStats.years}`}
  value={cmsVars.home_stat_years ?? ""}
  onChange={(e) => handleCmsChange("home_stat_years", e.target.value)}
/>
<span className="font-caption-caps text-caption-caps text-slate-dark font-semibold shrink-0">+ Yıl</span>
</div>
</div>
<div className="p-3 rounded-lg bg-surface-container-low flex flex-col gap-1">
<span className="font-caption-caps text-caption-caps text-slate-muted">Konferans &amp; Atölye</span>
<div className="flex items-center justify-between gap-2">
<input
  className="bg-surface-container-lowest font-headline-sm text-headline-sm text-primary font-bold px-2.5 py-1 rounded w-full text-left focus:outline-none shadow-sm"
  type="number"
  min={0}
  placeholder={`Oto: ${liveStats.events}`}
  value={cmsVars.home_stat_events ?? ""}
  onChange={(e) => handleCmsChange("home_stat_events", e.target.value)}
/>
<span className="font-caption-caps text-caption-caps text-slate-dark font-semibold shrink-0">+ Etkinlik</span>
</div>
</div>
<div className="p-3 rounded-lg bg-surface-container-low flex flex-col gap-1">
<span className="font-caption-caps text-caption-caps text-slate-muted">Akademik &amp; Sektörel Ortaklık</span>
<div className="flex items-center justify-between gap-2">
<input
  className="bg-surface-container-lowest font-headline-sm text-headline-sm text-primary font-bold px-2.5 py-1 rounded w-full text-left focus:outline-none shadow-sm"
  type="number"
  min={0}
  placeholder={`Oto: ${liveStats.partners}`}
  value={cmsVars.home_stat_partners ?? ""}
  onChange={(e) => handleCmsChange("home_stat_partners", e.target.value)}
/>
<span className="font-caption-caps text-caption-caps text-slate-dark font-semibold shrink-0">+ Paydaş</span>
</div>
</div>
</div>
</div>
</div>
{/*  Section 2: Yönetim Kurulu & Yazar Fotoğraf ve Bilgi Kartları Düzenleyici  */}
<div className="bg-surface-container-lowest p-7 rounded-xl shadow-sm flex flex-col gap-6">
<div className="flex items-center justify-between">
<div className="flex items-center gap-3">
<span className="w-2.5 h-6 bg-secondary rounded-full"></span>
<div>
<h2 className="font-headline-sm text-headline-sm text-primary font-bold">2. Yönetim Kurulu, Başkanlar ve Kurullar Düzenleyici</h2>
<p className="font-body-sm text-body-sm text-slate-muted">Kurul üyelerini, dönem başkanlarını ve istişare/denetim/onur kurullarını Supabase veritabanında yönetin</p>
</div>
</div>
<button
  onClick={() => setShowAddBoard(!showAddBoard)}
  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-ice text-primary hover:bg-surface-variant font-label-sm text-label-sm font-semibold transition-colors cursor-pointer"
  type="button"
>
<span className="material-symbols-outlined text-[16px]">person_add</span>
<span>{showAddBoard ? "Formu Kapat" : "Yeni Kurul Üyesi / Başkan Ekle"}</span>
</button>
</div>

{showAddBoard && (
  <form onSubmit={handleAddBoardMember} className="p-5 rounded-xl bg-surface-container-low grid grid-cols-1 sm:grid-cols-2 gap-3 border border-slate-200">
    <input
      type="text"
      required
      placeholder="Ad Soyad ve Unvan (Örn: Prof. Dr. ...)"
      value={newBoardMember.full_name}
      onChange={(e) => setNewBoardMember({ ...newBoardMember, full_name: e.target.value })}
      className="bg-white px-3 py-2 rounded-lg text-sm border border-slate-200"
    />
    <input
      type="text"
      required
      placeholder="Görev / Makam (Örn: Yönetim Kurulu Başkanı)"
      value={newBoardMember.title}
      onChange={(e) => setNewBoardMember({ ...newBoardMember, title: e.target.value })}
      className="bg-white px-3 py-2 rounded-lg text-sm border border-slate-200"
    />
    <input
      type="text"
      placeholder="Kurum / Üniversite"
      value={newBoardMember.organization}
      onChange={(e) => setNewBoardMember({ ...newBoardMember, organization: e.target.value })}
      className="bg-white px-3 py-2 rounded-lg text-sm border border-slate-200"
    />
    <select
      value={newBoardMember.category}
      onChange={(e) => setNewBoardMember({ ...newBoardMember, category: e.target.value })}
      className="bg-white px-3 py-2 rounded-lg text-sm border border-slate-200"
    >
      {BOARD_CATEGORIES.map((cat) => (
        <option key={cat.id} value={cat.id}>
          {cat.label}
        </option>
      ))}
    </select>
    <input
      type="text"
      placeholder="Dönem Yılları (Örn: 2024 — 2026)"
      value={newBoardMember.term_period}
      onChange={(e) => setNewBoardMember({ ...newBoardMember, term_period: e.target.value })}
      className="bg-white px-3 py-2 rounded-lg text-sm border border-slate-200"
    />
    <input
      type="text"
      placeholder="Fotoğraf URL (Opsiyonel)"
      value={newBoardMember.photo_url}
      onChange={(e) => setNewBoardMember({ ...newBoardMember, photo_url: e.target.value })}
      className="bg-white px-3 py-2 rounded-lg text-sm border border-slate-200"
    />
    <textarea
      placeholder="Kısa Biyografi / Dönem Özeti"
      rows={2}
      value={newBoardMember.bio}
      onChange={(e) => setNewBoardMember({ ...newBoardMember, bio: e.target.value })}
      className="sm:col-span-2 bg-white px-3 py-2 rounded-lg text-sm border border-slate-200"
    />
    <div className="sm:col-span-2 flex justify-end gap-2">
      {editingBoardId && (
        <button
          type="button"
          onClick={() => {
            resetBoardForm();
            setShowAddBoard(false);
          }}
          className="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
        >
          Vazgeç
        </button>
      )}
      <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold cursor-pointer">
        {editingBoardId ? "Değişiklikleri Güncelle" : "Supabase Veritabanına Kaydet"}
      </button>
    </div>
  </form>
)}

{/*  Member Management Cards (Dynamic from Supabase)  */}
<div className="flex flex-col gap-4">
{boardMembers.length === 0 ? (
  <div className="p-6 rounded-xl bg-surface-container-low text-center border border-dashed border-slate-200">
    <span className="material-symbols-outlined text-3xl text-slate-400 mb-1">groups</span>
    <p className="font-semibold text-primary text-sm">Veritabanında henüz yönetim veya kurul üyesi kaydı bulunmuyor</p>
    <p className="text-xs text-slate-500 mt-1">Yukarıdaki &quot;Yeni Kurul Üyesi / Başkan Ekle&quot; butonunu kullanarak yönetim, denetim, istişare veya dönem başkanı ekleyebilirsiniz.</p>
  </div>
) : (
  boardMembers.map((member) => (
    <div key={member.id} className="p-4 rounded-xl bg-surface-container-low flex flex-col md:flex-row items-center gap-5 justify-between shadow-sm">
      <div className="flex items-center gap-4 w-full md:w-auto">
        <div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0 shadow-sm bg-surface-ice flex items-center justify-center text-primary">
          {member.photo_url ? (
            <img className="w-full h-full object-cover" src={member.photo_url} alt={member.full_name} />
          ) : (
            <span className="material-symbols-outlined text-2xl">person</span>
          )}
        </div>
        <div className="flex flex-col">
          <span className="font-caption-caps text-caption-caps text-gold-deep font-bold uppercase">
            {member.title} {member.term_period ? `• ${member.term_period}` : ""}
          </span>
          <span className="font-label-md text-label-md text-on-surface font-bold">{member.full_name}</span>
          <span className="font-body-sm text-body-sm text-slate-muted">
            {member.organization ? `${member.organization} • ` : ""}
            {BOARD_CATEGORY_LABELS[normalizeBoardCategory(member.category)] || member.category}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 self-end md:self-center">
        <button
          onClick={() => handleStartEditBoardMember(member)}
          className="p-1.5 rounded-lg text-slate-muted hover:text-primary hover:bg-surface-ice transition-colors cursor-pointer"
          type="button"
          title="Düzenle"
        >
          <span className="material-symbols-outlined text-[18px]">edit</span>
        </button>
        <button
          onClick={() => handleDeleteBoardMember(member.id)}
          className="p-1.5 rounded-lg text-slate-muted hover:text-error hover:bg-error-container transition-colors cursor-pointer"
          type="button"
          title="Sil"
        >
          <span className="material-symbols-outlined text-[18px]">delete</span>
        </button>
      </div>
    </div>
  ))
)}
</div>
</div>

{/*  Section 4: Haber/Duyuru ve Resmi Belge Hızlı Yayınlama Masası  */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex flex-col gap-3">
    <form onSubmit={handleCreateNews} className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-headline-sm text-headline-sm text-primary font-bold">
          {editingNewsId ? "Haberi Düzenle" : `Haber & Basın Bülteni Ekle (${newsList.length})`}
        </h3>
        <Link href="/haberler" className="text-xs font-bold text-secondary hover:underline">Portalı Gör →</Link>
      </div>
      <input
        type="text"
        required
        placeholder="Haber / Basın Bülteni Başlığı"
        value={newNews.title}
        onChange={(e) => setNewNews({ ...newNews, title: e.target.value })}
        className="bg-surface-container-low px-3 py-2 rounded-lg text-sm"
      />
      <div className="grid grid-cols-2 gap-2">
        <select
          value={newNews.category}
          onChange={(e) => setNewNews({ ...newNews, category: e.target.value })}
          className="bg-surface-container-low px-3 py-2 rounded-lg text-xs"
        >
          {NEWS_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Bülten No (Örn: BB-2026/08)"
          value={newNews.bulletin_no}
          onChange={(e) => setNewNews({ ...newNews, bulletin_no: e.target.value })}
          className="bg-surface-container-low px-3 py-2 rounded-lg text-xs"
        />
      </div>
      <textarea
        rows={2}
        placeholder="Kısa Özet / Spot Metni"
        value={newNews.summary}
        onChange={(e) => setNewNews({ ...newNews, summary: e.target.value })}
        className="bg-surface-container-low px-3 py-2 rounded-lg text-xs"
      />
      <textarea
        rows={2}
        placeholder="Tam Duyuru / Haber Metni (Opsiyonel)"
        value={newNews.content}
        onChange={(e) => setNewNews({ ...newNews, content: e.target.value })}
        className="bg-surface-container-low px-3 py-2 rounded-lg text-xs"
      />
      <input
        type="text"
        placeholder="Kapak Görsel URL (Opsiyonel)"
        value={newNews.image_url}
        onChange={(e) => setNewNews({ ...newNews, image_url: e.target.value })}
        className="bg-surface-container-low px-3 py-2 rounded-lg text-xs"
      />
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={newNews.is_featured}
              onChange={(e) => setNewNews({ ...newNews, is_featured: e.target.checked })}
            />
            <span>Manşet / Öne Çıkan</span>
          </label>
          <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={newNews.is_member_only}
              onChange={(e) => setNewNews({ ...newNews, is_member_only: e.target.checked })}
            />
            <span>Üyelere Özel İçerik</span>
          </label>
        </div>
        <div className="flex items-center gap-2">
          {editingNewsId && (
            <button
              type="button"
              onClick={resetNewsForm}
              className="px-3 py-2 rounded-lg bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              İptal
            </button>
          )}
          <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold cursor-pointer">
            {editingNewsId ? "Haberi Güncelle" : "Haberi Yayınla"}
          </button>
        </div>
      </div>
    </form>

    {newsList.length > 0 && (
      <div className="pt-3 border-t border-slate-100 flex flex-col gap-1.5 max-h-40 overflow-y-auto">
        {newsList.slice(0, 6).map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded bg-surface-container-low text-xs">
            <div className="flex items-center gap-2 min-w-0">
              {item.is_member_only && (
                <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold shrink-0">ÜYE</span>
              )}
              <span className="font-semibold text-primary truncate">{item.title}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => handleStartEditNews(item)}
                className="p-1 text-slate-500 hover:text-primary cursor-pointer"
                title="Düzenle"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
              </button>
              <button
                type="button"
                onClick={() => handleDeleteNews(item.id)}
                className="p-1 text-slate-500 hover:text-red-600 cursor-pointer"
                title="Sil"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>

  <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex flex-col gap-3">
    <form onSubmit={handleCreateDoc} className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Mevzuat &amp; Resmi Belge Ekle ({docsList.length})</h3>
        <Link href="/kaynaklar" className="text-xs font-bold text-secondary hover:underline">Kütüphaneyi Gör →</Link>
      </div>
      <input
        type="text"
        required
        placeholder="Belge Başlığı (Örn: AHİD Ana Tüzüğü)"
        value={newDoc.title}
        onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
        className="bg-surface-container-low px-3 py-2 rounded-lg text-sm"
      />
      <div className="grid grid-cols-2 gap-2">
        <select
          value={newDoc.category}
          onChange={(e) => setNewDoc({ ...newDoc, category: e.target.value })}
          className="bg-surface-container-low px-3 py-2 rounded-lg text-xs"
        >
          {DOCUMENT_CATEGORIES.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.label}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Belge No (Örn: AHID-2026-01)"
          value={newDoc.document_code}
          onChange={(e) => setNewDoc({ ...newDoc, document_code: e.target.value })}
          className="bg-surface-container-low px-3 py-2 rounded-lg text-xs"
        />
      </div>
      <input
        type="text"
        placeholder="Belge Açıklaması / Kapsamı"
        value={newDoc.description}
        onChange={(e) => setNewDoc({ ...newDoc, description: e.target.value })}
        className="bg-surface-container-low px-3 py-2 rounded-lg text-xs"
      />
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <input
            type="text"
            placeholder="Dosya İndirme URL (PDF)"
            value={newDoc.file_url}
            onChange={(e) => setNewDoc({ ...newDoc, file_url: e.target.value })}
            className="bg-surface-container-low px-3 py-1.5 rounded-lg text-xs flex-1 min-w-0"
          />
          <label className="px-2.5 py-1.5 rounded-lg bg-surface-ice text-primary text-xs font-bold cursor-pointer hover:bg-surface-variant shrink-0">
            {uploadingDocFile ? "Yükleniyor..." : "PDF Yükle"}
            <input
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => void handleDocFileUpload(e.target.files?.[0])}
            />
          </label>
        </div>
        <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold cursor-pointer shrink-0">
          Belgeyi Kaydet
        </button>
      </div>
    </form>

    {docsList.length > 0 && (
      <div className="pt-3 border-t border-slate-100 flex flex-col gap-1.5 max-h-40 overflow-y-auto">
        {docsList.slice(0, 6).map((doc) => (
          <div key={doc.id} className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded bg-surface-container-low text-xs">
            <span className="font-semibold text-primary truncate">
              {doc.document_code ? `[${doc.document_code}] ` : ""}{doc.title}
            </span>
            <button
              type="button"
              onClick={() => handleDeleteDoc(doc.id)}
              className="p-1 text-slate-500 hover:text-red-600 cursor-pointer shrink-0"
              title="Sil"
            >
              <span className="material-symbols-outlined text-sm">delete</span>
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
</div>
{/*  Section 3: Duyuru & Etkinlik Afişi Yönetimi  */}
<div id="cms-summit-section" className="bg-surface-container-lowest p-7 rounded-xl shadow-sm flex flex-col gap-6">
<div className="flex items-center justify-between">
<div className="flex items-center gap-3">
<span className="w-2.5 h-6 bg-gold-deep rounded-full"></span>
<div>
<h2 className="font-headline-sm text-headline-sm text-primary font-bold">3. Zirve &amp; Etkinlik Afişi Yönetim Masası</h2>
<p className="font-body-sm text-body-sm text-slate-muted">Yaklaşan sempozyum afişleri, kayıt kontenjanı ve salon protokol bilgileri</p>
</div>
</div>
<span className="font-caption-caps text-caption-caps bg-surface-ice text-secondary px-3 py-1 rounded-full font-bold">Aktif Zirve Dönemi</span>
</div>
<div className="grid grid-cols-1 md:grid-cols-12 gap-5">
<div className="md:col-span-4 flex flex-col gap-2">
<span className="font-label-sm text-label-sm text-slate-dark font-semibold">Resmi Etkinlik Afişi</span>
<div className="relative rounded-lg overflow-hidden bg-surface-container shadow-sm group">
<img
  className="w-full h-56 object-cover"
  alt="AHİD Başkent İletişim Zirvesi Afişi"
  src={cmsVars.summit_image || "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1000&auto=format&fit=crop&q=80"}
/>
<div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
<label className="px-3 py-1.5 rounded bg-surface-container-lowest text-primary font-label-sm text-label-sm font-bold shadow-sm cursor-pointer">
  {uploadingField === "summit_image" ? "Yükleniyor..." : "Afişi Değiştir"}
  <input
    type="file"
    accept="image/*"
    className="hidden"
    onChange={(e) => handleFieldImageUpload(e.target.files?.[0], "summit_image", "Etkinlik Afişleri")}
  />
</label>
</div>
</div>
</div>
<div className="md:col-span-8 flex flex-col gap-3">
<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
<div className="flex flex-col gap-1">
<label className="font-label-sm text-label-sm text-slate-dark font-semibold">Etkinlik Başlığı</label>
<input className="bg-surface-container-low font-body-sm text-body-sm text-on-surface px-3 py-2 rounded-lg focus:outline-none focus:bg-surface-container-lowest shadow-sm" type="text" value={cmsVars.summit_title || ""} onChange={(e) => handleCmsChange("summit_title", e.target.value)}/>
</div>
<div className="flex flex-col gap-1">
<label className="font-label-sm text-label-sm text-slate-dark font-semibold">Tarih &amp; Saat</label>
<input className="bg-surface-container-low font-body-sm text-body-sm text-on-surface px-3 py-2 rounded-lg focus:outline-none focus:bg-surface-container-lowest shadow-sm" type="text" value={cmsVars.summit_date || ""} onChange={(e) => handleCmsChange("summit_date", e.target.value)}/>
</div>
</div>
<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
<div className="flex flex-col gap-1">
<label className="font-label-sm text-label-sm text-slate-dark font-semibold">Konum / Salon</label>
<input className="bg-surface-container-low font-body-sm text-body-sm text-on-surface px-3 py-2 rounded-lg focus:outline-none focus:bg-surface-container-lowest shadow-sm" type="text" value={cmsVars.summit_location || ""} onChange={(e) => handleCmsChange("summit_location", e.target.value)}/>
</div>
<div className="flex flex-col gap-1">
<label className="font-label-sm text-label-sm text-slate-dark font-semibold">Kayıt Kontenjanı</label>
<input className="bg-surface-container-low font-body-sm text-body-sm text-on-surface px-3 py-2 rounded-lg focus:outline-none focus:bg-surface-container-lowest shadow-sm" type="text" value={cmsVars.summit_quota ?? "450 Kişi"} onChange={(e) => handleCmsChange("summit_quota", e.target.value)}/>
</div>
<div className="flex flex-col gap-1">
<label className="font-label-sm text-label-sm text-slate-dark font-semibold">Protokol Katılımı</label>
<input className="bg-surface-container-low font-body-sm text-body-sm text-on-surface px-3 py-2 rounded-lg focus:outline-none focus:bg-surface-container-lowest shadow-sm" type="text" value={cmsVars.summit_protocol ?? "Bakanlık & Basın Heyeti"} onChange={(e) => handleCmsChange("summit_protocol", e.target.value)}/>
</div>
</div>
<div className="flex flex-col gap-1 mt-1">
<label className="font-label-sm text-label-sm text-slate-dark font-semibold">Ana Konuşmacı Vurgusu &amp; Açıklama</label>
<textarea className="bg-surface-container-low font-body-sm text-body-sm text-on-surface px-3 py-2 rounded-lg focus:outline-none focus:bg-surface-container-lowest shadow-sm" rows={2} value={cmsVars.summit_description ?? "Kamu, akademi ve medya dünyasından iletişim profesyonellerinin katılımıyla Ankara'da stratejik iletişim ve itibar yönetimi ele alınıyor."} onChange={(e) => handleCmsChange("summit_description", e.target.value)}></textarea>
</div>
</div>
</div>
</div>
</div>
{/*  Right Column: Real-Time Inbound Submissions & Protocol Desk (4 Cols)  */}
<div id="admin-inbox-panel" className="lg:col-span-4 flex flex-col gap-6">
{/*  Panel Header & Action  */}
<div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex flex-col gap-5">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2.5">
<span className="w-2.5 h-2.5 rounded-full bg-error"></span>
<h3 className="font-headline-sm text-headline-sm text-primary font-bold">Gelen Form &amp; Başvurular</h3>
</div>
<span className="font-caption-caps text-caption-caps bg-surface-ice text-primary px-2.5 py-1 rounded-full font-bold">Canlı Akış</span>
</div>
<p className="font-body-sm text-body-sm text-slate-muted">
          Sitedeki başvuru formları, protokol randevuları ve akademik üyelik belgeleri anlık olarak bu masaya düşer.
        </p>
{/*  Dynamic Submissions Feed List  */}
<div className="flex flex-col gap-4">
  {applications.length === 0 ? (
    <div className="p-6 rounded-xl bg-surface-container-low text-center text-slate-500 text-sm border border-dashed border-slate-200">
      <span className="material-symbols-outlined text-3xl text-slate-400 mb-1">inbox</span>
      <p className="font-semibold text-slate-700">Bekleyen üyelik başvurusu bulunmuyor</p>
      <p className="text-xs text-slate-400 mt-1">Yeni adaylar başvurduğunda anlık olarak burada listelenecektir.</p>
    </div>
  ) : (
    applications.map((app, idx) => (
      <div key={app.id || idx} className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold font-label-md text-label-md uppercase">
              {app.first_name ? app.first_name[0] : "A"}{app.last_name ? app.last_name[0] : "H"}
            </div>
            <div>
              <div className="font-label-md text-label-md text-on-surface font-bold leading-tight">
                {app.first_name} {app.last_name}
              </div>
              <span className="font-caption-caps text-caption-caps text-slate-muted">
                {app.organization || app.city || "Ankara"} • {app.application_no}
              </span>
            </div>
          </div>
          <span className={`font-caption-caps text-caption-caps px-2 py-0.5 rounded-full font-semibold ${
            app.status === "approved"
              ? "bg-emerald-100 text-emerald-800"
              : app.status === "rejected"
              ? "bg-red-100 text-red-800"
              : app.status === "under_review"
              ? "bg-amber-100 text-amber-800"
              : "bg-surface-ice text-primary"
          }`}>
            {app.status === "approved"
              ? "Onaylandı"
              : app.status === "rejected"
              ? "Reddedildi"
              : app.status === "under_review"
              ? "Kurul İncelemesi"
              : "Bekliyor"}
          </span>
        </div>
        <p className="font-body-sm text-body-sm text-slate-dark text-xs">
          <strong>Pozisyon:</strong> {app.position || "Belirtilmedi"} | <strong>E-Posta:</strong> {app.email}
        </p>
        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
          <span className="text-[11px] font-medium text-slate-500">
            {parseApplicationMeta(app.admin_notes).note || "Sicil masası incelemede"}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleUpdateStatus(app.id, "rejected")}
              className="px-2.5 py-1 rounded bg-surface-container-lowest text-error hover:bg-error-container font-label-sm text-xs font-semibold transition-colors cursor-pointer"
              type="button"
            >
              Reddet
            </button>
            <button
              onClick={() => handleUpdateStatus(app.id, "under_review")}
              className="px-2 py-1 rounded bg-amber-100 text-amber-800 hover:bg-amber-200 text-xs font-semibold transition-colors cursor-pointer"
              type="button"
            >
              İncele
            </button>
            <button
              onClick={() => handleUpdateStatus(app.id, "approved")}
              className="px-2.5 py-1 rounded bg-primary text-on-primary hover:bg-primary-container font-label-sm text-xs font-semibold transition-colors"
              type="button"
            >
              Onayla
            </button>
          </div>
        </div>
      </div>
    ))
  )}

  {/* Contact Messages Subsection */}
  <div className="mt-4 pt-4 border-t border-slate-200">
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">İletişim & Randevu Talepleri ({messages.length})</span>
      <span className="text-[11px] text-primary font-semibold">Canlı Supabase</span>
    </div>
    {messages.length === 0 ? (
      <p className="text-xs text-slate-400 text-center py-2">Gelen mesaj veya randevu talebi bulunmuyor.</p>
    ) : (
      messages.map((msg, idx) => (
        <div key={msg.id || idx} className="p-3 mb-2 rounded-lg bg-surface-container-low text-xs flex flex-col gap-1 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800">{msg.name}</span>
            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold">{msg.type === "protocol_appointment" ? "Protokol Randevusu" : "Mesaj"}</span>
          </div>
          <span className="text-slate-600 line-clamp-2">{msg.message}</span>
          <span className="text-[10px] text-slate-400">{msg.email} • {msg.phone || "Telefon yok"}</span>
        </div>
      ))
    )}
  </div>
</div>
{/*  Export & Bulk Actions  */}
<div className="pt-2 flex flex-col gap-2">
<button
  onClick={handleExportApplicationsCsv}
  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-surface-container-low text-primary hover:bg-surface-ice font-label-md text-label-md font-semibold transition-all cursor-pointer"
  type="button"
>
<span className="material-symbols-outlined text-[18px]">download</span>
<span>Tüm Başvuruları Excel/CSV Olarak İndir</span>
</button>
<Link className="text-center font-label-sm text-label-sm text-secondary hover:underline py-1 font-semibold" href="/admin/uyelik">
            Tüm {applications.length} Başvuruyu Arşivde Gör →
          </Link>
</div>
</div>
{/*  Quick Media Library Mini-Widget  */}
<div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm flex flex-col gap-4">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-[20px] text-primary">photo_library</span>
<span className="font-label-md text-label-md text-primary font-bold">Son Eklenen Fotoğraflar (Supabase Storage)</span>
</div>
</div>
{uploadedMedia.length === 0 ? (
  <div className="py-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">
    Henüz medya galerisine fotoğraf yüklenmedi.
  </div>
) : (
  <div className="grid grid-cols-3 gap-2">
    {uploadedMedia.map((m, i) => (
      <div key={i} className="relative rounded-lg overflow-hidden h-20 bg-surface-container group shadow-sm">
        <img src={m.url} alt={m.name} className="w-full h-full object-cover" />
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(m.url)}
          title="Görsel URL Kopyala"
          className="absolute inset-0 bg-primary/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold cursor-pointer"
        >
          URL Kopyala
        </button>
      </div>
    ))}
  </div>
)}
<div className="p-3 rounded-lg bg-surface-container-low flex items-center justify-between">
<span className="font-label-sm text-label-sm text-slate-dark">
  {uploadingMedia ? "Yükleniyor..." : "Doğrudan Medya Yükle:"}
</span>
<label className="px-2.5 py-1 rounded bg-surface-container-lowest text-primary font-label-sm text-label-sm font-semibold shadow-sm hover:bg-surface-ice transition-colors cursor-pointer">
  + Hızlı Yükle
  <input type="file" accept="image/*" onChange={handleMediaUpload} className="hidden" />
</label>
</div>
</div>
</div>
</div>
{/*  Persistent Floating Bottom Quick-Save & Toast Bar  */}
<div className="sticky bottom-4 z-30 w-full bg-surface-container-lowest/95 backdrop-blur-xl p-4 rounded-xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
<div className="flex items-center gap-3">
<div className="w-9 h-9 rounded-full bg-surface-ice text-primary flex items-center justify-center">
<span className="material-symbols-outlined text-[20px]">sync</span>
</div>
<div>
<div className="font-label-sm text-label-sm text-on-surface font-bold">Sayfa Değişiklikleri Hazır</div>
<p className="font-caption-caps text-caption-caps text-slate-muted">Canlı sitede yayına almak için onaylayın veya taslak olarak saklayın.</p>
</div>
</div>
<div className="flex items-center gap-3 w-full sm:w-auto justify-end">
<button
  onClick={handleSaveDraft}
  className="px-4 py-2 rounded-lg bg-surface-container-low text-slate-dark hover:bg-surface-container-high font-label-md text-label-md font-semibold transition-colors cursor-pointer"
  type="button"
>
        Taslak Olarak Sakla
      </button>
<button onClick={handleSaveAll} disabled={saving} className="px-6 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container font-label-md text-label-md font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-75" type="button">
<span className="material-symbols-outlined text-[18px]">publish</span>
<span>{saving ? "Yayınlanıyor..." : "Canlı Sitede Yayınla"}</span>
</button>
</div>
</div>
</div></main>
    </div>
  );
}
