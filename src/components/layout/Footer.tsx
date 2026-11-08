import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/ui/Logo";

export function Footer() {
  const t = useTranslations();
  return (
    <footer className="relative mt-10 overflow-hidden border-t border-ink-3">
      <div className="container-x grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-5 max-w-sm text-ink-2">{t("footer.tagline")}</p>
        </div>
        <nav aria-label={t("footer.forClients")}>
          <h2 className="font-sans text-sm font-bold uppercase tracking-widest text-ink-2">{t("footer.forClients")}</h2>
          <ul className="mt-5 space-y-3">
            <li><Link href="/specialists" className="text-ink-1 hover:text-purple">{t("nav.specialists")}</Link></li>
            <li><Link href="/about" className="text-ink-1 hover:text-purple">{t("nav.how")}</Link></li>
            <li><Link href="/login" className="text-ink-1 hover:text-purple">{t("common.login")}</Link></li>
          </ul>
        </nav>
        <nav aria-label={t("footer.forSpecialists")}>
          <h2 className="font-sans text-sm font-bold uppercase tracking-widest text-ink-2">{t("footer.forSpecialists")}</h2>
          <ul className="mt-5 space-y-3">
            <li><Link href={{ pathname: "/login", query: { role: "specialist" } }} className="text-ink-1 hover:text-purple">{t("nav.join")}</Link></li>
            <li><Link href="/cabinet" className="text-ink-1 hover:text-purple">{t("common.cabinet")}</Link></li>
          </ul>
        </nav>
      </div>
      <div aria-hidden className="container-x select-none overflow-hidden">
        <p className="translate-y-[18%] text-center font-display text-[clamp(4rem,19vw,18rem)] font-black leading-none text-ink-3">SMM.TJ</p>
      </div>
      <div className="border-t border-ink-3">
        <div className="container-x flex flex-col justify-between gap-3 py-6 text-sm text-ink-2 md:flex-row">
          <p>© {new Date().getFullYear()} SMM.TJ. {t("footer.rights")}</p>
          <p>{t("footer.made")}</p>
        </div>
      </div>
    </footer>
  );
}
