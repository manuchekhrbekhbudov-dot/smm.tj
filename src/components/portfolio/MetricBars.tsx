"use client";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

type M = { before: number; after: number; unit?: "%" };
const fmt = (n: number, unit?: string) => (unit ? `${n.toString().replace(".", ",")}${unit}` : n.toLocaleString("ru-RU"));

/** Before vs after bars per metric, animated on scroll. */
export function MetricBars({ metrics }: { metrics: Record<"followers" | "reach" | "engagement" | "leads", M> }) {
  const t = useTranslations();
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {(Object.keys(metrics) as (keyof typeof metrics)[]).map((k, i) => {
        const m = metrics[k];
        const max = Math.max(m.after, m.before, 1);
        const growth = m.before > 0 ? Math.round(((m.after - m.before) / m.before) * 100) : null;
        return (
          <div key={k} className="rounded-[var(--radius-md)] glass p-6">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-ink-2">{t(`portfolio.metrics.${k}`)}</p>
              {growth !== null && <span className="rounded-full bg-success/15 px-2.5 py-1 text-xs font-bold text-success">+{growth.toLocaleString("ru-RU")}%</span>}
            </div>
            <p className="tabular mt-2 font-display text-3xl font-black text-gradient">{fmt(m.after, m.unit)}</p>
            <div className="mt-5 space-y-2.5">
              {(["before", "after"] as const).map((b) => (
                <div key={b} className="flex items-center gap-3 text-xs">
                  <span className="w-12 text-ink-2">{t(`common.${b}`)}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-ink-3">
                    <motion.div
                      className={b === "after" ? "h-full rounded-full bg-gradient-primary" : "h-full rounded-full bg-ink-2"}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${Math.max((m[b] / max) * 100, m[b] > 0 ? 2 : 0)}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.4, delay: 0.2 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                  <span className="tabular w-20 text-right text-ink-1">{fmt(m[b], m.unit)}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
