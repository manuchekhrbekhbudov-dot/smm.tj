-- =====================================================================
-- SMM.TJ marketplace — Supabase schema (all objects prefixed mp_ so they never clash with older tables)
-- Run once in Supabase → SQL Editor (safe to re-run: uses IF NOT EXISTS / OR REPLACE).
--
-- Trust rules enforced by the database (not just the UI):
--  * A specialist is visible publicly only after the admin approves them.
--  * Only the client of a COMPLETED order can review that specialist, once per order.
--  * Ratings are computed by the database from visible mp_reviews; nobody can edit them.
--  * The admin is the account registered with the director's phone number.
-- =====================================================================

-- ---------- config ----------
create table if not exists public.mp_app_config (
  key text primary key,
  value text not null
);
-- Director / admin phone in E.164 without "+". Matches SMS logins (auth.users.phone) and
-- phone+password logins, which use the e-mail <digits>@phone.smm.tj internally.
insert into public.mp_app_config(key, value) values ('admin_phone', '992504440101')
on conflict (key) do update set value = excluded.value;
alter table public.mp_app_config enable row level security; -- no policies: not readable by clients

-- ---------- types ----------
do $$ begin
  create type public.mp_user_role as enum ('client', 'specialist', 'admin');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.mp_specialist_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.mp_order_status as enum ('new', 'accepted', 'declined', 'done', 'cancelled');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.mp_price_unit as enum ('project', 'month', 'item', 'hour');
exception when duplicate_object then null; end $$;

-- ---------- tables ----------
create table if not exists public.mp_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.mp_user_role not null default 'client',
  full_name text not null default '' check (char_length(full_name) <= 100),
  city text check (char_length(city) <= 60),
  avatar_url text check (char_length(avatar_url) <= 500),
  created_at timestamptz not null default now()
);

