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
import { buttonClasses } from "@/components/ui/buttonClasses";

export function OrderForm({ specialistId, name, services }: { specialistId: string; name: string; services: Service[] }) {
  const t = useTranslations();
  const { session } = useAuth();
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [errors, setErrors] = useState<{ message?: string; phone?: string }>({});

  if (!session) {
    return (
      <div>
        <p className="text-ink-1">{t("order.login")}</p>
        <Link href={{ pathname: "/login", query: { next: `/specialist?id=${specialistId}` } }} className={buttonClasses("primary", "lg", "mt-5 w-full")}>{t("common.login")}</Link>
      </div>
    );
  }
  if (session.user.id === specialistId) return <Notice>{t("order.own")}</Notice>;
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
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setState("sending");
    const { error } = await getSupabase()!.from("mp_orders").insert({
      client_id: session.user.id,
      specialist_id: specialistId,
      service_id: serviceId,
      message: message.slice(0, 3000),
      contact_phone: phone,
      budget_tjs: budget > 0 ? Math.round(budget) : null,
    });
    setState(error ? "error" : "done");
  };

  const myPhone = userPhone(session.user) ?? "+992 ";

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <h3 className="text-h3 font-bold">{t("order.title", { name })}</h3>
      {services.length > 0 && (
        <Select label={t("order.service")} name="service" defaultValue="">
          <option value="">{t("order.anyService")}</option>
          {services.map((s) => <option key={s.id} value={s.id}>{s.title} — {formatTjs(s.price_tjs)} TJS</option>)}
        </Select>
      )}
      <Textarea label={t("order.message")} name="message" maxLength={3000} error={errors.message} />
      <Input label={t("order.budget")} name="budget" type="number" inputMode="numeric" min={0} />
      <Input label={t("order.phone")} name="phone" type="tel" inputMode="tel" defaultValue={myPhone} error={errors.phone} />
      {state === "error" && <Notice tone="danger">{t("common.error")}</Notice>}
      <Button type="submit" size="lg" className="w-full" loading={state === "sending"}>{t("order.submit")}</Button>
    </form>
  );
}
