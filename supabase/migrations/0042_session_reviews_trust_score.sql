alter table user_trust_scores
  add column if not exists review_count integer not null default 0;

alter table reviews
  add constraint reviews_rating_range
  check (rating >= 1 and rating <= 5);

create unique index if not exists reviews_session_reviewer_reviewed_idx
  on reviews (session_id, reviewer_id, reviewed_user_id)
  where session_id is not null;

create or replace function public.recompute_user_trust_score(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_avg numeric;
  v_count integer;
begin
  select coalesce(avg(rating)::numeric, 0), count(*)
    into v_avg, v_count
  from reviews
  where reviewed_user_id = p_user_id;

  insert into user_trust_scores (user_id, score, review_count, updated_at)
  values (p_user_id, v_avg, v_count, now())
  on conflict (user_id) do update
    set score = excluded.score,
        review_count = excluded.review_count,
        updated_at = excluded.updated_at;
end;
$$;

create or replace function public.handle_review_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    perform public.recompute_user_trust_score(new.reviewed_user_id);
    return new;
  elsif (tg_op = 'DELETE') then
    perform public.recompute_user_trust_score(old.reviewed_user_id);
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists on_review_insert on reviews;
create trigger on_review_insert
  after insert on reviews
  for each row execute procedure public.handle_review_change();

drop trigger if exists on_review_delete on reviews;
create trigger on_review_delete
  after delete on reviews
  for each row execute procedure public.handle_review_change();

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
        and s.starts_at + (coalesce(s.duration_minutes, 60) || ' minutes')::interval <= now()
        and (
          s.host_id = reviewer_id
          or exists (
            select 1 from session_participants sp
            where sp.session_id = s.id and sp.user_id = reviewer_id
          )
        )
        and (
          s.host_id = reviewed_user_id
          or exists (
            select 1 from session_participants sp2
            where sp2.session_id = s.id and sp2.user_id = reviewed_user_id
          )
        )
    )
  );
