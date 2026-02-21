-- Required fields: server_name, discord_url, description. connect_url optional.
-- Run in Supabase SQL editor

alter table public.servers alter column connect_url drop not null;
