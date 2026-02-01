drop policy if exists "session_participants_insert" on session_participants;

create policy "session_participants_insert" on session_participants
  for insert with check (
    exists (
      select 1 from sessions s
      where s.id = session_id
        and s.host_id = auth.uid()
    )
  );
