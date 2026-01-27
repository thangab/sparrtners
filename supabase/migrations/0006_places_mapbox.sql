alter table places
  add column if not exists mapbox_place_id text;

create unique index if not exists places_mapbox_place_id_key
  on places (mapbox_place_id);
