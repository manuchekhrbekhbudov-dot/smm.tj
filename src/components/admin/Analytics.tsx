"use client";
import { useEffect, useMemo, useState } from "react";
import { dateLocale } from "@/lib/date";
import { useTranslations, useLocale } from "next-intl";
import { getSupabase } from "@/lib/supabase/client";
import type { OrderStatus } from "@/lib/supabase/types";
import { formatTjs, specialtySlugs } from "@/content/site";
import { Skeleton } from "@/components/ui/Notice";
import { Stars } from "@/components/ui/Stars";
import { cn } from "@/lib/cn";
import { SpecialistStats } from "@/components/stats/SpecialistStats";
import { Badge } from "@/components/ui/Card";

type P = { id: string; role: string; city: string | null; created_at: string };
type S = { id: string; status: string; specialties: string[]; rating_avg: number; reviews_count: number; created_at: string; profiles: { full_name: string } | null };
type O = { id: string; status: OrderStatus; budget_tjs: number | null; created_at: string; specialist_id: string };
type R = { rating: number; hidden: boolean };

const DAYS = 30;
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

/** Counts per day for the last N days (oldest → newest). */
export function perDay(dates: string[]) {
  const today = new Date();
  const keys = Array.from({ length: DAYS }, (_, i) => dayKey(new Date(today.getTime() - (DAYS - 1 - i) * 86400000)));
  const map = new Map(keys.map((k) => [k, 0]));
  for (const d of dates) { const k = d.slice(0, 10); if (map.has(k)) map.set(k, map.get(k)! + 1); }
  return keys.map((k) => ({ key: k, value: map.get(k)! }));
}

export function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-[var(--radius-md)] glass glass-edge p-5">
      <p className="text-sm text-ink-2">{label}</p>
      <p className="tabular mt-1 font-display text-3xl font-bold">{value}</p>
      {sub && <p className="mt-1 text-xs text-ink-2">{sub}</p>}
    </div>
  );
}

