create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(new.raw_user_meta_data->>'full_name', ''),
      nullif(split_part(new.email, '@', 1), ''),
      new.email
    )
  )
  on conflict (id) do nothing;

  insert into public.user_trust_scores (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;
