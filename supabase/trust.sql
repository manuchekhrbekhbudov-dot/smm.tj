-- =====================================================================
-- SMM.TJ — trust rules (run AFTER schema.sql and plans.sql; safe to re-run)
--  * Hiring outcome: after a specialist accepts, the client says "hired" or "not hired + reason".
--    Until then the client cannot place a new order. The specialist can report "client did not hire me".
--  * Complaints: only the client of a real (accepted/done) order, once per order.
--    Strike = complaint or 1★ review. 2 strikes → warning, 3 strikes → removed from the platform:
--    profile marked "removed by the director", account, phone number and devices blocked.
--  * Welcome bonus: 3 good reviews (4–5★) in the first 30 days → 7 days of the "Top" plan free.
--  * Review prize flag for the director, feedback / suggestions table, AI assistant usage log.
-- =====================================================================

-- ---------- columns ----------
alter table public.mp_profiles add column if not exists blocked_at timestamptz;
alter table public.mp_profiles add column if not exists blocked_reason text check (char_length(blocked_reason) <= 500);

alter table public.mp_specialists add column if not exists strikes int not null default 0;
alter table public.mp_specialists add column if not exists strikes_forgiven int not null default 0;
alter table public.mp_specialists add column if not exists warned_at timestamptz;
alter table public.mp_specialists add column if not exists banned_at timestamptz;
alter table public.mp_specialists add column if not exists bonus_given_at timestamptz;
alter table public.mp_specialists add column if not exists tg_strike_notified text;

alter table public.mp_orders add column if not exists hire_status text check (hire_status in ('hired', 'not_hired'));
alter table public.mp_orders add column if not exists client_reason text check (char_length(client_reason) <= 1000);
alter table public.mp_orders add column if not exists specialist_note text check (char_length(specialist_note) <= 1000);
alter table public.mp_orders add column if not exists decided_at timestamptz;

alter table public.mp_reviews add column if not exists prize_given_at timestamptz;

-- ---------- profile block fields: director / internal only ----------
create or replace function public.mp_guard_block() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(current_setting('app.internal', true), '') = '1' or public.mp_is_admin() then return new; end if;
  new.blocked_at := old.blocked_at; new.blocked_reason := old.blocked_reason;
  return new;
end $$;
drop trigger if exists mp_guard_block on public.mp_profiles;
create trigger mp_guard_block before update on public.mp_profiles
  for each row execute function public.mp_guard_block();

-- ---------- specialist trust fields; a removed specialist cannot edit anything ----------
create or replace function public.mp_guard_trust() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- internal recount, the director, or the server (Edge Functions with the service role)
  if coalesce(current_setting('app.internal', true), '') = '1' or public.mp_is_admin()
     or coalesce(auth.role(), '') = 'service_role' then return new; end if;
  if tg_op = 'INSERT' then
    new.strikes := 0; new.strikes_forgiven := 0; new.warned_at := null; new.banned_at := null;
    new.bonus_given_at := null; new.tg_strike_notified := null;
    return new;
  end if;
  if old.banned_at is not null then raise exception 'banned'; end if;
  new.strikes := old.strikes; new.strikes_forgiven := old.strikes_forgiven; new.warned_at := old.warned_at;
  new.banned_at := old.banned_at; new.bonus_given_at := old.bonus_given_at;
  new.tg_strike_notified := old.tg_strike_notified;
  return new;
end $$;
drop trigger if exists mp_guard_trust on public.mp_specialists;
create trigger mp_guard_trust before insert or update on public.mp_specialists
  for each row execute function public.mp_guard_trust();

-- ---------- hiring outcome ----------
-- New orders are refused while the client owes an answer on an accepted order.
create or replace function public.mp_gate_order() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.mp_orders
              where client_id = new.client_id and status = 'accepted' and hire_status is null) then
    raise exception 'decision_required';
  end if;
  if exists (select 1 from public.mp_profiles where id = new.client_id and blocked_at is not null) then
    raise exception 'blocked';
  end if;
  return new;
