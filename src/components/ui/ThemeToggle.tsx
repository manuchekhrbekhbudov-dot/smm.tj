"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

export const THEME_KEY = "smmtj:theme";
type Theme = "dark" | "light";

/** Inline script for <head>: applies the saved theme before paint (no flash). */
export const themeScript =
  `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t;}catch(e){}` +
  // After a deploy an already-open tab can request chunks that no longer exist: reload once.
  `(function(){function r(m){if(/ChunkLoadError|Loading chunk|dynamically imported module/i.test(String(m))){try{if(sessionStorage.getItem("smmtj:reloaded")==="1")return;sessionStorage.setItem("smmtj:reloaded","1");}catch(e){}location.reload();}}` +
  `addEventListener("error",function(e){r(e.message)});addEventListener("unhandledrejection",function(e){r(e.reason&&(e.reason.name+" "+e.reason.message))});` +
  `addEventListener("load",function(){setTimeout(function(){try{sessionStorage.removeItem("smmtj:reloaded")}catch(e){}},10000)});})();`;

export function ThemeToggle() {
  const t = useTranslations("common");
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem(THEME_KEY, next); } catch {}
  };

  const isLight = theme === "light";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isLight ? t("themeDark") : t("themeLight")}
      title={isLight ? t("themeDark") : t("themeLight")}
      className="relative flex h-10 w-10 shrink-0 items-center rounded-full glass p-1 min-[400px]:w-[72px]"
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-primary text-white glow-sm"
        style={{ marginLeft: isLight ? "auto" : 0 }}
      >
        {isLight ? (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
          </svg>
        )}
      </motion.span>
    </button>
  );
}
