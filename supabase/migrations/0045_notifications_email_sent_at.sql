alter table public.notifications
  add column if not exists email_sent_at timestamptz;

create index if not exists notifications_review_email_idx
  on public.notifications (recipient_id, type, email_sent_at);
