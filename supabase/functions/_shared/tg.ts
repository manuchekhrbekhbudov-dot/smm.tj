// Shared helpers for the SMM.TJ Telegram Edge Functions (Deno).
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

export const TOKEN = Deno.env.get("TG_BOT_TOKEN") ?? "";
export const SITE_URL = (Deno.env.get("SITE_URL") ?? "https://manuchekhrbekhbudov-dot.github.io/smm.tj").replace(/\/$/, "");
export const PHONE_EMAIL_DOMAIN = "phone.smm.tj";

export const admin = () =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

export const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

export async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Secret for Telegram's X-Telegram-Bot-Api-Secret-Token header, derived from the bot token. */
export const webhookSecret = async () => (await sha256("smmtj-webhook:" + TOKEN)).slice(0, 48);

export async function tg(method: string, payload: Record<string, unknown>) {
  const r = await fetch(`${Deno.env.get("TG_API_BASE") ?? "https://api.telegram.org"}/bot${TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return r.json();
}

/** Digits only, E.164 without "+". Accepts "+992 90 123 45 67", "901234567", "992901234567". */
export function normPhone(raw: string): string | null {
  const d = String(raw ?? "").replace(/\D/g, "");
  if (d.length === 9) return "992" + d;
  if (d.length >= 10 && d.length <= 15) return d;
  return null;
}

export const escapeHtml = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));
