create or replace function public.get_user_activity(
  p_user_id uuid,
  p_range text default '7d'
)
returns table (
  day date,
  sessions_count integer,
  minutes integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_start timestamptz;
begin
  if p_user_id is null or auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'Not allowed';
  end if;

  v_start := case
    when p_range = '90d' then now() - interval '90 days'
    when p_range = '30d' then now() - interval '30 days'
    else now() - interval '7 days'
  end;

  return query
  select
    (s.starts_at at time zone 'Europe/Paris')::date as day,
    count(*)::int as sessions_count,
    sum(coalesce(s.duration_minutes, 60))::int as minutes
  from public.session_participants sp
  join public.sessions s on s.id = sp.session_id
  where sp.user_id = p_user_id
    and s.starts_at >= v_start
  group by (s.starts_at at time zone 'Europe/Paris')::date
  order by day asc;
end;
$$;

grant execute on function public.get_user_activity(uuid, text) to authenticated;
