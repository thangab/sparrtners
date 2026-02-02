create table if not exists public.profile_completion_scores (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  percent integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.profile_completion_scores enable row level security;

create policy "profile_completion_scores_select_own"
  on public.profile_completion_scores
  for select
  to authenticated
  using (user_id = auth.uid());

create or replace function public.update_profile_completion_score(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_completed integer := 0;
  v_total integer := 12;
begin
  if p_user_id is null then
    return;
  end if;

  select
    (case when coalesce(p.display_name, '') <> '' then 1 else 0 end) +
    (case when coalesce(p.gender, '') <> '' then 1 else 0 end) +
    (case when coalesce(p.firstname, '') <> '' then 1 else 0 end) +
    (case when coalesce(p.lastname, '') <> '' then 1 else 0 end) +
    (case when coalesce(p.nickname, '') <> '' then 1 else 0 end) +
    (case when p.birthdate is not null then 1 else 0 end) +
    (case when coalesce(p.city, '') <> '' then 1 else 0 end) +
    (case when coalesce(p.dominant_hand, '') <> '' then 1 else 0 end) +
    (case when p.height_cm is not null then 1 else 0 end) +
    (case when p.weight_kg is not null then 1 else 0 end) +
    (case when coalesce(p.avatar_url, '') <> '' then 1 else 0 end) +
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

create or replace function public.profile_completion_scores_profiles_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.update_profile_completion_score(new.id);
  return new;
end;
$$;

create trigger profiles_completion_scores_trigger
after insert or update on public.profiles
for each row
execute procedure public.profile_completion_scores_profiles_trigger();

create or replace function public.profile_completion_scores_user_sport_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  v_user_id := coalesce(new.user_id, old.user_id);
  perform public.update_profile_completion_score(v_user_id);
  return coalesce(new, old);
end;
$$;

create trigger user_sport_profiles_completion_scores_trigger
after insert or update or delete on public.user_sport_profiles
for each row
execute procedure public.profile_completion_scores_user_sport_trigger();

insert into public.profile_completion_scores (user_id, percent, updated_at)
select p.id, 0, now()
from public.profiles p
on conflict (user_id) do nothing;

update public.profile_completion_scores pcs
set percent = (
  select round((
    (
      (case when coalesce(p.display_name, '') <> '' then 1 else 0 end) +
      (case when coalesce(p.gender, '') <> '' then 1 else 0 end) +
      (case when coalesce(p.firstname, '') <> '' then 1 else 0 end) +
      (case when coalesce(p.lastname, '') <> '' then 1 else 0 end) +
      (case when coalesce(p.nickname, '') <> '' then 1 else 0 end) +
      (case when p.birthdate is not null then 1 else 0 end) +
      (case when coalesce(p.city, '') <> '' then 1 else 0 end) +
      (case when coalesce(p.dominant_hand, '') <> '' then 1 else 0 end) +
      (case when p.height_cm is not null then 1 else 0 end) +
      (case when p.weight_kg is not null then 1 else 0 end) +
      (case when coalesce(p.avatar_url, '') <> '' then 1 else 0 end) +
      (case when exists (
        select 1
        from public.user_sport_profiles usp
        where usp.user_id = p.id
          and usp.discipline_id is not null
          and usp.skill_level_id is not null
      ) then 1 else 0 end)
    )::numeric / 12
  ) * 100)
  from public.profiles p
  where p.id = pcs.user_id
),
updated_at = now();
