"use client";
import { useEffect, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth";
import { supabaseConfigured } from "@/lib/supabase/config";
import { Notice, Spinner } from "@/components/ui/Notice";

/** Renders children only for a signed-in user with a filled profile; otherwise redirects. */
export function RequireAuth({ children, allowIncomplete = false }: { children: ReactNode; allowIncomplete?: boolean }) {
  const t = useTranslations("common");
  const { ready, session, profile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!ready || !supabaseConfigured) return;
    if (!session) router.replace({ pathname: "/login", query: { next: pathname } });
    else if (!allowIncomplete && profile && !profile.full_name) router.replace("/onboarding");
  }, [ready, session, profile, allowIncomplete, router, pathname]);

  if (!supabaseConfigured) return <Notice tone="warning">{t("notConfigured")}</Notice>;
  if (ready && session && profile === null) return <Notice tone="danger">{t("error")}</Notice>;
  if (!ready || !session || !profile || (!allowIncomplete && !profile.full_name)) {
    return <div className="flex min-h-[40vh] items-center justify-center"><Spinner className="h-10 w-10" /></div>;
  }
  return <>{children}</>;
}
