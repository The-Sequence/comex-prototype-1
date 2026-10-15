-- Messages for V1's own Supabase project (never comex-frontend-v2's).
-- Mirrors V2's message_threads / messages / message_reads (schema.sql,
-- migration_002_fixes, migration_003_paper_alignment, migration_006) on
-- V1's public.profiles. Adds department-addressed threads ('dept:<code>'),
-- which V1's New message dialog offers. Not applied automatically.

create or replace function public.is_comex_office() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.profiles p where p.id = auth.uid()
  and p.role in ('COMEX Head','COMEX Associate') and p.status = 'approved') $$;
revoke all on function public.is_comex_office() from public;
grant execute on function public.is_comex_office() to authenticated;

-- recipient: a profile id, 'office' (the COMEX Office) or 'dept:<code>' (that department's representatives).
create table public.message_threads (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete restrict,
  creator_name text,
  creator_role text,
  recipient text not null check (recipient = 'office' or recipient like 'dept:%'
    or recipient ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'),
  contact_name text not null check (char_length(contact_name) between 1 and 150),
  contact_role text,
  preview text,
  last_message_at timestamptz not null default now()
);
create index message_threads_created_by_idx on public.message_threads (created_by, last_message_at desc);
create index message_threads_recipient_idx on public.message_threads (recipient, last_message_at desc);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.message_threads(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete restrict,
  body text not null check (length(btrim(body)) between 1 and 2000),
  sent_at timestamptz not null default now()
);
create index messages_thread_idx on public.messages (thread_id, sent_at desc);

-- Being read is a per-person fact (V2 migration_002, bug 5).
create table public.message_reads (
  thread_id uuid not null references public.message_threads(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (thread_id, user_id)
);

-- Who may read a thread: its creator, its named recipient, the Office for
-- office mail, and a department's approved representatives for its mail.
create or replace function public.can_see_thread(t public.message_threads) returns boolean
language sql stable security definer set search_path = ''
as $$ select t.created_by = auth.uid()
  or t.recipient = auth.uid()::text
  or (t.recipient = 'office' and public.is_comex_office())
  or (t.recipient like 'dept:%' and exists(select 1 from public.profiles p where p.id = auth.uid()
      and p.status = 'approved' and p.role = 'COMEX Representative' and 'dept:' || p.department = t.recipient)) $$;
revoke all on function public.can_see_thread(public.message_threads) from public;
grant execute on function public.can_see_thread(public.message_threads) to authenticated;

-- The creator's name is stamped server-side so a recipient who cannot read
-- the creator's profile row still sees who wrote to them.
create or replace function public.stamp_thread_creator() returns trigger
language plpgsql security definer set search_path = ''
as $$ begin
  select full_name, role into new.creator_name, new.creator_role from public.profiles where id = new.created_by;
  return new;
end $$;
create trigger stamp_thread_creator before insert on public.message_threads
  for each row execute function public.stamp_thread_creator();

alter table public.message_threads enable row level security;
alter table public.messages enable row level security;
alter table public.message_reads enable row level security;
revoke all on public.message_threads, public.messages, public.message_reads from anon, authenticated;
grant select, insert, update on public.message_threads to authenticated;
grant select, insert on public.messages to authenticated;
grant select, insert, update on public.message_reads to authenticated;

create policy message_threads_select on public.message_threads for select using (public.can_see_thread(message_threads));
create policy message_threads_insert on public.message_threads for insert with check (
  created_by = auth.uid() and recipient <> auth.uid()::text
  and exists(select 1 from public.profiles p where p.id = auth.uid() and p.status = 'approved'));
create policy message_threads_update on public.message_threads for update
  using (public.can_see_thread(message_threads)) with check (public.can_see_thread(message_threads));

-- Messages follow their thread: whoever may read the thread may read and post to it.
create policy messages_select on public.messages for select using (
  exists(select 1 from public.message_threads t where t.id = thread_id));
create policy messages_insert on public.messages for insert with check (
  sender_id = auth.uid() and exists(select 1 from public.message_threads t where t.id = thread_id));

create policy message_reads_own on public.message_reads for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Unread conversations for the badge (V2 migration_006). Security invoker,
-- so the policies above still decide which messages are counted.
create or replace function public.count_unread_threads() returns integer
language sql stable security invoker set search_path = public
as $$ select count(distinct m.thread_id)::integer
  from public.messages m
  left join public.message_reads r on r.thread_id = m.thread_id and r.user_id = auth.uid()
  where m.sender_id is distinct from auth.uid()
    and m.sent_at > coalesce(r.last_read_at, '-infinity'::timestamptz) $$;
revoke all on function public.count_unread_threads() from public;
grant execute on function public.count_unread_threads() to authenticated;

-- People an approved user may start a conversation with: names, roles and
-- departments only, never emails (V2 list_contactable_users).
create or replace function public.list_contactable_users()
returns table (id uuid, full_name text, role text, department text)
language sql stable security definer set search_path = ''
as $$ select p.id, p.full_name, p.role, p.department from public.profiles p
  where p.status = 'approved' and p.id <> auth.uid()
    and exists(select 1 from public.profiles me where me.id = auth.uid() and me.status = 'approved')
  order by p.full_name $$;
revoke all on function public.list_contactable_users() from public;
grant execute on function public.list_contactable_users() to authenticated;
