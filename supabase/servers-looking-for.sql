-- Looking for positions: multi-select (looking_for_types) + custom (looking_for_other)
-- Run in Supabase SQL editor

alter table public.servers add column if not exists looking_for_types jsonb default '[]'::jsonb;
alter table public.servers add column if not exists looking_for_other text;
