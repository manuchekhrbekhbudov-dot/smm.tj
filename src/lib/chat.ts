"use client";
import { getSupabase } from "./supabase/client";
import { SUPABASE_URL } from "./supabase/config";

export type Conversation = {
  id: string; client_id: string; specialist_id: string; last_message_at: string;
  client_read_at: string | null; specialist_read_at: string | null;
  client?: { full_name: string; avatar_url: string | null } | null;
  specialist?: { profiles: { full_name: string; avatar_url: string | null } | null } | null;
};
export type Message = { id: string; conversation_id: string; sender_id: string; body: string; created_at: string };

export const CONV_SELECT =
  "*, client:mp_profiles!mp_conversations_client_id_fkey(full_name, avatar_url), specialist:mp_specialists!mp_conversations_specialist_id_fkey(profiles:mp_profiles!mp_specialists_id_fkey(full_name, avatar_url))";

export const isUnread = (c: Conversation, me: string) => {
  const read = me === c.client_id ? c.client_read_at : c.specialist_read_at;
  return !read || new Date(c.last_message_at).getTime() > new Date(read).getTime() + 1000;
};

/** Opens (or creates) the client's conversation with a specialist; returns its id. */
export async function startConversation(me: string, specialistId: string): Promise<{ id?: string; error?: string }> {
  const sb = getSupabase(); if (!sb) return { error: "config" };
  const found = await sb.from("mp_conversations").select("id").eq("client_id", me).eq("specialist_id", specialistId).maybeSingle();
  if (found.data?.id) return { id: found.data.id };
  const made = await sb.from("mp_conversations").insert({ client_id: me, specialist_id: specialistId }).select("id").single();
  if (made.error) return { error: made.error.message };
  return { id: made.data.id };
}

/** Telegram ping to the other side (the server throttles it, so it never spams). */
export async function notifyMessage(conversationId: string) {
  const token = (await getSupabase()?.auth.getSession())?.data.session?.access_token;
  if (!token) return;
  fetch(`${SUPABASE_URL}/functions/v1/tg-notify`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ conversation_id: conversationId }) }).catch(() => {});
}
