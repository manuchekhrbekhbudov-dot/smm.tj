"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Counter } from "@/components/fx/Counter";
import { getSupabase } from "@/lib/supabase/client";

type S = { users: number; registered: number; approved: number; orders: number; reviews: number };

/**
 * Real counters from the database. Only numbers above zero are shown, nothing is ever made up;
 * the whole block stays hidden until there is something real to show.
 */
export function LiveStats() {
  const t = useTranslations("home.stats");
  const [s, setS] = useState<S | null>(null);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    void (async () => {
      const r = await sb.rpc("mp_public_counts");
      const row = Array.isArray(r.data) ? r.data[0] : r.data;
      if (!r.error && row) {
        setS({ users: Number(row.users), registered: Number(row.specialists_registered), approved: Number(row.specialists_approved), orders: Number(row.completed_orders), reviews: Number(row.reviews) });
        return;
      }
      // Older database without mp_public_counts: fall back to the basic counters.
      const { data } = await sb.rpc("mp_public_stats");
      const o = Array.isArray(data) ? data[0] : data;
      if (o) setS({ users: 0, registered: 0, approved: Number(o.specialists), orders: Number(o.completed_orders), reviews: Number(o.reviews) });
    })();
  }, []);

  if (!s) return null;
  const items = [
    { v: s.users, l: t("users") },
    { v: s.registered, l: t("registered") },
    { v: s.approved, l: t("specialists") },
    { v: s.orders, l: t("orders") },
    { v: s.reviews, l: t("reviews") },
  ].filter((it) => it.v > 0);
  if (!items.length) return null;
  return (
    <section className="container-x py-12">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        {items.map((it) => (
          <div key={it.l} className="rounded-[var(--radius-lg)] glass glass-edge p-7 transition-transform duration-500 hover:-translate-y-1">
            <Counter to={it.v} className="block font-display text-5xl font-bold text-gradient" />
            <p className="mt-2 text-ink-1">{it.l}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-ink-2">{t("note")}</p>
    </section>
  );
}
