"use client";
import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Input, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { submitLead, type LeadState } from "@/lib/actions/contact";
import { serviceSlugs, packageSlugs } from "@/content/site";
import { cn } from "@/lib/cn";

const initial: LeadState = { status: "idle" };

export function ContactForm() {
  const t = useTranslations();
  const params = useSearchParams();
  const [state, action, pending] = useActionState(submitLead, initial);
  const formRef = useRef<HTMLFormElement>(null);

  const pre = params.get("package") ?? params.get("service") ?? "";
  const options = [
    ...packageSlugs.map((p) => ({ value: `package:${p}`, label: `${t("nav.pricing")}: ${t(`pricing.packages.${p}.name`)}` })),
    ...serviceSlugs.map((s) => ({ value: `service:${s}`, label: t(`services.items.${s}.title`) })),
  ];
  const preValue = options.find((o) => o.value.endsWith(`:${pre}`))?.value ?? "";

  useEffect(() => { if (state.status === "success") formRef.current?.reset(); }, [state]);

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {state.status === "success" ? (
          <motion.div
            key="ok"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex min-h-[420px] flex-col items-center justify-center text-center"
            role="status"
          >
            <motion.span
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 15, delay: 0.1 }}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-primary text-white glow-lg"
            >
              <Icon name="check" className="h-10 w-10" />
            </motion.span>
            <p className="mt-6 max-w-sm text-xl font-semibold">{t("contact.form.success")}</p>
            <Button variant="outline" className="mt-8" onClick={() => location.reload()}>{t("contact.form.again")}</Button>
          </motion.div>
        ) : (
          <motion.form key="form" ref={formRef} action={action} exit={{ opacity: 0, y: -20 }} className="grid gap-5 md:grid-cols-2" noValidate>
            <Input label={t("contact.form.name")} name="name" autoComplete="name" required maxLength={100}
              error={state.errors?.name ? t("contact.errors.name") : undefined} />
            <Input label={t("contact.form.phone")} name="phone" type="tel" inputMode="tel" autoComplete="tel" required defaultValue="+992 "
              error={state.errors?.phone ? t("contact.errors.phone") : undefined} />
            <Input label={t("contact.form.business")} name="business" className="md:col-span-2" maxLength={200} />
            <div className="relative md:col-span-2">
              <select
                name="service"
                defaultValue={preValue}
                aria-label={t("contact.form.service")}
                className="w-full appearance-none rounded-[var(--radius-sm)] border border-ink-3 bg-bg-2/60 px-4 py-4 text-ink-0 outline-none transition-[border-color,box-shadow] focus:border-purple focus:shadow-[0_0_0_4px_rgb(168_85_247/0.15)]"
              >
                <option value="">{t("contact.form.service")}</option>
                {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <svg className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="m6 9 6 6 6-6" /></svg>
            </div>
            <Textarea label={t("contact.form.message")} name="message" className="md:col-span-2" maxLength={2000}
              error={state.errors?.message ? t("contact.errors.message") : undefined} />
            {/* honeypot */}
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
            {state.status === "error" && !state.errors && <p className="text-sm text-danger md:col-span-2" role="alert">{t("contact.form.error")}</p>}
            <div className={cn("md:col-span-2")}>
              <Button type="submit" size="lg" magnetic loading={pending} className="w-full md:w-auto" icon={!pending ? <Icon name="arrow" className="h-5 w-5" /> : undefined}>
                {pending ? t("contact.form.sending") : t("contact.form.submit")}
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
