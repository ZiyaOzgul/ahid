"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  async function handleConfirmUnsubscribe() {
    if (!token) {
      setStatus("error");
      setMessage("Geçerli bir abonelik iptal bağlantısı bulunamadı.");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch(
        `/api/newsletter?token=${encodeURIComponent(token)}`,
        { method: "DELETE" }
      );
      const data = (await res.json()) as {
        success?: boolean;
        message?: string;
        error?: string;
      };
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Abonelik iptal edilemedi.");
        return;
      }
      setStatus("done");
      setMessage(
        data.message || "Kurumsal bülten aboneliğiniz başarıyla sonlandırıldı."
      );
    } catch {
      setStatus("error");
      setMessage("Sunucuya bağlanılamadı. Lütfen tekrar deneyin.");
    }
  }

  return (
    <div className="max-w-lg w-full bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0f1c2e]/5 text-[#0f1c2e] mb-5">
        <span className="material-symbols-outlined text-3xl">
          unsubscribe
        </span>
      </div>
      <h1 className="text-2xl font-bold text-[#0f1c2e] mb-3">
        Bülten Aboneliği Yönetimi
      </h1>
      {!token ? (
        <p className="text-sm text-slate-600 mb-6">
          Bu sayfaya yalnızca size iletilen kurumsal bülten e-postasındaki
          kişiselleştirilmiş abonelik iptal bağlantısı ile erişebilirsiniz.
        </p>
      ) : status === "idle" ? (
        <>
          <p className="text-sm text-slate-600 mb-6">
            Ankara Halkla İlişkiler Derneği (AHİD) kurumsal e-posta bülteni
            aboneliğinizi sonlandırmak istediğinizi onaylayın.
          </p>
          <button
            type="button"
            onClick={handleConfirmUnsubscribe}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition"
          >
            <span className="material-symbols-outlined text-lg">
              mark_email_unread
            </span>
            Aboneliğimi İptal Et
          </button>
        </>
      ) : status === "loading" ? (
        <p className="text-sm text-slate-600">İşleminiz gerçekleştiriliyor...</p>
      ) : (
        <div
          className={`p-4 rounded-xl text-sm font-medium mb-6 ${
            status === "done"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message}
        </div>
      )}
      <div className="mt-6 pt-5 border-t border-slate-100">
        <Link
          href="/"
          className="text-sm font-semibold text-[#0f1c2e] hover:underline"
        >
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  );
}

export default function BultenIptalPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <Suspense
          fallback={
            <div className="text-sm text-slate-500">Yükleniyor...</div>
          }
        >
          <UnsubscribeContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
