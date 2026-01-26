create or replace function public.is_premium(p_user_id uuid)
returns boolean
language sql
stable
as $$
  select coalesce(
    (select (e.is_lifetime or (e.premium_until is not null and e.premium_until > now()))
     from entitlements e
     where e.user_id = p_user_id),
    false
  );
$$;

alter table sessions enable row level security;

drop policy if exists "sessions_insert" on sessions;

create policy "sessions_insert" on sessions
  for insert with check (
    auth.uid() = host_id
    and (
      public.is_premium(auth.uid())
      or (
        select count(*)
        from sessions s
        where s.host_id = auth.uid()
          and date_trunc('month', s.created_at) = date_trunc('month', now())
      ) < 4
    )
  );
