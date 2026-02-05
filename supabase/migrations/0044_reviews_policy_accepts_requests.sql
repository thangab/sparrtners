drop policy if exists "reviews_insert" on reviews;
create policy "reviews_insert" on reviews
  for insert
  with check (
    auth.uid() = reviewer_id
    and reviewer_id <> reviewed_user_id
    and session_id is not null
    and exists (
      select 1
      from sessions s
      where s.id = session_id
        and s.is_published = true
        and s.starts_at + (coalesce(s.duration_minutes, 60) || ' minutes')::interval <= now()
        and (
          s.host_id = reviewer_id
          or exists (
            select 1 from session_participants sp
            where sp.session_id = s.id and sp.user_id = reviewer_id
          )
          or exists (
            select 1 from session_requests sr
            where sr.session_id = s.id
              and sr.user_id = reviewer_id
              and sr.status = 'accepted'
          )
        )
        and (
          s.host_id = reviewed_user_id
          or exists (
            select 1 from session_participants sp2
            where sp2.session_id = s.id and sp2.user_id = reviewed_user_id
          )
          or exists (
            select 1 from session_requests sr2
            where sr2.session_id = s.id
              and sr2.user_id = reviewed_user_id
              and sr2.status = 'accepted'
          )
        )
    )
  );
