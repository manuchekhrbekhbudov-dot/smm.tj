"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/fx/Reveal";
import { Magnetic } from "@/components/fx/Magnetic";
import { buttonClasses } from "@/components/ui/buttonClasses";
import { Icon } from "@/components/ui/Icon";
import { packageSlugs, packagePrice, featuredPackage, QUARTER_DISCOUNT } from "@/content/site";
import { cn } from "@/lib/cn";

export function PricingCards() {
  const t = useTranslations();
  const [quarterly, setQuarterly] = useState(false);

  return (
    <div>
      <div className="flex justify-center">
        <div role="radiogroup" aria-label={t("pricing.title")} className="relative inline-flex rounded-full glass p-1.5">
          {[false, true].map((q) => (
            <button
              key={String(q)}
              role="radio"
              aria-checked={quarterly === q}
              onClick={() => setQuarterly(q)}
              className={cn("relative z-10 flex h-11 items-center gap-2 rounded-full px-6 text-sm font-semibold transition-colors", quarterly === q ? "text-white" : "text-ink-2 hover:text-ink-0")}
            >
              {quarterly === q && <motion.span layoutId="billing-pill" className="absolute inset-0 -z-10 rounded-full bg-gradient-primary glow-sm" transition={{ type: "spring", stiffness: 500, damping: 35 }} />}
              {q ? t("pricing.quarterly") : t("pricing.monthly")}
              {q && <span className={cn("rounded-full px-2 py-0.5 text-[11px]", quarterly ? "bg-white/20" : "bg-success/15 text-success")}>{t("pricing.save")}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-12 grid items-stretch gap-6 lg:grid-cols-3">
        {packageSlugs.map((slug, i) => {
          const featured = slug === featuredPackage;
          const price = Math.round(packagePrice[slug] * (quarterly ? 1 - QUARTER_DISCOUNT : 1));
          const features = t.raw(`pricing.packages.${slug}.features`) as string[];
          return (
            <Reveal key={slug} delay={i * 0.1} className="h-full">
              <div
                className={cn(
                  "group relative flex h-full flex-col rounded-[var(--radius-lg)] p-8 transition-all duration-500 hover:-translate-y-2 md:p-10",
                  featured ? "gradient-border bg-bg-2/80 glow-lg lg:-my-4 lg:py-14" : "glass hover:glow-md"
                )}
              >
                {featured && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-primary px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white glow-sm">
                    {t("common.popular")}
                  </span>
                )}
                <h3 className="font-display text-2xl font-bold">{t(`pricing.packages.${slug}.name`)}</h3>
                <p className="mt-2 text-ink-2">{t(`pricing.packages.${slug}.tagline`)}</p>
                <div className="mt-8 flex items-end gap-2">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={price}
                      initial={{ y: 30, opacity: 0, filter: "blur(6px)" }}
                      animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                      exit={{ y: -30, opacity: 0, filter: "blur(6px)" }}
                      transition={{ duration: 0.4 }}
                      className={cn("tabular font-display text-5xl font-black", featured && "text-gradient")}
                    >
                      {price.toLocaleString("ru-RU")}
                    </motion.span>
                  </AnimatePresence>
                  <span className="pb-1.5 text-ink-2">TJS{t("common.perMonth")}</span>
                </div>
                <p className={cn("mt-1 h-5 text-xs text-ink-2 transition-opacity", quarterly ? "opacity-100" : "opacity-0")}>{t("pricing.billedQuarterly")}</p>
                <ul className="mt-8 flex-1 space-y-3.5">
                  {features.map((f) => (
                    <li key={f} className="flex gap-3 text-ink-1">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple/20 text-purple"><Icon name="check" className="h-3.5 w-3.5" /></span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Magnetic className="mt-10 block">
                  <Link
                    href={{ pathname: "/contact", query: { package: slug } }}
                    data-cursor
                    className={buttonClasses(featured ? "primary" : "outline", "lg", "w-full")}
                  >
                    {t("pricing.choose")}
                  </Link>
                </Magnetic>
              </div>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
