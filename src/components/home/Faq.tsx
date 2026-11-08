"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

type Item = { q: string; a: string };

export function Faq() {
  const t = useTranslations();
  const items = t.raw("faq") as Item[];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="divide-y divide-ink-3 border-y border-ink-3">
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <div key={i}>
            <h3>
              <button
                type="button"
                id={`faq-q-${i}`}
                aria-expanded={isOpen}
                aria-controls={`faq-a-${i}`}
                onClick={() => setOpen(isOpen ? null : i)}
                className="group flex w-full items-center justify-between gap-6 py-6 text-left font-sans text-lg font-semibold md:text-xl"
              >
                <span className={cn("transition-colors", isOpen ? "text-purple" : "group-hover:text-purple")}>{it.q}</span>
                <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all duration-500", isOpen ? "rotate-45 border-transparent bg-gradient-primary text-white" : "border-ink-3")}>
                  <Icon name="plus" className="h-5 w-5" />
                </span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`faq-a-${i}`}
                  role="region"
                  aria-labelledby={`faq-q-${i}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <p className="max-w-3xl pb-6 text-ink-1">{it.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
