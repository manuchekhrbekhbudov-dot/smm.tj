// Browser-only replacement for ./contact.ts used in the GitHub Pages (static) build,
// where server actions don't exist. Validates, then opens WhatsApp with the message prefilled.
import { contacts } from "@/content/site";

export type LeadState = { status: "idle" | "success" | "error"; errors?: Partial<Record<"name" | "phone" | "message", string>> };

const PHONE_RE = /^\+?992\d{9}$/;

export async function normalizePhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 9) return `+992${digits}`;
  if (digits.length === 12 && digits.startsWith("992")) return `+${digits}`;
  return raw.trim();
}

export async function submitLead(_prev: LeadState, form: FormData): Promise<LeadState> {
  const name = String(form.get("name") ?? "").trim();
  const phone = await normalizePhone(String(form.get("phone") ?? ""));
  const message = String(form.get("message") ?? "").trim();
  const business = String(form.get("business") ?? "").trim();
  const service = String(form.get("service") ?? "").trim();
  if (String(form.get("website") ?? "")) return { status: "success" };

  const errors: LeadState["errors"] = {};
  if (name.length < 2 || name.length > 100) errors.name = "name";
  if (!PHONE_RE.test(phone)) errors.phone = "phone";
  if (message.length > 0 && message.length < 5) errors.message = "message";
  if (Object.keys(errors).length) return { status: "error", errors };

  const text = [name, phone, business, service, message].filter(Boolean).join("\n");
  window.open(`${contacts.whatsapp}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  return { status: "success" };
}
