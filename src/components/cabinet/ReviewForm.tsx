"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { getSupabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";
import { Stars } from "@/components/ui/Stars";
import { Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { notifyTrust } from "@/lib/telegram";

export function ReviewForm({ orderId, specialistId, onDone, onCancel }: { orderId: string; specialistId?: string; onDone: () => void; onCancel: () => void }) {
  const t = useTranslations();
  const { session } = useAuth();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim().length < 10) { setErr(t("cabinet.review.text")); return; }
    setBusy(true); setErr(null);
    // client_id / specialist_id are overwritten by the database from the order itself
    const { error } = await getSupabase()!.from("mp_reviews").insert({
      order_id: orderId, client_id: session!.user.id, specialist_id: session!.user.id, rating, text: text.trim().slice(0, 2000),
    });
    setBusy(false);
    if (error) { setErr(t("cabinet.review.error")); return; }
    if (specialistId) void notifyTrust(specialistId); // warning / removal and welcome bonus are counted by the database
    onDone();
  };

  return (
    <form onSubmit={submit} className="mt-5 space-y-4 rounded-[var(--radius-md)] border border-purple/30 bg-purple/5 p-5" noValidate>
      <p className="font-semibold">{t("cabinet.review.title")}</p>
      <p className="rounded-2xl bg-success/10 px-4 py-3 text-sm text-ink-1">🎁 {t("trust.prizeHint")}</p>
      <div className="flex items-center gap-3"><span className="text-sm text-ink-2">{t("cabinet.review.rating")}</span><Stars value={rating} onChange={setRating} size={28} label={t("cabinet.review.rating")} /></div>
      {rating === 1 && <p className="text-xs text-warning">{t("trust.oneStarHint")}</p>}
      <Textarea label={t("cabinet.review.text")} value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} />
      {err && <Notice tone="danger">{err}</Notice>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={busy}>{t("cabinet.review.submit")}</Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>{t("common.cancel")}</Button>
      </div>
    </form>
  );
}
