-- Add Discord forum fields for FiveM server auto-posting to #your-cities
-- Run in Supabase SQL Editor

ALTER TABLE public.servers
  ADD COLUMN IF NOT EXISTS discord_thread_id text,
  ADD COLUMN IF NOT EXISTS discord_message_id text;
