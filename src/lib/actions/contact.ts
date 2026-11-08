"use server";

export type LeadState = { status: "idle" | "success" | "error"; errors?: Partial<Record<"name" | "phone" | "message", string>> };

const PHONE_RE = /^\+?992\d{9}$/;

/** Normalises "+992 90 123 45 67", "90 123 45 67" etc. to +992XXXXXXXXX. */
export async function normalizePhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 9) return `+992${digits}`;
  if (digits.length === 12 && digits.startsWith("992")) return `+${digits}`;
  return raw.trim();
}

/**
 * Contact / lead form. Validates on the server; the lead is stored in Supabase
 * once the backend step is connected (see lib/supabase). Until then it is logged.
 */
export async function submitLead(_prev: LeadState, form: FormData): Promise<LeadState> {
  const name = String(form.get("name") ?? "").trim();
  const phone = await normalizePhone(String(form.get("phone") ?? ""));
  const message = String(form.get("message") ?? "").trim();
  const business = String(form.get("business") ?? "").trim().slice(0, 200);
  const service = String(form.get("service") ?? "").trim().slice(0, 50);
  // Honeypot: bots fill hidden fields
  if (String(form.get("website") ?? "")) return { status: "success" };

  const errors: LeadState["errors"] = {};
  if (name.length < 2 || name.length > 100) errors.name = "name";
  if (!PHONE_RE.test(phone)) errors.phone = "phone";
  if (message.length > 0 && message.length < 5) errors.message = "message";
  if (Object.keys(errors).length) return { status: "error", errors };

  try {
    // TODO(supabase step): insert into `leads` table.
    console.info("[lead]", { name, phone, business, service, message: message.slice(0, 2000) });
    return { status: "success" };
  } catch {
    return { status: "error" };
  }
}
