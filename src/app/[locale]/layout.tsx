import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Onest } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Background } from "@/components/fx/Background";
import { themeScript } from "@/components/ui/ThemeToggle";
import { AuthProvider } from "@/lib/auth";
import { SITE_URL } from "@/lib/site-url";
import { INSTAGRAM_URL } from "@/content/site";
import "../globals.css";

const onest = Onest({
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  variable: "--font-onest",
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    metadataBase: new URL(`${SITE_URL}/`),
    title: { default: t("title"), template: "%s · SMM.TJ" },
    description: t("description"),
    openGraph: {
      type: "website",
      siteName: "SMM.TJ",
      title: t("title"),
      description: t("description"),
      locale: locale === "ru" ? "ru_RU" : "tg_TJ",
      url: `${SITE_URL}/${locale}/`,
      images: [{ url: `${SITE_URL}/og.png`, width: 1200, height: 630, alt: "SMM.TJ" }],
    },
    twitter: { card: "summary_large_image", title: t("title"), description: t("description"), images: [`${SITE_URL}/og.png`] },
    applicationName: "SMM.TJ",
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
    <html lang={locale === "tg" ? "tg" : "ru"} className={onest.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* Organization info for search engines (links the Instagram profile to the site) */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org", "@type": "Organization", name: "SMM.TJ", url: `${SITE_URL}/${locale}/`,
          logo: `${SITE_URL}/icon.svg`, sameAs: [INSTAGRAM_URL, "https://t.me/smmtj_login_bot"],
          contactPoint: { "@type": "ContactPoint", telephone: "+992504440101", contactType: "customer support", areaServed: "TJ", availableLanguage: ["tg", "ru"] },
        }) }} />
      </head>
      <body>
        <NextIntlClientProvider>
          <Background />
          <AuthProvider>{children}</AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
