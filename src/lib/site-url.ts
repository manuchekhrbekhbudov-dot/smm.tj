/** Public site origin + base path (GitHub Pages by default). Override with NEXT_PUBLIC_SITE_URL. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://manuchekhrbekhbudov-dot.github.io/smm.tj").replace(/\/$/, "");

/** Canonical + hreflang for a public page path like "" or "/specialists". */
export function pageAlternates(locale: string, path = "") {
  return {
    canonical: `${SITE_URL}/${locale}${path}/`,
    languages: { tg: `${SITE_URL}/tg${path}/`, ru: `${SITE_URL}/ru${path}/`, "x-default": `${SITE_URL}/tg${path}/` },
  };
}
