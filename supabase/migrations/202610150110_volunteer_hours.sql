-- Volunteer hours, ported from comex-frontend-v2 (migration_001_live volunteer_hours,
-- migration_003_paper_alignment R1 + R3) onto V1's own account project (public.profiles).
-- Not applied yet: the app keeps this data in localStorage (src/lib/volunteerHours.js).

-- The COMEX Office (Head or Associate) encodes hours; V2's is_office().
create or replace function public.is_hours_office() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.profiles p where p.id = auth.uid()
  and p.role in ('COMEX Head','COMEX Associate') and p.status = 'approved' and p.email_verified_at is not null) $$;
revoke all on function public.is_hours_office() from public;
grant execute on function public.is_hours_office() to authenticated, service_role;

create table public.volunteer_hours (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  -- Copied from the profile when encoded (trigger below), so later profile edits do not rewrite history.
  full_name text not null,
  department text,
  position text,
  project text not null check (char_length(project) between 1 and 200),
  volunteer_role text not null,
  date date not null,
  time_in text not null,   -- "7:30 AM", as formatTimeForDisplay() in src/lib/hoursRules.js
  time_out text not null,
  hours numeric(4,1) not null check (hours > 0),
  academic_year text not null check (academic_year ~ '^A\.Y\. \d{4}-\d{4}$'),
  encoded_by uuid references public.profiles(id) default auth.uid(),
  encoded_at timestamptz not null default now()
);
create index volunteer_hours_user_year_idx on public.volunteer_hours (user_id, academic_year);

alter table public.volunteer_hours enable row level security;
revoke all on public.volunteer_hours from anon, authenticated;
grant select, insert, update, delete on public.volunteer_hours to authenticated;
grant all on public.volunteer_hours to service_role;
create policy volunteer_hours_select on public.volunteer_hours for select to authenticated
  using (user_id = auth.uid() or public.is_hours_office());
create policy volunteer_hours_write on public.volunteer_hours for all to authenticated
  using (public.is_hours_office()) with check (public.is_hours_office());

-- R1: the office picks WHO; name, department and position come from the profile.
create or replace function public.fill_volunteer_hours_identity() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  profile public.profiles%rowtype;
begin
  select * into profile from public.profiles where id = new.user_id and status = 'approved';
  if profile.id is null then
    raise exception 'Volunteer not found.';
  end if;
  new.full_name := profile.full_name;
  new.department := profile.department;
  new.position := profile.role;
  return new;
end $$;
revoke all on function public.fill_volunteer_hours_identity() from public, anon, authenticated;
create trigger fill_volunteer_hours_identity before insert or update of user_id on public.volunteer_hours
  for each row execute function public.fill_volunteer_hours_identity();

-- R3: required hours per department and academic year. Everyone reads; the COMEX Head writes.
create table public.department_requirements (
  department text not null check (department in ('SET','SBA','SAS','STHM','SOA','SHS')),
  academic_year text not null check (academic_year ~ '^A\.Y\. \d{4}-\d{4}$'),
  required_hours integer not null check (required_hours > 0),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) default auth.uid(),
  primary key (department, academic_year)
);
alter table public.department_requirements enable row level security;
revoke all on public.department_requirements from anon, authenticated;
grant select, insert, update on public.department_requirements to authenticated;
grant all on public.department_requirements to service_role;
create policy department_requirements_select on public.department_requirements for select to authenticated using (true);
create policy department_requirements_insert on public.department_requirements for insert to authenticated
  with check (public.is_head());
create policy department_requirements_update on public.department_requirements for update to authenticated
  using (public.is_head()) with check (public.is_head());

insert into public.department_requirements (department, academic_year, required_hours)
select d.code, 'A.Y. 2025-2026', 60
from (values ('SET'), ('SBA'), ('SAS'), ('STHM'), ('SOA'), ('SHS')) as d(code)
on conflict do nothing;
