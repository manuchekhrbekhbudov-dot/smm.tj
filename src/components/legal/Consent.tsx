"use client";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/** "By continuing you agree to the Terms and the Privacy policy" — shown where a phone number is collected. */
export function Consent({ className = "" }: { className?: string }) {
  const t = useTranslations();
  return (
    <p className={`text-center text-xs text-ink-2 ${className}`}>
      {t.rich("auth.consent", {
        terms: () => <Link href="/terms" className="underline hover:text-purple">{t("legal.terms.title")}</Link>,
        privacy: () => <Link href="/privacy" className="underline hover:text-purple">{t("legal.privacy.title")}</Link>,
      })}
    </p>
  );
}
