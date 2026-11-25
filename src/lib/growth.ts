"use client";
/** Referrals ("invite a colleague"), profile-view counting and the director's "verified" badge. */
import type { SupabaseClient } from "@supabase/supabase-js";
import { SITE_URL } from "./site-url";

const REF_KEY = "smmtj_ref";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const referralLink = (specialistId: string, locale = "tg") =>
  `${SITE_URL}/${locale}/login/?role=specialist&ref=${specialistId}`;

/** Remembers who invited this visitor (?ref=<specialist id>) until they create a specialist profile. */
export function rememberReferral() {
  try {
    const ref = new URLSearchParams(location.search).get("ref");
    if (ref && UUID.test(ref)) localStorage.setItem(REF_KEY, ref);
  } catch { /* storage blocked: no referral */ }
}

/** Called after the specialist saves their profile: records the inviter once (the server checks everything). */
export async function claimReferral(sb: SupabaseClient, myId: string) {
  let ref: string | null = null;
  try { ref = localStorage.getItem(REF_KEY); } catch { return; }
  if (!ref || ref === myId) return;
  const { error } = await sb.rpc("mp_claim_referral", { p_ref: ref });
  if (!error) try { localStorage.removeItem(REF_KEY); } catch { /* ignore */ }
}

/** One view per visitor per profile per day. */
export function trackProfileView(sb: SupabaseClient, specialistId: string) {
  const key = `smmtj_pv:${specialistId}:${new Date().toISOString().slice(0, 10)}`;
  try { if (localStorage.getItem(key)) return; localStorage.setItem(key, "1"); } catch { /* still count */ }
  void sb.rpc("mp_track_view", { p_specialist: specialistId });
}

/** Adds verified_at to a list of specialists (separate query, so pages work before growth.sql is applied). */
export async function withVerified<T extends { id: string; verified_at?: string | null }>(sb: SupabaseClient, list: T[]): Promise<T[]> {
  if (!list.length) return list;
  const q = sb.from("mp_specialists").select("id, verified_at").not("verified_at", "is", null);
  const { data, error } = await (list.length <= 20 ? q.in("id", list.map((s) => s.id)) : q.limit(1000));
  if (error || !data) return list;
  const m = new Map(data.map((r) => [r.id as string, r.verified_at as string]));
  return list.map((s) => ({ ...s, verified_at: m.get(s.id) ?? null }));
}

export type MyViews = { today: number; week: number; prev_week: number; month: number; total: number; days: { day: string; n: number }[] };
