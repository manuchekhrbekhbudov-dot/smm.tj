"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const KEY = "smmtj_guide_seen";

/** One-time hint in the cabinet: "New here? Read the step-by-step guide". */
export function GuideHint({ who }: { who: "client" | "specialist" }) {
  const t = useTranslations("guide");
  const [show, setShow] = useState(false);
  useEffect(() => { try { setShow(localStorage.getItem(KEY) !== "1"); } catch { /* ignore */ } }, []);
  if (!show) return null;
  const close = () => { try { localStorage.setItem(KEY, "1"); } catch { /* ignore */ } setShow(false); };
  return (
    <div className="mt-6 flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] border border-purple/30 bg-purple/10 px-5 py-4 text-sm">
      <span className="text-xl" aria-hidden>🧭</span>
      <span className="flex-1">{t("hint")}</span>
      <Link href={{ pathname: "/guide", hash: who }} onClick={close} className="rounded-full bg-gradient-primary px-4 py-2 font-semibold text-white">{t("hintCta")}</Link>
      <button type="button" onClick={close} aria-label={t("hintClose")} className="px-2 text-lg text-ink-2 hover:text-ink-0">×</button>
    </div>
  );
}
