create or replace function public.accept_session_request(
  p_request_id uuid,
  p_decision text
)
returns table (
  id uuid,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session_id uuid;
  v_host_id uuid;
begin
  select sr.session_id, s.host_id
    into v_session_id, v_host_id
  from session_requests sr
  join sessions s on s.id = sr.session_id
  where sr.id = p_request_id;

  if v_session_id is null then
    raise exception 'Request not found';
  end if;

  if v_host_id <> auth.uid() then
    raise exception 'Not allowed';
  end if;

  update session_requests
    set status = p_decision
  where session_requests.id = p_request_id;

  if p_decision = 'accepted' then
    insert into session_participants (session_id, user_id, role)
    select sr.session_id, sr.user_id, 'participant'
    from session_requests sr
    where sr.id = p_request_id
    on conflict (session_id, user_id) do nothing;
  end if;

  return query
  select sr.id, sr.status
  from session_requests sr
  where sr.id = p_request_id;
end;
$$;

grant execute on function public.accept_session_request(uuid, text) to authenticated;
