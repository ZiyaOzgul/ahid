-- =====================================================
-- AHİD (Ankara Halkla İlişkiler Derneği) SQL Schema
-- Compatible with PostgreSQL (Supabase) and SQLite
-- =====================================================

-- 1. Kullanıcılar ve Yöneticiler Tablosu (Users & Roles)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  tc_no TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor', -- 'admin', 'editor', 'member'
  title TEXT,                         -- örn: 'Genel Sekreter', 'Başkan Yardımcısı'
  member_no TEXT UNIQUE,              -- örn: 'AH-1042'
  phone TEXT,
  avatar_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. CMS Sayfa Değişkenleri Tablosu (Dynamic Content Variables)
CREATE TABLE IF NOT EXISTS cms_variables (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page TEXT NOT NULL,                 -- 'home', 'kurumsal', 'etkinlikler', 'yayinlar', 'uyelik', 'iletisim'
  section TEXT NOT NULL,              -- 'hero', 'summit_card', 'board', 'stats'
  key TEXT UNIQUE NOT NULL,           -- 'home_hero_title', 'summit_target_date' vb.
  value TEXT NOT NULL,
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Yönetim ve Denetim Kurulu Tablosu (Board Members)
CREATE TABLE IF NOT EXISTS board_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_no INTEGER DEFAULT 1,
  full_name TEXT NOT NULL,
  title TEXT NOT NULL,
  organization TEXT,
  bio TEXT,
  photo_url TEXT,
  category TEXT NOT NULL DEFAULT 'yonetim', -- 'yonetim', 'denetim', 'gecmis_baskan'
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Üyelik ve Akreditasyon Başvuruları (Membership & Accreditation)
CREATE TABLE IF NOT EXISTS membership_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_no TEXT UNIQUE NOT NULL,      -- örn: 'AHID-2026-0042'
  tier TEXT NOT NULL,                      -- 'asil', 'akademik', 'kurumsal', 'genc'
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  tc_no TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  birth_date TEXT,
  city TEXT,
  organization TEXT,
  position TEXT,
  university TEXT,
  graduation_year TEXT,
  degree TEXT,
  experience_years TEXT,
  linkedin_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',   -- 'pending', 'under_review', 'derbis_query', 'approved', 'rejected'
  admin_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Gelen İletişim, Randevu ve Bilgi Talepleri (Contact & Appointments)
CREATE TABLE IF NOT EXISTS contact_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL DEFAULT 'contact_form', -- 'contact_form', 'quick_message', 'protocol_appointment'
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  department TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread',    -- 'unread', 'read', 'in_progress', 'resolved'
  admin_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. Etkinlikler ve Zirveler (Events & Summits)
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  category TEXT NOT NULL,                   -- 'summit', 'masterclass', 'forum', 'award'
  event_date TEXT NOT NULL,                 -- '2026-11-18'
  event_time TEXT,                          -- '09:30'
  location TEXT,
  summary TEXT,
  description TEXT,
  image_url TEXT,
  is_featured INTEGER DEFAULT 0,
  registration_open INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. Yayınlar, Makaleler ve Usta'ya Saygı Serisi (Publications & Articles)
CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  author_name TEXT NOT NULL,
  author_title TEXT,
  author_avatar TEXT,
  category TEXT NOT NULL,                   -- 'usta_saygi', 'akademik', 'kose_yazisi', 'bulten'
  summary TEXT,
  content TEXT,
  read_time TEXT DEFAULT '5 dk okuma',
  published_at TEXT,
  image_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 8. E-Bülten Aboneleri (Newsletter Subscribers)
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
