-- Volunteer opportunities and applications, mirroring comex-frontend-v2
-- (schema.sql + migration_003_paper_alignment.sql) on V1's own profiles table.
-- Not applied yet: the app still keeps this data in localStorage (src/lib/opportunities.js,
-- src/lib/applications.js). See docs/supabase-migration.md.

-- The office: an approved, verified COMEX Head or COMEX Associate.
create or replace function public.is_office() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.profiles p where p.id = (select auth.uid())
  and p.role in ('COMEX Head','COMEX Associate') and p.status = 'approved' and p.email_verified_at is not null) $$;
revoke all on function public.is_office() from public;
grant execute on function public.is_office() to authenticated, service_role;

-- Same rule as canRoleSeeAudience() in src/lib/opportunityRules.js.
create or replace function public.can_see_volunteer_audience(p_audience text) returns boolean
language sql stable security definer set search_path = ''
as $$ select coalesce(p_audience, 'Everyone') = 'Everyone' or exists (select 1 from public.profiles p
  where p.id = (select auth.uid()) and (
    (p_audience = 'For Students only' and p.role = 'Student') or
    (p_audience = 'For Faculty only' and p.role = 'Faculty') or
    (p_audience = 'For ASP only' and p.role = 'ASP') or
    (p_audience = 'For COMEX Representatives only' and p.role like 'COMEX Representative%'))) $$;
revoke all on function public.can_see_volunteer_audience(text) from public;
grant execute on function public.can_see_volunteer_audience(text) to authenticated;

create table if not exists public.volunteer_opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 120),
  caption text not null default '' check (char_length(caption) <= 1000),
  posted_by_id uuid references public.profiles(id) on delete set null,
  posted_by text,
  posted_by_role text,
  posted_at timestamptz not null default now(),
  audience text not null default 'Everyone' check (audience in (
    'Everyone','For Students only','For Faculty only','For ASP only','For COMEX Representatives only')),
  image_url text,
  likes integer not null default 0 check (likes >= 0),
  shares integer not null default 0 check (shares >= 0),
  is_deleted boolean not null default false
);
create index if not exists volunteer_opportunities_visible_idx
  on public.volunteer_opportunities (audience, posted_at desc) where not is_deleted;

create table if not exists public.volunteer_applications (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.volunteer_opportunities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete restrict,
  status text not null default 'Pending' check (status in ('Pending','Accepted','Declined')),
  answers jsonb not null default '{}'::jsonb check (jsonb_typeof(answers) = 'object'),
  applied_at timestamptz not null default now(),
  decided_at timestamptz,
  unique (opportunity_id, user_id)
);
create index if not exists volunteer_applications_user_idx on public.volunteer_applications(user_id);

alter table public.volunteer_opportunities enable row level security;
alter table public.volunteer_applications enable row level security;
revoke all on public.volunteer_opportunities from anon, authenticated;
revoke all on public.volunteer_applications from anon, authenticated;
grant select, insert, update on public.volunteer_opportunities to authenticated;
grant select, insert, update on public.volunteer_applications to authenticated;

-- Posts: the office sees and writes everything; others see live posts meant for them.
-- Deletes are soft (is_deleted = true) so applications stay on record.
create policy volunteer_opportunities_select on public.volunteer_opportunities for select to authenticated
  using (public.is_office() or (not is_deleted and public.can_see_volunteer_audience(audience)));
create policy volunteer_opportunities_insert on public.volunteer_opportunities for insert to authenticated
  with check (public.is_office() and posted_by_id = (select auth.uid()));
create policy volunteer_opportunities_update on public.volunteer_opportunities for update to authenticated
  using (public.is_office()) with check (public.is_office());

-- Applications: volunteers apply once, Pending, to a live post they can see; the office decides.
create policy volunteer_applications_read on public.volunteer_applications for select to authenticated
  using (user_id = (select auth.uid()) or public.is_office());
create policy volunteer_applications_insert on public.volunteer_applications for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'Pending'
    and exists (select 1 from public.volunteer_opportunities o
      where o.id = opportunity_id and not o.is_deleted and public.can_see_volunteer_audience(o.audience)));
create policy volunteer_applications_update on public.volunteer_applications for update to authenticated
  using (public.is_office() and status = 'Pending') with check (public.is_office() and status in ('Accepted','Declined'));

-- Seed the EcoWays post the prototype starts with.
insert into public.volunteer_opportunities (title, caption, posted_by, posted_by_role, posted_at, audience, image_url, likes, shares)
select 'Join EcoWays: Clean and Green Initiative',
  'Be part of EcoWays’ clean-up drive and help create a cleaner, greener community.',
  'System Administrator', 'Admin/COMEX head', '2026-05-01T00:00:00Z', 'Everyone', 'ecoways-poster', 21, 3
where not exists (select 1 from public.volunteer_opportunities);
