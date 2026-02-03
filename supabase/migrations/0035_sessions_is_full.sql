alter table public.sessions
  add column if not exists is_full boolean not null default false;

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
  s.is_full,
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

drop function if exists public.sessions_nearby(
  double precision,
  double precision,
  integer,
  integer,
  integer,
  date,
  date,
  text[],
  text[],
  integer,
  integer,
  integer,
  integer,
  bigint[],
  integer,
  integer
);

create or replace function public.sessions_nearby(
  p_lat double precision default null,
  p_lng double precision default null,
  p_radius_km integer default 25,
  p_limit integer default 10,
  p_offset integer default 0,
  p_date_start date default null,
  p_date_end date default null,
  p_disciplines text[] default null,
  p_dominant_hands text[] default null,
  p_height_min integer default null,
  p_height_max integer default null,
  p_weight_min integer default null,
  p_weight_max integer default null,
  p_training_type_ids bigint[] default null,
  p_duration_min integer default null,
  p_duration_max integer default null
)
returns table (
  id uuid,
  title text,
  starts_at timestamptz,
  duration_minutes integer,
  training_type_name text,
  place_name text,
  city text,
  place_lat double precision,
  place_lng double precision,
  is_boosted boolean,
  disciplines json,
  weight_min integer,
  weight_max integer,
  height_min integer,
  height_max integer,
  dominant_hand text,
  host_id uuid,
  host_display_name text,
  host_email text,
  host_avatar_url text,
  is_full boolean,
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
    s.training_type_name,
    s.place_name,
    s.city,
    s.place_lat,
    s.place_lng,
    s.is_boosted,
    s.disciplines,
    s.weight_min,
    s.weight_max,
    s.height_min,
    s.height_max,
    s.dominant_hand,
    s.host_id,
    s.host_display_name,
    s.host_email,
    s.host_avatar_url,
    s.is_full,
    case
      when p_lat is not null and p_lng is not null and p.geog is not null
        then st_distance(
          p.geog,
          st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography
        ) / 1000
      else null
    end as distance_km
  from session_listings s
  join places p on p.id = s.place_id
  where (
      p_lat is null
      or p_lng is null
      or (
        p.geog is not null
        and st_dwithin(
          p.geog,
          st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography,
          p_radius_km * 1000
        )
      )
    )
    and (p_date_start is null or s.starts_at::date >= p_date_start)
    and (p_date_end is null or s.starts_at::date <= p_date_end)
    and (
      p_disciplines is null
      or exists (
        select 1
        from jsonb_array_elements(coalesce(s.disciplines::jsonb, '[]'::jsonb)) as elem
        where lower(elem->>'discipline_name') = any(p_disciplines)
      )
    )
    and (
      p_dominant_hands is null
      or s.dominant_hand is null
      or s.dominant_hand = any(p_dominant_hands)
    )
    and (
      p_height_min is null and p_height_max is null
      or not (
        coalesce(p_height_max, 2147483647) < coalesce(s.height_min, -2147483648)
        or coalesce(p_height_min, -2147483648) > coalesce(s.height_max, 2147483647)
      )
    )
    and (
      p_weight_min is null and p_weight_max is null
      or not (
        coalesce(p_weight_max, 2147483647) < coalesce(s.weight_min, -2147483648)
        or coalesce(p_weight_min, -2147483648) > coalesce(s.weight_max, 2147483647)
      )
    )
    and (
      p_training_type_ids is null
      or s.training_type_id = any(p_training_type_ids)
    )
    and (p_duration_min is null or s.duration_minutes >= p_duration_min)
    and (p_duration_max is null or s.duration_minutes <= p_duration_max)
  order by
    s.is_boosted desc,
    case
      when p_lat is not null and p_lng is not null and p.geog is not null
        then st_distance(
          p.geog,
          st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography
        )
      else null
    end asc nulls last,
    s.starts_at asc
  limit greatest(p_limit, 0)
  offset greatest(p_offset, 0);
$$;

grant execute on function public.sessions_nearby(
  double precision,
  double precision,
  integer,
  integer,
  integer,
  date,
  date,
  text[],
  text[],
  integer,
  integer,
  integer,
  integer,
  bigint[],
  integer,
  integer
) to anon, authenticated;
