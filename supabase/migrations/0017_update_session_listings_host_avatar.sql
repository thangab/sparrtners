drop view if exists session_listings;

create or replace view session_listings as
select
  s.id,
  s.title,
  s.description,
  s.starts_at,
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
