-- =====================================================================
-- SMM.TJ — portfolio, chat, order brief, visit counter (run AFTER schema/plans/trust/stats; safe to re-run)
-- =====================================================================

-- ---------- 0. Tables used by the chat (created first) ----------
create table if not exists public.mp_conversations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.mp_profiles(id) on delete cascade,
  specialist_id uuid not null references public.mp_specialists(id) on delete cascade,
  last_message_at timestamptz not null default now(),
  client_read_at timestamptz,
  specialist_read_at timestamptz,
  tg_notified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (client_id, specialist_id),
  check (client_id <> specialist_id)
);
create table if not exists public.mp_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.mp_conversations(id) on delete cascade,
  sender_id uuid not null references public.mp_profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists mp_messages_conv_idx on public.mp_messages(conversation_id, created_at);

-- ---------- 1. Portfolio images (up to 9 per specialist) ----------
create table if not exists public.mp_portfolio_items (
  id uuid primary key default gen_random_uuid(),
  specialist_id uuid not null references public.mp_specialists(id) on delete cascade,
  image_path text not null check (char_length(image_path) <= 300),
  title text not null default '' check (char_length(title) <= 120),
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists mp_portfolio_specialist_idx on public.mp_portfolio_items(specialist_id, position);

create or replace function public.mp_guard_portfolio() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.mp_is_admin() then return new; end if;
  if new.specialist_id is distinct from auth.uid() then raise exception 'forbidden'; end if;
  if split_part(new.image_path, '/', 1) <> auth.uid()::text then raise exception 'bad_path'; end if;
  if tg_op = 'INSERT' and (select count(*) from public.mp_portfolio_items where specialist_id = new.specialist_id) >= 9 then
    raise exception 'portfolio_full';
  end if;
  return new;
end $$;
drop trigger if exists mp_guard_portfolio on public.mp_portfolio_items;
create trigger mp_guard_portfolio before insert or update on public.mp_portfolio_items
  for each row execute function public.mp_guard_portfolio();

alter table public.mp_portfolio_items enable row level security;
drop policy if exists mp_portfolio_select on public.mp_portfolio_items;
create policy mp_portfolio_select on public.mp_portfolio_items for select using (
  specialist_id = auth.uid() or public.mp_is_admin()
  or exists (select 1 from public.mp_specialists s where s.id = specialist_id and s.status = 'approved')
);
drop policy if exists mp_portfolio_write on public.mp_portfolio_items;
create policy mp_portfolio_write on public.mp_portfolio_items for all to authenticated
  using (specialist_id = auth.uid() or public.mp_is_admin()) with check (specialist_id = auth.uid() or public.mp_is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('mp-portfolio', 'mp-portfolio', true, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists mp_portfolio_files_read on storage.objects;
create policy mp_portfolio_files_read on storage.objects for select using (bucket_id = 'mp-portfolio');
drop policy if exists mp_portfolio_files_write on storage.objects;
create policy mp_portfolio_files_write on storage.objects for insert to authenticated
  with check (bucket_id = 'mp-portfolio' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists mp_portfolio_files_delete on storage.objects;
create policy mp_portfolio_files_delete on storage.objects for delete to authenticated
  using (bucket_id = 'mp-portfolio' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- 2. Chat: one conversation per client + specialist ----------


create or replace function public.mp_guard_conversation() returns trigger
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    if public.mp_is_admin() then return new; end if;
    if new.client_id is distinct from me then raise exception 'forbidden'; end if;
    if not exists (select 1 from public.mp_profiles where id = me and role = 'client' and blocked_at is null) then
      raise exception 'only_clients_can_start';
    end if;
    if not exists (select 1 from public.mp_specialists where id = new.specialist_id and status = 'approved') then
      raise exception 'specialist_not_available';
    end if;
    new.last_message_at := now(); new.client_read_at := null; new.specialist_read_at := null; new.tg_notified_at := null;
    return new;
  end if;
  -- participants may only mark the conversation as read (their own side)
  if coalesce(auth.role(), '') = 'service_role' or public.mp_is_admin() then return new; end if;
  new.client_id := old.client_id; new.specialist_id := old.specialist_id; new.created_at := old.created_at;
  new.last_message_at := old.last_message_at; new.tg_notified_at := old.tg_notified_at;
  if me <> old.client_id then new.client_read_at := old.client_read_at; end if;
  if me <> old.specialist_id then new.specialist_read_at := old.specialist_read_at; end if;
  return new;
end $$;
drop trigger if exists mp_guard_conversation on public.mp_conversations;
create trigger mp_guard_conversation before insert or update on public.mp_conversations
  for each row execute function public.mp_guard_conversation();

create or replace function public.mp_guard_message() returns trigger
language plpgsql security definer set search_path = public as $$
declare c record;
begin
  if tg_op <> 'INSERT' then raise exception 'messages_are_immutable'; end if;
  select * into c from public.mp_conversations where id = new.conversation_id;
  if not found or auth.uid() is distinct from new.sender_id or new.sender_id not in (c.client_id, c.specialist_id) then
    raise exception 'forbidden';
  end if;
  if exists (select 1 from public.mp_profiles where id = new.sender_id and blocked_at is not null) then raise exception 'blocked'; end if;
  if (select count(*) from public.mp_messages where sender_id = new.sender_id and created_at > now() - interval '10 minutes') >= 40 then
    raise exception 'too_many_messages';
  end if;
  new.body := trim(new.body); new.created_at := now();
  return new;
end $$;
drop trigger if exists mp_guard_message on public.mp_messages;
create trigger mp_guard_message before insert or update on public.mp_messages
  for each row execute function public.mp_guard_message();

create or replace function public.mp_after_message() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.mp_conversations set last_message_at = now(),
    client_read_at = case when new.sender_id = client_id then now() else client_read_at end,
    specialist_read_at = case when new.sender_id = specialist_id then now() else specialist_read_at end
  where id = new.conversation_id;
  return null;
end $$;
drop trigger if exists mp_after_message on public.mp_messages;
create trigger mp_after_message after insert on public.mp_messages
  for each row execute function public.mp_after_message();

alter table public.mp_conversations enable row level security;
alter table public.mp_messages enable row level security;
drop policy if exists mp_conv_select on public.mp_conversations;
create policy mp_conv_select on public.mp_conversations for select
  using (client_id = auth.uid() or specialist_id = auth.uid() or public.mp_is_admin());
drop policy if exists mp_conv_insert on public.mp_conversations;
create policy mp_conv_insert on public.mp_conversations for insert to authenticated with check (client_id = auth.uid());
drop policy if exists mp_conv_update on public.mp_conversations;
create policy mp_conv_update on public.mp_conversations for update
  using (client_id = auth.uid() or specialist_id = auth.uid() or public.mp_is_admin());
drop policy if exists mp_msg_select on public.mp_messages;
create policy mp_msg_select on public.mp_messages for select using (
  public.mp_is_admin() or exists (select 1 from public.mp_conversations c
    where c.id = conversation_id and (c.client_id = auth.uid() or c.specialist_id = auth.uid()))
);
drop policy if exists mp_msg_insert on public.mp_messages;
create policy mp_msg_insert on public.mp_messages for insert to authenticated with check (sender_id = auth.uid());

-- Specialists can see the client's name in their conversations
drop policy if exists mp_profiles_select on public.mp_profiles;
create policy mp_profiles_select on public.mp_profiles for select using (
  id = auth.uid()
  or public.mp_is_admin()
  or exists (select 1 from public.mp_specialists s where s.id = mp_profiles.id and (s.status = 'approved' or s.banned_at is not null))
  or exists (select 1 from public.mp_orders o where o.client_id = mp_profiles.id and o.specialist_id = auth.uid())
  or exists (select 1 from public.mp_conversations c where c.client_id = mp_profiles.id and c.specialist_id = auth.uid())
  or exists (select 1 from public.mp_reviews r where r.client_id = mp_profiles.id and not r.hidden)
);

-- ---------- 3. Order brief (structured, immutable after sending) ----------
alter table public.mp_orders add column if not exists brief jsonb;
create or replace function public.mp_guard_brief() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and not public.mp_is_admin() then new.brief := old.brief; end if;
  if new.brief is not null and pg_column_size(new.brief) > 2000 then raise exception 'brief_too_big'; end if;
  return new;
end $$;
drop trigger if exists mp_guard_brief on public.mp_orders;
create trigger mp_guard_brief before insert or update on public.mp_orders
  for each row execute function public.mp_guard_brief();

-- ---------- 4. Visit counter (no third-party analytics; no personal data) ----------
create table if not exists public.mp_visits (
  id bigint generated always as identity primary key,
  day date not null default (now() at time zone 'Asia/Dushanbe')::date,
  path text not null check (char_length(path) <= 120),
  locale text check (locale in ('tg', 'ru')),
  source text check (char_length(source) <= 40),
  created_at timestamptz not null default now()
);
create index if not exists mp_visits_day_idx on public.mp_visits(day);
alter table public.mp_visits enable row level security;
drop policy if exists mp_visits_select on public.mp_visits;
create policy mp_visits_select on public.mp_visits for select using (public.mp_is_admin());

create or replace function public.mp_track(p_path text, p_locale text, p_source text) returns void
language sql security definer set search_path = public as $$
  insert into public.mp_visits(path, locale, source)
  select left(coalesce(p_path, '/'), 120), case when p_locale in ('tg', 'ru') then p_locale end, left(nullif(p_source, ''), 40)
  where (select count(*) from public.mp_visits where created_at > now() - interval '1 minute') < 600;
$$;
grant execute on function public.mp_track(text, text, text) to anon, authenticated;
