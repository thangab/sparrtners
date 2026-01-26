create policy "profiles_insert" on profiles
  for insert with check (auth.uid() = id);
