"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { Link, usePathname } from "@/i18n/navigation";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { AuthButton } from "./AuthButton";
import { cn } from "@/lib/cn";

const links = [
  { href: "/", key: "home" },
  { href: "/specialists", key: "specialists" },
  { href: "/about", key: "how" },
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
            "relative flex h-8 w-10 items-center justify-center rounded-full uppercase transition-colors",
            locale === l ? "text-white" : "text-ink-2 hover:text-ink-0"
          )}
        >
          {locale === l && (
            <motion.span layoutId="locale-pill" className="absolute inset-0 rounded-full bg-gradient-primary" transition={{ type: "spring", stiffness: 500, damping: 35 }} />
          )}
          <span className="relative">{l === "tg" ? "ТҶ" : "РУ"}</span>
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
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className={cn("container-x transition-all duration-500", scrolled ? "pt-3" : "pt-5")}>
        <nav
          className={cn(
            "flex h-16 items-center justify-between rounded-full px-3 pl-5 transition-all duration-500",
            scrolled ? "border border-[var(--glass-border)] bg-bg-1/75 backdrop-blur-xl shadow-[0_10px_40px_rgb(0_0_0/0.25)]" : "border border-transparent"
          )}
        >
          <Link href="/" aria-label="SMM.TJ" data-cursor><Logo /></Link>

          <ul className="hidden items-center gap-1 lg:flex">
            {links.map((l) => {
              const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className={cn("relative rounded-full px-4 py-2 text-sm font-medium transition-colors", active ? "text-ink-0" : "text-ink-2 hover:text-ink-0")}
                  >
                    {active && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-ink-3" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
                    <span className="relative">{t(`nav.${l.key}`)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 sm:flex">
              <LocaleSwitch />
              <ThemeToggle />
            </div>
            <AuthButton className="hidden md:flex" />
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full glass lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? t("common.close") : t("common.menu")}
              onClick={() => setOpen((v) => !v)}
            >
              <span className="relative block h-3 w-4">
                <span className={cn("absolute left-0 h-0.5 w-4 rounded bg-ink-0 transition-all duration-300", open ? "top-1.5 rotate-45" : "top-0")} />
                <span className={cn("absolute left-0 h-0.5 w-4 rounded bg-ink-0 transition-all duration-300", open ? "top-1.5 -rotate-45" : "top-2.5")} />
              </span>
            </button>
          </div>
        </nav>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ clipPath: "circle(0% at calc(100% - 40px) 40px)" }}
            animate={{ clipPath: "circle(150% at calc(100% - 40px) 40px)" }}
            exit={{ clipPath: "circle(0% at calc(100% - 40px) 40px)" }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 -z-10 flex flex-col justify-between bg-bg-1 px-6 pb-10 pt-28 lg:hidden"
          >
            <ul className="flex flex-col gap-2">
              {links.map((l, i) => (
                <motion.li key={l.href} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.06 }}>
                  <Link href={l.href} className="font-display text-4xl font-bold text-ink-0 hover:text-gradient">{t(`nav.${l.key}`)}</Link>
                </motion.li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center gap-3">
              <LocaleSwitch />
              <ThemeToggle />
              <AuthButton className="ml-auto" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
