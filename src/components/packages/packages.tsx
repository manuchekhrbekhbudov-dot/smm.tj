"use client";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getSupabase } from "@/lib/supabase/client";
import { formatTjs } from "@/content/site";
import { looksLikeGibberish } from "@/lib/quality";
import { Input, Textarea } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Notice, Skeleton } from "@/components/ui/Notice";
import { cn } from "@/lib/cn";

export type Pkg = {
  id: string; specialist_id: string; name: string; price_tjs: number; per: "month" | "project";
  posts: number | null; stories: number | null; reels: number | null; sales_videos: number | null; days: number | null; extras: string; position: number;
};
export const PKG_MAX = 3;
const COUNTS = ["posts", "stories", "reels", "sales_videos"] as const;
const ICON: Record<(typeof COUNTS)[number], string> = { posts: "📝", stories: "📲", reels: "🎬", sales_videos: "🛒" };
const MEDAL = ["🥉", "🥈", "🥇"];

export async function loadPackages(specialistId: string): Promise<Pkg[] | null> {
  const sb = getSupabase(); if (!sb) return [];
  const { data, error } = await sb.from("mp_packages").select("*").eq("specialist_id", specialistId).order("price_tjs");
  return error ? null : ((data as Pkg[]) ?? []);
}

/** What a package includes, one line per item. */
function Includes({ p }: { p: Pkg }) {
  const t = useTranslations("packages");
  const rows = COUNTS.filter((k) => (p[k] ?? 0) > 0).map((k) => `${ICON[k]} ${p[k]} ${t(`items.${k}`)}`);
  if (p.days) rows.push(`⏱️ ${t("daysN", { n: p.days })}`);
  return (
    <ul className="mt-4 space-y-1.5 text-sm">
      {rows.map((r) => <li key={r}>{r}</li>)}
      {p.extras && <li className="whitespace-pre-line text-ink-1 [overflow-wrap:anywhere]">➕ {p.extras}</li>}
    </ul>
  );
}

