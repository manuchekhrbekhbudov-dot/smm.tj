"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { getSupabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth";
import { normalizeTjPhone, phoneToEmail } from "@/content/site";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

/** Only allow internal paths as post-login redirect targets. */
const safeNext = (v: string | null) => (v && v.startsWith("/") && !v.startsWith("//") ? v : null);

export function LoginForm() {
  const t = useTranslations();
  const params = useSearchParams();
  const router = useRouter();
  const { session, profile, ready } = useAuth();
  const sb = getSupabase();
  const paramRole = params.get("role");
  const [role, setRole] = useState<"client" | "specialist" | null>(paramRole === "specialist" ? "specialist" : paramRole === "client" ? "client" : null);
  const next = safeNext(params.get("next"));

  const [mode, setMode] = useState<"login" | "register">(paramRole === "specialist" ? "register" : "login");
  const [phone, setPhone] = useState("+992 ");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<{ phone?: string; password?: string; form?: string }>({});

  // Signed in → continue to the right place
  useEffect(() => {
    if (!ready || !session || !profile) return;
    if (!profile.full_name || (role === "specialist" && profile.role === "client")) {
      router.replace({ pathname: "/onboarding", query: { ...(role ? { role } : {}), ...(next ? { next } : {}) } });
    } else if (next) {
      router.replace(next);
    } else {
      router.replace(profile.role === "admin" ? "/admin" : profile.role === "specialist" ? "/cabinet" : "/specialists");
    }
  }, [ready, session, profile, role, next, router]);

  if (!sb) return <Notice tone="warning">{t("common.notConfigured")}</Notice>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = normalizeTjPhone(phone);
    const errs: typeof err = {};
    if (!p) errs.phone = t("auth.errors.phone");
    if (password.length < 6) errs.password = t("auth.errors.password");
    setErr(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    const email = phoneToEmail(p!);
    const res = mode === "login"
      ? await sb.auth.signInWithPassword({ email, password })
      : await sb.auth.signUp({ email, password });
    setBusy(false);
    if (res.error) {
      const code = (res.error as { code?: string }).code ?? "";
      const key =
        code === "invalid_credentials" ? "invalid"
        : code === "user_already_exists" || code === "email_exists" ? "exists"
        : code === "weak_password" ? "password"
        : code === "email_not_confirmed" || code.includes("email_address_not_authorized") || code === "email_provider_disabled" ? "confirm"
        : code.includes("rate_limit") ? "rateLimit" : "generic";
      if (key === "exists") setMode("login");
      setErr({ form: t(`auth.errors.${key}`) });
      return;
    }
    // If "Confirm email" is ON, sign-up returns no session; the database auto-confirms phone accounts, so sign in right away.
    if (mode === "register" && !res.data.session) {
      setBusy(true);
      const again = await sb.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (again.error) setErr({ form: t("auth.errors.confirm") });
    }
    // success → auth listener loads the profile, the effect above redirects
  };

  if (!role) {
    return (
      <div className="space-y-3">
        <p className="font-display text-lg font-bold">{t("auth.chooseTitle")}</p>
        <p className="text-sm text-ink-1">{t("auth.chooseSubtitle")}</p>
        {(["client", "specialist"] as const).map((r) => (
          <button key={r} type="button" onClick={() => { setRole(r); setMode(r === "specialist" ? "register" : "login"); }}
            className="flex w-full items-center gap-4 rounded-[var(--radius-md)] glass glass-edge p-4 text-left transition-transform hover:-translate-y-0.5 active:scale-[0.99]">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl orb text-white"><Icon name={r === "client" ? "smm" : "star"} className="h-6 w-6" /></span>
            <span className="flex-1">
              <span className="block font-semibold">{t(r === "client" ? "auth.asClient" : "auth.asSpecialist")}</span>
              <span className="block text-sm text-ink-1">{t(r === "client" ? "auth.asClientText" : "auth.asSpecialistText")}</span>
            </span>
            <Icon name="arrow" className="h-5 w-5 text-ink-2" />
          </button>
        ))}
        <button type="button" onClick={() => { setRole("client"); setMode("login"); }}
          className="w-full pt-2 text-center text-sm font-semibold text-purple hover:underline">
          {t("auth.asAdmin")}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3 rounded-full bg-ink-3 py-1.5 pl-4 pr-1.5 text-sm">
        <span className="font-semibold">{t(role === "client" ? "auth.forClient" : "auth.forSpecialist")}</span>
        {!paramRole && (
          <button type="button" className="rounded-full px-3 py-1 text-purple hover:bg-ink-3" onClick={() => { setRole(null); setErr({}); }}>{t("auth.change")}</button>
        )}
      </div>

      <div role="tablist" className="mb-5 grid grid-cols-2 gap-1 rounded-full glass p-1">
        {(["login", "register"] as const).map((m) => (
          <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setErr({}); }}
            className={cn("h-10 rounded-full text-sm font-semibold transition-colors", mode === m ? "bg-gradient-primary text-white" : "text-ink-1 hover:text-ink-0")}>
            {t(m === "login" ? "auth.login" : "auth.register")}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-4" noValidate>
        <Input label={t("auth.phone")} type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} error={err.phone} />
        <Input label={t("auth.password")} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={6} maxLength={72}
          value={password} onChange={(e) => setPassword(e.target.value)} error={err.password} />
        {err.form && <Notice tone="danger">{err.form}</Notice>}
        <Button type="submit" size="lg" className="w-full" loading={busy}>{t(mode === "login" ? "auth.login" : "auth.register")}</Button>
        <p className="text-center text-sm text-ink-2">
          {t(mode === "login" ? "auth.noAccount" : "auth.haveAccount")}{" "}
          <button type="button" className="font-semibold text-purple" onClick={() => { setMode(mode === "login" ? "register" : "login"); setErr({}); }}>
            {t(mode === "login" ? "auth.toRegister" : "auth.toLogin")}
          </button>
        </p>
      </form>
    </div>
  );
}
