alter table public.account_changes add column if not exists notified_at timestamptz;