/** Public profile: the specialist's own packages; "Order" fills the order form below. */
export function PackagesPublic({ specialistId }: { specialistId: string }) {
  const t = useTranslations("packages");
  const [list, setList] = useState<Pkg[]>([]);
  useEffect(() => { void loadPackages(specialistId).then((l) => setList(l ?? [])); }, [specialistId]);
  if (!list.length) return null;
  const pick = (p: Pkg) => {
    window.dispatchEvent(new CustomEvent("smmtj-package", { detail: p }));
    document.getElementById("order-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <section>
      <h2 className="mb-4 text-h3 font-bold">{t("publicTitle")}</h2>
      <div className={cn("grid gap-4", list.length > 1 && "sm:grid-cols-2", list.length > 2 && "xl:grid-cols-3")}>
        {list.map((p, i) => (
          <article key={p.id} className={cn("flex flex-col rounded-[var(--radius-lg)] glass p-5", i === list.length - 1 && list.length > 1 && "gradient-border")}>
            <p className="font-display text-lg font-bold [overflow-wrap:anywhere]">{MEDAL[Math.min(i, 2)]} {p.name}</p>
            <p className="mt-1 text-2xl font-bold text-purple">{formatTjs(p.price_tjs)} TJS <span className="text-sm font-medium text-ink-2">/ {t(`per.${p.per}`)}</span></p>
            <Includes p={p} />
            <div className="mt-auto pt-5"><Button size="sm" className="w-full" onClick={() => pick(p)}>{t("order")}</Button></div>
          </article>
        ))}
      </div>
    </section>
  );
}

type Form = { name: string; price: string; per: "month" | "project"; posts: string; stories: string; reels: string; sales_videos: string; days: string; extras: string };
const empty: Form = { name: "", price: "", per: "month", posts: "", stories: "", reels: "", sales_videos: "", days: "", extras: "" };
const toForm = (p: Pkg): Form => ({ name: p.name, price: String(p.price_tjs), per: p.per, posts: p.posts?.toString() ?? "", stories: p.stories?.toString() ?? "", reels: p.reels?.toString() ?? "", sales_videos: p.sales_videos?.toString() ?? "", days: p.days?.toString() ?? "", extras: p.extras });

/** Specialist cabinet: build up to 3 own packages — name, price and contents are all the specialist's choice. */
export function PackagesEditor({ userId }: { userId: string }) {
  const t = useTranslations("packages");
  const tq = useTranslations("quality");
  const [list, setList] = useState<Pkg[] | null | "missing">(null);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [f, setF] = useState<Form>(empty);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [fail, setFail] = useState<string | null>(null);

  const load = useCallback(async () => { const l = await loadPackages(userId); setList(l === null ? "missing" : l); }, [userId]);
  useEffect(() => { void load(); }, [load]);

  if (list === null) return <Skeleton className="h-40" />;
  if (list === "missing") return <Notice tone="warning">{t("soon")}</Notice>;

  const num = (s: string): number | null => (s.trim() === "" ? null : Math.round(Number(s.replace(/\s/g, ""))));
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const e2: Record<string, string> = {};
    if (f.name.trim().length < 2) e2.name = t("errors.name");
    else if (looksLikeGibberish(f.name) && f.name.trim().length >= 6) e2.name = tq("gibberish");
    const price = num(f.price);
    if (!(price && price > 0 && price <= 10_000_000)) e2.price = t("errors.price");
    const vals: Record<string, number | null> = {};
    for (const k of COUNTS) { const v = num(f[k]); if (v !== null && !(v >= 0 && v <= 1000)) e2[k] = t("errors.count"); vals[k] = v; }
    const days = num(f.days);
    if (days !== null && !(days >= 1 && days <= 365)) e2.days = t("errors.days");
    if (!COUNTS.some((k) => (vals[k] ?? 0) > 0) && f.extras.trim().length < 5) e2.extras = t("errors.empty");
    if (f.extras.trim() && looksLikeGibberish(f.extras)) e2.extras = tq("gibberish");
    setErrs(e2);
    if (Object.keys(e2).length) return;
    setBusy(true); setFail(null);
    const row = { name: f.name.trim().slice(0, 40), price_tjs: price, per: f.per, ...vals, days, extras: f.extras.trim().slice(0, 300) };
    const sb = getSupabase()!;
    const { error } = editing === "new"
      ? await sb.from("mp_packages").insert({ ...row, specialist_id: userId, position: list.length })
      : await sb.from("mp_packages").update(row).eq("id", editing!);
    setBusy(false);
    if (error) { setFail(error.message.includes("packages_full") ? t("errors.full", { n: PKG_MAX }) : t("errors.generic")); return; }
    setEditing(null); setF(empty); void load();
  };
  const remove = async (p: Pkg) => {
    if (!confirm(t("confirmDelete", { name: p.name }))) return;
    await getSupabase()!.from("mp_packages").delete().eq("id", p.id);
    void load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-h2 font-bold">{t("title")}</h2>
        <p className="mt-2 max-w-2xl text-ink-1">{t("lead", { n: PKG_MAX })}</p>
      </div>
      {list.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((p, i) => (
            <article key={p.id} className="rounded-[var(--radius-lg)] glass p-5">
              <p className="font-display text-lg font-bold [overflow-wrap:anywhere]">{MEDAL[Math.min(i, 2)]} {p.name}</p>
              <p className="mt-1 text-2xl font-bold text-purple">{formatTjs(p.price_tjs)} TJS <span className="text-sm font-medium text-ink-2">/ {t(`per.${p.per}`)}</span></p>
              <Includes p={p} />
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { setEditing(p.id); setF(toForm(p)); setErrs({}); }}>{t("edit")}</Button>
                <Button size="sm" variant="ghost" onClick={() => remove(p)}>{t("delete")}</Button>
              </div>
            </article>
          ))}
        </div>
      )}
      {list.length === 0 && editing === null && <p className="rounded-[var(--radius-md)] glass p-6 text-center text-ink-2">{t("empty")}</p>}
      {editing === null && list.length < PKG_MAX && (
        <Button onClick={() => { setEditing("new"); setF(empty); setErrs({}); }}>+ {t("add")} ({list.length}/{PKG_MAX})</Button>
      )}
      {editing !== null && (
        <form onSubmit={save} noValidate className="space-y-4 rounded-[var(--radius-lg)] border border-purple/30 p-5">
          <h3 className="font-display text-lg font-bold">{editing === "new" ? t("newTitle") : t("editTitle")}</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <Input label={t("name")} placeholder={t("namePh")} value={f.name} maxLength={40} onChange={(e) => setF({ ...f, name: e.target.value })} error={errs.name} />
            <Input label={t("price")} inputMode="numeric" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} error={errs.price} />
            <Select label={t("perLabel")} value={f.per} onChange={(e) => setF({ ...f, per: e.target.value as Form["per"] })}>
              <option value="month">{t("per.month")}</option>
              <option value="project">{t("per.project")}</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {COUNTS.map((k) => <Input key={k} label={`${ICON[k]} ${t(`items.${k}`)}`} inputMode="numeric" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} error={errs[k]} />)}
            <Input label={`⏱️ ${t("days")}`} inputMode="numeric" value={f.days} onChange={(e) => setF({ ...f, days: e.target.value })} error={errs.days} />
          </div>
          <Textarea label={t("extras")} placeholder={t("extrasPh")} rows={3} maxLength={300} value={f.extras} onChange={(e) => setF({ ...f, extras: e.target.value })} error={errs.extras} />
          {fail && <Notice tone="danger">{fail}</Notice>}
          <div className="flex gap-2">
            <Button type="submit" loading={busy}>{t("save")}</Button>
            <Button type="button" variant="ghost" onClick={() => { setEditing(null); setErrs({}); }}>{t("cancel")}</Button>
          </div>
        </form>
      )}
    </div>
  );
}
