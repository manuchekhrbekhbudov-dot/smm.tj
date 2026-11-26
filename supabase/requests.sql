-- =====================================================================
-- SMM.TJ — "Эълонҳо": a client posts a task, approved specialists send offers,
-- the client picks one → a real order + a chat with that specialist.
-- The client sets the budget themselves (or leaves it "by agreement").
-- Run AFTER all previous files (schema … growth). Safe to re-run.
-- =====================================================================

create table if not exists public.mp_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.mp_profiles(id) on delete cascade,
  title text not null check (char_length(title) between 5 and 120),
  description text not null check (char_length(description) between 20 and 2000),
  specialties text[] not null check (cardinality(specialties) between 1 and 3),
  city text check (char_length(city) <= 40),
  budget_tjs int check (budget_tjs between 1 and 10000000),   -- null = "by agreement"
  status text not null default 'open' check (status in ('open', 'closed', 'hidden')),
  chosen_offer_id uuid,
  offers_count int not null default 0,
  tg_notified_at timestamptz,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days'
);
create index if not exists mp_requests_open_idx on public.mp_requests(status, created_at desc);
create index if not exists mp_requests_client_idx on public.mp_requests(client_id);

create table if not exists public.mp_request_offers (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.mp_requests(id) on delete cascade,
  specialist_id uuid not null references public.mp_specialists(id) on delete cascade,
  price_tjs int not null check (price_tjs between 1 and 10000000),     -- the specialist's own price
  days int check (days between 1 and 365),
  -- what the price includes (each optional)
  posts int check (posts between 0 and 1000),
  stories int check (stories between 0 and 1000),
  reels int check (reels between 0 and 1000),
  sales_videos int check (sales_videos between 0 and 1000),
  -- REQUIRED: at least one video the specialist made (uploaded file or a link to it)
  video_path text check (char_length(video_path) <= 300),
  video_url text check (video_url ~ '^https?://' and char_length(video_url) <= 500),
  message text not null check (char_length(message) between 10 and 1000),
  status text not null default 'sent' check (status in ('sent', 'chosen', 'declined')),
  tg_notified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (request_id, specialist_id),
  check (video_path is not null or video_url is not null)
);
create index if not exists mp_offers_specialist_idx on public.mp_request_offers(specialist_id, created_at desc);

-- ---------- guards ----------
create or replace function public.mp_guard_request() returns trigger
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if coalesce(current_setting('app.internal', true), '') = '1' or coalesce(auth.role(), '') = 'service_role' then return new; end if;
  if tg_op = 'INSERT' then
    if public.mp_is_admin() then return new; end if;
    if new.client_id is distinct from me then raise exception 'forbidden'; end if;
    if not exists (select 1 from public.mp_profiles where id = me and role = 'client' and blocked_at is null) then
      raise exception 'only_clients_can_post';
    end if;
    if (select count(*) from public.mp_requests where client_id = me and status = 'open' and expires_at > now()) >= 3 then
      raise exception 'too_many_open_requests';
    end if;
    if (select count(*) from public.mp_requests where client_id = me and created_at > now() - interval '1 day') >= 5 then
      raise exception 'too_many_requests_today';
    end if;
    new.title := trim(new.title); new.description := trim(new.description);
    new.status := 'open'; new.chosen_offer_id := null; new.offers_count := 0; new.tg_notified_at := null;
    new.created_at := now(); new.expires_at := now() + interval '30 days';
    return new;
  end if;
  -- UPDATE
  if public.mp_is_admin() then return new; end if;   -- the director may hide / reopen
  if me is distinct from old.client_id then raise exception 'forbidden'; end if;
  -- the client may only close their own request (choosing an offer goes through mp_choose_offer)
  if new.status is distinct from old.status and not (old.status = 'open' and new.status = 'closed') then raise exception 'forbidden'; end if;
  new.client_id := old.client_id; new.title := old.title; new.description := old.description;
  new.specialties := old.specialties; new.city := old.city; new.budget_tjs := old.budget_tjs;
  new.chosen_offer_id := old.chosen_offer_id; new.offers_count := old.offers_count;
  new.tg_notified_at := old.tg_notified_at; new.created_at := old.created_at; new.expires_at := old.expires_at;
  return new;
end $$;
drop trigger if exists mp_guard_request on public.mp_requests;
create trigger mp_guard_request before insert or update on public.mp_requests
  for each row execute function public.mp_guard_request();

create or replace function public.mp_guard_offer() returns trigger
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); r public.mp_requests%rowtype;
begin
  if coalesce(current_setting('app.internal', true), '') = '1' or coalesce(auth.role(), '') = 'service_role' or public.mp_is_admin() then return new; end if;
  if tg_op = 'UPDATE' then raise exception 'forbidden'; end if;   -- offers change only via mp_choose_offer
  if new.specialist_id is distinct from me then raise exception 'forbidden'; end if;
  if not exists (select 1 from public.mp_specialists where id = me and status = 'approved' and banned_at is null) then
    raise exception 'only_approved_specialists';
  end if;
  select * into r from public.mp_requests where id = new.request_id;
  if not found or r.status <> 'open' or r.expires_at <= now() then raise exception 'request_closed'; end if;
  if r.client_id = me then raise exception 'forbidden'; end if;
  if (select count(*) from public.mp_request_offers where specialist_id = me and created_at > now() - interval '1 day') >= 20 then
    raise exception 'too_many_offers_today';
  end if;
  if new.video_path is not null and split_part(new.video_path, '/', 1) <> me::text then raise exception 'bad_path'; end if;
  new.message := trim(new.message); new.status := 'sent'; new.tg_notified_at := null; new.created_at := now();
  return new;
