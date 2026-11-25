"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getSupabase } from "@/lib/supabase/client";
import { referralLink, type MyViews } from "@/lib/growth";
import { Tile, DailyColumns } from "@/components/admin/Analytics";
import { Skeleton } from "@/components/ui/Notice";

/** Specialist cabinet: real profile views + "invite a colleague" link. Hidden until growth.sql is applied. */
export function GrowthPanel({ userId }: { userId: string }) {
  const t = useTranslations("growth");
  const locale = useLocale();
  const [views, setViews] = useState<MyViews | null | undefined>(undefined);
  const [refs, setRefs] = useState<{ invited: number; approved: number } | null>(null);
  const [approved, setApproved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const sb = getSupabase()!;
    void Promise.all([
      sb.rpc("mp_my_views"),
      sb.rpc("mp_my_referrals"),
      sb.from("mp_specialists").select("status, banned_at").eq("id", userId).maybeSingle(),
    ]).then(([v, r, s]) => {
      setViews(v.error ? null : (v.data as MyViews));
      const row = Array.isArray(r.data) ? r.data[0] : r.data;
      setRefs(r.error || !row ? null : { invited: Number(row.invited), approved: Number(row.approved) });
      setApproved(s.data?.status === "approved" && !s.data?.banned_at);
    });
  }, [userId]);

  if (views === undefined) return <Skeleton className="mb-8 h-40" />;
  if (views === null) return null;

  const link = referralLink(userId, locale);
  const shareText = t("shareText");
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { /* ignore */ }
  };
  const diff = views.week - views.prev_week;

  return (
    <div className="mb-10 space-y-6">
      <section>
        <h2 className="font-display text-xl font-bold">👀 {t("viewsTitle")}</h2>
        <p className="mt-1 text-sm text-ink-2">{t("viewsHint")}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Tile label={t("today")} value={String(views.today)} />
          <Tile label={t("week")} value={String(views.week)}
            sub={views.prev_week || views.week ? (diff >= 0 ? `▲ ${diff} ${t("vsPrev")}` : `▼ ${-diff} ${t("vsPrev")}`) : undefined} />
          <Tile label={t("month")} value={String(views.month)} />
          <Tile label={t("total")} value={String(views.total)} />
        </div>
        {views.total > 0 && (
          <div className="mt-4">
            <DailyColumns title={t("days14")} data={views.days.map((d) => ({ key: d.day, value: d.n }))} locale={locale} unit={t("unit")} />
          </div>
        )}
        {views.total === 0 && <p className="mt-3 text-sm text-ink-1">{t("noViews")}</p>}
      </section>

      <section className="rounded-[var(--radius-lg)] border border-purple/30 bg-purple/5 p-6">
        <h2 className="font-display text-xl font-bold">🎁 {t("inviteTitle")}</h2>
        <p className="mt-2 text-ink-1">{t("inviteText")}</p>
        {approved ? (
          <>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input readOnly value={link} aria-label={t("inviteTitle")} onFocus={(e) => e.currentTarget.select()}
                className="h-11 min-w-0 flex-1 rounded-full bg-ink-3 px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-purple" />
              <button type="button" onClick={copy} className="h-11 shrink-0 rounded-full bg-gradient-primary px-5 text-sm font-semibold text-white">
                {copied ? `✓ ${t("copied")}` : t("copy")}
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <a className="rounded-full glass px-4 py-2 font-semibold" target="_blank" rel="noopener noreferrer"
                href={`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(shareText)}`}>Telegram</a>
              <a className="rounded-full glass px-4 py-2 font-semibold" target="_blank" rel="noopener noreferrer"
                href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${link}`)}`}>WhatsApp</a>
            </div>
            {refs && <p className="mt-4 text-sm text-ink-1">{t("inviteStats", { invited: refs.invited, approved: refs.approved })}</p>}
          </>
        ) : <p className="mt-3 text-sm font-semibold text-warning">{t("inviteAfterApproval")}</p>}
        <p className="mt-3 text-xs text-ink-2">{t("inviteRules")}</p>
      </section>
    </div>
  );
}
