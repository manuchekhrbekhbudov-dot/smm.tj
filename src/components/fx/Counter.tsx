"use client";
import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";

/** Counts up from 0 when scrolled into view. Uses tabular numerals to avoid layout jitter. */
export function Counter({ to, suffix = "", prefix = "", duration = 2, className, locale = "ru-RU" }: {
  to: number; suffix?: string; prefix?: string; duration?: number; className?: string; locale?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduced = useReducedMotion();
  const fmt = (v: number) => `${prefix}${Math.round(v).toLocaleString(locale)}${suffix}`;

  useEffect(() => {
    if (!inView || !ref.current) return;
    if (reduced) { ref.current.textContent = fmt(to); return; }
    const c = animate(0, to, {
      duration, ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => { if (ref.current) ref.current.textContent = fmt(v); },
    });
    return () => c.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, to, reduced]);

  return <span ref={ref} className={`tabular ${className ?? ""}`}>{fmt(0)}</span>;
}
