insert into disciplines (name) values
  ('Basketball'),
  ('Football'),
  ('Running'),
  ('CrossFit'),
  ('Yoga')
on conflict do nothing;

insert into skill_levels (name) values
  ('Beginner'),
  ('Intermediate'),
  ('Advanced'),
  ('Pro')
on conflict do nothing;

insert into training_types (name) values
  ('Workout'),
  ('Match'),
  ('Technique'),
  ('Recovery')
on conflict do nothing;

insert into places (name, city) values
  ('City Park', 'Paris'),
  ('Urban Gym', 'Lyon'),
  ('Stadium Central', 'Marseille')
on conflict do nothing;
