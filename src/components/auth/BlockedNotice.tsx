"use client";
import { useTranslations } from "next-intl";

export const DIRECTOR_TEL = "+992504440101";

/** Shown instead of login / order forms when the platform removed this account or device. */
export function BlockedNotice() {
  const t = useTranslations("trust");
  return (
    <div role="alert" className="rounded-[var(--radius-lg)] border border-danger/40 bg-danger/10 p-6 text-center">
      <p className="text-3xl" aria-hidden>⛔</p>
      <p className="mt-3 font-display text-lg font-bold">{t("blockedTitle")}</p>
      <p className="mt-2 text-sm text-ink-1">{t("blockedText")}</p>
      <a href={`tel:${DIRECTOR_TEL}`} className="mt-4 inline-flex rounded-full bg-gradient-primary px-6 py-3 font-semibold text-white">+992 50 444 01 01</a>
    </div>
  );
}
