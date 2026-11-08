"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getSupabase } from "@/lib/supabase/client";
import { Stars } from "@/components/ui/Stars";

/** Specialist's own numbers: orders by state + rating. */
export function MyStats({ userId }: { userId: string }) {
  const t = useTranslations("stats");
  const [s, setS] = useState<{ all: number; new: number; active: number; done: number; rating: number; reviews: number } | null>(null);

  useEffect(() => {
    const sb = getSupabase()!;
    Promise.all([
      sb.from("mp_orders").select("status").eq("specialist_id", userId).limit(10000),
      sb.from("mp_specialists").select("rating_avg, reviews_count").eq("id", userId).maybeSingle(),
    ]).then(([o, sp]) => {
      const rows = (o.data as { status: string }[]) ?? [];
      setS({
        all: rows.length,
        new: rows.filter((x) => x.status === "new").length,
        active: rows.filter((x) => x.status === "accepted").length,
        done: rows.filter((x) => x.status === "done").length,
        rating: Number(sp.data?.rating_avg ?? 0),
        reviews: Number(sp.data?.reviews_count ?? 0),
      });
    });
  }, [userId]);

  if (!s) return null;
  const tiles = [
    { label: t("myOrders"), value: s.all },
    { label: t("myNew"), value: s.new },
    { label: t("myActive"), value: s.active },
    { label: t("myDone"), value: s.done },
  ];
  return (
    <section aria-label={t("mine")} className="mt-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-ink-2">{t("mine")}</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {tiles.map((x) => (
          <div key={x.label} className="rounded-[var(--radius-md)] glass glass-edge p-4">
            <p className="text-xs text-ink-2">{x.label}</p>
            <p className="tabular mt-1 font-display text-2xl font-bold">{x.value}</p>
          </div>
        ))}
        <div className="col-span-2 rounded-[var(--radius-md)] glass glass-edge p-4 md:col-span-1">
          <p className="text-xs text-ink-2">{t("avgRating")}</p>
          {s.reviews ? (
            <p className="mt-1 flex items-center gap-2"><span className="tabular font-display text-2xl font-bold">{s.rating.toFixed(1)}</span><Stars value={s.rating} size={14} /></p>
          ) : <p className="mt-1 font-display text-2xl font-bold">—</p>}
          <p className="text-xs text-ink-2">{t("reviews")}: {s.reviews}</p>
        </div>
      </div>
    </section>
  );
}
