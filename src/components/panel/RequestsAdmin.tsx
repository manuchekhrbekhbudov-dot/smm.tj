"use client";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getSupabase } from "@/lib/supabase/client";
import { formatTjs } from "@/content/site";
import { SITE_URL } from "@/lib/site-url";
import { Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Notice";
import { ago, type Req } from "@/components/requests/RequestsBoard";
import { cn } from "@/lib/cn";

type Filter = "open" | "closed" | "hidden" | "all";

/** Director: every client request, with hide / show (spam, bad content) and a link to the public page. */
export function RequestsAdmin() {
  const t = useTranslations();
  const [f, setF] = useState<Filter>("open");
  const [rows, setRows] = useState<Req[] | null>(null);
  const load = useCallback(async () => {
    setRows(null);
    let q = getSupabase()!.from("mp_requests").select("*").order("created_at", { ascending: false }).limit(300);
    if (f !== "all") q = q.eq("status", f);
    const { data } = await q;
    setRows((data as Req[]) ?? []);
  }, [f]);
  useEffect(() => { void load(); }, [load]);
  const set = async (r: Req, status: Req["status"]) => {
    const { error } = await getSupabase()!.from("mp_requests").update({ status }).eq("id", r.id);
    if (!error) void load();
  };
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {(["open", "closed", "hidden", "all"] as Filter[]).map((k) => (
          <button key={k} type="button" onClick={() => setF(k)} aria-pressed={f === k}
            className={cn("rounded-full px-4 py-2 text-sm font-semibold", f === k ? "bg-gradient-primary text-white" : "glass text-ink-1")}>{t(`panel.reqFilter.${k}`)}</button>
        ))}
      </div>
      {rows === null ? <Skeleton className="h-40" /> : rows.length === 0 ? <p className="text-ink-2">{t("admin.empty")}</p> : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="rounded-[var(--radius-md)] glass p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <a href={`${SITE_URL}/tg/request/?id=${r.id}`} target="_blank" rel="noopener noreferrer" className="font-semibold hover:text-purple [overflow-wrap:anywhere]">{r.title} ↗</a>
                <span className="font-bold text-purple">{r.budget_tjs ? `${formatTjs(r.budget_tjs)} TJS` : t("requests.byAgreement")}</span>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-ink-1 [overflow-wrap:anywhere]">{r.description}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-2">
                <Badge tone={r.status === "open" ? "success" : r.status === "hidden" ? "danger" : "neutral"}>{t(`requests.status.${r.status}`)}</Badge>
                <span>💼 {t("requests.offersCount", { count: r.offers_count })}</span>
                <span>{ago(r.created_at, t)}</span>
                <span className="ml-auto flex gap-2">
                  {r.status !== "hidden"
                    ? <Button size="sm" variant="outline" onClick={() => set(r, "hidden")}>{t("requests.hide")}</Button>
                    : <Button size="sm" variant="outline" onClick={() => set(r, "open")}>{t("requests.unhide")}</Button>}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
