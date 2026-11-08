import { useTranslations } from "next-intl";
import { Reveal } from "@/components/fx/Reveal";
import { Card } from "@/components/ui/Card";

type Step = { title: string; text: string };

export function HowItWorks() {
  const t = useTranslations("home.how");
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {(["client", "specialist"] as const).map((side, si) => (
        <Reveal key={side} delay={si * 0.1} className="h-full">
          <Card glowBorder={side === "specialist"} className="h-full">
            <h3 className="text-h3 font-bold">{t(`${side}.title`)}</h3>
            <ol className="mt-8 space-y-7">
              {(t.raw(`${side}.steps`) as Step[]).map((s, i) => (
                <li key={s.title} className="flex gap-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-primary font-display font-bold text-white">{i + 1}</span>
                  <div>
                    <p className="text-lg font-semibold">{s.title}</p>
                    <p className="mt-1 text-ink-1">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </Reveal>
      ))}
    </div>
  );
}
