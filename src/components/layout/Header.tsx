"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { LogoMark } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { AuthButton } from "./AuthButton";
import { ChatBadge } from "@/components/chat/ChatBadge";
import { LaunchBar } from "./LaunchBar";
import { cn } from "@/lib/cn";

const links = [
  { href: "/", key: "home" },
  { href: "/specialists", key: "specialists" },
  { href: "/guide", key: "guide" },
  { href: "/about", key: "about" },
] as const;

function LocaleSwitch() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("common");
  return (
    <div role="group" aria-label={t("language")} className="flex h-10 items-center rounded-full glass p-1 text-xs font-bold">
      {(["tg", "ru"] as const).map((l) => (
        <Link
          key={l}
          href={pathname}
          locale={l}
          aria-current={locale === l ? "true" : undefined}
          className={cn(
            "flex h-8 w-9 items-center justify-center rounded-full uppercase transition-colors",
            locale === l ? "bg-gradient-primary text-white" : "text-ink-2 hover:text-ink-0"
          )}
        >
          {l === "tg" ? "ТҶ" : "РУ"}
        </Link>
      ))}
    </div>
  );
}

export function Header() {
  const t = useTranslations();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <LaunchBar />
      <div className={cn("container-x transition-[padding] duration-300", scrolled ? "pt-2" : "pt-3 md:pt-4")}>
        <nav className={cn("flex h-14 items-center justify-between gap-2 rounded-full px-2 pl-3 md:h-16 md:pl-5", scrolled ? "glass-solid shadow-[0_14px_40px_-12px_rgb(0_0_0/0.45)]" : "glass")}>
          <Link href="/" aria-label="SMM.TJ" className="flex shrink-0 items-center gap-2">
            <LogoMark className="h-8 w-8 md:h-9 md:w-9" />
            <span className="hidden font-display text-lg font-bold tracking-tight min-[400px]:inline">SMM<span className="text-gradient">.TJ</span></span>
          </Link>

          <ul className="hidden items-center gap-1 lg:flex">
            {links.map((l) => {
              const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
              return (
                <li key={l.href}>
                  <Link href={l.href} className={cn("rounded-full px-4 py-2 text-sm font-medium transition-colors", active ? "bg-ink-3 text-ink-0" : "text-ink-2 hover:text-ink-0")}>
                    {t(`nav.${l.key}`)}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-1.5 md:gap-2">
            <LocaleSwitch />
            <ThemeToggle />
            <ChatBadge />
            <AuthButton className="hidden md:flex" />
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full glass lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? t("common.close") : t("common.menu")}
              onClick={() => setOpen((v) => !v)}
            >
              <span className="relative block h-3 w-4" aria-hidden>
                <span className={cn("absolute left-0 h-0.5 w-4 rounded bg-ink-0 transition-all duration-200", open ? "top-1.5 rotate-45" : "top-0")} />
                <span className={cn("absolute left-0 h-0.5 w-4 rounded bg-ink-0 transition-all duration-200", open ? "top-1.5 -rotate-45" : "top-2.5")} />
              </span>
            </button>
          </div>
        </nav>
      </div>

      {open && (
        <div id="mobile-menu" className="fixed inset-0 -z-10 flex flex-col bg-bg-0/95 px-5 pb-8 pt-[calc(6rem+var(--banner-h))] lg:hidden">
          <ul className="flex flex-col gap-1">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="block rounded-2xl px-4 py-4 text-2xl font-bold text-ink-0 active:bg-ink-3">{t(`nav.${l.key}`)}</Link>
              </li>
            ))}
          </ul>
          <div className="mt-auto">
            <AuthButton block />
          </div>
        </div>
      )}
    </header>
  );
}
