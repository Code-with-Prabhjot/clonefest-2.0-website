-- Allow admins to update tracks
create policy "Admins can update tracks" 
  on public.tracks for update 
  to authenticated 
  using (
    exists (
      select 1 from public.profiles 
      where profiles.id = auth.uid() 
      and profiles.role = 'admin'
    )
  );
