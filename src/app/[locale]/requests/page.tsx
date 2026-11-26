import { getTranslations, setRequestLocale } from "next-intl/server";
import { pageAlternates } from "@/lib/site-url";
import { SiteShell } from "@/components/layout/SiteShell";
import { PageHero } from "@/components/layout/PageHero";
import { ClientOnly } from "@/components/ui/ClientOnly";
import { RequestsBoard } from "@/components/requests/RequestsBoard";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "requests" });
  return { title: t("pageTitle"), description: t("lead"), alternates: pageAlternates(locale, "/requests") };
}

export default async function RequestsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("requests");
  return (
    <SiteShell>
      <PageHero eyebrow={t("eyebrow")} title={t("pageTitle")} subtitle={t("subtitle")} />
      <section className="container-x pb-24"><ClientOnly><RequestsBoard /></ClientOnly></section>
    </SiteShell>
  );
}
