import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/ui/Logo";
import { Icon } from "@/components/ui/Icon";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/content/site";

export function Footer() {
  const t = useTranslations();
  return (
    <footer className="relative mt-10 overflow-hidden border-t border-ink-3">
      <div className="container-x grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-5 max-w-sm text-ink-2">{t("footer.tagline")}</p>
        </div>
        <nav aria-label={t("footer.forClients")}>
          <h2 className="font-sans text-sm font-bold uppercase tracking-widest text-ink-2">{t("footer.forClients")}</h2>
          <ul className="mt-5 space-y-3">
            <li><Link href="/specialists" className="text-ink-1 hover:text-purple">{t("nav.specialists")}</Link></li>
            <li><Link href="/guide" className="text-ink-1 hover:text-purple">{t("nav.guide")}</Link></li>
            <li><Link href="/about" className="text-ink-1 hover:text-purple">{t("nav.about")}</Link></li>
            <li><Link href="/login" className="text-ink-1 hover:text-purple">{t("common.login")}</Link></li>
          </ul>
        </nav>
        <nav aria-label={t("footer.forSpecialists")}>
          <h2 className="font-sans text-sm font-bold uppercase tracking-widest text-ink-2">{t("footer.forSpecialists")}</h2>
          <ul className="mt-5 space-y-3">
            <li><Link href={{ pathname: "/login", query: { role: "specialist" } }} className="text-ink-1 hover:text-purple">{t("nav.join")}</Link></li>
            <li><Link href="/cabinet" className="text-ink-1 hover:text-purple">{t("common.cabinet")}</Link></li>
            <li><Link href="/feedback" className="text-ink-1 hover:text-purple">{t("feedback.title")}</Link></li>
          </ul>
        </nav>
        <div>
          <h2 className="font-sans text-sm font-bold uppercase tracking-widest text-ink-2">{t("footer.contacts")}</h2>
          <ul className="mt-5 space-y-3">
            <li><a href="tel:+992504440101" className="text-ink-1 hover:text-purple">📞 +992 50 444 01 01</a></li>
            <li><a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-ink-1 hover:text-purple"><Icon name="instagram" className="h-4 w-4" /> Instagram: @{INSTAGRAM_HANDLE}</a></li>
            <li><a href="https://t.me/smmtj_login_bot" target="_blank" rel="noopener noreferrer" className="text-ink-1 hover:text-purple">✈️ Telegram: @smmtj_login_bot</a></li>
            <li className="text-ink-2">📍 {t("about.contacts.city")}</li>
          </ul>
        </div>
      </div>
      {/* Decorative wordmark drawn as SVG so it isn't treated as page text */}
      <div aria-hidden className="container-x select-none overflow-hidden">
        <svg viewBox="0 0 1000 170" className="block w-full translate-y-[14%]" role="presentation">
          <text x="500" y="150" textAnchor="middle" fontSize="190" fontWeight="700" letterSpacing="-8" fill="currentColor" className="text-ink-3" style={{ fontFamily: "var(--font-onest)" }}>SMM.TJ</text>
        </svg>
      </div>
      <div className="border-t border-ink-3">
        <div className="container-x flex flex-col justify-between gap-3 py-6 text-sm text-ink-2 md:flex-row">
          <p>© {new Date().getFullYear()} SMM.TJ. {t("footer.rights")}</p>
          <p className="flex flex-wrap gap-x-5 gap-y-1">
            <Link href="/privacy" className="hover:text-purple">{t("legal.privacy.title")}</Link>
            <Link href="/terms" className="hover:text-purple">{t("legal.terms.title")}</Link>
          </p>
          <p>{t("footer.made")}</p>
        </div>
      </div>
    </footer>
  );
}
