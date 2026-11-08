import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/ui/Logo";
import { Icon, type IconName } from "@/components/ui/Icon";
import { contacts, serviceSlugs } from "@/content/site";

const social: { name: IconName; href: string; label: string }[] = [
  { name: "instagram", href: contacts.instagram, label: "Instagram" },
  { name: "tiktok", href: contacts.tiktok, label: "TikTok" },
  { name: "telegram", href: contacts.telegram, label: "Telegram" },
  { name: "whatsapp", href: contacts.whatsapp, label: "WhatsApp" },
];

export function Footer() {
  const t = useTranslations();
  return (
    <footer className="relative mt-10 overflow-hidden border-t border-ink-3">
      <div className="container-x grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-5 max-w-sm text-ink-2">{t("footer.tagline")}</p>
          <div className="mt-6 flex gap-3">
            {social.map((s) => (
              <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                className="flex h-11 w-11 items-center justify-center rounded-full glass text-ink-1 transition-all duration-300 hover:-translate-y-1 hover:text-purple hover:glow-sm">
                <Icon name={s.name} className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>
        <nav aria-label={t("footer.company")}>
          <h2 className="font-sans text-sm font-bold uppercase tracking-widest text-ink-2">{t("footer.company")}</h2>
          <ul className="mt-5 space-y-3">
            {(["about", "portfolio", "pricing", "contact"] as const).map((k) => (
              <li key={k}><Link href={`/${k}`} className="text-ink-1 transition-colors hover:text-purple">{t(`nav.${k}`)}</Link></li>
            ))}
            <li><Link href="/login" className="text-ink-1 transition-colors hover:text-purple">{t("footer.cabinet")}</Link></li>
          </ul>
        </nav>
        <nav aria-label={t("footer.servicesCol")}>
          <h2 className="font-sans text-sm font-bold uppercase tracking-widest text-ink-2">{t("footer.servicesCol")}</h2>
          <ul className="mt-5 space-y-3">
            {serviceSlugs.map((s) => (
              <li key={s}><Link href={`/services/${s}`} className="text-ink-1 transition-colors hover:text-purple">{t(`services.items.${s}.title`)}</Link></li>
            ))}
          </ul>
        </nav>
        <div>
          <h2 className="font-sans text-sm font-bold uppercase tracking-widest text-ink-2">{t("footer.contactsCol")}</h2>
          <ul className="mt-5 space-y-3 text-ink-1">
            <li><a href={contacts.phoneHref} className="tabular hover:text-purple">{contacts.phone}</a></li>
            <li><a href={`mailto:${contacts.email}`} className="hover:text-purple">{contacts.email}</a></li>
            <li>{t("contact.addressValue")}</li>
            <li className="text-ink-2">{t("contact.hoursValue")}</li>
          </ul>
        </div>
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
