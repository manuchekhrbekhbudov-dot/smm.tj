import { setRequestLocale, getTranslations } from "next-intl/server";
import { ClientOnly } from "@/components/ui/ClientOnly";
import { SiteShell } from "@/components/layout/SiteShell";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { FeedbackForm } from "@/components/trust/FeedbackForm";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "feedback" });
  return { title: t("title"), robots: { index: false } };
}

export default async function FeedbackPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <SiteShell>
      <section className="container-x min-h-[80dvh] max-w-3xl pb-24 pt-32 md:pt-40">
        <RequireAuth><ClientOnly><FeedbackForm /></ClientOnly></RequireAuth>
      </section>
    </SiteShell>
  );
}
