"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getSupabase } from "@/lib/supabase/client";
import { specialtySlugs, formatTjs } from "@/content/site";
import { Skeleton } from "@/components/ui/Notice";

type Row = { slug: string; n: number; min: number; median: number; max: number };
const MIN_DATA = 2;

const median = (a: number[]) => { const s = [...a].sort((x, y) => x - y); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2); };

/** Real price ranges per SMM direction, computed live from approved specialists' price lists. */
export function PriceGuide() {
  const t = useTranslations();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const sb = getSupabase(); if (!sb) { setRows([]); return; }
    void sb.from("mp_specialists").select("specialties, min_price").eq("status", "approved").not("min_price", "is", null).limit(1000).then(({ data }) => {
      const list = (data as { specialties: string[]; min_price: number }[]) ?? [];
      setTotal(list.length);
      setRows(specialtySlugs.map((slug) => {
        const prices = list.filter((s) => s.specialties?.includes(slug)).map((s) => Number(s.min_price)).filter((x) => x > 0);
        return { slug, n: prices.length, min: prices.length ? Math.min(...prices) : 0, median: prices.length ? median(prices) : 0, max: prices.length ? Math.max(...prices) : 0 };
      }));
    });
  }, []);

  if (rows === null) return <Skeleton className="h-96" />;
  return (
    <div>
      <div className="overflow-x-auto rounded-[var(--radius-lg)] glass">
        <table className="w-full min-w-[560px] text-left">
          <thead className="text-sm text-ink-2">
            <tr><th className="p-4">{t("prices.direction")}</th><th className="p-4">{t("prices.specialists")}</th><th className="p-4">{t("prices.from")}</th><th className="p-4">{t("prices.median")}</th><th className="p-4">{t("prices.to")}</th><th className="p-4" /></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.slug} className="border-t border-ink-3">
                <td className="p-4 font-semibold">{t(`specialties.${r.slug}.title`)}</td>
                <td className="p-4 tabular text-ink-1">{r.n}</td>
                {r.n >= MIN_DATA ? (<>
                  <td className="p-4 tabular">{formatTjs(r.min)}</td>
                  <td className="p-4 tabular font-bold text-purple">{formatTjs(r.median)} TJS</td>
                  <td className="p-4 tabular">{formatTjs(r.max)}</td>
                </>) : <td colSpan={3} className="p-4 text-sm text-ink-2">{t("prices.notEnough")}</td>}
                <td className="p-4 text-right"><Link href={{ pathname: "/specialists", query: { s: r.slug } }} className="text-sm font-semibold text-purple">{t("prices.see")} →</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-sm text-ink-2">{t("prices.note", { n: total })}</p>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {(t.raw("prices.tips") as { title: string; text: string }[]).map((x) => (
          <div key={x.title} className="rounded-[var(--radius-lg)] glass glass-edge p-6">
            <h3 className="text-h3 font-bold">{x.title}</h3>
            <p className="mt-2 text-ink-1">{x.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
