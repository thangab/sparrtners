create or replace function public.update_profile_completion_score(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_completed integer := 0;
  v_total integer := 10;
begin
  if p_user_id is null then
    return;
  end if;

  select
    (case when coalesce(p.display_name, '') <> '' then 1 else 0 end) +
    (case when coalesce(p.gender, '') <> '' then 1 else 0 end) +
    (case when coalesce(p.firstname, '') <> '' then 1 else 0 end) +
    (case when coalesce(p.lastname, '') <> '' then 1 else 0 end) +
    (case when p.birthdate is not null then 1 else 0 end) +
    (case when coalesce(p.city, '') <> '' then 1 else 0 end) +
    (case when coalesce(p.dominant_hand, '') <> '' then 1 else 0 end) +
    (case when p.height_cm is not null then 1 else 0 end) +
    (case when p.weight_kg is not null then 1 else 0 end) +
    (case when exists (
      select 1
      from public.user_sport_profiles usp
      where usp.user_id = p_user_id
        and usp.discipline_id is not null
        and usp.skill_level_id is not null
    ) then 1 else 0 end)
  into v_completed
  from public.profiles p
  where p.id = p_user_id;

  insert into public.profile_completion_scores (user_id, percent, updated_at)
  values (p_user_id, round((v_completed::numeric / v_total) * 100), now())
  on conflict (user_id)
  do update set percent = excluded.percent, updated_at = excluded.updated_at;
end;
$$;

update public.profile_completion_scores pcs
set percent = (
  select round((
    (
      (case when coalesce(p.display_name, '') <> '' then 1 else 0 end) +
      (case when coalesce(p.gender, '') <> '' then 1 else 0 end) +
      (case when coalesce(p.firstname, '') <> '' then 1 else 0 end) +
      (case when coalesce(p.lastname, '') <> '' then 1 else 0 end) +
      (case when p.birthdate is not null then 1 else 0 end) +
      (case when coalesce(p.city, '') <> '' then 1 else 0 end) +
      (case when coalesce(p.dominant_hand, '') <> '' then 1 else 0 end) +
      (case when p.height_cm is not null then 1 else 0 end) +
      (case when p.weight_kg is not null then 1 else 0 end) +
      (case when exists (
        select 1
        from public.user_sport_profiles usp
        where usp.user_id = p.id
          and usp.discipline_id is not null
          and usp.skill_level_id is not null
      ) then 1 else 0 end)
    )::numeric / 10
  ) * 100)
  from public.profiles p
  where p.id = pcs.user_id
),
updated_at = now();
