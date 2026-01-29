alter table profiles
  add column if not exists club text,
  add column if not exists dominant_hand text;
