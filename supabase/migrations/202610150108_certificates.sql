-- Volunteer certificates (V1 project only — never V2's project).
-- Mirrors comex-frontend-v2: certificates (migration_001), department_requirements
-- (migration_003 R3) and the signatures storage bucket (migration_003 PART U).
-- Eligibility is NOT stored: the app computes it from volunteer hours.

create or replace function public.is_certificate_office() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.profiles p where p.id = auth.uid()
  and p.role in ('COMEX Head','COMEX Associate') and p.status = 'approved') $$;
revoke all on function public.is_certificate_office() from public, anon;
grant execute on function public.is_certificate_office() to authenticated;

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  academic_year text not null check (academic_year ~ '^A\.Y\. \d{4}-\d{4}$'),
  dispatch_status text not null default 'Not Sent' check (dispatch_status in ('Not Sent','Sent')),
  sent_at date,
  signed boolean not null default false,
  forced boolean not null default false,
  sent_by uuid references public.profiles(id),
  constraint certificates_one_per_year unique (user_id, academic_year)
);
alter table public.certificates enable row level security;
create policy certificates_select on public.certificates for select to authenticated
  using (user_id = auth.uid() or public.is_certificate_office());
create policy certificates_insert on public.certificates for insert to authenticated
  with check (public.is_certificate_office());
create policy certificates_update on public.certificates for update to authenticated
  using (public.is_certificate_office()) with check (public.is_certificate_office());

-- Required hours: everyone reads, only the COMEX Head sets (V2 can_manage_requirements).
create table public.department_requirements (
  department text not null check (department in ('SET','SBA','SAS','STHM','SOA','SHS','CLINIC','LIBRARY')),
  academic_year text not null check (academic_year ~ '^A\.Y\. \d{4}-\d{4}$'),
  required_hours integer not null check (required_hours > 0),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id),
  primary key (department, academic_year)
);
alter table public.department_requirements enable row level security;
create policy department_requirements_select on public.department_requirements for select to authenticated using (true);
create policy department_requirements_insert on public.department_requirements for insert to authenticated
  with check (public.is_head());
create policy department_requirements_update on public.department_requirements for update to authenticated
  using (public.is_head()) with check (public.is_head());

insert into public.department_requirements (department, academic_year, required_hours)
select code, 'A.Y. 2025-2026', 60 from unnest(array['SET','SBA','SAS','STHM','SOA','SHS']) as code
on conflict do nothing;

-- Saved e-signatures: signatures/<userId>/signature.png, public read, owner writes.
insert into storage.buckets (id, name, public) values ('signatures', 'signatures', true)
on conflict (id) do nothing;
create policy signatures_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'signatures' and (storage.foldername(name))[1] = auth.uid()::text and public.is_certificate_office());
create policy signatures_update_own on storage.objects for update to authenticated
  using (bucket_id = 'signatures' and (storage.foldername(name))[1] = auth.uid()::text);
create policy signatures_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'signatures' and (storage.foldername(name))[1] = auth.uid()::text);
