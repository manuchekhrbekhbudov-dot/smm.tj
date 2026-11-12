import { setRequestLocale } from "next-intl/server";
import { ClientOnly } from "@/components/ui/ClientOnly";
import { SiteShell } from "@/components/layout/SiteShell";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { Messages } from "@/components/chat/Messages";

export const metadata = { robots: { index: false } };

export default async function MessagesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <SiteShell>
      <section className="container-x min-h-[80dvh] pb-24 pt-32 md:pt-40">
        <RequireAuth><ClientOnly><Messages /></ClientOnly></RequireAuth>
      </section>
    </SiteShell>
  );
}
