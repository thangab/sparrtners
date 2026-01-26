alter table profiles
  add column if not exists firstname text,
  add column if not exists lastname text,
  add column if not exists nickname text,
  add column if not exists birthdate date,
  add column if not exists city text,
  add column if not exists languages text[];

alter table profiles
  add column if not exists bio text;
