-- =====================================================================
-- SMM.TJ — paid plans for specialists (Топ 100 / Стандарт 200 / Премиум 300 TJS, 30 days)
-- Payment: transfer to Alif 504440101, upload the receipt; it is checked automatically
-- (Edge Function "receipt-check") or by the director. Run in Supabase → SQL Editor.
-- Safe to re-run.
-- =====================================================================

alter table public.mp_specialists add column if not exists plan text
  check (plan in ('top', 'standard', 'premium'));
alter table public.mp_specialists add column if not exists plan_until timestamptz;

-- Plan fields can be changed only by an approved payment (internal) or the director.
create or replace function public.mp_guard_plan() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(current_setting('app.internal', true), '') = '1' or public.mp_is_admin() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.plan := null; new.plan_until := null;
  else
    new.plan := old.plan; new.plan_until := old.plan_until;
  end if;
  return new;
end $$;
drop trigger if exists mp_guard_plan on public.mp_specialists;
create trigger mp_guard_plan before insert or update on public.mp_specialists
  for each row execute function public.mp_guard_plan();

create or replace function public.mp_plan_price(p text) returns int
language sql immutable as $$
  select case p when 'top' then 100 when 'standard' then 200 when 'premium' then 300 end;
$$;

-- ---------- payments ----------
create table if not exists public.mp_payments (
  id uuid primary key default gen_random_uuid(),
  specialist_id uuid not null references public.mp_specialists(id) on delete cascade,
  plan text not null check (plan in ('top', 'standard', 'premium')),
  amount_tjs int not null,
  receipt_path text not null check (char_length(receipt_path) <= 300),
  receipt_hash text,
  status text not null default 'checking' check (status in ('checking', 'review', 'approved', 'rejected')),
  reason text check (char_length(reason) <= 500),
  ai_result jsonb,
  transaction_id text check (char_length(transaction_id) <= 100),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
create index if not exists mp_payments_specialist_idx on public.mp_payments(specialist_id, created_at desc);
create unique index if not exists mp_payments_tx_uniq on public.mp_payments(transaction_id)
  where transaction_id is not null and status = 'approved';

create or replace function public.mp_guard_payment() returns trigger
language plpgsql security definer set search_path = public as $$
-- service role (Edge Function) or SQL editor; never a signed-in user
declare service boolean := coalesce(auth.role(), '') = 'service_role'
  or (auth.uid() is null and coalesce(auth.role(), '') not in ('anon', 'authenticated'));
begin
  if tg_op = 'INSERT' then
    if service then return new; end if;
    if new.specialist_id is distinct from auth.uid() then raise exception 'forbidden'; end if;
    if not exists (select 1 from public.mp_specialists where id = new.specialist_id and status = 'approved') then
      raise exception 'specialist_not_approved';
    end if;
    if (select count(*) from public.mp_payments
         where specialist_id = new.specialist_id and created_at > now() - interval '1 day') >= 5 then
      raise exception 'too_many_payments';
    end if;
    if exists (select 1 from public.mp_payments
         where specialist_id = new.specialist_id and status in ('checking', 'review')) then
      raise exception 'payment_in_progress';
    end if;
    if split_part(new.receipt_path, '/', 1) <> auth.uid()::text then raise exception 'bad_receipt_path'; end if;
    new.amount_tjs := public.mp_plan_price(new.plan);
    new.status := 'checking';
    new.reason := null; new.ai_result := null; new.transaction_id := null;
    new.receipt_hash := null; new.decided_at := null; new.created_at := now();
    return new;
  end if;
  -- UPDATE: only the checker (service role) or the director
  if not service and not public.mp_is_admin() then raise exception 'forbidden'; end if;
  new.specialist_id := old.specialist_id; new.plan := old.plan; new.amount_tjs := old.amount_tjs;
  new.receipt_path := old.receipt_path; new.created_at := old.created_at;
  if old.status = 'approved' and new.status <> 'approved' then raise exception 'already_approved'; end if;
  if new.status in ('approved', 'rejected') and old.status <> new.status then new.decided_at := now(); end if;
  return new;
end $$;
drop trigger if exists mp_guard_payment on public.mp_payments;
create trigger mp_guard_payment before insert or update on public.mp_payments
  for each row execute function public.mp_guard_payment();

-- Approved payment → activate / extend the plan for 30 days.
create or replace function public.mp_apply_payment() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    perform set_config('app.internal', '1', true);
    update public.mp_specialists s set
      plan = new.plan,
      plan_until = case
        when s.plan = new.plan and s.plan_until > now() then s.plan_until
        else now() end + interval '30 days'
    where s.id = new.specialist_id;
    perform set_config('app.internal', '', true);
  end if;
  return null;
end $$;
drop trigger if exists mp_apply_payment on public.mp_payments;
create trigger mp_apply_payment after update on public.mp_payments
  for each row execute function public.mp_apply_payment();

alter table public.mp_payments enable row level security;
drop policy if exists mp_payments_select on public.mp_payments;
create policy mp_payments_select on public.mp_payments for select
  using (specialist_id = auth.uid() or public.mp_is_admin());
drop policy if exists mp_payments_insert on public.mp_payments;
create policy mp_payments_insert on public.mp_payments for insert to authenticated
  with check (specialist_id = auth.uid());
drop policy if exists mp_payments_update on public.mp_payments;
create policy mp_payments_update on public.mp_payments for update using (public.mp_is_admin());

-- ---------- storage: private receipts ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('mp-receipts', 'mp-receipts', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists mp_receipts_read on storage.objects;
create policy mp_receipts_read on storage.objects for select to authenticated
  using (bucket_id = 'mp-receipts' and ((storage.foldername(name))[1] = auth.uid()::text or public.mp_is_admin()));
drop policy if exists mp_receipts_write on storage.objects;
create policy mp_receipts_write on storage.objects for insert to authenticated
  with check (bucket_id = 'mp-receipts' and (storage.foldername(name))[1] = auth.uid()::text);
