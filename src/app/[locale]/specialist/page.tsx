import { setRequestLocale } from "next-intl/server";
import { ClientOnly } from "@/components/ui/ClientOnly";
import { SiteShell } from "@/components/layout/SiteShell";
import { SpecialistProfile } from "@/components/market/SpecialistProfile";

export default async function SpecialistPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <SiteShell>
      <section className="container-x pb-24 pt-32 md:pt-40">
        <ClientOnly><SpecialistProfile /></ClientOnly>
      </section>
    </SiteShell>
  );
}
