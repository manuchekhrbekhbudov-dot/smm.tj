import { useTranslations } from "next-intl";
import { Header } from "./Header";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations();
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[10001] focus:rounded-full focus:bg-purple focus:px-4 focus:py-2 focus:text-white">
        {t("common.skip")}
      </a>
      <Header />
      <main id="main">{children}</main>
      <footer className="container-x border-t border-ink-3 py-10 text-sm text-ink-2">
        © {new Date().getFullYear()} SMM.TJ. {t("footer.rights")}
      </footer>
    </>
  );
}
