-- Head account management: inactive status, audited name/role/status changes.
alter table public.profiles drop constraint if exists profiles_status_check;
alter table public.profiles add constraint profiles_status_check
  check (status in ('pending','approved','rejected','inactive'));

create table public.account_changes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  changed_by uuid not null references public.profiles(id),
  field text not null check (field in ('full_name','role','status','email')),
  old_value text,
  new_value text,
  created_at timestamptz not null default now()
);
alter table public.account_changes enable row level security;
revoke all on public.account_changes from anon, authenticated;
grant select on public.account_changes to authenticated;
grant all on public.account_changes to service_role;
create policy head_account_changes on public.account_changes for select to authenticated
  using (public.is_head());

-- Name, role and active/inactive. Email changes go through the admin-change-email function.
create function public.admin_update_account(
  p_user uuid, p_full_name text default null, p_role text default null, p_active boolean default null)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  target public.profiles;
  new_name text := nullif(trim(p_full_name), '');
  new_status text;
  privileged text[] := array['COMEX Head','COMEX Associate','Approver'];
begin
  if not public.is_head() then raise exception 'Only an approved COMEX Head can manage accounts.'; end if;
  select * into target from public.profiles where id = p_user for update;
  if not found then raise exception 'Account not found.'; end if;
  if target.status not in ('approved','inactive') then
    raise exception 'Only decided accounts can be managed here.';
  end if;
  if new_name is not null and new_name <> target.full_name then
    if char_length(new_name) > 150 then raise exception 'The name must be 150 characters or fewer.'; end if;
    insert into public.account_changes(user_id, changed_by, field, old_value, new_value)
      values (p_user, auth.uid(), 'full_name', target.full_name, new_name);
    update public.profiles set full_name = new_name where id = p_user;
  end if;
  if p_role is not null and p_role <> target.role then
    if p_user = auth.uid() then raise exception 'You cannot change your own role.'; end if;
    if target.role = any(privileged) then raise exception 'This account''s role cannot be changed here.'; end if;
    if p_role not in ('Student','ASP','Faculty','COMEX Representative') then
      raise exception 'That role cannot be given to this user.';
    end if;
    insert into public.account_changes(user_id, changed_by, field, old_value, new_value)
      values (p_user, auth.uid(), 'role', target.role, p_role);
    update public.profiles set role = p_role where id = p_user;
  end if;
  if p_active is not null then
    new_status := case when p_active then 'approved' else 'inactive' end;
    if new_status <> target.status then
      if p_user = auth.uid() then raise exception 'You cannot change your own status.'; end if;
      if target.role = any(privileged) then raise exception 'This account''s status cannot be changed here.'; end if;
      insert into public.account_changes(user_id, changed_by, field, old_value, new_value)
        values (p_user, auth.uid(), 'status', target.status, new_status);
      update public.profiles set status = new_status where id = p_user;
    end if;
  end if;
end $$;
revoke all on function public.admin_update_account(uuid,text,text,boolean) from public;
grant execute on function public.admin_update_account(uuid,text,text,boolean) to authenticated;
