alter table public.messages
  add column if not exists read_at timestamptz,
  add column if not exists notified_at timestamptz;

create index if not exists messages_unread_idx
  on public.messages (conversation_id, read_at)
  where read_at is null;

create index if not exists messages_notified_idx
  on public.messages (notified_at)
  where notified_at is null;

drop policy if exists "messages_update" on public.messages;
create policy "messages_update" on public.messages
  for update using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
    and auth.uid() <> sender_id
  )
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
    and auth.uid() <> sender_id
  );
