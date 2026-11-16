"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"admin" | "member">("admin");
  const [identity, setIdentity] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [captchaCode, setCaptchaCode] = useState("7391");
  const [captchaInput, setCaptchaInput] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showResetHelp, setShowResetHelp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState("Doğrulanıyor...");
  const [errorMessage, setErrorMessage] = useState("");

  const captchaList = ["7391", "4820", "9154", "6208", "5173", "8492"];

  const refreshCaptcha = () => {
    let next = captchaList[Math.floor(Math.random() * captchaList.length)];
    while (next === captchaCode) {
      next = captchaList[Math.floor(Math.random() * captchaList.length)];
    }
    setCaptchaCode(next);
    setCaptchaInput("");
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (captchaInput.trim() !== captchaCode) {
      setErrorMessage("Güvenlik doğrulama kodu eşleşmiyor. Lütfen görseldeki 4 haneli kodu giriniz.");
      refreshCaptcha();
      return;
    }

    setLoading(true);
    setAuthMessage("Oturum Bilgileri Doğrulanıyor...");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity, password, tab, rememberMe }),
      });
      const data = await res.json();

      if (!data.success) {
        setErrorMessage(data.error || "Giriş başarısız.");
        setLoading(false);
        refreshCaptcha();
        return;
      }

      try {
        localStorage.setItem("ahid_auth", JSON.stringify(data.user));
      } catch {}

      let targetUrl = data.redirectUrl || (tab === "admin" ? "/admin" : "/uye-paneli");
      try {
        const nextParam = new URLSearchParams(window.location.search).get("next");
        if (
          nextParam &&
          nextParam.startsWith("/") &&
          !nextParam.startsWith("//") &&
          (data.user?.role === "admin" || data.user?.role === "editor" || !nextParam.startsWith("/admin"))
        ) {
          targetUrl = nextParam;
        }
      } catch {}

      setAuthMessage("Giriş Başarılı, Yönlendiriliyor...");
      setTimeout(() => {
        router.push(targetUrl);
      }, 450);
    } catch (err: any) {
      setErrorMessage("Bağlantı hatası: " + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9ff] flex flex-col justify-between py-10 px-4">
      {/* Top Bar Return Link */}
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

      <main className="w-full max-w-lg mx-auto bg-surface-container-lowest p-8 rounded-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div className="flex flex-col w-full">
{/*  Top Sovereign Affiliation & Certification Bar  */}
<div className="flex items-center justify-center pb-4 mb-6 bg-surface-container-low p-3 rounded-lg shadow-sm">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-secondary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance</span>
<span className="font-caption-caps text-caption-caps uppercase tracking-wider text-slate-dark">AHİD KURUMSAL YÖNETİM &amp; ÜYE PORTALI</span>
</div>
</div>
{/*  Institutional Crest & Identity Header  */}
<div className="flex flex-col items-center text-center mb-6">
<div className="relative mb-3 flex items-center justify-center">
<div className="w-20 h-20 rounded-2xl bg-white p-2 flex items-center justify-center shadow-md border border-slate-100">
  <img src="/ahid-logo.png" alt="AHİD Logo" className="w-full h-full object-contain" />
</div>
<span className="absolute -bottom-1 -right-2 px-1.5 py-0.5 rounded bg-tertiary-container text-tertiary-fixed font-caption-caps text-[10px] font-bold">1990</span>
</div>
<h1 className="font-headline-sm text-headline-sm text-primary tracking-tight font-extrabold uppercase mb-0.5">AHİD • ANKARA</h1>
<p className="font-body-sm text-body-sm text-slate-dark font-medium">Ankara Halkla İlişkiler Derneği</p>
<div className="flex items-center gap-2 mt-1">
<span className="h-[1px] w-5 bg-outline-variant"></span>
<span className="font-caption-caps text-caption-caps text-slate-muted uppercase tracking-widest text-[10px]">YÖNETİM, İÇERİK &amp; DİJİTAL BÜRO SİSTEMİ</span>
<span className="h-[1px] w-5 bg-outline-variant"></span>
</div>
</div>
{/*  Dual Authentication Segmented Selector  */}
<div className="grid grid-cols-2 p-1 mb-6 rounded-lg bg-surface-container shadow-inner">
<button id="tab-admin" onClick={() => setTab("admin")} className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-label-md text-label-md transition-all shadow-sm ${tab === "admin" ? "bg-surface-container-lowest text-primary font-bold shadow-xs" : "text-slate-muted hover:text-on-surface"}`} type="button">
<span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
<span>Yönetim Kurulu &amp; Editör</span>
</button>
<button id="tab-member" onClick={() => setTab("member")} className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg font-label-md text-label-md transition-all shadow-sm ${tab === "member" ? "bg-surface-container-lowest text-primary font-bold shadow-xs" : "text-slate-muted hover:text-on-surface"}`} type="button">
<span className="material-symbols-outlined text-[18px]">badge</span>
<span>Üye &amp; Delege Portalı</span>
</button>
</div>
{errorMessage && (
  <div className="bg-[#ffdad6] text-[#ba1a1a] p-3 rounded-lg text-xs font-semibold flex items-center gap-2 mb-2">
    <span className="material-symbols-outlined text-base">error</span>
    <span>{errorMessage}</span>
  </div>
)}
{/*  Authentication Form Body  */}
<form className="flex flex-col space-y-4" id="auth-form" onSubmit={handleAuthSubmit}>
{/*  Identity / Email Field  */}
<div className="flex flex-col space-y-1.5">
<label className="font-label-md text-label-md text-slate-dark flex items-center justify-between" htmlFor="identity-input" id="identity-label">
<span>{tab === "admin" ? "Kurumsal E-Posta veya T.C. Kimlik No" : "Üye Sicil No veya T.C. Kimlik No"}</span>
<span className="font-caption-caps text-caption-caps text-slate-muted lowercase font-normal">zorunlu</span>
</label>
<div className="relative flex items-center rounded-lg bg-surface-container-lowest shadow-sm">
<span className="material-symbols-outlined absolute left-3 text-slate-muted pointer-events-none text-[20px]">person</span>
<input autoComplete="username" className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-transparent font-body-sm text-body-sm text-on-surface placeholder:text-slate-muted/70 focus:outline-none focus:bg-surface-ice/40 transition-colors" id="identity-input" placeholder={tab === "admin" ? "tc.no@ahid.org.tr veya 11 haneli T.C." : "Üye No (Örn: AH-1042) veya T.C."} required type="text" value={identity} onChange={(e) => setIdentity(e.target.value)}/>
</div>
</div>
{/*  Password Field with Institutional Security Status  */}
<div className="flex flex-col space-y-1.5">
<div className="flex items-center justify-between">
<label className="font-label-md text-label-md text-slate-dark" htmlFor="password-input">Güvenli Şifre</label>
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
      Kurumsal hesap ve şifre sıfırlama talepleri AHİD Genel Sekreterliği tarafından doğrulanarak işleme alınmaktadır.
    </p>
    <div className="flex flex-wrap items-center gap-3">
      <Link href="/iletisim?konu=sifre-sifirlama" className="font-bold underline hover:text-[#225aba]">
        Genel Sekreterliğe Talep İlet →
      </Link>
      <span className="text-[#434652]">info@ahid.org.tr</span>
    </div>
  </div>
)}
<div className="relative flex items-center rounded-lg bg-surface-container-lowest shadow-sm">
<span className="material-symbols-outlined absolute left-3 text-slate-muted pointer-events-none text-[20px]">lock</span>
<input autoComplete="current-password" className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-transparent font-body-sm text-body-sm text-on-surface placeholder:text-slate-muted/70 focus:outline-none focus:bg-surface-ice/40 transition-colors" id="password-input" placeholder="••••••••••••" required type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}/>
<button className="absolute right-3 text-slate-muted hover:text-on-surface focus:outline-none flex items-center" onClick={() => setShowPassword(!showPassword)} type="button">
<span className="material-symbols-outlined text-[20px]" id="pass-icon">visibility</span>
</button>
</div>
</div>
{/*  Visual Verification Code  */}
<div className="flex flex-col space-y-1.5">
<div className="flex items-center justify-between">
<label className="font-label-md text-label-md text-slate-dark" htmlFor="captcha-input">Güvenlik Doğrulaması</label>
<span className="font-caption-caps text-caption-caps text-slate-muted">4 Haneli Güvenlik Kodu</span>
</div>
<div className="grid grid-cols-12 gap-2">
<div className="col-span-7 relative flex items-center rounded-lg bg-surface-container-lowest shadow-sm">
<span className="material-symbols-outlined absolute left-3 text-slate-muted pointer-events-none text-[20px]">verified_user</span>
<input className="w-full pl-10 pr-2 py-2 rounded-lg bg-transparent font-body-sm text-body-sm text-on-surface placeholder:text-slate-muted/70 uppercase tracking-widest font-mono focus:outline-none focus:bg-surface-ice/40 transition-colors" id="captcha-input" maxLength={6} placeholder={`Kod: ${captchaCode}`} required type="text" value={captchaInput} onChange={(e) => setCaptchaInput(e.target.value)}/>
</div>
<div className="col-span-5 flex items-center justify-between px-3 py-1.5 rounded-lg bg-surface-container-high shadow-inner">
<span className="font-mono text-[16px] tracking-widest font-extrabold text-primary select-none line-through decoration-tertiary-container decoration-2" id="captcha-display">{captchaCode}</span>
<button className="p-1 rounded text-slate-dark hover:text-primary hover:bg-surface-variant transition-colors flex items-center" onClick={refreshCaptcha} title="Yeni Güvenlik Kodu Üret" type="button">
<span className="material-symbols-outlined text-[18px]">refresh</span>
</button>
</div>
</div>
</div>
{/*  Device Remember Option  */}
<div className="flex items-center justify-between pt-1">
<label className="flex items-center gap-2 cursor-pointer select-none">
<input checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 rounded text-primary focus:ring-0 bg-surface-container-lowest cursor-pointer accent-primary" id="remember-me" type="checkbox"/>
<span className="font-label-sm text-label-sm text-slate-dark">Beni bu yetkili cihazda 30 gün hatırla</span>
</label>
<span className="font-caption-caps text-caption-caps text-gold-deep bg-gold-light/40 px-2 py-0.5 rounded flex items-center gap-1">
<span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
        Yetkili Erişim
      </span>
