"use client";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase/client";
import { formatTjs, normalizeTjPhone, userPhone } from "@/content/site";
import { looksLikeGibberish } from "@/lib/quality";
import { notifyOrder, notifyRequest } from "@/lib/telegram";
import { Input, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Stars } from "@/components/ui/Stars";
import { Notice, Skeleton } from "@/components/ui/Notice";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { MAX_VIDEO_MB, removeVideo, uploadVideo, videoOk, videoUrls } from "@/lib/video";
import { DecisionGate } from "@/components/trust/DecisionGate";
import { ago, type Req } from "./RequestsBoard";

type Offer = {
  id: string; request_id: string; specialist_id: string; price_tjs: number | null; days: number | null; message: string;
  posts: number | null; stories: number | null; reels: number | null; sales_videos: number | null;
  video_path: string | null; video_url: string | null;
  status: "sent" | "chosen" | "declined"; created_at: string;
  specialist?: { rating_avg: number; reviews_count: number; verified_at?: string | null; profiles: { full_name: string; avatar_url: string | null; city: string | null } | null } | null;
};

const COUNTS = ["posts", "stories", "reels", "sales_videos"] as const;
const ICON: Record<(typeof COUNTS)[number], string> = { posts: "📝", stories: "📲", reels: "🎬", sales_videos: "🛒" };

/** "12 пост · 20 история · 4 Reels · 2 видеои фурӯш" */
function Package({ o }: { o: Pick<Offer, (typeof COUNTS)[number]> }) {
  const t = useTranslations("requests");
  const parts = COUNTS.filter((k) => (o[k] ?? 0) > 0).map((k) => `${ICON[k]} ${o[k]} ${t(`pkg.${k}`)}`);
  if (!parts.length) return null;
  return <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm">{parts.map((x) => <span key={x}>{x}</span>)}</p>;
}

/** The specialist's sample video: played right on the page when uploaded (with its cover picture), otherwise a link. */
function SampleVideo({ o }: { o: Pick<Offer, "video_path" | "video_url"> }) {
  const t = useTranslations("requests");
  const sb = getSupabase();
  if (o.video_path && sb) {
    const { src, poster } = videoUrls(sb, o.video_path);
    // poster = cover picture; "#t=0.3" = fallback so browsers show a frame instead of a black box
    return <video src={`${src}#t=0.3`} poster={poster} controls playsInline preload="metadata" className="mt-3 max-h-[420px] w-full rounded-[var(--radius-md)] bg-ink-3 object-contain" aria-label={t("sampleVideo")} />;
  }
  if (o.video_url) return <a href={o.video_url} target="_blank" rel="noopener noreferrer nofollow" className="mt-3 inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-sm font-semibold text-purple">▶ {t("watchVideo")}</a>;
  return null;
}

