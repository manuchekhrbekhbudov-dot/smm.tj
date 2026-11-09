import { getTranslations } from "next-intl/server";

type Section = { h: string; p: string[] };

/** Plain, readable legal text (privacy policy / terms) from the messages file. */
export async function LegalPage({ doc }: { doc: "privacy" | "terms" }) {
  const t = await getTranslations("legal");
  const sections = t.raw(`${doc}.sections`) as Section[];
  return (
    <article className="container-x max-w-3xl pb-24 pt-36 md:pt-44">
      <p className="text-sm text-ink-2">{t("updated")}</p>
      <h1 className="mt-2 text-h1 font-bold">{t(`${doc}.title`)}</h1>
      <p className="mt-4 text-lg text-ink-1">{t(`${doc}.lead`)}</p>
      {sections.map((s) => (
        <section key={s.h} className="mt-10">
          <h2 className="text-h3 font-bold">{s.h}</h2>
          {s.p.map((x) => <p key={x} className="mt-3 leading-relaxed text-ink-1">{x}</p>)}
        </section>
      ))}
      <p className="mt-12 rounded-[var(--radius-md)] glass p-5 text-ink-1">{t("contact")} <a href="tel:+992504440101" className="font-semibold text-purple">+992 50 444 01 01</a></p>
    </article>
  );
}
