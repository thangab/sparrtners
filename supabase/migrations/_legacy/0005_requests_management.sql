alter table session_requests enable row level security;

create policy "session_requests_update" on session_requests
  for update using (
    exists (select 1 from sessions s where s.id = session_id and s.host_id = auth.uid())
  )
  with check (
    exists (select 1 from sessions s where s.id = session_id and s.host_id = auth.uid())
  );

alter table session_participants enable row level security;

create policy "session_participants_insert_host" on session_participants
  for insert with check (
    exists (select 1 from sessions s where s.id = session_id and s.host_id = auth.uid())
  );
