"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

type Item = { q: string; a: string };

export function Faq() {
  const t = useTranslations();
  const items = t.raw("faq") as Item[];
  const [open, setOpen] = useState<Set<number>>(() => new Set([0]));
  const toggle = (i: number) => setOpen((prev) => { const n = new Set(prev); if (n.has(i)) n.delete(i); else n.add(i); return n; });
  return (
    <div className="divide-y divide-ink-3 border-y border-ink-3">
      {items.map((it, i) => {
        const isOpen = open.has(i);
        return (
          <div key={i}>
            <h3>
              <button
                type="button"
                id={`faq-q-${i}`}
                aria-expanded={isOpen}
                aria-controls={`faq-a-${i}`}
                onClick={() => toggle(i)}
                className="group flex w-full items-center justify-between gap-6 py-6 text-left font-sans text-lg font-semibold md:text-xl"
              >
                <span className={cn("transition-colors", isOpen ? "text-purple" : "group-hover:text-purple")}>{it.q}</span>
                <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all duration-500", isOpen ? "rotate-45 border-transparent bg-gradient-primary text-white" : "border-ink-3")}>
                  <Icon name="plus" className="h-5 w-5" />
                </span>
              </button>
            </h3>
            {/* Answers are always in the page (readable by search engines and screen readers); CSS only collapses them. */}
            <div id={`faq-a-${i}`} role="region" aria-labelledby={`faq-q-${i}`}
              className={cn("grid transition-[grid-template-rows] duration-500 ease-out", isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
              <div className="overflow-hidden">
                <p className="max-w-3xl pb-6 text-ink-1">{it.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
