-- Run this in Supabase SQL Editor to fix badge errors and enable features_other.
-- Fixes: "Could not find the 'og_server' column"
-- Safe to run multiple times.

-- OG badge (max 20 servers)
alter table public.servers add column if not exists og_server boolean not null default false;
create index if not exists servers_og_server_idx on public.servers(og_server) where og_server = true;

-- Features other (custom features text)
alter table public.servers add column if not exists features_other text;

-- Media for hybrid modal (video + gallery)
alter table public.servers add column if not exists video_url text;
alter table public.servers add column if not exists gallery_images jsonb default '[]'::jsonb;
