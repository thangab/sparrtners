alter table public.session_requests
  add column if not exists canceled_at timestamptz,
  add column if not exists canceled_by uuid references auth.users(id) on delete set null,
  add column if not exists cancellation_reason text;

create or replace function public.cancel_accepted_session_request(
  p_request_id uuid,
  p_reason text default null
)
returns table (
  request_id uuid,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_session_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select sr.session_id
    into v_session_id
  from public.session_requests sr
  join public.sessions s on s.id = sr.session_id
  where sr.id = p_request_id
    and s.host_id = v_user_id
    and sr.status = 'accepted';

  if v_session_id is null then
    raise exception 'Accepted request not found';
  end if;

  update public.session_requests
  set
    status = 'declined',
    canceled_at = now(),
    canceled_by = v_user_id,
    cancellation_reason = nullif(trim(p_reason), '')
  where id = p_request_id;

  delete from public.session_participants
  where session_id = v_session_id
    and user_id = (
      select sr.user_id from public.session_requests sr where sr.id = p_request_id
    );

  return query
  select sr.id, sr.status
  from public.session_requests sr
  where sr.id = p_request_id;
end;
$$;

grant execute on function public.cancel_accepted_session_request(uuid, text) to authenticated;

create or replace function public.cancel_my_session_request(
  p_session_id uuid,
  p_reason text default null
)
returns table (
  request_id uuid,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_request_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select sr.id
    into v_request_id
  from public.session_requests sr
  where sr.session_id = p_session_id
    and sr.user_id = v_user_id
    and sr.status in ('pending', 'accepted')
  order by sr.created_at desc
  limit 1;

  if v_request_id is null then
    raise exception 'Request not found';
  end if;

  update public.session_requests
  set
    status = 'withdrawn',
    canceled_at = now(),
    canceled_by = v_user_id,
    cancellation_reason = nullif(trim(p_reason), '')
  where id = v_request_id;

  delete from public.session_participants
  where session_id = p_session_id
    and user_id = v_user_id;

  return query
  select sr.id, sr.status
  from public.session_requests sr
  where sr.id = v_request_id;
end;
$$;

grant execute on function public.cancel_my_session_request(uuid, text) to authenticated;
