"use client";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth";
import { LogoMark } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Avatar } from "@/components/ui/Avatar";
import { Notice } from "@/components/ui/Notice";
import { Specialists, Reviews } from "@/components/admin/AdminPanel";
import { Analytics } from "@/components/admin/Analytics";
import { Payments } from "@/components/admin/Payments";
import { Complaints, FeedbackList } from "@/components/admin/TrustAdmin";
import { Finance } from "@/components/admin/Finance";
import { RequestsAdmin } from "./RequestsAdmin";
import { Dashboard, loadCounts, type Counts } from "./Dashboard";
import { cn } from "@/lib/cn";

const SECTIONS = ["overview", "pending", "approved", "rejected", "requests", "finance", "payments", "complaints", "reviews", "feedback", "stats"] as const;
type Section = (typeof SECTIONS)[number];
const ICON: Record<Section, string> = {
  overview: "🏠", pending: "🕒", approved: "✅", rejected: "⛔", requests: "📣", finance: "💰", payments: "🧾",
  complaints: "⚠️", reviews: "⭐", feedback: "💡", stats: "📈",
};
const GROUPS: Section[][] = [["overview"], ["pending", "approved", "rejected"], ["requests", "reviews", "complaints", "feedback"], ["finance", "payments", "stats"]];
const BADGE: Partial<Record<Section, keyof Counts>> = { pending: "pending", payments: "payments", complaints: "complaints", feedback: "feedback", requests: "requests" };
// old ?tab= links of the previous admin page
const LEGACY: Record<string, Section> = { pending: "pending", approved: "approved", rejected: "rejected", finance: "finance", payments: "payments", complaints: "complaints", reviews: "reviews", feedback: "feedback", stats: "stats" };

/** The director's separate web app: own address (/panel), own layout with a sidebar, no public header/footer. */
export function PanelApp() {
  const t = useTranslations();
  const { profile, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const fromUrl = (params.get("s") ?? LEGACY[params.get("tab") ?? ""] ?? "overview") as Section;
  const [s, setS] = useState<Section>(SECTIONS.includes(fromUrl) ? fromUrl : "overview");
  const [menu, setMenu] = useState(false);
  const [counts, setCounts] = useState<Counts | null>(null);

  const refresh = useCallback(() => { void loadCounts().then(setCounts); }, []);
  useEffect(() => { if (profile?.role === "admin") refresh(); }, [profile?.role, refresh, s]);
  useEffect(() => { document.title = `${t(`panel.nav.${s}`)} · ${t("panel.title")}`; }, [s, t]);

  const go = (k: string) => {
    const next = (SECTIONS as readonly string[]).includes(k) ? (k as Section) : "overview";
    setS(next); setMenu(false);
    router.replace({ pathname, query: next === "overview" ? {} : { s: next } });
    window.scrollTo({ top: 0 });
  };

  if (profile?.role !== "admin") {
    return (
      <div className="mx-auto max-w-md p-8">
        <Notice tone="danger">{t("admin.notAdmin")}</Notice>
        <Link href="/" className="mt-4 inline-block font-semibold text-purple underline">{t("panel.toSite")}</Link>
      </div>
    );
  }

  const nav = (
    <nav aria-label={t("panel.title")} className="space-y-5">
      {GROUPS.map((g, i) => (
        <ul key={i} className="space-y-1">
          {g.map((k) => {
            const n = BADGE[k] && counts ? counts[BADGE[k]!] : 0;
            return (
              <li key={k}>
                <button type="button" onClick={() => go(k)} aria-current={s === k ? "page" : undefined}
                  className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors",
                    s === k ? "bg-gradient-primary text-white" : "text-ink-1 hover:bg-ink-3 hover:text-ink-0")}>
                  <span aria-hidden className="w-5 text-center">{ICON[k]}</span>
                  <span className="flex-1">{t(`panel.nav.${k}`)}</span>
                  {n > 0 && <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", s === k ? "bg-white/25" : "bg-danger text-white")}>{n}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      ))}
    </nav>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      {/* sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-ink-3 bg-bg-1/70 p-4 lg:flex">
        <div className="mb-6 flex items-center gap-2 px-2">
          <LogoMark className="h-9 w-9 shrink-0" />
          <div className="leading-tight"><p className="font-display font-bold">SMM<span className="text-gradient">.TJ</span></p><p className="text-xs text-ink-2">{t("panel.title")}</p></div>
        </div>
        <div className="flex-1 overflow-y-auto pr-1">{nav}</div>
        <div className="mt-4 space-y-2 border-t border-ink-3 pt-4">
          <div className="flex items-center gap-2 px-2"><Avatar name={profile.full_name || "Д"} url={profile.avatar_url} size={32} /><span className="truncate text-sm font-semibold">{profile.full_name || t("panel.director")}</span></div>
          <div className="flex items-center gap-2 px-2"><ThemeToggle /></div>
          <a href="../" className="block rounded-xl px-3 py-2 text-sm font-semibold text-ink-1 hover:bg-ink-3">🌐 {t("panel.toSite")}</a>
          <button type="button" onClick={async () => { await signOut(); router.replace("/"); }} className="block w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-ink-1 hover:bg-ink-3">🚪 {t("common.signOut")}</button>
        </div>
      </aside>

      {/* top bar (phones / tablets) */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-ink-3 bg-bg-0/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2"><LogoMark className="h-8 w-8 shrink-0" /><span className="font-display font-bold">{t("panel.title")}</span></div>
        <button type="button" onClick={() => setMenu((v) => !v)} aria-expanded={menu} aria-controls="panel-menu" className="relative rounded-full glass px-4 py-2 text-sm font-semibold">
          {menu ? "✕" : "☰"} {t("common.menu")}
          {counts && (counts.pending + counts.payments + counts.complaints) > 0 && !menu && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-danger" />}
        </button>
      </header>
      {menu && (
        <div id="panel-menu" className="fixed inset-x-0 bottom-0 top-[57px] z-40 overflow-y-auto bg-bg-0 p-4 lg:hidden">
          {nav}
          <div className="mt-6 space-y-2 border-t border-ink-3 pt-4">
            <a href="../" className="block rounded-xl px-3 py-2 font-semibold">🌐 {t("panel.toSite")}</a>
            <button type="button" onClick={async () => { await signOut(); router.replace("/"); }} className="block w-full rounded-xl px-3 py-2 text-left font-semibold">🚪 {t("common.signOut")}</button>
          </div>
        </div>
      )}

      <main className="min-w-0 px-4 py-6 md:px-8 md:py-10">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-6 text-h2 font-bold">{ICON[s]} {t(`panel.nav.${s}`)}</h1>
          {s === "overview" && <Dashboard counts={counts} go={go} />}
          {(s === "pending" || s === "approved" || s === "rejected") && <Specialists key={s} status={s} />}
          {s === "requests" && <RequestsAdmin />}
          {s === "finance" && <Finance />}
          {s === "payments" && <Payments />}
          {s === "complaints" && <Complaints />}
          {s === "reviews" && <Reviews />}
          {s === "feedback" && <FeedbackList />}
          {s === "stats" && <Analytics />}
        </div>
      </main>
    </div>
  );
}
