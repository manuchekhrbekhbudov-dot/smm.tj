"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { SITE_URL } from "@/lib/site-url";

type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/** "Install as an app": native prompt on Android/Chrome, short instructions on iPhone. */
export function InstallApp({ className = "" }: { className?: string }) {
  const t = useTranslations("install");
  const [evt, setEvt] = useState<PromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [help, setHelp] = useState(false);

  useEffect(() => {
    const base = new URL(SITE_URL).pathname.replace(/\/$/, "");
    if ("serviceWorker" in navigator) navigator.serviceWorker.register(`${base}/sw.js`, { scope: `${base}/` }).catch(() => {});
    setInstalled(window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    const on = (e: Event) => { e.preventDefault(); setEvt(e as PromptEvent); };
    window.addEventListener("beforeinstallprompt", on);
    window.addEventListener("appinstalled", () => setInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", on);
  }, []);

  if (installed || (!evt && !ios)) return null;
  return (
    <div className={className}>
      <button type="button" onClick={async () => { if (evt) { await evt.prompt(); setEvt(null); } else setHelp((v) => !v); }}
        className="inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-sm font-semibold hover:glow-sm">
        📲 {t("button")}
      </button>
      {help && ios && <p className="mt-3 max-w-sm text-sm text-ink-1">{t("ios")}</p>}
    </div>
  );
}