/** Single-series column chart (one hue, rounded tops, 2px gaps, per-bar tooltip). */
export function DailyColumns({ title, data, locale, unit }: { title: string; data: { key: string; value: number }[]; locale: string; unit: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((a, d) => a + d.value, 0);
  const df = new Intl.DateTimeFormat(dateLocale(locale), { day: "numeric", month: "short" });
  return (
    <figure className="rounded-[var(--radius-lg)] glass glass-edge p-5 md:p-6">
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="font-semibold">{title}</span>
        <span className="tabular text-sm text-ink-2">{total} {unit}</span>
      </figcaption>
      <div className="relative mt-5 h-40" role="img" aria-label={`${title}: ${total}`}>
        {/* recessive gridlines */}
        {[0.5, 1].map((f) => <div key={f} aria-hidden className="absolute inset-x-0 border-t border-dashed border-ink-3" style={{ bottom: `${f * 100}%` }} />)}
        <span aria-hidden className="tabular absolute -top-1 right-0 -translate-y-full text-[11px] text-ink-2">{max}</span>
        <div className="absolute inset-0 flex items-end gap-[2px]">
          {data.map((d) => (
            <div key={d.key} className="group relative flex h-full flex-1 items-end" title={`${df.format(new Date(d.key))}: ${d.value}`}>
              <div className="w-full rounded-t-[4px] bg-violet transition-colors group-hover:bg-purple" style={{ height: d.value ? `${Math.max((d.value / max) * 100, 3)}%` : "2px", opacity: d.value ? 1 : 0.25 }} />
              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-bg-3 px-2 py-1 text-xs text-ink-0 shadow-lg group-hover:block">
                {df.format(new Date(d.key))}: <b className="tabular">{d.value}</b>
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-ink-2">
        <span>{df.format(new Date(data[0].key))}</span>
        <span>{df.format(new Date(data[data.length - 1].key))}</span>
      </div>
    </figure>
  );
}

/** Horizontal bars with direct value labels (text in ink, mark carries the color). */
export function Bars({ title, rows, empty, colorFor }: { title: string; rows: { label: string; value: number; key: string }[]; empty: string; colorFor?: (key: string) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <figure className="rounded-[var(--radius-lg)] glass glass-edge p-5 md:p-6">
      <figcaption className="font-semibold">{title}</figcaption>
      {rows.length === 0 ? <p className="mt-4 text-sm text-ink-2">{empty}</p> : (
        <ul className="mt-5 space-y-3">
          {rows.map((r) => (
            <li key={r.key} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-sm" title={`${r.label}: ${r.value}`}>
              <span className="truncate text-ink-1">{r.label}</span>
              <span className="h-3 rounded-full bg-ink-3">
                <span className={cn("block h-full rounded-full", colorFor ? colorFor(r.key) : "bg-violet")} style={{ width: `${Math.max((r.value / max) * 100, r.value ? 3 : 0)}%` }} />
              </span>
              <span className="tabular w-8 text-right font-semibold">{r.value}</span>
            </li>
          ))}
        </ul>
      )}
    </figure>
  );
}

export const statusColor: Record<string, string> = {
  new: "bg-violet", accepted: "bg-warning", done: "bg-success", declined: "bg-danger", cancelled: "bg-ink-2",
};

export function Analytics() {
  const t = useTranslations();
  const locale = useLocale();
  const [data, setData] = useState<{ p: P[]; s: S[]; o: O[]; r: R[] } | null>(null);
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const sb = getSupabase()!;
    Promise.all([
      sb.from("mp_profiles").select("id, role, city, created_at").limit(10000),
      sb.from("mp_specialists").select("id, status, specialties, rating_avg, reviews_count, created_at, profiles:mp_profiles!mp_specialists_id_fkey(full_name)").limit(10000),
      sb.from("mp_orders").select("id, status, budget_tjs, created_at, specialist_id").limit(10000),
      sb.from("mp_reviews").select("rating, hidden").limit(10000),
    ]).then(([p, s, o, r]) => setData({
      p: (p.data as P[]) ?? [], s: (s.data as unknown as S[]) ?? [], o: (o.data as O[]) ?? [], r: (r.data as R[]) ?? [],
    }));
  }, []);

  const m = useMemo(() => {
    if (!data) return null;
    const { p, s, o, r } = data;
    const approved = s.filter((x) => x.status === "approved");
    const visible = r.filter((x) => !x.hidden);
    const done = o.filter((x) => x.status === "done");
    const cityCount = new Map<string, number>();
    p.forEach((x) => { const k = x.city ?? "_none"; cityCount.set(k, (cityCount.get(k) ?? 0) + 1); });
    return {
      users: p.length,
      clients: p.filter((x) => x.role === "client").length,
      approved: approved.length,
      pending: s.filter((x) => x.status === "pending").length,
      orders: o.length,
      done: done.length,
      conversion: o.length ? Math.round((done.length / o.length) * 100) : 0,
      reviews: visible.length,
      avg: visible.length ? visible.reduce((a, x) => a + x.rating, 0) / visible.length : 0,
      budget: o.filter((x) => x.status !== "declined" && x.status !== "cancelled").reduce((a, x) => a + (x.budget_tjs ?? 0), 0),
      signups: perDay(p.map((x) => x.created_at)),
      orders30: perDay(o.map((x) => x.created_at)),
      byStatus: (["new", "accepted", "done", "declined", "cancelled"] as const).map((k) => ({ key: k, label: t(`cabinet.statuses.${k}`), value: o.filter((x) => x.status === k).length })),
      bySpecialty: specialtySlugs.map((k) => ({ key: k, label: t(`specialties.${k}.title`), value: approved.filter((x) => x.specialties.includes(k)).length }))
        .filter((x) => x.value > 0).sort((a, b) => b.value - a.value),
      byCity: [...cityCount.entries()].map(([k, v]) => ({ key: k, label: k === "_none" ? t("stats.noCity") : t(`cities.${k}`), value: v }))
        .sort((a, b) => b.value - a.value).slice(0, 8),
      top: s.map((x) => {
        const mine = o.filter((y) => y.specialist_id === x.id);
        const doneN = mine.filter((y) => y.status === "done");
        return {
          ...x,
          total: mine.length,
          done: doneN.length,
          completion: mine.length ? Math.round((doneN.length / mine.length) * 100) : 0,
          revenue: doneN.reduce((a, y) => a + (y.budget_tjs ?? 0), 0),
        };
      }).sort((a, b) => b.done - a.done || b.total - a.total || Number(b.rating_avg) - Number(a.rating_avg)),
    };
  }, [data, t]);

  if (!m) return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label={t("stats.users")} value={String(m.users)} sub={`${t("stats.clients")}: ${m.clients}`} />
        <Tile label={t("stats.specialistsApproved")} value={String(m.approved)} sub={`${t("stats.pending")}: ${m.pending}`} />
        <Tile label={t("stats.orders")} value={String(m.orders)} sub={`${t("stats.ordersDone")}: ${m.done} · ${t("stats.conversion")}: ${m.conversion}%`} />
        <Tile label={t("stats.reviews")} value={String(m.reviews)} sub={m.reviews ? `${t("stats.avgRating")}: ${m.avg.toFixed(1)} / 5` : undefined} />
      </div>
      <Tile label={t("stats.budget")} value={`${formatTjs(m.budget)} TJS`} />

      <Visits />

      <div className="grid gap-6 lg:grid-cols-2">
        <DailyColumns title={t("stats.signups30")} data={m.signups} locale={locale} unit={t("stats.total")} />
        <DailyColumns title={t("stats.orders30")} data={m.orders30} locale={locale} unit={t("stats.total")} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Bars title={t("stats.byStatus")} rows={m.byStatus} empty={t("stats.empty")} colorFor={(k) => statusColor[k]} />
        <Bars title={t("stats.bySpecialty")} rows={m.bySpecialty} empty={t("stats.empty")} />
        <Bars title={t("stats.byCity")} rows={m.byCity} empty={t("stats.empty")} />
      </div>

      {selected && (
        <section id="sp-detail" className="rounded-[var(--radius-lg)] glass glass-edge p-5 md:p-6">
          <div className="mb-4 flex justify-end">
            <button type="button" onClick={() => setSelected(null)} className="rounded-full glass px-4 py-2 text-sm font-semibold">{t("stats.sp.close")} ✕</button>
          </div>
          <SpecialistStats specialistId={selected.id} name={selected.name} />
        </section>
      )}

      <section className="rounded-[var(--radius-lg)] glass glass-edge p-5 md:p-6">
        <h3 className="font-semibold">{t("stats.sp.allTitle")}</h3>
        {m.top.length === 0 ? <p className="mt-4 text-sm text-ink-2">{t("stats.empty")}</p> : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead><tr className="border-b border-ink-3 text-ink-2">
                <th scope="col" className="py-2 pr-3 font-medium">{t("stats.colName")}</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">{t("stats.sp.colOrders")}</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">{t("stats.colDone")}</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">{t("stats.sp.colCompletion")}</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">{t("stats.sp.colRevenue")}</th>
                <th scope="col" className="py-2 pr-3 font-medium">{t("stats.colRating")}</th>
                <th scope="col" className="py-2 font-medium"><span className="sr-only">{t("stats.sp.open")}</span></th>
              </tr></thead>
              <tbody>
                {m.top.map((x) => {
                  const nm = x.profiles?.full_name || "—";
                  return (
                    <tr key={x.id} className={cn("border-b border-ink-3 last:border-0", selected?.id === x.id && "bg-purple/10")}>
                      <td className="py-2.5 pr-3 font-medium">
                        {nm}{" "}
                        {x.status !== "approved" && <Badge tone={x.status === "pending" ? "warning" : "danger"} className="ml-1">{t(`admin.tabs.${x.status}`)}</Badge>}
                      </td>
                      <td className="tabular py-2.5 pr-3 text-right">{x.total}</td>
                      <td className="tabular py-2.5 pr-3 text-right">{x.done}</td>
                      <td className="tabular py-2.5 pr-3 text-right">{x.completion}%</td>
                      <td className="tabular py-2.5 pr-3 text-right">{formatTjs(x.revenue)}</td>
                      <td className="py-2.5 pr-3">{x.reviews_count ? <span className="inline-flex items-center gap-2"><Stars value={Number(x.rating_avg)} size={13} /><span className="tabular">{Number(x.rating_avg).toFixed(1)}</span></span> : "—"}</td>
                      <td className="py-2.5 text-right">
                        <button type="button" className="rounded-full bg-gradient-primary px-4 py-1.5 text-xs font-semibold text-white"
                          onClick={() => { setSelected({ id: x.id, name: nm }); setTimeout(() => document.getElementById("sp-detail")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50); }}>
                          {t("stats.sp.open")}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

/** Page views of the last 30 days (from mp_visits; hidden until features.sql is applied). */
function Visits() {
  const t = useTranslations();
  const locale = useLocale();
  const [v, setV] = useState<{ day: string; source: string | null; path: string }[] | null>(null);
  useEffect(() => {
    const since = new Date(Date.now() - 30 * 86400000).toISOString();
    void getSupabase()!.from("mp_visits").select("day, source, path").gte("created_at", since).limit(20000).then(({ data, error }) => setV(error ? [] : ((data as { day: string; source: string | null; path: string }[]) ?? [])));
  }, []);
  if (!v || v.length === 0) return null;
  const count = (key: (x: { source: string | null; path: string }) => string) => {
    const m = new Map<string, number>();
    for (const x of v) m.set(key(x), (m.get(key(x)) ?? 0) + 1);
    return [...m.entries()].map(([k, n]) => ({ key: k, label: k, value: n })).sort((a, b) => b.value - a.value).slice(0, 8);
  };
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <DailyColumns title={t("stats.visits30")} data={perDay(v.map((x) => x.day))} locale={locale} unit={t("stats.total")} />
      <div className="grid gap-6">
        <Bars title={t("stats.visitSources")} rows={count((x) => x.source || "direct")} empty="—" />
        <Bars title={t("stats.visitPages")} rows={count((x) => x.path)} empty="—" />
      </div>
    </div>
  );
}
