"use client";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { usePathname, useRouter } from "@/i18n/navigation";
import { getSupabase } from "@/lib/supabase/client";
import { SPECIALIST_SELECT, type Specialist } from "@/lib/supabase/types";
import { citySlugs, specialtySlugs } from "@/content/site";
import { SpecialistCard } from "./SpecialistCard";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Field";
import { Notice, Skeleton } from "@/components/ui/Notice";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

type Sort = "rating" | "price" | "new";

export function Catalog() {
  const t = useTranslations();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const sb = getSupabase();

  const specialty = params.get("s") ?? "";
  const city = params.get("city") ?? "";
  const maxPrice = params.get("max") ?? "";
  const sort = (params.get("sort") as Sort) || "rating";

  const [list, setList] = useState<Specialist[] | null>(null);
  const [error, setError] = useState(false);

  const setParam = (k: string, v: string) => {
    const q = new URLSearchParams(params.toString());
    if (v) q.set(k, v); else q.delete(k);
    router.replace(`${pathname}?${q.toString()}`, { scroll: false });
  };

  useEffect(() => {
    if (!sb) return;
    let alive = true;
    setList(null);
    setError(false);
    let q = sb.from("mp_specialists").select(SPECIALIST_SELECT).eq("status", "approved");
    if (specialty) q = q.contains("specialties", [specialty]);
    const max = Number(maxPrice);
    if (maxPrice && Number.isFinite(max) && max > 0) q = q.lte("min_price", max);
    if (sort === "rating") q = q.order("rating_avg", { ascending: false }).order("reviews_count", { ascending: false });
    if (sort === "price") q = q.order("min_price", { ascending: true, nullsFirst: false });
    if (sort === "new") q = q.order("created_at", { ascending: false });
    q.limit(200).then(({ data, error: e }) => {
      if (!alive) return;
      if (e) { setError(true); setList([]); return; }
      setList((data as unknown as Specialist[]) ?? []);
    });
    return () => { alive = false; };
  }, [sb, specialty, maxPrice, sort]);

  // City is on the joined profile: filter client-side.
  const shown = useMemo(() => (list ?? []).filter((s) => !city || s.profiles?.city === city), [list, city]);
  const filtered = Boolean(specialty || city || maxPrice);

  if (!sb) return <Notice tone="warning">{t("common.notConfigured")}</Notice>;

  return (
    <div>
      <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label={t("catalog.all")}>
        {["", ...specialtySlugs].map((sp) => (
          <button
            key={sp || "all"}
            type="button"
            aria-pressed={specialty === sp}
            onClick={() => setParam("s", sp)}
            className={cn("relative shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors", specialty === sp ? "text-white" : "glass text-ink-1 hover:text-ink-0")}
          >
            {specialty === sp && <motion.span layoutId="cat-pill" className="absolute inset-0 rounded-full bg-gradient-primary glow-sm" transition={{ type: "spring", stiffness: 500, damping: 35 }} />}
            <span className="relative">{sp ? t(`specialties.${sp}.title`) : t("catalog.all")}</span>
          </button>
        ))}
      </div>

      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        <Select label={t("catalog.city")} value={city} onChange={(e) => setParam("city", e.target.value)}>
          <option value="">{t("catalog.anyCity")}</option>
          {citySlugs.map((c) => <option key={c} value={c}>{t(`cities.${c}`)}</option>)}
        </Select>
        <Input label={t("catalog.maxPrice")} type="number" inputMode="numeric" min={0} defaultValue={maxPrice}
          onBlur={(e) => setParam("max", e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") setParam("max", (e.target as HTMLInputElement).value); }} />
        <Select label={t("catalog.sort")} value={sort} onChange={(e) => setParam("sort", e.target.value === "rating" ? "" : e.target.value)}>
          <option value="rating">{t("catalog.sortRating")}</option>
          <option value="price">{t("catalog.sortPrice")}</option>
          <option value="new">{t("catalog.sortNew")}</option>
        </Select>
      </div>

      {error && <Notice tone="danger" className="mb-6">{t("common.error")}</Notice>}

      {list === null ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-56" />)}</div>
      ) : shown.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] glass p-10 text-center">
          <p className="text-lg text-ink-1">{filtered ? t("catalog.empty") : t("catalog.emptyAll")}</p>
          {filtered && <Button variant="outline" className="mt-6" onClick={() => router.replace(pathname)}>{t("catalog.reset")}</Button>}
        </div>
      ) : (
        <>
          <p className="mb-5 text-sm text-ink-2" aria-live="polite">{t("catalog.found", { count: shown.length })}</p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((s, i) => (
              <motion.div key={s.id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04 }}>
                <SpecialistCard s={s} />
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
