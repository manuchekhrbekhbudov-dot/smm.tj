import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { SiteShell } from "@/components/layout/SiteShell";
import { PageHero } from "@/components/layout/PageHero";
import { Reveal } from "@/components/fx/Reveal";
import { Magnetic } from "@/components/fx/Magnetic";
import { TiltCard } from "@/components/fx/TiltCard";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { buttonClasses } from "@/components/ui/buttonClasses";
import { CtaBand } from "@/components/home/CtaBand";
import { serviceSlugs, servicePrice, type ServiceSlug } from "@/content/site";

const isSlug = (s: string): s is ServiceSlug => (serviceSlugs as readonly string[]).includes(s);

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => serviceSlugs.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isSlug(slug)) return {};
  const t = await getTranslations({ locale, namespace: "services.items" });
  return { title: t(`${slug}.title`), description: t(`${slug}.short`) };
}

export default async function ServicePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isSlug(slug)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("services");
  const features = t.raw(`items.${slug}.features`) as string[];
  const others = serviceSlugs.filter((s) => s !== slug).slice(0, 3);

  return (
    <SiteShell>
      <PageHero eyebrow={t("title")} title={t(`items.${slug}.title`)} subtitle={t(`items.${slug}.description`)}>
        <Reveal delay={0.6} className="mt-10 flex flex-wrap items-center gap-6">
          <Magnetic>
            <Link href={{ pathname: "/contact", query: { service: slug } }} data-cursor className={buttonClasses("primary", "lg")}>
              {t("cta")} <Icon name="arrow" className="h-5 w-5" />
            </Link>
          </Magnetic>
          <p className="text-ink-2">
            {t("from")} <span className="tabular font-display text-2xl font-bold text-ink-0">{servicePrice[slug].toLocaleString("ru-RU")}</span> TJS
          </p>
        </Reveal>
      </PageHero>

      <section className="container-x grid gap-10 pb-24 lg:grid-cols-[1fr_1.3fr]">
        <Reveal dir="right">
          <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-[40px] glass">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#8b5cf6_0%,transparent_50%),radial-gradient(circle_at_70%_80%,#c026d3_0%,transparent_50%)] opacity-60" />
            <div className="absolute h-[70%] w-[70%] animate-spin-slow rounded-full border border-dashed border-white/25" />
            <span className="relative flex h-32 w-32 items-center justify-center rounded-[32px] bg-gradient-primary text-white glow-lg">
              <Icon name={slug} className="h-16 w-16" />
            </span>
          </div>
        </Reveal>
        <Card className="h-full">
          <h2 className="text-h2 font-bold">{t("includes")}</h2>
          <ul className="mt-8 space-y-5">
            {features.map((f, i) => (
              <li key={f}>
                <Reveal delay={i * 0.07} dir="left">
                  <div className="flex items-center gap-4 border-b border-ink-3 pb-5 text-lg">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple/20 text-purple"><Icon name="check" className="h-5 w-5" /></span>
                    {f}
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="container-x pb-12">
        <h2 className="mb-8 text-h2 font-bold">{t("other")}</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {others.map((s) => (
            <Link key={s} href={`/services/${s}`} className="block h-full">
              <TiltCard className="p-7">
                <Icon name={s} className="h-8 w-8 text-purple" />
                <h3 className="mt-5 text-h3 font-bold">{t(`items.${s}.title`)}</h3>
                <p className="mt-2 text-ink-1">{t(`items.${s}.short`)}</p>
              </TiltCard>
            </Link>
          ))}
        </div>
      </section>
      <CtaBand />
    </SiteShell>
  );
}
