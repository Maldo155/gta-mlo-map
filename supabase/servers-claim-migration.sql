-- Server claim system migration
-- Run in Supabase SQL editor. Safe to run multiple times (IF NOT EXISTS).

-- Claimable: admin toggle - only these servers can be claimed
alter table public.servers add column if not exists claimable boolean default false;

-- Claimed by: Discord user who verified ownership (Supabase auth user id)
alter table public.servers add column if not exists claimed_by_user_id uuid;

-- Authorized editors: additional Discord usernames who can edit (comma-separated)
alter table public.servers add column if not exists authorized_editors text[] default '{}';

-- Grandfathered: existing servers keep full benefits without claiming
alter table public.servers add column if not exists grandfathered boolean default false;

-- Set existing servers as grandfathered (keep full benefits, no claim needed)
update public.servers set grandfathered = true where grandfathered is null or grandfathered = false;
