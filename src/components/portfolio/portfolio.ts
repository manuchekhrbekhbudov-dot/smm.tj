"use client";
import type { SupabaseClient } from "@supabase/supabase-js";

export type PortfolioItem = { id: string; specialist_id: string; image_path: string; title: string; position: number; created_at: string; url: string };
export const PORTFOLIO_MAX = 9;

/** Portfolio images of a specialist (empty list if features.sql is not applied yet). */
export async function loadPortfolio(sb: SupabaseClient, specialistId: string): Promise<PortfolioItem[]> {
  const { data, error } = await sb.from("mp_portfolio_items").select("*").eq("specialist_id", specialistId).order("position").order("created_at");
  if (error || !data) return [];
  return data.map((r) => ({ ...(r as Omit<PortfolioItem, "url">), url: sb.storage.from("mp-portfolio").getPublicUrl(r.image_path as string).data.publicUrl }));
}
