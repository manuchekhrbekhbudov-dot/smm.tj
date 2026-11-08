import { useTranslations } from "next-intl";
import { Marquee } from "@/components/fx/Marquee";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Icon } from "@/components/ui/Icon";

type Item = { name: string; role: string; text: string };

function Quote({ it }: { it: Item }) {
  const initials = it.name.split(" ").map((p) => p[0]).join("").slice(0, 2);
  return (
    <figure className="mx-3 flex w-[min(85vw,420px)] shrink-0 flex-col rounded-[var(--radius-lg)] glass p-7 transition-all duration-500 hover:border-purple/50 hover:glow-sm">
      <div className="flex items-center justify-between">
        <Icon name="quote" className="h-8 w-8 text-purple" />
        <div className="flex gap-0.5 text-warning">{Array.from({ length: 5 }).map((_, i) => <Icon key={i} name="star" className="h-4 w-4" />)}</div>
      </div>
      <blockquote className="mt-5 flex-1 text-ink-1">“{it.text}”</blockquote>
      <figcaption className="mt-6 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-primary font-display text-sm font-bold text-white">{initials}</span>
        <span>
          <span className="block font-semibold">{it.name}</span>
          <span className="block text-sm text-ink-2">{it.role}</span>
        </span>
      </figcaption>
    </figure>
  );
}

export function Testimonials() {
  const t = useTranslations("home.testimonials");
  const items = t.raw("items") as Item[];
  return (
    <section className="py-20 md:py-36">
      <SectionHeader eyebrow={t("eyebrow")} title={t("title")} align="center" className="container-x" />
      <div className="mt-14 space-y-6">
        <Marquee duration={60}>{items.map((it) => <Quote key={it.name} it={it} />)}</Marquee>
        <Marquee duration={70} reverse>{[...items].reverse().map((it) => <Quote key={it.name} it={it} />)}</Marquee>
      </div>
    </section>
  );
}
