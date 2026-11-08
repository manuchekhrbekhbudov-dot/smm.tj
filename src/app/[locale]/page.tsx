import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { SiteShell } from "@/components/layout/SiteShell";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Hero } from "@/components/home/Hero";
import { ClientsMarquee } from "@/components/home/ClientsMarquee";
import { ServicesGrid } from "@/components/home/ServicesGrid";
import { Stats } from "@/components/home/Stats";
import { PortfolioScroll } from "@/components/home/PortfolioScroll";
import { Process } from "@/components/home/Process";
import { Testimonials } from "@/components/home/Testimonials";
import { PricingCards } from "@/components/home/PricingCards";
import { Faq } from "@/components/home/Faq";
import { CtaBand } from "@/components/home/CtaBand";

export default function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("home");

  return (
    <SiteShell>
      <Hero />
      <ClientsMarquee />
      <section className="container-x py-20 md:py-36">
        <SectionHeader eyebrow={t("services.eyebrow")} title={t("services.title")} text={t("services.text")} className="mb-14" />
        <ServicesGrid />
      </section>
      <Stats />
      <PortfolioScroll />
      <Process />
      <Testimonials />
      <section className="container-x py-20 md:py-36">
        <SectionHeader eyebrow={t("pricing.eyebrow")} title={t("pricing.title")} text={t("pricing.text")} align="center" className="mb-12" />
        <PricingCards />
      </section>
      <section className="container-x grid gap-12 py-20 md:py-36 lg:grid-cols-[1fr_1.6fr]">
        <SectionHeader eyebrow={t("faq.eyebrow")} title={t("faq.title")} />
        <Faq />
      </section>
      <CtaBand />
    </SiteShell>
  );
}