end $$;
drop trigger if exists mp_gate_order on public.mp_orders;
create trigger mp_gate_order before insert on public.mp_orders
  for each row execute function public.mp_gate_order();

create or replace function public.mp_guard_hire() returns trigger
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if public.mp_is_admin() then return new; end if;

  -- specialist: "the client did not hire me" (+ reason), once, while the order is accepted
  if new.specialist_note is distinct from old.specialist_note then
    if me <> old.specialist_id or old.specialist_note is not null or old.status <> 'accepted'
       or char_length(coalesce(trim(new.specialist_note), '')) < 5 then
      raise exception 'invalid_note';
    end if;
  end if;

  -- client: hired / not hired (+ reason). Cancelling an accepted order also needs a reason.
  if me = old.client_id and old.status = 'accepted' and new.status = 'cancelled' then
    new.hire_status := 'not_hired';
  end if;
  if new.hire_status is distinct from old.hire_status or new.client_reason is distinct from old.client_reason then
    if me <> old.client_id or old.status <> 'accepted' or old.client_reason is not null
       or (old.hire_status = 'hired' and new.hire_status is distinct from 'not_hired') then
      raise exception 'invalid_decision';
    end if;
    if new.hire_status = 'not_hired' then
      if char_length(coalesce(trim(new.client_reason), '')) < 5 then raise exception 'reason_required'; end if;
      new.status := 'cancelled';
    elsif new.hire_status = 'hired' then
      new.client_reason := null;
    else
      raise exception 'invalid_decision';
    end if;
    new.decided_at := now();
  end if;
  return new;
end $$;
drop trigger if exists mp_guard_hire on public.mp_orders;
create trigger mp_guard_hire before update on public.mp_orders
  for each row execute function public.mp_guard_hire();

