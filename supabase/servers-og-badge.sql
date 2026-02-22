-- Add OG badge for first 20 FiveM servers (admin-assignable)
-- Run in Supabase SQL editor

alter table public.servers add column if not exists og_server boolean not null default false;

create index if not exists servers_og_server_idx on public.servers(og_server) where og_server = true;
