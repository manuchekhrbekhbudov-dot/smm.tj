"use client";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { buttonClasses } from "@/components/ui/buttonClasses";

const isChunkError = (e: Error) => /ChunkLoadError|Loading chunk|dynamically imported module|Failed to fetch/i.test(`${e.name} ${e.message}`);

/** Friendly error screen. After a new deploy an open tab may request old files: reload once automatically. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("errorPage");
  useEffect(() => {
    console.error(error);
    if (isChunkError(error)) {
      try {
        if (sessionStorage.getItem("smmtj:reloaded") !== "1") { sessionStorage.setItem("smmtj:reloaded", "1"); location.reload(); }
      } catch { location.reload(); }
    }
  }, [error]);
  return (
    <main className="container-x flex min-h-[80dvh] flex-col items-center justify-center pt-24 text-center">
      <div className="h-24 w-24 rounded-full orb" aria-hidden />
      <h1 className="mt-6 text-h1 font-bold">{t("title")}</h1>
      <p className="mt-3 max-w-md text-ink-1">{t("text")}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={() => { try { sessionStorage.removeItem("smmtj:reloaded"); } catch {} location.reload(); }} className={buttonClasses("primary", "lg")}>{t("reload")}</button>
        <Link href="/" onClick={() => reset()} className={buttonClasses("outline", "lg")}>{t("home")}</Link>
      </div>
    </main>
  );
}
