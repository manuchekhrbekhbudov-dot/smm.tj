import { getTranslations, setRequestLocale } from "next-intl/server";
import { pageAlternates } from "@/lib/site-url";
import { SiteShell } from "@/components/layout/SiteShell";
import { PageHero } from "@/components/layout/PageHero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Trust } from "@/components/home/Trust";
import { Faq } from "@/components/home/Faq";
import { CtaBand } from "@/components/home/CtaBand";
import { Link } from "@/i18n/navigation";
import { buttonClasses } from "@/components/ui/buttonClasses";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/content/site";

type Rule = { title: string; text: string };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return { title: t("title"), description: t("subtitle"), alternates: pageAlternates(locale, "/about") };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  return (
    <SiteShell>
      <PageHero eyebrow="SMM.TJ" title={t("about.title")} subtitle={t("about.subtitle")} />
      <section className="container-x grid gap-10 pb-20 lg:grid-cols-[1fr_1.4fr]">
        <h2 className="text-h1 font-bold">{t("about.whoTitle")}</h2>
        <div className="space-y-4 text-lg text-ink-1">
          {(t.raw("about.who") as string[]).map((p) => <p key={p}>{p}</p>)}
        </div>
      </section>
      <section className="container-x grid gap-5 pb-20 md:grid-cols-2">
        {(["client", "specialist"] as const).map((w) => (
          <div key={w} className="relative rounded-[var(--radius-lg)] glass glass-edge p-8">
            <p className="text-3xl" aria-hidden>{w === "client" ? "🛍️" : "🚀"}</p>
            <h3 className="mt-4 text-h2 font-bold">{t(`about.for.${w}.title`)}</h3>
            <ul className="mt-4 space-y-2 text-ink-1">
              {(t.raw(`about.for.${w}.items`) as string[]).map((x) => <li key={x} className="flex gap-2"><span className="text-success">✓</span>{x}</li>)}
            </ul>
            <Link href={{ pathname: "/guide", hash: w }} className={buttonClasses(w === "client" ? "primary" : "outline", "md", "mt-6")}>{t(`about.for.${w}.cta`)}</Link>
          </div>
        ))}
      </section>
      <section className="container-x pb-20">
        <h2 className="mb-10 text-h1 font-bold">{t("home.how.title")}</h2>
        <HowItWorks />
      </section>
      <section className="container-x pb-20">
        <h2 className="mb-10 text-h1 font-bold">{t("about.rulesTitle")}</h2>
        <Trust items={t.raw("about.rules") as Rule[]} />
      </section>
      <section className="container-x grid gap-12 pb-20 lg:grid-cols-[1fr_1.6fr]">
        <h2 className="text-h1 font-bold">{t("home.faq.title")}</h2>
        <Faq />
      </section>
      <section className="container-x pb-20">
        <div className="grid gap-6 rounded-[var(--radius-lg)] glass glass-edge p-8 sm:grid-cols-2 md:p-10 lg:grid-cols-4">
          <div>
            <p className="text-sm text-ink-2">{t("about.contacts.director")}</p>
            <a href="tel:+992504440101" className="mt-1 block font-display text-2xl font-bold hover:text-purple">+992 50 444 01 01</a>
          </div>
          <div>
            <p className="text-sm text-ink-2">{t("about.contacts.bot")}</p>
            <a href="https://t.me/smmtj_login_bot" target="_blank" rel="noopener noreferrer" className="mt-1 block font-display text-2xl font-bold hover:text-purple">@smmtj_login_bot</a>
          </div>
          <div>
            <p className="text-sm text-ink-2">Instagram</p>
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="mt-1 block font-display text-2xl font-bold hover:text-purple">@{INSTAGRAM_HANDLE}</a>
          </div>
          <div>
            <p className="text-sm text-ink-2">{t("about.contacts.launch")}</p>
            <p className="mt-1 font-display text-2xl font-bold">{t("about.contacts.launchDate")} · {t("about.contacts.city")}</p>
          </div>
        </div>
      </section>
      <CtaBand />
    </SiteShell>
  );
}
