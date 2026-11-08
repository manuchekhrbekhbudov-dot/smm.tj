import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Magnetic } from "@/components/fx/Magnetic";
import { Reveal } from "@/components/fx/Reveal";
import { TextReveal } from "@/components/fx/TextReveal";
import { buttonClasses } from "@/components/ui/buttonClasses";
import { Icon } from "@/components/ui/Icon";

export function CtaBand() {
  const t = useTranslations("home.cta");
  return (
    <section className="container-x py-24 md:py-32">
      <Reveal dir="scale">
        <div className="relative overflow-hidden rounded-[40px] bg-gradient-primary px-6 py-20 text-center text-white md:px-16 md:py-28">
          <div aria-hidden className="absolute -left-20 -top-20 h-80 w-80 animate-blob rounded-full bg-white/20 blur-3xl" />
          <div aria-hidden className="absolute -bottom-24 -right-10 h-96 w-96 animate-blob rounded-full bg-[#05010A]/40 blur-3xl [animation-delay:-8s]" />
          <div aria-hidden className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.15)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.15)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,#000,transparent_70%)]" />
          <TextReveal as="h2" text={t("title")} className="relative mx-auto max-w-4xl text-display font-black" />
          <p className="relative mx-auto mt-6 max-w-xl text-lg text-white/85">{t("text")}</p>
          <Magnetic className="relative mt-10 inline-block">
            <Link href="/contact" data-cursor className="inline-flex h-16 items-center gap-3 rounded-full bg-[#05010A] px-10 text-lg font-semibold text-white shadow-2xl transition-transform duration-300 hover:scale-105">
              {t("button")} <Icon name="arrow" className="h-5 w-5" />
            </Link>
          </Magnetic>
        </div>
      </Reveal>
    </section>
  );
}
