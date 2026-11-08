"use client";
import { useRef } from "react";
import { useTranslations } from "next-intl";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { Eyebrow } from "@/components/ui/Card";

type Step = { title: string; text: string };

/** Sticky title + steps that light up as a scrubbed progress line passes them. */
export function Process() {
  const t = useTranslations("home.process");
  const steps = t.raw("steps") as Step[];
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(".pr-line", { scaleY: 0 }, {
          scaleY: 1, ease: "none",
          scrollTrigger: { trigger: ".pr-list", start: "top 60%", end: "bottom 60%", scrub: true },
        });
        gsap.utils.toArray<HTMLElement>(".pr-step").forEach((el) => {
          gsap.fromTo(el, { opacity: 0.25, x: 30 }, {
            opacity: 1, x: 0, ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 75%", end: "top 50%", scrub: true },
          });
          gsap.fromTo(el.querySelector(".pr-dot"), { scale: 0.4, backgroundColor: "rgba(168,85,247,0.2)" }, {
            scale: 1, backgroundColor: "#A855F7",
            scrollTrigger: { trigger: el, start: "top 62%", end: "top 55%", scrub: true },
          });
        });
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <section ref={root} className="container-x grid gap-14 py-20 md:py-36 lg:grid-cols-[1fr_1.2fr]">
      <div className="lg:sticky lg:top-32 lg:self-start">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <h2 className="mt-5 text-display font-black">
          {t("title").split(" ").slice(0, -1).join(" ")} <span className="text-gradient">{t("title").split(" ").slice(-1)}</span>
        </h2>
      </div>
      <ol className="pr-list relative space-y-14 pl-12 md:space-y-20 md:pl-16">
        <span aria-hidden className="absolute bottom-2 left-[11px] top-2 w-px bg-ink-3 md:left-[15px]" />
        <span aria-hidden className="pr-line absolute bottom-2 left-[11px] top-2 w-px origin-top bg-gradient-primary md:left-[15px]" />
        {steps.map((s, i) => (
          <li key={i} className="pr-step relative">
            <span aria-hidden className="pr-dot absolute -left-12 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-purple shadow-[0_0_20px_#a855f7] md:-left-16 md:h-8 md:w-8" />
            <span className="font-display text-sm text-purple">0{i + 1}</span>
            <h3 className="mt-2 text-h2 font-bold">{s.title}</h3>
            <p className="mt-3 max-w-md text-lg text-ink-1">{s.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
