"use client";
import { useCallback, useEffect, useState } from "react";
import { dateLocale } from "@/lib/date";
import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase/client";
import { SPECIALIST_SELECT, type Review, type Specialist, type SpecialistStatus } from "@/lib/supabase/types";
import { safeHttpUrl, linkLabel } from "@/lib/links";
import { formatTjs } from "@/content/site";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Card";
import { Stars } from "@/components/ui/Stars";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Notice, Skeleton } from "@/components/ui/Notice";
import { cn } from "@/lib/cn";
import { Analytics } from "./Analytics";

type Tab = SpecialistStatus | "reviews" | "stats";
type ReviewRow = Review & { specialists?: { profiles: { full_name: string } | null } | null };

export function AdminPanel() {
  const t = useTranslations();
  const { profile } = useAuth();
  const [tab, setTab] = useState<Tab>("pending");
  const [stats, setStats] = useState<{ specialists: number; completed_orders: number; reviews: number } | null>(null);

  useEffect(() => {
    getSupabase()!.rpc("mp_public_stats").then(({ data }) => {
      const r = Array.isArray(data) ? data[0] : data;
      if (r) setStats({ specialists: Number(r.specialists), completed_orders: Number(r.completed_orders), reviews: Number(r.reviews) });
    });
  }, [tab]);

  if (profile!.role !== "admin") return <Notice tone="danger">{t("admin.notAdmin")}</Notice>;

  return (
    <div>
      <h1 className="text-h1 font-bold">{t("admin.title")}</h1>
      {stats && (
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <Badge>{t("home.stats.specialists")}: {stats.specialists}</Badge>
          <Badge tone="success">{t("home.stats.orders")}: {stats.completed_orders}</Badge>
          <Badge tone="neutral">{t("home.stats.reviews")}: {stats.reviews}</Badge>
        </div>
      )}
      <div role="tablist" className="-mx-4 mt-8 flex gap-2 overflow-x-auto px-4 pb-2">
        {(["pending", "approved", "rejected", "reviews", "stats"] as Tab[]).map((k) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={cn("relative shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors", tab === k ? "text-white" : "glass text-ink-1 hover:text-ink-0")}>
            {tab === k && <motion.span layoutId="adm-tab" className="absolute inset-0 rounded-full bg-gradient-primary" transition={{ type: "spring", stiffness: 500, damping: 35 }} />}
            <span className="relative">{t(`admin.tabs.${k}`)}</span>
          </button>
        ))}
      </div>
      <div className="mt-8">
        {tab === "stats" ? <Analytics /> : tab === "reviews" ? <Reviews /> : <Specialists status={tab} />}
      </div>
    </div>
  );
}

