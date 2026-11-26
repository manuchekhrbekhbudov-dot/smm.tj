"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getSupabase } from "@/lib/supabase/client";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { buttonClasses } from "@/components/ui/buttonClasses";
import { RequestCard, type Req } from "@/components/requests/RequestsBoard";

/** Home: the newest open client requests — shows specialists there is real work here (hidden until requests exist). */
export function HomeRequests() {
  const t = useTranslations();
  const [d, setD] = useState<{ list: Req[]; count: number } | null>(null);
  useEffect(() => {
    const sb = getSupabase(); if (!sb) return;
    sb.from("mp_requests").select("*", { count: "exact" }).eq("status", "open").gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false }).limit(3)
      .then(({ data, count, error }) => { if (!error) setD({ list: (data as Req[]) ?? [], count: count ?? 0 }); });
  }, []);
  if (!d) return null;
  return (
    <section className="container-x py-20 md:py-28">
      <SectionHeader eyebrow={t("home.requests.eyebrow")} title={d.count ? t("home.requests.title", { count: d.count }) : t("home.requests.emptyTitle")} text={t("home.requests.text")} className="mb-10" />
      {d.list.length > 0 && <ul className="grid gap-4 md:grid-cols-3">{d.list.map((r) => <li key={r.id}><RequestCard r={r} /></li>)}</ul>}
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/requests" className={buttonClasses("primary", "md")}>{d.count ? t("home.requests.all") : t("home.requests.post")}</Link>
        <Link href="/join" className={buttonClasses("outline", "md")}>{t("home.requests.join")}</Link>
      </div>
    </section>
  );
}
