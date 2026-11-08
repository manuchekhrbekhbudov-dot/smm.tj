"use client";
import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { LogoMark } from "@/components/ui/Logo";
import { getLenis } from "./SmoothScroll";

const KEY = "smmtj:preloaded";

/** Logo stroke draw → gradient counter 0-100 → curtain wipe. Shown once per browser session. */
export function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem(KEY) === "1"; } catch {}
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (seen || reduced) { setDone(true); return; }

    getLenis()?.stop();
    const el = root.current!;
    const n = { v: 0 };
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "power3.inOut" },
        onComplete: () => {
          try { sessionStorage.setItem(KEY, "1"); } catch {}
          getLenis()?.start();
          setDone(true);
        },
      });
      gsap.set(".logo-path", { strokeDasharray: 1, strokeDashoffset: 1 });
      gsap.set(".logo-dot", { scale: 0, transformOrigin: "center" });
      tl.to(".logo-path", { strokeDashoffset: 0, duration: 1.3, stagger: 0.2 })
        .to(".logo-dot", { scale: 1, duration: 0.5, ease: "back.out(3)" }, "-=0.4")
        .to(n, {
          v: 100, duration: 1.6, ease: "power2.inOut",
          onUpdate: () => { if (counter.current) counter.current.textContent = String(Math.round(n.v)); },
        }, 0.2)
        .to(".pl-bar", { scaleX: 1, duration: 1.6, ease: "power2.inOut" }, 0.2)
        .to(".pl-inner", { opacity: 0, y: -30, duration: 0.5, ease: "power2.in" })
        .to(".pl-curtain", { yPercent: -100, duration: 0.9, stagger: 0.08, ease: "expo.inOut" }, "-=0.1");
    }, el);
    return () => ctx.revert();
  }, []);

  if (done) return null;

  return (
    <div ref={root} className="fixed inset-0 z-[10000]" aria-hidden>
      <div className="pl-curtain absolute inset-0 bg-gradient-primary" />
      <div className="pl-curtain absolute inset-0 flex items-center justify-center bg-bg-0">
        <div className="pl-inner flex flex-col items-center gap-8">
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-purple/40 blur-2xl" />
            <LogoMark draw className="relative h-24 w-24" />
          </div>
          <div className="font-display text-5xl font-bold tabular text-gradient">
            <span ref={counter}>0</span>%
          </div>
          <div className="h-px w-48 overflow-hidden bg-ink-3">
            <div className="pl-bar h-full w-full origin-left scale-x-0 bg-gradient-primary" />
          </div>
        </div>
      </div>
    </div>
  );
}
