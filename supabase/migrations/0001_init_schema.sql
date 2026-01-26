create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  firstname text,
  lastname text,
  nickname text,
  birthdate date,
  city text,
  languages text[],
  bio text,
  created_at timestamptz not null default now()
);

create table if not exists user_trust_scores (
  user_id uuid primary key references auth.users(id) on delete cascade,
  score numeric not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists disciplines (
  id bigserial primary key,
  name text not null unique
);

create table if not exists skill_levels (
  id bigserial primary key,
  name text not null unique
);

create table if not exists training_types (
  id bigserial primary key,
  name text not null unique
);

create table if not exists places (
  id bigserial primary key,
  name text not null,
  address text,
  city text,
  lat numeric,
  lng numeric
);

create table if not exists user_sport_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  discipline_id bigint not null references disciplines(id),
  skill_level_id bigint references skill_levels(id),
  height_cm integer,
  weight_kg integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, discipline_id)
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references auth.users(id) on delete cascade,
  discipline_id bigint not null references disciplines(id),
  skill_level_id bigint references skill_levels(id),
  training_type_id bigint references training_types(id),
  place_id bigint references places(id),
  title text not null,
  description text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  capacity integer not null default 2,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists session_requests (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  unique (session_id, user_id)
);

create table if not exists session_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'participant',
  created_at timestamptz not null default now(),
  unique (session_id, user_id)
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid not null references auth.users(id) on delete cascade,
  reviewed_user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid references sessions(id) on delete set null,
  rating integer not null,
  comment text,
  created_at timestamptz not null default now()
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_user_id uuid references auth.users(id) on delete set null,
  session_id uuid references sessions(id) on delete set null,
  reason text not null,
  created_at timestamptz not null default now()
);

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

create table if not exists session_disciplines (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  discipline_id bigint not null references disciplines(id),
  skill_level_id bigint references skill_levels(id),
  created_at timestamptz not null default now(),
  unique (session_id, discipline_id)
);

create index if not exists sessions_starts_at_idx on sessions (starts_at);
create index if not exists session_requests_session_idx on session_requests (session_id);
create index if not exists session_boosts_session_idx on session_boosts (session_id);
create index if not exists session_boosts_ends_at_idx on session_boosts (ends_at);
create index if not exists session_disciplines_session_idx on session_disciplines (session_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  )
  on conflict (id) do nothing;

  insert into public.user_trust_scores (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.is_premium(p_user_id uuid)
returns boolean
language sql
stable
as $$
  select coalesce(
    (select (e.is_lifetime or (e.premium_until is not null and e.premium_until > now()))
     from entitlements e
     where e.user_id = p_user_id),
    false
  );
$$;

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
  t.name as training_type_name,
  p.name as place_name,
  p.city as city,
  (sb.ends_at is not null and sb.ends_at > now()) as is_boosted,
  sb.ends_at as boost_ends_at,
  coalesce(
    json_agg(
      distinct jsonb_build_object(
        'discipline_id', sd.discipline_id,
        'discipline_name', d.name,
        'skill_level_id', sd.skill_level_id,
        'skill_level_name', sl.name
      )
    ) filter (where sd.discipline_id is not null),
    '[]'::json
  ) as disciplines
from sessions s
left join session_disciplines sd on sd.session_id = s.id
left join disciplines d on d.id = sd.discipline_id
left join skill_levels sl on sl.id = sd.skill_level_id
left join training_types t on t.id = s.training_type_id
left join places p on p.id = s.place_id
left join lateral (
  select ends_at
  from session_boosts
  where session_id = s.id and ends_at > now()
  order by ends_at desc
  limit 1
) sb on true
where s.is_published = true
group by s.id, t.name, p.name, p.city, sb.ends_at;

alter table profiles enable row level security;
alter table user_trust_scores enable row level security;
alter table disciplines enable row level security;
alter table skill_levels enable row level security;
alter table training_types enable row level security;
alter table places enable row level security;
alter table user_sport_profiles enable row level security;
alter table sessions enable row level security;
alter table session_requests enable row level security;
alter table session_participants enable row level security;
alter table reviews enable row level security;
alter table reports enable row level security;
alter table entitlements enable row level security;
alter table boost_credits enable row level security;
alter table session_boosts enable row level security;
alter table session_disciplines enable row level security;

create policy "profiles_select" on profiles
  for select using (auth.role() = 'authenticated');

create policy "profiles_insert" on profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "user_trust_scores_select" on user_trust_scores
  for select using (auth.role() = 'authenticated');

create policy "disciplines_select" on disciplines
  for select using (true);

create policy "skill_levels_select" on skill_levels
  for select using (true);

create policy "training_types_select" on training_types
  for select using (true);

create policy "places_select" on places
  for select using (true);

create policy "user_sport_profiles_select" on user_sport_profiles
  for select using (auth.uid() = user_id);

create policy "user_sport_profiles_insert" on user_sport_profiles
  for insert with check (auth.uid() = user_id);

create policy "user_sport_profiles_update" on user_sport_profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "sessions_select" on sessions
  for select using (is_published = true);

create policy "sessions_insert" on sessions
  for insert with check (
    auth.uid() = host_id
    and (
      public.is_premium(auth.uid())
      or (
        select count(*)
        from sessions s
        where s.host_id = auth.uid()
          and date_trunc('month', s.created_at) = date_trunc('month', now())
      ) < 4
    )
  );

create policy "sessions_update" on sessions
  for update using (auth.uid() = host_id) with check (auth.uid() = host_id);

create policy "sessions_delete" on sessions
  for delete using (auth.uid() = host_id);

create policy "session_requests_select" on session_requests
  for select using (
    auth.uid() = user_id or
    exists (select 1 from sessions s where s.id = session_id and s.host_id = auth.uid())
  );

create policy "session_requests_insert" on session_requests
  for insert with check (auth.uid() = user_id);

create policy "session_requests_update" on session_requests
  for update using (
    exists (select 1 from sessions s where s.id = session_id and s.host_id = auth.uid())
  )
  with check (
    exists (select 1 from sessions s where s.id = session_id and s.host_id = auth.uid())
  );

create policy "session_participants_select" on session_participants
  for select using (
    auth.uid() = user_id or
    exists (select 1 from sessions s where s.id = session_id and s.host_id = auth.uid())
  );

create policy "session_participants_insert" on session_participants
  for insert with check (
    exists (select 1 from sessions s where s.id = session_id and s.host_id = auth.uid())
  );

create policy "reviews_select" on reviews
  for select using (auth.role() = 'authenticated');

create policy "reviews_insert" on reviews
  for insert with check (auth.uid() = reviewer_id);

create policy "reports_insert" on reports
  for insert with check (auth.uid() = reporter_id);

create policy "entitlements_select" on entitlements
  for select using (auth.uid() = user_id);

create policy "boost_credits_select" on boost_credits
  for select using (auth.uid() = user_id);

create policy "session_boosts_select" on session_boosts
  for select using (true);

create policy "session_disciplines_select" on session_disciplines
  for select using (true);

create policy "session_disciplines_insert" on session_disciplines
  for insert with check (
    exists (
      select 1 from sessions s
      where s.id = session_id and s.host_id = auth.uid()
    )
  );

create policy "session_disciplines_update" on session_disciplines
  for update using (
    exists (
      select 1 from sessions s
      where s.id = session_id and s.host_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from sessions s
      where s.id = session_id and s.host_id = auth.uid()
    )
  );

create policy "session_disciplines_delete" on session_disciplines
  for delete using (
    exists (
      select 1 from sessions s
      where s.id = session_id and s.host_id = auth.uid()
    )
  );
