"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "@/i18n/navigation";
import { getSupabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";
import { normalizeTjPhone } from "@/content/site";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";

const RESEND = 60;

/** Only allow internal paths as post-login redirect targets. */
const safeNext = (v: string | null) => (v && v.startsWith("/") && !v.startsWith("//") ? v : null);

export function LoginForm() {
  const t = useTranslations();
  const params = useSearchParams();
  const router = useRouter();
  const { session, profile, ready } = useAuth();
  const sb = getSupabase();
  const role = params.get("role") === "specialist" ? "specialist" : null;
  const next = safeNext(params.get("next"));

  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [left, setLeft] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  // Already signed in → continue
  useEffect(() => {
    if (!ready || !session || !profile) return;
    if (!profile.full_name || (role === "specialist" && profile.role === "client")) {
      router.replace({ pathname: "/onboarding", query: { ...(role ? { role } : {}), ...(next ? { next } : {}) } });
    } else {
      router.replace(next ?? "/cabinet");
    }
  }, [ready, session, profile, role, next, router]);

  useEffect(() => {
    if (left <= 0) return;
    const id = setTimeout(() => setLeft((v) => v - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);

  if (!sb) return <Notice tone="warning">{t("common.notConfigured")}</Notice>;

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const p = normalizeTjPhone(phone);
    if (!p) { setErr(t("auth.errors.phone")); return; }
    setBusy(true); setErr(null);
    const { error } = await sb.auth.signInWithOtp({ phone: p });
    setBusy(false);
    if (error) { setErr(t("auth.errors.generic")); return; }
    setPhone(p); setStep("code"); setLeft(RESEND); setCode("");
    setTimeout(() => codeRef.current?.focus(), 50);
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) { setErr(t("auth.errors.code")); return; }
    setBusy(true); setErr(null);
    const { error } = await sb.auth.verifyOtp({ phone, token: code, type: "sms" });
    setBusy(false);
    if (error) setErr(t("auth.errors.code"));
    // success → the auth listener loads the profile and the effect above redirects
  };

  return (
    <AnimatePresence mode="wait">
      {step === "phone" ? (
        <motion.form key="phone" onSubmit={send} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-5" noValidate>
          <Input label={t("auth.phone")} type="tel" inputMode="tel" autoComplete="tel" value={phone || "+992 "} onChange={(e) => setPhone(e.target.value)} error={err ?? undefined} autoFocus />
          <Button type="submit" size="lg" className="w-full" loading={busy}>{t("auth.sendCode")}</Button>
        </motion.form>
      ) : (
        <motion.form key="code" onSubmit={verify} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5" noValidate>
          <p className="text-ink-1">{t("auth.codeSent", { phone })}</p>
          <motion.div animate={err ? { x: [0, -10, 10, -6, 6, 0] } : {}} transition={{ duration: 0.4 }}>
            <Input ref={codeRef} label={t("auth.code")} inputMode="numeric" autoComplete="one-time-code" maxLength={6}
              value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} error={err ?? undefined}
              className="[&_input]:tracking-[0.5em] [&_input]:font-display [&_input]:text-xl" />
          </motion.div>
          <Button type="submit" size="lg" className="w-full" loading={busy}>{t("auth.verify")}</Button>
          <div className="flex flex-wrap justify-between gap-3 text-sm">
            <button type="button" className="text-ink-2 hover:text-ink-0" onClick={() => { setStep("phone"); setErr(null); }}>{t("auth.changePhone")}</button>
            <button type="button" disabled={left > 0 || busy} className="font-semibold text-purple disabled:text-ink-2" onClick={() => send()}>
              {left > 0 ? t("auth.resend", { sec: left }) : t("auth.resendNow")}
            </button>
          </div>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
