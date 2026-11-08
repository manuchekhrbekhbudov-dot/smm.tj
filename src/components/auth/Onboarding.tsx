"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase/client";
import { citySlugs } from "@/content/site";
import { Input } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

const safeNext = (v: string | null) => (v && v.startsWith("/") && !v.startsWith("//") ? v : null);

export function Onboarding() {
  const t = useTranslations();
  const params = useSearchParams();
  const router = useRouter();
  const { profile, refreshProfile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const [role, setRole] = useState<"client" | "specialist">(
    profile?.role === "specialist" || params.get("role") === "specialist" ? "specialist" : "client"
  );
  const [name, setName] = useState(profile?.full_name ?? "");
  const [city, setCity] = useState(profile?.city ?? "");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [fail, setFail] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) { setErr(t("onboarding.errors.name")); return; }
    setBusy(true); setErr(null); setFail(false);
    const update: Record<string, unknown> = { full_name: name.trim().slice(0, 100), city: city || null };
    if (!isAdmin && role === "specialist") update.role = "specialist";
    const { data, error } = await getSupabase()!.from("mp_profiles").update(update).eq("id", profile!.id).select("role").single();
    setBusy(false);
    if (error) { setFail(true); return; }
    await refreshProfile();
    // The database decides the final role (the director always stays admin).
    if (isAdmin || data?.role === "admin") router.replace("/admin");
    else if (role === "specialist") router.replace({ pathname: "/cabinet", query: { tab: "profile" } });
    else router.replace(safeNext(params.get("next")) ?? "/specialists");
  };

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      {!isAdmin && profile?.role !== "specialist" && (
        <fieldset>
          <legend className="mb-3 text-sm font-semibold text-ink-2">{t("onboarding.iam")}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {(["client", "specialist"] as const).map((r) => (
              <button key={r} type="button" aria-pressed={role === r} onClick={() => setRole(r)}
                className={cn("rounded-[var(--radius-md)] border p-5 text-left transition-all", role === r ? "border-purple bg-purple/10 glow-sm" : "border-ink-3 hover:border-purple/40")}>
                <span className="flex items-center justify-between">
                  <span className="font-display text-lg font-bold">{t(`onboarding.${r}`)}</span>
                  {role === r && <Icon name="check" className="h-5 w-5 text-purple" />}
                </span>
                <span className="mt-1 block text-sm text-ink-1">{t(`onboarding.${r}Text`)}</span>
              </button>
            ))}
          </div>
        </fieldset>
      )}
      <Input label={t("onboarding.name")} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={100} error={err ?? undefined} />
      <Select label={t("onboarding.city")} value={city} onChange={(e) => setCity(e.target.value)}>
        <option value="">—</option>
        {citySlugs.map((c) => <option key={c} value={c}>{t(`cities.${c}`)}</option>)}
      </Select>
      {fail && <Notice tone="danger">{t("common.error")}</Notice>}
      <Button type="submit" size="lg" className="w-full" loading={busy}>{t("onboarding.continue")}</Button>
    </form>
  );
}
