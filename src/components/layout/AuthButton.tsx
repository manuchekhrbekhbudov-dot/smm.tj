"use client";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth";
import { buttonClasses } from "@/components/ui/buttonClasses";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";

/** Header auth control: Login when signed out, avatar → cabinet (and Admin link) when signed in. */
export function AuthButton({ className, block = false }: { className?: string; block?: boolean }) {
  const t = useTranslations("common");
  const { session, profile } = useAuth();
  if (!session) {
    return <Link href="/login" className={cn(buttonClasses("primary", "sm", "h-10 px-5"), block && "h-12 w-full", className)}>{t("login")}</Link>;
  }
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Link href={profile?.role === "admin" ? "/admin" : "/cabinet"} className="flex h-10 items-center gap-2 rounded-full glass pl-1 pr-4 text-sm font-semibold hover:glow-sm" aria-label={t("cabinet")}>
        <Avatar name={profile?.full_name || "?"} url={profile?.avatar_url} size={32} />
        <span className="max-w-[10ch] truncate">{profile?.full_name || t("cabinet")}</span>
      </Link>
    </div>
  );
}
