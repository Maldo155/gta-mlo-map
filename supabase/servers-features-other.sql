-- Add features_other text field for custom server features
-- Run in Supabase SQL editor

alter table public.servers add column if not exists features_other text;
