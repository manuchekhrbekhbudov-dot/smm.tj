"use client";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { TiltCard } from "@/components/fx/TiltCard";
import { Avatar } from "@/components/ui/Avatar";
import { Stars } from "@/components/ui/Stars";
import { Badge } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { formatTjs } from "@/content/site";
import type { Specialist } from "@/lib/supabase/types";
import { activePlan } from "@/lib/plans";
import { PlanBadge } from "@/components/ui/PlanBadge";

export function SpecialistCard({ s }: { s: Specialist }) {
  const t = useTranslations();
  const name = s.profiles?.full_name || "—";
  const premium = activePlan(s) === "premium";
  const banned = !!s.banned_at;
  return (
    <Link href={{ pathname: "/specialist", query: { id: s.id } }} data-cursor={t("common.view")} className="relative block h-full" aria-label={banned ? `${name} — ${t("trust.bannedCard")}` : undefined}>
      {banned && (
        // Removed by the platform: the card stays visible, crossed out in red, with the reason.
        <span aria-hidden className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-[var(--radius-lg)]">
          <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
            <line x1="2" y1="4" x2="98" y2="96" stroke="#ef4444" strokeWidth="1.6" strokeLinecap="round" vectorEffect="non-scaling-stroke" style={{ strokeWidth: 6 }} />
          </svg>
          <span className="absolute left-1/2 top-1/2 w-[86%] -translate-x-1/2 -translate-y-1/2 -rotate-6 rounded-2xl border-2 border-danger bg-bg-0/90 px-4 py-3 text-center text-sm font-extrabold uppercase leading-snug tracking-wide text-danger shadow-lg">
            ⛔ {t("trust.bannedCard")}
          </span>
        </span>
      )}
      <TiltCard className={banned ? "flex h-full flex-col p-6 opacity-60 grayscale" : premium ? "flex h-full flex-col p-6 gradient-border glow-sm" : "flex h-full flex-col p-6"} max={6}>
        <div className="flex items-start gap-4">
          <Avatar name={name} url={s.profiles?.avatar_url} size={60} />
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-lg font-bold">{name}</h3>
            <PlanBadge s={s} className="mt-1" />
            <p className="mt-0.5 line-clamp-2 text-sm text-ink-1">{s.headline}</p>
            {s.profiles?.city && <p className="mt-1 text-xs text-ink-2">{t(`cities.${s.profiles.city}`)}</p>}
          </div>
        </div>
        <div className="mb-5 mt-5 flex flex-wrap gap-1.5">
          {s.specialties.slice(0, 3).map((sp) => <Badge key={sp} tone="neutral">{t(`specialties.${sp}.title`)}</Badge>)}
          {s.specialties.length > 3 && <Badge tone="neutral">+{s.specialties.length - 3}</Badge>}
        </div>
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-ink-3 pt-5">
          <div>
            {s.reviews_count > 0 ? (
              <div className="flex items-center gap-2">
                <Stars value={Number(s.rating_avg)} size={15} />
                <span className="text-sm font-semibold">{Number(s.rating_avg).toFixed(1)}</span>
                <span className="text-xs text-ink-2">· {t("specialist.reviewsCount", { count: s.reviews_count })}</span>
              </div>
            ) : (
              <Badge>{t("specialist.newcomer")}</Badge>
            )}
          </div>
          <div className="text-right">
            {s.min_price != null ? (
              <p className="text-sm text-ink-2">{t("common.from")} <span className="tabular font-display text-lg font-bold text-ink-0">{formatTjs(s.min_price)}</span> TJS</p>
            ) : null}
          </div>
        </div>
        <span className="sr-only"><Icon name="arrow" /></span>
      </TiltCard>
    </Link>
  );
}
