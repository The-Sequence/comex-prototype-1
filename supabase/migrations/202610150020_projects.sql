-- Community Engagement projects and the fifteen-step workflow.
-- Mirrors comex-frontend-v2's community_engagements, project_steps, endorsements,
-- step_files, step_events and withdraw_engagement, adapted to this project's
-- public.profiles (role, department, status). Not applied yet: src/lib/projects.js
-- still keeps this data in localStorage. See docs/supabase-migration.md.

-- Who the signed-in user is, for the policies below. Approved accounts only.
create or replace function public.project_actor_role() returns text
language sql stable security definer set search_path = public, pg_temp as $$
  select p.role from public.profiles p where p.id = auth.uid() and p.status = 'approved'
$$;
create or replace function public.project_actor_department() returns text
language sql stable security definer set search_path = public, pg_temp as $$
  select p.department from public.profiles p where p.id = auth.uid() and p.status = 'approved'
$$;
create or replace function public.project_is_office() returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(public.project_actor_role() in ('COMEX Head', 'COMEX Associate'), false)
$$;
revoke all on function public.project_actor_role(), public.project_actor_department(), public.project_is_office() from public, anon;
grant execute on function public.project_actor_role(), public.project_actor_department(), public.project_is_office() to authenticated;

create table public.community_engagements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) > 0),
  objectives text not null check (length(trim(objectives)) > 0),
  project_lead text not null,
  project_lead_id uuid references public.profiles(id) on delete set null,
  department text not null,
  field_of_work text not null,
  engagement_type text check (engagement_type in ('program', 'seminar', 'outreach')),
  bucket text not null default 'New' check (bucket in ('New', 'Ongoing', 'Done')),
  current_step smallint not null default 1 check (current_step between 1 and 15),
  created_by uuid not null default auth.uid() references public.profiles(id),
  submitted_at timestamptz not null default now()
);
create index community_engagements_department_idx on public.community_engagements (department, bucket);
create index community_engagements_lead_idx on public.community_engagements (project_lead_id);

create table public.project_steps (
  engagement_id uuid not null references public.community_engagements(id) on delete cascade,
  step_no smallint not null check (step_no between 1 and 15),
  status text not null default 'Pending'
    check (status in ('Pending', 'File Attached', 'Needs Validation', 'Approved', 'Rejected')),
  feedback text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  primary key (engagement_id, step_no),
  constraint project_steps_revision_needs_comment check (status <> 'Rejected' or length(trim(coalesce(feedback, ''))) > 0)
);
create index project_steps_needs_review_idx on public.project_steps (status) where status = 'Needs Validation';

-- One row per approval, so re-decided steps keep their history.
create table public.endorsements (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null,
  step_no smallint not null,
  mode text not null check (mode in ('Signed', 'Unsigned')),
  decided_by text,
  decided_at timestamptz not null default now(),
  signature_path text,
  foreign key (engagement_id, step_no) references public.project_steps(engagement_id, step_no) on delete cascade
);

-- One upload slot per required form. file_path points into the engagement-files
-- bucket; link holds a pasted URL instead (the V1 adapter allows either).
create table public.step_files (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null,
  step_no smallint not null,
  form_code text not null,
  file_name text not null,
  file_size bigint check (file_size is null or file_size > 0),
  file_path text,
  link text check (link is null or link ~ '^https?://'),
  uploaded_at timestamptz not null default now(),
  unique (engagement_id, step_no, form_code),
  check (file_path is not null or link is not null),
  foreign key (engagement_id, step_no) references public.project_steps(engagement_id, step_no) on delete cascade
);

create table public.step_events (
  id uuid primary key default gen_random_uuid(),
  event_order bigint generated always as identity,
  engagement_id uuid not null references public.community_engagements(id) on delete cascade,
  step_no smallint not null,
  old_status text, new_status text, old_feedback text, new_feedback text,
  actor_id uuid references public.profiles(id) on delete set null,
  actor_name text,
  occurred_at timestamptz not null default clock_timestamp()
);
create index step_events_engagement_time on public.step_events (engagement_id, occurred_at, event_order);

