"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";

/** Opens the helper chat with a question (works from any component). */
export function askHelper(q: string) {
  window.dispatchEvent(new CustomEvent("smmtj-ask", { detail: q }));
}

/** Big "What do you need?" bar at the top of the home page — the first thing a client sees. */
export function AskBar() {
  const t = useTranslations("assistant.bar");
  const [q, setQ] = useState("");
  const examples = [t("ex1"), t("ex2"), t("ex3")];
  return (
    <div className="mt-7 w-full max-w-2xl">
      <form onSubmit={(e) => { e.preventDefault(); if (q.trim()) { askHelper(q.trim()); setQ(""); } }}
        className="flex items-center gap-2 rounded-full glass glass-edge p-2 pl-5 glow-sm focus-within:ring-2 focus-within:ring-purple">
        <span aria-hidden className="text-xl">✨</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} maxLength={300} aria-label={t("label")} placeholder={t("placeholder")}
          className="h-12 min-w-0 flex-1 bg-transparent text-base text-ink-0 outline-none placeholder:text-ink-2 md:text-lg" />
        <button type="submit" className="h-12 shrink-0 rounded-full bg-gradient-primary px-5 font-semibold text-white md:px-7">{t("cta")}</button>
      </form>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {examples.map((x) => (
          <button key={x} type="button" onClick={() => askHelper(x)} className="rounded-full bg-ink-3 px-3.5 py-1.5 text-xs text-ink-1 hover:text-ink-0 md:text-sm">{x}</button>
        ))}
      </div>
    </div>
  );
}
