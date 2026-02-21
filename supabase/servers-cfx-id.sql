-- Optional Cfx.re server code for live player count (cfx.re/join/XXXXX)
-- Run in Supabase SQL editor

alter table public.servers add column if not exists cfx_id text;
