import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Unbounded, Manrope } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Background } from "@/components/fx/Background";
import { SmoothScroll } from "@/components/fx/SmoothScroll";
import { Cursor } from "@/components/fx/Cursor";
import { Preloader } from "@/components/fx/Preloader";
import { themeScript } from "@/components/ui/ThemeToggle";
import { AuthProvider } from "@/lib/auth";
import "../globals.css";

const unbounded = Unbounded({
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  weight: ["500", "700", "800", "900"],
  variable: "--font-unbounded",
  display: "swap",
});
const manrope = Manrope({
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: { default: t("title"), template: "%s · SMM.TJ" },
    description: t("description"),
    alternates: { languages: { tg: "/tg", ru: "/ru" } },
  };
}

export const viewport: Viewport = {
  themeColor: "#05010A",
  width: "device-width",
  initialScale: 1,
};

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale === "tg" ? "tg" : "ru"} className={`${unbounded.variable} ${manrope.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <NextIntlClientProvider>
          <Preloader />
          <Background />
          <SmoothScroll />
          <Cursor />
          <AuthProvider>{children}</AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
