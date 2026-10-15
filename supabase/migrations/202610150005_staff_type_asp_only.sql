-- Staff type is limited to ASP (Academic Support Personnel).
alter table public.profiles drop constraint if exists profiles_staff_type_check;
alter table public.profiles add constraint profiles_staff_type_check check (staff_type in ('ASP'));

create or replace function public.register_profile() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare requested_role text := new.raw_user_meta_data->>'role';
  requested_department text := new.raw_user_meta_data->>'department';
  requested_staff_type text := nullif(new.raw_user_meta_data->>'staff_type','');
  requested_unit text := nullif(trim(new.raw_user_meta_data->>'unit'),'');
begin
  if requested_role not in ('Student','ASP','Faculty','COMEX Representative') or requested_role is null then
    requested_role := 'Student';
  end if;
  if requested_department not in ('SET','SBA','SAS','STHM','SOA','SHS') or requested_department is null then
    raise exception 'Select a valid school department.';
  end if;
  if requested_staff_type is not null then
    if requested_staff_type not in ('ASP') then
      raise exception 'Select a valid staff type.';
    end if;
    if requested_unit is null or char_length(requested_unit) > 100 then
      raise exception 'Enter the office or unit you work in.';
    end if;
    requested_role := 'ASP';
  else
    requested_unit := null;
  end if;
  insert into public.profiles(id, full_name, email, department, role, email_verified_at, privacy_notice_version, staff_type, unit)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'),''),'COMEX member'),
    new.email, requested_department, requested_role, new.email_confirmed_at, new.raw_user_meta_data->>'privacy_notice_version',
    requested_staff_type, requested_unit);
  return new;
end $$;
