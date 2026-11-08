"use client";
import dynamic from "next/dynamic";
import { useRef } from "react";
import { useTranslations } from "next-intl";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { TextReveal } from "@/components/fx/TextReveal";
import { Magnetic } from "@/components/fx/Magnetic";
import { buttonClasses } from "@/components/ui/buttonClasses";
import { Icon } from "@/components/ui/Icon";

const HeroScene = dynamic(() => import("@/components/fx/HeroScene"), { ssr: false });

export function Hero() {
  const t = useTranslations("home.hero");
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "35%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const sceneScale = useTransform(scrollYProgress, [0, 1], [1, 1.25]);

  return (
    <section ref={ref} className="relative flex min-h-[100svh] items-center overflow-hidden">
      {!reduced && (
        <motion.div aria-hidden className="absolute inset-0" style={{ scale: sceneScale }}>
          <HeroScene />
        </motion.div>
      )}
      {/* readability gradient */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,var(--bg-0)_0%,transparent_60%)] opacity-70" />

      <motion.div style={reduced ? undefined : { y, opacity }} className="container-x relative pb-24 pt-36">
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-xs font-semibold text-ink-1"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          {t("badge")}
        </motion.span>

        <p className="mt-6 text-xs font-bold uppercase tracking-[0.25em] text-purple">{t("eyebrow")}</p>
        <TextReveal trigger="mount" delay={0.35} stagger={0.025} text={t("title")} highlightFrom={-2} className="mt-4 max-w-[14ch] text-hero font-black" />

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 max-w-xl text-lg text-ink-1 md:text-xl"
        >
          {t("subtitle")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 flex flex-wrap gap-4"
        >
          <Magnetic>
            <Link href="/contact" data-cursor className={buttonClasses("primary", "lg")}>
              {t("cta")} <Icon name="arrow" className="h-5 w-5" />
            </Link>
          </Magnetic>
          <Magnetic>
            <Link href="/portfolio" data-cursor className={buttonClasses("outline", "lg")}>{t("ctaSecondary")}</Link>
          </Magnetic>
        </motion.div>
      </motion.div>

      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-ink-2 md:flex"
      >
        {t("scroll")}
        <span className="relative h-12 w-px overflow-hidden bg-ink-3">
          <motion.span
            className="absolute left-0 top-0 h-1/2 w-full bg-gradient-primary"
            animate={{ y: ["-100%", "200%"] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        </span>
      </motion.div>
    </section>
  );
}
