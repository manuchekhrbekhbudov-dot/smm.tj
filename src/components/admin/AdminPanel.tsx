"use client";
import { useCallback, useEffect, useState } from "react";
import { dateLocale } from "@/lib/date";
import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Link, useRouter } from "@/i18n/navigation";
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
import { Payments } from "./Payments";
import { Complaints, FeedbackList } from "./TrustAdmin";
import { Finance } from "./Finance";
import { notifyApproved } from "@/lib/telegram";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { loadCheck, percent, type Check } from "@/components/cabinet/ProfileChecklist";
import { InstaPost } from "./InstaPost";
import { useSearchParams } from "next/navigation";

type Tab = SpecialistStatus | "reviews" | "payments" | "complaints" | "feedback" | "stats" | "finance";
const TABS: Tab[] = ["pending", "approved", "rejected", "finance", "payments", "complaints", "reviews", "feedback", "stats"];
type ReviewRow = Review & { specialists?: { profiles: { full_name: string } | null } | null };

export function AdminPanel() {
  const t = useTranslations();
  const { profile, signOut } = useAuth();
  const router = useRouter();
  const fromUrl = useSearchParams().get("tab") as Tab | null; // e.g. the daily Telegram report links to ?tab=finance
  const [tab, setTab] = useState<Tab>(fromUrl && TABS.includes(fromUrl) ? fromUrl : "pending");
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-h1 font-bold">{t("admin.title")}</h1>
        <Button variant="outline" size="sm" onClick={async () => { await signOut(); router.replace("/"); }}>{t("common.signOut")}</Button>
      </div>
      {stats && (
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <Badge>{t("home.stats.specialists")}: {stats.specialists}</Badge>
          <Badge tone="success">{t("home.stats.orders")}: {stats.completed_orders}</Badge>
          <Badge tone="neutral">{t("home.stats.reviews")}: {stats.reviews}</Badge>
        </div>
      )}
      <div role="tablist" className="-mx-4 mt-8 flex gap-2 overflow-x-auto px-4 pb-2">
        {TABS.map((k) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={cn("relative shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors", tab === k ? "text-white" : "glass text-ink-1 hover:text-ink-0")}>
            {tab === k && <motion.span layoutId="adm-tab" className="absolute inset-0 rounded-full bg-gradient-primary" transition={{ type: "spring", stiffness: 500, damping: 35 }} />}
            <span className="relative">{t(`admin.tabs.${k}`)}</span>
          </button>
        ))}
      </div>
      <div className="mt-8">
        {tab === "finance" ? <Finance /> : tab === "stats" ? <Analytics /> : tab === "reviews" ? <Reviews /> : tab === "payments" ? <Payments /> : tab === "complaints" ? <Complaints /> : tab === "feedback" ? <FeedbackList /> : <Specialists status={tab} />}
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
  const [incomplete, setIncomplete] = useState<string | null>(null);
  const [checks, setChecks] = useState<Record<string, Check | null>>({});

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
    if (error?.message.includes("profile_incomplete")) { setIncomplete(id); return; }
    if (error) { setErr(true); return; }
    if (next === "approved") void notifyApproved(id); // Telegram: "you are in the catalog" (+ referral gift)
    void load();
  };
  // How complete each profile under review is (photo, texts, prices/packages, a video)
  useEffect(() => {
    if (status !== "pending" || !rows?.length) return;
    void Promise.all(rows.map(async (r) => [r.id, await loadCheck(r.id)] as const)).then((x) => setChecks(Object.fromEntries(x)));
  }, [status, rows]);
  // Director's "work checked" badge
  const [verified, setVerified] = useState<Record<string, string | null>>({});
  useEffect(() => {
    if (status !== "approved") return;
    sb.from("mp_specialists").select("id, verified_at").eq("status", "approved").then(({ data, error }) => {
      if (!error && data) setVerified(Object.fromEntries(data.map((r) => [r.id as string, (r.verified_at as string | null) ?? null])));
    });
  }, [sb, status, rows]);
  const toggleVerified = async (id: string) => {
    const at = verified[id] ? null : new Date().toISOString();
    setBusy(id);
    const { error } = await sb.from("mp_specialists").update({ verified_at: at }).eq("id", id);
    setBusy(null);
    if (!error) setVerified((v) => ({ ...v, [id]: at }));
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
                {status === "approved" && <VerifiedBadge at={verified[s.id]} className="ml-2 align-middle" />}
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
            {status === "pending" && checks[s.id] && (
              <div className="mt-4 rounded-[var(--radius-md)] bg-ink-3/60 p-3 text-sm">
                <b>{t("checklist.admin", { p: percent(checks[s.id]!) })}</b>
                <span className="ml-2 text-ink-1">{(Object.keys(checks[s.id]!) as (keyof Check)[]).filter((k) => !checks[s.id]![k]).map((k) => t(`checklist.items.${k}`)).join(" · ") || "✅"}</span>
              </div>
            )}
            {incomplete === s.id && <Notice tone="warning" className="mt-4">{t("checklist.cannotApprove")}</Notice>}
            <div className="mt-5 flex flex-wrap items-end gap-3">
              {status !== "approved" && <Button size="sm" loading={busy === s.id} onClick={() => act(s.id, "approved")}>{t("admin.approve")}</Button>}
              {status === "approved" && <InstaPost s={s} />}
              {status === "approved" && s.id in verified && (
                <Button size="sm" variant={verified[s.id] ? "ghost" : "outline"} disabled={busy === s.id} onClick={() => toggleVerified(s.id)}>
                  {verified[s.id] ? t("verify.remove") : `✅ ${t("verify.give")}`}
                </Button>
              )}
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

  const prize = async (r: ReviewRow) => {
    const { error } = await sb.from("mp_reviews").update({ prize_given_at: r.prize_given_at ? null : new Date().toISOString() }).eq("id", r.id);
    if (!error) void load();
  };
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
            <span className="flex flex-wrap gap-2">
              {"prize_given_at" in r && (
                <Button size="sm" variant={r.prize_given_at ? "ghost" : "outline"} onClick={() => prize(r)}>{r.prize_given_at ? `🎁 ${t("trust.prizeGiven")}` : `🎁 ${t("trust.givePrize")}`}</Button>
              )}
              <Button size="sm" variant="outline" onClick={() => toggle(r)}>{r.hidden ? t("admin.unhide") : t("admin.hide")}</Button>
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
