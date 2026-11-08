"use client";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { CaseVisual } from "@/components/home/CaseVisual";

type M = { before: number; after: number; unit?: "%" };
const fmt = (n: number, unit?: string) => (unit ? `${n.toString().replace(".", ",")}${unit}` : n.toLocaleString("ru-RU"));

/** Drag (or arrow-key) slider comparing the profile before and after. */
export function BeforeAfter({ hue, client, followers, reach }: { hue: [string, string]; client: string; followers: M; reach: M }) {
  const t = useTranslations();
  const box = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(50);
  const [dragging, setDragging] = useState(false);

  const setFromX = (clientX: number) => {
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    setPos(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)));
  };

  return (
    <div>
      <div
        ref={box}
        data-cursor={t("common.drag")}
        className="relative aspect-[16/10] touch-pan-y select-none overflow-hidden rounded-[var(--radius-lg)] border border-ink-3"
        onPointerDown={(e) => { setDragging(true); e.currentTarget.setPointerCapture(e.pointerId); setFromX(e.clientX); }}
        onPointerMove={(e) => dragging && setFromX(e.clientX)}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
      >
        {/* AFTER (full) */}
        <CaseVisual hue={hue} label={client} distort={false} className="absolute inset-0" />
        <div className="absolute bottom-5 right-5 rounded-2xl bg-black/55 p-4 text-right text-white backdrop-blur">
          <p className="text-xs uppercase tracking-widest text-white/70">{t("common.after")}</p>
          <p className="tabular font-display text-2xl font-bold">{fmt(followers.after)}</p>
          <p className="text-xs text-white/70">{t("portfolio.metrics.followers")}</p>
        </div>

        {/* BEFORE (clipped) */}
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          <div className="absolute inset-0 grayscale-[0.9] brightness-[0.55] contrast-75">
            <CaseVisual hue={["#3f3f46", "#52525b"]} label={client} distort={false} className="absolute inset-0" />
          </div>
          <div className="absolute bottom-5 left-5 rounded-2xl bg-black/55 p-4 text-white backdrop-blur">
            <p className="text-xs uppercase tracking-widest text-white/70">{t("common.before")}</p>
            <p className="tabular font-display text-2xl font-bold">{fmt(followers.before)}</p>
            <p className="text-xs text-white/70">{t("portfolio.metrics.reach")}: {fmt(reach.before)}</p>
          </div>
        </div>

        {/* handle */}
        <div className="pointer-events-none absolute inset-y-0" style={{ left: `${pos}%` }}>
          <div className="absolute inset-y-0 -left-px w-0.5 bg-white shadow-[0_0_20px_#a855f7]" />
          <motion.div
            animate={{ scale: dragging ? 1.15 : 1 }}
            className="absolute left-0 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-primary text-white glow-md"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="m9 6-6 6 6 6M15 6l6 6-6 6" /></svg>
          </motion.div>
        </div>
      </div>
      <label className="sr-only" htmlFor="ba-range">{t("portfolio.compare")}</label>
      <input
        id="ba-range"
        type="range"
        min={0}
        max={100}
        value={Math.round(pos)}
        onChange={(e) => setPos(Number(e.target.value))}
        className="sr-only focus:not-sr-only focus:mt-3 focus:w-full"
      />
      <p className="mt-3 text-center text-sm text-ink-2">{t("portfolio.compare")}</p>
    </div>
  );
}
