"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getSupabase } from "@/lib/supabase/client";
import { loadPortfolio, type PortfolioItem } from "./portfolio";

/** Public profile: grid of work examples with a full-screen viewer. */
export function PortfolioGallery({ specialistId }: { specialistId: string }) {
  const t = useTranslations("portfolio");
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [open, setOpen] = useState<number | null>(null);
  useEffect(() => { const sb = getSupabase(); if (sb) void loadPortfolio(sb, specialistId).then(setItems); }, [specialistId]);
  useEffect(() => {
    if (open === null) return;
    const on = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? i : (i + 1) % items.length));
      if (e.key === "ArrowLeft") setOpen((i) => (i === null ? i : (i - 1 + items.length) % items.length));
    };
    window.addEventListener("keydown", on); return () => window.removeEventListener("keydown", on);
  }, [open, items.length]);
  if (!items.length) return null;
  const cur = open !== null ? items[open] : null;
  return (
    <section>
      <h2 className="mb-4 text-h3 font-bold">{t("public")}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((it, i) => (
          <button key={it.id} type="button" onClick={() => setOpen(i)} className="group relative overflow-hidden rounded-[var(--radius-md)] bg-ink-3 text-left">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={it.url} alt={it.title || t("work")} className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
            {it.title && <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 p-3 text-sm text-white">{it.title}</span>}
          </button>
        ))}
      </div>
      {cur && (
        <div role="dialog" aria-modal="true" aria-label={cur.title || t("work")} className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/90 p-4" onClick={() => setOpen(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cur.url} alt={cur.title || t("work")} className="max-h-[80dvh] max-w-full rounded-2xl object-contain" />
          {cur.title && <p className="mt-4 text-center text-white">{cur.title}</p>}
          <p className="mt-2 text-sm text-white/60">{(open ?? 0) + 1} / {items.length}</p>
          <button type="button" className="absolute right-4 top-4 rounded-full bg-white/10 px-4 py-2 text-white" onClick={() => setOpen(null)}>✕</button>
        </div>
      )}
    </section>
  );
}
