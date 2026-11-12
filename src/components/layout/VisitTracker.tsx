"use client";
import { useEffect } from "react";
import { useLocale } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { getSupabase } from "@/lib/supabase/client";

/** Counts page views (path + where the visitor came from). No cookies, no personal data, no third parties. */
function sourceOf(): string {
  const p = new URLSearchParams(location.search).get("utm_source");
  if (p) return p.toLowerCase().slice(0, 40);
  const ref = document.referrer ? new URL(document.referrer).hostname : "";
  if (!ref || ref === location.hostname) return "direct";
  if (/instagram/.test(ref)) return "instagram";
  if (/t\.me|telegram/.test(ref)) return "telegram";
  if (/google/.test(ref)) return "google";
  if (/yandex/.test(ref)) return "yandex";
  if (/facebook|fb\./.test(ref)) return "facebook";
  if (/tiktok/.test(ref)) return "tiktok";
  return ref.replace(/^www\./, "").slice(0, 40);
}

export function VisitTracker() {
  const path = usePathname();
  const locale = useLocale();
  useEffect(() => {
    const key = `smmtj_v:${path}`;
    try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, "1"); } catch { /* private mode: still count */ }
    let src = "direct";
    try { src = sessionStorage.getItem("smmtj_src") || sourceOf(); sessionStorage.setItem("smmtj_src", src); } catch { src = sourceOf(); }
    void getSupabase()?.rpc("mp_track", { p_path: path, p_locale: locale, p_source: src });
  }, [path, locale]);
  return null;
}
