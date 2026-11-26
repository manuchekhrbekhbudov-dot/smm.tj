-- =====================================================================
-- SMM.TJ — portfolio videos, specialist packages, complete-profile rule, specialist of the week
-- Run AFTER all previous files (… growth, requests). Safe to re-run.
-- =====================================================================

-- ---------- 1. Portfolio: up to 9 pictures + up to 3 videos ----------
-- Videos live in the public "mp-offer-videos" bucket (specialist's own folder), cover pictures in "mp-portfolio".
alter table public.mp_portfolio_items add column if not exists kind text not null default 'image';
do $$ begin
  alter table public.mp_portfolio_items add constraint mp_portfolio_kind_chk check (kind in ('image', 'video'));
exception when duplicate_object then null; end $$;

create or replace function public.mp_guard_portfolio() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.mp_is_admin() then return new; end if;
  if new.specialist_id is distinct from auth.uid() then raise exception 'forbidden'; end if;
  if split_part(new.image_path, '/', 1) <> auth.uid()::text then raise exception 'bad_path'; end if;
  if tg_op = 'INSERT' then
    if new.kind = 'video' and (select count(*) from public.mp_portfolio_items where specialist_id = new.specialist_id and kind = 'video') >= 3 then
      raise exception 'videos_full';
    end if;
    if new.kind = 'image' and (select count(*) from public.mp_portfolio_items where specialist_id = new.specialist_id and kind = 'image') >= 9 then
      raise exception 'portfolio_full';
    end if;
  else
    new.kind := old.kind;
  end if;
  return new;
end $$;

-- ---------- 2. Packages: the specialist builds 1–3 of their own ----------
create table if not exists public.mp_packages (
  id uuid primary key default gen_random_uuid(),
  specialist_id uuid not null references public.mp_specialists(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 40),
  price_tjs int not null check (price_tjs between 1 and 10000000),
  per text not null default 'month' check (per in ('month', 'project')),
  posts int check (posts between 0 and 1000),
  stories int check (stories between 0 and 1000),
  reels int check (reels between 0 and 1000),
  sales_videos int check (sales_videos between 0 and 1000),
  days int check (days between 1 and 365),
  extras text not null default '' check (char_length(extras) <= 300),
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists mp_packages_specialist_idx on public.mp_packages(specialist_id, position);

create or replace function public.mp_guard_package() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.mp_is_admin() then return new; end if;
  if new.specialist_id is distinct from auth.uid() then raise exception 'forbidden'; end if;
  if tg_op = 'INSERT' and (select count(*) from public.mp_packages where specialist_id = new.specialist_id) >= 3 then
    raise exception 'packages_full';
  end if;
  new.name := trim(new.name); new.extras := trim(new.extras);
  return new;
end $$;
drop trigger if exists mp_guard_package on public.mp_packages;
create trigger mp_guard_package before insert or update on public.mp_packages
  for each row execute function public.mp_guard_package();

alter table public.mp_packages enable row level security;
drop policy if exists mp_packages_select on public.mp_packages;
create policy mp_packages_select on public.mp_packages for select using (
  specialist_id = auth.uid() or public.mp_is_admin()
  or exists (select 1 from public.mp_specialists s where s.id = specialist_id and s.status = 'approved')
);
drop policy if exists mp_packages_write on public.mp_packages;
create policy mp_packages_write on public.mp_packages for all to authenticated
  using (specialist_id = auth.uid() or public.mp_is_admin()) with check (specialist_id = auth.uid() or public.mp_is_admin());

-- ---------- 3. A profile goes to the catalog only when it is complete ----------
create or replace function public.mp_profile_check(sid uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'photo',    coalesce(p.avatar_url, '') <> '',
    'name',     char_length(trim(coalesce(p.full_name, ''))) >= 2,
    'headline', char_length(trim(coalesce(s.headline, ''))) >= 5,
    'about',    char_length(trim(coalesce(s.bio, ''))) >= 30,
    'directions', cardinality(coalesce(s.specialties, '{}')) > 0,
    'prices',   exists (select 1 from public.mp_specialist_services x where x.specialist_id = sid)
             or exists (select 1 from public.mp_packages x where x.specialist_id = sid),
    'video',    exists (select 1 from public.mp_portfolio_items x where x.specialist_id = sid and x.kind = 'video')
  )
  from public.mp_profiles p left join public.mp_specialists s on s.id = p.id
  where p.id = sid;
$$;
grant execute on function public.mp_profile_check(uuid) to authenticated;

create or replace function public.mp_guard_complete() returns trigger
language plpgsql security definer set search_path = public as $$
declare c jsonb;
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    c := public.mp_profile_check(new.id);
    if c is null or exists (select 1 from jsonb_each(c) where value = 'false'::jsonb) then
      raise exception 'profile_incomplete';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists mp_guard_complete on public.mp_specialists;
create trigger mp_guard_complete before update on public.mp_specialists
  for each row execute function public.mp_guard_complete();

-- ---------- 4. Specialist of the week (real reviews only; nobody if nobody qualifies) ----------
create or replace function public.mp_specialist_of_week() returns uuid
language sql stable security definer set search_path = public as $$
  select s.id from public.mp_specialists s
   where s.status = 'approved' and s.banned_at is null and s.reviews_count >= 1 and s.rating_avg >= 4
   order by s.rating_avg desc,
            (select count(*) from public.mp_reviews r where r.specialist_id = s.id and not r.hidden and r.created_at > now() - interval '30 days') desc,
            s.reviews_count desc, s.created_at
   limit 1;
$$;
grant execute on function public.mp_specialist_of_week() to anon, authenticated;
