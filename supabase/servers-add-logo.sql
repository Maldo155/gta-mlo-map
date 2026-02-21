-- Add logo_url to servers (thumbnail_url = small preview, logo_url = server logo/icon)
-- Run in Supabase SQL editor
alter table public.servers add column if not exists logo_url text;
