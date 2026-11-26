"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { Spinner } from "@/components/ui/Notice";

export function ToPanel() {
  const router = useRouter();
  const tab = useSearchParams().get("tab");
  useEffect(() => { router.replace({ pathname: "/panel", query: tab ? { s: tab } : {} }); }, [router, tab]);
  return <div className="flex min-h-dvh items-center justify-center"><Spinner className="h-10 w-10" /></div>;
}
