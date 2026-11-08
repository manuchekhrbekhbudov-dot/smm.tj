"use client";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "./supabase/client";
import type { Profile } from "./supabase/types";
import { deviceId, localBlocked, setLocalBlocked } from "./device";

type AuthState = {
  ready: boolean;
  session: Session | null;
  /** undefined = still loading, null = signed in but no profile row */
  profile: Profile | null | undefined;
  /** The account or this device was removed from the platform by the director. */
  blocked: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthState>({ ready: false, session: null, profile: undefined, blocked: false, refreshProfile: async () => {}, signOut: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [blocked, setBlocked] = useState(false);

  // Asks the database whether this device is blocked (and marks it if the signed-in account is).
  const checkDevice = useCallback(async () => {
    const sb = getSupabase();
    const d = deviceId();
    if (!sb || !d) return localBlocked();
    const { data, error } = await sb.rpc("mp_device_status", { d });
    if (error) return localBlocked();
    const b = data === "blocked";
    setLocalBlocked(b);
    return b;
  }, []);

  const loadProfile = useCallback(async (s: Session | null) => {
    const sb = getSupabase();
    if (!sb || !s) { setProfile(null); setBlocked(await checkDevice()); return; }
    const { data, error } = await sb.from("mp_profiles").select("*").eq("id", s.user.id).maybeSingle();
    const p = error ? null : ((data as Profile) ?? null);
    if (p?.blocked_at || (await checkDevice())) {
      setBlocked(true);
      setLocalBlocked(true);
      await sb.auth.signOut();
      setProfile(null); setSession(null);
      return;
    }
    setBlocked(false);
    setProfile(p);
  }, [checkDevice]);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) { setReady(true); return; }
    let alive = true;
    sb.auth.getSession().then(async ({ data }) => {
      if (!alive) return;
      setSession(data.session);
      await loadProfile(data.session);
      if (alive) setReady(true);
    });
    // Never call Supabase inside the auth callback (it can deadlock the auth lock): defer it.
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setTimeout(() => { if (alive) void loadProfile(s); }, 0);
    });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, [loadProfile]);

  const value: AuthState = {
    ready,
    session,
    profile,
    blocked,
    refreshProfile: () => loadProfile(session),
    signOut: async () => { await getSupabase()?.auth.signOut(); setProfile(null); setSession(null); },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
