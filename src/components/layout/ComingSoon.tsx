import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { buttonClasses } from "@/components/ui/buttonClasses";
import { Eyebrow } from "@/components/ui/Card";
import { TextReveal } from "@/components/fx/TextReveal";
import { SiteShell } from "./SiteShell";

export function ComingSoon({ eyebrow }: { eyebrow: string }) {
  const t = useTranslations("soon");
  return (
    <SiteShell>
      <section className="container-x flex min-h-[80dvh] flex-col justify-center pt-32">
        <Eyebrow>{eyebrow}</Eyebrow>
        <TextReveal trigger="mount" delay={0.3} text={t("title")} className="mt-6 text-display font-black text-gradient" />
        <p className="mt-6 max-w-xl text-lg text-ink-1">{t("text")}</p>
        <div className="mt-10"><Link href="/" className={buttonClasses("outline", "md")}>{t("back")}</Link></div>
      </section>
    </SiteShell>
  );
}
