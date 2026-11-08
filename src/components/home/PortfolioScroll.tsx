"use client";
import { useRef } from "react";
import { useTranslations } from "next-intl";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { Link } from "@/i18n/navigation";
import { CaseVisual } from "./CaseVisual";
import { Icon } from "@/components/ui/Icon";
import { Eyebrow } from "@/components/ui/Card";
import { caseSlugs, cases } from "@/content/site";

const fmt = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1).replace(".", ",")}M` : n >= 1000 ? `${Math.round(n / 100) / 10}K`.replace(".", ",") : String(n));

/** Pinned horizontal-scroll portfolio on desktop; native swipe carousel on mobile / reduced motion. */
export function PortfolioScroll() {
  const t = useTranslations();
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        const el = track.current!;
        const distance = () => el.scrollWidth - window.innerWidth;
        const tween = gsap.to(el, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: section.current,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
            anticipatePin: 1,
          },
        });
        gsap.utils.toArray<HTMLElement>(".pf-card").forEach((card) => {
          gsap.fromTo(card.querySelector(".pf-media"), { scale: 1.15 }, {
            scale: 1, ease: "none",
            scrollTrigger: { trigger: card, containerAnimation: tween, start: "left right", end: "right left", scrub: true },
          });
        });
        gsap.to(".pf-progress", { scaleX: 1, ease: "none", scrollTrigger: { trigger: section.current, start: "top top", end: () => `+=${distance()}`, scrub: true } });
      });
      return () => mm.revert();
    },
    { scope: section }
  );

  // Refresh once fonts are ready so widths are correct.
  useGSAP(() => { document.fonts?.ready.then(() => ScrollTrigger.refresh()); });

  return (
    <section ref={section} className="relative overflow-hidden py-24 lg:flex lg:h-[100svh] lg:items-center lg:py-0">
      <div
        ref={track}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto px-4 pb-6 [scrollbar-width:none] lg:snap-none lg:overflow-visible lg:px-[clamp(1rem,4vw,3rem)] lg:pb-0 [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex w-[85vw] shrink-0 snap-start flex-col justify-center sm:w-[60vw] lg:w-[34vw]">
          <Eyebrow>{t("home.portfolio.eyebrow")}</Eyebrow>
          <h2 className="mt-5 text-h1 font-black">{t("home.portfolio.title")}</h2>
          <p className="mt-5 max-w-md text-lg text-ink-1">{t("home.portfolio.text")}</p>
          <Link href="/portfolio" className="group mt-8 inline-flex items-center gap-3 font-semibold text-purple">
            {t("common.viewAll")}
            <Icon name="arrow" className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {caseSlugs.map((slug, i) => {
          const c = cases[slug];
          return (
            <Link
              key={slug}
              href={`/portfolio/${slug}`}
              data-cursor={t("common.view")}
              className="pf-card group relative block w-[85vw] shrink-0 snap-start sm:w-[60vw] lg:w-[46vw]"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-lg)] border border-ink-3 lg:aspect-[16/11]">
                <div className="pf-media absolute inset-0">
                  <CaseVisual hue={c.hue} label={c.client} className="h-full w-full" />
                </div>
                <div className="absolute inset-x-0 bottom-0 flex flex-wrap gap-2 p-5 md:p-7">
                  <span className="rounded-full bg-black/50 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">{t(`portfolio.items.${slug}.industry`)}</span>
                  <span className="rounded-full bg-black/50 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                    {t("portfolio.metrics.followers")}: {fmt(c.metrics.followers.before)} → <b className="text-[#E9D5FF]">{fmt(c.metrics.followers.after)}</b>
                  </span>
                </div>
                <span className="absolute right-5 top-5 font-display text-sm text-white/80">0{i + 1}</span>
              </div>
              <h3 className="mt-5 text-h3 font-bold transition-colors group-hover:text-purple">{t(`portfolio.items.${slug}.title`)}</h3>
            </Link>
          );
        })}
        <div className="w-px shrink-0 lg:w-[8vw]" />
      </div>

      <div aria-hidden className="absolute inset-x-[clamp(1rem,4vw,3rem)] bottom-10 hidden h-px bg-ink-3 lg:block">
        <div className="pf-progress h-full origin-left scale-x-0 bg-gradient-primary" />
      </div>
    </section>
  );
}
