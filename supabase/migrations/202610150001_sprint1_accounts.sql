-- Account service project only. Never apply to the main COMEX database.
create table public.profiles (
  id uuid primary key references auth.users(id),
  full_name text not null check (char_length(full_name) between 1 and 150),
  email text not null,
  department text not null check (department in ('SET','SBA','SAS','STHM','SOA','SHS','COMEX')),
  role text not null check (role in ('Student','ASP','Faculty','Volunteer','COMEX Representative','Approver','COMEX Head','COMEX Associate')),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  email_verified_at timestamptz,
  privacy_notice_version text,
  created_at timestamptz not null default now(),
  decided_by uuid references auth.users(id),
  decided_at timestamptz,
  decision_reason text check (char_length(decision_reason) <= 500)
);
create table public.account_decisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  decided_by uuid not null references public.profiles(id),
  decision text not null check (decision in ('approved','rejected')),
  reason text check (char_length(reason) <= 500),
  created_at timestamptz not null default now(),
  email_status text not null default 'pending' check (email_status in ('pending','sending','sent','failed')),
  email_error text,
  email_sent_at timestamptz,
  email_claimed_at timestamptz
);
alter table public.profiles enable row level security;
alter table public.account_decisions enable row level security;
revoke all on public.profiles, public.account_decisions from anon, authenticated;
grant select on public.profiles, public.account_decisions to authenticated;
grant all on public.profiles, public.account_decisions to service_role;

create function public.is_head() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.profiles p where p.id = auth.uid()
  and p.role = 'COMEX Head' and p.status = 'approved' and p.email_verified_at is not null) $$;
revoke all on function public.is_head() from public;
grant execute on function public.is_head() to authenticated, service_role;
create policy own_profile_or_head on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_head());
create policy head_decision_history on public.account_decisions for select to authenticated
  using (public.is_head());

create function public.register_profile() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare requested_role text := new.raw_user_meta_data->>'role';
begin
  if requested_role not in ('Student','ASP','Faculty','COMEX Representative') or requested_role is null then
    requested_role := 'Student';
  end if;
  insert into public.profiles(id, full_name, email, department, role, email_verified_at, privacy_notice_version)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'),''),'COMEX member'),
    new.email, coalesce(new.raw_user_meta_data->>'department','SET'), requested_role,
    new.email_confirmed_at, new.raw_user_meta_data->>'privacy_notice_version');
  return new;
end $$;
revoke all on function public.register_profile() from public;
create trigger presentation_profile_created after insert on auth.users
  for each row execute function public.register_profile();
create function public.sync_profile_email() returns trigger
language plpgsql security definer set search_path = ''
as $$ begin
  update public.profiles set email = new.email, email_verified_at = new.email_confirmed_at where id = new.id;
  return new;
end $$;
revoke all on function public.sync_profile_email() from public;
create trigger presentation_email_verified after update of email, email_confirmed_at on auth.users
  for each row execute function public.sync_profile_email();

create function public.decide_registration(p_user uuid, p_decision text, p_reason text default null)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare target public.profiles; decision_id uuid; note text := nullif(trim(p_reason),'');
begin
  if not public.is_head() then raise exception 'Only an approved COMEX Head can decide registrations.'; end if;
  if p_user = auth.uid() then raise exception 'You cannot decide your own registration.'; end if;
  if p_decision not in ('approved','rejected') or p_decision is null then raise exception 'Invalid decision.'; end if;
  if char_length(note) > 500 then raise exception 'The reason must be 500 characters or fewer.'; end if;
  select * into target from public.profiles where id = p_user for update;
  if not found then raise exception 'Registration not found.'; end if;
  if target.status != 'pending' then raise exception 'This registration has already been decided.'; end if;
  if target.email_verified_at is null then raise exception 'The email must be verified first.'; end if;
  update public.profiles set status = p_decision, decided_by = auth.uid(), decided_at = now(),
    decision_reason = case when p_decision = 'rejected' then note else null end where id = p_user;
  insert into public.account_decisions(user_id, decided_by, decision, reason)
    values (p_user, auth.uid(), p_decision, case when p_decision = 'rejected' then note else null end)
    returning id into decision_id;
  return decision_id;
end $$;
revoke all on function public.decide_registration(uuid,text,text) from public;
grant execute on function public.decide_registration(uuid,text,text) to authenticated;
