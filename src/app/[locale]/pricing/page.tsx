import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SiteShell } from "@/components/layout/SiteShell";
import { PageHero } from "@/components/layout/PageHero";
import { PricingCards } from "@/components/home/PricingCards";
import { Faq } from "@/components/home/Faq";
import { Reveal } from "@/components/fx/Reveal";
import { Card } from "@/components/ui/Card";
import { buttonClasses } from "@/components/ui/buttonClasses";
import { packageSlugs, featuredPackage } from "@/content/site";
import { cn } from "@/lib/cn";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pricing" });
  return { title: t("title"), description: t("subtitle") };
}

export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const rows = t.raw("pricing.rows") as string[];

  return (
    <SiteShell>
      <PageHero eyebrow={t("nav.pricing")} title={t("home.pricing.title")} subtitle={t("pricing.subtitle")} />
      <section className="container-x pb-24"><PricingCards /></section>

      <section className="container-x pb-24">
        <Reveal><h2 className="mb-8 text-h2 font-bold">{t("pricing.compare")}</h2></Reveal>
        <Reveal>
          <div className="overflow-x-auto rounded-[var(--radius-lg)] glass">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b border-ink-3">
                  <th scope="col" className="p-5 text-sm font-semibold text-ink-2">{t("pricing.feature")}</th>
                  {packageSlugs.map((p) => (
                    <th key={p} scope="col" className={cn("p-5 font-display text-lg", p === featuredPackage && "text-gradient")}>{t(`pricing.packages.${p}.name`)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r} className="border-b border-ink-3 transition-colors last:border-0 hover:bg-purple/5">
                    <th scope="row" className="p-5 font-medium text-ink-1">{r}</th>
                    {packageSlugs.map((p) => (
                      <td key={p} className={cn("p-5", p === featuredPackage && "bg-purple/5 font-semibold")}>{(t.raw(`pricing.values.${p}`) as string[])[i]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </section>

      <section className="container-x pb-24">
        <Card glowBorder className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 className="text-h2 font-bold">{t("pricing.custom")}</h2>
            <p className="mt-2 text-ink-1">{t("pricing.customText")}</p>
          </div>
          <Link href="/contact" className={buttonClasses("primary", "lg", "shrink-0")}>{t("pricing.customCta")}</Link>
        </Card>
      </section>

      <section className="container-x grid gap-12 pb-24 lg:grid-cols-[1fr_1.6fr]">
        <h2 className="text-h1 font-black">{t("home.faq.title")}</h2>
        <Faq />
      </section>
    </SiteShell>
  );
}
