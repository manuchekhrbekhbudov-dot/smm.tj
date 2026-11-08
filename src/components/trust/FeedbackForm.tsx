"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { getSupabase } from "@/lib/supabase/client";
import { Stars } from "@/components/ui/Stars";
import { Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { cn } from "@/lib/cn";

const KINDS = ["idea", "problem", "praise"] as const;

/** Suggestions and feedback about the platform, for clients and specialists. Only the director reads them. */
export function FeedbackForm() {
  const t = useTranslations("feedback");
  const [kind, setKind] = useState<(typeof KINDS)[number]>("idea");
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error" | "short" | "many">("idle");

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim().length < 5) { setState("short"); return; }
    setState("busy");
    const { error } = await getSupabase()!.from("mp_feedback").insert({ kind, rating: rating || null, text: text.trim().slice(0, 2000) });
    setState(error ? (error.message.includes("too_many") ? "many" : "error") : "done");
  };

  return (
    <div>
      <h1 className="text-h1 font-bold">{t("title")}</h1>
      <p className="mt-3 text-ink-1">{t("lead")}</p>
      {state === "done" ? (
        <Notice tone="success" className="mt-8">{t("thanks")} <button type="button" className="font-semibold underline" onClick={() => { setText(""); setRating(0); setState("idle"); }}>{t("more")}</button></Notice>
      ) : (
        <form onSubmit={send} className="mt-8 space-y-5 rounded-[var(--radius-lg)] glass glass-edge p-6 md:p-8" noValidate>
          <div role="radiogroup" className="flex flex-wrap gap-2">
            {KINDS.map((k) => (
              <button key={k} type="button" role="radio" aria-checked={kind === k} onClick={() => setKind(k)}
                className={cn("rounded-full px-4 py-2 text-sm font-semibold", kind === k ? "bg-gradient-primary text-white" : "glass text-ink-1")}>
                {t(`kinds.${k}`)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3"><span className="text-sm text-ink-2">{t("rating")}</span><Stars value={rating} onChange={setRating} size={26} label={t("rating")} /></div>
          <Textarea label={t("text")} value={text} maxLength={2000} onChange={(e) => setText(e.target.value)} />
          {state === "short" && <Notice tone="warning">{t("short")}</Notice>}
          {state === "many" && <Notice tone="warning">{t("many")}</Notice>}
          {state === "error" && <Notice tone="danger">{t("error")}</Notice>}
          <Button type="submit" size="lg" loading={state === "busy"}>{t("send")}</Button>
        </form>
      )}
    </div>
  );
}