</div>
{/*  Primary Authentication Button  */}
<button
    className="w-full py-3 px-4 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-bold transition-all shadow-md hover:shadow-lg active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
    id="submit-btn"
    disabled={loading}
    type="submit"
  >
    {loading ? (
      <>
        <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
        <span>{authMessage}</span>
      </>
    ) : (
      <>
        <span className="material-symbols-outlined text-[20px]">vpn_key</span>
        <span>{tab === "admin" ? "Yönetici Girişi Yap" : "Üye Portalı Girişi Yap"}</span>
      </>
    )}
  </button>
</form>
{/*  Or Gate Divider  */}
<div className="relative my-5 flex items-center justify-center">
<div className="w-full h-[1px] bg-outline-variant"></div>
<span className="absolute px-3 font-caption-caps text-caption-caps text-slate-muted uppercase bg-surface-container-lowest">HIZLI PORTAL ERİŞİMİ</span>
</div>
{/* New Membership Link */}
<Link
  href="/uyelik"
  className="w-full flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container hover:shadow-md transition-all text-left"
>
<div className="flex items-center gap-3">
<div className="w-9 h-9 rounded-lg bg-[#986416] flex items-center justify-center text-white shadow-sm">
<span className="material-symbols-outlined text-[20px]">person_add</span>
</div>
<div>
<p className="font-label-md text-label-md font-bold text-on-surface">Henüz AHİD Üyesi Değil Misiniz?</p>
<p className="font-caption-caps text-caption-caps text-slate-muted">Kurumsal, Bireysel veya Akademik Üyelik Başvurusu Yapın</p>
</div>
</div>
<span className="material-symbols-outlined text-slate-muted text-[20px]">arrow_forward</span>
</Link>
{/* Direct Member Portal Lookup Link */}
<Link
  href="/uye-paneli"
  className="mt-3 w-full flex items-center justify-between p-2.5 rounded-lg bg-[#ebf2fc] hover:bg-[#dee8ff] text-[#002869] transition-all text-left"
