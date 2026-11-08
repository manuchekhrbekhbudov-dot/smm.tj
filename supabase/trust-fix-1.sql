-- SMM.TJ fix: let the server remember which warning was already sent (no duplicate Telegram messages).
-- Run in Supabase → SQL Editor. Safe to re-run.
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
