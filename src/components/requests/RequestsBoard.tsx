"use client";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase/client";
import { citySlugs, specialtySlugs, formatTjs } from "@/content/site";
import { looksLikeGibberish } from "@/lib/quality";
import { notifyRequest } from "@/lib/telegram";
import { Input, Textarea } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Card";
import { Notice, Skeleton } from "@/components/ui/Notice";
import { BlockedNotice } from "@/components/auth/BlockedNotice";
import { cn } from "@/lib/cn";

export type Req = {
  id: string; client_id: string; title: string; description: string; specialties: string[]; city: string | null;
  budget_tjs: number | null; status: "open" | "closed" | "hidden"; offers_count: number; created_at: string; expires_at: string;
};
type Tab = "all" | "mine" | "offers";

export function ago(iso: string, t: (k: string, v?: Record<string, number>) => string) {
  const m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 60) return t("requests.minAgo", { n: m });
  if (m < 60 * 24) return t("requests.hAgo", { n: Math.round(m / 60) });
  return t("requests.dAgo", { n: Math.round(m / 1440) });
}

/** Client requests ("Эълонҳо"): clients post a task, approved specialists answer with offers. */
export function RequestsBoard() {
  const t = useTranslations();
  const { session, profile } = useAuth();
  const role = profile?.role;
  const [tab, setTab] = useState<Tab>("all");
  const [spec, setSpec] = useState("");
  const [rows, setRows] = useState<Req[] | null | "missing">(null);
  const [myOffers, setMyOffers] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    const sb = getSupabase(); if (!sb) return;
    setRows(null);
    let q = sb.from("mp_requests").select("*").order("created_at", { ascending: false }).limit(100);
    if (tab === "mine" && session) q = q.eq("client_id", session.user.id);
    else q = q.eq("status", "open").gt("expires_at", new Date().toISOString());
    if (spec) q = q.contains("specialties", [spec]);
    if (tab === "offers" && session) {
      const { data: offers } = await sb.from("mp_request_offers").select("request_id, status").eq("specialist_id", session.user.id);
      const ids = (offers ?? []).map((o) => o.request_id as string);
      setMyOffers(Object.fromEntries((offers ?? []).map((o) => [o.request_id as string, o.status as string])));
      if (!ids.length) { setRows([]); return; }
      q = sb.from("mp_requests").select("*").in("id", ids).order("created_at", { ascending: false });
    } else if (role === "specialist" && session) {
      const { data: offers } = await sb.from("mp_request_offers").select("request_id, status").eq("specialist_id", session.user.id);
      setMyOffers(Object.fromEntries((offers ?? []).map((o) => [o.request_id as string, o.status as string])));
    }
    const { data, error } = await q;
    if (error) { setRows(/mp_requests/.test(error.message) ? "missing" : []); return; }
    setRows((data as Req[]) ?? []);
  }, [tab, spec, session, role]);
  useEffect(() => { void load(); }, [load]);

  const tabs: Tab[] = role === "client" ? ["all", "mine"] : role === "specialist" ? ["all", "offers"] : ["all"];

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className="max-w-2xl text-lg text-ink-1">{t("requests.lead")}</p>
        {role !== "specialist" && role !== "admin" && (
          <Button onClick={() => setShowForm((v) => !v)} aria-expanded={showForm}>{showForm ? t("common.cancel") : `+ ${t("requests.post")}`}</Button>
        )}
      </div>

      {showForm && <div className="mt-6"><NewRequest onDone={() => { setShowForm(false); setTab(session ? "mine" : "all"); void load(); }} /></div>}

      <div className="mt-8 flex flex-wrap items-center gap-2">
        {tabs.length > 1 && tabs.map((k) => (
          <button key={k} type="button" onClick={() => setTab(k)} aria-pressed={tab === k}
            className={cn("rounded-full px-5 py-2.5 text-sm font-semibold", tab === k ? "bg-gradient-primary text-white" : "glass text-ink-1")}>{t(`requests.tabs.${k}`)}</button>
        ))}
        <Select label={t("requests.direction")} value={spec} onChange={(e) => setSpec(e.target.value)} className="ml-auto w-full sm:w-64">
          <option value="">{t("requests.allDirections")}</option>
          {specialtySlugs.map((s) => <option key={s} value={s}>{t(`specialties.${s}.title`)}</option>)}
        </Select>
      </div>

      <div className="mt-6">
        {rows === null ? <Skeleton className="h-40" />
          : rows === "missing" ? <Notice tone="warning">{t("requests.soon")}</Notice>
          : rows.length === 0 ? (
            <div className="rounded-[var(--radius-lg)] glass p-8 text-center">
              <p className="text-4xl" aria-hidden>📭</p>
              <p className="mt-3 font-semibold">{tab === "mine" ? t("requests.emptyMine") : tab === "offers" ? t("requests.emptyOffers") : t("requests.empty")}</p>
              {role !== "specialist" && tab !== "offers" && <p className="mt-2 text-sm text-ink-1">{t("requests.emptyHint")}</p>}
            </div>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {rows.map((r) => <li key={r.id}><RequestCard r={r} myOffer={myOffers[r.id]} /></li>)}
            </ul>
          )}
      </div>
    </div>
  );
}

