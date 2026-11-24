"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

interface ChallengeState {
  required: boolean;
  token: string;
  image: string;
}

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam =
    searchParams.get("redirect") || searchParams.get("next") || "";

  const [tab, setTab] = useState<"admin" | "member">("admin");
  const [identity, setIdentity] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [challenge, setChallenge] = useState<ChallengeState>({
    required: true,
    token: "",
    image: "",
  });
  const [captchaInput, setCaptchaInput] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showResetHelp, setShowResetHelp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState("Doğrulanıyor...");
  const [errorMessage, setErrorMessage] = useState("");

  const loadChallenge = async () => {
    try {
      const res = await fetch("/api/auth/challenge", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as Partial<ChallengeState>;
      setChallenge({
        required: data.required !== false,
        token: data.token || "",
        image: data.image || "",
      });
      setCaptchaInput("");
    } catch {
      // Ignore transient challenge load errors
    }
  };

  useEffect(() => {
    let active = true;
    fetch("/api/auth/challenge", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: Partial<ChallengeState> | null) => {
        if (!active || !data) return;
        setChallenge({
          required: data.required !== false,
          token: data.token || "",
          image: data.image || "",
        });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (challenge.required && !captchaInput.trim()) {
      setErrorMessage("Lütfen görseldeki güvenlik doğrulama kodunu giriniz.");
      return;
    }

    setLoading(true);
    setAuthMessage("Oturum Bilgileri Doğrulanıyor...");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identity.trim(),
          password,
          captchaToken: challenge.token,
          captchaAnswer: captchaInput.trim(),
          rememberMe,
          tab,
        }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
        user?: { role?: string; email?: string; full_name?: string };
      };

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Giriş başarısız.");
        setLoading(false);
        void loadChallenge();
        return;
      }

      const role = (data.user?.role || "member").toLowerCase();
      const isStaff = role === "admin" || role === "editor";
      let targetUrl = isStaff ? "/admin" : "/uye-paneli";

      if (
        redirectParam &&
        redirectParam.startsWith("/") &&
        !redirectParam.startsWith("//") &&
        (isStaff || !redirectParam.startsWith("/admin"))
      ) {
        targetUrl = redirectParam;
      }

      setAuthMessage("Giriş Başarılı, Yönlendiriliyor...");
      window.setTimeout(() => {
        router.push(targetUrl);
      }, 250);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Bilinmeyen ağ hatası";
      setErrorMessage(`Bağlantı hatası: ${msg}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9ff] flex flex-col justify-between py-10 px-4">
      <div className="max-w-lg mx-auto w-full mb-4 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#002869] hover:text-[#225aba] transition-colors bg-white px-3 py-1.5 rounded-lg shadow-xs"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          <span>AHİD Resmi Sitesine Dön</span>
        </Link>
        <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">
          Güvenli Yönetim Portalı
        </span>
      </div>

      <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-[#dee8ff] p-7 sm:p-9">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#ebf2fc] text-[#002869] flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-2xl">
              account_balance
            </span>
          </div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-xl font-extrabold text-[#002869]">
            AHİD Dijital Giriş Kapısı
          </h1>
          <p className="text-xs text-[#64748b] mt-1">
            Yönetim Kurulu, Editör ve Üye Portalı kimlik doğrulaması
          </p>
        </div>

        {/* Role Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#f0f3ff] rounded-xl mb-6">
          <button
            type="button"
            onClick={() => {
              setTab("admin");
              setErrorMessage("");
            }}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              tab === "admin"
                ? "bg-[#002869] text-white shadow-xs"
                : "text-[#475569] hover:text-[#002869]"
            }`}
          >
            Yönetici / Editör
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("member");
              setErrorMessage("");
            }}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              tab === "member"
                ? "bg-[#002869] text-white shadow-xs"
                : "text-[#475569] hover:text-[#002869]"
            }`}
          >
            Üye Portalı
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2">
            <span className="material-symbols-outlined text-base shrink-0 mt-0.5">
              error
            </span>
            <span>{errorMessage}</span>
          </div>
        )}

        <form
          className="flex flex-col space-y-4"
          id="auth-form"
          onSubmit={handleAuthSubmit}
        >
          <div className="flex flex-col space-y-1.5">
            <label
              className="font-label-md text-label-md text-slate-dark flex items-center justify-between"
              htmlFor="identity-input"
              id="identity-label"
            >
              <span>
                {tab === "admin"
                  ? "Kurumsal E-Posta veya T.C. Kimlik No"
                  : "E-Posta, Üye No veya T.C. Kimlik No"}
              </span>
              <span className="font-caption-caps text-caption-caps text-slate-muted lowercase font-normal">
                zorunlu
              </span>
            </label>
            <div className="relative flex items-center rounded-lg bg-[#f8fafc] border border-[#e2e8f0] focus-within:border-[#002869] focus-within:bg-white transition-colors">
              <span className="material-symbols-outlined absolute left-3 text-slate-muted pointer-events-none text-[20px]">
                person
              </span>
              <input
                autoComplete="username"
                className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-transparent text-sm text-[#101c2e] placeholder:text-slate-400 focus:outline-none"
                id="identity-input"
                placeholder={
                  tab === "admin"
                    ? "isim@ahid.org.tr veya 11 haneli T.C."
                    : "E-posta, AHID-2026-XXXX veya T.C."
                }
                required
                type="text"
                value={identity}
                onChange={(e) => setIdentity(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                className="font-label-md text-label-md text-slate-dark"
                htmlFor="password-input"
              >
                Şifre
              </label>
              <button
                className="font-caption-caps text-caption-caps text-secondary font-bold hover:underline cursor-pointer"
                onClick={() => setShowResetHelp((prev) => !prev)}
                type="button"
              >
                Şifremi Unuttum
              </button>
            </div>
            {showResetHelp && (
              <div className="rounded-lg bg-[#ebf2fc] border border-[#c3d9ff] p-3 text-xs text-[#002869] flex flex-col gap-1.5">
                <p className="font-semibold">
                  Kurumsal hesap ve şifre sıfırlama talepleri AHİD Genel
                  Sekreterliği tarafından doğrulanarak işleme alınmaktadır.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href="/iletisim?konu=Diğer%20Kurumsal%20Konular"
                    className="font-bold underline hover:text-[#225aba]"
                  >
                    Genel Sekreterliğe Talep İlet →
                  </Link>
                  <span className="text-[#434652]">info@ahid.org.tr</span>
                </div>
              </div>
            )}
            <div className="relative flex items-center rounded-lg bg-[#f8fafc] border border-[#e2e8f0] focus-within:border-[#002869] focus-within:bg-white transition-colors">
              <span className="material-symbols-outlined absolute left-3 text-slate-muted pointer-events-none text-[20px]">
                lock
              </span>
              <input
                autoComplete="current-password"
                className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-transparent text-sm text-[#101c2e] placeholder:text-slate-400 focus:outline-none"
                id="password-input"
                placeholder="••••••••••••"
                required
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                className="absolute right-3 text-slate-muted hover:text-[#002869] focus:outline-none flex items-center cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>

          {challenge.required && (
            <div className="flex flex-col space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  className="font-label-md text-label-md text-slate-dark"
                  htmlFor="captcha-input"
                >
                  Güvenlik Doğrulaması
                </label>
                <span className="text-[11px] text-slate-500">
                  Görseldeki 5 karakterli kod
                </span>
              </div>
              <div className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-6 relative flex items-center rounded-lg bg-[#f8fafc] border border-[#e2e8f0] focus-within:border-[#002869] focus-within:bg-white">
                  <span className="material-symbols-outlined absolute left-3 text-slate-muted pointer-events-none text-[18px]">
                    verified_user
                  </span>
                  <input
                    className="w-full pl-9 pr-2 py-2.5 rounded-lg bg-transparent text-sm text-[#101c2e] placeholder:text-slate-400 uppercase tracking-widest font-mono focus:outline-none"
                    id="captcha-input"
                    maxLength={6}
                    placeholder="Kodu Giriniz"
                    required
                    type="text"
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                  />
                </div>
                <div className="col-span-6 flex items-center justify-between gap-1 bg-[#f1f5f9] rounded-lg p-1 border border-[#e2e8f0]">
                  {challenge.image ? (
                    <img
                      src={challenge.image}
                      alt="Güvenlik doğrulama kodu"
                      className="h-10 w-auto object-contain rounded"
                    />
                  ) : (
                    <span className="text-[11px] text-slate-500 px-2">
                      Kod yükleniyor...
                    </span>
                  )}
                  <button
                    className="p-1.5 rounded text-slate-600 hover:text-[#002869] hover:bg-white transition-colors flex items-center cursor-pointer"
                    onClick={loadChallenge}
                    title="Yeni Güvenlik Kodu Üret"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      refresh
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-[#002869] cursor-pointer accent-[#002869]"
                id="remember-me"
                type="checkbox"
              />
              <span className="text-xs text-slate-600">
                Bu cihazda oturumu koru
              </span>
            </label>
            <span className="text-[10px] font-bold text-[#9b4900] bg-amber-50 px-2 py-0.5 rounded flex items-center gap-1 border border-amber-200">
              <span className="material-symbols-outlined text-[13px]">
                verified_user
              </span>
              HMAC Oturum
            </span>
          </div>

          <button
            className="w-full py-3 px-4 rounded-xl bg-[#002869] hover:bg-[#0b3d91] text-white text-sm font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            id="submit-btn"
            disabled={loading}
            type="submit"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined text-[20px] animate-spin">
                  progress_activity
                </span>
                <span>{authMessage}</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">
                  vpn_key
                </span>
                <span>
                  {tab === "admin"
                    ? "Yönetici Girişi Yap"
                    : "Üye Portalına Giriş Yap"}
                </span>
              </>
            )}
          </button>
        </form>
      </div>

      <p className="max-w-lg mx-auto text-center text-[11px] text-[#64748b] mt-6">
        Henüz AHİD üyesi değil misiniz?{" "}
        <Link href="/uyelik" className="font-bold text-[#002869] hover:underline">
          Üyelik Başvurusu Yapın →
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f9f9ff]" />}>
      <LoginFormContent />
    </Suspense>
  );
}
