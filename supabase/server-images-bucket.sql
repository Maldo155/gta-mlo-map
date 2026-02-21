-- Create server-images bucket for server logos and banners
-- Run in Supabase SQL editor, or create via Dashboard: Storage → New bucket → "server-images", Public: Yes
insert into storage.buckets (id, name, public)
values ('server-images', 'server-images', true)
on conflict (id) do update set public = true;
