import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["tg", "ru"],
  defaultLocale: "tg",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];
