"use client";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

type Dir = "up" | "down" | "left" | "right" | "scale";
const offset: Record<Dir, object> = {
  up: { y: 60 }, down: { y: -60 }, left: { x: 60 }, right: { x: -60 }, scale: { scale: 0.88 },
};

/** Fade + slide/scale on scroll into view. */
export function Reveal({ children, dir = "up", delay = 0, className }: { children: ReactNode; dir?: Dir; delay?: number; className?: string }) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, filter: "blur(8px)", ...offset[dir] }}
      whileInView={{ opacity: 1, filter: "blur(0px)", x: 0, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 1, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
