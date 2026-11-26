"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getSupabase } from "@/lib/supabase/client";
import { PLAN_PRICES } from "@/lib/plans";
import { buttonClasses } from "@/components/ui/buttonClasses";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Reveal } from "@/components/fx/Reveal";

/** "Become a specialist" landing: why join, 4 steps, what the profile needs, honest live numbers, FAQ. */
export function JoinPage() {
  const t = useTranslations("join");
  const [n, setN] = useState<{ approved: number; requests: number; users: number } | null>(null);
  useEffect(() => {
    const sb = getSupabase(); if (!sb) return;
    void Promise.all([
      sb.rpc("mp_public_counts"),
      sb.from("mp_requests").select("id", { count: "exact", head: true }).eq("status", "open").gt("expires_at", new Date().toISOString()),
    ]).then(([c, r]) => {
      const row = Array.isArray(c.data) ? c.data[0] : c.data;
      if (row) setN({ approved: Number(row.specialists_approved), users: Number(row.users), requests: r.error ? 0 : r.count ?? 0 });
    });
  }, []);
  const cta = (cls = "") => (
    <Link href={{ pathname: "/login", query: { role: "specialist" } }} className={buttonClasses("primary", "lg", cls)}>{t("cta")} →</Link>
  );
  const benefits = t.raw("benefits") as { icon: string; title: string; text: string }[];
  const steps = t.raw("steps") as { title: string; text: string }[];
  const needs = t.raw("needs") as string[];
  const faq = t.raw("faq") as { q: string; a: string }[];

  return (
    <div>
      {/* hero */}
      <section className="container-x pb-12 pt-32 text-center md:pt-40">
        <p className="mx-auto inline-flex rounded-full glass px-4 py-1.5 text-sm font-semibold text-ink-1">🚀 {t("eyebrow")}</p>
        <h1 className="mx-auto mt-5 max-w-4xl text-display font-bold">{t("title")}</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-ink-1">{t("subtitle")}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {cta()}
          <Link href="/requests" className={buttonClasses("outline", "lg")}>{t("seeRequests")}</Link>
        </div>
        {n && (
          // real numbers only; zeros are left out rather than shown
          <ul className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-3">
            {([["users", n.users], ["requests", n.requests], ["approved", n.approved]] as const).filter(([, v]) => v > 0).map(([k, v]) => (
              <li key={k} className="min-w-[180px] flex-1 rounded-[var(--radius-md)] glass p-4"><b className="block font-display text-3xl">{v}</b><span className="text-sm text-ink-2">{t(`stats.${k}`)}</span></li>
            ))}
          </ul>
        )}
      </section>

      {/* benefits */}
      <section className="container-x py-16">
        <SectionHeader eyebrow={t("benefitsEyebrow")} title={t("benefitsTitle")} className="mb-10" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b) => (
            <Reveal key={b.title}>
              <article className="h-full rounded-[var(--radius-lg)] glass glass-edge p-6">
                <p className="text-3xl" aria-hidden>{b.icon}</p>
                <h3 className="mt-3 font-display text-lg font-bold">{b.title}</h3>
                <p className="mt-2 text-ink-1">{b.text.replace("{top}", String(PLAN_PRICES.top))}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* steps */}
      <section className="container-x py-16">
        <SectionHeader eyebrow={t("stepsEyebrow")} title={t("stepsTitle")} className="mb-10" />
        <ol className="grid gap-4 md:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.title} className="rounded-[var(--radius-lg)] glass p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary font-bold text-white">{i + 1}</span>
              <h3 className="mt-4 font-display text-lg font-bold">{s.title}</h3>
              <p className="mt-2 text-sm text-ink-1">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* what the profile needs */}
      <section className="container-x py-16">
        <div className="rounded-[var(--radius-xl)] border border-purple/30 bg-purple/5 p-6 md:p-10">
          <h2 className="text-h2 font-bold">{t("needsTitle")}</h2>
          <p className="mt-2 text-ink-1">{t("needsLead")}</p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {needs.map((x) => <li key={x} className="flex gap-3 rounded-xl glass px-4 py-3"><span aria-hidden>✅</span><span>{x}</span></li>)}
          </ul>
          <div className="mt-8">{cta()}</div>
        </div>
      </section>

      {/* faq */}
      <section className="container-x py-16">
        <SectionHeader eyebrow={t("faqEyebrow")} title={t("faqTitle")} className="mb-8" />
        <div className="space-y-3">
          {faq.map((f) => (
            <details key={f.q} className="group rounded-[var(--radius-md)] glass p-5">
              <summary className="cursor-pointer list-none font-semibold marker:hidden">{f.q}<span className="float-right transition-transform group-open:rotate-45">＋</span></summary>
              <p className="mt-3 text-ink-1">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="container-x pb-24 pt-8 text-center">
        <h2 className="text-h2 font-bold">{t("finalTitle")}</h2>
        <p className="mx-auto mt-3 max-w-xl text-ink-1">{t("finalText")}</p>
        <div className="mt-7">{cta()}</div>
      </section>
    </div>
  );
}
