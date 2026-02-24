-- Add video and gallery support for hybrid modal (optional - run only if using hybrid)
-- Run in Supabase SQL editor

alter table public.servers add column if not exists video_url text;
alter table public.servers add column if not exists gallery_images jsonb default '[]'::jsonb;