export function RequestDetail() {
  const t = useTranslations();
  const id = useSearchParams().get("id") ?? "";
  const { session, profile } = useAuth();
  const [r, setR] = useState<Req | null | undefined>(undefined);
  const [offers, setOffers] = useState<Offer[]>([]);
  const me = session?.user.id;

  const load = useCallback(async () => {
    const sb = getSupabase();
    if (!sb || !/^[0-9a-f-]{36}$/i.test(id)) { setR(null); return; }
    const { data } = await sb.from("mp_requests").select("*").eq("id", id).maybeSingle();
    setR((data as Req) ?? null);
    if (data && me) {
      const { data: o } = await sb.from("mp_request_offers")
        .select("*, specialist:mp_specialists!mp_request_offers_specialist_id_fkey(rating_avg, reviews_count, profiles:mp_profiles!mp_specialists_id_fkey(full_name, avatar_url, city))")
        .eq("request_id", id).order("created_at");
      let list = (o as unknown as Offer[]) ?? [];
      // the director's "checked" badge, loaded separately so the page also works without it
      const ids = list.map((x) => x.specialist_id);
      if (ids.length) {
        const { data: v } = await sb.from("mp_specialists").select("id, verified_at").in("id", ids);
        const m = new Map((v ?? []).map((x) => [x.id as string, x.verified_at as string | null]));
        list = list.map((x) => (x.specialist ? { ...x, specialist: { ...x.specialist, verified_at: m.get(x.specialist_id) ?? null } } : x));
      }
      setOffers(list);
    }
  }, [id, me]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (r?.title) document.title = `${r.title} · SMM.TJ`; }, [r]);

  if (r === undefined) return <Skeleton className="h-96" />;
  if (r === null) return <Notice tone="warning">{t("requests.notFound")} <Link href="/requests" className="font-semibold underline">{t("requests.back")}</Link></Notice>;

  const owner = me === r.client_id;
  const isAdmin = profile?.role === "admin";
  const mine = offers.find((o) => o.specialist_id === me);

  const setStatus = async (status: "closed" | "hidden" | "open") => {
    const { error } = await getSupabase()!.from("mp_requests").update({ status }).eq("id", r.id);
    if (!error) void load();
  };

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1.4fr_1fr] [&>*]:min-w-0">
      <article className="rounded-[var(--radius-lg)] glass p-6 md:p-8">
        <Link href="/requests" className="text-sm font-semibold text-purple">← {t("requests.back")}</Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-h2 font-bold [overflow-wrap:anywhere]">{r.title}</h1>
          {r.status !== "open" && <Badge tone="neutral">{t(`requests.status.${r.status}`)}</Badge>}
        </div>
        <p className="mt-2 text-2xl font-bold text-purple">{r.budget_tjs ? `${formatTjs(r.budget_tjs)} TJS` : t("requests.byAgreement")}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">{r.specialties.map((s) => <Badge key={s} tone="neutral">{t(`specialties.${s}.title`)}</Badge>)}</div>
        <p className="mt-5 whitespace-pre-line text-ink-1 [overflow-wrap:anywhere]">{r.description}</p>
        <p className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-2">
          {r.city && <span>📍 {t(`cities.${r.city}`)}</span>}
          <span>💼 {t("requests.offersCount", { count: r.offers_count })}</span>
          <span>{ago(r.created_at, t)}</span>
        </p>
        {owner && r.status === "open" && (
          <Button variant="outline" size="sm" className="mt-6" onClick={() => { if (confirm(t("requests.closeConfirm"))) void setStatus("closed"); }}>{t("requests.close")}</Button>
        )}
        {isAdmin && (
          <Button variant="outline" size="sm" className="ml-2 mt-6" onClick={() => setStatus(r.status === "hidden" ? "open" : "hidden")}>{r.status === "hidden" ? t("requests.unhide") : t("requests.hide")}</Button>
        )}
      </article>

      <aside className="space-y-4">
        {owner || isAdmin ? <OffersList r={r} offers={offers} onChange={load} owner={owner} />
          : mine ? <MyOffer o={mine} />
          : r.status !== "open" ? <Notice>{t("requests.closedForOffers")}</Notice>
          : <OfferForm r={r} onSent={load} />}
      </aside>
    </div>
  );
}

