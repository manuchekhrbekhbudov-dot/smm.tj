"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getSupabase } from "@/lib/supabase/client";
import { previewDailyReport } from "@/lib/telegram";
import { Skeleton } from "@/components/ui/Notice";
import { cn } from "@/lib/cn";

export type Counts = {
  pending: number; approved: number; payments: number; complaints: number; feedback: number; requests: number;
  usersToday: number; usersWeek: number; clients: number; specialists: number;
  visitsToday: number; visitsWeek: number; viewsToday: number;
  income: number; expense: number;
};

const TZ = 5 * 3600_000;
const dDay = (ms = Date.now()) => new Date(ms + TZ).toISOString().slice(0, 10);

/** Everything the director needs at a glance; each number comes from the database (null-safe if a table is missing). */
export async function loadCounts(): Promise<Counts> {
  const sb = getSupabase()!;
  const today = dDay(), weekAgo = dDay(Date.now() - 6 * 86400_000), month = today.slice(0, 7);
  const since = (d: string) => `${d}T00:00:00+05:00`;
  const c = async (table: string, f: (q: any) => any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const { count, error } = await f(sb.from(table).select("id", { count: "exact", head: true }));
    return error ? 0 : count ?? 0;
  };
  const [pending, approved, payments, complaints, feedback, requests, usersToday, usersWeek, clients, specialists, visitsToday, visitsWeek, viewsToday] = await Promise.all([
    c("mp_specialists", (q) => q.eq("status", "pending")),
    c("mp_specialists", (q) => q.eq("status", "approved").is("banned_at", null)),
    c("mp_payments", (q) => q.in("status", ["checking", "review"])),
    c("mp_complaints", (q) => q.eq("voided", false).gte("created_at", new Date(Date.now() - 30 * 86400_000).toISOString())),
    c("mp_feedback", (q) => q.gte("created_at", new Date(Date.now() - 7 * 86400_000).toISOString())),
    c("mp_requests", (q) => q.eq("status", "open").gt("expires_at", new Date().toISOString())),
    c("mp_profiles", (q) => q.gte("created_at", since(today))),
    c("mp_profiles", (q) => q.gte("created_at", since(weekAgo))),
    c("mp_profiles", (q) => q.eq("role", "client")),
    c("mp_profiles", (q) => q.eq("role", "specialist")),
    c("mp_visits", (q) => q.eq("day", today)),
    c("mp_visits", (q) => q.gte("day", weekAgo)),
    c("mp_profile_views", (q) => q.eq("day", today)),
  ]);
  const [pays, entries] = await Promise.all([
    sb.from("mp_payments").select("amount_tjs").eq("status", "approved").gte("decided_at", since(`${month}-01`)),
    sb.from("mp_finance_entries").select("kind, amount_tjs").gte("day", `${month}-01`),
  ]);
  const sum = (r: { amount_tjs: number | string }[] | null | undefined) => (r ?? []).reduce((a, x) => a + Number(x.amount_tjs), 0);
  const e = (entries.data ?? []) as { kind: string; amount_tjs: number }[];
  return {
    pending, approved, payments, complaints, feedback, requests, usersToday, usersWeek, clients, specialists, visitsToday, visitsWeek, viewsToday,
    income: sum(pays.data) + sum(e.filter((x) => x.kind === "income")), expense: sum(e.filter((x) => x.kind === "expense")),
  };
}

const money = (n: number) => `${(Math.round(n * 100) / 100).toLocaleString("ru-RU")} TJS`;

export function Dashboard({ counts, go }: { counts: Counts | null; go: (s: string) => void }) {
  const t = useTranslations("panel");
  const [report, setReport] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => setReport(null), [counts]);
  if (!counts) return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>;

  const todo = [
    counts.pending && { k: "pending", n: counts.pending, text: t("todo.pending", { n: counts.pending }) },
    counts.payments && { k: "payments", n: counts.payments, text: t("todo.payments", { n: counts.payments }) },
    counts.complaints && { k: "complaints", n: counts.complaints, text: t("todo.complaints", { n: counts.complaints }) },
    counts.feedback && { k: "feedback", n: counts.feedback, text: t("todo.feedback", { n: counts.feedback }) },
  ].filter(Boolean) as { k: string; n: number; text: string }[];
  const profit = counts.income - counts.expense;
  const tiles: { label: string; value: string; sub?: string; to?: string; tone?: string }[] = [
    { label: t("tiles.visitsToday"), value: String(counts.visitsToday), sub: t("tiles.week", { n: counts.visitsWeek }), to: "stats" },
    { label: t("tiles.newUsers"), value: String(counts.usersToday), sub: t("tiles.week", { n: counts.usersWeek }), to: "stats" },
    { label: t("tiles.specialists"), value: String(counts.approved), sub: t("tiles.registered", { n: counts.specialists }), to: "approved" },
    { label: t("tiles.clients"), value: String(counts.clients), to: "stats" },
    { label: t("tiles.requests"), value: String(counts.requests), to: "requests" },
    { label: t("tiles.views"), value: String(counts.viewsToday), to: "stats" },
    { label: t("tiles.income"), value: money(counts.income), to: "finance" },
    { label: t("tiles.profit"), value: `${profit < 0 ? "−" : ""}${money(Math.abs(profit))}`, sub: t("tiles.expense", { v: money(counts.expense) }), to: "finance", tone: profit < 0 ? "text-danger" : "text-success" },
  ];

  return (
    <div className="space-y-8">
      <section className={cn("rounded-[var(--radius-lg)] p-5", todo.length ? "border border-warning/40 bg-warning/5" : "border border-success/30 bg-success/5")}>
        <h2 className="font-display text-lg font-bold">{todo.length ? `🔔 ${t("todo.title")}` : `✅ ${t("todo.none")}`}</h2>
        {todo.length > 0 && (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {todo.map((x) => (
              <li key={x.k}><button type="button" onClick={() => go(x.k)} className="flex w-full items-center justify-between rounded-xl glass px-4 py-3 text-left font-semibold hover:text-purple">{x.text}<span>→</span></button></li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((x) => (
          <button key={x.label} type="button" onClick={() => x.to && go(x.to)} className="rounded-[var(--radius-md)] glass glass-edge p-5 text-left transition-transform hover:-translate-y-0.5">
            <p className="text-sm text-ink-2">{x.label}</p>
            <p className={cn("tabular mt-1 font-display text-3xl font-bold", x.tone)}>{x.value}</p>
            {x.sub && <p className="mt-1 text-xs text-ink-2">{x.sub}</p>}
          </button>
        ))}
      </div>

      <section className="rounded-[var(--radius-lg)] glass p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold">📊 {t("report")}</h2>
          <button type="button" disabled={busy} onClick={async () => { setBusy(true); const r = await previewDailyReport(); setBusy(false); setReport(r ? r.replace(/<[^>]+>/g, "") : t("reportError")); }}
            className="rounded-full bg-gradient-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{busy ? "…" : t("reportShow")}</button>
        </div>
        <p className="mt-2 text-sm text-ink-2">{t("reportHint")}</p>
        {report && <pre className="mt-4 whitespace-pre-wrap font-sans text-sm text-ink-1">{report}</pre>}
      </section>
    </div>
  );
}
