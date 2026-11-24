"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-16">
      <div className="max-w-lg w-full bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-50 text-red-600 mb-5">
          <span className="material-symbols-outlined text-3xl">error</span>
        </div>
        <h1 className="text-2xl font-bold text-[#0f1c2e] mb-2">
          Beklenmeyen Bir Hata Oluştu
        </h1>
        <p className="text-sm text-slate-600 mb-6">
          {error.message ||
            "Sayfa yüklenirken teknik bir aksaklık yaşandı. Lütfen yeniden deneyin."}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0f1c2e] text-white text-sm font-semibold hover:bg-[#1a2f4b] transition"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
            Yeniden Dene
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition"
          >
            Ana Sayfa
          </Link>
        </div>
      </div>
    </div>
  );
}
