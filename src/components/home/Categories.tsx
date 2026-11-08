import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { TiltCard } from "@/components/fx/TiltCard";
import { Reveal } from "@/components/fx/Reveal";
import { Icon, type IconName } from "@/components/ui/Icon";
import { specialtySlugs } from "@/content/site";

const icons: Record<string, IconName> = {
  smm: "smm", reels: "reels", design: "design", ads: "ads", branding: "branding", production: "production", copywriting: "quote", consulting: "star",
};

export function Categories() {
  const t = useTranslations("specialties");
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {specialtySlugs.map((slug, i) => (
        <Reveal key={slug} delay={(i % 4) * 0.06}>
          <Link href={{ pathname: "/specialists", query: { s: slug } }} className="block h-full">
            <TiltCard className="p-6" max={8}>
              <div className="flex h-full flex-col">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl orb text-white transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110">
                <Icon name={icons[slug]} className="h-6 w-6" />
              </span>
              <h3 className="mt-6 font-display text-lg font-bold">{t(`${slug}.title`)}</h3>
              <p className="mt-2 text-sm text-ink-1">{t(`${slug}.short`)}</p>
              <span className="mt-auto self-end pt-4 text-ink-2 transition-colors group-hover:text-purple"><Icon name="arrowUpRight" className="h-5 w-5" /></span>
              </div>
            </TiltCard>
          </Link>
        </Reveal>
      ))}
    </div>
  );
}
