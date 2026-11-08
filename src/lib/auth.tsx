"use client";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "./supabase/client";
import type { Profile } from "./supabase/types";

type AuthState = {
  ready: boolean;
  session: Session | null;
  profile: Profile | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthState>({ ready: false, session: null, profile: null, refreshProfile: async () => {}, signOut: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const loadProfile = useCallback(async (s: Session | null) => {
    const sb = getSupabase();
    if (!sb || !s) { setProfile(null); return; }
    const { data } = await sb.from("profiles").select("*").eq("id", s.user.id).maybeSingle();
    setProfile((data as Profile) ?? null);
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
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      void loadProfile(s);
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
