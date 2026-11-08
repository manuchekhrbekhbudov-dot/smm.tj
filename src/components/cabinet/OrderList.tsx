"use client";
import { useCallback, useEffect, useState } from "react";
import { dateLocale } from "@/lib/date";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getSupabase } from "@/lib/supabase/client";
import type { Order, OrderStatus } from "@/lib/supabase/types";
import { formatTjs } from "@/content/site";
import { Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Notice, Skeleton } from "@/components/ui/Notice";
import { buttonClasses } from "@/components/ui/buttonClasses";
import { ReviewForm } from "./ReviewForm";

type Row = Order & {
  specialists?: { id: string; profiles: { full_name: string } | null } | null;
  profiles?: { full_name: string } | null;
  specialist_services?: { title: string } | null;
  reviews?: { id: string } | { id: string }[] | null;
};

const tone: Record<OrderStatus, "purple" | "warning" | "danger" | "success" | "neutral"> = {
  new: "purple", accepted: "warning", declined: "danger", done: "success", cancelled: "neutral",
};

/** mode "client": orders I placed. mode "specialist": orders I received. */
export function OrderList({ mode, userId }: { mode: "client" | "specialist"; userId: string }) {
  const t = useTranslations();
  const locale = useLocale();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState(false);
  const [reviewing, setReviewing] = useState<string | null>(null);

  const load = useCallback(async () => {
    const sb = getSupabase()!;
    const select = mode === "client"
      ? "*, specialists:mp_specialists!mp_orders_specialist_id_fkey(id, profiles:mp_profiles!mp_specialists_id_fkey(full_name)), specialist_services:mp_specialist_services!mp_orders_service_id_fkey(title), reviews:mp_reviews!mp_reviews_order_id_fkey(id)"
      : "*, profiles:mp_profiles!mp_orders_client_id_fkey(full_name), specialist_services:mp_specialist_services!mp_orders_service_id_fkey(title)";
    const { data } = await sb.from("mp_orders").select(select).eq(mode === "client" ? "client_id" : "specialist_id", userId).order("created_at", { ascending: false });
    setRows((data as unknown as Row[]) ?? []);
  }, [mode, userId]);

  useEffect(() => { void load(); }, [load]);

  const setStatus = async (id: string, status: OrderStatus) => {
    setBusy(id); setErr(false);
    const { error } = await getSupabase()!.from("mp_orders").update({ status }).eq("id", id);
    setBusy(null);
    if (error) setErr(true); else void load();
  };

  if (rows === null) return <div className="space-y-4">{[0, 1].map((i) => <Skeleton key={i} className="h-32" />)}</div>;
  if (rows.length === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] glass p-10 text-center">
        <p className="text-ink-1">{t("cabinet.emptyOrders")}</p>
        {mode === "client" && <Link href="/specialists" className={buttonClasses("primary", "md", "mt-6")}>{t("cabinet.findCta")}</Link>}
      </div>
    );
  }

  const df = new Intl.DateTimeFormat(dateLocale(locale), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-4">
      {err && <Notice tone="danger">{t("common.error")}</Notice>}
      {rows.map((o) => {
        const hasReview = Array.isArray(o.reviews) ? o.reviews.length > 0 : !!o.reviews;
        const who = mode === "client" ? o.specialists?.profiles?.full_name : o.profiles?.full_name;
        return (
          <article key={o.id} className="rounded-[var(--radius-lg)] glass p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                {mode === "client" && o.specialists ? (
                  <Link href={{ pathname: "/specialist", query: { id: o.specialist_id } }} className="font-display text-lg font-bold hover:text-purple">{who || "—"}</Link>
                ) : (
                  <p className="font-display text-lg font-bold">{t("cabinet.client")}: {who || "—"}</p>
                )}
                <p className="mt-1 text-xs text-ink-2">{df.format(new Date(o.created_at))}{o.specialist_services?.title ? ` · ${o.specialist_services.title}` : ""}</p>
              </div>
              <Badge tone={tone[o.status]}>{t(`cabinet.statuses.${o.status}`)}</Badge>
            </div>
            <p className="mt-4 whitespace-pre-line text-ink-1">{o.message}</p>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink-2">
              {o.budget_tjs != null && <span>{t("cabinet.budget")}: <b className="text-ink-0">{formatTjs(o.budget_tjs)} TJS</b></span>}
              {mode === "specialist" && <span>{t("cabinet.contact")}: <a href={`tel:${o.contact_phone}`} className="font-semibold text-purple">{o.contact_phone}</a></span>}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {mode === "specialist" && o.status === "new" && (<>
                <Button size="sm" loading={busy === o.id} onClick={() => setStatus(o.id, "accepted")}>{t("cabinet.actions.accept")}</Button>
                <Button size="sm" variant="outline" disabled={busy === o.id} onClick={() => setStatus(o.id, "declined")}>{t("cabinet.actions.decline")}</Button>
              </>)}
              {mode === "specialist" && o.status === "accepted" && (
                <Button size="sm" loading={busy === o.id} onClick={() => setStatus(o.id, "done")}>{t("cabinet.actions.done")}</Button>
              )}
              {mode === "client" && (o.status === "new" || o.status === "accepted") && (
                <Button size="sm" variant="outline" loading={busy === o.id} onClick={() => setStatus(o.id, "cancelled")}>{t("cabinet.actions.cancel")}</Button>
              )}
              {mode === "client" && o.status === "done" && !hasReview && reviewing !== o.id && (
                <Button size="sm" onClick={() => setReviewing(o.id)}>{t("cabinet.actions.review")}</Button>
              )}
            </div>
            {reviewing === o.id && (
              <ReviewForm orderId={o.id} onDone={() => { setReviewing(null); void load(); }} onCancel={() => setReviewing(null)} />
            )}
          </article>
        );
      })}
    </div>
  );
}
