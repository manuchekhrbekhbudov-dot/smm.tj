"use client";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase/client";
import { HireDecision } from "./HireDecision";

type Pending = { id: string; specialist_note: string | null; specialists: { profiles: { full_name: string } | null } | null };

/**
 * For clients: while a specialist has accepted an order and the client has not said whether they
 * hired them, other specialists are hidden — the client first answers (and gives the reason if not).
 */
export function DecisionGate({ children }: { children: ReactNode }) {
  const t = useTranslations("trust");
  const { session, profile } = useAuth();
  const [pending, setPending] = useState<Pending[] | null>(null);
  const isClient = !!session && profile?.role === "client";

  const load = useCallback(async () => {
    if (!isClient) { setPending([]); return; }
    const { data, error } = await getSupabase()!.from("mp_orders")
      .select("id, specialist_note, specialists:mp_specialists!mp_orders_specialist_id_fkey(profiles:mp_profiles!mp_specialists_id_fkey(full_name))")
      .eq("client_id", session!.user.id).eq("status", "accepted").is("hire_status", null);
    setPending(error ? [] : ((data as unknown as Pending[]) ?? []));
  }, [isClient, session]);
  useEffect(() => { void load(); }, [load]);

  if (!pending || pending.length === 0) return <>{children}</>;
  return (
    <div className="rounded-[var(--radius-lg)] glass glass-edge p-6 md:p-8">
      <h2 className="text-h3 font-bold">{t("gateTitle")}</h2>
      <p className="mt-2 text-ink-1">{t("gateText")}</p>
      {pending.map((o) => (
        <HireDecision key={o.id} orderId={o.id} name={o.specialists?.profiles?.full_name || "—"} note={o.specialist_note} onDone={load} />
      ))}
    </div>
  );
}