create table if not exists public.mp_specialists (
  id uuid primary key references public.mp_profiles(id) on delete cascade,
  headline text not null default '' check (char_length(headline) <= 120),
  bio text not null default '' check (char_length(bio) <= 3000),
  experience_years int not null default 0 check (experience_years between 0 and 50),
  specialties text[] not null default '{}',
  portfolio_links text[] not null default '{}' check (cardinality(portfolio_links) <= 10),
  telegram text check (char_length(telegram) <= 100),
  whatsapp text check (char_length(whatsapp) <= 30),
  instagram text check (char_length(instagram) <= 100),
  status public.mp_specialist_status not null default 'pending',
  reject_reason text check (char_length(reject_reason) <= 500),
  rating_avg numeric(3,2) not null default 0,
  reviews_count int not null default 0,
  min_price int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists mp_specialists_status_idx on public.mp_specialists(status);
create index if not exists mp_specialists_specialties_idx on public.mp_specialists using gin(specialties);

create table if not exists public.mp_specialist_services (
  id uuid primary key default gen_random_uuid(),
  specialist_id uuid not null references public.mp_specialists(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 120),
  description text not null default '' check (char_length(description) <= 1000),
  price_tjs int not null check (price_tjs between 1 and 10000000),
  unit public.mp_price_unit not null default 'project',
  created_at timestamptz not null default now()
);
create index if not exists mp_services_specialist_idx on public.mp_specialist_services(specialist_id);

create table if not exists public.mp_orders (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.mp_profiles(id) on delete cascade,
  specialist_id uuid not null references public.mp_specialists(id) on delete cascade,
  service_id uuid references public.mp_specialist_services(id) on delete set null,
  message text not null check (char_length(message) between 5 and 3000),
  contact_phone text not null check (char_length(contact_phone) between 9 and 20),
  budget_tjs int check (budget_tjs between 0 and 10000000),
  status public.mp_order_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (client_id <> specialist_id)
);
create index if not exists mp_orders_client_idx on public.mp_orders(client_id);
create index if not exists mp_orders_specialist_idx on public.mp_orders(specialist_id);

create table if not exists public.mp_reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.mp_orders(id) on delete cascade,
  client_id uuid not null references public.mp_profiles(id) on delete cascade,
  specialist_id uuid not null references public.mp_specialists(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  text text not null check (char_length(text) between 10 and 2000),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists mp_reviews_specialist_idx on public.mp_reviews(specialist_id);

-- ---------- helpers ----------
create or replace function public.mp_is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.mp_profiles where id = auth.uid() and role = 'admin');
$$;

-- New auth user → profile. The director's phone becomes admin automatically.
create or replace function public.mp_handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.mp_profiles(id, role)
  values (
    new.id,
    case when new.phone = (select value from public.mp_app_config where key = 'admin_phone')
           or lower(new.email) = (select value from public.mp_app_config where key = 'admin_phone') || '@phone.smm.tj'
         then 'admin'::public.mp_user_role else 'client'::public.mp_user_role end
  )
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists mp_on_auth_user_created on auth.users;
create trigger mp_on_auth_user_created after insert on auth.users
  for each row execute function public.mp_handle_new_user();

-- Users may not change their own role, except client → specialist (and never to/from admin).
create or replace function public.mp_guard_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- The director's account (by phone or phone-login e-mail) is always admin, whatever is sent.
  if exists (
    select 1 from auth.users u
     where u.id = new.id
       and (u.phone = (select value from public.mp_app_config where key = 'admin_phone')
            or lower(u.email) = (select value from public.mp_app_config where key = 'admin_phone') || '@phone.smm.tj')
  ) then
    new.role := 'admin';
    return new;
  end if;
  if public.mp_is_admin() then return new; end if;
  if new.role is distinct from old.role then
    if not (old.role = 'client' and new.role = 'specialist') then
      new.role := old.role;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists mp_guard_profile on public.mp_profiles;
create trigger mp_guard_profile before update on public.mp_profiles
  for each row execute function public.mp_guard_profile();

-- Specialists cannot approve themselves or edit their rating. Edits send them back to review.
create or replace function public.mp_guard_specialist() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if not public.mp_is_admin() then
      new.status := 'pending';
      new.reject_reason := null;
    end if;
    new.rating_avg := 0; new.reviews_count := 0;
    return new;
  end if;
  new.updated_at := now();
  -- rating / min_price recalculation triggers mark themselves as internal
  if coalesce(current_setting('app.internal', true), '') = '1' then return new; end if;
  if not public.mp_is_admin() then
    new.rating_avg := old.rating_avg;
    new.reviews_count := old.reviews_count;
    new.min_price := old.min_price;
    if old.status = 'rejected' then
      new.status := 'pending';          -- fixed profile goes back to moderation
    else
      new.status := old.status;
    end if;
    new.reject_reason := case when new.status = 'pending' then null else old.reject_reason end;
  end if;
  return new;
end $$;
drop trigger if exists mp_guard_specialist on public.mp_specialists;
create trigger mp_guard_specialist before insert or update on public.mp_specialists
  for each row execute function public.mp_guard_specialist();

-- min_price kept in sync with the price list
create or replace function public.mp_sync_min_price() returns trigger
language plpgsql security definer set search_path = public as $$
declare sid uuid := coalesce(new.specialist_id, old.specialist_id);
begin
  perform set_config('app.internal', '1', true);
  update public.mp_specialists
     set min_price = (select min(price_tjs) from public.mp_specialist_services where specialist_id = sid)
   where id = sid;
  perform set_config('app.internal', '', true);
  return null;
end $$;
drop trigger if exists mp_sync_min_price on public.mp_specialist_services;
create trigger mp_sync_min_price after insert or update or delete on public.mp_specialist_services
  for each row execute function public.mp_sync_min_price();

-- Order status transitions
create or replace function public.mp_guard_order() returns trigger
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    -- Only clients place orders (specialists and the director receive / manage them).
    if not exists (select 1 from public.mp_profiles where id = new.client_id and role = 'client') then
      raise exception 'only_clients_can_order';
    end if;
    if not exists (select 1 from public.mp_specialists where id = new.specialist_id and status = 'approved') then
      raise exception 'specialist_not_available';
    end if;
    if new.service_id is not null and not exists (
      select 1 from public.mp_specialist_services where id = new.service_id and specialist_id = new.specialist_id) then
      raise exception 'service_mismatch';
    end if;
    new.status := 'new';
    return new;
  end if;

  -- immutable fields
  new.client_id := old.client_id; new.specialist_id := old.specialist_id;
  new.service_id := old.service_id; new.message := old.message;
  new.contact_phone := old.contact_phone; new.budget_tjs := old.budget_tjs;
  new.created_at := old.created_at; new.updated_at := now();

  if new.status = old.status or public.mp_is_admin() then return new; end if;

  if me = old.specialist_id and (
       (old.status = 'new' and new.status in ('accepted', 'declined')) or
       (old.status = 'accepted' and new.status = 'done')) then
    return new;
  end if;
  if me = old.client_id and old.status in ('new', 'accepted') and new.status = 'cancelled' then
    return new;
  end if;
  raise exception 'invalid_status_change';
end $$;
drop trigger if exists mp_guard_order on public.mp_orders;
create trigger mp_guard_order before insert or update on public.mp_orders
  for each row execute function public.mp_guard_order();

-- Reviews only for the client's own completed order
create or replace function public.mp_guard_review() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if not exists (
      select 1 from public.mp_orders o
       where o.id = new.order_id and o.client_id = auth.uid() and o.status = 'done'
    ) then
      raise exception 'review_requires_completed_order';
    end if;
    select o.client_id, o.specialist_id into new.client_id, new.specialist_id
      from public.mp_orders o where o.id = new.order_id;
    new.hidden := false;
    return new;
  end if;
  -- updates: only admin may hide/unhide; content is immutable
  if not public.mp_is_admin() then raise exception 'forbidden'; end if;
  new.rating := old.rating; new.text := old.text; new.order_id := old.order_id;
  new.client_id := old.client_id; new.specialist_id := old.specialist_id;
  return new;
end $$;
drop trigger if exists mp_guard_review on public.mp_reviews;
create trigger mp_guard_review before insert or update on public.mp_reviews
  for each row execute function public.mp_guard_review();

create or replace function public.mp_sync_rating() returns trigger
language plpgsql security definer set search_path = public as $$
declare sid uuid := coalesce(new.specialist_id, old.specialist_id);
begin
  perform set_config('app.internal', '1', true);
  update public.mp_specialists s set
    rating_avg = coalesce((select round(avg(rating)::numeric, 2) from public.mp_reviews where specialist_id = sid and not hidden), 0),
    reviews_count = (select count(*) from public.mp_reviews where specialist_id = sid and not hidden)
  where s.id = sid;
  perform set_config('app.internal', '', true);
  return null;
end $$;
drop trigger if exists mp_sync_rating on public.mp_reviews;
create trigger mp_sync_rating after insert or update or delete on public.mp_reviews
  for each row execute function public.mp_sync_rating();

-- Public counters for the home page (real numbers only)
create or replace function public.mp_public_stats()
returns table (specialists bigint, completed_orders bigint, reviews bigint)
language sql stable security definer set search_path = public as $$
  select
    (select count(*) from public.mp_specialists where status = 'approved'),
    (select count(*) from public.mp_orders where status = 'done'),
    (select count(*) from public.mp_reviews where not hidden);
$$;
grant execute on function public.mp_public_stats() to anon, authenticated;


-- ---------- phone + password logins (no SMS) ----------
-- Those users sign up with the internal address <digits>@phone.smm.tj, which can never receive mail,
-- so they are confirmed automatically (works even if "Confirm email" is ON in the dashboard).
create or replace function public.mp_autoconfirm_phone_users() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if lower(new.email) like '%@phone.smm.tj' and new.email_confirmed_at is null then
    new.email_confirmed_at := now();
  end if;
  return new;
end $$;
drop trigger if exists mp_autoconfirm_phone_users on auth.users;
create trigger mp_autoconfirm_phone_users before insert or update on auth.users
  for each row execute function public.mp_autoconfirm_phone_users();

-- Fix accounts created before this trigger existed: confirm them and make sure every user has a profile.
update auth.users set email_confirmed_at = now()
 where lower(email) like '%@phone.smm.tj' and email_confirmed_at is null;
insert into public.mp_profiles (id, role)
select u.id,
       case when u.phone = (select value from public.mp_app_config where key = 'admin_phone')
              or lower(u.email) = (select value from public.mp_app_config where key = 'admin_phone') || '@phone.smm.tj'
            then 'admin'::public.mp_user_role else 'client'::public.mp_user_role end
  from auth.users u
 where lower(u.email) like '%@phone.smm.tj' or u.phone is not null
on conflict (id) do nothing;
-- The director's account is always admin.
update public.mp_profiles set role = 'admin'
 where id in (select id from auth.users
               where phone = (select value from public.mp_app_config where key = 'admin_phone')
                  or lower(email) = (select value from public.mp_app_config where key = 'admin_phone') || '@phone.smm.tj');

-- ---------- row level security ----------
alter table public.mp_profiles enable row level security;
alter table public.mp_specialists enable row level security;
alter table public.mp_specialist_services enable row level security;
alter table public.mp_orders enable row level security;
alter table public.mp_reviews enable row level security;

-- mp_profiles
drop policy if exists mp_profiles_select on public.mp_profiles;
create policy mp_profiles_select on public.mp_profiles for select using (
  id = auth.uid()
  or public.mp_is_admin()
  or exists (select 1 from public.mp_specialists s where s.id = mp_profiles.id and s.status = 'approved')
  or exists (select 1 from public.mp_orders o where o.client_id = mp_profiles.id and o.specialist_id = auth.uid())
  or exists (select 1 from public.mp_reviews r where r.client_id = mp_profiles.id and not r.hidden)
);
drop policy if exists mp_profiles_update on public.mp_profiles;
create policy mp_profiles_update on public.mp_profiles for update using (id = auth.uid() or public.mp_is_admin());

-- mp_specialists
drop policy if exists mp_specialists_select on public.mp_specialists;
create policy mp_specialists_select on public.mp_specialists for select using (
  status = 'approved' or id = auth.uid() or public.mp_is_admin()
);
drop policy if exists mp_specialists_insert on public.mp_specialists;
create policy mp_specialists_insert on public.mp_specialists for insert with check (id = auth.uid());
drop policy if exists mp_specialists_update on public.mp_specialists;
create policy mp_specialists_update on public.mp_specialists for update using (id = auth.uid() or public.mp_is_admin());
drop policy if exists mp_specialists_delete on public.mp_specialists;
create policy mp_specialists_delete on public.mp_specialists for delete using (public.mp_is_admin());

-- services (price list)
drop policy if exists mp_services_select on public.mp_specialist_services;
create policy mp_services_select on public.mp_specialist_services for select using (
  specialist_id = auth.uid() or public.mp_is_admin()
  or exists (select 1 from public.mp_specialists s where s.id = specialist_id and s.status = 'approved')
);
drop policy if exists mp_services_write on public.mp_specialist_services;
create policy mp_services_write on public.mp_specialist_services for all
  using (specialist_id = auth.uid()) with check (specialist_id = auth.uid());

-- mp_orders
drop policy if exists mp_orders_select on public.mp_orders;
create policy mp_orders_select on public.mp_orders for select using (
  client_id = auth.uid() or specialist_id = auth.uid() or public.mp_is_admin()
);
drop policy if exists mp_orders_insert on public.mp_orders;
create policy mp_orders_insert on public.mp_orders for insert with check (client_id = auth.uid());
drop policy if exists mp_orders_update on public.mp_orders;
create policy mp_orders_update on public.mp_orders for update using (
  client_id = auth.uid() or specialist_id = auth.uid() or public.mp_is_admin()
);

-- mp_reviews
drop policy if exists mp_reviews_select on public.mp_reviews;
create policy mp_reviews_select on public.mp_reviews for select using (
  not hidden or client_id = auth.uid() or public.mp_is_admin()
);
drop policy if exists mp_reviews_insert on public.mp_reviews;
create policy mp_reviews_insert on public.mp_reviews for insert with check (client_id = auth.uid());
drop policy if exists mp_reviews_update on public.mp_reviews;
create policy mp_reviews_update on public.mp_reviews for update using (public.mp_is_admin());

-- ---------- storage: avatars ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('mp-avatars', 'mp-avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists mp_avatars_read on storage.objects;
create policy mp_avatars_read on storage.objects for select using (bucket_id = 'mp-avatars');
drop policy if exists mp_avatars_write on storage.objects;
create policy mp_avatars_write on storage.objects for insert to authenticated
  with check (bucket_id = 'mp-avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists mp_avatars_update on storage.objects;
create policy mp_avatars_update on storage.objects for update to authenticated
  using (bucket_id = 'mp-avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists mp_avatars_delete on storage.objects;
create policy mp_avatars_delete on storage.objects for delete to authenticated
  using (bucket_id = 'mp-avatars' and (storage.foldername(name))[1] = auth.uid()::text);
