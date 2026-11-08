"use client";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth";
import { Link } from "@/i18n/navigation";
import { Magnetic } from "@/components/fx/Magnetic";
import { Reveal } from "@/components/fx/Reveal";
import { TextReveal } from "@/components/fx/TextReveal";
import { buttonClasses } from "@/components/ui/buttonClasses";
import { Icon } from "@/components/ui/Icon";

export function CtaBand() {
  const t = useTranslations("home.cta");
  const { session } = useAuth();
  if (session) return null; // sign-up call-to-action is only for visitors
  return (
    <section className="container-x py-20 md:py-28">
      <Reveal dir="scale">
        <div className="relative overflow-hidden rounded-[var(--radius-xl)] glass glass-edge px-6 py-16 text-center md:px-16 md:py-24">
          <div aria-hidden className="absolute -right-24 -top-24 h-72 w-72 animate-float rounded-full orb opacity-90 blur-[2px]" />
          <div aria-hidden className="absolute -bottom-28 -left-20 h-64 w-64 animate-float rounded-full orb opacity-70 [animation-delay:-3s]" />
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgb(139_92_246/0.18),transparent_70%)]" />
          <TextReveal as="h2" text={t("title")} highlightFrom={-1} className="relative mx-auto max-w-3xl text-display font-bold" />
          <p className="relative mx-auto mt-5 max-w-xl text-lg text-ink-1">{t("text")}</p>
          <Magnetic className="relative mt-9 inline-block">
            <Link href={{ pathname: "/login", query: { role: "specialist" } }} data-cursor className={buttonClasses("primary", "lg")}>
              {t("button")} <Icon name="arrow" className="h-5 w-5" />
            </Link>
          </Magnetic>
        </div>
      </Reveal>
    </section>
  );
}
