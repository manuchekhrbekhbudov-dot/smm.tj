"use client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Specialist } from "@/lib/supabase/types";

export type Plan = "top" | "standard" | "premium";
export const PLANS: Plan[] = ["top", "standard", "premium"];
export const PLAN_PRICES: Record<Plan, number> = { top: 100, standard: 200, premium: 300 };
export const PLAN_DAYS = 30;
/** Alif account the director receives plan payments on. */
export const ALIF_NUMBER = "504440101";
export const ALIF_DISPLAY = "+992 50 444 01 01";

const RANK: Record<Plan, number> = { top: 1, standard: 2, premium: 3 };

/** The plan if it is still active, otherwise null. */
export function activePlan(s: Pick<Specialist, "plan" | "plan_until">): Plan | null {
  if (!s.plan || !s.plan_until) return null;
  return new Date(s.plan_until).getTime() > Date.now() ? (s.plan as Plan) : null;
}
export const planRank = (s: Pick<Specialist, "plan" | "plan_until">) => {
  const p = activePlan(s);
  return p ? RANK[p] : 0;
};

/** Paid specialists first (Premium → Standard → Top); keeps the existing order inside each group. */
export function sortByPlan<T extends Pick<Specialist, "plan" | "plan_until">>(list: T[]): T[] {
  return list.map((s, i) => [s, i] as const)
    .sort((a, b) => planRank(b[0]) - planRank(a[0]) || a[1] - b[1])
    .map(([s]) => s);
}

/**
 * Loads plan fields separately so pages keep working even before plans.sql was applied
 * (a missing column then just means "no plans").
 */
export async function withPlans<T extends Specialist>(sb: SupabaseClient, list: T[]): Promise<T[]> {
  if (!list.length) return list;
  const q = sb.from("mp_specialists").select("id, plan, plan_until").gt("plan_until", new Date().toISOString());
  const { data, error } = await (list.length <= 20 ? q.in("id", list.map((s) => s.id)) : q.limit(1000));
  if (error || !data) return list;
  const m = new Map(data.map((r) => [r.id as string, r as { plan: string | null; plan_until: string | null }]));
  return list.map((s) => ({ ...s, plan: m.get(s.id)?.plan ?? null, plan_until: m.get(s.id)?.plan_until ?? null }));
}
