"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Specialist } from "@/lib/supabase/types";
import { SITE_URL } from "@/lib/site-url";
import { INSTAGRAM_HANDLE } from "@/content/site";
import { Button } from "@/components/ui/Button";

const W = 1080, H = 1350;

function loadImg(src: string): Promise<HTMLImageElement | null> {
  return new Promise((res) => {
    const i = new Image(); i.crossOrigin = "anonymous";
    i.onload = () => res(i); i.onerror = () => res(null); i.src = src;
    setTimeout(() => res(null), 8000);
  });
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number, maxLines: number): string[] {
  const words = text.split(/\s+/); const lines: string[] = []; let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width > maxW && line) { lines.push(line); line = w; } else line = next;
    if (lines.length === maxLines) break;
  }
  if (line && lines.length < maxLines) lines.push(line);
  return lines;
}

/** Director: a ready Instagram picture (1080×1350) "New specialist on SMM.TJ" + caption, from REAL profile data. */
export function InstaPost({ s }: { s: Specialist }) {
  const t = useTranslations();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const make = async () => {
    setBusy(true);
    const name = s.profiles?.full_name || "—";
    const specs = s.specialties.map((x) => t(`specialties.${x}.title`));
    const city = s.profiles?.city ? t(`cities.${s.profiles.city}`) : "";
    const font = getComputedStyle(document.body).fontFamily || "sans-serif";
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const ctx = c.getContext("2d")!;
    // background
    const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, "#12061f"); g.addColorStop(1, "#2a0b4d");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(W * 0.8, H * 0.15, 0, W * 0.8, H * 0.15, 600); glow.addColorStop(0, "rgba(217,70,239,0.45)"); glow.addColorStop(1, "rgba(217,70,239,0)");
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
    // brand
    ctx.fillStyle = "#fff"; ctx.font = `800 54px ${font}`; ctx.fillText("SMM", 80, 130);
    const smmW = ctx.measureText("SMM").width; ctx.fillStyle = "#c084fc"; ctx.fillText(".TJ", 80 + smmW, 130);
    // pill
    ctx.font = `700 40px ${font}`; const pill = `✨ ${t("insta.newSpecialist")}`; const pw = ctx.measureText(pill).width + 64;
    const pg = ctx.createLinearGradient(80, 0, 80 + pw, 0); pg.addColorStop(0, "#8b5cf6"); pg.addColorStop(1, "#d946ef");
    ctx.fillStyle = pg; ctx.beginPath(); ctx.roundRect(80, 200, pw, 84, 42); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.fillText(pill, 112, 256);
    // avatar
    const cx = W / 2, cy = 520, r = 170;
    const avatar = s.profiles?.avatar_url ? await loadImg(s.profiles.avatar_url) : null;
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
    if (avatar) { const k = Math.max((2 * r) / avatar.width, (2 * r) / avatar.height); ctx.drawImage(avatar, cx - (avatar.width * k) / 2, cy - (avatar.height * k) / 2, avatar.width * k, avatar.height * k); }
    else { const ag = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r); ag.addColorStop(0, "#8b5cf6"); ag.addColorStop(1, "#d946ef"); ctx.fillStyle = ag; ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);
      ctx.fillStyle = "#fff"; ctx.font = `800 150px ${font}`; ctx.textAlign = "center"; ctx.fillText((name.match(/\p{L}/u)?.[0] ?? "S").toUpperCase(), cx, cy + 52); ctx.textAlign = "left"; }
    ctx.restore();
    ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy, r + 8, 0, Math.PI * 2); ctx.stroke();
    // name + headline
    ctx.textAlign = "center"; ctx.fillStyle = "#fff"; ctx.font = `800 76px ${font}`;
    wrap(ctx, name, W - 160, 2).forEach((l, i) => ctx.fillText(l, cx, 810 + i * 86));
    ctx.fillStyle = "rgba(255,255,255,0.78)"; ctx.font = `500 40px ${font}`;
    const nameLines = Math.min(2, wrap(ctx, name, W - 160, 2).length);
    let y = 810 + nameLines * 86 + 10;
    wrap(ctx, s.headline || "", W - 200, 2).forEach((l) => { ctx.fillText(l, cx, y); y += 52; });
    // specialties + city
    ctx.fillStyle = "#e9d5ff"; ctx.font = `700 38px ${font}`; y += 24;
    wrap(ctx, specs.join(" · "), W - 200, 2).forEach((l) => { ctx.fillText(l, cx, y); y += 50; });
    if (city) { ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.font = `500 36px ${font}`; ctx.fillText(`📍 ${city}`, cx, y + 6); }
    // footer
    ctx.fillStyle = "rgba(255,255,255,0.12)"; ctx.fillRect(80, H - 170, W - 160, 2);
    ctx.fillStyle = "#fff"; ctx.font = `700 40px ${font}`; ctx.fillText(t("insta.cta"), cx, H - 100);
    ctx.fillStyle = "#c084fc"; ctx.font = `600 34px ${font}`; ctx.fillText(`@${INSTAGRAM_HANDLE}`, cx, H - 52);
    ctx.textAlign = "left";

    const blob: Blob | null = await new Promise((res) => c.toBlob(res, "image/png"));
    if (blob) {
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
      a.download = `smmtj-new-${name.replace(/[^\p{L}\p{N}]+/gu, "-").slice(0, 30)}.png`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    }
    const caption = t("insta.caption", { name, specs: specs.join(", "), city: city || "Тоҷикистон", link: `${SITE_URL}/tg/specialist/?id=${s.id}`, handle: INSTAGRAM_HANDLE });
    try { await navigator.clipboard.writeText(caption); } catch { /* clipboard blocked: the picture is still downloaded */ }
    setBusy(false); setDone(true); setTimeout(() => setDone(false), 4000);
  };

  return <Button size="sm" variant="outline" loading={busy} onClick={make}>{done ? `✓ ${t("insta.done")}` : `📸 ${t("insta.button")}`}</Button>;
}
