"use client";
import { useId, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";

/**
 * Generated "cover" for a case study: gradient scene + phone mock with a post grid.
 * On hover the whole scene ripples through an SVG displacement filter (image distortion).
 */
export function CaseVisual({ hue, label, className, distort = true, mock = true }: { hue: [string, string]; label: string; className?: string; distort?: boolean; mock?: boolean }) {
  const id = useId().replace(/:/g, "");
  const [hover, setHover] = useState(false);
  const reduced = useReducedMotion();
  const active = distort && !reduced;

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      {active && (
        <svg className="absolute h-0 w-0" aria-hidden>
          <filter id={`d-${id}`}>
            <motion.feTurbulence type="fractalNoise" numOctaves={2} animate={{ baseFrequency: hover ? 0.018 : 0.001 }} transition={{ duration: 0.8 }} result="noise" />
            <motion.feDisplacementMap in="SourceGraphic" in2="noise" animate={{ scale: hover ? 38 : 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
      )}
      <motion.div
        className="absolute inset-0"
        style={{ filter: active ? `url(#d-${id})` : undefined }}
        animate={{ scale: hover ? 1.06 : 1 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="absolute inset-0" style={{ background: `radial-gradient(120% 90% at 20% 10%, ${hue[0]} 0%, transparent 55%), radial-gradient(90% 90% at 90% 90%, ${hue[1]} 0%, transparent 60%), #0B0614` }} />
        <div className="absolute -right-10 -top-10 h-60 w-60 rounded-full border border-white/20" />
        <div className="absolute -bottom-16 -left-10 h-72 w-72 rounded-full border border-white/10" />
        {/* phone mock */}
        {mock && (<div className="absolute left-1/2 top-1/2 w-[42%] min-w-[150px] -translate-x-1/2 -translate-y-1/2 rotate-[-6deg] rounded-[28px] border border-white/25 bg-black/60 p-2.5 shadow-2xl backdrop-blur-md">
          <div className="mb-2 flex items-center gap-2 px-1">
            <div className="h-7 w-7 rounded-full" style={{ background: `linear-gradient(135deg, ${hue[0]}, ${hue[1]})` }} />
            <div className="min-w-0">
              <p className="truncate text-[10px] font-bold text-white">{label}</p>
              <div className="mt-1 h-1 w-10 rounded bg-white/30" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-[4px]"
                style={{ background: `linear-gradient(${i * 40}deg, ${i % 2 ? hue[0] : hue[1]}, rgba(255,255,255,${0.08 + (i % 3) * 0.08}))`, opacity: 0.55 + (i % 4) * 0.12 }}
              />
            ))}
          </div>
        </div>)}
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
    </div>
  );
}
