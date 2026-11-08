-- =====================================================================
-- SMM.TJ marketplace — Supabase schema
-- Run once in Supabase → SQL Editor (safe to re-run: uses IF NOT EXISTS / OR REPLACE).
--
-- Trust rules enforced by the database (not just the UI):
--  * A specialist is visible publicly only after the admin approves them.
--  * Only the client of a COMPLETED order can review that specialist, once per order.
--  * Ratings are computed by the database from visible reviews; nobody can edit them.
--  * The admin is the account registered with the director's phone number.
-- =====================================================================

-- ---------- config ----------
create table if not exists public.app_config (
  key text primary key,
  value text not null
);
-- Director / admin phone in E.164 without "+", as Supabase Auth stores it.
insert into public.app_config(key, value) values ('admin_phone', '992504440101')
on conflict (key) do update set value = excluded.value;
alter table public.app_config enable row level security; -- no policies: not readable by clients

-- ---------- types ----------
do $$ begin
  create type public.user_role as enum ('client', 'specialist', 'admin');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.specialist_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.order_status as enum ('new', 'accepted', 'declined', 'done', 'cancelled');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.price_unit as enum ('project', 'month', 'item', 'hour');
exception when duplicate_object then null; end $$;

-- ---------- tables ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'client',
  full_name text not null default '' check (char_length(full_name) <= 100),
  city text check (char_length(city) <= 60),
  avatar_url text check (char_length(avatar_url) <= 500),
  created_at timestamptz not null default now()
);

