import { getTranslations, setRequestLocale } from "next-intl/server";
import { pageAlternates } from "@/lib/site-url";
import { SiteShell } from "@/components/layout/SiteShell";
import { PageHero } from "@/components/layout/PageHero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Trust } from "@/components/home/Trust";
import { Faq } from "@/components/home/Faq";
import { CtaBand } from "@/components/home/CtaBand";

type Rule = { title: string; text: string };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return { title: t("title"), description: t("subtitle"), alternates: pageAlternates(locale, "/about") };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  return (
    <SiteShell>
      <PageHero eyebrow="SMM.TJ" title={t("about.title")} subtitle={t("about.subtitle")} />
      <section className="container-x pb-20">
        <h2 className="mb-10 text-h1 font-bold">{t("home.how.title")}</h2>
        <HowItWorks />
      </section>
      <section className="container-x pb-20">
        <h2 className="mb-10 text-h1 font-bold">{t("about.rulesTitle")}</h2>
        <Trust items={t.raw("about.rules") as Rule[]} />
      </section>
      <section className="container-x grid gap-12 pb-20 lg:grid-cols-[1fr_1.6fr]">
        <h2 className="text-h1 font-bold">{t("home.faq.title")}</h2>
        <Faq />
      </section>
      <CtaBand />
    </SiteShell>
  );
}
