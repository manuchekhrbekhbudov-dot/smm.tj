import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { SiteShell } from "@/components/layout/SiteShell";
import { PageHero } from "@/components/layout/PageHero";
import { Reveal } from "@/components/fx/Reveal";
import { Card, Badge } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { BeforeAfter } from "@/components/portfolio/BeforeAfter";
import { MetricBars } from "@/components/portfolio/MetricBars";
import { CtaBand } from "@/components/home/CtaBand";
import { caseSlugs, cases, type CaseSlug } from "@/content/site";

const isCase = (s: string): s is CaseSlug => (caseSlugs as readonly string[]).includes(s);

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => caseSlugs.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isCase(slug)) return {};
  const t = await getTranslations({ locale, namespace: "portfolio.items" });
  return { title: t(`${slug}.title`), description: t(`${slug}.task`) };
}

export default async function CasePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isCase(slug)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations();
  const c = cases[slug];
  const idx = caseSlugs.indexOf(slug);
  const next = caseSlugs[(idx + 1) % caseSlugs.length];

  return (
    <SiteShell>
      <PageHero eyebrow={`${c.client} · ${t(`portfolio.items.${slug}.industry`)}`} title={t(`portfolio.items.${slug}.title`)}>
        <Reveal delay={0.5} className="mt-8 flex flex-wrap gap-2">
          {c.services.map((s) => <Badge key={s}>{t(`services.items.${s}.title`)}</Badge>)}
          <Badge tone="neutral">{t("portfolio.duration")}: {t(`portfolio.items.${slug}.duration`)}</Badge>
        </Reveal>
      </PageHero>

      <section className="container-x pb-20">
        <Reveal dir="scale">
          <BeforeAfter hue={c.hue} client={c.client} followers={c.metrics.followers} reach={c.metrics.reach} />
        </Reveal>
      </section>

      <section className="container-x grid gap-6 pb-20 md:grid-cols-2">
        <Reveal><Card className="h-full"><p className="text-sm font-bold uppercase tracking-widest text-purple">{t("portfolio.task")}</p><p className="mt-4 text-xl">{t(`portfolio.items.${slug}.task`)}</p></Card></Reveal>
        <Reveal delay={0.1}><Card glowBorder className="h-full"><p className="text-sm font-bold uppercase tracking-widest text-purple">{t("portfolio.solution")}</p><p className="mt-4 text-xl">{t(`portfolio.items.${slug}.solution`)}</p></Card></Reveal>
      </section>

      <section className="container-x pb-24">
        <h2 className="mb-8 text-h2 font-bold">{t("portfolio.results")}</h2>
        <MetricBars metrics={c.metrics} />
      </section>

      <section className="container-x pb-12">
        <Link href={`/portfolio/${next}`} data-cursor={t("common.next")} className="group block border-y border-ink-3 py-12">
          <p className="text-sm uppercase tracking-widest text-ink-2">{t("common.next")}</p>
          <p className="mt-3 flex items-center justify-between gap-6 font-display text-h1 font-black transition-colors group-hover:text-purple">
            {cases[next].client}
            <Icon name="arrow" className="h-10 w-10 shrink-0 transition-transform duration-500 group-hover:translate-x-3" />
          </p>
        </Link>
      </section>
      <CtaBand />
    </SiteShell>
  );
}
