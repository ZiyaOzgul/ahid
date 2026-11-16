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
  // Seed default CMS Variables only (no placeholder people or institutions)
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
    "AHİD Genel Merkez / Ankara",
    "Zirve lokasyonu"
  );

  insertVar.run(
    "home",
    "summit_card",
    "summit_countdown_seconds",
    "2133738",
    "Geri sayım saniyesi (24 gün 16 saat)"
  );
}
