alter table profiles
  add column if not exists height_cm integer,
  add column if not exists weight_kg integer;

update profiles
set
  height_cm = coalesce(height_cm, (
    select max(height_cm)
    from user_sport_profiles
    where user_id = profiles.id
  )),
  weight_kg = coalesce(weight_kg, (
    select max(weight_kg)
    from user_sport_profiles
    where user_id = profiles.id
  ));

alter table user_sport_profiles
  drop column if exists height_cm,
  drop column if exists weight_kg;
