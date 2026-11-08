"use client";
import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getSupabase } from "@/lib/supabase/client";
import { dateLocale } from "@/lib/date";
import { Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Notice, Skeleton } from "@/components/ui/Notice";
import { cn } from "@/lib/cn";

type Complaint = {
  id: string; order_id: string; specialist_id: string; text: string; voided: boolean; created_at: string;
  client?: { full_name: string } | null; specialists?: { profiles: { full_name: string } | null } | null;
};
type Flagged = { id: string; strikes: number; warned_at: string | null; banned_at: string | null; profiles: { full_name: string } | null };

/** Director: complaints (can be voided), warned and removed specialists (can be brought back). */
export function Complaints() {
  const t = useTranslations();
  const locale = useLocale();
  const sb = getSupabase()!;
  const [rows, setRows] = useState<Complaint[] | null>(null);
  const [flagged, setFlagged] = useState<Flagged[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [c, f] = await Promise.all([
      sb.from("mp_complaints").select("*, client:mp_profiles!mp_complaints_client_id_fkey(full_name), specialists:mp_specialists!mp_complaints_specialist_id_fkey(profiles:mp_profiles!mp_specialists_id_fkey(full_name))").order("created_at", { ascending: false }).limit(200),
      sb.from("mp_specialists").select("id, strikes, warned_at, banned_at, profiles:mp_profiles!mp_specialists_id_fkey(full_name)").or("warned_at.not.is.null,banned_at.not.is.null").order("strikes", { ascending: false }),
    ]);
    if (c.error) { setErr(t("plans.notReady")); setRows([]); return; }
    setRows((c.data as unknown as Complaint[]) ?? []);
    setFlagged((f.data as unknown as Flagged[]) ?? []);
  }, [sb, t]);
  useEffect(() => { void load(); }, [load]);

  const toggleVoid = async (c: Complaint) => {
    setBusy(c.id);
    const { error } = await sb.from("mp_complaints").update({ voided: !c.voided }).eq("id", c.id);
    setBusy(null);
    if (error) setErr(t("common.error")); else void load();
  };
  const unban = async (id: string) => {
    setBusy(id);
    const { error } = await sb.rpc("mp_unban", { sid: id });
    setBusy(null);
    if (error) setErr(t("common.error")); else void load();
  };

  if (rows === null) return <Skeleton className="h-40" />;
  const df = new Intl.DateTimeFormat(dateLocale(locale), { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="space-y-8">
      {err && <Notice tone="danger">{err}</Notice>}
      <p className="text-sm text-ink-2">{t("trust.adminRule")}</p>
      {flagged.length > 0 && (
        <section>
          <h3 className="text-h3 font-bold">{t("trust.flagged")}</h3>
          <ul className="mt-4 space-y-3">
            {flagged.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] glass px-5 py-4">
                <span className="flex flex-wrap items-center gap-2">
                  <Link href={{ pathname: "/specialist", query: { id: f.id } }} className="font-semibold hover:text-purple">{f.profiles?.full_name || "—"}</Link>
                  <Badge tone={f.banned_at ? "danger" : "warning"}>{f.banned_at ? t("trust.removed") : t("trust.warned")}</Badge>
                  <span className="text-sm text-ink-2">{t("trust.strikes", { n: f.strikes })}</span>
                </span>
                {f.banned_at && <Button size="sm" variant="outline" loading={busy === f.id} onClick={() => unban(f.id)}>{t("trust.unban")}</Button>}
              </li>
            ))}
          </ul>
        </section>
      )}
      <section>
        <h3 className="text-h3 font-bold">{t("admin.tabs.complaints")}</h3>
        {rows.length === 0 ? <p className="mt-3 text-ink-2">{t("admin.empty")}</p> : (
          <ul className="mt-4 space-y-3">
            {rows.map((c) => (
              <li key={c.id} className={cn("rounded-[var(--radius-md)] glass p-5", c.voided && "opacity-60")}>
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span><b>{c.client?.full_name || "—"}</b> → <Link href={{ pathname: "/specialist", query: { id: c.specialist_id } }} className="font-semibold hover:text-purple">{c.specialists?.profiles?.full_name || "—"}</Link></span>
                  <span className="flex items-center gap-2">{c.voided && <Badge tone="neutral">{t("trust.voided")}</Badge>}<span className="text-xs text-ink-2">{df.format(new Date(c.created_at))}</span></span>
                </div>
                <p className="mt-3 whitespace-pre-line text-ink-1">{c.text}</p>
                <Button size="sm" variant="outline" className="mt-3" loading={busy === c.id} onClick={() => toggleVoid(c)}>{c.voided ? t("trust.restore") : t("trust.void")}</Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

type Fb = { id: string; role: string | null; kind: string; rating: number | null; text: string; created_at: string; profiles?: { full_name: string } | null };

/** Director: suggestions and feedback about the platform from clients and specialists. */
export function FeedbackList() {
  const t = useTranslations();
  const locale = useLocale();
  const sb = getSupabase()!;
  const [rows, setRows] = useState<Fb[] | null>(null);
  const [err, setErr] = useState(false);
  const load = useCallback(async () => {
    const { data, error } = await sb.from("mp_feedback").select("*, profiles:mp_profiles!mp_feedback_user_id_fkey(full_name)").order("created_at", { ascending: false }).limit(300);
    setErr(!!error); setRows((data as unknown as Fb[]) ?? []);
  }, [sb]);
  useEffect(() => { void load(); }, [load]);
  if (rows === null) return <Skeleton className="h-40" />;
  if (err) return <Notice tone="warning">{t("plans.notReady")}</Notice>;
  if (!rows.length) return <p className="text-ink-2">{t("admin.empty")}</p>;
  const df = new Intl.DateTimeFormat(dateLocale(locale), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  return (
    <ul className="space-y-3">
      {rows.map((f) => (
        <li key={f.id} className="rounded-[var(--radius-md)] glass p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="flex flex-wrap items-center gap-2">
              <Badge tone={f.kind === "problem" ? "danger" : f.kind === "praise" ? "success" : "purple"}>{t(`feedback.kinds.${f.kind}`)}</Badge>
              <b>{f.profiles?.full_name || "—"}</b>
              {f.role && <span className="text-ink-2">· {t(`feedback.roles.${f.role}`)}</span>}
              {f.rating && <span>{"★".repeat(f.rating)}</span>}
            </span>
            <span className="text-xs text-ink-2">{df.format(new Date(f.created_at))}</span>
          </div>
          <p className="mt-3 whitespace-pre-line text-ink-1">{f.text}</p>
        </li>
      ))}
    </ul>
  );
}
