"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth";
import { LAUNCH_AT } from "@/content/launch";

const KEY = "smmtj:launchbar-closed";
const setH = (px: number) => document.documentElement.style.setProperty("--banner-h", `${px}px`);

/** Pre-launch announcement above the header. Hidden after launch or when closed (per browser). */
export function LaunchBar() {
  const t = useTranslations("launch");
  const { session } = useAuth();
  const [visible, setVisible] = useState(true); // server HTML shows it (pre-launch build)
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    let closed = false;
    try { closed = localStorage.getItem(KEY) === "1"; } catch {}
    const ms = LAUNCH_AT.getTime() - Date.now();
    if (closed || ms <= -86400000) { setVisible(false); setH(0); return; }
    setDays(Math.max(0, Math.ceil(ms / 86400000)));
    setH(40);
  }, []);

  if (!visible) return null;

  const close = () => {
    setVisible(false); setH(0);
    try { localStorage.setItem(KEY, "1"); } catch {}
  };

  return (
    <div role="region" aria-label={t("short")} className="relative z-[60] flex h-10 items-center justify-center gap-2 bg-gradient-primary px-10 text-xs font-semibold text-white sm:gap-3 sm:text-sm">
      <span aria-hidden>🚀</span>
      <span className="hidden truncate md:inline">{t("long")}</span>
      <span className="truncate md:hidden">{t("short")}</span>
      {days !== null && (
        <span className="hidden shrink-0 rounded-full bg-white/20 px-2.5 py-0.5 sm:inline">{days > 0 ? t("left", { days }) : t("today")}</span>
      )}
      {!session && (
        <Link href={{ pathname: "/login", query: { role: "specialist" } }} className="shrink-0 rounded-full bg-white px-3 py-1 text-[#5b21b6] transition-transform hover:scale-105">
          {t("cta")} →
        </Link>
      )}
      <button type="button" onClick={close} aria-label={t("close")} className="absolute right-2 flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/20">✕</button>
    </div>
  );
}
