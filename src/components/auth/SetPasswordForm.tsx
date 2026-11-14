"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { getSupabase } from "@/lib/supabase/client";
import { notifyPasswordChanged } from "@/lib/telegram";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";

/** Lets a just-verified (Telegram) user choose their own password. */
export function SetPasswordForm({ onDone, purpose = "register" }: { onDone: () => void; purpose?: "register" | "reset" }) {
  const t = useTranslations("auth");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 6) { setErr(t("errors.password")); return; }
    if (pw !== pw2) { setErr(t("mismatch")); return; }
    setBusy(true); setErr(null);
    const { error } = await getSupabase()!.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) { setErr(t("errors.generic")); return; }
    if (purpose === "reset") void notifyPasswordChanged();
    onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <p className="font-semibold">{t("regStep2")}</p>
      <p className="text-sm text-ink-1">{t("setPwText")}</p>
      <Input label={t("newPassword")} type="password" autoComplete="new-password" minLength={6} maxLength={72} value={pw} onChange={(e) => setPw(e.target.value)} />
      <Input label={t("confirmPassword")} type="password" autoComplete="new-password" minLength={6} maxLength={72} value={pw2} onChange={(e) => setPw2(e.target.value)} />
      {err && <Notice tone="danger">{err}</Notice>}
      <Button type="submit" size="lg" className="w-full" loading={busy}>{t("savePw")}</Button>
    </form>
  );
}
