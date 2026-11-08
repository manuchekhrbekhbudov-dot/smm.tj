import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteShell } from "@/components/layout/SiteShell";
import { PageHero } from "@/components/layout/PageHero";
import { PortfolioGrid } from "@/components/portfolio/PortfolioGrid";
import { Stats } from "@/components/home/Stats";
import { CtaBand } from "@/components/home/CtaBand";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "portfolio" });
  return { title: t("title"), description: t("subtitle") };
}

export default async function PortfolioPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  return (
    <SiteShell>
      <PageHero eyebrow={t("nav.portfolio")} title={t("home.portfolio.title")} subtitle={t("portfolio.subtitle")} />
      <section className="container-x pb-12"><PortfolioGrid /></section>
      <Stats />
      <CtaBand />
    </SiteShell>
  );
}
