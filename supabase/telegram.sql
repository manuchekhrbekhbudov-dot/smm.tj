-- =====================================================================
-- SMM.TJ — Telegram login + notifications (run after schema.sql; safe to re-run)
-- Tables are only reachable by Edge Functions (service role); RLS has no public policies.
-- =====================================================================

-- One-time login codes sent by the bot (stored hashed, short-lived)
create table if not exists public.mp_tg_codes (
  phone text primary key,                       -- E.164 digits, e.g. 992504440101
  code_hash text not null,
  chat_id bigint not null,
  attempts int not null default 0,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
alter table public.mp_tg_codes enable row level security;

-- Which Telegram chat belongs to which account (for notifications)
create table if not exists public.mp_tg_links (
  user_id uuid primary key references auth.users(id) on delete cascade,
  chat_id bigint not null unique,
  phone text not null,
  created_at timestamptz not null default now()
);
alter table public.mp_tg_links enable row level security;
drop policy if exists mp_tg_links_own on public.mp_tg_links;
create policy mp_tg_links_own on public.mp_tg_links for select using (user_id = auth.uid());

-- Avoid double notifications
alter table public.mp_orders add column if not exists tg_notified_status text;
