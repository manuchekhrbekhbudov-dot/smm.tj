import { useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { SiteShell } from "@/components/layout/SiteShell";
import { Button } from "@/components/ui/Button";
import { Card, Badge, Eyebrow } from "@/components/ui/Card";
import { Input, Textarea, Toggle } from "@/components/ui/Field";
import { TiltCard } from "@/components/fx/TiltCard";
import { Counter } from "@/components/fx/Counter";
import { Marquee } from "@/components/fx/Marquee";
import { Reveal } from "@/components/fx/Reveal";
import { TextReveal } from "@/components/fx/TextReveal";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ds" });
  return { title: t("title"), robots: { index: false } };
}

const swatches = [
  { name: "bg-0", cls: "bg-bg-0" },
  { name: "bg-1", cls: "bg-bg-1" },
  { name: "bg-2", cls: "bg-bg-2" },
  { name: "bg-3", cls: "bg-bg-3" },
  { name: "violet #8B5CF6", cls: "bg-violet" },
  { name: "purple #A855F7", cls: "bg-purple" },
  { name: "magenta #C026D3", cls: "bg-magenta" },
  { name: "gradient", cls: "bg-gradient-primary" },
];

const brands = ["Instagram", "TikTok", "Telegram", "YouTube", "Facebook", "WhatsApp", "Threads", "VK"];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-ink-3 py-16">
      <Reveal><h2 className="mb-10 text-h2 font-bold">{title}</h2></Reveal>
      {children}
    </section>
  );
}

export default function DesignSystemPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("ds");
  const numLocale = "ru-RU"; // space thousands separator for both TG and RU

  return (
    <SiteShell>
      <div className="container-x pb-24 pt-36">
        <Eyebrow>SMM.TJ · v0.1</Eyebrow>
        <TextReveal trigger="mount" delay={0.3} text={t("title")} className="mt-4 text-display font-bold" />
        <p className="mt-6 max-w-2xl text-lg text-ink-1">{t("subtitle")}</p>

        <Section title={t("colors")}>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {swatches.map((s, i) => (
              <Reveal key={s.name} delay={i * 0.05}>
                <div className="overflow-hidden rounded-[var(--radius-md)] glass">
                  <div className={`h-28 ${s.cls} border-b border-ink-3`} />
                  <p className="px-4 py-3 font-mono text-xs text-ink-1">{s.name}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Section>

        <Section title={t("typography")}>
          <div className="space-y-6">
            <p className="text-hero font-bold text-gradient">Aa Ғғ Ҷҷ</p>
            <p className="text-h1 font-bold">Unbounded — Ҳ ҳ Қ қ Ӣ ӣ Ӯ ӯ</p>
            <p className="text-h3 font-semibold">Manrope 600 — Шабакаҳои иҷтимоӣ · Социальные сети</p>
            <p className="max-w-2xl text-ink-1">
              Manrope 400 — Мо барои бизнеси шумо контенти ҷолиб месозем, ки фурӯшро зиёд мекунад. Мы создаём контент, который продаёт.
            </p>
            <p className="tabular font-display text-h2 font-bold">1 234 567 TJS</p>
          </div>
        </Section>

        <Section title={t("buttons")}>
          <div className="flex flex-wrap items-center gap-4">
            <Button size="lg" magnetic>{t("primary")}</Button>
            <Button size="lg" variant="outline" magnetic>{t("outline")}</Button>
            <Button size="lg" variant="ghost">{t("ghost")}</Button>
            <Button size="md" loading>{t("loading")}</Button>
            <Button size="sm">{t("magnetic")} · sm</Button>
          </div>
          <h3 className="mb-4 mt-10 text-h3 font-bold">{t("statuses")}</h3>
          <div className="flex flex-wrap gap-3">
            <Badge>{t("statusNew")}</Badge>
            <Badge tone="warning">{t("statusProgress")}</Badge>
            <Badge tone="neutral">{t("statusReview")}</Badge>
            <Badge tone="success">{t("statusDone")}</Badge>
            <Badge tone="danger">{t("statusRejected")}</Badge>
          </div>
        </Section>

        <Section title={t("cards")}>
          <div className="grid gap-6 md:grid-cols-3">
            <Reveal dir="up"><Card className="h-full"><h3 className="text-h3 font-bold">{t("glassCard")}</h3><p className="mt-3 text-ink-1">{t("glassCardText")}</p></Card></Reveal>
            <Reveal dir="up" delay={0.1}><Card glowBorder className="h-full"><h3 className="text-h3 font-bold">{t("glowCard")}</h3><p className="mt-3 text-ink-1">{t("glowCardText")}</p></Card></Reveal>
            <Reveal dir="up" delay={0.2}>
              <TiltCard className="p-8">
                <div className="mb-6 h-12 w-12 rounded-2xl bg-gradient-primary glow-sm" />
                <h3 className="text-h3 font-bold">{t("tiltCard")}</h3>
                <p className="mt-3 text-ink-1">{t("tiltCardText")}</p>
              </TiltCard>
            </Reveal>
          </div>
        </Section>

        <Section title={t("forms")}>
          <div className="grid max-w-3xl gap-5 md:grid-cols-2">
            <Input label={t("name")} name="name" autoComplete="name" />
            <Input label={t("phone")} name="phone" type="tel" inputMode="tel" hint={t("phoneHint")} />
            <Input label={t("name")} name="err" error={t("required")} className="md:col-span-2" />
            <Textarea label={t("message")} name="message" className="md:col-span-2" />
            <Toggle label={t("notifications")} />
          </div>
        </Section>

        <Section title={t("counters")}>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { to: 2500000, suffix: "+", label: t("followers") },
              { to: 340, suffix: "+", label: t("projects") },
              { to: 120, suffix: "", label: t("clients") },
            ].map((c) => (
              <Card key={c.label}>
                <Counter to={c.to} suffix={c.suffix} locale={numLocale} className="font-display text-h1 font-bold text-gradient" />
                <p className="mt-2 text-ink-1">{c.label}</p>
              </Card>
            ))}
          </div>
        </Section>

        <Section title={t("marquee")}>
          <div className="space-y-4">
            <Marquee duration={25}>
              {brands.map((b) => (
                <span key={b} className="mx-8 font-display text-h2 font-bold text-ink-2 transition-colors hover:text-ink-0">{b}</span>
              ))}
            </Marquee>
            <Marquee duration={30} reverse>
              {brands.map((b) => (
                <span key={b} className="mx-3 rounded-full glass px-6 py-3 text-sm font-semibold">{b}</span>
              ))}
            </Marquee>
          </div>
        </Section>

        <Section title={t("textReveal")}>
          <TextReveal as="p" text={t("revealDemo")} className="text-display font-bold text-gradient" />
        </Section>
      </div>
    </SiteShell>
  );
}
