"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { getSupabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";
import { notifyTrust } from "@/lib/telegram";
import { Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";

/** Client complaint about a specialist on a real order (once per order). */
export function ComplaintForm({ orderId, specialistId, onDone, onCancel }: { orderId: string; specialistId: string; onDone: () => void; onCancel: () => void }) {
  const t = useTranslations("trust");
  const { session } = useAuth();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const save = async () => {
    if (text.trim().length < 10) { setErr(t("complaintShort")); return; }
    setBusy(true); setErr(null);
    const { error } = await getSupabase()!.from("mp_complaints")
      .insert({ order_id: orderId, specialist_id: specialistId, client_id: session?.user.id, text: text.trim().slice(0, 2000) });
    setBusy(false);
    if (error) { setErr(t("error")); return; }
    void notifyTrust(specialistId);
    onDone();
  };
  return (
    <div className="mt-4 space-y-3 rounded-[var(--radius-md)] border border-danger/30 bg-danger/5 p-4">
      <p className="font-semibold">{t("complaintTitle")}</p>
      <p className="text-sm text-ink-2">{t("complaintHint")}</p>
      <Textarea label={t("complaintText")} value={text} maxLength={2000} onChange={(e) => setText(e.target.value)} />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" loading={busy} onClick={save}>{t("send")}</Button>
        <Button size="sm" variant="ghost" disabled={busy} onClick={onCancel}>{t("back")}</Button>
      </div>
      {err && <Notice tone="danger">{err}</Notice>}
    </div>
  );
}