>
  <div className="flex items-center gap-3">
    <div className="w-9 h-9 rounded-lg bg-[#002869] flex items-center justify-center text-white shadow-sm">
      <span className="material-symbols-outlined text-[20px]">badge</span>
    </div>
    <div>
      <p className="font-label-md text-label-md font-bold text-[#002869]">Üye Paneli &amp; Sicil / Başvuru Sorgula</p>
      <p className="font-caption-caps text-caption-caps text-[#434652]">Sicil No, Başvuru No veya E-Posta ile hızlı erişim</p>
    </div>
  </div>
  <span className="material-symbols-outlined text-[#002869] text-[20px]">open_in_new</span>
</Link>
{/*  Support Info  */}
<div className="mt-6 bg-surface-canvas rounded-lg p-3.5">
<div className="flex items-center justify-between font-caption-caps text-[11px] text-slate-muted">
<span className="flex items-center gap-1 text-slate-dark font-semibold">
<span className="material-symbols-outlined text-[14px] text-primary">support_agent</span>
        İletişim &amp; Destek: +90 (312) 231 90 90
      </span>
<span className="text-tertiary-container font-bold">AHİD Genel Sekreterlik</span>
</div>
</div>
</div>
</main>

      {/* Footer legal note */}
      <div className="max-w-lg mx-auto w-full text-center mt-6 text-xs text-[#64748b]">
        © 1990 — 2026 Ankara Halkla İlişkiler Derneği (AHİD) • Tüm hakları saklıdır.
      </div>
    </div>
  );
}
