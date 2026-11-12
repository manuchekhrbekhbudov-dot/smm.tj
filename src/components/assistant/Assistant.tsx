"use client";
import { Fragment, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import { askAssistant, assistantEnabled, type ChatMsg } from "@/lib/assistant";
import { localAnswer } from "@/lib/localAssistant";
import { useAuth } from "@/lib/auth";
import { usePathname } from "@/i18n/navigation";
import { Spinner } from "@/components/ui/Notice";
import { cn } from "@/lib/cn";

const STORE = "smmtj_ai_chat";

/** Renders **bold** and [text](https://…) / bare links safely (no HTML injection). */
function Rich({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\(https?:\/\/[^)\s]+\)|https?:\/\/[^\s)]+|\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) => {
        const md = p.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
        if (md) return <a key={i} href={md[2]} className="font-semibold text-purple underline" target={md[2].includes("smm.tj") ? undefined : "_blank"} rel="noopener noreferrer nofollow">{md[1]}</a>;
        if (/^https?:\/\//.test(p)) return <a key={i} href={p} className="break-all text-purple underline" rel="noopener noreferrer nofollow">{p}</a>;
        if (/^\*\*[^*]+\*\*$/.test(p)) return <b key={i}>{p.slice(2, -2)}</b>;
        return <Fragment key={i}>{p}</Fragment>;
      })}
    </>
  );
}

