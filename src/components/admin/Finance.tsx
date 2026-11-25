"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getSupabase } from "@/lib/supabase/client";
import { previewDailyReport } from "@/lib/telegram";
import { dateLocale } from "@/lib/date";
import { Tile } from "./Analytics";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Notice, Skeleton } from "@/components/ui/Notice";
import { cn } from "@/lib/cn";

type Entry = { id: string; day: string; kind: "expense" | "income"; category: string; amount_tjs: number; note: string };
type Pay = { amount_tjs: number; plan: string; decided_at: string };
const CATS = ["ads", "domain", "services", "salary", "prizes", "other"] as const;

const dushanbeToday = () => new Date(Date.now() + 5 * 3600_000).toISOString().slice(0, 10);
const money = (n: number) => (Math.round(n * 100) / 100).toLocaleString("ru-RU");
const sel = "h-12 w-full rounded-[var(--radius-sm)] border border-ink-3 bg-bg-1 px-4 text-base outline-none focus-visible:ring-2 focus-visible:ring-purple";

/** Director's money book: plan payments (automatic) + expenses / other income written by hand, per day and per month. */
export function Finance() {
  const t = useTranslations("finance");
  const locale = useLocale();
  const sb = getSupabase()!;
  const [month, setMonth] = useState(dushanbeToday().slice(0, 7));
  const [data, setData] = useState<{ pays: Pay[]; entries: Entry[] } | null | "missing">(null);
  const [form, setForm] = useState({ kind: "expense" as Entry["kind"], category: "ads", amount: "", day: dushanbeToday(), note: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [report, setReport] = useState<string | null>(null);
  const [reportBusy, setReportBusy] = useState(false);

  const load = useCallback(async () => {
    setData(null);
    const from = `${month}-01`;
    const [y, m] = month.split("-").map(Number);
    const to = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10); // first day of next month
    const [p, e] = await Promise.all([
      sb.from("mp_payments").select("amount_tjs, plan, decided_at").eq("status", "approved")
        .gte("decided_at", `${from}T00:00:00+05:00`).lt("decided_at", `${to}T00:00:00+05:00`).limit(5000),
      sb.from("mp_finance_entries").select("*").gte("day", from).lt("day", to).order("day", { ascending: false }).order("created_at", { ascending: false }).limit(5000),
    ]);
    if (e.error) { setData("missing"); return; }
    setData({ pays: (p.data as Pay[]) ?? [], entries: (e.data as Entry[]) ?? [] });
  }, [sb, month]);
  useEffect(() => { void load(); }, [load]);

  const sum = useMemo(() => {
    if (!data || data === "missing") return null;
    const dayOf = (iso: string) => new Date(new Date(iso).getTime() + 5 * 3600_000).toISOString().slice(0, 10);
    const days = new Map<string, { plans: number; income: number; expense: number }>();
    const get = (d: string) => days.get(d) ?? (days.set(d, { plans: 0, income: 0, expense: 0 }), days.get(d)!);
    for (const p of data.pays) get(dayOf(p.decided_at)).plans += Number(p.amount_tjs);
    for (const e of data.entries) get(e.day)[e.kind] += Number(e.amount_tjs);
    const rows = [...days.entries()].sort((a, b) => b[0].localeCompare(a[0]));
    const plans = rows.reduce((a, [, v]) => a + v.plans, 0);
    const income = rows.reduce((a, [, v]) => a + v.income, 0);
    const expense = rows.reduce((a, [, v]) => a + v.expense, 0);
    const byCat = new Map<string, number>();
    for (const e of data.entries) if (e.kind === "expense") byCat.set(e.category, (byCat.get(e.category) ?? 0) + Number(e.amount_tjs));
    return { rows, plans, income, expense, profit: plans + income - expense, byCat: [...byCat.entries()].sort((a, b) => b[1] - a[1]) };
  }, [data]);

  const add = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const amount = Number(form.amount.replace(",", "."));
    if (!(amount > 0) || amount > 10_000_000) { setErr(t("errAmount")); return; }
    setBusy(true); setErr(null);
    const { error } = await sb.from("mp_finance_entries").insert({
      kind: form.kind, category: form.kind === "expense" ? form.category : "other", amount_tjs: amount, day: form.day, note: form.note.trim().slice(0, 300),
    });
    setBusy(false);
    if (error) { setErr(t("errSave")); return; }
    setForm((f) => ({ ...f, amount: "", note: "" }));
    if (form.day.slice(0, 7) !== month) setMonth(form.day.slice(0, 7)); else void load();
  };
  const remove = async (id: string) => {
    if (!confirm(t("confirmDelete"))) return;
    const { error } = await sb.from("mp_finance_entries").delete().eq("id", id);
    if (!error) void load();
  };
  const showReport = async () => {
    setReportBusy(true);
    const text = await previewDailyReport();
    setReportBusy(false);
    setReport(text ? text.replace(/<[^>]+>/g, "") : t("reportError"));
  };

  if (data === "missing") return <Notice tone="warning">{t("needSql")}</Notice>;
  const df = new Intl.DateTimeFormat(dateLocale(locale), { day: "numeric", month: "short" });

  return (
    <div className="space-y-8">
      <Notice tone="info">
        {t("telegramInfo")}{" "}
        <button type="button" onClick={showReport} disabled={reportBusy} className="font-semibold text-purple underline">{reportBusy ? t("loading") : t("showReport")}</button>
      </Notice>
      {report && <pre className="whitespace-pre-wrap rounded-[var(--radius-md)] glass p-5 font-sans text-sm text-ink-1">{report}</pre>}

      <div className="flex flex-wrap items-end gap-3">
        <Input type="month" label={t("month")} value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} className="w-48" />
      </div>

      {!sum ? <Skeleton className="h-28" /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Tile label={t("plans")} value={`${money(sum.plans)} TJS`} sub={t("plansSub")} />
          <Tile label={t("otherIncome")} value={`${money(sum.income)} TJS`} />
          <Tile label={t("expenses")} value={`${money(sum.expense)} TJS`} />
          <Tile label={t("profit")} value={`${sum.profit < 0 ? "−" : ""}${money(Math.abs(sum.profit))} TJS`} sub={sum.profit < 0 ? t("loss") : undefined} />
        </div>
      )}

      <form onSubmit={add} className="rounded-[var(--radius-lg)] glass p-6" noValidate>
        <h2 className="font-display text-lg font-bold">{t("addTitle")}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <label className="block text-sm font-semibold">{t("kind")}
            <select className={cn(sel, "mt-2")} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as Entry["kind"] })}>
              <option value="expense">{t("kinds.expense")}</option>
              <option value="income">{t("kinds.income")}</option>
            </select>
          </label>
          {form.kind === "expense" && (
            <label className="block text-sm font-semibold">{t("category")}
              <select className={cn(sel, "mt-2")} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATS.map((c) => <option key={c} value={c}>{t(`cats.${c}`)}</option>)}
              </select>
            </label>
          )}
          <Input label={t("amount")} inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="150" />
          <Input type="date" label={t("day")} value={form.day} max={dushanbeToday()} onChange={(e) => setForm({ ...form, day: e.target.value })} />
          <Input label={t("note")} value={form.note} maxLength={300} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder={t("notePh")} />
        </div>
        {err && <Notice tone="danger" className="mt-4">{err}</Notice>}
        <Button type="submit" className="mt-5" loading={busy}>{t("add")}</Button>
      </form>

      {sum && sum.byCat.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-bold">{t("byCategory")}</h2>
          <ul className="mt-3 flex flex-wrap gap-2 text-sm">
            {sum.byCat.map(([c, v]) => <li key={c} className="rounded-full glass px-4 py-2">{t(`cats.${c}`)}: <b>{money(v)} TJS</b></li>)}
          </ul>
        </section>
      )}

      {sum && (
        <section>
          <h2 className="font-display text-lg font-bold">{t("byDay")}</h2>
          {sum.rows.length === 0 ? <p className="mt-3 text-ink-2">{t("empty")}</p> : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead><tr className="text-left text-ink-2"><th className="py-2 pr-4">{t("day")}</th><th className="pr-4">{t("plans")}</th><th className="pr-4">{t("otherIncome")}</th><th className="pr-4">{t("expenses")}</th><th>{t("profit")}</th></tr></thead>
                <tbody className="tabular">
                  {sum.rows.map(([d, v]) => {
                    const p = v.plans + v.income - v.expense;
                    return (
                      <tr key={d} className="border-t border-ink-3">
                        <td className="py-2 pr-4">{df.format(new Date(`${d}T12:00:00`))}</td>
                        <td className="pr-4">{money(v.plans)}</td><td className="pr-4">{money(v.income)}</td><td className="pr-4">{money(v.expense)}</td>
                        <td className={cn("font-semibold", p < 0 ? "text-danger" : "text-success")}>{p < 0 ? "−" : ""}{money(Math.abs(p))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {data && data.entries.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-bold">{t("entries")}</h2>
          <ul className="mt-3 space-y-2">
            {data.entries.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] glass px-4 py-3 text-sm">
                <span>
                  <b className={e.kind === "expense" ? "text-danger" : "text-success"}>{e.kind === "expense" ? "−" : "+"}{money(Number(e.amount_tjs))} TJS</b>
                  {" · "}{df.format(new Date(`${e.day}T12:00:00`))} · {e.kind === "expense" ? t(`cats.${e.category}`) : t("kinds.income")}{e.note ? ` · ${e.note}` : ""}
                </span>
                <button type="button" onClick={() => remove(e.id)} className="text-xs font-semibold text-ink-2 hover:text-danger">{t("delete")}</button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
