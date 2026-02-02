alter table public.notifications
  alter column title drop not null,
  alter column body drop not null;

drop trigger if exists session_requests_notify_insert on public.session_requests;
drop trigger if exists session_requests_notify_status on public.session_requests;

create or replace function public.notify_session_request_received()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_host_id uuid;
begin
  select host_id into v_host_id
  from public.sessions
  where id = new.session_id;

  if v_host_id is null then
    return new;
  end if;

  insert into public.notifications (recipient_id, actor_id, type, data)
  values (
    v_host_id,
    new.user_id,
    'session_request_received',
    jsonb_build_object('session_id', new.session_id, 'request_id', new.id)
  );

  return new;
end;
$$;

create or replace function public.notify_session_request_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_host_id uuid;
  v_type text;
begin
  if new.status is null or new.status = old.status then
    return new;
  end if;

  if new.status not in ('accepted', 'refused') then
    return new;
  end if;

  select host_id into v_host_id
  from public.sessions
  where id = new.session_id;

  if v_host_id is null then
    return new;
  end if;

  if new.status = 'accepted' then
    v_type := 'session_request_accepted';
  else
    v_type := 'session_request_refused';
  end if;

  insert into public.notifications (recipient_id, actor_id, type, data)
  values (
    new.user_id,
    v_host_id,
    v_type,
    jsonb_build_object('session_id', new.session_id, 'request_id', new.id, 'status', new.status)
  );

  return new;
end;
$$;

create trigger session_requests_notify_insert
after insert on public.session_requests
for each row
execute procedure public.notify_session_request_received();

create trigger session_requests_notify_status
after update on public.session_requests
for each row
execute procedure public.notify_session_request_status();

update public.notifications
set title = null,
    body = null
where title is not null
   or body is not null;
