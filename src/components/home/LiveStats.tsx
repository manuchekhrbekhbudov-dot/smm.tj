"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Counter } from "@/components/fx/Counter";
import { getSupabase } from "@/lib/supabase/client";

type S = { specialists: number; completed_orders: number; reviews: number };

/** Real counters from the database (public_stats RPC). Renders nothing until data arrives. */
export function LiveStats() {
  const t = useTranslations("home.stats");
  const [s, setS] = useState<S | null>(null);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    sb.rpc("public_stats").then(({ data }) => {
      const row = Array.isArray(data) ? data[0] : data;
      if (row) setS({ specialists: Number(row.specialists), completed_orders: Number(row.completed_orders), reviews: Number(row.reviews) });
    });
  }, []);

  if (!s) return null;
  const items = [
    { v: s.specialists, l: t("specialists") },
    { v: s.completed_orders, l: t("orders") },
    { v: s.reviews, l: t("reviews") },
  ];
  return (
    <section className="container-x py-12">
      <div className="grid gap-4 sm:grid-cols-3">
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
