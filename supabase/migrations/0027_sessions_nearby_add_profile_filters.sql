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
  weight_min integer,
  weight_max integer,
  height_min integer,
  height_max integer,
  dominant_hand text,
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
    s.weight_min,
    s.weight_max,
    s.height_min,
    s.height_max,
    s.dominant_hand,
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
