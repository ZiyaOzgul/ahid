"use client";

import Link from "next/link";
import { useState } from "react";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      try {
        await fetch("/api/newsletter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
        });
      } catch (err) {
        console.error("Newsletter error:", err);
      }
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <footer className="w-full bg-[#f4f7ff] text-[#101c2e] mt-24 border-t border-[#d7e3fc]">
      {/* Newsletter Bar */}
      <div
        id="newsletter"
        className="bg-gradient-to-r from-[#e7eeff] via-[#f0f5ff] to-[#e7eeff] border-b border-[#d7e3fc] py-10"
      >
        <div className="max-w-[1680px] mx-auto px-4 sm:px-8 lg:px-12 2xl:px-16 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#c25e00] mb-1">
              <span className="w-2 h-2 rounded-full bg-[#c25e00]" />
              <span>Kurumsal İletişim &amp; Akademi Bülteni</span>
            </div>
            <h4 className="font-['Plus_Jakarta_Sans'] text-xl font-extrabold text-[#002869] mb-1">
              İletişim Bültenimize Abone Olun
            </h4>
            <p className="text-sm text-[#475569]">
              Halkla ilişkiler sektöründeki akademik araştırmalar, Ankara etkinlikleri ve mevzuat analizleri e-postanızda.
            </p>
          </div>

          {subscribed ? (
            <div className="bg-white border border-[#bae6fd] text-[#002869] font-semibold px-6 py-3 rounded-xl text-sm flex items-center gap-2 shadow-xs">
              <span className="material-symbols-outlined text-green-600">check_circle</span>
              <span>Bültenimize başarıyla kaydoldunuz. Teşekkür ederiz!</span>
            </div>
          ) : (
            <form
              onSubmit={handleSubscribe}
              className="flex w-full md:w-auto max-w-md items-center gap-2.5"
            >
              <input
                className="w-full md:w-80 px-4 py-2.5 rounded-xl bg-white border border-[#c4c6d3] text-[#101c2e] text-sm outline-none placeholder:text-[#747783] focus:ring-2 focus:ring-[#002869] focus:border-[#002869] shadow-2xs transition-all"
                placeholder="E-posta adresinizi girin..."
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button
                className="bg-[#002869] hover:bg-[#0b3d91] text-white font-semibold px-5 py-2.5 rounded-xl shadow-xs hover:shadow-md active:scale-95 transition-all duration-200 whitespace-nowrap cursor-pointer"
                type="submit"
              >
                Kayıt Ol
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-[1680px] mx-auto px-4 sm:px-8 lg:px-12 2xl:px-16 py-16 lg:py-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
        {/* Col 1 */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center">
            <Link href="/" className="inline-block">
              <img
                alt="AHİD - Ankara Halkla İlişkiler Derneği"
                className="h-12 w-auto object-contain"
                src="/ahid-logo.png"
              />
            </Link>
          </div>
          <p className="text-sm text-[#475569] leading-relaxed">
            1990 yılında başkentte kurulan Ankara Halkla İlişkiler Derneği; kurumsal iletişim liderlerini, akademisyenleri ve geleceğin iletişimcilerini ortak bir kurumsal çatıda bir araya getirir.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-[#e7eeff] text-[#002869] border border-[#d7e3fc]">
              <span className="material-symbols-outlined text-sm text-[#225aba]">verified</span>
              T.C. İçişleri Bakanlığı Akredite
            </span>
          </div>
        </div>

        {/* Col 2 */}
        <div className="flex flex-col gap-4">
          <h5 className="text-sm text-[#002869] uppercase tracking-wider font-extrabold flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-full bg-[#c25e00]" />
            Kurumsal Yönetişim
          </h5>
          <ul className="flex flex-col gap-2.5 text-sm text-[#475569] font-medium">
            <li>
              <Link className="hover:text-[#002869] transition-colors" href="/kurumsal">
                Tarihçe &amp; Hakkımızda
              </Link>
            </li>
            <li>
              <Link className="hover:text-[#002869] transition-colors" href="/baskanlar-ve-kurullar">
                1990&apos;dan Bugüne Başkanlar &amp; Kurullar
              </Link>
            </li>
            <li>
              <Link className="hover:text-[#002869] transition-colors" href="/kaynaklar">
                Tüzük, Mevzuat &amp; Resmi Belgeler
              </Link>
            </li>
            <li>
              <Link className="hover:text-[#002869] transition-colors" href="/uye-paneli">
                Dijital Üye Paneli &amp; Aidat Masası
              </Link>
            </li>
            <li>
              <Link className="hover:text-[#002869] transition-colors" href="/uyelik">
                Üyelik &amp; Akreditasyon Başvurusu
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 3 */}
        <div className="flex flex-col gap-4">
          <h5 className="text-sm text-[#002869] uppercase tracking-wider font-extrabold flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-full bg-[#225aba]" />
            Haberler, Yayınlar &amp; Etkinlikler
          </h5>
          <ul className="flex flex-col gap-2.5 text-sm text-[#475569] font-medium">
            <li>
              <Link className="hover:text-[#002869] transition-colors" href="/haberler">
                Haberler, Basın Bültenleri &amp; Duyurular
              </Link>
            </li>
            <li>
              <Link className="hover:text-[#002869] transition-colors" href="/yayinlar">
                Usta&apos;ya Saygı &amp; Fikir Odası
              </Link>
            </li>
            <li>
              <Link className="hover:text-[#002869] transition-colors" href="/etkinlikler">
                Altın Pusula &amp; İletişim Zirvesi
              </Link>
            </li>
            <li>
              <Link className="hover:text-[#002869] transition-colors" href="/kaynaklar">
                Sektörel Raporlar &amp; Belge Doğrulama
              </Link>
            </li>
            <li>
              <Link className="hover:text-[#002869] transition-colors" href="/admin/medya">
                Medya &amp; Fotoğraf Galerisi Arşivi
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 4 */}
        <div className="flex flex-col gap-4">
          <h5 className="text-sm text-[#002869] uppercase tracking-wider font-extrabold flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-full bg-[#002869]" />
            Genel Merkez İletişim
          </h5>
          <div className="flex flex-col gap-3 text-sm text-[#475569]">
            <div className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[#225aba] text-lg mt-0.5">apartment</span>
              <span>Anıttepe Mah. Kültür Sok. No: 5/4 Tandoğan, Çankaya / Ankara</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[#225aba] text-lg">call</span>
              <a href="tel:+903122319090" className="hover:text-[#002869] font-medium transition-colors">
                +90 (312) 231 90 90
              </a>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[#225aba] text-lg">mail</span>
              <a className="hover:text-[#002869] font-medium transition-colors" href="mailto:iletisim@ahid.org.tr">
                iletisim@ahid.org.tr
              </a>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[#225aba] text-lg">schedule</span>
              <span>Hafta İçi: 09:00 - 18:00</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-[#e7eeff]/70 py-5 border-t border-[#d7e3fc]">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-8 lg:px-12 2xl:px-16 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#475569] font-medium">
          <div>© 1990 — 2026 Ankara Halkla İlişkiler Derneği (AHİD). Tüm hakları saklıdır.</div>
          <div className="flex flex-wrap items-center gap-5">
            <Link className="hover:text-[#002869] transition-colors" href="/kurumsal#kvkk">
              KVKK Aydınlatma
            </Link>
            <Link className="hover:text-[#002869] transition-colors" href="/kurumsal#gizlilik">
              Gizlilik Politikası
            </Link>
            <Link className="hover:text-[#002869] transition-colors" href="/kurumsal#cerez">
              Çerez Politikası
            </Link>
            <Link className="hover:text-[#002869] transition-colors" href="/kurumsal#bilgi">
              Bilgi Toplumu Hizmetleri
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
