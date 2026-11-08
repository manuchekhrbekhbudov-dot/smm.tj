"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getSupabase } from "@/lib/supabase/client";
import { dateLocale } from "@/lib/date";
import { Notice } from "@/components/ui/Notice";

type State = { created_at: string; strikes: number; warned_at: string | null; bonus_given_at: string | null; good: number };

/** Specialist cabinet: welcome + free-week progress, bonus received, warning before removal. */
export function TrustBanner({ specialistId }: { specialistId: string }) {
  const t = useTranslations("trust");
  const locale = useLocale();
  const [s, setS] = useState<State | null>(null);

  useEffect(() => {
    const sb = getSupabase()!;
    void (async () => {
      const { data, error } = await sb.from("mp_specialists").select("created_at, strikes, warned_at, bonus_given_at").eq("id", specialistId).maybeSingle();
      if (error || !data) return;
      const until = new Date(new Date(data.created_at).getTime() + 30 * 86400000).toISOString();
      const { count } = await sb.from("mp_reviews").select("id", { count: "exact", head: true })
        .eq("specialist_id", specialistId).gte("rating", 4).eq("hidden", false).lte("created_at", until);
      setS({ ...(data as Omit<State, "good">), good: count ?? 0 });
    })();
  }, [specialistId]);

  if (!s) return null;
  const end = new Date(new Date(s.created_at).getTime() + 30 * 86400000);
  const fmt = (d: Date) => d.toLocaleDateString(dateLocale(locale), { day: "numeric", month: "long" });
  const bonusFresh = s.bonus_given_at && Date.now() - new Date(s.bonus_given_at).getTime() < 7 * 86400000;

  return (
    <div className="mt-6 space-y-3">
      {s.warned_at && s.strikes >= 2 && <Notice tone="danger">⚠️ {t("warning", { n: s.strikes })}</Notice>}
      {bonusFresh && <Notice tone="success">🎉 {t("bonusGiven")}</Notice>}
      {!s.bonus_given_at && Date.now() < end.getTime() && (
        <Notice tone="info">
          <b>👋 {t("welcomeTitle")}</b> {t("welcomeText", { date: fmt(end) })}
          <span className="mt-3 flex items-center gap-3">
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-ink-3"><span className="block h-full rounded-full bg-gradient-primary" style={{ width: `${Math.min(s.good, 3) / 3 * 100}%` }} /></span>
            <span className="text-xs font-semibold tabular">{Math.min(s.good, 3)}/3</span>
          </span>
        </Notice>
      )}
    </div>
  );
}
