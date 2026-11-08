/**
 * Supabase project settings. The anon key is PUBLIC by design (it ships to every browser);
 * all protection comes from Row Level Security in supabase/schema.sql.
 * Set via env (NEXT_PUBLIC_*) or fill in the fallbacks below once the project exists.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
