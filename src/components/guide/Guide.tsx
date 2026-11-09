"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { buttonClasses } from "@/components/ui/buttonClasses";
import { cn } from "@/lib/cn";

type Step = { icon: string; title: string; text: string; cta?: string; href?: string };
type Who = "client" | "specialist";

/** Step-by-step guide with two tracks: client and SMM specialist (#client / #specialist). */
export function Guide() {
  const t = useTranslations("guide");
  const [who, setWho] = useState<Who>("client");
  useEffect(() => {
    const read = () => setWho(window.location.hash === "#specialist" ? "specialist" : "client");
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  const pick = (w: Who) => { setWho(w); history.replaceState(null, "", `#${w}`); };
  const steps = t.raw(`${who}.steps`) as Step[];
  const rules = t.raw(`${who}.remember`) as string[];

  return (
    <div>
      <div role="tablist" className="mx-auto grid max-w-xl grid-cols-2 gap-1 rounded-full glass p-1.5">
        {(["client", "specialist"] as const).map((w) => (
          <button key={w} type="button" role="tab" aria-selected={who === w} onClick={() => pick(w)}
            className={cn("h-12 rounded-full text-sm font-bold transition-colors md:text-base", who === w ? "bg-gradient-primary text-white glow-sm" : "text-ink-1 hover:text-ink-0")}>
            {t(`${w}.tab`)}
          </button>
        ))}
      </div>
      <p className="mx-auto mt-6 max-w-2xl text-center text-ink-1">{t(`${who}.intro`)}</p>

      <ol className="relative mx-auto mt-12 max-w-3xl space-y-5">
        <span aria-hidden className="absolute bottom-6 left-[27px] top-6 w-0.5 bg-gradient-to-b from-violet via-purple to-transparent md:left-[31px]" />
        {steps.map((s, i) => (
          <li key={s.title} className="relative flex gap-4 md:gap-6">
            <span className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl orb text-2xl md:h-16 md:w-16">{s.icon}</span>
            <div className="flex-1 rounded-[var(--radius-lg)] glass glass-edge p-5 md:p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-purple">{t("step", { n: i + 1 })}</p>
              <h3 className="mt-1 text-h3 font-bold">{s.title}</h3>
              <p className="mt-2 text-ink-1">{s.text}</p>
              {s.cta && s.href && (
                <Link href={s.href} className={buttonClasses("outline", "sm", "mt-4")}>{s.cta}</Link>
              )}
            </div>
          </li>
        ))}
      </ol>

      <div className="mx-auto mt-12 max-w-3xl rounded-[var(--radius-lg)] border border-warning/40 bg-warning/10 p-6 md:p-8">
        <h3 className="text-h3 font-bold">⚖️ {t("rememberTitle")}</h3>
        <ul className="mt-4 space-y-2 text-ink-1">
          {rules.map((r) => <li key={r} className="flex gap-2"><span className="text-warning">•</span>{r}</li>)}
        </ul>
      </div>

      <div className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-3">
        <Link href={who === "client" ? "/specialists" : { pathname: "/login", query: { role: "specialist" } }} className={buttonClasses("primary", "lg")}>{t(`${who}.start`)}</Link>
        <Link href="/about" className={buttonClasses("ghost", "lg")}>{t("aboutLink")}</Link>
      </div>
    </div>
  );
}
