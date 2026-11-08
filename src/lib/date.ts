/** Locale for Intl date formatting: browsers rarely ship Tajik data, so fall back to Russian month names. */
export function dateLocale(locale: string) {
  if (locale === "ru") return "ru-RU";
  try {
    return Intl.DateTimeFormat.supportedLocalesOf(["tg-TJ"]).length ? "tg-TJ" : "ru-RU";
  } catch {
    return "ru-RU";
  }
}
