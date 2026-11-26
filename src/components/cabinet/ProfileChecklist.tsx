"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getSupabase } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";
import { notifyProfileReady } from "@/lib/telegram";

export type Check = Record<"photo" | "name" | "headline" | "about" | "directions" | "prices" | "video", boolean>;
const ORDER: (keyof Check)[] = ["photo", "name", "headline", "about", "directions", "prices", "video"];
const TAB: Record<keyof Check, string> = { photo: "profile", name: "profile", headline: "profile", about: "profile", directions: "profile", prices: "packages", video: "portfolio" };

export async function loadCheck(id: string): Promise<Check | null> {
  const { data, error } = await getSupabase()!.rpc("mp_profile_check", { sid: id });
  return error || !data ? null : (data as Check);
}
export const percent = (c: Check) => Math.round((ORDER.filter((k) => c[k]).length / ORDER.length) * 100);

/** "Your profile is 60% complete": what is missing before the director can approve it. */
export function ProfileChecklist({ userId, refreshKey, onGo }: { userId: string; refreshKey: unknown; onGo: (tab: string) => void }) {
  const t = useTranslations("checklist");
  const [c, setC] = useState<Check | null>(null);
  useEffect(() => {
    void loadCheck(userId).then((x) => {
      setC(x);
      // complete → the director gets a Telegram note (only if the profile is waiting for approval; server-checked)
      if (x && percent(x) === 100) void notifyProfileReady(userId);
    });
  }, [userId, refreshKey]);
  if (!c) return null;
  const p = percent(c);
  if (p === 100) return null;
  return (
    <section className="mt-6 rounded-[var(--radius-lg)] border border-warning/40 bg-warning/5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold">{t("title", { p })}</h2>
        <span className="text-sm text-ink-2">{t("hint")}</span>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-ink-3" role="progressbar" aria-valuenow={p} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-gradient-primary transition-all" style={{ width: `${p}%` }} />
      </div>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {ORDER.map((k) => (
          <li key={k}>
            <button type="button" disabled={c[k]} onClick={() => onGo(TAB[k])}
              className={cn("flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm", c[k] ? "text-ink-2" : "glass font-semibold hover:text-purple")}>
              <span aria-hidden>{c[k] ? "✅" : "⬜"}</span>{t(`items.${k}`)}{!c[k] && <span className="ml-auto text-purple">→</span>}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
