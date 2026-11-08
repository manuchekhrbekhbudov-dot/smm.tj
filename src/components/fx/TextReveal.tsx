"use client";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { cn } from "@/lib/cn";

type Props = {
  text: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  className?: string;
  delay?: number;
  stagger?: number;
  trigger?: "mount" | "inView";
  /** Words from this index on get the gradient. Negative counts from the end. */
  highlightFrom?: number;
};

const motionTags = { h1: motion.h1, h2: motion.h2, h3: motion.h3, p: motion.p, span: motion.span } as const;

const word: Variants = {
  hidden: { y: "60%", opacity: 0, filter: "blur(6px)" },
  show: { y: "0%", opacity: 1, filter: "blur(0px)", transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
};

/** Soft word-by-word rise. Accessible text via aria-label. */
export function TextReveal({ text, as: Tag = "h1", className, delay = 0, stagger = 0.06, trigger = "inView", highlightFrom }: Props) {
  const reduced = useReducedMotion();
  const words = text.split(" ");
  const hl = highlightFrom === undefined ? Infinity : highlightFrom < 0 ? words.length + highlightFrom : highlightFrom;
  const MotionTag = motionTags[Tag];
  const triggerProps = trigger === "mount" ? { animate: "show" } : { whileInView: "show", viewport: { once: true, amount: 0.5 } };

  if (reduced) {
    return (
      <Tag className={className}>
        {words.map((w, i) => <span key={i} className={i >= hl ? "text-gradient" : undefined}>{w}{i < words.length - 1 ? " " : ""}</span>)}
      </Tag>
    );
  }
  return (
    <MotionTag aria-label={text} className={className} initial="hidden" {...triggerProps} transition={{ staggerChildren: stagger, delayChildren: delay }}>
      {words.map((w, i) => (
        <span key={i} aria-hidden className="inline-block overflow-hidden pb-[0.1em] align-bottom">
          <motion.span variants={word} className={cn("inline-block will-change-transform", i >= hl && "text-gradient")}>{w}</motion.span>
          {i < words.length - 1 && <span>&nbsp;</span>}
        </span>
      ))}
    </MotionTag>
  );
}
