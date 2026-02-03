alter table public.entitlements
  add column if not exists bonus_boosts_granted boolean not null default false;
