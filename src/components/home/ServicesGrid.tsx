import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { TiltCard } from "@/components/fx/TiltCard";
import { Reveal } from "@/components/fx/Reveal";
import { Icon } from "@/components/ui/Icon";
import { serviceSlugs, servicePrice } from "@/content/site";

export function ServicesGrid() {
  const t = useTranslations("services");
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {serviceSlugs.map((slug, i) => (
        <Reveal key={slug} delay={(i % 3) * 0.08}>
          <Link href={`/services/${slug}`} data-cursor={t("from") + " " + servicePrice[slug]} className="block h-full">
            <TiltCard className="flex h-full flex-col p-7 md:p-8">
              <div className="flex items-start justify-between">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary text-white glow-sm transition-transform duration-500 group-hover:rotate-[-8deg] group-hover:scale-110">
                  <Icon name={slug} className="h-7 w-7" />
                </span>
                <span className="font-display text-sm text-ink-2">0{i + 1}</span>
              </div>
              <h3 className="mt-8 text-h3 font-bold">{t(`items.${slug}.title`)}</h3>
              <p className="mt-3 flex-1 text-ink-1">{t(`items.${slug}.short`)}</p>
              <div className="mt-8 flex items-center justify-between border-t border-ink-3 pt-5">
                <span className="text-sm text-ink-2">
                  {t("from")} <span className="tabular font-bold text-ink-0">{servicePrice[slug].toLocaleString("ru-RU")}</span> TJS
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-3 transition-all duration-300 group-hover:border-transparent group-hover:bg-gradient-primary group-hover:text-white">
                  <Icon name="arrowUpRight" className="h-4 w-4" />
                </span>
              </div>
            </TiltCard>
          </Link>
        </Reveal>
      ))}
    </div>
  );
}
