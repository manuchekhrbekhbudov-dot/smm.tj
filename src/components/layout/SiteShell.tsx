import { useTranslations } from "next-intl";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations();
  return (
    <>
      <a href="#main" className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-[10001] focus-visible:rounded-full focus-visible:bg-purple focus-visible:px-4 focus-visible:py-2 focus-visible:text-white">
        {t("common.skip")}
      </a>
      <Header />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
