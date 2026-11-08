import { getTranslations, setRequestLocale } from "next-intl/server";
import { ClientOnly } from "@/components/ui/ClientOnly";
import { SiteShell } from "@/components/layout/SiteShell";
import { PageHero } from "@/components/layout/PageHero";
import { Catalog } from "@/components/market/Catalog";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "catalog" });
  return { title: t("title"), description: t("subtitle") };
}

export default async function SpecialistsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("catalog");
  return (
    <SiteShell>
      <PageHero eyebrow="SMM.TJ" title={t("title")} subtitle={t("subtitle")} />
      <section className="container-x pb-24">
        <ClientOnly><Catalog /></ClientOnly>
      </section>
    </SiteShell>
  );
}
