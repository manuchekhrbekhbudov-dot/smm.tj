"use client";
import { useEffect, useState } from "react";
import { dateLocale } from "@/lib/date";
import { useTranslations, useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { getSupabase } from "@/lib/supabase/client";
import { withPlans } from "@/lib/plans";
import { PlanBadge } from "@/components/ui/PlanBadge";
import { SPECIALIST_SELECT, type Review, type Service, type Specialist } from "@/lib/supabase/types";
import { formatTjs } from "@/content/site";
import { safeHttpUrl, telegramUrl, whatsappUrl, instagramUrl, linkLabel } from "@/lib/links";
import { Avatar } from "@/components/ui/Avatar";
import { Stars } from "@/components/ui/Stars";
import { Badge, Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Notice, Skeleton } from "@/components/ui/Notice";
import { Reveal } from "@/components/fx/Reveal";
import { OrderForm } from "./OrderForm";

export function SpecialistProfile() {
  const t = useTranslations();
  const locale = useLocale();
  const id = useSearchParams().get("id") ?? "";
  const sb = getSupabase();
  const [s, setS] = useState<Specialist | null | undefined>(undefined);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    if (!sb || !/^[0-9a-f-]{36}$/i.test(id)) { setS(null); return; }
    let alive = true;
    Promise.all([
      sb.from("mp_specialists").select(SPECIALIST_SELECT).eq("id", id).maybeSingle(),
      sb.from("mp_specialist_services").select("*").eq("specialist_id", id).order("price_tjs"),
      sb.from("mp_reviews").select("*, profiles:mp_profiles!mp_reviews_client_id_fkey(full_name)").eq("specialist_id", id).eq("hidden", false).order("created_at", { ascending: false }),
    ]).then(async ([a, b, c]) => {
      const one = (a.data as unknown as Specialist) ?? null;
      const withPlan = one ? (await withPlans(sb, [one]))[0] : null;
      if (!alive) return;
      setS(withPlan);
      setServices((b.data as Service[]) ?? []);
      setReviews((c.data as unknown as Review[]) ?? []);
    });
    return () => { alive = false; };
  }, [sb, id]);

  useEffect(() => {
    if (s?.profiles?.full_name) document.title = `${s.profiles.full_name} · SMM.TJ`;
  }, [s]);

  if (!sb) return <Notice tone="warning">{t("common.notConfigured")}</Notice>;
  if (s === undefined) return <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]"><Skeleton className="h-96" /><Skeleton className="h-96" /></div>;
  if (s === null) return <Notice tone="warning">{t("specialist.notFound")}</Notice>;

  const name = s.profiles?.full_name || "—";
  const links = s.portfolio_links.map(safeHttpUrl).filter((x): x is string => !!x);
  const contacts = [
    s.telegram && telegramUrl(s.telegram) && { icon: "telegram" as const, label: "Telegram", href: telegramUrl(s.telegram)! },
    s.whatsapp && whatsappUrl(s.whatsapp) && { icon: "whatsapp" as const, label: "WhatsApp", href: whatsappUrl(s.whatsapp)! },
    s.instagram && instagramUrl(s.instagram) && { icon: "instagram" as const, label: "Instagram", href: instagramUrl(s.instagram)! },
  ].filter(Boolean) as { icon: "telegram" | "whatsapp" | "instagram"; label: string; href: string }[];
  const dateFmt = new Intl.DateTimeFormat(dateLocale(locale), { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1.6fr_1fr]">
      <div className="space-y-8">
        <Reveal>
          <Card className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <Avatar name={name} url={s.profiles?.avatar_url} size={112} className="glow-md" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-h2 font-bold">{name}</h1>
                <PlanBadge s={s} />
                {s.status === "approved" && <Badge tone="success"><Icon name="check" className="h-3.5 w-3.5" />{t("specialist.verified")}</Badge>}
              </div>
              <p className="mt-2 text-lg text-ink-1">{s.headline}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-2">
                {s.profiles?.city && <span className="inline-flex items-center gap-1.5"><Icon name="pin" className="h-4 w-4" />{t(`cities.${s.profiles.city}`)}</span>}
                <span>{s.experience_years > 0 ? t("specialist.years", { count: s.experience_years }) : t("specialist.noExperience")}</span>
                {s.reviews_count > 0 ? (
                  <span className="inline-flex items-center gap-2"><Stars value={Number(s.rating_avg)} size={15} /><b className="text-ink-0">{Number(s.rating_avg).toFixed(1)}</b> · {t("specialist.reviewsCount", { count: s.reviews_count })}</span>
                ) : <Badge>{t("specialist.newcomer")}</Badge>}
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {s.specialties.map((sp) => <Badge key={sp} tone="neutral">{t(`specialties.${sp}.title`)}</Badge>)}
              </div>
            </div>
          </Card>
        </Reveal>

        {s.bio && (
          <section>
            <h2 className="mb-4 text-h3 font-bold">{t("specialist.about")}</h2>
            <p className="whitespace-pre-line text-ink-1">{s.bio}</p>
          </section>
        )}

        <section>
          <h2 className="mb-4 text-h3 font-bold">{t("specialist.services")}</h2>
          {services.length === 0 ? <p className="text-ink-2">{t("specialist.noServices")}</p> : (
            <ul className="divide-y divide-ink-3 overflow-hidden rounded-[var(--radius-md)] glass">
              {services.map((sv) => (
                <li key={sv.id} className="flex flex-col gap-2 p-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold">{sv.title}</p>
                    {sv.description && <p className="mt-1 text-sm text-ink-1">{sv.description}</p>}
                  </div>
                  <p className="shrink-0 sm:text-right">
                    <span className="tabular font-display text-xl font-bold text-gradient">{formatTjs(sv.price_tjs)}</span> TJS
                    <span className="block text-xs text-ink-2">{t(`units.${sv.unit}`)}</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {links.length > 0 && (
          <section>
            <h2 className="mb-4 text-h3 font-bold">{t("specialist.portfolio")}</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {links.map((l) => (
                <li key={l}>
                  <a href={l} target="_blank" rel="noopener noreferrer nofollow ugc" className="group flex items-center justify-between gap-3 rounded-2xl border border-ink-3 p-4 transition-all hover:border-purple/50 hover:glow-sm">
                    <span className="truncate text-sm">{linkLabel(l)}</span>
                    <Icon name="arrowUpRight" className="h-4 w-4 shrink-0 text-ink-2 group-hover:text-purple" />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h2 className="mb-4 text-h3 font-bold">{t("specialist.reviews")}</h2>
          {reviews.length === 0 ? <p className="text-ink-2">{t("specialist.noReviews")}</p> : (
            <ul className="space-y-4">
              {reviews.map((r) => (
                <li key={r.id} className="rounded-[var(--radius-md)] glass p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold">{r.profiles?.full_name || "—"}</span>
                    <Stars value={r.rating} size={15} />
                  </div>
                  <p className="mt-3 whitespace-pre-line text-ink-1">{r.text}</p>
                  <p className="mt-3 text-xs text-ink-2">{dateFmt.format(new Date(r.created_at))}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <aside className="space-y-6 lg:sticky lg:top-28">
        <Card glowBorder>
          {s.min_price != null && (
            <p className="mb-6 text-ink-2">{t("common.from")} <span className="tabular font-display text-3xl font-bold text-ink-0">{formatTjs(s.min_price)}</span> TJS</p>
          )}
          <OrderForm specialistId={s.id} name={name} services={services} />
        </Card>
        {contacts.length > 0 && (
          <Card>
            <h2 className="mb-4 font-display text-lg font-bold">{t("specialist.contacts")}</h2>
            <div className="grid gap-2">
              {contacts.map((c) => (
                <a key={c.icon} href={c.href} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center gap-3 rounded-xl border border-ink-3 p-3 transition-all hover:border-purple/50 hover:glow-sm">
                  <Icon name={c.icon} className="h-5 w-5 text-purple" /> <span className="font-semibold">{c.label}</span>
                </a>
              ))}
            </div>
          </Card>
        )}
      </aside>
    </div>
  );
}
