create table if not exists session_disciplines (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  discipline_id bigint not null references disciplines(id),
  skill_level_id bigint references skill_levels(id),
  created_at timestamptz not null default now(),
  unique (session_id, discipline_id)
);

create index if not exists session_disciplines_session_idx on session_disciplines (session_id);

insert into session_disciplines (session_id, discipline_id, skill_level_id)
select id, discipline_id, skill_level_id
from sessions
where discipline_id is not null
on conflict (session_id, discipline_id) do nothing;

alter table session_disciplines enable row level security;

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

drop view if exists session_listings;

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
