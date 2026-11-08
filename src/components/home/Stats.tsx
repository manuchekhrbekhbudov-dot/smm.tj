import { useTranslations } from "next-intl";
import { Counter } from "@/components/fx/Counter";
import { Reveal } from "@/components/fx/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";

type Item = { value: number; suffix: string; label: string };

export function Stats() {
  const t = useTranslations("home.stats");
  const items = t.raw("items") as Item[];
  return (
    <section className="container-x py-20 md:py-36">
      <SectionHeader eyebrow={t("eyebrow")} title={t("title")} />
      <div className="mt-14 grid gap-px overflow-hidden rounded-[var(--radius-lg)] border border-ink-3 bg-ink-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it, i) => (
          <Reveal key={i} delay={i * 0.08} dir="scale" className="bg-bg-0">
            <div className="group relative h-full overflow-hidden p-8 md:p-10">
              <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-purple/0 blur-3xl transition-colors duration-700 group-hover:bg-purple/30" />
              <Counter to={it.value} suffix={it.suffix} className="relative block font-display text-[clamp(2.5rem,4.5vw,4rem)] font-black leading-none text-gradient" />
              <p className="relative mt-4 text-ink-1">{it.label}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
