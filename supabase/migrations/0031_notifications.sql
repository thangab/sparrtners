create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type text not null,
  title text not null,
  body text,
  data jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_recipient_read_at_idx
  on public.notifications (recipient_id, read_at);

create index if not exists notifications_recipient_created_at_idx
  on public.notifications (recipient_id, created_at desc);

alter table public.notifications enable row level security;

create policy "notifications_select_own"
  on public.notifications
  for select
  to authenticated
  using (recipient_id = auth.uid());

create policy "notifications_update_own"
  on public.notifications
  for update
  to authenticated
  using (recipient_id = auth.uid());

create policy "notifications_insert_own"
  on public.notifications
  for insert
  to authenticated
  with check (recipient_id = auth.uid());

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

  insert into public.notifications (recipient_id, actor_id, type, title, body, data)
  values (
    v_host_id,
    new.user_id,
    'session_request_received',
    'Nouvelle demande',
    'Un combattant a demandé à rejoindre ta session.',
    jsonb_build_object('session_id', new.session_id, 'request_id', new.id)
  );

  return new;
end;
$$;

drop trigger if exists session_requests_notify_insert on public.session_requests;
create trigger session_requests_notify_insert
after insert on public.session_requests
for each row
execute procedure public.notify_session_request_received();

create or replace function public.notify_session_request_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_host_id uuid;
  v_title text;
  v_body text;
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
    v_title := 'Demande acceptée';
    v_body := 'Ta demande a été acceptée.';
  else
    v_title := 'Demande refusée';
    v_body := 'Ta demande a été refusée.';
  end if;

  insert into public.notifications (recipient_id, actor_id, type, title, body, data)
  values (
    new.user_id,
    v_host_id,
    'session_request_status',
    v_title,
    v_body,
    jsonb_build_object('session_id', new.session_id, 'request_id', new.id, 'status', new.status)
  );

  return new;
end;
$$;

drop trigger if exists session_requests_notify_status on public.session_requests;
create trigger session_requests_notify_status
after update on public.session_requests
for each row
execute procedure public.notify_session_request_status();
