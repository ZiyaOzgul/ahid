export const SITE_BASE_URL =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_SITE_URL) ||
  "https://www.ahid.org.tr";

export const EVENT_DEFAULT_CAPACITY = 150;

export interface BoardCategoryDef {
  id: string;
  label: string;
  description: string;
}

export const BOARD_CATEGORIES: BoardCategoryDef[] = [
  {
    id: "donem_baskani",
    label: "Dönem Başkanı",
    description: "Dernek Yönetim Kurulu Dönem Başkanı",
  },
  {
    id: "yonetim_kurulu",
    label: "Yönetim Kurulu",
    description: "Asıl ve yürütme kurulu üyeleri",
  },
  {
    id: "yuksek_danisma",
    label: "Yüksek İstişare ve Danışma Kurulu",
    description: "Duayen danışma ve strateji kurulu",
  },
  {
    id: "denetim_kurulu",
    label: "Denetim Kurulu",
    description: "İç denetim ve etik gözetim kurulu",
  },
  {
    id: "gecmis_baskan",
    label: "Önceki Dönem Başkanı",
    description: "Kurucu ve geçmiş dönem başkanları",
  },
];

export const BOARD_CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  BOARD_CATEGORIES.map((c) => [c.id, c.label])
);

export function normalizeBoardCategory(cat?: string | null): string {
  const val = (cat || "").trim().toLowerCase();
  if (val === "danisma_kurulu" || val === "danisma" || val === "yuksek_istisare") {
    return "yuksek_danisma";
  }
  if (val === "onceki_baskan" || val === "gecmis_baskanlar") {
    return "gecmis_baskan";
  }
  if (val in BOARD_CATEGORY_LABELS) {
    return val;
  }
  return "yonetim_kurulu";
}

export const DOCUMENT_CATEGORIES: { id: string; label: string }[] = [
  { id: "tuzuk", label: "Dernek Tüzüğü" },
  { id: "mevzuat", label: "Mevzuat & Tebliğ" },
  { id: "etik", label: "Etik İlkeler" },
  { id: "rapor", label: "Sektör Raporu" },
  { id: "faaliyet_raporu", label: "Faaliyet Raporu" },
  { id: "form", label: "Başvuru ve Formlar" },
  { id: "genel", label: "Genel Yayın" },
];

export const ARTICLE_CATEGORIES: string[] = [
  "Gündem",
  "Sektörel",
  "Akademik",
  "Basın",
  "Hukuk",
  "Strateji",
  "Görüş",
];

export const EVENT_CATEGORIES: string[] = [
  "Zirve",
  "Eğitim",
  "Genel Kurul",
  "Söyleşi",
  "Ziyaret",
  "Çalıştay",
  "Panel",
  "Konferans",
  "Seminer",
];

export const NEWS_CATEGORIES: string[] = [
  "Bülten",
  "Duyuru",
  "Mevzuat",
  "Etkinlik",
  "Basın Açıklaması",
  "Rapor",
];

export const ROLE_LABELS: Record<string, string> = {
  admin: "Süper Yönetici",
  editor: "Editör / Kurul Yetkilisi",
  member: "Dernek Üyesi",
};

export interface MembershipTierDef {
  id: "asli" | "onursal" | "genc";
  title: string;
  subtitle: string;
  fee: string;
  annualAmount: number;
  benefits: string[];
}

export const MEMBERSHIP_TIERS: MembershipTierDef[] = [
  {
    id: "asli",
    title: "Asıl Üye",
    subtitle: "Kamu ve özel sektör halkla ilişkiler profesyonelleri",
    fee: "₺2.400 / Yıl",
    annualAmount: 2400,
    benefits: [
      "Genel Kurul'da oy kullanma ve kurullara aday olma hakkı",
      "Üye paneline, dijital kimlik kartına ve çalışma komisyonlarına erişim",
      "Üye özel duyuru, bülten ve zirve kayıtlarında öncelik",
    ],
  },
  {
    id: "onursal",
    title: "Kurumsal / Onursal Üye",
    subtitle: "İletişim ajansları, meslek duayenleri ve kurum temsilcileri",
    fee: "₺8.500 / Yıl",
    annualAmount: 8500,
    benefits: [
      "Çalıştay, protokol ve sektör yuvarlak masa toplantılarına katılım",
      "Asıl üyelere sağlanan tüm dijital portal ve etkinlik hakları",
      "Kurumsal etik ilkeler çalışma gruplarında danışma temsiliyeti",
    ],
  },
  {
    id: "genc",
    title: "Genç Profesyonel / Aday",
    subtitle: "İletişim fakültesi son sınıf öğrencileri ve yeni mezunlar",
    fee: "₺600 / Yıl",
    annualAmount: 600,
    benefits: [
      "Akademi eğitim programları ve mentorluk söyleşilerine erişim",
      "Dernek etkinlik ve atölyelerinde öncelikli katılımcı kontenjanı",
      "Üye özel bilgi bankası ve yayın arşivine erişim",
    ],
  },
];

