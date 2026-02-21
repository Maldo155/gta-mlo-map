-- Run this in Supabase SQL editor to add all server columns.
-- Safe to run multiple times (uses IF NOT EXISTS / IF EXISTS).

-- Criminal content (multi-select + other)
alter table public.servers add column if not exists criminal_types jsonb default '[]'::jsonb;
alter table public.servers add column if not exists criminal_other text;

-- Looking for positions
alter table public.servers add column if not exists looking_for_types jsonb default '[]'::jsonb;
alter table public.servers add column if not exists looking_for_other text;

-- MLO creators
alter table public.servers add column if not exists creator_keys jsonb default '[]'::jsonb;

-- Cfx.re code (live player count)
alter table public.servers add column if not exists cfx_id text;

-- Connect URL optional
alter table public.servers alter column connect_url drop not null;

-- Logo (if not present)
alter table public.servers add column if not exists logo_url text;
