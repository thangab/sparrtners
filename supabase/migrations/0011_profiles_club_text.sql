alter table profiles
  alter column club type text
  using case
    when club is true then 'En club'
    when club is false then 'Sans club'
    else null
  end;
