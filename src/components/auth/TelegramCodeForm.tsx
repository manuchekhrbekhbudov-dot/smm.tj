"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getBotUsername, loginWithTelegramCode } from "@/lib/telegram";
import { normalizeTjPhone } from "@/content/site";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Notice, Spinner } from "@/components/ui/Notice";
import { Icon } from "@/components/ui/Icon";

/** "Open bot → share number → enter code" sign-in. onSuccess runs after the session is created. */
export function TelegramCodeForm({ onSuccess, onStart, defaultPhone = "+992 ", link = false, submitLabel }: { onSuccess?: () => void; onStart?: () => void; defaultPhone?: string; link?: boolean; submitLabel?: string }) {
  const t = useTranslations("auth");
  const [bot, setBot] = useState<string | null | undefined>(undefined);
  const [phone, setPhone] = useState(defaultPhone);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { getBotUsername().then(setBot); }, []);

  if (bot === undefined) return <div className="flex justify-center py-6"><Spinner /></div>;
  if (!bot) return <Notice tone="warning">{t("tgUnavailable")}</Notice>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = normalizeTjPhone(phone);
    if (!p) { setErr(t("errors.phone")); return; }
    if (!/^\d{6}$/.test(code)) { setErr(t("tgErrors.wrong_code")); return; }
    setBusy(true); setErr(null);
    onStart?.();
    const res = await loginWithTelegramCode(p, code, link);
    setBusy(false);
    if (res) { setErr(t(`tgErrors.${["wrong_code", "expired", "no_code", "too_many_attempts"].includes(res) ? res : "generic"}`)); return; }
    onSuccess?.();
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-ink-1">{t("tgStep1")}</p>
        <a href={`https://t.me/${bot}?start=login`} target="_blank" rel="noopener noreferrer"
          className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#229ED9] font-semibold text-white transition-transform hover:-translate-y-0.5">
          <Icon name="telegram" className="h-5 w-5" /> {t("tgOpen")} · @{bot}
        </a>
      </div>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <p className="text-sm text-ink-1">{t("tgStep2")}</p>
        <Input label={t("phone")} type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input label={t("code")} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} className="[&_input]:font-display [&_input]:text-xl [&_input]:tracking-[0.4em]" />
        {err && <Notice tone="danger">{err}</Notice>}
        <Button type="submit" size="lg" className="w-full" loading={busy}>{submitLabel ?? t("tgLogin")}</Button>
      </form>
    </div>
  );
}
