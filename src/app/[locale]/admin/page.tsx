import { setRequestLocale } from "next-intl/server";
import { SiteShell } from "@/components/layout/SiteShell";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { AdminPanel } from "@/components/admin/AdminPanel";

export const metadata = { robots: { index: false } };

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <SiteShell>
      <section className="container-x min-h-[80dvh] pb-24 pt-32 md:pt-40">
        <RequireAuth><AdminPanel /></RequireAuth>
      </section>
    </SiteShell>
  );
}