function OfferForm({ r, onSent }: { r: Req; onSent: () => void }) {
  const t = useTranslations();
  const { session, profile } = useAuth();
  const [f, setF] = useState({ price: r.budget_tjs ? String(r.budget_tjs) : "", days: "", message: "", posts: "", stories: "", reels: "", sales_videos: "", videoUrl: "" });
  const [file, setFile] = useState<File | null>(null);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [fail, setFail] = useState<string | null>(null);

  if (!session) {
    return (
      <div className="rounded-[var(--radius-lg)] glass p-6">
        <h2 className="text-h3 font-bold">{t("requests.offerTitle")}</h2>
        <p className="mt-2 text-sm text-ink-1">{t("requests.offerLogin")}</p>
        <Link href={{ pathname: "/login", query: { role: "specialist", next: `/request?id=${r.id}` } }} className="mt-4 inline-block rounded-full bg-gradient-primary px-5 py-2.5 font-semibold text-white">{t("common.login")}</Link>
      </div>
    );
  }
  if (profile?.role !== "specialist") return <Notice>{t("requests.onlySpecialistsOffer")}</Notice>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const e2: Record<string, string> = {};
    const message = f.message.trim();
    if (message.length < 10) e2.message = t("requests.errors.message");
    else if (looksLikeGibberish(message)) e2.message = t("quality.gibberish");
    const price = Math.round(Number(f.price.replace(/\s/g, "")));
    if (!(price > 0 && price <= 10_000_000)) e2.price = t("requests.errors.price");
    const counts: Record<string, number | null> = {};
    for (const k of COUNTS) {
      const v = f[k].trim() ? Math.round(Number(f[k])) : null;
      if (v !== null && !(v >= 0 && v <= 1000)) e2[k] = t("requests.errors.count");
      counts[k] = v;
    }
    const videoUrl = f.videoUrl.trim();
    if (!file && !videoUrl) e2.video = t("requests.errors.video");
    else if (!file && !/^https?:\/\/\S+\.\S+/.test(videoUrl)) e2.video = t("requests.errors.videoUrl");
    if (file && !videoOk(file)) e2.video = t("requests.errors.videoFile", { mb: MAX_VIDEO_MB });
    const days = f.days ? Math.round(Number(f.days)) : null;
    if (f.days && !(days && days >= 1 && days <= 365)) e2.days = t("requests.errors.days");
    setErrs(e2);
    if (Object.keys(e2).length) return;
    setBusy(true); setFail(null);
    const sb = getSupabase()!;
    let video_path: string | null = null;
    if (file) {
      // the video + its cover picture, so the client sees the content before pressing play
      video_path = await uploadVideo(sb, session.user.id, file, r.id);
      if (!video_path) { setBusy(false); setFail(t("requests.errors.upload")); return; }
    }
    const { data, error } = await sb.from("mp_request_offers")
      .insert({ request_id: r.id, specialist_id: session.user.id, price_tjs: price, days, ...counts, video_path, video_url: video_path ? null : videoUrl, message: message.slice(0, 1000) }).select("id").single();
    setBusy(false);
    if (error && video_path) void removeVideo(sb, video_path);
    if (error) {
      const known = ["only_approved_specialists", "request_closed", "too_many_offers_today"].find((k) => error.message.includes(k));
      setFail(t(`requests.errors.${known ?? (error.message.includes("duplicate") ? "already" : "generic")}`)); return;
    }
    void notifyRequest({ offer_id: data.id });
    onSent();
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4 rounded-[var(--radius-lg)] glass p-6">
      <h2 className="text-h3 font-bold">{t("requests.offerTitle")}</h2>
      <p className="text-sm text-ink-1">{t("requests.offerHint")}</p>
      <div className="grid grid-cols-2 gap-3">
        <Input label={`${t("requests.yourPrice")} *`} inputMode="numeric" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} error={errs.price} />
        <Input label={t("requests.days")} inputMode="numeric" value={f.days} onChange={(e) => setF({ ...f, days: e.target.value })} error={errs.days} />
      </div>
      <fieldset>
        <legend className="text-sm font-semibold">{t("requests.pkgTitle")}</legend>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {COUNTS.map((k) => (
            <Input key={k} label={`${ICON[k]} ${t(`requests.pkg.${k}`)}`} inputMode="numeric" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} error={errs[k]} />
          ))}
        </div>
      </fieldset>
      <fieldset className="rounded-[var(--radius-md)] border border-purple/30 p-4">
        <legend className="px-1 text-sm font-semibold">🎥 {t("requests.videoTitle")} *</legend>
        <p className="text-xs text-ink-2">{t("requests.videoHint", { mb: MAX_VIDEO_MB })}</p>
        <input type="file" accept="video/mp4,video/quicktime,video/webm" className="mt-3 block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-gradient-primary file:px-4 file:py-2 file:font-semibold file:text-white"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)} aria-label={t("requests.videoTitle")} />
        {file && <p className="mt-2 text-xs text-ink-1">✓ {file.name} · {(file.size / 1048576).toFixed(1)} MB</p>}
        {!file && (
          <Input className="mt-3" label={t("requests.videoUrl")} placeholder="https://www.instagram.com/reel/…" value={f.videoUrl} onChange={(e) => setF({ ...f, videoUrl: e.target.value })} />
        )}
        {errs.video && <p className="mt-2 text-sm text-danger">{errs.video}</p>}
      </fieldset>
      <Textarea label={t("requests.offerMessage")} placeholder={t("requests.offerMessagePh")} rows={5} maxLength={1000} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} error={errs.message} />
      {fail && <Notice tone="danger">{fail}</Notice>}
      <Button type="submit" loading={busy} className="w-full">{t("requests.sendOffer")}</Button>
    </form>
  );
}

function MyOffer({ o }: { o: Offer }) {
  const t = useTranslations();
  return (
    <div className="rounded-[var(--radius-lg)] glass p-6">
      <h2 className="text-h3 font-bold">{t("requests.yourOffer")}</h2>
      <Badge className="mt-2" tone={o.status === "chosen" ? "success" : o.status === "declined" ? "neutral" : "purple"}>{t(`requests.myOffer.${o.status}`)}</Badge>
      <p className="mt-3 text-sm text-ink-1">{[o.price_tjs ? `${formatTjs(o.price_tjs)} TJS` : null, o.days ? t("requests.daysN", { n: o.days }) : null].filter(Boolean).join(" · ")}</p>
      <Package o={o} />
      <p className="mt-2 whitespace-pre-line text-sm [overflow-wrap:anywhere]">{o.message}</p>
      <SampleVideo o={o} />
      {o.status === "chosen" && <Link href={{ pathname: "/cabinet", query: { tab: "incoming" } }} className="mt-4 inline-block font-semibold text-purple underline">{t("requests.goOrders")}</Link>}
    </div>
  );
}

