-- Allow anonymous likes (one per visitor per server)
-- Run in Supabase SQL editor (after servers-views-likes.sql)

-- Add anonymous_id for visitors who aren't signed in
alter table public.server_likes add column if not exists anonymous_id text;

-- Make user_id nullable (anonymous likes have no user_id)
alter table public.server_likes alter column user_id drop not null;

-- Add id column for new primary key (replacing composite)
alter table public.server_likes add column if not exists id uuid default gen_random_uuid();
update public.server_likes set id = gen_random_uuid() where id is null;
alter table public.server_likes alter column id set not null;

-- Drop old primary key and add new one
alter table public.server_likes drop constraint if exists server_likes_pkey;
alter table public.server_likes add primary key (id);

-- One like per signed-in user per server
create unique index if not exists server_likes_user_unique on public.server_likes(server_id, user_id) where user_id is not null;

-- One like per anonymous visitor per server
create unique index if not exists server_likes_anon_unique on public.server_likes(server_id, anonymous_id) where anonymous_id is not null;

-- Must have either user_id or anonymous_id
alter table public.server_likes drop constraint if exists server_likes_user_or_anon;
alter table public.server_likes add constraint server_likes_user_or_anon check ((user_id is not null) or (anonymous_id is not null));
