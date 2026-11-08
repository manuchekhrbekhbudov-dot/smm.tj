"use client";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "./supabase/client";
import type { Profile } from "./supabase/types";

type AuthState = {
  ready: boolean;
  session: Session | null;
  /** undefined = still loading, null = signed in but no profile row */
  profile: Profile | null | undefined;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthState>({ ready: false, session: null, profile: undefined, refreshProfile: async () => {}, signOut: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);

  const loadProfile = useCallback(async (s: Session | null) => {
    const sb = getSupabase();
    if (!sb || !s) { setProfile(null); return; }
    const { data, error } = await sb.from("mp_profiles").select("*").eq("id", s.user.id).maybeSingle();
    setProfile(error ? null : ((data as Profile) ?? null));
  }, []);

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
    refreshProfile: () => loadProfile(session),
    signOut: async () => { await getSupabase()?.auth.signOut(); setProfile(null); setSession(null); },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