export function RequestCard({ r, myOffer }: { r: Req; myOffer?: string }) {
  const t = useTranslations();
  return (
    <Link href={{ pathname: "/request", query: { id: r.id } }} className="block h-full rounded-[var(--radius-lg)] glass p-5 transition-transform hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-lg font-bold [overflow-wrap:anywhere]">{r.title}</h3>
        <span className="shrink-0 font-bold text-purple">{r.budget_tjs ? `${formatTjs(r.budget_tjs)} TJS` : t("requests.byAgreement")}</span>
      </div>
      <p className="mt-2 line-clamp-3 text-sm text-ink-1 [overflow-wrap:anywhere]">{r.description}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {r.specialties.map((s) => <Badge key={s} tone="neutral">{t(`specialties.${s}.title`)}</Badge>)}
      </div>
      <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-2">
        {r.city && <span>📍 {t(`cities.${r.city}`)}</span>}
        <span>💼 {t("requests.offersCount", { count: r.offers_count })}</span>
        <span>{ago(r.created_at, t)}</span>
        {r.status !== "open" && <Badge tone="neutral">{t(`requests.status.${r.status}`)}</Badge>}
        {myOffer && <Badge tone={myOffer === "chosen" ? "success" : "purple"}>{t(`requests.myOffer.${myOffer}`)}</Badge>}
      </p>
    </Link>
  );
}

