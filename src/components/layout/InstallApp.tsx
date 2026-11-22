"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { SITE_URL } from "@/lib/site-url";

type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
type Kind = "inapp" | "ios-safari" | "ios-other" | "samsung" | "yandex" | "firefox" | "android" | "desktop";

/** Which browser are we in? Each one installs a web app differently. */
function detect(): Kind {
  const ua = navigator.userAgent;
  if (/Instagram|FBAN|FBAV|Telegram|TelegramBot|Line\/|wv\)/i.test(ua) || (/iPhone|iPad/i.test(ua) && !/Safari/i.test(ua))) return "inapp";
  if (/iPhone|iPad|iPod/i.test(ua)) return /CriOS|FxiOS|EdgiOS|YaBrowser/i.test(ua) ? "ios-other" : "ios-safari";
  if (/SamsungBrowser/i.test(ua)) return "samsung";
  if (/YaBrowser|YaApp/i.test(ua)) return "yandex";
  if (/Firefox/i.test(ua)) return "firefox";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

/**
 * "Install as an app": the native prompt when the browser offers one, otherwise short
 * step-by-step instructions for the visitor's own browser. Shown on every phone.
 */
export function InstallApp({ className = "" }: { className?: string }) {
  const t = useTranslations("install");
  const [evt, setEvt] = useState<PromptEvent | null>(null);
  const [kind, setKind] = useState<Kind | null>(null);
  const [installed, setInstalled] = useState(false);
  const [help, setHelp] = useState(false);

  useEffect(() => {
    const base = new URL(SITE_URL).pathname.replace(/\/$/, "");
    if ("serviceWorker" in navigator) navigator.serviceWorker.register(`${base}/sw.js`, { scope: `${base}/` }).catch(() => {});
    setInstalled(window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
    setKind(detect());
    const on = (e: Event) => { e.preventDefault(); setEvt(e as PromptEvent); };
    window.addEventListener("beforeinstallprompt", on);
    window.addEventListener("appinstalled", () => setInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", on);
  }, []);

  if (installed || !kind || (kind === "desktop" && !evt)) return null;

  const click = async () => {
    if (evt) {
      await evt.prompt();
      const r = await evt.userChoice.catch(() => null);
      setEvt(null);
      if (r?.outcome === "accepted") setInstalled(true);
      return;
    }
    setHelp((v) => !v);
  };

  return (
    <div className={className}>
      <button type="button" onClick={click} aria-expanded={help}
        className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-white glow-sm">
        📲 {t("button")}
      </button>
      {help && (
        <div className="mt-3 max-w-sm rounded-[var(--radius-md)] border border-purple/30 bg-bg-1 p-4 text-sm text-ink-1">
          <p className="font-semibold text-ink-0">{t("howTitle")}</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            {(t.raw(`steps.${kind}`) as string[]).map((s) => <li key={s}>{s}</li>)}
          </ol>
          {kind === "inapp" && (
            <button type="button" className="mt-3 font-semibold text-purple underline"
              onClick={() => { void navigator.clipboard?.writeText(`${SITE_URL}/tg/`); }}>{t("copyLink")}</button>
          )}
        </div>
      )}
    </div>
  );
}
