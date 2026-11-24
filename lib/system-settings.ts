import { supabaseServer } from "@/lib/supabase-server";

export interface SystemSettings {
  membership_open: boolean;
  maintenance_mode: boolean;
  strict_session_timeout: boolean;
  require_captcha: boolean;
  public_verification_enabled: boolean;
  contact_notify_email: string;
  contact_address: string;
  contact_phone: string;
  contact_hours: string;
}

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  membership_open: true,
  maintenance_mode: false,
  strict_session_timeout: false,
  require_captcha: true,
  public_verification_enabled: true,
  contact_notify_email: "iletisim@ahid.org.tr",
  contact_address: "Turan Güneş Bulvarı No: 42/8, Çankaya / Ankara",
  contact_phone: "+90 (312) 442 06 00",
  contact_hours: "Hafta içi 09:00 – 18:00",
};

let cachedSettings: { data: SystemSettings; expiresAt: number } | null = null;

function parseBooleanValue(val: string | undefined, fallback: boolean): boolean {
  if (val === undefined) return fallback;
  const lowered = val.trim().toLowerCase();
  if (lowered === "true" || lowered === "1" || lowered === "yes") return true;
  if (lowered === "false" || lowered === "0" || lowered === "no") return false;
  return fallback;
}

export function invalidateSystemSettingsCache() {
  cachedSettings = null;
}

export async function getSystemSettings(): Promise<SystemSettings> {
  const now = Date.now();
  if (cachedSettings && cachedSettings.expiresAt > now) {
    return cachedSettings.data;
  }

  try {
    const { data, error } = await supabaseServer
      .from("cms_variables")
      .select("section, key, value")
      .eq("page", "system");

    if (error || !data) {
      return DEFAULT_SYSTEM_SETTINGS;
    }

    const map = new Map<string, string>();
    for (const row of data) {
      map.set(`${row.section}:${row.key}`, row.value);
      map.set(row.key, row.value);
    }

    const resolved: SystemSettings = {
      membership_open: parseBooleanValue(
        map.get("policies:membership_open") ?? map.get("membership_open"),
        DEFAULT_SYSTEM_SETTINGS.membership_open
      ),
      maintenance_mode: parseBooleanValue(
        map.get("policies:maintenance_mode") ?? map.get("maintenance_mode"),
        DEFAULT_SYSTEM_SETTINGS.maintenance_mode
      ),
      strict_session_timeout: parseBooleanValue(
        map.get("policies:strict_session_timeout") ??
          map.get("strict_session_timeout"),
        DEFAULT_SYSTEM_SETTINGS.strict_session_timeout
      ),
      require_captcha: parseBooleanValue(
        map.get("policies:require_captcha") ?? map.get("require_captcha"),
        DEFAULT_SYSTEM_SETTINGS.require_captcha
      ),
      public_verification_enabled: parseBooleanValue(
        map.get("policies:public_verification_enabled") ??
          map.get("public_verification_enabled"),
        DEFAULT_SYSTEM_SETTINGS.public_verification_enabled
      ),
      contact_notify_email:
        map.get("contact:notify_email") ??
        map.get("notify_email") ??
        DEFAULT_SYSTEM_SETTINGS.contact_notify_email,
      contact_address:
        map.get("contact:address") ??
        map.get("address") ??
        DEFAULT_SYSTEM_SETTINGS.contact_address,
      contact_phone:
        map.get("contact:phone") ??
        map.get("phone") ??
        DEFAULT_SYSTEM_SETTINGS.contact_phone,
      contact_hours:
        map.get("contact:hours") ??
        map.get("hours") ??
        DEFAULT_SYSTEM_SETTINGS.contact_hours,
    };

    cachedSettings = { data: resolved, expiresAt: now + 5_000 };
    return resolved;
  } catch {
    return DEFAULT_SYSTEM_SETTINGS;
  }
}
