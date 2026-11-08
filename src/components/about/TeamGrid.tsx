"use client";
import { useTranslations } from "next-intl";
import { CaseVisual } from "@/components/home/CaseVisual";
import { Reveal } from "@/components/fx/Reveal";

type M = { name: string; role: string };
const hues: [string, string][] = [
  ["#8B5CF6", "#C026D3"], ["#A855F7", "#F472B6"], ["#7C3AED", "#22D3EE"],
  ["#C026D3", "#FB923C"], ["#8B5CF6", "#38BDF8"], ["#A855F7", "#C026D3"],
];

/** Team cards: generated portrait art with distortion on hover + initials monogram. */
export function TeamGrid() {
  const t = useTranslations("about");
  const team = t.raw("team") as M[];
  return (
    <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-3">
      {team.map((m, i) => {
        const initials = m.name.split(" ").map((p) => p[0]).join("");
        return (
          <Reveal key={m.name} delay={(i % 3) * 0.08}>
            <figure className="group">
              <div className="relative aspect-[3/4] overflow-hidden rounded-[var(--radius-lg)] border border-ink-3">
                <CaseVisual hue={hues[i % hues.length]} label="" mock={false} className="absolute inset-0" />
                <span className="absolute inset-0 flex items-center justify-center font-display text-[clamp(3rem,9vw,7rem)] font-black text-white/90 mix-blend-overlay transition-transform duration-700 group-hover:scale-110">
                  {initials}
                </span>
              </div>
              <figcaption className="mt-4">
                <p className="font-display text-lg font-bold md:text-xl">{m.name}</p>
                <p className="text-sm text-ink-2 md:text-base">{m.role}</p>
              </figcaption>
            </figure>
          </Reveal>
        );
      })}
    </div>
  );
}
