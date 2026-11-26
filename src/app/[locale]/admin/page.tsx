import { setRequestLocale } from "next-intl/server";
import { ClientOnly } from "@/components/ui/ClientOnly";
import { ToPanel } from "@/components/panel/ToPanel";

export const metadata = { robots: { index: false } };

/** Old address of the director's page: forwards to the separate panel (/panel), keeping ?tab=. */
export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ClientOnly><ToPanel /></ClientOnly>;
}
