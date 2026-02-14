-- Run this in Supabase SQL Editor to create live chat tables

CREATE TABLE IF NOT EXISTS public.chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  discord_message_id TEXT,
  discord_channel_id TEXT
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  from_visitor BOOLEAN NOT NULL DEFAULT true,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_id ON public.chat_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);

-- For Discord reply-from-channel: map Discord message ID -> thread
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS discord_message_id TEXT;
CREATE INDEX IF NOT EXISTS idx_chat_messages_discord_id ON public.chat_messages(discord_message_id) WHERE discord_message_id IS NOT NULL;

-- API uses Supabase service role (bypasses RLS). No extra policies needed.