function OffersList({ r, offers, onChange, owner }: { r: Req; offers: Offer[]; onChange: () => void; owner: boolean }) {
  const t = useTranslations();
  const router = useRouter();
  const { session } = useAuth();
  const [phone, setPhone] = useState(session ? userPhone(session.user) ?? "" : "");
  const [busy, setBusy] = useState<string | null>(null);
  const [fail, setFail] = useState<string | null>(null);
  const [decision, setDecision] = useState(false);

  const choose = async (o: Offer) => {
    const p = normalizeTjPhone(phone);
    if (!p) { setFail(t("order.errors.phone")); return; }
    if (!confirm(t("requests.chooseConfirm", { name: o.specialist?.profiles?.full_name || "—" }))) return;
    setBusy(o.id); setFail(null);
    const { data, error } = await getSupabase()!.rpc("mp_choose_offer", { p_offer: o.id, p_phone: p });
    setBusy(null);
    if (error) {
      if (error.message.includes("decision_required")) { setDecision(true); return; }
      setFail(t(`requests.errors.${error.message.includes("request_closed") ? "request_closed" : "generic"}`)); return;
    }
    if (data) void notifyOrder(data as string);
    onChange();
    // straight into the chat with the chosen specialist
    const { data: conv } = await getSupabase()!.from("mp_conversations").select("id").eq("client_id", r.client_id).eq("specialist_id", o.specialist_id).maybeSingle();
    router.push(conv?.id ? { pathname: "/messages", query: { c: conv.id } } : { pathname: "/messages" });
  };

  if (decision) return <DecisionGate><Notice>{t("trust.decisionDone")}</Notice></DecisionGate>;

  return (
    <div className="rounded-[var(--radius-lg)] glass p-6">
      <h2 className="text-h3 font-bold">{t("requests.offersTitle", { count: offers.length })}</h2>
      {offers.length === 0 ? <p className="mt-3 text-sm text-ink-1">{t("requests.noOffersYet")}</p> : (
        <>
          {owner && r.status === "open" && (
            <div className="mt-4">
              <Input label={t("order.phone")} type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} hint={t("requests.phoneHint")} />
            </div>
          )}
          {fail && <Notice tone="danger" className="mt-3">{fail}</Notice>}
          <ul className="mt-4 space-y-4">
            {offers.map((o) => {
              const name = o.specialist?.profiles?.full_name || "—";
              return (
                <li key={o.id} className="rounded-[var(--radius-md)] border border-ink-3 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={name} url={o.specialist?.profiles?.avatar_url} size={44} />
                    <div className="min-w-0 flex-1">
                      <Link href={{ pathname: "/specialist", query: { id: o.specialist_id } }} className="font-semibold hover:text-purple">{name}</Link>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-ink-2">
                        {o.specialist && o.specialist.reviews_count > 0 ? <><Stars value={Number(o.specialist.rating_avg)} size={12} /> ({o.specialist.reviews_count})</> : <span>{t("specialist.newcomer")}</span>}
                        <VerifiedBadge at={o.specialist?.verified_at} />
                      </div>
                    </div>
                    {o.status !== "sent" && <Badge tone={o.status === "chosen" ? "success" : "neutral"}>{t(`requests.offerStatus.${o.status}`)}</Badge>}
                  </div>
                  <p className="mt-3 font-semibold">{[o.price_tjs ? `${formatTjs(o.price_tjs)} TJS` : t("requests.byAgreement"), o.days ? t("requests.daysN", { n: o.days }) : null].filter(Boolean).join(" · ")}</p>
                  <Package o={o} />
                  <p className="mt-2 whitespace-pre-line text-sm text-ink-1 [overflow-wrap:anywhere]">{o.message}</p>
                  <SampleVideo o={o} />
                  {owner && r.status === "open" && (
                    <Button size="sm" className="mt-3" loading={busy === o.id} disabled={!!busy} onClick={() => choose(o)}>{t("requests.choose")}</Button>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
