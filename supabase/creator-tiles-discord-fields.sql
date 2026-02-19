-- Add Discord and description fields for creator tiles (used for Discord forum auto-posting)
-- Run in Supabase SQL Editor

ALTER TABLE public.creator_tiles
  ADD COLUMN IF NOT EXISTS creator_discord_invite text,
  ADD COLUMN IF NOT EXISTS creator_description text,
  ADD COLUMN IF NOT EXISTS creator_discord_thread_id text,
  ADD COLUMN IF NOT EXISTS creator_discord_message_id text;