-- Which forms a step needs for a type of engagement. Mirrors formsForType() in src/lib/projectRules.js.
create or replace function public.required_step_forms(target_step integer, target_type text)
returns text[] language sql immutable set search_path = public, pg_temp as $$
  select case target_step
    when 1 then array['attachment'] when 2 then array['attachment'] when 3 then array['MOA']
    when 4 then case target_type when 'program' then array['002'] when 'seminar' then array['003'] when 'outreach' then array['004'] else array['002','003','004'] end
    when 5 then array['016','017','005'] when 6 then array['attachment']
    when 7 then case target_type when 'program' then array['001','006'] when 'seminar' then array['001','007'] when 'outreach' then array['001','008'] else array['001','006','007','008'] end
    when 8 then array['SARF'] when 12 then array['attachment'] when 13 then array['009']
    when 14 then case target_type when 'seminar' then array['010','011','012','013','014','015'] else array['010','011','012','013','015'] end
    else array[]::text[] end
$$;
grant execute on function public.required_step_forms(integer, text) to authenticated;

-- Row level security: the office and Approvers see everything, a Representative
-- their department, anyone else the projects they lead.
create or replace function public.can_see_engagement(ce public.community_engagements) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select public.project_is_office() or public.project_actor_role() = 'Approver'
    or ce.project_lead_id = auth.uid()
    or (public.project_actor_role() = 'COMEX Representative' and ce.department = public.project_actor_department())
$$;
create or replace function public.can_manage_engagement(ce public.community_engagements) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select public.project_is_office() or ce.project_lead_id = auth.uid()
    or (public.project_actor_role() = 'COMEX Representative' and ce.department = public.project_actor_department())
$$;
revoke all on function public.can_see_engagement(public.community_engagements), public.can_manage_engagement(public.community_engagements) from public, anon;
grant execute on function public.can_see_engagement(public.community_engagements), public.can_manage_engagement(public.community_engagements) to authenticated;

alter table public.community_engagements enable row level security;
alter table public.project_steps enable row level security;
alter table public.endorsements enable row level security;
alter table public.step_files enable row level security;
alter table public.step_events enable row level security;
grant select, insert, update on public.community_engagements to authenticated;
grant select on public.project_steps, public.endorsements, public.step_files, public.step_events to authenticated;

create policy engagements_read on public.community_engagements for select to authenticated
  using (public.can_see_engagement(community_engagements));
-- A Representative files only for their own department; the office for anyone.
create policy engagements_insert on public.community_engagements for insert to authenticated
  with check (created_by = auth.uid() and current_step = 1 and bucket = 'New' and (public.project_is_office()
    or (public.project_actor_role() = 'COMEX Representative' and department = public.project_actor_department())));
-- Details only; step pointer and bucket change through the functions below.
create policy engagements_update on public.community_engagements for update to authenticated
  using (public.can_manage_engagement(community_engagements))
  with check (public.can_manage_engagement(community_engagements));
revoke update on public.community_engagements from authenticated;
grant update (title, objectives, engagement_type) on public.community_engagements to authenticated;

create policy steps_read on public.project_steps for select to authenticated
  using (exists (select 1 from public.community_engagements ce where ce.id = engagement_id));
create policy endorsements_read on public.endorsements for select to authenticated
  using (exists (select 1 from public.community_engagements ce where ce.id = engagement_id));
create policy step_files_read on public.step_files for select to authenticated
  using (exists (select 1 from public.community_engagements ce where ce.id = engagement_id));
create policy step_events_read on public.step_events for select to authenticated
  using (exists (select 1 from public.community_engagements ce where ce.id = engagement_id));

-- Creating a project generates all fifteen steps.
create or replace function public.generate_engagement_steps() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into public.project_steps (engagement_id, step_no) select new.id, n from generate_series(1, 15) n;
  return new;
end $$;
revoke all on function public.generate_engagement_steps() from public, anon, authenticated;
create trigger generate_engagement_steps after insert on public.community_engagements
  for each row execute function public.generate_engagement_steps();

