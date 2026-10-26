"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

function EventDetailContent() {
  const params = useParams();
  const id = params?.id as string;

  const [event, setEvent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [regStatus, setRegStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [regError, setRegError] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/events?id=${encodeURIComponent(id)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.event) {
          setEvent(data.event);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!event) return;
    setRegStatus("loading");
    setRegError("");
    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/events/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: event.id,
          participant_name: formData.get("participant_name"),
          participant_email: formData.get("participant_email"),
          participant_phone: formData.get("participant_phone"),
          organization: formData.get("organization"),
          position: formData.get("position"),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRegStatus("success");
        setEvent((prev: any) =>
          prev ? { ...prev, registrations_count: (prev.registrations_count || 0) + 1 } : prev
        );
      } else {
        setRegStatus("error");
        setRegError(data.error || "Kayıt sırasında bir hata oluştu.");
      }
    } catch {
      setRegStatus("error");
      setRegError("Sunucu bağlantı hatası oluştu.");
    }
  };

  return (
    <>
      <Navbar />
      <main className="w-full pt-[7.5rem] bg-surface min-h-[calc(100vh-24rem)] pb-20">
        <div className="max-w-5xl mx-auto px-margin-mobile lg:px-margin-desktop py-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6 font-medium">
            <Link href="/" className="hover:text-primary transition-colors">Ana Sayfa</Link>
            <span>/</span>
            <Link href="/etkinlikler" className="hover:text-primary transition-colors">Etkinlikler &amp; Takvim</Link>
            <span>/</span>
            <span className="text-primary font-semibold truncate max-w-[240px]">
              {event?.title || "Etkinlik Detayı"}
            </span>
          </nav>

          {loading ? (
            <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-sm animate-pulse space-y-6">
              <div className="h-6 w-36 bg-slate-200 rounded-full" />
              <div className="h-10 w-2/3 bg-slate-200 rounded-lg" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="h-20 bg-slate-200 rounded-xl" />
                <div className="h-20 bg-slate-200 rounded-xl" />
                <div className="h-20 bg-slate-200 rounded-xl" />
              </div>
              <div className="h-60 bg-slate-200 rounded-xl" />
            </div>
          ) : !event ? (
            <div className="bg-surface-container-lowest rounded-2xl p-12 text-center border border-dashed border-slate-200">
              <span className="material-symbols-outlined text-5xl text-slate-400 mb-3">event_busy</span>
              <h1 className="font-headline-md text-headline-md text-primary font-bold">
                Etkinlik Kaydı Bulunamadı
              </h1>
              <p className="font-body-sm text-body-sm text-slate-500 mt-2 max-w-md mx-auto">
                Aradığınız etkinlik veritabanında mevcut değil veya kaldırılmış olabilir.
              </p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <Link
                  href="/etkinlikler"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-container transition-colors"
                >
                  <span className="material-symbols-outlined text-base">arrow_back</span>
                  Etkinlik Takvimine Dön
                </Link>
                <Link
                  href="/admin-panel"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg border border-slate-200 text-primary text-sm font-semibold hover:bg-surface-ice transition-colors"
                >
                  <span className="material-symbols-outlined text-base">add_circle</span>
                  Yönetim Panelinden Etkinlik Ekle
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left 7 Cols: Event Details */}
              <div className="lg:col-span-7 bg-surface-container-lowest rounded-2xl p-8 shadow-sm border border-slate-100 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="px-3 py-1 rounded-full bg-surface-ice text-primary text-xs font-bold uppercase tracking-wider">
                    {event.category}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-gold-light/40 text-gold-deep text-xs font-bold">
                    {event.registration_open ? "Kayıtlar Açık" : "Kayıt Kapalı"} • {event.registrations_count || 0} Kayıtlı Katılımcı
                  </span>
                </div>

                <h1 className="font-headline-lg text-headline-lg text-primary font-extrabold leading-snug">
                  {event.title}
                </h1>

                {event.image_url && (
                  <div className="w-full h-64 rounded-xl overflow-hidden shadow-xs">
                    <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-surface-ice/60">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-2xl">calendar_today</span>
                    <div>
                      <span className="block text-[11px] uppercase font-bold text-slate-500">Tarih &amp; Saat</span>
                      <span className="text-sm font-bold text-primary">
                        {event.event_date} {event.event_time ? `• ${event.event_time}` : ""}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-2xl">location_on</span>
                    <div>
                      <span className="block text-[11px] uppercase font-bold text-slate-500">Etkinlik Yeri</span>
                      <span className="text-sm font-bold text-primary">{event.location}</span>
                    </div>
                  </div>
                </div>

                {event.summary && (
                  <p className="text-sm font-semibold text-slate-700 leading-relaxed">
                    {event.summary}
                  </p>
                )}

                <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {event.description || event.summary || "Bu etkinlik için ek açıklama metni girilmemiştir."}
                </div>
              </div>

              {/* Right 5 Cols: Direct Registration Card */}
              <div className="lg:col-span-5 bg-surface-container-lowest rounded-2xl p-6 lg:p-8 shadow-md border border-slate-100">
                <h2 className="font-headline-sm text-headline-sm text-primary font-bold mb-1">
                  Etkinlik Kayıt &amp; LCV Formu
                </h2>
                <p className="text-xs text-slate-500 mb-6">
                  Bilgilerinizi doldurarak <strong>{event.title}</strong> etkinliğine doğrudan katılım kaydınızı oluşturun.
                </p>

                {regStatus === "success" ? (
                  <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                    <span className="material-symbols-outlined text-4xl text-emerald-600">check_circle</span>
                    <h3 className="font-bold text-emerald-950 text-base">Kaydınız Tamamlandı!</h3>
                    <p className="text-xs text-emerald-800">
                      Etkinlik katılım kaydınız Supabase veritabanına başarıyla işlendi.
                    </p>
                    <button
                      type="button"
                      onClick={() => setRegStatus("idle")}
                      className="px-4 py-2 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition-colors cursor-pointer"
                    >
                      Yeni Katılımcı Kaydı Ekle
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Ad Soyad *</label>
                      <input
                        name="participant_name"
                        required
                        placeholder="Adınız ve Soyadınız"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low text-sm outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">E-posta Adresi *</label>
                      <input
                        name="participant_email"
                        type="email"
                        required
                        placeholder="ornek@kurum.com.tr"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low text-sm outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Telefon</label>
                      <input
                        name="participant_phone"
                        type="tel"
                        placeholder="05XX XXX XX XX"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low text-sm outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Kurum / Üniversite</label>
                        <input
                          name="organization"
                          placeholder="Kurum Adı"
                          className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low text-sm outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Görev / Unvan</label>
                        <input
                          name="position"
                          placeholder="Unvanınız"
                          className="w-full px-3.5 py-2.5 rounded-lg bg-surface-container-low text-sm outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>

                    {regStatus === "error" && (
                      <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs font-medium">
                        {regError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={regStatus === "loading"}
                      className="w-full py-3 rounded-lg bg-primary hover:bg-primary-container text-white font-bold text-sm shadow transition-all cursor-pointer disabled:opacity-60"
                    >
                      {regStatus === "loading" ? "Kaydediliyor..." : "Etkinliğe Kaydol"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function EventDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface" />}>
      <EventDetailContent />
    </Suspense>
  );
}
