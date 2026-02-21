-- Add user_id to servers table (links server to Discord-authenticated user)
-- Run in Supabase SQL editor

alter table public.servers add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists servers_user_id_idx on servers(user_id);
