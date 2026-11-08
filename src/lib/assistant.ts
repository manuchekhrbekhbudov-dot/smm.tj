"use client";
import { SUPABASE_URL } from "./supabase/config";
import { getSupabase } from "./supabase/client";

export type ChatMsg = { role: "user" | "assistant"; content: string };
export type AssistantResult = { reply?: string; error?: string };

let enabledCache: Promise<boolean> | null = null;
/** True only when the AI key is configured on the server. */
export function assistantEnabled(): Promise<boolean> {
  if (!enabledCache) {
    enabledCache = fetch(`${SUPABASE_URL}/functions/v1/assistant`)
      .then((r) => (r.ok ? r.json() : null)).then((d) => !!d?.configured).catch(() => false);
  }
  return enabledCache;
}

export async function askAssistant(messages: ChatMsg[], locale: string): Promise<AssistantResult> {
  const token = (await getSupabase()?.auth.getSession())?.data.session?.access_token;
  try {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/assistant`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ messages: messages.slice(-12), locale }),
    });
    const d = await r.json().catch(() => ({}));
    if (d.reply) return { reply: String(d.reply) };
    return { error: d.error ?? (r.status === 404 ? "not_configured" : "ai_error") };
  } catch {
    return { error: "network" };
  }
}
