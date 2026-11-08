/** Structured (non-text) data. Human-readable labels live in messages/*.json. */

/** Director / admin phone (also stored server-side in app_config). */
export const ADMIN_PHONE = "+992504440101";

export const specialtySlugs = ["smm", "reels", "design", "ads", "branding", "production", "copywriting", "consulting"] as const;
export type Specialty = (typeof specialtySlugs)[number];

export const citySlugs = [
  "dushanbe", "khujand", "bokhtar", "kulob", "istaravshan", "tursunzoda", "vahdat", "panjakent",
  "khorog", "isfara", "konibodom", "guliston", "hisor", "norak", "online",
] as const;
export type City = (typeof citySlugs)[number];

export const priceUnits = ["project", "month", "item", "hour"] as const;

/** Normalise "+992 90 123 45 67" / "901234567" → "+992901234567"; returns null if invalid. */
export function normalizeTjPhone(raw: string): string | null {
  const d = raw.replace(/\D/g, "");
  const local = d.length === 12 && d.startsWith("992") ? d.slice(3) : d.length === 9 ? d : null;
  return local ? `+992${local}` : null;
}

export const formatTjs = (n: number) => n.toLocaleString("ru-RU");

/**
 * Phone + password login without SMS: Supabase e-mail/password auth with a synthetic,
 * never-mailed address derived from the phone number. "Confirm email" must be OFF in Supabase.
 */
export const PHONE_EMAIL_DOMAIN = "phone.smm.tj";
export const phoneToEmail = (e164: string) => `${e164.replace(/\D/g, "")}@${PHONE_EMAIL_DOMAIN}`;
/** Best-effort phone for a signed-in user (SMS users have .phone, password users the synthetic e-mail). */
export function userPhone(user: { phone?: string | null; email?: string | null }): string | null {
  if (user.phone) return `+${user.phone.replace(/^\+/, "")}`;
  const m = user.email?.match(/^(\d{12})@phone\.smm\.tj$/);
  return m ? `+${m[1]}` : null;
}
