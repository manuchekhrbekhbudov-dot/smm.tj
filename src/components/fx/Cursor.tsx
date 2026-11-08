"use client";
import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import { useFinePointer, usePrefersReducedMotion } from "@/lib/hooks";

/**
 * Custom cursor: a small dot + a trailing glow ring.
 * Any element with [data-cursor] makes the ring grow; data-cursor="label text" shows a label.
 */
export function Cursor() {
  const fine = useFinePointer();
  const reduced = usePrefersReducedMotion();
  const enabled = fine && !reduced;

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const rx = useSpring(x, { stiffness: 350, damping: 32, mass: 0.6 });
  const ry = useSpring(y, { stiffness: 350, damping: 32, mass: 0.6 });

  const [hover, setHover] = useState(false);
  const [label, setLabel] = useState<string | null>(null);
  const [down, setDown] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    document.documentElement.classList.add("has-cursor");

    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
      const target = (e.target as HTMLElement | null)?.closest<HTMLElement>(
        "[data-cursor], a, button, input, textarea, select, label, [role=button]"
      );
      setHover(!!target);
      const l = target?.dataset.cursor;
      setLabel(l && l !== "true" ? l : null);
    };
    const leave = () => setVisible(false);
    const pdown = () => setDown(true);
    const pup = () => setDown(false);

    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    window.addEventListener("pointerdown", pdown);
    window.addEventListener("pointerup", pup);
    return () => {
      document.documentElement.classList.remove("has-cursor");
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
      window.removeEventListener("pointerdown", pdown);
      window.removeEventListener("pointerup", pup);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  const size = label ? 96 : hover ? 64 : 36;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[9999]" style={{ opacity: visible ? 1 : 0 }}>
      <motion.div
        className="absolute left-0 top-0 flex items-center justify-center rounded-full border border-purple/60"
        style={{
          x: rx,
          y: ry,
          translateX: "-50%",
          translateY: "-50%",
          boxShadow: "0 0 30px rgb(168 85 247 / 0.55), inset 0 0 20px rgb(192 38 211 / 0.25)",
          backdropFilter: hover ? "blur(2px)" : undefined,
        }}
        animate={{
          width: size,
          height: size,
          scale: down ? 0.85 : 1,
          backgroundColor: label ? "rgba(168,85,247,0.85)" : hover ? "rgba(168,85,247,0.12)" : "rgba(168,85,247,0)",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
      >
        <AnimatePresence>
          {label && (
            <motion.span
              key={label}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              className="text-[11px] font-bold uppercase tracking-wider text-white"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
      <motion.div
        className="absolute left-0 top-0 h-1.5 w-1.5 rounded-full bg-ink-0"
        style={{ x, y, translateX: "-50%", translateY: "-50%" }}
        animate={{ opacity: hover ? 0 : 1 }}
      />
    </div>
  );
}
