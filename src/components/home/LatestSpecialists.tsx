"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getSupabase } from "@/lib/supabase/client";
import { SPECIALIST_SELECT, type Specialist } from "@/lib/supabase/types";
import { SpecialistCard } from "@/components/market/SpecialistCard";
import { sortByPlan, withPlans } from "@/lib/plans";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Notice";
import { buttonClasses } from "@/components/ui/buttonClasses";

export function LatestSpecialists() {
  const t = useTranslations();
  const [list, setList] = useState<Specialist[] | null>(null);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) { setList([]); return; }
    // Premium / paid specialists are featured first, then the newest.
    sb.from("mp_specialists").select(SPECIALIST_SELECT).eq("status", "approved").order("created_at", { ascending: false }).limit(60)
      .then(async ({ data }) => setList(sortByPlan(await withPlans(sb, (data as unknown as Specialist[]) ?? [])).slice(0, 6)));
  }, []);

  if (list === null) {
    return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-56" />)}</div>;
  }
  if (list.length === 0) {
    return (
      <Card className="flex flex-col items-start gap-5 md:flex-row md:items-center md:justify-between">
        <p className="text-lg text-ink-1">{t("home.latest.empty")}</p>
        <Link href={{ pathname: "/login", query: { role: "specialist" } }} className={buttonClasses("primary", "md")}>{t("home.latest.emptyCta")}</Link>
      </Card>
    );
  }
  return (
    <div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((s) => <SpecialistCard key={s.id} s={s} />)}
      </div>
      <div className="mt-10 text-center">
        <Link href="/specialists" className={buttonClasses("outline", "lg")}>{t("common.viewAll")}</Link>
      </div>
    </div>
  );
}
