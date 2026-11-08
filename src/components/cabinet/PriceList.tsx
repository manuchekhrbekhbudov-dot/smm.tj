"use client";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getSupabase } from "@/lib/supabase/client";
import type { PriceUnit, Service } from "@/lib/supabase/types";
import { formatTjs, priceUnits } from "@/content/site";
import { Input, Textarea } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Notice, Skeleton } from "@/components/ui/Notice";

export function PriceList({ userId }: { userId: string }) {
  const t = useTranslations();
  const sb = getSupabase()!;
  const [items, setItems] = useState<Service[] | null>(null);
  const [errors, setErrors] = useState<{ title?: string; price?: string }>({});
  const [busy, setBusy] = useState(false);
  const [fail, setFail] = useState(false);

  const load = useCallback(async () => {
    const { data } = await sb.from("mp_specialist_services").select("*").eq("specialist_id", userId).order("price_tjs");
    setItems((data as Service[]) ?? []);
  }, [sb, userId]);
  useEffect(() => { void load(); }, [load]);

  const add = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const title = String(fd.get("title") ?? "").trim();
    const price = Math.round(Number(fd.get("price")));
    const errs: typeof errors = {};
    if (title.length < 2) errs.title = t("cabinet.prices.errors.title");
    if (!Number.isFinite(price) || price < 1 || price > 10_000_000) errs.price = t("cabinet.prices.errors.price");
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true); setFail(false);
    const { error } = await sb.from("mp_specialist_services").insert({
      specialist_id: userId, title: title.slice(0, 120), description: String(fd.get("description") ?? "").trim().slice(0, 1000),
      price_tjs: price, unit: String(fd.get("unit")) as PriceUnit,
    });
    setBusy(false);
    if (error) { setFail(true); return; }
    form.reset();
    void load();
  };

  const remove = async (id: string) => {
    const { error } = await sb.from("mp_specialist_services").delete().eq("id", id);
    if (error) setFail(true); else void load();
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
      <div>
        {items === null ? <Skeleton className="h-40" /> : items.length === 0 ? (
          <Notice tone="warning">{t("cabinet.prices.empty")}</Notice>
        ) : (
          <ul className="divide-y divide-ink-3 overflow-hidden rounded-[var(--radius-md)] glass">
            {items.map((s) => (
              <li key={s.id} className="flex items-start justify-between gap-4 p-5">
                <div className="min-w-0">
                  <p className="font-semibold">{s.title}</p>
                  {s.description && <p className="mt-1 text-sm text-ink-1">{s.description}</p>}
                  <p className="mt-2 text-sm"><b className="tabular">{formatTjs(s.price_tjs)} TJS</b> <span className="text-ink-2">{t(`units.${s.unit}`)}</span></p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => remove(s.id)}>{t("common.delete")}</Button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <form onSubmit={add} className="space-y-4 rounded-[var(--radius-lg)] glass p-6" noValidate>
        <p className="font-display text-lg font-bold">{t("cabinet.prices.add")}</p>
        <Input label={t("cabinet.prices.title")} name="title" maxLength={120} error={errors.title} />
        <Textarea label={t("cabinet.prices.description")} name="description" maxLength={1000} rows={3} />
        <div className="grid grid-cols-2 gap-3">
          <Input label={t("cabinet.prices.price")} name="price" type="number" inputMode="numeric" min={1} error={errors.price} />
          <Select label={t("cabinet.prices.unit")} name="unit" defaultValue="project">
            {priceUnits.map((u) => <option key={u} value={u}>{t(`units.${u}`)}</option>)}
          </Select>
        </div>
        {fail && <Notice tone="danger">{t("common.error")}</Notice>}
        <Button type="submit" loading={busy} className="w-full">{t("common.add")}</Button>
      </form>
    </div>
  );
}
