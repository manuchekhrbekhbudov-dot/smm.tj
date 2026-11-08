import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { SiteShell } from "@/components/layout/SiteShell";
import { TextReveal } from "@/components/fx/TextReveal";
import { Eyebrow } from "@/components/ui/Card";
import { buttonClasses } from "@/components/ui/buttonClasses";
import { Magnetic } from "@/components/fx/Magnetic";
import { Link } from "@/i18n/navigation";

export default function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("home");

  return (
    <SiteShell>
      <section className="container-x flex min-h-[100dvh] flex-col justify-center pb-20 pt-32">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <TextReveal trigger="mount" delay={0.4} text={t("title")} highlightFrom={-2} className="mt-6 max-w-[14ch] text-hero font-black" />
        <p className="mt-8 max-w-xl text-lg text-ink-1">{t("subtitle")}</p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Magnetic><Link href="/contact" data-cursor className={buttonClasses("primary", "lg")}>{t("cta")}</Link></Magnetic>
          <Magnetic><Link href="/design-system" data-cursor className={buttonClasses("outline", "lg")}>{t("ctaSecondary")}</Link></Magnetic>
        </div>
        <p className="mt-16 text-sm text-ink-2">{t("comingSoon")}</p>
      </section>
    </SiteShell>
  );
}
