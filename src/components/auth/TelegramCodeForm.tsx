"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { getBotUsername, getCodeStatus, loginWithTelegramCode, type CodeStatus } from "@/lib/telegram";
import { normalizeTjPhone } from "@/content/site";
import { dateLocale } from "@/lib/date";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Notice, Spinner } from "@/components/ui/Notice";
import { Icon } from "@/components/ui/Icon";
import { BlockedNotice } from "./BlockedNotice";

/**
 * "Open bot → share number → enter code". The code field stays locked until the bot has really
 * sent a code to this number; after 5 wrong codes the number is blocked for 24 hours.
 */
export function TelegramCodeForm({ onSuccess, onStart, defaultPhone = "+992 ", link = false, submitLabel }: {
  onSuccess?: () => void; onStart?: () => void; defaultPhone?: string; link?: boolean; submitLabel?: string;
}) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [bot, setBot] = useState<string | null | undefined>(undefined);
  const [phone, setPhone] = useState(defaultPhone);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [status, setStatus] = useState<CodeStatus | null>(null);
  const doneRef = useRef(false); // stop polling once a code is pending or the number is blocked

  useEffect(() => { getBotUsername().then(setBot); }, []);

  const p = normalizeTjPhone(phone);

  // Poll every 3 s until the bot has sent a code to this number.
  useEffect(() => {
    setStatus(null);
    doneRef.current = false;
    if (!p || !bot) return;
    let alive = true;
    const tick = async () => {
      const s = await getCodeStatus(p);
      if (!alive || !s) return;
      setStatus(s);
      doneRef.current = s.pending || !!s.blocked || !!s.blocked_account;
    };
    void tick();
    const id = setInterval(() => { if (!doneRef.current) void tick(); }, 3000);
    return () => { alive = false; clearInterval(id); };
  }, [p, bot]);

  if (bot === undefined) return <div className="flex justify-center py-6"><Spinner /></div>;
  if (!bot) return <Notice tone="warning">{t("tgUnavailable")}</Notice>;

  const fmtUntil = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    const loc = dateLocale(locale);
    return `${new Intl.DateTimeFormat(loc, { day: "numeric", month: "long" }).format(d)}, ${new Intl.DateTimeFormat(loc, { hour: "2-digit", minute: "2-digit" }).format(d)}`;
  };
  if (status?.blocked_account) return <BlockedNotice />;
  const blocked = !!status?.blocked;
  const ready = !!status?.pending && !blocked;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!p) { setErr(t("errors.phone")); return; }
    if (!ready) return;
    if (!/^\d{6}$/.test(code)) { setErr(t("tgErrors.wrong_code")); return; }
    setBusy(true); setErr(null);
    onStart?.();
    const res = await loginWithTelegramCode(p, code, link);
    setBusy(false);
    if (!res.error) { onSuccess?.(); return; }
    if (res.error === "account_blocked") { setStatus({ pending: false, blocked_account: true }); return; }
    if (res.error === "blocked") { setStatus({ pending: false, blocked: true, until: res.until }); setErr(null); return; }
    if (res.error === "wrong_code" && res.attemptsLeft !== undefined) { setErr(t("attemptsLeft", { n: res.attemptsLeft })); setCode(""); return; }
    if (res.error === "expired" || res.error === "no_code") { setStatus({ pending: false }); doneRef.current = false; }
    setErr(t(`tgErrors.${["wrong_code", "expired", "no_code", "too_many_attempts"].includes(res.error) ? res.error : "generic"}`));
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
        <Input label={t("phone")} type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => { setPhone(e.target.value); setErr(null); }} />

        {p && blocked && <Notice tone="danger">{t("blocked", { until: fmtUntil(status?.until) })}</Notice>}
        {p && !blocked && !ready && (
          <Notice tone="warning"><span className="inline-flex items-center gap-2"><Spinner className="h-4 w-4" />{t("waitingCode")}</span></Notice>
        )}
        {ready && <Notice tone="success">{t("codeArrived")}</Notice>}

        <Input label={t("code")} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} disabled={!ready}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className={`[&_input]:font-display [&_input]:text-xl [&_input]:tracking-[0.4em] ${ready ? "" : "pointer-events-none opacity-40"}`} />
        {err && <Notice tone="danger">{err}</Notice>}
        <Button type="submit" size="lg" className="w-full" loading={busy} disabled={!ready}>{submitLabel ?? t("tgLogin")}</Button>
      </form>
    </div>
  );
}
