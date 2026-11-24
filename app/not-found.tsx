import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-24">
        <div className="max-w-xl w-full bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#0f1c2e]/5 text-[#0f1c2e] mb-6">
            <span className="material-symbols-outlined text-4xl">
              travel_explore
            </span>
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b48636] mb-2">
            HATA KODU 404
          </p>
          <h1 className="text-3xl font-bold text-[#0f1c2e] mb-3 font-serif">
            Aradığınız Sayfa Bulunamadı
          </h1>
          <p className="text-slate-600 text-sm leading-relaxed mb-8">
            Talep ettiğiniz sayfa taşınmış, kaldırılmış veya bağlantı adresi hatalı
            olabilir. Ana sayfaya dönebilir ya da kurumsal arşivlerimizden devam
            edebilirsiniz.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0f1c2e] text-white text-sm font-semibold hover:bg-[#1a2f4b] transition"
            >
              <span className="material-symbols-outlined text-lg">home</span>
              Ana Sayfaya Dön
            </Link>
            <Link
              href="/iletisim"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition"
            >
              <span className="material-symbols-outlined text-lg">mail</span>
              İletişime Geç
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
