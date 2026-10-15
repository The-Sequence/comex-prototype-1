-- COMEX Forms: replacement templates, saved drafts and forms attached to project steps.
-- Mirrors comex-frontend-v2 (migration_003_paper_alignment.sql, comex_form_versions and
-- the comex-forms bucket) for V1's own Supabase project. Not applied yet: the app keeps
-- this data in localStorage (src/lib/formStore.js). See docs/supabase-migration.md.

create or replace function public.is_comex_office() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.profiles p where p.id = auth.uid()
  and p.role in ('COMEX Head','COMEX Associate') and p.status = 'approved' and p.email_verified_at is not null) $$;
revoke all on function public.is_comex_office() from public;
grant execute on function public.is_comex_office() to authenticated, service_role;

create or replace function public.is_approved_user() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.profiles p where p.id = auth.uid() and p.status = 'approved') $$;
revoke all on function public.is_approved_user() from public;
grant execute on function public.is_approved_user() to authenticated, service_role;

-- One row per uploaded PDF. No active row for a form+language = the bundled original in /public/forms.
create table public.comex_form_versions (
  id uuid primary key default gen_random_uuid(),
  form_code text not null check (char_length(form_code) between 1 and 40),
  lang text not null default 'en' check (lang in ('en','fil')),
  version_no integer not null check (version_no > 0),
  file_path text not null,             -- object path in the comex-forms bucket
  file_name text not null,
  page_count integer,
  keep_layout boolean not null default true,
  fields jsonb not null default '[]'::jsonb,
  notes text check (char_length(notes) <= 500),
  is_active boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (form_code, lang, version_no)
);
create unique index comex_form_versions_one_active on public.comex_form_versions (form_code, lang) where is_active;

-- A user's own filled answers, one per form+language (V2 draftKey).
create table public.comex_form_drafts (
  user_id uuid not null references public.profiles(id) on delete cascade,
  form_code text not null,
  lang text not null default 'en' check (lang in ('en','fil')),
  schema_version integer not null default 2,
  fields jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, form_code, lang)
);

-- A snapshot of filled answers attached to a project step (attachFilledForm).
create table public.comex_form_attachments (
  id uuid primary key default gen_random_uuid(),
  project_id text not null,
  step_id text not null,
  form_code text not null,
  lang text not null default 'en' check (lang in ('en','fil')),
  fields jsonb not null,
  attached_by uuid not null references public.profiles(id),
  attached_at timestamptz not null default now(),
  unique (project_id, step_id, form_code, lang)
);

alter table public.comex_form_versions enable row level security;
alter table public.comex_form_drafts enable row level security;
alter table public.comex_form_attachments enable row level security;
revoke all on public.comex_form_versions, public.comex_form_drafts, public.comex_form_attachments from anon, authenticated;
grant select on public.comex_form_versions to authenticated;
grant select, insert, update, delete on public.comex_form_drafts, public.comex_form_attachments to authenticated;
grant all on public.comex_form_versions, public.comex_form_drafts, public.comex_form_attachments to service_role;

create policy form_versions_read on public.comex_form_versions for select to authenticated using (public.is_approved_user());
create policy own_drafts on public.comex_form_drafts for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_approved_user());
create policy attachments_read on public.comex_form_attachments for select to authenticated
  using (attached_by = auth.uid() or public.is_comex_office());
create policy attachments_write on public.comex_form_attachments for insert to authenticated
  with check (attached_by = auth.uid() and public.is_approved_user());
create policy attachments_remove on public.comex_form_attachments for delete to authenticated
  using (attached_by = auth.uid() or public.is_comex_office());

-- Versions change only through these, so exactly one stays active.
create function public.publish_form_version(p_form_code text, p_lang text, p_file_path text, p_file_name text,
  p_page_count integer, p_keep_layout boolean, p_fields jsonb, p_notes text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_no integer;
begin
  if not public.is_comex_office() then raise exception 'Only the COMEX Office can publish forms.'; end if;
  perform pg_advisory_xact_lock(hashtext(p_form_code || ':' || p_lang));
  select coalesce(max(version_no), 0) + 1 into v_no from public.comex_form_versions where form_code = p_form_code and lang = p_lang;
  update public.comex_form_versions set is_active = false where form_code = p_form_code and lang = p_lang and is_active;
  insert into public.comex_form_versions (form_code, lang, version_no, file_path, file_name, page_count, keep_layout, fields, notes, is_active, created_by)
  values (p_form_code, p_lang, v_no, p_file_path, p_file_name, p_page_count, coalesce(p_keep_layout, true), coalesce(p_fields, '[]'::jsonb), p_notes, true, auth.uid())
  returning id into v_id;
  return v_id;
end $$;

create function public.activate_form_version(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v public.comex_form_versions%rowtype;
begin
  if not public.is_comex_office() then raise exception 'Only the COMEX Office can change forms.'; end if;
  select * into v from public.comex_form_versions where id = p_id;
  if v.id is null then raise exception 'Version not found.'; end if;
  update public.comex_form_versions set is_active = false where form_code = v.form_code and lang = v.lang and is_active;
  update public.comex_form_versions set is_active = true where id = p_id;
end $$;

create function public.revert_to_bundled_form(p_form_code text, p_lang text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_comex_office() then raise exception 'Only the COMEX Office can change forms.'; end if;
  update public.comex_form_versions set is_active = false where form_code = p_form_code and lang = p_lang and is_active;
end $$;

revoke all on function public.publish_form_version(text, text, text, text, integer, boolean, jsonb, text),
  public.activate_form_version(uuid), public.revert_to_bundled_form(text, text) from public;
grant execute on function public.publish_form_version(text, text, text, text, integer, boolean, jsonb, text),
  public.activate_form_version(uuid), public.revert_to_bundled_form(text, text) to authenticated;

-- Replacement PDFs. Readable by signed-in users only (V2's bucket was public).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('comex-forms', 'comex-forms', false, 10485760, array['application/pdf'])
on conflict (id) do nothing;
create policy comex_forms_read on storage.objects for select to authenticated
  using (bucket_id = 'comex-forms' and public.is_approved_user());
create policy comex_forms_write on storage.objects for insert to authenticated
  with check (bucket_id = 'comex-forms' and public.is_comex_office());