function NewRequest({ onDone }: { onDone: () => void }) {
  const t = useTranslations();
  const router = useRouter();
  const { session, profile, blocked, refreshProfile } = useAuth();
  const [f, setF] = useState({ title: "", description: "", specialties: [] as string[], city: "", budget: "", byAgreement: true, name: "" });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [fail, setFail] = useState<string | null>(null);

  if (blocked) return <BlockedNotice />;
  if (!session) {
    return (
      <Notice>
        {t("requests.loginFirst")}{" "}
        <Link href={{ pathname: "/login", query: { role: "client", next: "/requests" } }} className="font-semibold underline">{t("common.login")}</Link>
      </Notice>
    );
  }
  if (profile && profile.role !== "client") return <Notice>{t("requests.onlyClients")}</Notice>;
  const needName = !profile?.full_name;

  const toggle = (s: string) => setF((x) => ({ ...x, specialties: x.specialties.includes(s) ? x.specialties.filter((y) => y !== s) : x.specialties.length >= 3 ? x.specialties : [...x.specialties, s] }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const e2: Record<string, string> = {};
    const title = f.title.trim(), description = f.description.trim();
    if (title.length < 5) e2.title = t("requests.errors.title");
    else if (looksLikeGibberish(title)) e2.title = t("quality.gibberish");
    if (description.length < 20) e2.description = t("requests.errors.description");
    else if (looksLikeGibberish(description)) e2.description = t("quality.gibberish");
    if (!f.specialties.length) e2.specialties = t("requests.errors.specialties");
    const budget = f.byAgreement ? null : Math.round(Number(f.budget.replace(/\s/g, "")));
    if (!f.byAgreement && !(budget && budget > 0 && budget <= 10_000_000)) e2.budget = t("requests.errors.budget");
    if (needName && f.name.trim().length < 2) e2.name = t("order.errors.name");
    setErrs(e2);
    if (Object.keys(e2).length) return;
    setBusy(true); setFail(null);
    const sb = getSupabase()!;
    if (needName) { await sb.from("mp_profiles").update({ full_name: f.name.trim().slice(0, 100) }).eq("id", session.user.id); await refreshProfile(); }
    const { data, error } = await sb.from("mp_requests").insert({
      client_id: session.user.id, title: title.slice(0, 120), description: description.slice(0, 2000),
      specialties: f.specialties, city: f.city || null, budget_tjs: budget,
    }).select("id").single();
    setBusy(false);
    if (error) {
      const known = ["too_many_open_requests", "too_many_requests_today", "only_clients_can_post"].find((k) => error.message.includes(k));
      setFail(t(`requests.errors.${known ?? "generic"}`)); return;
    }
    void notifyRequest({ request_id: data.id });
    onDone();
    router.push({ pathname: "/request", query: { id: data.id } });
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5 rounded-[var(--radius-lg)] glass p-6">
      <h2 className="text-h3 font-bold">{t("requests.formTitle")}</h2>
      {needName && <Input label={t("order.name")} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} error={errs.name} maxLength={100} />}
      <Input label={t("requests.title")} placeholder={t("requests.titlePh")} value={f.title} maxLength={120} onChange={(e) => setF({ ...f, title: e.target.value })} error={errs.title} />
      <Textarea label={t("requests.description")} placeholder={t("requests.descriptionPh")} rows={5} value={f.description} maxLength={2000} onChange={(e) => setF({ ...f, description: e.target.value })} error={errs.description} />
      <fieldset>
        <legend className="text-sm font-semibold">{t("requests.directions")}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {specialtySlugs.map((s) => (
            <button key={s} type="button" onClick={() => toggle(s)} aria-pressed={f.specialties.includes(s)}
              className={cn("rounded-full px-4 py-2 text-sm font-semibold", f.specialties.includes(s) ? "bg-gradient-primary text-white" : "glass text-ink-1")}>{t(`specialties.${s}.title`)}</button>
          ))}
        </div>
        {errs.specialties && <p className="mt-2 text-sm text-danger">{errs.specialties}</p>}
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label={t("requests.city")} value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })}>
          <option value="">{t("requests.anyCity")}</option>
          {citySlugs.map((c) => <option key={c} value={c}>{t(`cities.${c}`)}</option>)}
        </Select>
        <div>
          <Input label={t("requests.budget")} inputMode="numeric" disabled={f.byAgreement} placeholder={t("requests.budgetPh")}
            value={f.byAgreement ? "" : f.budget} onChange={(e) => setF({ ...f, budget: e.target.value })} error={errs.budget} />
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={f.byAgreement} onChange={(e) => setF({ ...f, byAgreement: e.target.checked })} className="h-4 w-4 accent-purple-500" />
            {t("requests.byAgreementLabel")}
          </label>
        </div>
      </div>
      <p className="text-xs text-ink-2">{t("requests.privacy")}</p>
      {fail && <Notice tone="danger">{fail}</Notice>}
      <Button type="submit" loading={busy}>{t("requests.publish")}</Button>
    </form>
  );
}
