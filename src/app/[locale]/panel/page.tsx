import { setRequestLocale } from "next-intl/server";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { ClientOnly } from "@/components/ui/ClientOnly";
import { PanelApp } from "@/components/panel/PanelApp";

export const metadata = { title: "Панели директор · SMM.TJ", robots: { index: false, follow: false } };

/** The director's separate web app — no public header, footer, helper or visit counter. */
export default async function PanelPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div id="main">
      <ClientOnly>
        <RequireAuth><PanelApp /></RequireAuth>
      </ClientOnly>
    </div>
  );
}
