import { getTranslations, setRequestLocale } from "next-intl/server";
import { pageAlternates } from "@/lib/site-url";
import { SiteShell } from "@/components/layout/SiteShell";
import { PageHero } from "@/components/layout/PageHero";
import { PriceGuide } from "@/components/prices/PriceGuide";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "prices" });
  return { title: t("title"), description: t("subtitle"), alternates: pageAlternates(locale, "/prices") };
}

export default async function PricesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("prices");
  return (
    <SiteShell>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />
      <section className="container-x pb-24"><PriceGuide /></section>
    </SiteShell>
  );
}
