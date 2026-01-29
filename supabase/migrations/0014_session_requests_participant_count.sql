alter table session_requests
  add column if not exists participant_count integer not null default 1;