-- ---------- complaints ----------
create table if not exists public.mp_complaints (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.mp_orders(id) on delete cascade,
  client_id uuid not null references public.mp_profiles(id) on delete cascade,
  specialist_id uuid not null references public.mp_specialists(id) on delete cascade,
  text text not null check (char_length(text) between 10 and 2000),
  voided boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists mp_complaints_specialist_idx on public.mp_complaints(specialist_id);

create or replace function public.mp_guard_complaint() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if not exists (
      select 1 from public.mp_orders o
       where o.id = new.order_id and o.client_id = auth.uid()
         and (o.status in ('accepted', 'done') or o.hire_status = 'hired')
    ) then
      raise exception 'complaint_requires_order';
    end if;
    select o.client_id, o.specialist_id into new.client_id, new.specialist_id
      from public.mp_orders o where o.id = new.order_id;
    new.voided := false; new.created_at := now();
    return new;
  end if;
  if not public.mp_is_admin() then raise exception 'forbidden'; end if;
  new.text := old.text; new.order_id := old.order_id;
  new.client_id := old.client_id; new.specialist_id := old.specialist_id;
  return new;
end $$;
drop trigger if exists mp_guard_complaint on public.mp_complaints;
create trigger mp_guard_complaint before insert or update on public.mp_complaints
  for each row execute function public.mp_guard_complaint();

alter table public.mp_complaints enable row level security;
drop policy if exists mp_complaints_select on public.mp_complaints;
create policy mp_complaints_select on public.mp_complaints for select
  using (client_id = auth.uid() or specialist_id = auth.uid() or public.mp_is_admin());
drop policy if exists mp_complaints_insert on public.mp_complaints;
create policy mp_complaints_insert on public.mp_complaints for insert to authenticated
  with check (client_id = auth.uid());
drop policy if exists mp_complaints_update on public.mp_complaints;
create policy mp_complaints_update on public.mp_complaints for update using (public.mp_is_admin());

-- ---------- blocked phones / devices ----------
create table if not exists public.mp_blocked_phones (
  phone text primary key,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.mp_blocked_phones enable row level security; -- service role / functions only

create table if not exists public.mp_blocked_devices (
  device_id text primary key check (char_length(device_id) between 8 and 80),
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.mp_blocked_devices enable row level security; -- via mp_device_status() only

-- Called by the site with a random per-browser id. A blocked account marks its device;
-- a marked device is refused even with a new phone number.
create or replace function public.mp_device_status(d text) returns text
language plpgsql security definer set search_path = public as $$
begin
  if d is null or char_length(d) not between 8 and 80 then return 'ok'; end if;
  if auth.uid() is not null and exists (select 1 from public.mp_profiles where id = auth.uid() and blocked_at is not null) then
    insert into public.mp_blocked_devices(device_id, user_id) values (d, auth.uid()) on conflict do nothing;
    return 'blocked';
  end if;
  if auth.uid() is not null and public.mp_is_admin() then return 'ok'; end if;
  if exists (select 1 from public.mp_blocked_devices where device_id = d) then return 'blocked'; end if;
  return 'ok';
end $$;
grant execute on function public.mp_device_status(text) to anon, authenticated;

-- ---------- strikes, warning, removal, welcome bonus ----------
create or replace function public.mp_recount_trust(sid uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  raw int;
  eff int;
  s public.mp_specialists%rowtype;
  good int;
begin
  select * into s from public.mp_specialists where id = sid;
  if not found then return; end if;
  raw := (select count(*) from public.mp_complaints where specialist_id = sid and not voided)
       + (select count(*) from public.mp_reviews where specialist_id = sid and rating = 1 and not hidden);
  eff := greatest(raw - s.strikes_forgiven, 0);

  perform set_config('app.internal', '1', true);
  update public.mp_specialists set strikes = eff,
    warned_at = case when eff >= 2 and warned_at is null then now() else warned_at end
  where id = sid;

  if eff >= 3 and s.banned_at is null then
    update public.mp_specialists set
      banned_at = now(), status = 'rejected', plan = null, plan_until = null,
      reject_reason = 'Директор аз платформа хориҷ кард: кори бесифат / Удалён директором с платформы за некачественную работу'
    where id = sid;
    update public.mp_profiles set blocked_at = now(), blocked_reason = 'strikes' where id = sid;
    insert into public.mp_blocked_phones(phone, user_id)
      select coalesce(nullif(regexp_replace(coalesce(u.phone, ''), '\D', '', 'g'), ''),
                      split_part(lower(u.email), '@', 1)), u.id
        from auth.users u where u.id = sid
    on conflict do nothing;
    insert into public.mp_blocked_phones(phone, user_id)
      select l.phone, l.user_id from public.mp_tg_links l where l.user_id = sid and l.phone is not null
    on conflict do nothing;
  end if;

  -- Welcome bonus: 3 good reviews within 30 days of joining → 7 days of "Top" (or +7 days to the active plan).
  if s.bonus_given_at is null and s.banned_at is null then
    select count(*) into good from public.mp_reviews r
     where r.specialist_id = sid and r.rating >= 4 and not r.hidden
       and r.created_at <= s.created_at + interval '30 days';
    if good >= 3 then
      update public.mp_specialists set
        bonus_given_at = now(),
        plan = case when plan is not null and plan_until > now() then plan else 'top' end,
        plan_until = case when plan is not null and plan_until > now() then plan_until else now() end + interval '7 days'
      where id = sid;
    end if;
  end if;
  perform set_config('app.internal', '', true);
end $$;

create or replace function public.mp_trust_after_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.mp_recount_trust(coalesce(new.specialist_id, old.specialist_id));
  return null;
end $$;
drop trigger if exists mp_trust_complaints on public.mp_complaints;
create trigger mp_trust_complaints after insert or update on public.mp_complaints
  for each row execute function public.mp_trust_after_change();
drop trigger if exists mp_trust_reviews on public.mp_reviews;
create trigger mp_trust_reviews after insert or update on public.mp_reviews
  for each row execute function public.mp_trust_after_change();

-- Director: bring a removed specialist back (current strikes are forgiven).
create or replace function public.mp_unban(sid uuid) returns void
language plpgsql security definer set search_path = public as $$
declare raw int;
begin
  if not public.mp_is_admin() then raise exception 'forbidden'; end if;
  raw := (select count(*) from public.mp_complaints where specialist_id = sid and not voided)
       + (select count(*) from public.mp_reviews where specialist_id = sid and rating = 1 and not hidden);
  perform set_config('app.internal', '1', true);
  update public.mp_specialists set banned_at = null, warned_at = null, strikes = 0, strikes_forgiven = raw,
    tg_strike_notified = null, status = 'approved', reject_reason = null where id = sid;
  update public.mp_profiles set blocked_at = null, blocked_reason = null where id = sid;
  delete from public.mp_blocked_phones where user_id = sid;
  delete from public.mp_blocked_devices where user_id = sid;
  perform set_config('app.internal', '', true);
end $$;
grant execute on function public.mp_unban(uuid) to authenticated;

-- A removed specialist stays visible with the "removed" mark (not in the catalog).
drop policy if exists mp_specialists_select on public.mp_specialists;
create policy mp_specialists_select on public.mp_specialists for select using (
  status = 'approved' or banned_at is not null or id = auth.uid() or public.mp_is_admin()
);
drop policy if exists mp_profiles_select on public.mp_profiles;
create policy mp_profiles_select on public.mp_profiles for select using (
  id = auth.uid()
  or public.mp_is_admin()
  or exists (select 1 from public.mp_specialists s where s.id = mp_profiles.id and (s.status = 'approved' or s.banned_at is not null))
  or exists (select 1 from public.mp_orders o where o.client_id = mp_profiles.id and o.specialist_id = auth.uid())
  or exists (select 1 from public.mp_reviews r where r.client_id = mp_profiles.id and not r.hidden)
);

-- ---------- feedback / suggestions about the platform ----------
create table if not exists public.mp_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.mp_profiles(id) on delete set null,
  role text,
  kind text not null check (kind in ('idea', 'problem', 'praise')),
  rating int check (rating between 1 and 5),
  text text not null check (char_length(text) between 5 and 2000),
  created_at timestamptz not null default now()
);
create or replace function public.mp_guard_feedback() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.user_id := auth.uid();
  new.role := (select role::text from public.mp_profiles where id = auth.uid());
  new.created_at := now();
  if (select count(*) from public.mp_feedback where user_id = auth.uid() and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'too_many';
  end if;
  return new;
end $$;
drop trigger if exists mp_guard_feedback on public.mp_feedback;
create trigger mp_guard_feedback before insert on public.mp_feedback
  for each row execute function public.mp_guard_feedback();
alter table public.mp_feedback enable row level security;
drop policy if exists mp_feedback_insert on public.mp_feedback;
create policy mp_feedback_insert on public.mp_feedback for insert to authenticated with check (true);
drop policy if exists mp_feedback_select on public.mp_feedback;
create policy mp_feedback_select on public.mp_feedback for select using (public.mp_is_admin() or user_id = auth.uid());
drop policy if exists mp_feedback_delete on public.mp_feedback;
create policy mp_feedback_delete on public.mp_feedback for delete using (public.mp_is_admin());

-- ---------- AI assistant usage (rate limit; Edge Function only) ----------
create table if not exists public.mp_ai_usage (
  id bigint generated always as identity primary key,
  key text not null,
  created_at timestamptz not null default now()
);
create index if not exists mp_ai_usage_key_idx on public.mp_ai_usage(key, created_at);
alter table public.mp_ai_usage enable row level security;
