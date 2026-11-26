"use client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { videoUrls } from "@/lib/video";

export type PortfolioItem = {
  id: string; specialist_id: string; image_path: string; title: string; position: number; created_at: string;
  kind: "image" | "video"; url: string; poster?: string;
};
export const PORTFOLIO_MAX = 9;
export const VIDEOS_MAX = 3;

/** Portfolio pictures and videos of a specialist (empty list if features.sql is not applied yet). */
export async function loadPortfolio(sb: SupabaseClient, specialistId: string): Promise<PortfolioItem[]> {
  const { data, error } = await sb.from("mp_portfolio_items").select("*").eq("specialist_id", specialistId).order("position").order("created_at");
  if (error || !data) return [];
  return data.map((r) => {
    const kind = (r.kind as string) === "video" ? "video" : "image";
    const base = r as Omit<PortfolioItem, "url" | "kind">;
    if (kind === "video") { const v = videoUrls(sb, r.image_path as string); return { ...base, kind, url: v.src, poster: v.poster }; }
    return { ...base, kind, url: sb.storage.from("mp-portfolio").getPublicUrl(r.image_path as string).data.publicUrl };
  });
}
