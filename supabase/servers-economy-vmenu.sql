-- Add Vmenu to economy_type options
-- Run in Supabase SQL editor

alter table public.servers drop constraint if exists servers_economy_type_check;
alter table public.servers add constraint servers_economy_type_check
  check (economy_type in ('realistic', 'boosted', 'hardcore', 'vmenu', 'custom'));
