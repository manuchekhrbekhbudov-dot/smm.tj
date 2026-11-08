"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase/client";
import type { Specialist } from "@/lib/supabase/types";
import { citySlugs, specialtySlugs } from "@/content/site";
import { safeHttpUrl } from "@/lib/links";
import { Input, Textarea } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Notice, Skeleton } from "@/components/ui/Notice";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

type Form = {
  full_name: string; city: string; headline: string; bio: string; experience_years: number;
  specialties: string[]; portfolio_links: string[]; telegram: string; whatsapp: string; instagram: string;
};

export function SpecialistEditor({ onSaved }: { onSaved: () => void }) {
  const t = useTranslations();
  const { profile, refreshProfile } = useAuth();
  const sb = getSupabase()!;
  const [f, setF] = useState<Form | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    sb.from("specialists").select("*").eq("id", profile!.id).maybeSingle().then(({ data }) => {
      const s = data as Specialist | null;
      setF({
        full_name: profile!.full_name, city: profile!.city ?? "",
        headline: s?.headline ?? "", bio: s?.bio ?? "", experience_years: s?.experience_years ?? 0,
        specialties: s?.specialties ?? [], portfolio_links: s?.portfolio_links?.length ? s.portfolio_links : [""],
        telegram: s?.telegram ?? "", whatsapp: s?.whatsapp ?? "", instagram: s?.instagram ?? "",
      });
    });
  }, [sb, profile]);

  if (!f) return <Skeleton className="h-96" />;
  const set = <K extends keyof Form>(k: K, v: Form[K]) => { setF({ ...f, [k]: v }); setState("idle"); };

  const uploadAvatar = async (file: File) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setErrors((e) => ({ ...e, avatar: t("cabinet.profile.errors.avatar") })); return;
    }
    setUploading(true);
    const ext = file.type.split("/")[1];
    const path = `${profile!.id}/avatar-${Date.now()}.${ext}`;
    const { error } = await sb.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
    if (!error) {
      const url = sb.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      await sb.from("profiles").update({ avatar_url: url }).eq("id", profile!.id);
      await refreshProfile();
      setErrors((e) => ({ ...e, avatar: "" }));
    } else {
      setErrors((e) => ({ ...e, avatar: t("common.error") }));
    }
    setUploading(false);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (f.full_name.trim().length < 2) errs.full_name = t("onboarding.errors.name");
    if (f.headline.trim().length < 5) errs.headline = t("cabinet.profile.errors.headline");
    if (f.bio.trim().length < 30) errs.bio = t("cabinet.profile.errors.bio");
    if (f.specialties.length === 0) errs.specialties = t("cabinet.profile.errors.specialties");
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setState("saving");
    const links = f.portfolio_links.map((l) => safeHttpUrl(l)).filter((x): x is string => !!x).slice(0, 10);
    const r1 = await sb.from("profiles").update({ full_name: f.full_name.trim().slice(0, 100), city: f.city || null }).eq("id", profile!.id);
    const r2 = await sb.from("specialists").upsert({
      id: profile!.id,
      headline: f.headline.trim().slice(0, 120), bio: f.bio.trim().slice(0, 3000),
      experience_years: Math.max(0, Math.min(50, Math.round(f.experience_years || 0))),
      specialties: f.specialties, portfolio_links: links,
      telegram: f.telegram.trim().slice(0, 100) || null, whatsapp: f.whatsapp.trim().slice(0, 30) || null, instagram: f.instagram.trim().slice(0, 100) || null,
    });
    if (r1.error || r2.error) { setState("error"); return; }
    setF({ ...f, portfolio_links: links.length ? links : [""] });
    await refreshProfile();
    setState("saved");
    onSaved();
  };

  return (
    <form onSubmit={save} className="space-y-6" noValidate>
      <div className="flex items-center gap-5">
        <Avatar name={f.full_name} url={profile?.avatar_url} size={80} />
        <label className={cn("cursor-pointer rounded-full glass px-5 py-2.5 text-sm font-semibold hover:glow-sm", uploading && "opacity-60")}>
          {uploading ? t("common.loading") : t("cabinet.profile.upload")}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={uploading}
            onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadAvatar(file); e.target.value = ""; }} />
        </label>
      </div>
      {errors.avatar && <p className="text-sm text-danger">{errors.avatar}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        <Input label={t("cabinet.profile.name")} value={f.full_name} onChange={(e) => set("full_name", e.target.value)} error={errors.full_name} maxLength={100} />
        <Select label={t("cabinet.profile.city")} value={f.city} onChange={(e) => set("city", e.target.value)}>
          <option value="">—</option>
          {citySlugs.map((c) => <option key={c} value={c}>{t(`cities.${c}`)}</option>)}
        </Select>
        <Input className="md:col-span-2" label={t("cabinet.profile.headline")} value={f.headline} onChange={(e) => set("headline", e.target.value)} error={errors.headline} maxLength={120} />
        <Textarea className="md:col-span-2" label={t("cabinet.profile.bio")} value={f.bio} onChange={(e) => set("bio", e.target.value)} error={errors.bio} maxLength={3000} rows={6} />
        <Input label={t("cabinet.profile.years")} type="number" inputMode="numeric" min={0} max={50} value={String(f.experience_years)} onChange={(e) => set("experience_years", Number(e.target.value))} />
      </div>

      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-ink-2">{t("cabinet.profile.specialties")}</legend>
        <div className="flex flex-wrap gap-2">
          {specialtySlugs.map((sp) => {
            const on = f.specialties.includes(sp);
            return (
              <button key={sp} type="button" aria-pressed={on}
                onClick={() => set("specialties", on ? f.specialties.filter((x) => x !== sp) : [...f.specialties, sp])}
                className={cn("rounded-full border px-4 py-2 text-sm font-semibold transition-all", on ? "border-transparent bg-gradient-primary text-white glow-sm" : "border-ink-3 text-ink-1 hover:border-purple/50")}>
                {t(`specialties.${sp}.title`)}
              </button>
            );
          })}
        </div>
        {errors.specialties && <p className="mt-2 text-sm text-danger">{errors.specialties}</p>}
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="mb-3 text-sm font-semibold text-ink-2">{t("cabinet.profile.links")}</legend>
        {f.portfolio_links.map((l, i) => (
          <div key={i} className="flex gap-2">
            <Input className="flex-1" label={`https://... (${i + 1})`} type="url" inputMode="url" value={l}
              onChange={(e) => set("portfolio_links", f.portfolio_links.map((x, j) => (j === i ? e.target.value : x)))} />
            {f.portfolio_links.length > 1 && (
              <button type="button" aria-label={t("common.delete")} className="rounded-full px-3 text-ink-2 hover:text-danger"
                onClick={() => set("portfolio_links", f.portfolio_links.filter((_, j) => j !== i))}>✕</button>
            )}
          </div>
        ))}
        {f.portfolio_links.length < 10 && (
          <button type="button" className="inline-flex items-center gap-2 text-sm font-semibold text-purple" onClick={() => set("portfolio_links", [...f.portfolio_links, ""])}>
            <Icon name="plus" className="h-4 w-4" /> {t("cabinet.profile.linkAdd")}
          </button>
        )}
      </fieldset>

      <div className="grid gap-4 md:grid-cols-3">
        <Input label={t("cabinet.profile.telegram")} value={f.telegram} onChange={(e) => set("telegram", e.target.value)} maxLength={100} />
        <Input label={t("cabinet.profile.whatsapp")} type="tel" value={f.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} maxLength={30} />
        <Input label={t("cabinet.profile.instagram")} value={f.instagram} onChange={(e) => set("instagram", e.target.value)} maxLength={100} />
      </div>

      {state === "error" && <Notice tone="danger">{t("common.error")}</Notice>}
      {state === "saved" && <Notice tone="success">{t("common.saved")}</Notice>}
      <Button type="submit" size="lg" loading={state === "saving"}>{t("cabinet.profile.submit")}</Button>
    </form>
  );
}
