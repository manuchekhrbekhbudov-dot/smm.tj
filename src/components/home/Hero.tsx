"use client";
import dynamic from "next/dynamic";
import { useRef } from "react";
import { useTranslations } from "next-intl";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { TextReveal } from "@/components/fx/TextReveal";
import { Magnetic } from "@/components/fx/Magnetic";
import { buttonClasses } from "@/components/ui/buttonClasses";
import { Icon, type IconName } from "@/components/ui/Icon";
import { specialtySlugs } from "@/content/site";

const HeroScene = dynamic(() => import("@/components/fx/HeroScene"), { ssr: false });

/** Glass bubbles floating around the 3D blob (decorative). */
const bubbles: { icon: IconName; className: string; delay: number }[] = [
  { icon: "instagram", className: "left-[6%] top-[18%] h-16 w-16 md:left-[16%]", delay: 0 },
  { icon: "tiktok", className: "right-[6%] top-[14%] h-14 w-14 md:right-[17%]", delay: 1.2 },
  { icon: "reels", className: "left-[10%] top-[52%] hidden h-14 w-14 md:flex md:left-[22%]", delay: 2.1 },
  { icon: "ads", className: "right-[10%] top-[50%] hidden h-16 w-16 md:flex md:right-[22%]", delay: 0.6 },
];

export function Hero() {
  const t = useTranslations();
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={ref} className="relative flex min-h-[100svh] flex-col items-center overflow-hidden pt-24">
      {/* 3D stage */}
      <div className="relative h-[46svh] min-h-[300px] w-full max-w-[900px] md:h-[52svh]">
        <div aria-hidden className="absolute left-1/2 top-1/2 h-[60%] w-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet/40 blur-[90px]" />
        {!reduced ? (
          <motion.div aria-hidden className="absolute inset-0" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}>
            <HeroScene />
          </motion.div>
        ) : (
          <div aria-hidden className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full orb" />
        )}
        {bubbles.map((b) => (
          <motion.span
            key={b.icon}
            aria-hidden
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 + b.delay * 0.2, type: "spring", stiffness: 140, damping: 14 }}
            className={`absolute flex items-center justify-center rounded-[22px] glass glass-edge text-ink-0 ${b.className}`}
          >
            <span className="animate-float" style={{ animationDelay: `${b.delay}s` }}>
              <Icon name={b.icon} className="h-7 w-7" />
            </span>
          </motion.span>
        ))}
      </div>

      <motion.div style={reduced ? undefined : { y: contentY, opacity: fade }} className="container-x relative -mt-6 flex flex-col items-center pb-16 text-center">
        <motion.span initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="inline-flex items-center gap-2 rounded-full glass glass-edge px-4 py-2 text-xs font-semibold text-ink-1 md:text-sm">
          <span className="h-2 w-2 rounded-full orb" />
          {t("home.hero.eyebrow")}
        </motion.span>

        <TextReveal trigger="mount" delay={0.45} text={t("home.hero.title")} highlightFrom={-2} className="mt-6 max-w-4xl text-hero font-bold" />

        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.8 }}
          className="mt-6 max-w-2xl text-lg text-ink-1 md:text-xl">
          {t("home.hero.subtitle")}
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.05, duration: 0.8 }}
          className="mt-9 flex flex-wrap justify-center gap-3">
          <Magnetic>
            <Link href="/specialists" data-cursor className={buttonClasses("primary", "lg")}>
              {t("home.hero.ctaFind")} <Icon name="arrow" className="h-5 w-5" />
            </Link>
          </Magnetic>
          <Magnetic>
            <Link href={{ pathname: "/login", query: { role: "specialist" } }} data-cursor className={buttonClasses("outline", "lg")}>{t("home.hero.ctaJoin")}</Link>
          </Magnetic>
        </motion.div>

        <motion.ul initial="hidden" animate="show" transition={{ staggerChildren: 0.05, delayChildren: 1.25 }}
          className="mt-10 flex max-w-3xl flex-wrap justify-center gap-2" aria-label={t("home.categories.title")}>
          {specialtySlugs.slice(0, 6).map((s) => (
            <motion.li key={s} variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
              <Link href={{ pathname: "/specialists", query: { s } }} className="inline-flex rounded-full glass px-4 py-2 text-sm text-ink-1 transition-all hover:-translate-y-0.5 hover:text-ink-0 hover:glow-sm">
                {t(`specialties.${s}.title`)}
              </Link>
            </motion.li>
          ))}
        </motion.ul>
      </motion.div>
    </section>
  );
}
