insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars_upload_own_folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (auth.uid())::text = (storage.foldername(name))[1]
);

create policy "avatars_read"
on storage.objects
for select
to public
using (bucket_id = 'avatars');

create policy "avatars_update_own_folder"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and (auth.uid())::text = (storage.foldername(name))[1]
);

create policy "avatars_delete_own_folder"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (auth.uid())::text = (storage.foldername(name))[1]
);
