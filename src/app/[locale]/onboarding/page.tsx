import { getTranslations, setRequestLocale } from "next-intl/server";
import { ClientOnly } from "@/components/ui/ClientOnly";
import { SiteShell } from "@/components/layout/SiteShell";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { Onboarding } from "@/components/auth/Onboarding";
import { Card } from "@/components/ui/Card";

export const metadata = { robots: { index: false } };

export default async function OnboardingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("onboarding");
  return (
    <SiteShell>
      <section className="container-x flex min-h-[90dvh] items-center justify-center pb-16 pt-32">
        <Card glowBorder className="w-full max-w-xl">
          <h1 className="text-h2 font-bold">{t("title")}</h1>
          <p className="mb-8 mt-2 text-ink-1">{t("subtitle")}</p>
          <RequireAuth allowIncomplete><ClientOnly><Onboarding /></ClientOnly></RequireAuth>
        </Card>
      </section>
    </SiteShell>
  );
}
