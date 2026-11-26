"use client";
/** Sample videos of specialists: upload limits, cover pictures (first frame) and public URLs. */
import type { SupabaseClient } from "@supabase/supabase-js";

export const VIDEO_BUCKET = "mp-offer-videos";
export const COVER_BUCKET = "mp-portfolio";
export const MAX_VIDEO_MB = 30;
export const VIDEO_TYPES = /^video\/(mp4|quicktime|webm)$/;

/** Cover picture of an uploaded video: same name, kept as a JPEG in the public portfolio bucket. */
export const posterPath = (videoPath: string) => videoPath.replace(/^([^/]+)\/(.+)\.[a-z0-9]+$/i, "$1/offer-$2.jpg");

export const videoUrls = (sb: SupabaseClient, videoPath: string) => ({
  src: sb.storage.from(VIDEO_BUCKET).getPublicUrl(videoPath).data.publicUrl,
  poster: sb.storage.from(COVER_BUCKET).getPublicUrl(posterPath(videoPath)).data.publicUrl,
});

export const videoExt = (f: File) => (f.type === "video/quicktime" ? "mov" : f.type === "video/webm" ? "webm" : "mp4");
export const videoOk = (f: File) => VIDEO_TYPES.test(f.type) && f.size <= MAX_VIDEO_MB * 1024 * 1024;

/** Takes one frame (0.5 s in) of the chosen video as a JPEG; null if the browser cannot decode it. */
export function grabPoster(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    const done = (b: Blob | null) => { URL.revokeObjectURL(url); resolve(b); };
    const timer = setTimeout(() => done(null), 10000);
    v.muted = true; v.playsInline = true; v.preload = "auto"; v.src = url;
    v.onloadeddata = () => { v.currentTime = Math.min(0.5, (v.duration || 1) / 2); };
    v.onseeked = () => {
      try {
        const w = Math.min(720, v.videoWidth || 720), h = Math.round(w * ((v.videoHeight || 1280) / (v.videoWidth || 720)));
        const c = document.createElement("canvas"); c.width = w; c.height = h;
        c.getContext("2d")!.drawImage(v, 0, 0, w, h);
        c.toBlob((b) => { clearTimeout(timer); done(b); }, "image/jpeg", 0.82);
      } catch { clearTimeout(timer); done(null); }
    };
    v.onerror = () => { clearTimeout(timer); done(null); };
  });
}

/** Uploads a video into the user's folder plus its cover picture; returns the stored path or null. */
export async function uploadVideo(sb: SupabaseClient, userId: string, file: File, prefix: string): Promise<string | null> {
  const path = `${userId}/${prefix}-${Date.now()}.${videoExt(file)}`;
  const up = await sb.storage.from(VIDEO_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (up.error) return null;
  const cover = await grabPoster(file);
  if (cover) await sb.storage.from(COVER_BUCKET).upload(posterPath(path), cover, { contentType: "image/jpeg", upsert: false });
  return path;
}

export async function removeVideo(sb: SupabaseClient, videoPath: string) {
  await sb.storage.from(VIDEO_BUCKET).remove([videoPath]);
  await sb.storage.from(COVER_BUCKET).remove([posterPath(videoPath)]);
}
