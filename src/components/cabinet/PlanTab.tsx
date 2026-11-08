"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getSupabase } from "@/lib/supabase/client";
import { checkReceipt } from "@/lib/telegram";
import { ALIF_DISPLAY, ALIF_NUMBER, PLANS, PLAN_DAYS, PLAN_PRICES, activePlan, type Plan } from "@/lib/plans";
import { dateLocale } from "@/lib/date";
import type { Payment } from "@/lib/supabase/types";
import { Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Notice, Skeleton, Spinner } from "@/components/ui/Notice";
import { cn } from "@/lib/cn";

/** Downscale to a JPEG (iPhone HEIC/PNG screenshots become small, readable JPEGs). */
async function toJpeg(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((ok, fail) => { const i = new Image(); i.onload = () => ok(i); i.onerror = fail; i.src = url; });
    const k = Math.min(1, 2000 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return await new Promise<Blob>((ok, fail) => c.toBlob((b) => (b ? ok(b) : fail(new Error("blob"))), "image/jpeg", 0.9));
  } finally {
    URL.revokeObjectURL(url);
  }
}

const statusTone = { checking: "neutral", review: "warning", approved: "success", rejected: "danger" } as const;

export function PlanTab({ userId }: { userId: string }) {
  const t = useTranslations("plans");
  const locale = useLocale();
  const sb = getSupabase()!;
  const [current, setCurrent] = useState<{ plan: string | null; plan_until: string | null } | null>(null);
  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [notReady, setNotReady] = useState(false);
  const [chosen, setChosen] = useState<Plan | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "success" | "warning" | "danger"; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const fmt = (d: string) => new Date(d).toLocaleDateString(dateLocale(locale), { day: "numeric", month: "long", year: "numeric" });

  const load = useCallback(async () => {
    const [sp, pay] = await Promise.all([
      sb.from("mp_specialists").select("plan, plan_until").eq("id", userId).maybeSingle(),
      sb.from("mp_payments").select("*").eq("specialist_id", userId).order("created_at", { ascending: false }).limit(20),
    ]);
    if (sp.error || pay.error) { setNotReady(true); setPayments([]); return; }
    setCurrent(sp.data ?? { plan: null, plan_until: null });
    setPayments((pay.data as Payment[]) ?? []);
    return (pay.data as Payment[]) ?? [];
  }, [sb, userId]);

  // A payment stuck in "checking" (e.g. the page was closed during upload) is re-checked.
  useEffect(() => {
    void load().then(async (list) => {
      const stuck = list?.find((p) => p.status === "checking" && Date.now() - new Date(p.created_at).getTime() > 30_000);
      if (stuck) { await checkReceipt(stuck.id); void load(); }
    });
  }, [load]);

  const reasonText = (r: string | null) => (r ? (t.has(`reasons.${r}`) ? t(`reasons.${r}`) : r) : "");

  const upload = async (file: File) => {
    if (!chosen) return;
    setBusy(true); setMsg(null);
    try {
      let blob: Blob;
      try { blob = await toJpeg(file); } catch { setMsg({ tone: "danger", text: t("errors.image") }); return; }
      if (blob.size > 5 * 1024 * 1024) { setMsg({ tone: "danger", text: t("errors.big") }); return; }
      const path = `${userId}/${Date.now()}.jpg`;
      const up = await sb.storage.from("mp-receipts").upload(path, blob, { contentType: "image/jpeg" });
      if (up.error) { setMsg({ tone: "danger", text: t("errors.upload") }); return; }
      const ins = await sb.from("mp_payments").insert({ specialist_id: userId, plan: chosen, amount_tjs: PLAN_PRICES[chosen], receipt_path: path }).select("id").single();
      if (ins.error) {
        const code = ["payment_in_progress", "too_many_payments", "specialist_not_approved"].find((c) => ins.error!.message.includes(c));
        setMsg({ tone: "danger", text: t(`errors.${code ?? "generic"}`) });
        return;
      }
      await load();
      const res = await checkReceipt(ins.data.id);
      if (res?.status === "approved") setMsg({ tone: "success", text: t("result.approved", { plan: t(`names.${chosen}`) }) });
      else if (res?.status === "rejected") setMsg({ tone: "danger", text: t("result.rejected", { reason: reasonText(res.reason) }) });
      else setMsg({ tone: "warning", text: t("result.review") });
      setChosen(null);
      await load();
    } finally {
      setBusy(false);
    }
  };

  if (notReady) return <Notice tone="warning">{t("notReady")}</Notice>;
  if (!payments || !current) return <Skeleton className="h-72" />;

  const active = activePlan(current);
  const pending = payments.some((p) => p.status === "checking" || p.status === "review");

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-h2 font-bold">{t("title")}</h2>
        <p className="mt-2 max-w-2xl text-ink-1">{t("lead", { days: PLAN_DAYS })}</p>
      </div>

      {active ? (
        <Notice tone="success">{t("active", { plan: t(`names.${active}`), date: fmt(current.plan_until!) })}</Notice>
      ) : (
        <Notice tone="info">{t("none")}</Notice>
      )}

      <div className="grid gap-5 md:grid-cols-3">
        {PLANS.map((p) => (
          <button key={p} type="button" disabled={pending || busy} onClick={() => { setChosen(p); setMsg(null); }}
            aria-pressed={chosen === p}
            className={cn("relative flex flex-col rounded-[var(--radius-lg)] glass glass-edge p-6 text-left transition-[transform,box-shadow] hover:-translate-y-1 hover:glow-md disabled:opacity-60 disabled:hover:translate-y-0",
              p === "premium" && "gradient-border", chosen === p && "ring-2 ring-purple")}>
            <span className="text-sm font-bold uppercase tracking-wide text-ink-2">{t(`names.${p}`)}</span>
            <span className="mt-2 font-display text-4xl font-bold tabular">{PLAN_PRICES[p]} <span className="text-lg text-ink-2">TJS</span></span>
            <span className="text-sm text-ink-2">{t("perDays", { days: PLAN_DAYS })}</span>
            <ul className="mt-5 space-y-2 text-sm text-ink-1">
              {(["f1", "f2", "f3"] as const).map((f) => t.has(`features.${p}.${f}`) && <li key={f} className="flex gap-2"><span className="text-success">✓</span>{t(`features.${p}.${f}`)}</li>)}
            </ul>
            <span className={cn("mt-6 rounded-full px-4 py-2.5 text-center text-sm font-semibold", chosen === p ? "bg-gradient-primary text-white" : "bg-ink-3")}>
              {active === p ? t("extend") : t("choose")}
            </span>
          </button>
        ))}
      </div>

      {pending && !busy && <Notice tone="warning">{t("pending")}</Notice>}

      {chosen && (
        <div className="rounded-[var(--radius-lg)] glass glass-edge p-6 md:p-8">
          <h3 className="text-h3 font-bold">{t("pay.title", { plan: t(`names.${chosen}`) })}</h3>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-ink-1">
            <li>{t("pay.step1")}</li>
            <li>
              {t("pay.step2", { amount: PLAN_PRICES[chosen] })}
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="rounded-2xl bg-ink-3 px-4 py-2 font-display text-xl font-bold tabular">{ALIF_DISPLAY}</span>
                <button type="button" className="rounded-full glass px-4 py-2 text-sm font-semibold"
                  onClick={() => { void navigator.clipboard?.writeText(ALIF_NUMBER).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); }}>
                  {copied ? t("pay.copied") : t("pay.copy")}
                </button>
              </div>
            </li>
            <li>{t("pay.step3")}</li>
          </ol>
          <input ref={fileRef} type="file" accept="image/*" className="sr-only" disabled={busy}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = ""; }} />
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button onClick={() => fileRef.current?.click()} loading={busy} disabled={busy}>{t("pay.upload")}</Button>
            <Button variant="ghost" onClick={() => setChosen(null)} disabled={busy}>{t("pay.cancel")}</Button>
          </div>
          {busy && <p className="mt-4 flex items-center gap-3 text-sm text-ink-2"><Spinner className="h-4 w-4" />{t("pay.checking")}</p>}
          <p className="mt-4 text-xs text-ink-2">{t("pay.note")}</p>
        </div>
      )}

      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}

      {payments.length > 0 && (
        <div>
          <h3 className="text-h3 font-bold">{t("history")}</h3>
          <ul className="mt-4 space-y-2">
            {payments.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] glass px-5 py-4 text-sm">
                <span><b>{t(`names.${p.plan}`)}</b> · {p.amount_tjs} TJS · <span className="text-ink-2">{fmt(p.created_at)}</span></span>
                <span className="flex flex-wrap items-center gap-2">
                  {p.status === "rejected" && p.reason && <span className="text-ink-2">{reasonText(p.reason)}</span>}
                  <Badge tone={statusTone[p.status]}>{t(`status.${p.status}`)}</Badge>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
