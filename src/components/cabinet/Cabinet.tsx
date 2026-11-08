"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase/client";
import type { SpecialistStatus } from "@/lib/supabase/types";
import { Notice } from "@/components/ui/Notice";
import { Button } from "@/components/ui/Button";
import { OrderList } from "./OrderList";
import { SpecialistEditor } from "./SpecialistEditor";
import { PriceList } from "./PriceList";
import { cn } from "@/lib/cn";

type Tab = "orders" | "incoming" | "profile" | "prices";

export function Cabinet() {
  const t = useTranslations();
  const { profile, signOut, refreshProfile } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const isSpecialist = profile!.role === "specialist";
  const tabs: Tab[] = isSpecialist ? ["incoming", "profile", "prices", "orders"] : ["orders"];
  const initial = params.get("tab") as Tab | null;
  const [tab, setTab] = useState<Tab>(initial && tabs.includes(initial) ? initial : tabs[0]);
  useEffect(() => { if (!tabs.includes(tab)) setTab(tabs[0] === "incoming" ? "profile" : tabs[0]); }, [tabs, tab]);
  const [status, setStatus] = useState<{ s: SpecialistStatus | "none"; reason: string | null } | null>(null);

  const loadStatus = () => {
    if (!isSpecialist) return;
    getSupabase()!.from("specialists").select("status, reject_reason").eq("id", profile!.id).maybeSingle()
      .then(({ data }) => setStatus(data ? { s: data.status as SpecialistStatus, reason: data.reject_reason } : { s: "none", reason: null }));
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(loadStatus, [isSpecialist, profile]);

  const becomeSpecialist = async () => {
    const { error } = await getSupabase()!.from("profiles").update({ role: "specialist" }).eq("id", profile!.id);
    if (!error) { await refreshProfile(); setTab("profile"); }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-ink-2">{t("cabinet.title")}</p>
          <h1 className="mt-1 text-h1 font-bold">{t("cabinet.hello", { name: profile!.full_name })}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {profile!.role === "admin" && <Link href="/admin" className="rounded-full glass px-5 py-2.5 text-sm font-semibold">{t("common.admin")}</Link>}
          {profile!.role === "client" && <Button variant="outline" size="sm" onClick={becomeSpecialist}>{t("nav.join")}</Button>}
          <Button variant="ghost" size="sm" onClick={async () => { await signOut(); router.replace("/"); }}>{t("common.signOut")}</Button>
        </div>
      </div>

      {isSpecialist && status && (
        <Notice className="mt-8" tone={status.s === "approved" ? "success" : status.s === "rejected" ? "danger" : "warning"}>
          {status.s === "approved" && (<>{t("cabinet.banner.approved")} <Link href={{ pathname: "/specialist", query: { id: profile!.id } }} className="font-semibold underline">{t("cabinet.banner.view")}</Link></>)}
          {status.s === "pending" && t("cabinet.banner.pending")}
          {status.s === "rejected" && t("cabinet.banner.rejected", { reason: status.reason ?? "—" })}
          {status.s === "none" && t("cabinet.banner.noProfile")}
        </Notice>
      )}

      {tabs.length > 1 && (
        <div role="tablist" className="-mx-4 mt-8 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
          {tabs.map((k) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
              className={cn("relative shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors", tab === k ? "text-white" : "glass text-ink-1 hover:text-ink-0")}>
              {tab === k && <motion.span layoutId="cab-tab" className="absolute inset-0 rounded-full bg-gradient-primary" transition={{ type: "spring", stiffness: 500, damping: 35 }} />}
              <span className="relative">{t(`cabinet.tabs.${k}`)}</span>
            </button>
          ))}
        </div>
      )}

      <div className="mt-8" role="tabpanel">
        {tab === "orders" && <OrderList mode="client" userId={profile!.id} />}
        {tab === "incoming" && <OrderList mode="specialist" userId={profile!.id} />}
        {tab === "profile" && <SpecialistEditor onSaved={loadStatus} />}
        {tab === "prices" && <PriceList userId={profile!.id} />}
      </div>
    </div>
  );
}
