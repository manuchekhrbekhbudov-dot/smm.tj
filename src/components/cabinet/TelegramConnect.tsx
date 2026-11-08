"use client";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getSupabase } from "@/lib/supabase/client";
import { getBotUsername } from "@/lib/telegram";
import { useAuth } from "@/lib/auth";
import { userPhone } from "@/content/site";
import { TelegramCodeForm } from "@/components/auth/TelegramCodeForm";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";

/** Shows whether Telegram notifications are connected; lets the user connect them. */
export function TelegramConnect() {
  const t = useTranslations("cabinet.telegram");
  const { session } = useAuth();
  const [linked, setLinked] = useState<boolean | null>(null);
  const [available, setAvailable] = useState(false);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    const { data } = await getSupabase()!.from("mp_tg_links").select("user_id").eq("user_id", session!.user.id).maybeSingle();
    setLinked(!!data);
  }, [session]);

  useEffect(() => {
    getBotUsername().then((b) => { setAvailable(!!b); if (b) void load(); });
  }, [load]);

  if (!available || linked === null) return null;

  return (
    <section className="mt-6 rounded-[var(--radius-md)] glass glass-edge p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#229ED9] text-white"><Icon name="telegram" className="h-5 w-5" /></span>
          <div>
            <p className="font-semibold">{t("title")} {linked ? "✅" : ""}</p>
            <p className="text-sm text-ink-1">{linked ? t("on") : t("off")}</p>
          </div>
        </div>
        {!linked && !open && <Button size="sm" onClick={() => setOpen(true)}>{t("connect")}</Button>}
      </div>
      {!linked && open && (
        <div className="mt-5 max-w-md">
          <TelegramCodeForm link defaultPhone={userPhone(session!.user) ?? "+992 "} submitLabel={t("connect")} onSuccess={() => { setOpen(false); void load(); }} />
        </div>
      )}
    </section>
  );
}
