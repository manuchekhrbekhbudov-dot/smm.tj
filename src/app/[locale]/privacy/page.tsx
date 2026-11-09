import { getTranslations, setRequestLocale } from "next-intl/server";
import { pageAlternates } from "@/lib/site-url";
import { SiteShell } from "@/components/layout/SiteShell";
import { LegalPage } from "@/components/legal/LegalPage";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });
  return { title: t("privacy.title"), alternates: pageAlternates(locale, "/privacy") };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SiteShell><LegalPage doc="privacy" /></SiteShell>;
}
