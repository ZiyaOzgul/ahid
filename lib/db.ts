import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (dbInstance) return dbInstance;

  const dataDir = path.join(process.cwd(), ".data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, "ahid.db");
  const isNew = !fs.existsSync(dbPath);

  const db = new DatabaseSync(dbPath);
  dbInstance = db;

  // Run schema setup if new or initialize tables
  initSchema(db);

  if (isNew || shouldSeed(db)) {
    seedInitialData(db);
  }

  return db;
}

function initSchema(db: DatabaseSync) {
  const schemaPath = path.join(process.cwd(), "lib", "schema.sql");
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, "utf8");
    db.exec(schemaSql);
  }
}

function shouldSeed(db: DatabaseSync): boolean {
  try {
    const count = db.prepare("SELECT count(*) as count FROM users").get() as { count: number };
    return !count || count.count === 0;
  } catch {
    return true;
  }
}

function seedInitialData(db: DatabaseSync) {
  // 1. Seed Users
  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (email, tc_no, password_hash, full_name, role, title, member_no, phone, avatar_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(
    "admin@ahid.org.tr",
    "12345678901",
    "ahid2026",
    "Ahmet Yılmaz",
    "admin",
    "Genel Sekreter",
    "AH-0001",
    "+90 (312) 231 90 90",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBDDkfzhg43AW2pgoCmO6b4plZ0FAH4dRT9DvoGhLowRiyITw1JwHRhidMYDuamXacDmzRzRs6UKB0rbXb3rbnuZD1PyozjtAiMyPsjoKk78f-vBAdXRsqXOQjkAbptPC_w7aul58Il2EitMfLCIrmQIZq8KiJyuMOMWHQyd_2Gr_283JWqHMq8KAiweyPf04R4P_QKNCvEBzMIFI6nn1afOT8PI-mHs1db3wbFQw0U7EG-Vf-HYYei"
  );

  insertUser.run(
    "uye@ahid.org.tr",
    "98765432109",
    "ahid2026",
    "Selin Doğanay",
    "member",
    "Kıdemli Medya Uzmanı",
    "AH-1042",
    "+90 (532) 111 22 33",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBDDkfzhg43AW2pgoCmO6b4plZ0FAH4dRT9DvoGhLowRiyITw1JwHRhidMYDuamXacDmzRzRs6UKB0rbXb3rbnuZD1PyozjtAiMyPsjoKk78f-vBAdXRsqXOQjkAbptPC_w7aul58Il2EitMfLCIrmQIZq8KiJyuMOMWHQyd_2Gr_283JWqHMq8KAiweyPf04R4P_QKNCvEBzMIFI6nn1afOT8PI-mHs1db3wbFQw0U7EG-Vf-HYYei"
  );

  // 2. Seed CMS Variables
  const insertVar = db.prepare(`
    INSERT OR REPLACE INTO cms_variables (page, section, key, value, description)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertVar.run(
    "home",
    "hero",
    "home_hero_title",
    "İletişim Mesleğinin Geleceğini Birlikte Kuruyoruz",
    "Ana sayfa hero manşet başlığı"
  );

  insertVar.run(
    "home",
    "hero",
    "home_hero_subtitle",
    "1990 yılından bu yana başkent Ankara'da halkla ilişkiler, stratejik kurumsal iletişim ve medya profesyonellerini tek çatı altında buluşturan en köklü meslek örgütüyüz.",
    "Ana sayfa hero spot açıklaması"
  );

  insertVar.run(
    "home",
    "hero",
    "home_hero_primary_cta",
    "Akreditasyon & Üyelik Başvurusu",
    "Ana sayfa birincil CTA butonu"
  );

  insertVar.run(
    "home",
    "hero",
    "home_hero_secondary_cta",
    "2026 Zirvesi Programı",
    "Ana sayfa ikincil buton"
  );

  insertVar.run(
    "home",
    "summit_card",
    "summit_title",
    "AHİD Başkent İletişim Zirvesi 2026",
    "Zirve kartı başlığı"
  );

  insertVar.run(
    "home",
    "summit_card",
    "summit_date",
    "18 Kasım 2026",
    "Zirve tarihi"
  );

  insertVar.run(
    "home",
    "summit_card",
    "summit_location",
    "ATO Congresium / Ankara",
    "Zirve lokasyonu"
  );

  insertVar.run(
    "home",
    "summit_card",
    "summit_countdown_seconds",
    "2133738",
    "Geri sayım saniyesi (24 gün 16 saat)"
  );

  // 3. Seed Board Members
  const insertBoard = db.prepare(`
    INSERT OR IGNORE INTO board_members (order_no, full_name, title, organization, bio, category, is_active)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `);

  insertBoard.run(
    1,
    "Dr. Şeref Kılıç",
    "Yönetim Kurulu Başkanı",
    "Ankara Üniversitesi İletişim Fakültesi / Stratejik İletişim",
    "30 yılı aşkın kamu ve akademi deneyimiyle AHİD Yönetim Kurulu Başkanlığını yürütmektedir.",
    "yonetim"
  );

  insertBoard.run(
    2,
    "Doç. Dr. Neslihan Erdem",
    "Başkan Vekili",
    "Hacettepe Üniversitesi / Halkla İlişkiler Bölüm Bşk.",
    "Kurumsal itibar ve dijital diplomasi alanlarında öncü araştırmaların sahibidir.",
    "yonetim"
  );

  insertBoard.run(
    3,
    "Ahmet Yılmaz",
    "Genel Sekreter",
    "Kamu Diplomasisi Danışmanlığı",
    "Kamu-özel sektör koordinasyonu ve mesleki akreditasyon süreçlerini koordine etmektedir.",
    "yonetim"
  );

  insertBoard.run(
    4,
    "Av. Canan Tekin",
    "Hukuk ve Etik Kurulu Başkanı",
    "Ankara Barosu",
    "Basın mevzuatı, 5651 ve KVKK hukuku uzmanıdır.",
    "yonetim"
  );

  // 4. Seed Membership Applications
  const insertApp = db.prepare(`
    INSERT OR IGNORE INTO membership_applications (
      application_no, tier, first_name, last_name, tc_no, email, phone,
      organization, position, status, admin_notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertApp.run(
    "AHID-2026-0042",
    "asil",
    "Selin",
    "Doğanay",
    "12984719283",
    "selin.doganay@iletisim.gov.tr",
    "+90 (532) 412 88 19",
    "Cumhurbaşkanlığı İletişim Başkanlığı",
    "Kıdemli Medya Uzmanı",
    "derbis_query",
    "İçişleri DERBİS sicil sorgusunda"
  );

  insertApp.run(
    "AHID-2026-0041",
    "akademik",
    "Murat",
    "Kaya",
    "29384719284",
    "murat.kaya@gazi.edu.tr",
    "+90 (533) 891 22 40",
    "Gazi Üniversitesi İletişim Fakültesi",
    "Öğretim Görevlisi Dr.",
    "approved",
    "Yönetim Kurulu onayı tamamlandı"
  );

  insertApp.run(
    "AHID-2026-0040",
    "kurumsal",
    "Aselsan Kurumsal İletişim",
    "Temsilci: Ece Tan",
    "38472918273",
    "ece.tan@aselsan.com.tr",
    "+90 (312) 592 10 00",
    "ASELSAN A.Ş.",
    "Kurumsal İletişim Direktörü",
    "under_review",
    "Sicil masası evrak inceleme aşamasında"
  );

  // 5. Seed Contact Messages
  const insertMsg = db.prepare(`
    INSERT OR IGNORE INTO contact_messages (type, name, email, phone, subject, message, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertMsg.run(
    "protocol_appointment",
    "İletişim Başkanlığı Heyeti",
    "protokol@iletisim.gov.tr",
    "+90 (312) 590 20 00",
    "Resmi İkili Görüşme Randevu Talebi",
    "Genel Sekreterlik makamına 2026 İletişim Zirvesi kamu protokolü kapsamında ziyaret talebimizdir.",
    "in_progress"
  );

  insertMsg.run(
    "quick_message",
    "Cemre Yıldız",
    "cemre.yildiz@medyaajans.com",
    "+90 (555) 777 88 99",
    "Altın Pusula Başvuru Takvimi",
    "2026 Başarı Ödülleri kategori listesi ve başvuru kılavuzu ne zaman ilan edilecektir?",
    "unread"
  );
}
