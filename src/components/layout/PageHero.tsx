import { Eyebrow } from "@/components/ui/Card";
import { TextReveal } from "@/components/fx/TextReveal";
import { Reveal } from "@/components/fx/Reveal";

export function PageHero({ eyebrow, title, subtitle, children }: { eyebrow: string; title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <section className="container-x pb-16 pt-40 md:pb-24 md:pt-48">
      <Reveal><Eyebrow>{eyebrow}</Eyebrow></Reveal>
      <TextReveal trigger="mount" delay={0.35} text={title} highlightFrom={-1} className="mt-6 max-w-5xl text-display font-black" />
      {subtitle && <Reveal delay={0.5}><p className="mt-6 max-w-2xl text-lg text-ink-1 md:text-xl">{subtitle}</p></Reveal>}
      {children}
    </section>
  );
}
