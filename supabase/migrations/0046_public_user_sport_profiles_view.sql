create or replace view public_user_sport_profiles as
select
  usp.user_id,
  usp.discipline_id,
  usp.skill_level_id,
  d.name as discipline_name,
  sl.name as skill_level_name
from public.user_sport_profiles usp
join public.disciplines d on d.id = usp.discipline_id
left join public.skill_levels sl on sl.id = usp.skill_level_id;

grant select on public_user_sport_profiles to anon, authenticated;
