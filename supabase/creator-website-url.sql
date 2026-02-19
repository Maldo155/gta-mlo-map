-- Add creator_website_url for Discord section (Website line in forum posts)
-- Run in Supabase SQL Editor

ALTER TABLE public.creator_tiles
  ADD COLUMN IF NOT EXISTS creator_website_url text;
