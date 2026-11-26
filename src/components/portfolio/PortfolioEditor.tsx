"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { getSupabase } from "@/lib/supabase/client";
import { toJpeg } from "@/lib/image";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Notice, Skeleton } from "@/components/ui/Notice";
import { loadPortfolio, PORTFOLIO_MAX, VIDEOS_MAX, type PortfolioItem } from "./portfolio";
import { MAX_VIDEO_MB, removeVideo, uploadVideo, videoOk } from "@/lib/video";

/** Specialist cabinet: up to 3 videos and 9 pictures of their own work, each with a short caption. */
export function PortfolioEditor({ userId }: { userId: string }) {
  const t = useTranslations("portfolio");
  const sb = getSupabase()!;
  const [items, setItems] = useState<PortfolioItem[] | null>(null);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const [vTitle, setVTitle] = useState("");

  const load = useCallback(async () => setItems(await loadPortfolio(sb, userId)), [sb, userId]);
  useEffect(() => { void load(); }, [load]);

  const images = (items ?? []).filter((x) => x.kind === "image");
  const videos = (items ?? []).filter((x) => x.kind === "video");

  const uploadVid = async (file: File) => {
    if (!videoOk(file)) { setErr(t("badVideo", { mb: MAX_VIDEO_MB })); return; }
    setBusy(true); setErr(null);
    try {
      const path = await uploadVideo(sb, userId, file, "work");
      if (!path) { setErr(t("uploadError")); return; }
      const ins = await sb.from("mp_portfolio_items").insert({ specialist_id: userId, image_path: path, title: vTitle.trim().slice(0, 120), position: videos.length, kind: "video" });
      if (ins.error) { await removeVideo(sb, path); setErr(ins.error.message.includes("videos_full") ? t("videosFull", { n: VIDEOS_MAX }) : t("notReady")); return; }
      setVTitle("");
      await load();
    } finally { setBusy(false); }
  };

  const upload = async (files: FileList) => {
    setBusy(true); setErr(null);
    try {
      let count = images.length;
      for (const f of Array.from(files)) {
        if (count >= PORTFOLIO_MAX) { setErr(t("full", { n: PORTFOLIO_MAX })); break; }
        let blob: Blob;
        try { blob = await toJpeg(f, 1600, 0.86); } catch { setErr(t("badImage")); continue; }
        const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`;
        const up = await sb.storage.from("mp-portfolio").upload(path, blob, { contentType: "image/jpeg" });
        if (up.error) { setErr(t("uploadError")); break; }
        const ins = await sb.from("mp_portfolio_items").insert({ specialist_id: userId, image_path: path, title: title.trim().slice(0, 120), position: count });
        if (ins.error) { await sb.storage.from("mp-portfolio").remove([path]); setErr(ins.error.message.includes("portfolio_full") ? t("full", { n: PORTFOLIO_MAX }) : t("notReady")); break; }
        count++;
      }
      setTitle("");
      await load();
    } finally { setBusy(false); }
  };

  const remove = async (it: PortfolioItem) => {
    setBusy(true);
    await sb.from("mp_portfolio_items").delete().eq("id", it.id);
    if (it.kind === "video") await removeVideo(sb, it.image_path);
    else await sb.storage.from("mp-portfolio").remove([it.image_path]);
    setBusy(false); void load();
  };

  if (items === null) return <Skeleton className="h-60" />;
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-h2 font-bold">{t("title")}</h2>
        <p className="mt-2 max-w-2xl text-ink-1">{t("lead", { n: PORTFOLIO_MAX })}</p>
      </div>
      <section className="space-y-3 rounded-[var(--radius-lg)] border border-purple/30 p-5">
        <h3 className="font-display text-lg font-bold">🎥 {t("videosTitle", { n: videos.length, max: VIDEOS_MAX })}</h3>
        <p className="text-sm text-ink-1">{t("videosLead", { mb: MAX_VIDEO_MB })}</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {videos.map((it) => (
            <figure key={it.id} className="relative overflow-hidden rounded-[var(--radius-md)] bg-ink-3">
              <video src={`${it.url}#t=0.3`} poster={it.poster} controls playsInline preload="metadata" className="aspect-[9/16] w-full bg-ink-3 object-cover" />
              {it.title && <figcaption className="p-2 text-sm">{it.title}</figcaption>}
              <button type="button" onClick={() => remove(it)} disabled={busy} aria-label={t("remove")}
                className="absolute right-2 top-2 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white">✕ {t("remove")}</button>
            </figure>
          ))}
        </div>
        {videos.length === 0 && <p className="rounded-[var(--radius-md)] bg-warning/10 p-3 text-sm font-semibold text-warning">{t("videoRequired")}</p>}
        {videos.length < VIDEOS_MAX && (
          <div className="flex flex-wrap items-end gap-3">
            <Input className="min-w-[220px] flex-1" label={t("caption")} value={vTitle} maxLength={120} onChange={(e) => setVTitle(e.target.value)} />
            <input ref={videoRef} type="file" accept="video/mp4,video/quicktime,video/webm" className="sr-only" disabled={busy}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadVid(f); e.target.value = ""; }} />
            <Button onClick={() => videoRef.current?.click()} loading={busy}>🎥 {t("addVideo")} ({videos.length}/{VIDEOS_MAX})</Button>
          </div>
        )}
      </section>
      <h3 className="font-display text-lg font-bold">🖼️ {t("imagesTitle", { n: images.length, max: PORTFOLIO_MAX })}</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((it) => (
          <figure key={it.id} className="group relative overflow-hidden rounded-[var(--radius-md)] bg-ink-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={it.url} alt={it.title || t("work")} className="aspect-square w-full object-cover" loading="lazy" />
            {it.title && <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 p-3 text-sm text-white">{it.title}</figcaption>}
            <button type="button" onClick={() => remove(it)} disabled={busy} aria-label={t("remove")}
              className="absolute right-2 top-2 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white">✕ {t("remove")}</button>
          </figure>
        ))}
        {images.length === 0 && <p className="col-span-full rounded-[var(--radius-md)] glass p-8 text-center text-ink-2">{t("empty")}</p>}
      </div>
      {images.length < PORTFOLIO_MAX && (
        <div className="flex flex-wrap items-end gap-3 rounded-[var(--radius-lg)] glass glass-edge p-5">
          <Input className="min-w-[220px] flex-1" label={t("caption")} value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} />
          <input ref={fileRef} type="file" accept="image/*" multiple className="sr-only" disabled={busy}
            onChange={(e) => { if (e.target.files?.length) void upload(e.target.files); e.target.value = ""; }} />
          <Button onClick={() => fileRef.current?.click()} loading={busy}>{t("add")} ({images.length}/{PORTFOLIO_MAX})</Button>
        </div>
      )}
      {err && <Notice tone="danger">{err}</Notice>}
      <p className="text-xs text-ink-2">{t("rules")}</p>
    </div>
  );
}
