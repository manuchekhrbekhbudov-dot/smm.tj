/**
 * Supabase project settings. The publishable (anon) key is PUBLIC by design — it ships to every
 * browser; all protection comes from Row Level Security in supabase/schema.sql.
 * Never put the secret / service_role key here.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://lcldaingzicxbottlznq.supabase.co";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "sb_publishable_9iejRbnX7_oQ1BR5T3ZoUQ_zYez8cIt";
export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
