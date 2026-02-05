create index if not exists messages_unread_notified_created_at_idx
  on public.messages (created_at)
  where read_at is null and notified_at is null;

create index if not exists sessions_starts_at_idx
  on public.sessions (starts_at);
