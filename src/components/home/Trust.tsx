import { useTranslations } from "next-intl";
import { Reveal } from "@/components/fx/Reveal";
import { TiltCard } from "@/components/fx/TiltCard";
import { Icon, type IconName } from "@/components/ui/Icon";

type Item = { title: string; text: string };
const icons: IconName[] = ["check", "quote", "star"];

export function Trust({ items }: { items?: Item[] }) {
  const t = useTranslations("home.trust");
  const list = items ?? (t.raw("items") as Item[]);
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {list.map((it, i) => (
        <Reveal key={it.title} delay={i * 0.08} className="h-full">
          <TiltCard className="p-8" max={6}>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple/15 text-purple"><Icon name={icons[i % icons.length]} className="h-6 w-6" /></span>
            <h3 className="mt-6 text-h3 font-bold">{it.title}</h3>
            <p className="mt-3 text-ink-1">{it.text}</p>
          </TiltCard>
        </Reveal>
      ))}
    </div>
  );
}
