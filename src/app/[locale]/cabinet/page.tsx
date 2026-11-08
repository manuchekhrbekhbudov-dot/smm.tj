import { setRequestLocale } from "next-intl/server";
import { ClientOnly } from "@/components/ui/ClientOnly";
import { SiteShell } from "@/components/layout/SiteShell";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { Cabinet } from "@/components/cabinet/Cabinet";

export const metadata = { robots: { index: false } };

export default async function CabinetPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <SiteShell>
      <section className="container-x min-h-[80dvh] pb-24 pt-32 md:pt-40">
        <RequireAuth><ClientOnly><Cabinet /></ClientOnly></RequireAuth>
      </section>
    </SiteShell>
  );
}
