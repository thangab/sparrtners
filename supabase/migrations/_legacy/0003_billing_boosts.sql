create table if not exists entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text,
  premium_until timestamptz,
  is_lifetime boolean not null default false,
  updated_at timestamptz not null default now(),
  source text
);

create table if not exists boost_credits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  credits integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists session_boosts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists session_boosts_session_idx on session_boosts (session_id);
create index if not exists session_boosts_ends_at_idx on session_boosts (ends_at);

create or replace function public.boost_session(p_session_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_credits integer;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (select 1 from sessions s where s.id = p_session_id and s.host_id = v_user_id) then
    raise exception 'Not session host';
  end if;

  insert into boost_credits (user_id, credits)
  values (v_user_id, 0)
  on conflict (user_id) do nothing;

  select credits into v_credits from boost_credits where user_id = v_user_id for update;

  if v_credits < 1 then
    raise exception 'Insufficient credits';
  end if;

  update boost_credits
    set credits = credits - 1, updated_at = now()
    where user_id = v_user_id;

  insert into session_boosts (session_id, user_id, ends_at)
  values (p_session_id, v_user_id, now() + interval '24 hours');
end;
$$;

grant execute on function public.boost_session(uuid) to authenticated;

create or replace view session_listings as
select
  s.id,
  s.title,
  s.description,
  s.starts_at,
  s.ends_at,
  s.capacity,
  s.host_id,
  s.discipline_id,
  s.training_type_id,
  s.place_id,
  d.name as discipline_name,
  t.name as training_type_name,
  p.name as place_name,
  p.city as city,
  (sb.ends_at is not null and sb.ends_at > now()) as is_boosted,
  sb.ends_at as boost_ends_at
from sessions s
left join disciplines d on d.id = s.discipline_id
left join training_types t on t.id = s.training_type_id
left join places p on p.id = s.place_id
left join lateral (
  select ends_at
  from session_boosts
  where session_id = s.id and ends_at > now()
  order by ends_at desc
  limit 1
) sb on true
where s.is_published = true;

alter table entitlements enable row level security;
alter table boost_credits enable row level security;
alter table session_boosts enable row level security;

create policy "entitlements_select" on entitlements
  for select using (auth.uid() = user_id);

create policy "boost_credits_select" on boost_credits
  for select using (auth.uid() = user_id);

create policy "session_boosts_select" on session_boosts
  for select using (true);
