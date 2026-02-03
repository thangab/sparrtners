create or replace function public.can_view_unpublished_session(
  p_session_id uuid,
  p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.session_requests sr
    where sr.session_id = p_session_id
      and sr.user_id = p_user_id
  );
$$;

drop policy if exists "sessions_select" on public.sessions;

create policy "sessions_select" on public.sessions
  for select using (
    is_published = true
    or auth.uid() = host_id
    or public.can_view_unpublished_session(id, auth.uid())
  );