function Specialists({ status }: { status: SpecialistStatus }) {
  const t = useTranslations();
  const sb = getSupabase()!;
  const [rows, setRows] = useState<(Specialist & { specialist_services: { price_tjs: number; title: string }[] })[] | null>(null);
  const [reason, setReason] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState(false);

  const load = useCallback(async () => {
    setRows(null);
    const { data } = await sb.from("mp_specialists").select(`${SPECIALIST_SELECT}, specialist_services:mp_specialist_services!mp_specialist_services_specialist_id_fkey(title, price_tjs)`).eq("status", status).order("updated_at", { ascending: false });
    setRows((data as never) ?? []);
  }, [sb, status]);
  useEffect(() => { void load(); }, [load]);

  const act = async (id: string, next: SpecialistStatus) => {
    const r = (reason[id] ?? "").trim();
    if (next === "rejected" && r.length < 3) { setReason((x) => ({ ...x, [id]: x[id] ?? "" })); setErr(true); return; }
    setBusy(id); setErr(false);
    const { error } = await sb.from("mp_specialists").update({ status: next, reject_reason: next === "rejected" ? r.slice(0, 500) : null }).eq("id", id);
    setBusy(null);
    if (error) setErr(true); else void load();
  };

  if (rows === null) return <Skeleton className="h-40" />;
  if (rows.length === 0) return <p className="text-ink-2">{t("admin.empty")}</p>;

  return (
    <div className="space-y-5">
      {err && <Notice tone="danger">{t("admin.rejectReason")}</Notice>}
      {rows.map((s) => {
        const name = s.profiles?.full_name || "—";
        return (
          <article key={s.id} className="rounded-[var(--radius-lg)] glass p-6">
            <div className="flex flex-wrap items-start gap-4">
              <Avatar name={name} url={s.profiles?.avatar_url} size={56} />
              <div className="min-w-0 flex-1">
                <Link href={{ pathname: "/specialist", query: { id: s.id } }} className="font-display text-lg font-bold hover:text-purple">{name}</Link>
                <p className="text-ink-1">{s.headline || "—"}</p>
                <p className="mt-1 text-xs text-ink-2">{s.profiles?.city ? t(`cities.${s.profiles.city}`) : "—"} · {t("specialist.years", { count: s.experience_years })}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">{s.specialties.map((sp) => <Badge key={sp} tone="neutral">{t(`specialties.${sp}.title`)}</Badge>)}</div>
              </div>
            </div>
            {s.bio && <p className="mt-4 whitespace-pre-line text-sm text-ink-1">{s.bio}</p>}
            {s.specialist_services.length > 0 && (
              <p className="mt-3 text-sm text-ink-2">{s.specialist_services.map((x) => `${x.title} — ${formatTjs(x.price_tjs)} TJS`).join(" · ")}</p>
            )}
            {s.portfolio_links.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2 text-sm">
                {s.portfolio_links.map(safeHttpUrl).filter((x): x is string => !!x).map((l) => (
                  <li key={l}><a href={l} target="_blank" rel="noopener noreferrer nofollow" className="text-purple underline">{linkLabel(l)}</a></li>
                ))}
              </ul>
            )}
            {s.reject_reason && status === "rejected" && <Notice tone="danger" className="mt-4">{s.reject_reason}</Notice>}
            <div className="mt-5 flex flex-wrap items-end gap-3">
              {status !== "approved" && <Button size="sm" loading={busy === s.id} onClick={() => act(s.id, "approved")}>{t("admin.approve")}</Button>}
              {status !== "rejected" && (<>
                <Input className="min-w-[240px] flex-1" label={t("admin.rejectReason")} value={reason[s.id] ?? ""} onChange={(e) => setReason((x) => ({ ...x, [s.id]: e.target.value }))} maxLength={500} />
                <Button size="sm" variant="outline" disabled={busy === s.id} onClick={() => act(s.id, "rejected")}>{status === "approved" ? t("admin.revoke") : t("admin.reject")}</Button>
              </>)}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function Reviews() {
  const t = useTranslations();
  const locale = useLocale();
  const sb = getSupabase()!;
  const [rows, setRows] = useState<ReviewRow[] | null>(null);

  const load = useCallback(async () => {
    const { data } = await sb.from("mp_reviews").select("*, profiles:mp_profiles!mp_reviews_client_id_fkey(full_name), specialists:mp_specialists!mp_reviews_specialist_id_fkey(profiles:mp_profiles!mp_specialists_id_fkey(full_name))").order("created_at", { ascending: false }).limit(200);
    setRows((data as unknown as ReviewRow[]) ?? []);
  }, [sb]);
  useEffect(() => { void load(); }, [load]);

  const toggle = async (r: ReviewRow) => {
    const { error } = await sb.from("mp_reviews").update({ hidden: !r.hidden }).eq("id", r.id);
    if (!error) void load();
  };

  if (rows === null) return <Skeleton className="h-40" />;
  if (rows.length === 0) return <p className="text-ink-2">{t("admin.empty")}</p>;
  const df = new Intl.DateTimeFormat(dateLocale(locale), { day: "numeric", month: "short", year: "numeric" });

  return (
    <ul className="space-y-4">
      {rows.map((r) => (
        <li key={r.id} className={cn("rounded-[var(--radius-md)] glass p-5", r.hidden && "opacity-60")}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm"><b>{r.profiles?.full_name || "—"}</b> → {r.specialists?.profiles?.full_name || "—"}</span>
            <span className="flex items-center gap-3"><Stars value={r.rating} size={14} />{r.hidden && <Badge tone="danger">{t("admin.hidden")}</Badge>}</span>
          </div>
          <p className="mt-3 whitespace-pre-line text-ink-1">{r.text}</p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-ink-2">{df.format(new Date(r.created_at))}</span>
            <Button size="sm" variant="outline" onClick={() => toggle(r)}>{r.hidden ? t("admin.unhide") : t("admin.hide")}</Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
