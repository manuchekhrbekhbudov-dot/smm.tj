"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase/client";
import { dateLocale } from "@/lib/date";
import { CONV_SELECT, isUnread, notifyMessage, startConversation, type Conversation, type Message } from "@/lib/chat";
import { Avatar } from "@/components/ui/Avatar";
import { Notice, Skeleton, Spinner } from "@/components/ui/Notice";
import { cn } from "@/lib/cn";

/** Inbox + conversation thread for clients and specialists. Polls for new messages while open. */
export function Messages() {
  const t = useTranslations("chat");
  const locale = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const { profile } = useAuth();
  const me = profile!.id;
  const sb = getSupabase()!;
  const [convs, setConvs] = useState<Conversation[] | null>(null);
  const [notReady, setNotReady] = useState(false);
  const [active, setActive] = useState<string | null>(params.get("c"));
  const [err, setErr] = useState<string | null>(null);

  const loadConvs = useCallback(async () => {
    const { data, error } = await sb.from("mp_conversations").select(CONV_SELECT).order("last_message_at", { ascending: false }).limit(100);
    if (error) { setNotReady(true); setConvs([]); return; }
    setConvs((data as unknown as Conversation[]) ?? []);
  }, [sb]);

  // ?to=<specialist id> → open or create the conversation, then show it
  useEffect(() => {
    const to = params.get("to");
    if (!to) { void loadConvs(); return; }
    void startConversation(me, to).then(async (r) => {
      if (r.id) { setActive(r.id); router.replace({ pathname: "/messages", query: { c: r.id } }); }
      else setErr(r.error?.includes("only_clients") ? t("onlyClients") : r.error?.includes("specialist_not_available") ? t("notAvailable") : t("error"));
      await loadConvs();
    });
  }, [params, me, loadConvs, router, t]);
  useEffect(() => { const id = setInterval(() => void loadConvs(), 15000); return () => clearInterval(id); }, [loadConvs]);

  if (notReady) return <Notice tone="warning">{t("notReady")}</Notice>;
  if (convs === null) return <Skeleton className="h-96" />;
  const nameOf = (c: Conversation) => (me === c.client_id ? c.specialist?.profiles?.full_name : c.client?.full_name) || "—";
  const avatarOf = (c: Conversation) => (me === c.client_id ? c.specialist?.profiles?.avatar_url : c.client?.avatar_url) ?? null;
  const cur = convs.find((c) => c.id === active) ?? null;
  const df = new Intl.DateTimeFormat(dateLocale(locale), { day: "numeric", month: "short" });

  return (
    <div>
      <h1 className="text-h1 font-bold">{t("title")}</h1>
      {err && <Notice tone="danger" className="mt-4">{err}</Notice>}
      <div className="mt-6 grid min-h-[60dvh] gap-4 md:grid-cols-[300px_1fr]">
        <aside className={cn("rounded-[var(--radius-lg)] glass p-2", cur && "hidden md:block")}>
          {convs.length === 0 ? (
            <div className="p-6 text-center text-ink-2">
              <p>{t("empty")}</p>
              {profile?.role === "client" && <Link href="/specialists" className="mt-4 inline-block font-semibold text-purple">{t("findCta")}</Link>}
            </div>
          ) : convs.map((c) => (
            <button key={c.id} type="button" onClick={() => { setActive(c.id); router.replace({ pathname: "/messages", query: { c: c.id } }); }}
              className={cn("flex w-full items-center gap-3 rounded-[var(--radius-md)] p-3 text-left transition-colors", c.id === active ? "bg-ink-3" : "hover:bg-ink-3/60")}>
              <Avatar name={nameOf(c)} url={avatarOf(c)} size={42} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{nameOf(c)}</span>
                <span className="text-xs text-ink-2">{df.format(new Date(c.last_message_at))}</span>
              </span>
              {isUnread(c, me) && c.id !== active && <span className="h-2.5 w-2.5 rounded-full bg-purple" aria-label={t("unread")} />}
            </button>
          ))}
        </aside>
        {cur ? (
          <Thread key={cur.id} conv={cur} me={me} name={nameOf(cur)} onBack={() => { setActive(null); router.replace("/messages"); }} onSent={loadConvs} />
        ) : (
          <div className="hidden items-center justify-center rounded-[var(--radius-lg)] glass p-10 text-ink-2 md:flex">{t("pick")}</div>
        )}
      </div>
    </div>
  );
}

