-- =====================================================================
-- SMM.TJ — finance book, referrals, profile views, "verified" badge
-- Run AFTER schema / plans / trust / stats / features. Safe to re-run.
-- =====================================================================

-- ---------- 1. Finance book (director only) ----------
-- Plan payments approved on the site are counted automatically (mp_payments);
-- here the director adds everything else: expenses (ads, domain, …) and other income.
create table if not exists public.mp_finance_entries (
  id uuid primary key default gen_random_uuid(),
  day date not null default (now() at time zone 'Asia/Dushanbe')::date,
  kind text not null check (kind in ('expense', 'income')),
  category text not null default 'other' check (category in ('ads', 'domain', 'services', 'salary', 'prizes', 'other')),
  amount_tjs numeric(12,2) not null check (amount_tjs > 0 and amount_tjs <= 10000000),
  note text not null default '' check (char_length(note) <= 300),
  created_at timestamptz not null default now()
);
create index if not exists mp_finance_day_idx on public.mp_finance_entries(day);
alter table public.mp_finance_entries enable row level security;
drop policy if exists mp_finance_admin on public.mp_finance_entries;
create policy mp_finance_admin on public.mp_finance_entries for all to authenticated
  using (public.mp_is_admin()) with check (public.mp_is_admin());

-- ---------- 2. New columns on specialists ----------
alter table public.mp_specialists add column if not exists referred_by uuid references public.mp_specialists(id) on delete set null;
alter table public.mp_specialists add column if not exists referral_rewarded_at timestamptz;
alter table public.mp_specialists add column if not exists verified_at timestamptz;

-- Only the director (verified badge), the server and internal triggers may touch these.
create or replace function public.mp_guard_growth() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(current_setting('app.internal', true), '') = '1' or public.mp_is_admin()
     or coalesce(auth.role(), '') = 'service_role' then return new; end if;
  if tg_op = 'INSERT' then
    new.referred_by := null; new.referral_rewarded_at := null; new.verified_at := null;
  else
    new.referred_by := old.referred_by; new.referral_rewarded_at := old.referral_rewarded_at;
    new.verified_at := old.verified_at;
  end if;
  return new;
end $$;
drop trigger if exists mp_guard_growth on public.mp_specialists;
create trigger mp_guard_growth before insert or update on public.mp_specialists
  for each row execute function public.mp_guard_growth();

-- ---------- 3. Referrals: "invite a colleague" ----------
-- A new specialist who opened the site with ?ref=<specialist id> records who invited them.
-- Allowed once, before approval, never yourself, only an approved (not removed) inviter.
create or replace function public.mp_claim_referral(p_ref uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); n int;
begin
  if me is null or p_ref is null or p_ref = me then return false; end if;
  if not exists (select 1 from public.mp_specialists where id = p_ref and status = 'approved' and banned_at is null) then return false; end if;
  perform set_config('app.internal', '1', true);
  update public.mp_specialists set referred_by = p_ref
   where id = me and referred_by is null and status <> 'approved' and referral_rewarded_at is null;
  get diagnostics n = row_count;
  perform set_config('app.internal', '', true);
  return n > 0;
end $$;
grant execute on function public.mp_claim_referral(uuid) to authenticated;

-- +N days of "Top" (or +N days to the plan that is already active).
create or replace function public.mp_extend_plan(sid uuid, days int) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.mp_specialists set
    plan = case when plan is not null and plan_until > now() then plan else 'top' end,
    plan_until = case when plan is not null and plan_until > now() then plan_until else now() end + make_interval(days => days)
  where id = sid;
end $$;
revoke all on function public.mp_extend_plan(uuid, int) from public, anon, authenticated;

-- When the director approves an invited specialist: 7 days of "Top" for both
-- (the inviter at most 10 times per 30 days).
create or replace function public.mp_referral_reward() returns trigger
language plpgsql security definer set search_path = public as $$
declare prev text := coalesce(current_setting('app.internal', true), '');
begin
  if new.status = 'approved' and old.status is distinct from 'approved'
     and new.referred_by is not null and new.referral_rewarded_at is null and new.banned_at is null then
    perform set_config('app.internal', '1', true);
    update public.mp_specialists set referral_rewarded_at = now() where id = new.id;
    perform public.mp_extend_plan(new.id, 7);
    if exists (select 1 from public.mp_specialists where id = new.referred_by and status = 'approved' and banned_at is null)
       and (select count(*) from public.mp_specialists
             where referred_by = new.referred_by and referral_rewarded_at > now() - interval '30 days') <= 10 then
      perform public.mp_extend_plan(new.referred_by, 7);
    end if;
    perform set_config('app.internal', prev, true);
  end if;
  return null;
end $$;
drop trigger if exists mp_referral_reward on public.mp_specialists;
create trigger mp_referral_reward after update on public.mp_specialists
  for each row execute function public.mp_referral_reward();

-- The inviter sees how many colleagues they brought (no names of people still under review).
create or replace function public.mp_my_referrals() returns table (invited int, approved int)
language sql stable security definer set search_path = public as $$
  select count(*)::int, count(*) filter (where referral_rewarded_at is not null)::int
    from public.mp_specialists where referred_by = auth.uid();
$$;
grant execute on function public.mp_my_referrals() to authenticated;

-- ---------- 4. Profile views (real numbers for the specialist) ----------
create table if not exists public.mp_profile_views (
  id bigint generated always as identity primary key,
  specialist_id uuid not null references public.mp_specialists(id) on delete cascade,
  day date not null default (now() at time zone 'Asia/Dushanbe')::date,
  created_at timestamptz not null default now()
);
create index if not exists mp_profile_views_idx on public.mp_profile_views(specialist_id, day);
alter table public.mp_profile_views enable row level security;
drop policy if exists mp_profile_views_select on public.mp_profile_views;
create policy mp_profile_views_select on public.mp_profile_views for select
  using (specialist_id = auth.uid() or public.mp_is_admin());

-- Called by the profile page (once per visitor per profile per day — the page remembers it).
-- The specialist's own visits and the director's do not count.
create or replace function public.mp_track_view(p_specialist uuid) returns void
language sql security definer set search_path = public as $$
  insert into public.mp_profile_views(specialist_id)
  select p_specialist
   where exists (select 1 from public.mp_specialists where id = p_specialist and status = 'approved')
     and auth.uid() is distinct from p_specialist
     and not public.mp_is_admin()
     and (select count(*) from public.mp_profile_views where created_at > now() - interval '1 minute') < 300;
$$;
grant execute on function public.mp_track_view(uuid) to anon, authenticated;

create or replace function public.mp_my_views() returns jsonb
language sql stable security definer set search_path = public as $$
  with v as (select day from public.mp_profile_views where specialist_id = auth.uid()),
       today as (select (now() at time zone 'Asia/Dushanbe')::date d)
  select jsonb_build_object(
    'today', (select count(*) from v, today where v.day = today.d),
    'week', (select count(*) from v, today where v.day > today.d - 7),
    'prev_week', (select count(*) from v, today where v.day <= today.d - 7 and v.day > today.d - 14),
    'month', (select count(*) from v, today where v.day > today.d - 30),
    'total', (select count(*) from v),
    'days', (select coalesce(jsonb_agg(jsonb_build_object('day', g.t::date, 'n', (select count(*) from v where v.day = g.t::date)) order by g.t), '[]'::jsonb)
               from today, generate_series(today.d - 13, today.d, interval '1 day') as g(t))
  );
$$;
grant execute on function public.mp_my_views() to authenticated;
