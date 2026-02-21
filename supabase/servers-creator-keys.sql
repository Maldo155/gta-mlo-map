-- Link servers to MLO creators: multi-select (creator_keys array)
-- Run in Supabase SQL editor

alter table public.servers add column if not exists creator_keys jsonb default '[]'::jsonb;
