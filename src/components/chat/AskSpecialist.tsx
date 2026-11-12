"use client";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth";
import { buttonClasses } from "@/components/ui/buttonClasses";

/** "Ask a question" on a specialist profile — for clients and guests (guests sign in first). */
export function AskSpecialist({ specialistId }: { specialistId: string }) {
  const t = useTranslations("chat");
  const { session, profile } = useAuth();
  if (session && profile && profile.role !== "client") return null;
  const href = session
    ? { pathname: "/messages", query: { to: specialistId } }
    : { pathname: "/login", query: { role: "client", next: `/messages?to=${specialistId}` } };
  return <Link href={href} className={buttonClasses("outline", "lg", "mt-3 w-full")}>💬 {t("ask")}</Link>;
}
