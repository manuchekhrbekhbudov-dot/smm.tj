"use client";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";

/** "Checked by the director": the director looked at this specialist's real work. */
export function VerifiedBadge({ at, className }: { at?: string | null; className?: string }) {
  const t = useTranslations("verify");
  if (!at) return null;
  return (
    <span title={t("hint")} className={cn("inline-flex items-center gap-1 rounded-full border border-sky-400/40 bg-sky-400/15 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-sky-500", className)}>
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden><path fill="currentColor" d="M12 2l2.4 1.8 3-.2.9 2.9 2.5 1.7-1 2.8 1 2.8-2.5 1.7-.9 2.9-3-.2L12 22l-2.4-1.8-3 .2-.9-2.9-2.5-1.7 1-2.8-1-2.8 2.5-1.7.9-2.9 3 .2z" /><path fill="#fff" d="M10.6 15.6l-3.2-3.2 1.4-1.4 1.8 1.8 4.6-4.6 1.4 1.4z" /></svg>
      {t("badge")}
    </span>
  );
}
