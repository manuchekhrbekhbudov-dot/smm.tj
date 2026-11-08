import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { buttonClasses } from "@/components/ui/buttonClasses";
import { SiteShell } from "@/components/layout/SiteShell";

export default function NotFound() {
  const t = useTranslations();
  return (
    <SiteShell>
      <section className="container-x flex min-h-[80dvh] flex-col items-start justify-center pt-32">
        <p className="font-display text-hero font-bold text-gradient">404</p>
        <h1 className="mt-4 text-h1 font-bold">{t("notFound.title")}</h1>
        <p className="mt-4 text-ink-1">{t("notFound.text")}</p>
        <Link href="/" className={buttonClasses("primary", "md", "mt-10")}>{t("soon.back")}</Link>
      </section>
    </SiteShell>
  );
}
