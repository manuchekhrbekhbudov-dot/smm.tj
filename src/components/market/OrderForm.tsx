"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase/client";
import type { Service } from "@/lib/supabase/types";
import { normalizeTjPhone, formatTjs, userPhone } from "@/content/site";
import { Input, Textarea } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { notifyOrder } from "@/lib/telegram";
import { TelegramCodeForm } from "@/components/auth/TelegramCodeForm";
import { BlockedNotice } from "@/components/auth/BlockedNotice";
import { DecisionGate } from "@/components/trust/DecisionGate";
import { Consent } from "@/components/legal/Consent";

export function OrderForm({ specialistId, name, services }: { specialistId: string; name: string; services: Service[] }) {
  const t = useTranslations();
  const { session, profile, blocked, refreshProfile } = useAuth();
  const [state, setState] = useState<"idle" | "sending" | "done" | "error" | "decision">("idle");
  const [errors, setErrors] = useState<{ message?: string; phone?: string; name?: string }>({});

  if (blocked) return <BlockedNotice />;
  if (!session) {
    // Quick start for clients: just the phone + a Telegram code, no password, no separate page.
    return (
      <div>
        <h3 className="text-h3 font-bold">{t("order.title", { name })}</h3>
        <p className="mt-2 text-sm text-ink-1">{t("order.quick")}</p>
        <div className="mt-5"><TelegramCodeForm submitLabel={t("order.quickContinue")} /></div>
        <Consent className="mt-3" />
        <p className="mt-5 text-center text-sm text-ink-2">
          {t("order.haveAccount")}{" "}
          <Link href={{ pathname: "/login", query: { next: `/specialist?id=${specialistId}`, role: "client" } }} className="font-semibold text-purple">{t("common.login")}</Link>
        </p>
      </div>
    );
  }
  if (profile === undefined) return null;
  if (session.user.id === specialistId) return <Notice>{t("order.own")}</Notice>;
  if (profile && profile.role !== "client") return <Notice>{t("order.onlyClients")}</Notice>;
  if (state === "done") return <Notice tone="success">{t("order.success")} <Link href="/cabinet" className="font-semibold underline">{t("common.cabinet")}</Link></Notice>;

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const message = String(f.get("message") ?? "").trim();
    const phone = normalizeTjPhone(String(f.get("phone") ?? ""));
    const budget = Number(f.get("budget") || 0);
    const serviceId = String(f.get("service") ?? "") || null;
    const errs: typeof errors = {};
    if (message.length < 5) errs.message = t("order.errors.message");
    if (!phone) errs.phone = t("order.errors.phone");
    const fullName = String(f.get("full_name") ?? "").trim();
    if (needName && fullName.length < 2) errs.name = t("order.errors.name");
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setState("sending");
    if (needName) {
      await getSupabase()!.from("mp_profiles").update({ full_name: fullName.slice(0, 100) }).eq("id", session.user.id);
      void refreshProfile();
    }
    const { data: created, error } = await getSupabase()!.from("mp_orders").insert({
      client_id: session.user.id,
      specialist_id: specialistId,
      service_id: serviceId,
      message: message.slice(0, 3000),
      contact_phone: phone,
      budget_tjs: budget > 0 ? Math.round(budget) : null,
    }).select("id").single();
    setState(error ? (error.message.includes("decision_required") ? "decision" : "error") : "done");
    if (created?.id) void notifyOrder(created.id);
  };

  const myPhone = userPhone(session.user) ?? "+992 ";
  const needName = !profile?.full_name;
  if (state === "decision") return <DecisionGate><Notice>{t("trust.decisionDone")}</Notice></DecisionGate>;

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <h3 className="text-h3 font-bold">{t("order.title", { name })}</h3>
      {services.length > 0 && (
        <Select label={t("order.service")} name="service" defaultValue="">
          <option value="">{t("order.anyService")}</option>
          {services.map((s) => <option key={s.id} value={s.id}>{s.title} — {formatTjs(s.price_tjs)} TJS</option>)}
        </Select>
      )}
      {needName && <Input label={t("order.name")} name="full_name" autoComplete="name" maxLength={100} error={errors.name} />}
      <Textarea label={t("order.message")} name="message" maxLength={3000} error={errors.message} />
      <Input label={t("order.budget")} name="budget" type="number" inputMode="numeric" min={0} />
      <Input label={t("order.phone")} name="phone" type="tel" inputMode="tel" defaultValue={myPhone} error={errors.phone} />
      {state === "error" && <Notice tone="danger">{t("common.error")}</Notice>}
      <Button type="submit" size="lg" className="w-full" loading={state === "sending"}>{t("order.submit")}</Button>
    </form>
  );
}
