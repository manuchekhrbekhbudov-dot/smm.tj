import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { SiteShell } from "@/components/layout/SiteShell";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Hero } from "@/components/home/Hero";
import { LiveStats } from "@/components/home/LiveStats";
import { Categories } from "@/components/home/Categories";
import { HowItWorks } from "@/components/home/HowItWorks";
import { LatestSpecialists } from "@/components/home/LatestSpecialists";
import { Trust } from "@/components/home/Trust";
import { Faq } from "@/components/home/Faq";
import { CtaBand } from "@/components/home/CtaBand";

export default function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("home");

  return (
    <SiteShell>
      <Hero />
      <LiveStats />
      <section className="container-x py-20 md:py-28">
        <SectionHeader eyebrow={t("categories.eyebrow")} title={t("categories.title")} text={t("categories.text")} className="mb-12" />
        <Categories />
      </section>
      <section className="container-x py-20 md:py-28">
        <SectionHeader eyebrow={t("latest.eyebrow")} title={t("latest.title")} className="mb-12" />
        <LatestSpecialists />
      </section>
      <section className="container-x py-20 md:py-28">
        <SectionHeader eyebrow={t("how.eyebrow")} title={t("how.title")} className="mb-12" />
        <HowItWorks />
      </section>
      <section className="container-x py-20 md:py-28">
        <SectionHeader eyebrow={t("trust.eyebrow")} title={t("trust.title")} className="mb-12" />
        <Trust />
      </section>
      <section className="container-x grid gap-12 py-20 md:py-28 lg:grid-cols-[1fr_1.6fr]">
        <SectionHeader eyebrow={t("faq.eyebrow")} title={t("faq.title")} />
        <Faq />
      </section>
      <CtaBand />
    </SiteShell>
  );
}
