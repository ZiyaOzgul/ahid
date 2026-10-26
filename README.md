# AHİD — Ankara Halkla İlişkiler Derneği Resmi Web Platformu

1990 yılında başkentte kurulan Ankara Halkla İlişkiler Derneği (AHİD) kurumsal web platformu ve yönetim bilgi sistemi.

## 🚀 Teknolojik Altyapı

- **Framework:** [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- **Kütüphane:** [React 19](https://react.dev)
- **Stil & Tasarım:** [Tailwind CSS v4](https://tailwindcss.com) + Material Symbols Outlined
- **Veritabanı & Depolama:** [Supabase](https://supabase.com) (PostgreSQL, Storage, RLS)
- **Kimlik & Güvenlik:** DERBİS entegrasyon protokolü, 256-bit SSL mimarisi

## 📂 Sayfa & Modül Yapısı

- **`/`** — Ana Sayfa (Canlı sayaçlar, hero, gündem vitrini, stratejik paydaşlar)
- **`/kurumsal`** — Tarihçe, misyon, vizyon, tüzük ve organizasyon
- **`/baskanlar-ve-kurullar`** — 1990'dan bugüne genel başkanlar, danışma, denetim, onur kurulları ve genç konsey
- **`/haberler`** & **`/haberler/[slug]`** — Haberler, basın bültenleri ve genel kurul duyuruları
- **`/etkinlikler`** & **`/etkinlikler/[id]`** — Etkinlik takvimi, zirve ve başvuru kayıt formu
- **`/yayinlar`** & **`/yayinlar/[slug]`** — Usta'ya Saygı dizisi, hakemli raporlar ve makaleler
- **`/kaynaklar`** — Tüzük, etik yönetmelikler, resmi belgeler ve barkodlu canlı belge doğrulama servisi
- **`/uye-paneli`** — Dijital üye kimlik kartı, aidat sicili, e-makbuz ve başvuru takip
- **`/uyelik`** — Akreditasyon ve online üyelik başvuru masası
- **`/iletisim`** — Genel merkez iletişim, randevu ve protokol mesaj masası
- **`/admin`** & **`/admin/medya`** — Yönetim portalı, dinamik CMS değişkenleri ve Supabase medya kütüphanesi yöneticisi
- **`/login`** — Çift kanallı güvenli giriş kapısı (Yönetici & Üye Portalı)

## 🛠️ Kurulum & Çalıştırma

1. **Bağımlılıkları Yükleyin:**
   ```bash
   npm install
   ```

2. **Ortam Değişkenlerini Tanımlayın:**
   `.env.example` dosyasını `.env.local` olarak kopyalayın ve Supabase bağlantı bilgilerinizi girin:
   ```bash
   cp .env.example .env.local
   ```

3. **Geliştirme Sunucusunu Başlatın:**
   ```bash
   npm run dev
   ```
   Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresine gidin.

4. **Üretim Derlemesi:**
   ```bash
   npm run build
   npm run start
   ```

## ⚖️ Lisans & Telif
© 1990 — 2026 Ankara Halkla İlişkiler Derneği (AHİD). Tüm hakları saklıdır.
