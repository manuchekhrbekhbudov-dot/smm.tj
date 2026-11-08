"use client";
import { SUPABASE_URL } from "./supabase/config";
import { getSupabase } from "./supabase/client";

const fn = (name: string) => `${SUPABASE_URL}/functions/v1/${name}`;
let botCache: Promise<string | null> | null = null;

/** Bot username from the deployed tg-bot function (null if Telegram login is not set up yet). */
export function getBotUsername(): Promise<string | null> {
  if (!botCache) {
    botCache = fetch(fn("tg-bot"), { method: "GET" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => (d?.bot as string) ?? null)
      .catch(() => null);
  }
  return botCache;
}

export type CodeStatus = { pending: boolean; blocked?: boolean; until?: string; attempts_left?: number };

/** Has the bot already sent a code to this phone? (never returns the code itself) */
export async function getCodeStatus(phone: string): Promise<CodeStatus | null> {
  try {
    const r = await fetch(fn("tg-auth"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone, check: true }) });
    return r.ok ? ((await r.json()) as CodeStatus) : null;
  } catch {
    return null;
  }
}

export type CodeResult = { error: string | null; attemptsLeft?: number; until?: string };

/**
 * Exchanges phone + Telegram code for a Supabase session (or, with link=true, only connects
 * Telegram notifications to the signed-in account).
 */
export async function loginWithTelegramCode(phone: string, code: string, link = false): Promise<CodeResult> {
  const sb = getSupabase();
  if (!sb) return { error: "generic" };
  try {
    const token = link ? (await sb.auth.getSession()).data.session?.access_token : undefined;
    const r = await fetch(fn("tg-auth"), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ phone, code, link }),
    });
    const d = await r.json().catch(() => ({}));
    if (d.error) return { error: d.error as string, attemptsLeft: d.attempts_left, until: d.until };
    if (link) return { error: r.ok && d.linked ? null : "generic" };
    if (!r.ok || !d.token_hash) return { error: "generic" };
    const { error } = await sb.auth.verifyOtp({ type: "magiclink", token_hash: d.token_hash });
    return { error: error ? "generic" : null };
  } catch {
    return { error: "generic" };
  }
}

/** Fire-and-forget Telegram notification about an order event (silently ignored if not set up). */
export async function notifyOrder(orderId: string) {
  const sb = getSupabase();
  const token = (await sb?.auth.getSession())?.data.session?.access_token;
  if (!token) return;
  fetch(fn("tg-notify"), { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ order_id: orderId }) }).catch(() => {});
}