create table if not exists public.specialists (
  id uuid primary key references public.profiles(id) on delete cascade,
  headline text not null default '' check (char_length(headline) <= 120),
  bio text not null default '' check (char_length(bio) <= 3000),
  experience_years int not null default 0 check (experience_years between 0 and 50),
  specialties text[] not null default '{}',
  portfolio_links text[] not null default '{}' check (cardinality(portfolio_links) <= 10),
  telegram text check (char_length(telegram) <= 100),
  whatsapp text check (char_length(whatsapp) <= 30),
  instagram text check (char_length(instagram) <= 100),
  status public.specialist_status not null default 'pending',
  reject_reason text check (char_length(reject_reason) <= 500),
  rating_avg numeric(3,2) not null default 0,
  reviews_count int not null default 0,
  min_price int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists specialists_status_idx on public.specialists(status);
create index if not exists specialists_specialties_idx on public.specialists using gin(specialties);

create table if not exists public.specialist_services (
  id uuid primary key default gen_random_uuid(),
  specialist_id uuid not null references public.specialists(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 120),
  description text not null default '' check (char_length(description) <= 1000),
  price_tjs int not null check (price_tjs between 1 and 10000000),
  unit public.price_unit not null default 'project',
  created_at timestamptz not null default now()
);
create index if not exists services_specialist_idx on public.specialist_services(specialist_id);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  specialist_id uuid not null references public.specialists(id) on delete cascade,
  service_id uuid references public.specialist_services(id) on delete set null,
  message text not null check (char_length(message) between 5 and 3000),
  contact_phone text not null check (char_length(contact_phone) between 9 and 20),
  budget_tjs int check (budget_tjs between 0 and 10000000),
  status public.order_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (client_id <> specialist_id)
);
create index if not exists orders_client_idx on public.orders(client_id);
create index if not exists orders_specialist_idx on public.orders(specialist_id);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  specialist_id uuid not null references public.specialists(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  text text not null check (char_length(text) between 10 and 2000),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists reviews_specialist_idx on public.reviews(specialist_id);

-- ---------- helpers ----------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- New auth user → profile. The director's phone becomes admin automatically.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, role)
  values (
    new.id,
    case when new.phone = (select value from public.app_config where key = 'admin_phone')
         then 'admin'::public.user_role else 'client'::public.user_role end
  )
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Users may not change their own role, except client → specialist (and never to/from admin).
create or replace function public.guard_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() then return new; end if;
  if new.role is distinct from old.role then
    if not (old.role = 'client' and new.role = 'specialist') then
      new.role := old.role;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists guard_profile on public.profiles;
create trigger guard_profile before update on public.profiles
  for each row execute function public.guard_profile();

-- Specialists cannot approve themselves or edit their rating. Edits send them back to review.
create or replace function public.guard_specialist() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if not public.is_admin() then
      new.status := 'pending';
      new.reject_reason := null;
    end if;
    new.rating_avg := 0; new.reviews_count := 0;
    return new;
  end if;
  new.updated_at := now();
  -- rating / min_price recalculation triggers mark themselves as internal
  if coalesce(current_setting('app.internal', true), '') = '1' then return new; end if;
  if not public.is_admin() then
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
drop trigger if exists guard_specialist on public.specialists;
create trigger guard_specialist before insert or update on public.specialists
  for each row execute function public.guard_specialist();

-- min_price kept in sync with the price list
create or replace function public.sync_min_price() returns trigger
language plpgsql security definer set search_path = public as $$
declare sid uuid := coalesce(new.specialist_id, old.specialist_id);
begin
  perform set_config('app.internal', '1', true);
  update public.specialists
     set min_price = (select min(price_tjs) from public.specialist_services where specialist_id = sid)
   where id = sid;
  perform set_config('app.internal', '', true);
  return null;
end $$;
drop trigger if exists sync_min_price on public.specialist_services;
create trigger sync_min_price after insert or update or delete on public.specialist_services
  for each row execute function public.sync_min_price();

-- Order status transitions
create or replace function public.guard_order() returns trigger
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    if not exists (select 1 from public.specialists where id = new.specialist_id and status = 'approved') then
      raise exception 'specialist_not_available';
    end if;
    if new.service_id is not null and not exists (
      select 1 from public.specialist_services where id = new.service_id and specialist_id = new.specialist_id) then
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

  if new.status = old.status or public.is_admin() then return new; end if;

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
drop trigger if exists guard_order on public.orders;
create trigger guard_order before insert or update on public.orders
  for each row execute function public.guard_order();

-- Reviews only for the client's own completed order
create or replace function public.guard_review() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if not exists (
      select 1 from public.orders o
       where o.id = new.order_id and o.client_id = auth.uid() and o.status = 'done'
    ) then
      raise exception 'review_requires_completed_order';
    end if;
    select o.client_id, o.specialist_id into new.client_id, new.specialist_id
      from public.orders o where o.id = new.order_id;
    new.hidden := false;
    return new;
  end if;
  -- updates: only admin may hide/unhide; content is immutable
  if not public.is_admin() then raise exception 'forbidden'; end if;
  new.rating := old.rating; new.text := old.text; new.order_id := old.order_id;
  new.client_id := old.client_id; new.specialist_id := old.specialist_id;
  return new;
end $$;
drop trigger if exists guard_review on public.reviews;
create trigger guard_review before insert or update on public.reviews
  for each row execute function public.guard_review();

create or replace function public.sync_rating() returns trigger
language plpgsql security definer set search_path = public as $$
declare sid uuid := coalesce(new.specialist_id, old.specialist_id);
begin
  perform set_config('app.internal', '1', true);
  update public.specialists s set
    rating_avg = coalesce((select round(avg(rating)::numeric, 2) from public.reviews where specialist_id = sid and not hidden), 0),
    reviews_count = (select count(*) from public.reviews where specialist_id = sid and not hidden)
  where s.id = sid;
  perform set_config('app.internal', '', true);
  return null;
end $$;
drop trigger if exists sync_rating on public.reviews;
create trigger sync_rating after insert or update or delete on public.reviews
  for each row execute function public.sync_rating();

-- Public counters for the home page (real numbers only)
create or replace function public.public_stats()
returns table (specialists bigint, completed_orders bigint, reviews bigint)
language sql stable security definer set search_path = public as $$
  select
    (select count(*) from public.specialists where status = 'approved'),
    (select count(*) from public.orders where status = 'done'),
    (select count(*) from public.reviews where not hidden);
$$;
grant execute on function public.public_stats() to anon, authenticated;

-- ---------- row level security ----------
alter table public.profiles enable row level security;
alter table public.specialists enable row level security;
alter table public.specialist_services enable row level security;
alter table public.orders enable row level security;
alter table public.reviews enable row level security;

-- profiles
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select using (
  id = auth.uid()
  or public.is_admin()
  or exists (select 1 from public.specialists s where s.id = profiles.id and s.status = 'approved')
  or exists (select 1 from public.orders o where o.client_id = profiles.id and o.specialist_id = auth.uid())
  or exists (select 1 from public.reviews r where r.client_id = profiles.id and not r.hidden)
);
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update using (id = auth.uid() or public.is_admin());

-- specialists
drop policy if exists specialists_select on public.specialists;
create policy specialists_select on public.specialists for select using (
  status = 'approved' or id = auth.uid() or public.is_admin()
);
drop policy if exists specialists_insert on public.specialists;
create policy specialists_insert on public.specialists for insert with check (id = auth.uid());
drop policy if exists specialists_update on public.specialists;
create policy specialists_update on public.specialists for update using (id = auth.uid() or public.is_admin());
drop policy if exists specialists_delete on public.specialists;
create policy specialists_delete on public.specialists for delete using (public.is_admin());

-- services (price list)
drop policy if exists services_select on public.specialist_services;
create policy services_select on public.specialist_services for select using (
  specialist_id = auth.uid() or public.is_admin()
  or exists (select 1 from public.specialists s where s.id = specialist_id and s.status = 'approved')
);
drop policy if exists services_write on public.specialist_services;
create policy services_write on public.specialist_services for all
  using (specialist_id = auth.uid()) with check (specialist_id = auth.uid());

-- orders
drop policy if exists orders_select on public.orders;
create policy orders_select on public.orders for select using (
  client_id = auth.uid() or specialist_id = auth.uid() or public.is_admin()
);
drop policy if exists orders_insert on public.orders;
create policy orders_insert on public.orders for insert with check (client_id = auth.uid());
drop policy if exists orders_update on public.orders;
create policy orders_update on public.orders for update using (
  client_id = auth.uid() or specialist_id = auth.uid() or public.is_admin()
);

-- reviews
drop policy if exists reviews_select on public.reviews;
create policy reviews_select on public.reviews for select using (
  not hidden or client_id = auth.uid() or public.is_admin()
);
drop policy if exists reviews_insert on public.reviews;
create policy reviews_insert on public.reviews for insert with check (client_id = auth.uid());
drop policy if exists reviews_update on public.reviews;
create policy reviews_update on public.reviews for update using (public.is_admin());

-- ---------- storage: avatars ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists avatars_read on storage.objects;
create policy avatars_read on storage.objects for select using (bucket_id = 'avatars');
drop policy if exists avatars_write on storage.objects;
create policy avatars_write on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists avatars_update on storage.objects;
create policy avatars_update on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists avatars_delete on storage.objects;
create policy avatars_delete on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
