import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteShell } from "@/components/layout/SiteShell";
import { PageHero } from "@/components/layout/PageHero";
import { Reveal } from "@/components/fx/Reveal";
import { TiltCard } from "@/components/fx/TiltCard";
import { Card } from "@/components/ui/Card";
import { TeamGrid } from "@/components/about/TeamGrid";
import { Stats } from "@/components/home/Stats";
import { CtaBand } from "@/components/home/CtaBand";

type V = { title: string; text: string };
type T = { year: string; text: string };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return { title: t("title"), description: t("subtitle") };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");
  const nav = await getTranslations("nav");
  const values = t.raw("values") as V[];
  const timeline = t.raw("timeline") as T[];

  return (
    <SiteShell>
      <PageHero eyebrow={nav("about")} title={t("title")} subtitle={t("subtitle")} />

      <section className="container-x grid gap-10 pb-24 lg:grid-cols-[1fr_1.4fr]">
        <Reveal><h2 className="text-h1 font-black">{t("storyTitle")}</h2></Reveal>
        <Reveal delay={0.1}><p className="text-xl leading-relaxed text-ink-1 md:text-2xl">{t("story")}</p></Reveal>
      </section>

      <section className="container-x pb-24">
        <Reveal><h2 className="mb-10 text-h1 font-black">{t("valuesTitle")}</h2></Reveal>
        <div className="grid gap-5 md:grid-cols-3">
          {values.map((v, i) => (
            <Reveal key={v.title} delay={i * 0.1} className="h-full">
              <TiltCard className="p-8">
                <span className="font-display text-5xl font-black text-gradient">0{i + 1}</span>
                <h3 className="mt-6 text-h3 font-bold">{v.title}</h3>
                <p className="mt-3 text-ink-1">{v.text}</p>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="container-x pb-24">
        <Reveal><h2 className="mb-10 text-h1 font-black">{t("teamTitle")}</h2></Reveal>
        <TeamGrid />
      </section>

      <Stats />

      <section className="container-x pb-24">
        <Reveal><h2 className="mb-12 text-h1 font-black">{t("timelineTitle")}</h2></Reveal>
        <ol className="grid gap-5 md:grid-cols-4">
          {timeline.map((s, i) => (
            <li key={s.year}>
              <Reveal delay={i * 0.1} className="h-full">
                <Card className="h-full">
                  <p className="font-display text-4xl font-black text-gradient">{s.year}</p>
                  <p className="mt-4 text-ink-1">{s.text}</p>
                </Card>
              </Reveal>
            </li>
          ))}
        </ol>
      </section>
      <CtaBand />
    </SiteShell>
  );
}
