import { Eyebrow } from "./Card";
import { TextReveal } from "@/components/fx/TextReveal";
import { Reveal } from "@/components/fx/Reveal";
import { cn } from "@/lib/cn";

export function SectionHeader({ eyebrow, title, text, align = "left", className, as = "h2" }: {
  eyebrow: string; title: string; text?: string; align?: "left" | "center"; className?: string; as?: "h1" | "h2";
}) {
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
      <Reveal><Eyebrow>{eyebrow}</Eyebrow></Reveal>
      <TextReveal as={as} text={title} highlightFrom={-1} stagger={0.018} className={cn("mt-5 font-black", as === "h1" ? "text-display" : "text-h1")} />
      {text && <Reveal delay={0.15}><p className="mt-5 text-lg text-ink-1">{text}</p></Reveal>}
    </div>
  );
}
