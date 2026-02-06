alter table public.session_requests
  add column if not exists participant_emails text[];
