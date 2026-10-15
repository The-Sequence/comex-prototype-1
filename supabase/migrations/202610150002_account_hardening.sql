create or replace function public.is_head() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.profiles p where p.id = auth.uid()
  and p.role = 'COMEX Head' and p.status = 'approved' and p.email_verified_at is not null)
  and exists(select 1 from jsonb_array_elements(coalesce(auth.jwt()->'amr','[]'::jsonb)) item
    where item->>'method' = 'password') $$;

create or replace function public.register_profile() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare requested_role text := new.raw_user_meta_data->>'role';
  requested_department text := new.raw_user_meta_data->>'department';
begin
  if requested_role not in ('Student','ASP','Faculty','COMEX Representative') or requested_role is null then
    requested_role := 'Student';
  end if;
  if requested_department not in ('SET','SBA','SAS','STHM','SOA','SHS') or requested_department is null then
    raise exception 'Select a valid school department.';
  end if;
  insert into public.profiles(id, full_name, email, department, role, email_verified_at, privacy_notice_version)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'),''),'COMEX member'),
    new.email, requested_department, requested_role, new.email_confirmed_at, new.raw_user_meta_data->>'privacy_notice_version');
  return new;
end $$;
