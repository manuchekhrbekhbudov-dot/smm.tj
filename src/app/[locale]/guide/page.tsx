import { getTranslations, setRequestLocale } from "next-intl/server";
import { pageAlternates } from "@/lib/site-url";
import { SiteShell } from "@/components/layout/SiteShell";
import { PageHero } from "@/components/layout/PageHero";
import { Guide } from "@/components/guide/Guide";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "guide" });
  return { title: t("title"), description: t("subtitle"), alternates: pageAlternates(locale, "/guide") };
}

export default async function GuidePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("guide");
  return (
    <SiteShell>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />
      <section className="container-x pb-24"><Guide /></section>
    </SiteShell>
  );
}