function Thread({ conv, me, name, onBack, onSent }: { conv: Conversation; me: string; name: string; onBack: () => void; onSent: () => void }) {
  const t = useTranslations("chat");
  const locale = useLocale();
  const sb = getSupabase()!;
  const [msgs, setMsgs] = useState<Message[] | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const side = me === conv.client_id ? "client_read_at" : "specialist_read_at";

  const load = useCallback(async () => {
    const { data } = await sb.from("mp_messages").select("*").eq("conversation_id", conv.id).order("created_at").limit(300);
    setMsgs((prev) => {
      const next = (data as Message[]) ?? [];
      if (prev && prev.length === next.length) return prev;
      return next;
    });
  }, [sb, conv.id]);
  useEffect(() => {
    void load();
    void sb.from("mp_conversations").update({ [side]: new Date().toISOString() }).eq("id", conv.id);
    const id = setInterval(() => { if (document.visibilityState === "visible") void load(); }, 4000);
    return () => clearInterval(id);
  }, [load, sb, conv.id, side]);
  useEffect(() => { const b = boxRef.current; if (b) b.scrollTop = b.scrollHeight; }, [msgs]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim().slice(0, 2000);
    if (!body || busy) return;
    setBusy(true); setErr(null);
    const { error } = await sb.from("mp_messages").insert({ conversation_id: conv.id, sender_id: me, body });
    setBusy(false);
    if (error) { setErr(error.message.includes("too_many") ? t("tooMany") : t("error")); return; }
    setText(""); void load(); onSent(); void notifyMessage(conv.id);
  };

  const tf = new Intl.DateTimeFormat(dateLocale(locale), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const otherLink = me === conv.client_id ? { pathname: "/specialist", query: { id: conv.specialist_id } } : null;

  return (
    <section className="flex min-h-[60dvh] flex-col rounded-[var(--radius-lg)] glass">
      <header className="flex items-center gap-3 border-b border-ink-3 px-4 py-3">
        <button type="button" onClick={onBack} className="rounded-full px-2 py-1 text-xl md:hidden" aria-label={t("back")}>←</button>
        {otherLink ? <Link href={otherLink} className="font-display text-lg font-bold hover:text-purple">{name}</Link> : <span className="font-display text-lg font-bold">{name}</span>}
      </header>
      <div ref={boxRef} className="flex-1 space-y-2 overflow-y-auto overscroll-contain p-4" style={{ maxHeight: "60dvh" }}>
        {msgs === null ? <div className="flex justify-center py-10"><Spinner /></div>
          : msgs.length === 0 ? <p className="py-10 text-center text-ink-2">{t("first")}</p>
          : msgs.map((m) => (
            <div key={m.id} className={cn("max-w-[80%] whitespace-pre-line rounded-2xl px-4 py-2.5", m.sender_id === me ? "ml-auto bg-gradient-primary text-white" : "bg-ink-3")}>
              {m.body}
              <span className={cn("mt-1 block text-[10px]", m.sender_id === me ? "text-white/70" : "text-ink-2")}>{tf.format(new Date(m.created_at))}</span>
            </div>
          ))}
      </div>
      {err && <p className="px-4 text-sm text-danger">{err}</p>}
      <form onSubmit={send} className="flex gap-2 border-t border-ink-3 p-3">
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={1} maxLength={2000} placeholder={t("placeholder")} aria-label={t("placeholder")}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !("ontouchstart" in window)) { e.preventDefault(); void send(e as unknown as React.FormEvent); } }}
          className="max-h-32 min-h-11 min-w-0 flex-1 resize-none rounded-2xl bg-ink-3 px-4 py-2.5 text-base outline-none focus-visible:ring-2 focus-visible:ring-purple" />
        <button type="submit" disabled={busy || !text.trim()} className="h-11 shrink-0 self-end rounded-full bg-gradient-primary px-5 font-semibold text-white disabled:opacity-50">{t("send")}</button>
      </form>
      <p className="px-4 pb-3 text-[11px] text-ink-2">{t("safety")}</p>
    </section>
  );
}
