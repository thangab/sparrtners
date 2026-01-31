create or replace view public_profiles as
select
  id,
  display_name,
  city,
  bio,
  club,
  dominant_hand,
  height_cm,
  weight_kg,
  gender,
  created_at,
  avatar_url
from profiles;

grant select on public_profiles to anon, authenticated;
