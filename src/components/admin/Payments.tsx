"use client";
import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getSupabase } from "@/lib/supabase/client";
import { checkReceipt } from "@/lib/telegram";
import { dateLocale } from "@/lib/date";
import type { Payment } from "@/lib/supabase/types";
import { Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Notice, Skeleton } from "@/components/ui/Notice";
import { cn } from "@/lib/cn";

type Row = Payment & { specialists?: { profiles: { full_name: string } | null } | null };
const tone = { checking: "neutral", review: "warning", approved: "success", rejected: "danger" } as const;

/** Director: plan payments with the receipt image, what the AI read, and approve / reject. */
export function Payments() {
  const t = useTranslations();
  const locale = useLocale();
  const sb = getSupabase()!;
  const [open, setOpen] = useState(true);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRows(null); setErr(null);
    let q = sb.from("mp_payments").select("*, specialists:mp_specialists!mp_payments_specialist_id_fkey(profiles:mp_profiles!mp_specialists_id_fkey(full_name))")
      .order("created_at", { ascending: false }).limit(100);
    if (open) q = q.in("status", ["checking", "review"]);
    const { data, error } = await q;
    if (error) { setErr(t("plans.notReady")); setRows([]); return; }
    const list = (data as unknown as Row[]) ?? [];
    setRows(list);
    if (list.length) {
      const { data: signed } = await sb.storage.from("mp-receipts").createSignedUrls(list.map((r) => r.receipt_path), 3600);
      setUrls(Object.fromEntries((signed ?? []).filter((s) => s.signedUrl).map((s) => [s.path!, s.signedUrl])));
    }
  }, [sb, open, t]);
  useEffect(() => { void load(); }, [load]);

  const decide = async (r: Row, status: "approved" | "rejected") => {
    setBusy(r.id); setErr(null);
    const { error } = await sb.from("mp_payments").update({ status, reason: status === "rejected" ? "director" : r.reason }).eq("id", r.id);
    setBusy(null);
    if (error) setErr(error.message.includes("mp_payments_tx_uniq") ? t("plans.reasons.duplicate") : t("common.error"));
    else void load();
  };
  const recheck = async (r: Row) => { setBusy(r.id); await checkReceipt(r.id); setBusy(null); void load(); };

  const df = new Intl.DateTimeFormat(dateLocale(locale), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <div>
      <div className="mb-6 flex gap-2">
        {[true, false].map((v) => (
          <button key={String(v)} type="button" onClick={() => setOpen(v)} aria-pressed={open === v}
            className={cn("rounded-full px-4 py-2 text-sm font-semibold", open === v ? "bg-gradient-primary text-white" : "glass text-ink-1")}>
            {v ? t("admin.payments.filterOpen") : t("admin.payments.filterAll")}
          </button>
        ))}
      </div>
      {err && <Notice tone="danger" className="mb-5">{err}</Notice>}
      {rows === null ? <Skeleton className="h-40" /> : rows.length === 0 ? <p className="text-ink-2">{t("admin.payments.empty")}</p> : (
        <ul className="space-y-5">
          {rows.map((r) => {
            const ai = r.ai_result;
            const url = urls[r.receipt_path];
            return (
              <li key={r.id} className="grid gap-5 rounded-[var(--radius-lg)] glass p-5 md:grid-cols-[180px_1fr]">
                {url ? (
                  <a href={url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-2xl bg-ink-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={t("admin.payments.receipt")} className="max-h-72 w-full object-contain" loading="lazy" />
                  </a>
                ) : <div className="h-40 rounded-2xl bg-ink-3" />}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link href={{ pathname: "/specialist", query: { id: r.specialist_id } }} className="font-display text-lg font-bold hover:text-purple">
                      {r.specialists?.profiles?.full_name || "—"}
                    </Link>
                    <Badge tone={tone[r.status]}>{t(`plans.status.${r.status}`)}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-ink-1"><b>{t(`plans.names.${r.plan}`)}</b> · {r.amount_tjs} TJS · <span className="text-ink-2">{df.format(new Date(r.created_at))}</span></p>
                  {r.reason && <p className="mt-1 text-sm text-ink-2">{t.has(`plans.reasons.${r.reason}`) ? t(`plans.reasons.${r.reason}`) : r.reason}</p>}
                  {ai && (
                    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 rounded-2xl bg-ink-3 p-4 text-sm sm:grid-cols-4">
                      <div><dt className="text-xs text-ink-2">{t("admin.payments.amount")}</dt><dd className="font-semibold">{ai.amount ?? "—"} {ai.currency}</dd></div>
                      <div><dt className="text-xs text-ink-2">{t("admin.payments.recipient")}</dt><dd className="font-semibold break-all">{ai.recipient_phone_digits || "—"}</dd></div>
                      <div><dt className="text-xs text-ink-2">{t("admin.payments.date")}</dt><dd className="font-semibold">{ai.date || "—"}</dd></div>
                      <div><dt className="text-xs text-ink-2">{t("admin.payments.tx")}</dt><dd className="font-semibold break-all">{ai.transaction_id || "—"}</dd></div>
                      {ai.notes && <p className="col-span-full mt-1 text-xs text-ink-2">{t("admin.payments.ai")}: {ai.notes}</p>}
                    </dl>
                  )}
                  {(r.status === "review" || r.status === "checking") && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button size="sm" loading={busy === r.id} onClick={() => decide(r, "approved")}>{t("admin.payments.approve")}</Button>
                      <Button size="sm" variant="outline" disabled={busy === r.id} onClick={() => decide(r, "rejected")}>{t("admin.payments.reject")}</Button>
                      {r.status === "checking" && <Button size="sm" variant="ghost" disabled={busy === r.id} onClick={() => recheck(r)}>{t("admin.payments.recheck")}</Button>}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
