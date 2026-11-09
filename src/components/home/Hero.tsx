"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { TextReveal } from "@/components/fx/TextReveal";
import { buttonClasses } from "@/components/ui/buttonClasses";
import { Icon, type IconName } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import { useAuth } from "@/lib/auth";

const HeroScene = dynamic(() => import("@/components/fx/HeroScene"), { ssr: false });

/**
 * WebGL only on capable desktop/laptop screens, mounted after the page is idle.
 * Phones get a static CSS glass orb: instant, smooth and battery-friendly.
 */
function use3d() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    const capable =
      window.matchMedia("(min-width: 1024px) and (hover: hover) and (prefers-reduced-motion: no-preference)").matches &&
      !(nav.deviceMemory !== undefined && nav.deviceMemory <= 4) &&
      (nav.hardwareConcurrency || 8) > 4 &&
      !nav.connection?.saveData;
    if (!capable) return;
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    const go = () => setOk(true);
    if (w.requestIdleCallback) w.requestIdleCallback(go, { timeout: 2000 });
    else setTimeout(go, 800);
  }, []);
  return ok;
}

const bubbles: { icon: IconName; className: string; delay: string }[] = [
  { icon: "instagram", className: "left-[8%] top-[18%] md:left-[18%] md:top-[12%]", delay: "0s" },
  { icon: "tiktok", className: "right-[8%] top-[10%] md:right-[18%] md:top-[8%]", delay: "1.2s" },
  { icon: "reels", className: "left-[12%] bottom-[6%] hidden md:flex md:left-[24%]", delay: "2s" },
  { icon: "ads", className: "right-[12%] bottom-[8%] hidden md:flex md:right-[24%]", delay: "0.6s" },
];

function RoleCard({ icon, title, text, cta, href, primary }: {
  icon: IconName; title: string; text: string; cta: string; href: string | { pathname: string; query: Record<string, string> }; primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col rounded-[var(--radius-lg)] p-5 text-left transition-[transform,box-shadow] duration-300 hover:-translate-y-1 active:scale-[0.99] md:p-7",
        primary ? "gradient-border glass glass-edge glow-md" : "glass glass-edge"
      )}
    >
      <span className="flex items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl orb text-white md:h-14 md:w-14">
          <Icon name={icon} className="h-6 w-6 md:h-7 md:w-7" />
        </span>
        <span>
          <span className="block font-display text-lg font-bold md:text-xl">{title}</span>
          <span className="mt-0.5 block text-sm text-ink-1 md:text-base">{text}</span>
        </span>
      </span>
      <span className={buttonClasses(primary ? "primary" : "outline", "md", "mt-5 w-full")}>
        {cta} <Icon name="arrow" className="h-5 w-5 transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

/** Shown instead of "Who are you?" once the visitor is signed in. */
function SignedInActions({ name, role }: { name: string; role: "client" | "specialist" | "admin" }) {
  const t = useTranslations("home.hero.me");
  const links = {
    client: { primary: "/specialists", secondary: "/cabinet" },
    specialist: { primary: "/cabinet", secondary: { pathname: "/cabinet", query: { tab: "profile" } } },
    admin: { primary: "/admin", secondary: "/specialists" },
  }[role];
  return (
    <div className="mt-8 w-full max-w-2xl rounded-[var(--radius-lg)] glass glass-edge p-6 md:p-8">
      <p className="font-display text-xl font-bold md:text-2xl">{t("hello", { name })}</p>
      <p className="mt-2 text-ink-1">{t(`${role}.text`)}</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link href={links.primary} className={buttonClasses("primary", "lg", "w-full")}>{t(`${role}.primary`)} <Icon name="arrow" className="h-5 w-5" /></Link>
        <Link href={links.secondary} className={buttonClasses("outline", "lg", "w-full")}>{t(`${role}.secondary`)}</Link>
      </div>
    </div>
  );
}

export function Hero() {
  const t = useTranslations();
  const show3d = use3d();
  const { session, profile } = useAuth();
  const signedIn = Boolean(session && profile && profile.full_name);

  return (
    <section className="relative flex flex-col items-center overflow-hidden pb-10 pt-20 md:pt-24">
      {/* visual */}
      <div className="relative h-[150px] w-full max-w-[900px] md:h-[42svh] md:min-h-[320px]">
        <div aria-hidden className="absolute left-1/2 top-1/2 h-[60%] w-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet/35 blur-[70px]" />
        <div aria-hidden className={cn("absolute left-[calc(50%-3.5rem)] top-[calc(50%-3.5rem)] h-28 w-28 animate-float rounded-full orb transition-opacity duration-1000 md:left-[calc(50%-7.5rem)] md:top-[calc(50%-7.5rem)] md:h-60 md:w-60", show3d && "opacity-0")} />
        {show3d && <div aria-hidden className="absolute inset-0 fade-up"><HeroScene /></div>}
        {bubbles.map((b) => (
          <span key={b.icon} aria-hidden className={cn("absolute flex h-12 w-12 items-center justify-center rounded-[18px] glass glass-edge text-ink-0 md:h-16 md:w-16", b.className)}>
            <span className="animate-float" style={{ animationDelay: b.delay }}><Icon name={b.icon} className="h-6 w-6 md:h-7 md:w-7" /></span>
          </span>
        ))}
      </div>

      <div className="container-x relative flex flex-col items-center text-center">
        <span className="inline-flex items-center gap-2 rounded-full glass glass-edge px-4 py-2 text-xs font-semibold text-ink-1 md:text-sm">
          <span className="h-2 w-2 rounded-full orb" />
          {t("home.hero.eyebrow")}
        </span>
        <TextReveal trigger="mount" delay={0.05} stagger={0.04} text={t("home.hero.title")} highlightFrom={-2} className="mt-5 max-w-4xl text-hero font-bold" />
        <p className="mt-4 max-w-2xl text-base text-ink-1 md:text-xl">{t("home.hero.subtitle")}</p>

        {signedIn ? (
          <SignedInActions name={profile!.full_name} role={profile!.role} />
        ) : (
          <>
        {/* Two clear entrances */}
          <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-ink-2 md:mt-8">{t("home.hero.choose")}</p>
          <div className="mt-4 grid w-full max-w-4xl gap-4 md:grid-cols-2">
            <RoleCard primary icon="smm" title={t("home.hero.client.title")} text={t("home.hero.client.text")} cta={t("home.hero.client.cta")} href="/specialists" />
            <RoleCard icon="star" title={t("home.hero.specialist.title")} text={t("home.hero.specialist.text")} cta={t("home.hero.specialist.cta")} href={{ pathname: "/login", query: { role: "specialist" } }} />
          </div>
          </>
        )}

      </div>
    </section>
  );
}
