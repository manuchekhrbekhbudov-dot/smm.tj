"use client";
import { useEffect, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { getSupabase } from "@/lib/supabase/client";
import type { OrderStatus } from "@/lib/supabase/types";
import { formatTjs } from "@/content/site";
import { dateLocale } from "@/lib/date";
import { Tile, DailyColumns, Bars, perDay, statusColor } from "@/components/admin/Analytics";
import { Skeleton } from "@/components/ui/Notice";
import { Stars } from "@/components/ui/Stars";

type O = { status: OrderStatus; budget_tjs: number | null; created_at: string; updated_at: string; service_id: string | null; specialist_services: { title: string } | null };
type R = { rating: number; hidden: boolean };
type Sp = { rating_avg: number; reviews_count: number; created_at: string; min_price: number | null };

/** Detailed work statistics for ONE specialist (used by the director and by the specialist). */
export function SpecialistStats({ specialistId, name, showTitle = true }: { specialistId: string; name?: string; showTitle?: boolean }) {
  const t = useTranslations();
  const locale = useLocale();
  const [d, setD] = useState<{ o: O[]; r: R[]; sp: Sp | null; services: number } | null>(null);

  useEffect(() => {
    const sb = getSupabase()!;
    setD(null);
    Promise.all([
      sb.from("mp_orders").select("status, budget_tjs, created_at, updated_at, service_id, specialist_services:mp_specialist_services!mp_orders_service_id_fkey(title)").eq("specialist_id", specialistId).limit(10000),
      sb.from("mp_reviews").select("rating, hidden").eq("specialist_id", specialistId).limit(10000),
      sb.from("mp_specialists").select("rating_avg, reviews_count, created_at, min_price").eq("id", specialistId).maybeSingle(),
      sb.from("mp_specialist_services").select("id", { count: "exact", head: true }).eq("specialist_id", specialistId),
    ]).then(([o, r, sp, sv]) => setD({
      o: (o.data as unknown as O[]) ?? [], r: (r.data as R[]) ?? [], sp: (sp.data as Sp) ?? null, services: sv.count ?? 0,
    }));
  }, [specialistId]);

  const m = useMemo(() => {
    if (!d) return null;
    const { o, r } = d;
    const done = o.filter((x) => x.status === "done");
    const declined = o.filter((x) => x.status === "declined");
    const decided = o.filter((x) => x.status !== "new");
    const withBudget = o.filter((x) => x.budget_tjs);
    const days = done.map((x) => (new Date(x.updated_at).getTime() - new Date(x.created_at).getTime()) / 86400000);
    const visible = r.filter((x) => !x.hidden);
    const svc = new Map<string, number>();
    o.forEach((x) => { const k = x.specialist_services?.title ?? "_other"; svc.set(k, (svc.get(k) ?? 0) + 1); });
    return {
      total: o.length,
      done: done.length,
      completion: o.length ? Math.round((done.length / o.length) * 100) : 0,
      declineRate: decided.length ? Math.round((declined.length / decided.length) * 100) : 0,
      revenue: done.reduce((a, x) => a + (x.budget_tjs ?? 0), 0),
      avgBudget: withBudget.length ? Math.round(withBudget.reduce((a, x) => a + (x.budget_tjs ?? 0), 0) / withBudget.length) : 0,
      avgDays: days.length ? Math.max(1, Math.round(days.reduce((a, x) => a + x, 0) / days.length)) : null,
      orders30: perDay(o.map((x) => x.created_at)),
      byStatus: (["new", "accepted", "done", "declined", "cancelled"] as const).map((k) => ({ key: k, label: t(`cabinet.statuses.${k}`), value: o.filter((x) => x.status === k).length })),
      ratingDist: [5, 4, 3, 2, 1].map((n) => ({ key: String(n), label: "★".repeat(n), value: visible.filter((x) => x.rating === n).length })),
      topServices: [...svc.entries()].map(([k, v]) => ({ key: k, label: k === "_other" ? t("stats.sp.otherService") : k, value: v }))
        .sort((a, b) => b.value - a.value).slice(0, 6),
    };
  }, [d, t]);

  if (!m || !d) return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>;

  const df = new Intl.DateTimeFormat(dateLocale(locale), { day: "numeric", month: "long", year: "numeric" });
  const rating = Number(d.sp?.rating_avg ?? 0);
  const reviews = Number(d.sp?.reviews_count ?? 0);

  return (
    <div className="space-y-5">
      {showTitle && (
        <div>
          <h3 className="text-h3 font-bold">{t("stats.sp.title", { name: name ?? "" })}</h3>
          {d.sp && <p className="mt-1 text-sm text-ink-2">{t("stats.sp.since", { date: df.format(new Date(d.sp.created_at)) })}</p>}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label={t("stats.sp.ordersAll")} value={String(m.total)} sub={`${t("stats.ordersDone")}: ${m.done}`} />
        <Tile label={t("stats.sp.completion")} value={`${m.completion}%`} sub={`${t("stats.sp.declineRate")}: ${m.declineRate}%`} />
        <Tile label={t("stats.sp.revenue")} value={`${formatTjs(m.revenue)} TJS`} sub={m.avgBudget ? `${t("stats.sp.avgBudget")}: ${formatTjs(m.avgBudget)} TJS` : undefined} />
        <div className="rounded-[var(--radius-md)] glass glass-edge p-5">
          <p className="text-sm text-ink-2">{t("stats.avgRating")}</p>
          {reviews ? (
            <p className="mt-1 flex items-center gap-2"><span className="tabular font-display text-3xl font-bold">{rating.toFixed(1)}</span><Stars value={rating} size={15} /></p>
          ) : <p className="mt-1 font-display text-3xl font-bold">—</p>}
          <p className="mt-1 text-xs text-ink-2">{t("stats.reviews")}: {reviews}</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Tile label={t("stats.sp.avgDays")} value={m.avgDays ? t("stats.sp.days", { n: m.avgDays }) : "—"} />
        <Tile label={t("stats.sp.services")} value={String(d.services)} />
        <Tile label={t("stats.sp.minPrice")} value={d.sp?.min_price != null ? `${formatTjs(d.sp.min_price)} TJS` : "—"} />
      </div>
      <DailyColumns title={t("stats.sp.orders30")} data={m.orders30} locale={locale} unit={t("stats.total")} />
      <div className="grid gap-5 lg:grid-cols-3">
        <Bars title={t("stats.byStatus")} rows={m.byStatus} empty={t("stats.empty")} colorFor={(k) => statusColor[k]} />
        <Bars title={t("stats.sp.ratingDist")} rows={m.ratingDist} empty={t("stats.empty")} colorFor={() => "bg-warning"} />
        <Bars title={t("stats.sp.topServices")} rows={m.topServices} empty={t("stats.empty")} />
      </div>
    </div>
  );
}
