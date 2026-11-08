"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { getSupabase } from "@/lib/supabase/client";
import { Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { notifyOrder } from "@/lib/telegram";

/** Client: "Did you hire this specialist?" — Yes, or No with a reason (required before ordering again). */
export function HireDecision({ orderId, name, note, startWithNo = false, onDone }: {
  orderId: string; name: string; note?: string | null; startWithNo?: boolean; onDone: () => void;
}) {
  const t = useTranslations("trust");
  const [no, setNo] = useState(startWithNo);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const save = async (hired: boolean) => {
    if (!hired && reason.trim().length < 5) { setErr(t("reasonShort")); return; }
    setBusy(true); setErr(null);
    const { error } = await getSupabase()!.from("mp_orders")
      .update(hired ? { hire_status: "hired" } : { hire_status: "not_hired", client_reason: reason.trim().slice(0, 1000), status: "cancelled" })
      .eq("id", orderId);
    setBusy(false);
    if (error) { setErr(t("error")); return; }
    void notifyOrder(orderId);
    onDone();
  };

  return (
    <div className="mt-4 rounded-[var(--radius-md)] border border-warning/40 bg-warning/10 p-4">
      <p className="font-semibold">{t("hireQuestion", { name })}</p>
      {note && <p className="mt-2 text-sm text-ink-1">{t("specialistSays")}: «{note}»</p>}
      {!no ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" loading={busy} onClick={() => save(true)}>{t("hiredYes")}</Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => setNo(true)}>{t("hiredNo")}</Button>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <Textarea label={t("whyNot")} value={reason} maxLength={1000} onChange={(e) => setReason(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" loading={busy} onClick={() => save(false)}>{t("send")}</Button>
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => setNo(false)}>{t("back")}</Button>
          </div>
        </div>
      )}
      {err && <Notice tone="danger" className="mt-3">{err}</Notice>}
    </div>
  );
}

/** Specialist: "The client did not hire me" + reason (once). */
export function NotHiredReport({ orderId, onDone }: { orderId: string; onDone: () => void }) {
  const t = useTranslations("trust");
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  if (!open) return <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>{t("notHiredMe")}</Button>;
  const save = async () => {
    if (text.trim().length < 5) { setErr(t("reasonShort")); return; }
    setBusy(true); setErr(null);
    const { error } = await getSupabase()!.from("mp_orders").update({ specialist_note: text.trim().slice(0, 1000) }).eq("id", orderId);
    setBusy(false);
    if (error) setErr(t("error")); else onDone();
  };
  return (
    <div className="mt-4 w-full space-y-3 rounded-[var(--radius-md)] bg-ink-3 p-4">
      <Textarea label={t("notHiredWhy")} value={text} maxLength={1000} onChange={(e) => setText(e.target.value)} />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" loading={busy} onClick={save}>{t("send")}</Button>
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => setOpen(false)}>{t("back")}</Button>
      </div>
      {err && <Notice tone="danger">{err}</Notice>}
    </div>
  );
}