/** Floating AI helper: clients get help finding a specialist, specialists get answers about the platform. */
export function Assistant() {
  const t = useTranslations("assistant");
  const tAll = useTranslations();
  const locale = useLocale();
  const { profile, blocked } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => { void assistantEnabled().then(setEnabled); }, []);
  const [greet, setGreet] = useState(false);
  const onHome = usePathname() === "/";
  // Rendered into <body>: an animated (transformed) page wrapper would otherwise pin "fixed" elements to the page bottom.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [pending, setPending] = useState<string | null>(null);
  // Questions typed in the home-page bar open the chat here.
  useEffect(() => {
    const on = (e: Event) => { setOpen(true); setGreet(false); setPending(String((e as CustomEvent).detail ?? "")); };
    window.addEventListener("smmtj-ask", on);
    return () => window.removeEventListener("smmtj-ask", on);
  }, []);
  const sendRef = useRef<(q: string) => Promise<void>>(async () => {});
  useEffect(() => {
    if (pending === null || busy) return;
    const q = pending; setPending(null);
    if (q) void sendRef.current(q);
  }, [pending, busy]);
  // First visit: a friendly bubble pops up after 3 s so clients notice the helper right away.
  useEffect(() => {
    if (onHome) return; // the home page already has the big "What do you need?" bar
    let seen = false;
    try { seen = sessionStorage.getItem("smmtj_greeted") === "1"; } catch { /* ignore */ }
    if (seen) return;
    const id = setTimeout(() => { setGreet(true); try { sessionStorage.setItem("smmtj_greeted", "1"); } catch { /* ignore */ } }, 3000);
    return () => clearTimeout(id);
  }, [onHome]);
  useEffect(() => { try { const s = sessionStorage.getItem(STORE); if (s) setMsgs(JSON.parse(s)); } catch { /* ignore */ } }, []);
  useEffect(() => {
    try { sessionStorage.setItem(STORE, JSON.stringify(msgs.slice(-20))); } catch { /* ignore */ }
    const box = boxRef.current; // scroll only the chat, never the page
    if (box) box.scrollTop = box.scrollHeight;
  }, [msgs, open, busy]);

  if (blocked || !mounted) return null;
  const isSpec = profile?.role === "specialist";
  const suggestions = isSpec ? [t("s.spec1"), t("s.spec2"), t("s.spec3")] : [t("s.client1"), t("s.client2"), t("s.client3")];

  const send = async (text: string) => {
    const q = text.trim().slice(0, 1500);
    if (!q || busy) return;
    const next: ChatMsg[] = [...msgs, { role: "user", content: q }];
    setMsgs(next); setInput(""); setBusy(true); setErr(null);
    // Without an AI key the free built-in helper answers from the site's own texts and the real catalog.
    const r = enabled ? await askAssistant(next, locale)
      : { reply: await localAnswer(q, locale, (k, v) => t(k, v), tAll.raw("faq") as { q: string; a: string }[], isSpec).catch(() => "") || undefined };
    setBusy(false);
    if (r.reply) setMsgs([...next, { role: "assistant", content: r.reply }]);
    else { setErr(t(`errors.${["not_configured", "rate_limited", "blocked"].includes(r.error ?? "") ? r.error : "generic"}`)); setMsgs(msgs); setInput(q); }
  };

  sendRef.current = send;

  return createPortal(
    <>
      {greet && !open && (
        <div role="status" className="fixed bottom-[calc(max(1rem,env(safe-area-inset-bottom))+4.5rem)] right-4 z-40 max-w-[min(86vw,320px)] rounded-[var(--radius-md)] border border-purple/30 bg-bg-1 p-4 text-sm shadow-2xl md:right-6">
          <button type="button" aria-label={t("close")} onClick={() => setGreet(false)} className="absolute right-2 top-1 px-1 text-lg text-ink-2 hover:text-ink-0">×</button>
          <p className="pr-4 font-semibold">{isSpec ? t("greetSpec") : t("greet")}</p>
          <button type="button" onClick={() => { setGreet(false); setOpen(true); }} className="mt-3 rounded-full bg-gradient-primary px-4 py-2 font-semibold text-white">{t("greetCta")}</button>
        </div>
      )}
      <button type="button" onClick={() => { setOpen((v) => !v); setGreet(false); }} aria-expanded={open} aria-controls="ai-panel" aria-label={open ? t("close") : enabled ? t("open") : t("openLocal")}
        className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 flex h-14 items-center gap-2 rounded-full bg-gradient-primary px-5 font-semibold text-white glow-md transition-transform hover:-translate-y-0.5 md:right-6">
        <span aria-hidden className="text-xl">{open ? "×" : "✨"}</span><span className="hidden sm:inline">{open ? t("close") : enabled ? t("open") : t("openLocal")}</span>
      </button>
      {open && (
        <div id="ai-panel" role="dialog" aria-label={t("title")}
          className="fixed inset-x-2 bottom-[calc(max(1rem,env(safe-area-inset-bottom))+4.25rem)] z-40 flex max-h-[min(70dvh,560px)] flex-col overflow-hidden rounded-[var(--radius-lg)] border border-ink-3 bg-bg-1 shadow-2xl sm:inset-x-auto sm:right-6 sm:w-[400px]">
          <div className="flex items-center justify-between gap-3 border-b border-ink-3 px-5 py-4">
            <div>
              <p className="font-display font-bold">✨ {t("title")}</p>
              <p className="text-xs text-ink-2">{isSpec ? t("subtitleSpec") : t("subtitleClient")}</p>
            </div>
            {msgs.length > 0 && <button type="button" className="text-xs font-semibold text-ink-2 hover:text-ink-0" onClick={() => { setMsgs([]); setErr(null); }}>{t("clear")}</button>}
          </div>
          <div ref={boxRef} className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4 text-sm">
            {msgs.length === 0 && (
              <div className="space-y-2">
                <p className="text-ink-1">{enabled ? t("hello") : t("local.hello")}</p>
                {suggestions.map((s) => (
                  <button key={s} type="button" onClick={() => send(s)} className="block w-full rounded-2xl bg-ink-3 px-4 py-2.5 text-left hover:bg-purple/15">{s}</button>
                ))}
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={cn("max-w-[88%] whitespace-pre-line rounded-2xl px-4 py-2.5", m.role === "user" ? "ml-auto bg-gradient-primary text-white" : "bg-ink-3 text-ink-0")}>
                {m.role === "assistant" ? <Rich text={m.content} /> : m.content}
              </div>
            ))}
            {busy && <div className="flex items-center gap-2 text-ink-2"><Spinner className="h-4 w-4" />{t("thinking")}</div>}
            {err && <p className="rounded-2xl bg-warning/10 px-4 py-2.5 text-ink-1">{err}</p>}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); void send(input); }} className="flex gap-2 border-t border-ink-3 p-3">
            <input value={input} onChange={(e) => setInput(e.target.value)} maxLength={1500} placeholder={t("placeholder")} aria-label={t("placeholder")}
              className="h-11 min-w-0 flex-1 rounded-full bg-ink-3 px-4 text-base outline-none focus-visible:ring-2 focus-visible:ring-purple" />
            <button type="submit" disabled={busy || !input.trim()} className="h-11 shrink-0 rounded-full bg-gradient-primary px-4 font-semibold text-white disabled:opacity-50">{t("send")}</button>
          </form>
          <p className="px-4 pb-3 text-[11px] text-ink-2">{enabled ? t("disclaimer") : t("local.disclaimer")}</p>
        </div>
      )}
    </>,
    document.body,
  );
}
