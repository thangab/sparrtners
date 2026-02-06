create table if not exists public.session_stats (
  session_id uuid primary key references public.sessions (id) on delete cascade,
  impressions integer not null default 0,
  detail_clicks integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.session_stats enable row level security;

drop policy if exists "session_stats_select_host" on public.session_stats;
create policy "session_stats_select_host"
  on public.session_stats
  for select
  using (
    exists (
      select 1
      from public.sessions s
      where s.id = session_id
        and s.host_id = auth.uid()
    )
  );

create or replace function public.increment_session_stats(p_updates jsonb)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.session_stats (
    session_id,
    impressions,
    detail_clicks,
    updated_at
  )
  select
    (item->>'session_id')::uuid,
    greatest(coalesce((item->>'impressions')::int, 0), 0),
    greatest(coalesce((item->>'detail_clicks')::int, 0), 0),
    now()
  from jsonb_array_elements(coalesce(p_updates, '[]'::jsonb)) as item
  where item ? 'session_id'
  on conflict (session_id)
  do update
    set impressions = session_stats.impressions + excluded.impressions,
        detail_clicks = session_stats.detail_clicks + excluded.detail_clicks,
        updated_at = now();
$$;

grant execute on function public.increment_session_stats(jsonb) to anon, authenticated;
