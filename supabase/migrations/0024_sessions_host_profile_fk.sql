alter table public.sessions
  add constraint sessions_host_profile_fk
  foreign key (host_id)
  references public.profiles (id)
  on delete cascade
  not valid;

alter table public.sessions
  validate constraint sessions_host_profile_fk;
