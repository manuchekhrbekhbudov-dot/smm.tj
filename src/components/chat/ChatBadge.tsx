"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase/client";
import { isUnread, type Conversation } from "@/lib/chat";
import { cn } from "@/lib/cn";

/** Header link to the inbox with an unread counter (checked every 30 s). */
export function ChatBadge({ className }: { className?: string }) {
  const t = useTranslations("chat");
  const { session, profile } = useAuth();
  const [n, setN] = useState(0);
  const me = profile?.id;
  useEffect(() => {
    if (!session || !me || profile?.role === "admin") return;
    const sb = getSupabase()!;
    const tick = async () => {
      const { data, error } = await sb.from("mp_conversations").select("id, client_id, specialist_id, last_message_at, client_read_at, specialist_read_at").limit(100);
      if (!error) setN(((data as Conversation[]) ?? []).filter((c) => isUnread(c, me)).length);
    };
    void tick();
    const id = setInterval(() => { if (document.visibilityState === "visible") void tick(); }, 30000);
    return () => clearInterval(id);
  }, [session, me, profile?.role]);
  if (!session || !profile || profile.role === "admin") return null;
  return (
    <Link href="/messages" aria-label={n ? t("unreadCount", { n }) : t("title")}
      className={cn("relative flex h-10 w-10 items-center justify-center rounded-full glass text-lg hover:glow-sm", className)}>
      <span aria-hidden>💬</span>
      {n > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[11px] font-bold text-white">{n}</span>}
    </Link>
  );
}
