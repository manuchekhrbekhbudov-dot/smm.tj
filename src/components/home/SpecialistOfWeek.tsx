"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getSupabase } from "@/lib/supabase/client";
import { SPECIALIST_SELECT, type Specialist } from "@/lib/supabase/types";
import { withPlans } from "@/lib/plans";
import { SpecialistCard } from "@/components/market/SpecialistCard";
import { SectionHeader } from "@/components/ui/SectionHeader";

/** Home: the best-rated specialist (real reviews only). Nothing is shown while nobody qualifies. */
export function SpecialistOfWeek() {
  const t = useTranslations("home.week");
  const [s, setS] = useState<Specialist | null>(null);
  useEffect(() => {
    const sb = getSupabase(); if (!sb) return;
    void (async () => {
      const { data: id, error } = await sb.rpc("mp_specialist_of_week");
      if (error || !id) return;
      const { data } = await sb.from("mp_specialists").select(SPECIALIST_SELECT).eq("id", id as string).maybeSingle();
      if (data) setS((await withPlans(sb, [data as unknown as Specialist]))[0]);
    })();
  }, []);
  if (!s) return null;
  return (
    <section className="container-x py-20 md:py-28">
      <SectionHeader eyebrow={`🏆 ${t("eyebrow")}`} title={t("title")} text={t("text")} className="mb-10" />
      <div className="max-w-md"><SpecialistCard s={s} /></div>
    </section>
  );
}
