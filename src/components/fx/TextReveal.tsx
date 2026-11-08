"use client";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { cn } from "@/lib/cn";
import type { ElementType } from "react";

type Props = {
  text: string;
  as?: ElementType;
  className?: string;
  delay?: number;
  stagger?: number;
  /** Animate on mount (hero) or when scrolled into view. */
  trigger?: "mount" | "inView";
  /** Words from this index on get the purple gradient. Negative counts from the end. */
  highlightFrom?: number;
};

const letter: Variants = {
  hidden: { y: "110%", opacity: 0, filter: "blur(12px)", rotate: 6 },
  show: { y: "0%", opacity: 1, filter: "blur(0px)", rotate: 0, transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] } },
};

/** Letter-by-letter reveal. Words never break mid-word; accessible text is provided via aria-label. */
export function TextReveal({ text, as: Tag = "h1", className, delay = 0, stagger = 0.03, trigger = "inView", highlightFrom }: Props) {
  const reduced = useReducedMotion();
  const words = text.split(" ");
  const hl = highlightFrom === undefined ? Infinity : highlightFrom < 0 ? words.length + highlightFrom : highlightFrom;
  const MotionTag = motion.create(Tag);
  const triggerProps =
    trigger === "mount"
      ? { animate: "show" }
      : { whileInView: "show", viewport: { once: true, amount: 0.4 } };

  if (reduced)
    return (
      <Tag className={className}>
        {words.map((w, wi) => (
          <span key={wi} className={wi >= hl ? "text-gradient" : undefined}>{w}{wi < words.length - 1 ? " " : ""}</span>
        ))}
      </Tag>
    );

  let i = 0;
  return (
    <MotionTag
      aria-label={text}
      className={cn(className)}
      initial="hidden"
      {...triggerProps}
      transition={{ staggerChildren: stagger, delayChildren: delay }}
    >
      {words.map((w, wi) => (
        <span key={wi} aria-hidden className="inline-block whitespace-nowrap">
          {Array.from(w).map((ch) => (
            <span key={i++} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
              <motion.span variants={letter} className={cn("inline-block will-change-transform", wi >= hl && "text-gradient")}>
                {ch}
              </motion.span>
            </span>
          ))}
          {wi < words.length - 1 && <span className="inline-block">&nbsp;</span>}
        </span>
      ))}
    </MotionTag>
  );
}
