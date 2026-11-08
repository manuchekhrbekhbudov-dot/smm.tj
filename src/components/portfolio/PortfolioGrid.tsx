"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { CaseVisual } from "@/components/home/CaseVisual";
import { Icon } from "@/components/ui/Icon";
import { caseSlugs, cases, serviceSlugs, type ServiceSlug } from "@/content/site";
import { cn } from "@/lib/cn";

export function PortfolioGrid() {
  const t = useTranslations();
  const [filter, setFilter] = useState<ServiceSlug | "all">("all");
  const used = serviceSlugs.filter((s) => caseSlugs.some((c) => cases[c].services.includes(s)));
  const list = caseSlugs.filter((c) => filter === "all" || cases[c].services.includes(filter));

  return (
    <div>
      <div className="mb-10 flex flex-wrap gap-2" role="group" aria-label={t("portfolio.services")}>
        {(["all", ...used] as const).map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className={cn("relative rounded-full px-5 py-2.5 text-sm font-semibold transition-colors", filter === f ? "text-white" : "glass text-ink-1 hover:text-ink-0")}
          >
            {filter === f && <motion.span layoutId="pf-filter" className="absolute inset-0 rounded-full bg-gradient-primary glow-sm" transition={{ type: "spring", stiffness: 500, damping: 35 }} />}
            <span className="relative">{f === "all" ? t("portfolio.all") : t(`services.items.${f}.title`)}</span>
          </button>
        ))}
      </div>
      <motion.div layout className="grid gap-8 md:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {list.map((slug, i) => {
            const c = cases[slug];
            return (
              <motion.div
                key={slug}
                layout
                initial={{ opacity: 0, scale: 0.92, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.6, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className={cn(i % 2 === 1 && "md:mt-24")}
              >
                <Link href={`/portfolio/${slug}`} data-cursor={t("common.view")} className="group block">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-lg)] border border-ink-3">
                    <CaseVisual hue={c.hue} label={c.client} className="h-full w-full" />
                    <span className="absolute left-5 top-5 rounded-full bg-black/50 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">{t(`portfolio.items.${slug}.industry`)}</span>
                    <span className="absolute bottom-5 right-5 flex h-14 w-14 scale-75 items-center justify-center rounded-full bg-white text-[#05010A] opacity-0 transition-all duration-500 group-hover:scale-100 group-hover:opacity-100">
                      <Icon name="arrowUpRight" className="h-6 w-6" />
                    </span>
                  </div>
                  <h2 className="mt-5 text-h3 font-bold transition-colors group-hover:text-purple">{t(`portfolio.items.${slug}.title`)}</h2>
                  <p className="mt-1 text-ink-2">{c.client} · {t(`portfolio.items.${slug}.duration`)}</p>
                </Link>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
