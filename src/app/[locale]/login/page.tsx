import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteShell } from "@/components/layout/SiteShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { Card } from "@/components/ui/Card";
import { LogoMark } from "@/components/ui/Logo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("title"), robots: { index: false } };
}

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");
  return (
    <SiteShell>
      <section className="container-x flex min-h-[90dvh] items-center justify-center pb-16 pt-32">
        <Card glowBorder className="w-full max-w-md">
          <LogoMark className="h-12 w-12" />
          <h1 className="mt-6 text-h2 font-black">{t("title")}</h1>
          <p className="mb-8 mt-2 text-ink-1">{t("subtitle")}</p>
          <Suspense fallback={null}><LoginForm /></Suspense>
        </Card>
      </section>
    </SiteShell>
  );
}
