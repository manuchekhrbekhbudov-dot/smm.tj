"use client";
import { useTranslations } from "next-intl";
import { activePlan } from "@/lib/plans";
import type { Specialist } from "@/lib/supabase/types";
import { cn } from "@/lib/cn";

const styles = {
  top: "bg-success/15 text-success border-success/30",
  standard: "bg-warning/15 text-warning border-warning/40",
  premium: "bg-gradient-primary text-white border-transparent glow-sm",
} as const;

/** ТОП / СТАНДАРТ / ПРЕМИУМ badge for a specialist with an active paid plan. */
export function PlanBadge({ s, className }: { s: Pick<Specialist, "plan" | "plan_until">; className?: string }) {
  const t = useTranslations("plans");
  const p = activePlan(s);
  if (!p) return null;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide", styles[p], className)}>
      {p === "premium" ? "★" : p === "standard" ? "◆" : "▲"} {t(`names.${p}`)}
    </span>
  );
}
