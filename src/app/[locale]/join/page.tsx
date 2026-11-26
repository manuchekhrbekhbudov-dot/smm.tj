import { getTranslations, setRequestLocale } from "next-intl/server";
import { pageAlternates } from "@/lib/site-url";
import { SiteShell } from "@/components/layout/SiteShell";
import { JoinPage } from "@/components/join/JoinPage";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "join" });
  return { title: t("metaTitle"), description: t("subtitle"), alternates: pageAlternates(locale, "/join") };
}

export default async function Join({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SiteShell><JoinPage /></SiteShell>;
}