export function slugifyTurkish(input: string): string {
  return input
    .replace(/Ğ/g, "g")
    .replace(/ğ/g, "g")
    .replace(/Ü/g, "u")
    .replace(/ü/g, "u")
    .replace(/Ş/g, "s")
    .replace(/ş/g, "s")
    .replace(/İ/g, "i")
    .replace(/I/g, "i")
    .replace(/ı/g, "i")
    .replace(/Ö/g, "o")
    .replace(/ö/g, "o")
    .replace(/Ç/g, "c")
    .replace(/ç/g, "c")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function escapeLikePattern(input: string): string {
  return input.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

export function sanitizeHref(url?: string | null, fallback = "#"): string {
  if (!url) return fallback;
  const trimmed = url.trim();
  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:")
  ) {
    return trimmed;
  }
  return fallback;
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function parsePositiveId(val: unknown): number | null {
  if (typeof val === "number") {
    return Number.isInteger(val) && val > 0 ? val : null;
  }
  if (typeof val === "string" && val.trim()) {
    const parsed = Number(val.trim());
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }
  return null;
}

export function parseStringArray(
  val: string | string[] | null
): string[] | null {
  if (val === null) return null;
  if (Array.isArray(val)) {
    const cleaned = val
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
    return cleaned.length > 0 ? cleaned : null;
  }
  const cleaned = val
    .split(/\r?\n|,/)
    .map((s) => s.trim())
    .filter(Boolean);
  return cleaned.length > 0 ? cleaned : null;
}

export interface ApplicationMeta {
  committees: string[];
  references: string[];
  approved_user_id?: number | null;
  approved_member_no?: string | null;
  reviewed_at?: string | null;
}

const META_PREFIX = "<!--AHID_META:";
const META_SUFFIX = "-->";

export function parseApplicationMeta(adminNotes?: string | null): {
  meta: ApplicationMeta;
  note: string;
} {
  const defaultMeta: ApplicationMeta = { committees: [], references: [] };
  if (!adminNotes) {
    return { meta: defaultMeta, note: "" };
  }
  const trimmed = adminNotes.trim();
  if (!trimmed.startsWith(META_PREFIX)) {
    return { meta: defaultMeta, note: adminNotes };
  }
  const endIdx = trimmed.indexOf(META_SUFFIX);
  if (endIdx === -1) {
    return { meta: defaultMeta, note: adminNotes };
  }
  const jsonPart = trimmed.slice(META_PREFIX.length, endIdx);
  const visibleNote = trimmed.slice(endIdx + META_SUFFIX.length).trim();
  try {
    const parsed = JSON.parse(jsonPart) as Partial<ApplicationMeta>;
    return {
      meta: {
        committees: Array.isArray(parsed.committees)
          ? parsed.committees.filter((v): v is string => typeof v === "string")
          : [],
        references: Array.isArray(parsed.references)
          ? parsed.references.filter((v): v is string => typeof v === "string")
          : [],
        approved_user_id: parsed.approved_user_id ?? null,
        approved_member_no: parsed.approved_member_no ?? null,
        reviewed_at: parsed.reviewed_at ?? null,
      },
      note: visibleNote,
    };
  } catch {
    return { meta: defaultMeta, note: adminNotes };
  }
}

export function serializeApplicationMeta(
  meta: ApplicationMeta,
  visibleNote?: string | null
): string {
  const cleanNote = (visibleNote || "").trim();
  const payload = JSON.stringify({
    committees: meta.committees || [],
    references: meta.references || [],
    approved_user_id: meta.approved_user_id ?? undefined,
    approved_member_no: meta.approved_member_no ?? undefined,
    reviewed_at: meta.reviewed_at ?? undefined,
  });
  return cleanNote
    ? `${META_PREFIX}${payload}${META_SUFFIX}\n${cleanNote}`
    : `${META_PREFIX}${payload}${META_SUFFIX}`;
}
