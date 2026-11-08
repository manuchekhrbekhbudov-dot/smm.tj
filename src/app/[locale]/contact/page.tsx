import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteShell } from "@/components/layout/SiteShell";
import { PageHero } from "@/components/layout/PageHero";
import { Reveal } from "@/components/fx/Reveal";
import { Card } from "@/components/ui/Card";
import { Icon, type IconName } from "@/components/ui/Icon";
import { ContactForm } from "@/components/contact/ContactForm";
import { contacts } from "@/content/site";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return { title: t("title"), description: t("subtitle") };
}

const channels: { name: IconName; label: string; href: string; color: string }[] = [
  { name: "telegram", label: "Telegram", href: contacts.telegram, color: "from-[#2AABEE] to-[#229ED9]" },
  { name: "whatsapp", label: "WhatsApp", href: contacts.whatsapp, color: "from-[#25D366] to-[#128C7E]" },
  { name: "instagram", label: "Instagram", href: contacts.instagram, color: "from-[#F58529] via-[#DD2A7B] to-[#8134AF]" },
];

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");

  return (
    <SiteShell>
      <PageHero eyebrow={t("title")} title={t("title")} subtitle={t("subtitle")} />

      <section className="container-x grid gap-8 pb-20 lg:grid-cols-[1.5fr_1fr]">
        <Reveal>
          <Card glowBorder className="md:p-10">
            <Suspense fallback={<div className="min-h-[420px]" />}>
              <ContactForm />
            </Suspense>
          </Card>
        </Reveal>

        <div className="space-y-6">
          <Reveal delay={0.1}>
            <Card>
              <h2 className="text-h3 font-bold">{t("channels")}</h2>
              <div className="mt-6 grid gap-3">
                {channels.map((c) => (
                  <a key={c.name} href={c.href} target="_blank" rel="noopener noreferrer" data-cursor
                    className="group flex items-center gap-4 rounded-2xl border border-ink-3 p-3 pr-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-purple/50 hover:glow-sm">
                    <span className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${c.color} text-white`}>
                      <Icon name={c.name} className="h-6 w-6" />
                    </span>
                    <span className="flex-1 font-semibold">{c.label}</span>
                    <Icon name="arrowUpRight" className="h-5 w-5 text-ink-2 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-purple" />
                  </a>
                ))}
              </div>
            </Card>
          </Reveal>
          <Reveal delay={0.2}>
            <Card>
              <ul className="space-y-5">
                {([
                  ["phone", t("phoneLabel"), <a key="p" href={contacts.phoneHref} className="tabular hover:text-purple">{contacts.phone}</a>],
                  ["mail", t("emailLabel"), <a key="m" href={`mailto:${contacts.email}`} className="hover:text-purple">{contacts.email}</a>],
                  ["pin", t("address"), t("addressValue")],
                  ["clock", t("hours"), t("hoursValue")],
                ] as [IconName, string, React.ReactNode][]).map(([icon, label, value]) => (
                  <li key={label} className="flex gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple/15 text-purple"><Icon name={icon} className="h-5 w-5" /></span>
                    <span><span className="block text-sm text-ink-2">{label}</span><span className="block font-semibold">{value}</span></span>
                  </li>
                ))}
              </ul>
            </Card>
          </Reveal>
        </div>
      </section>

      <section className="container-x pb-24">
        <Reveal dir="scale">
          <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-ink-3">
            <iframe
              title={t("mapTitle")}
              src={contacts.mapEmbed}
              loading="lazy"
              className="map-frame block h-[420px] w-full"
              referrerPolicy="no-referrer"
            />
            <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_80px_rgb(5_1_10/0.6)]" />
            <a href={contacts.mapLink} target="_blank" rel="noopener noreferrer"
              className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-white glow-sm">
              <Icon name="pin" className="h-4 w-4" /> {t("addressValue")}
            </a>
          </div>
        </Reveal>
      </section>
    </SiteShell>
  );
}
