import { useTranslations } from "next-intl";
import { Marquee } from "@/components/fx/Marquee";
import { Icon, type IconName } from "@/components/ui/Icon";
import { clientWordmarks } from "@/content/site";

const socials: IconName[] = ["instagram", "tiktok", "telegram", "youtube", "facebook", "whatsapp"];

export function ClientsMarquee() {
  const t = useTranslations("home");
  return (
    <section className="relative border-y border-ink-3 py-12">
      <p className="container-x mb-8 text-center text-xs font-bold uppercase tracking-[0.3em] text-ink-2">{t("clients")}</p>
      <Marquee duration={40}>
        {clientWordmarks.map((c) => (
          <span key={c} className="mx-8 whitespace-nowrap font-display text-2xl font-bold text-ink-2 transition-colors duration-300 hover:text-ink-0 md:mx-12 md:text-4xl">
            {c}
          </span>
        ))}
      </Marquee>
      <Marquee duration={28} reverse className="mt-6">
        {socials.concat(socials).map((s, i) => (
          <span key={i} className="mx-3 flex h-14 w-14 items-center justify-center rounded-2xl glass text-ink-1 transition-all duration-300 hover:-translate-y-1 hover:text-purple hover:glow-sm">
            <Icon name={s} className="h-6 w-6" />
          </span>
        ))}
      </Marquee>
    </section>
  );
}