-- Step history: every status or feedback change (blank Pending rows are not history).
create or replace function public.record_step_event() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'INSERT' and new.status = 'Pending' and new.feedback is null then return new; end if;
  if tg_op = 'INSERT' or new.status is distinct from old.status or new.feedback is distinct from old.feedback then
    insert into public.step_events (engagement_id, step_no, old_status, new_status, old_feedback, new_feedback, actor_id, actor_name)
    values (new.engagement_id, new.step_no, case when tg_op = 'UPDATE' then old.status end, new.status,
      case when tg_op = 'UPDATE' then old.feedback end, new.feedback, auth.uid(),
      (select full_name from public.profiles where id = auth.uid()));
  end if;
  return new;
end $$;
revoke all on function public.record_step_event() from public, anon, authenticated;
create trigger record_step_event after insert or update of status, feedback on public.project_steps
  for each row execute function public.record_step_event();

-- Attach a file or link to one slot. Complete steps become Needs Validation. Mirrors attachStepFile().
create or replace function public.record_step_file(target_engagement uuid, target_step integer, target_form text,
  target_name text, target_size bigint default null, target_path text default null, target_link text default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare ce public.community_engagements; required text[]; complete boolean; old_path text;
begin
  select * into ce from public.community_engagements where id = target_engagement for update;
  if not found or not public.can_manage_engagement(ce) then raise exception 'Engagement not found or access denied'; end if;
  if target_step > ce.current_step then raise exception 'Finish Step % first', ce.current_step; end if;
  required := public.required_step_forms(target_step, ce.engagement_type);
  if not (target_form = any(required)) then raise exception 'This form is not required at this step'; end if;
  if (select status from public.project_steps where engagement_id = target_engagement and step_no = target_step) = 'Approved' then
    raise exception 'Approved steps cannot be replaced';
  end if;
  select file_path into old_path from public.step_files where engagement_id = target_engagement and step_no = target_step and form_code = target_form;
  insert into public.step_files (engagement_id, step_no, form_code, file_name, file_size, file_path, link)
  values (target_engagement, target_step, target_form, target_name, target_size, target_path, target_link)
  on conflict (engagement_id, step_no, form_code) do update set file_name = excluded.file_name, file_size = excluded.file_size,
    file_path = excluded.file_path, link = excluded.link, uploaded_at = now();
  select not exists (select 1 from unnest(required) code where not exists (select 1 from public.step_files sf
    where sf.engagement_id = target_engagement and sf.step_no = target_step and sf.form_code = code)) into complete;
  update public.project_steps set status = case when complete then 'Needs Validation' else 'File Attached' end,
    feedback = case when complete then null else feedback end
    where engagement_id = target_engagement and step_no = target_step;
  if complete then
    update public.community_engagements set current_step = greatest(current_step, target_step),
      bucket = case when bucket = 'New' and target_step > 1 then 'Ongoing' else bucket end where id = target_engagement;
  end if;
  return jsonb_build_object('complete', complete, 'oldPath', old_path);
end $$;
revoke all on function public.record_step_file(uuid, integer, text, text, bigint, text, text) from public, anon;
grant execute on function public.record_step_file(uuid, integer, text, text, bigint, text, text) to authenticated;

-- Approve or return a step. Approvers decide Steps 9 and 10; the office decides any step.
-- Mirrors reviewStep() and resubmitStep() in src/lib/projects.js.
create or replace function public.review_engagement_step(target_engagement uuid, target_step integer, decision text, note text default null)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare ce public.community_engagements; step_status text; upload_step boolean := target_step in (1,2,3,4,5,6,7,8,12,13,14);
begin
  if decision not in ('Approved', 'Rejected') then raise exception 'Choose Approved or Rejected'; end if;
  if not (public.project_is_office() or (public.project_actor_role() = 'Approver' and target_step in (9, 10))) then
    raise exception 'You cannot decide this step';
  end if;
  if decision = 'Rejected' and length(trim(coalesce(note, ''))) = 0 then
    raise exception 'Please write a comment telling the COMEX Representative what to revise';
  end if;
  select * into ce from public.community_engagements where id = target_engagement for update;
  if not found then raise exception 'Engagement not found'; end if;
  select status into step_status from public.project_steps where engagement_id = target_engagement and step_no = target_step;
  if step_status = 'Approved' or (upload_step and step_status <> 'Needs Validation')
    or (not upload_step and (ce.current_step <> target_step or step_status = 'Rejected')) then
    raise exception 'This step is not waiting for a decision';
  end if;
  update public.project_steps set status = decision, feedback = nullif(trim(coalesce(note, '')), ''), reviewed_by = auth.uid(), reviewed_at = now()
    where engagement_id = target_engagement and step_no = target_step;
  if decision = 'Approved' then
    insert into public.endorsements (engagement_id, step_no, mode, decided_by)
      values (target_engagement, target_step, 'Unsigned', (select full_name from public.profiles where id = auth.uid()));
    update public.community_engagements set current_step = least(target_step + 1, 15),
      bucket = case when target_step >= 15 then 'Done' else 'Ongoing' end where id = target_engagement;
  end if;
end $$;

create or replace function public.resubmit_engagement_step(target_engagement uuid, target_step integer)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare ce public.community_engagements;
begin
  select * into ce from public.community_engagements where id = target_engagement for update;
  if not found or not public.can_manage_engagement(ce) then raise exception 'Engagement not found or access denied'; end if;
  update public.project_steps set status = 'Needs Validation'
    where engagement_id = target_engagement and step_no = target_step and status = 'Rejected' and step_no in (9, 10, 11, 15);
  if not found then raise exception 'Only a returned step can be resubmitted'; end if;
end $$;
revoke all on function public.review_engagement_step(uuid, integer, text, text), public.resubmit_engagement_step(uuid, integer) from public, anon;
grant execute on function public.review_engagement_step(uuid, integer, text, text), public.resubmit_engagement_step(uuid, integer) to authenticated;

-- Withdraw a Step 1 project (office, or that department's Representative). Returns
-- the storage paths the caller must remove from the engagement-files bucket.
create or replace function public.withdraw_engagement(target_engagement uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare ce public.community_engagements; paths text[];
begin
  select * into ce from public.community_engagements where id = target_engagement for update;
  if not found or ce.current_step <> 1 or not (public.project_is_office()
    or (public.project_actor_role() = 'COMEX Representative' and ce.department = public.project_actor_department())) then
    raise exception 'Only Step 1 engagements in your department or managed by the COMEX Office can be withdrawn';
  end if;
  select coalesce(array_agg(file_path) filter (where file_path is not null), '{}') into paths from public.step_files where engagement_id = target_engagement;
  delete from public.community_engagements where id = target_engagement;
  return jsonb_build_object('withdrawn', true, 'paths', paths);
end $$;
revoke all on function public.withdraw_engagement(uuid) from public, anon;
grant execute on function public.withdraw_engagement(uuid) to authenticated;

-- Private bucket for step files, laid out as <engagement id>/step-<n>/<form>-<uuid>-<name>.
insert into storage.buckets (id, name, public) values ('engagement-files', 'engagement-files', false)
  on conflict (id) do nothing;
create policy engagement_files_read on storage.objects for select to authenticated
  using (bucket_id = 'engagement-files' and exists (select 1 from public.community_engagements ce
    where ce.id::text = split_part(name, '/', 1)));
create policy engagement_files_write on storage.objects for insert to authenticated
  with check (bucket_id = 'engagement-files' and exists (select 1 from public.community_engagements ce
    where ce.id::text = split_part(name, '/', 1) and public.can_manage_engagement(ce)));
create policy engagement_files_delete on storage.objects for delete to authenticated
  -- owner = uploader, so a Representative can still clear files once withdraw_engagement removed the row.
  using (bucket_id = 'engagement-files' and (public.project_is_office() or owner = auth.uid() or exists (select 1 from public.community_engagements ce
    where ce.id::text = split_part(name, '/', 1) and public.can_manage_engagement(ce))));
