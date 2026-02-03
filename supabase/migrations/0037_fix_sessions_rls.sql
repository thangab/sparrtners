drop policy if exists "sessions_select" on public.sessions;
drop policy if exists "sessions_update" on public.sessions;

create policy "sessions_select" on public.sessions
  for select using (
    is_published = true
    or auth.uid() = host_id
    or exists (
      select 1
      from public.session_requests sr
      where sr.session_id = sessions.id
        and sr.user_id = auth.uid()
    )
  );

create policy "sessions_update" on public.sessions
  for update using (auth.uid() = host_id)
  with check (auth.uid() = host_id);
