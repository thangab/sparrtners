alter table public.session_requests
  add column if not exists message text;