end $$;
drop trigger if exists mp_guard_offer on public.mp_request_offers;
create trigger mp_guard_offer before insert or update on public.mp_request_offers
  for each row execute function public.mp_guard_offer();

create or replace function public.mp_after_offer() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform set_config('app.internal', '1', true);
  update public.mp_requests set offers_count = (select count(*) from public.mp_request_offers where request_id = coalesce(new.request_id, old.request_id))
   where id = coalesce(new.request_id, old.request_id);
  perform set_config('app.internal', '', true);
  return null;
end $$;
drop trigger if exists mp_after_offer on public.mp_request_offers;
create trigger mp_after_offer after insert or delete on public.mp_request_offers
  for each row execute function public.mp_after_offer();

-- ---------- the client picks an offer → order + chat ----------
create or replace function public.mp_choose_offer(p_offer uuid, p_phone text) returns uuid
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); o public.mp_request_offers%rowtype; r public.mp_requests%rowtype; oid uuid; cid uuid;
begin
  select * into o from public.mp_request_offers where id = p_offer;
  if not found then raise exception 'not_found'; end if;
  select * into r from public.mp_requests where id = o.request_id;
  if r.client_id is distinct from me then raise exception 'forbidden'; end if;
  if r.status <> 'open' then raise exception 'request_closed'; end if;
  if char_length(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')) < 9 then raise exception 'bad_phone'; end if;

  -- a normal order: every existing rule (blocked client, "say if you hired" first, …) still applies
  insert into public.mp_orders (client_id, specialist_id, message, contact_phone, budget_tjs)
  values (me, o.specialist_id, left(r.title || E'\n\n' || r.description, 3000), left(trim(p_phone), 20), coalesce(o.price_tjs, r.budget_tjs))
  returning id into oid;

  perform set_config('app.internal', '1', true);
  update public.mp_request_offers set status = case when id = o.id then 'chosen' else 'declined' end where request_id = r.id;
  update public.mp_requests set status = 'closed', chosen_offer_id = o.id where id = r.id;
  perform set_config('app.internal', '', true);

  -- open the chat with the chosen specialist
  insert into public.mp_conversations (client_id, specialist_id) values (me, o.specialist_id)
  on conflict (client_id, specialist_id) do nothing;
  return oid;
end $$;
grant execute on function public.mp_choose_offer(uuid, text) to authenticated;

-- ---------- sample videos (public, up to 30 MB, in the specialist's own folder) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('mp-offer-videos', 'mp-offer-videos', true, 31457280, array['video/mp4', 'video/quicktime', 'video/webm'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists mp_offer_videos_read on storage.objects;
create policy mp_offer_videos_read on storage.objects for select using (bucket_id = 'mp-offer-videos');
drop policy if exists mp_offer_videos_write on storage.objects;
create policy mp_offer_videos_write on storage.objects for insert to authenticated
  with check (bucket_id = 'mp-offer-videos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists mp_offer_videos_delete on storage.objects;
create policy mp_offer_videos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'mp-offer-videos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- access ----------
-- Helper that reads a request's owner WITHOUT row security (avoids policies of the two tables calling each other).
create or replace function public.mp_request_owner(rid uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select client_id from public.mp_requests where id = rid;
$$;

alter table public.mp_requests enable row level security;
alter table public.mp_request_offers enable row level security;

-- Open requests are public (title, task, budget — no contacts); own and director's: all.
drop policy if exists mp_requests_select on public.mp_requests;
create policy mp_requests_select on public.mp_requests for select using (
  (status = 'open' and expires_at > now()) or client_id = auth.uid() or public.mp_is_admin()
  or exists (select 1 from public.mp_request_offers o where o.request_id = mp_requests.id and o.specialist_id = auth.uid())
);
drop policy if exists mp_requests_insert on public.mp_requests;
create policy mp_requests_insert on public.mp_requests for insert to authenticated with check (client_id = auth.uid());
drop policy if exists mp_requests_update on public.mp_requests;
create policy mp_requests_update on public.mp_requests for update to authenticated
  using (client_id = auth.uid() or public.mp_is_admin());

-- An offer is seen only by its specialist, the request's client and the director.
drop policy if exists mp_offers_select on public.mp_request_offers;
create policy mp_offers_select on public.mp_request_offers for select using (
  specialist_id = auth.uid() or public.mp_is_admin()
  or public.mp_request_owner(request_id) = auth.uid()
);
drop policy if exists mp_offers_insert on public.mp_request_offers;
create policy mp_offers_insert on public.mp_request_offers for insert to authenticated with check (specialist_id = auth.uid());
drop policy if exists mp_offers_delete on public.mp_request_offers;
create policy mp_offers_delete on public.mp_request_offers for delete to authenticated
  using ((specialist_id = auth.uid() and status = 'sent') or public.mp_is_admin());
