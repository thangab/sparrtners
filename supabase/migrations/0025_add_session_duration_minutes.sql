alter table public.sessions
  add column if not exists duration_minutes integer not null default 60;

drop view if exists session_listings;

create or replace view session_listings as
select
  s.id,
  s.title,
  s.description,
  s.starts_at,
  s.duration_minutes,
  s.capacity,
  s.host_id,
  pr.display_name as host_display_name,
  pr.email as host_email,
  pr.avatar_url as host_avatar_url,
  s.discipline_id,
  s.training_type_id,
  s.place_id,
  t.name as training_type_name,
  p.name as place_name,
  p.city as city,
  p.lat as place_lat,
  p.lng as place_lng,
  s.weight_min,
  s.weight_max,
  s.height_min,
  s.height_max,
  s.dominant_hand,
  s.glove_size,
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
left join profiles pr on pr.id = s.host_id
left join lateral (
  select ends_at
  from session_boosts
  where session_id = s.id and ends_at > now()
  order by ends_at desc
  limit 1
) sb on true
where s.is_published = true
group by s.id, t.name, p.name, p.city, p.lat, p.lng, sb.ends_at, pr.display_name, pr.email, pr.avatar_url;

drop function if exists public.sessions_nearby(double precision, double precision, integer);

create or replace function public.sessions_nearby(
  p_lat double precision,
  p_lng double precision,
  p_radius_km integer default 25
)
returns table (
  id uuid,
  title text,
  starts_at timestamptz,
  duration_minutes integer,
  place_name text,
  city text,
  place_lat double precision,
  place_lng double precision,
  is_boosted boolean,
  disciplines json,
  host_id uuid,
  host_display_name text,
  host_email text,
  distance_km double precision
)
language sql
stable
as $$
  select
    s.id,
    s.title,
    s.starts_at,
    s.duration_minutes,
    s.place_name,
    s.city,
    s.place_lat,
    s.place_lng,
    s.is_boosted,
    s.disciplines,
    s.host_id,
    s.host_display_name,
    s.host_email,
    st_distance(p.geog, st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography) / 1000 as distance_km
  from session_listings s
  join places p on p.id = s.place_id
  where p.geog is not null
    and st_dwithin(
      p.geog,
      st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography,
      p_radius_km * 1000
    )
  order by s.is_boosted desc, s.starts_at asc;
$$;

grant execute on function public.sessions_nearby(double precision, double precision, integer) to anon, authenticated;
