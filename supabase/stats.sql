-- SMM.TJ — real public counters for the home page (social proof without fake numbers).
-- Run in Supabase → SQL Editor. Safe to re-run.
create or replace function public.mp_public_counts()
returns table (users bigint, specialists_registered bigint, specialists_approved bigint, completed_orders bigint, reviews bigint)
language sql stable security definer set search_path = public as $$
  select
    (select count(*) from public.mp_profiles where role <> 'admin'),
    (select count(*) from public.mp_specialists where banned_at is null),
    (select count(*) from public.mp_specialists where status = 'approved'),
    (select count(*) from public.mp_orders where status = 'done'),
    (select count(*) from public.mp_reviews where not hidden);
$$;
grant execute on function public.mp_public_counts() to anon, authenticated;
