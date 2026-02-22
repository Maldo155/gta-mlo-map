-- Views and Likes for FiveM server tiles (complete setup)
-- Run in Supabase SQL editor - creates everything needed including anonymous likes

-- Views: incremented when any button on a tile is clicked
alter table public.servers add column if not exists views int not null default 0;

-- Likes: one per user/visitor per server (signed-in or anonymous)
create table if not exists public.server_likes (
  id uuid primary key default gen_random_uuid(),
  server_id uuid not null references public.servers(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  anonymous_id text,
  created_at timestamptz not null default now(),
  constraint server_likes_user_or_anon check ((user_id is not null) or (anonymous_id is not null))
);

create index if not exists server_likes_user_id_idx on public.server_likes(user_id);
create index if not exists server_likes_server_id_idx on public.server_likes(server_id);

-- One like per signed-in user per server
create unique index if not exists server_likes_user_unique on public.server_likes(server_id, user_id) where user_id is not null;

-- One like per anonymous visitor per server
create unique index if not exists server_likes_anon_unique on public.server_likes(server_id, anonymous_id) where anonymous_id is not null;

alter table public.server_likes enable row level security;

drop policy if exists "server_likes_select" on public.server_likes;
create policy "server_likes_select" on public.server_likes for select using (true);

drop policy if exists "server_likes_insert_own" on public.server_likes;
create policy "server_likes_insert_own" on public.server_likes for insert with check (auth.uid() = user_id);

drop policy if exists "server_likes_delete_own" on public.server_likes;
create policy "server_likes_delete_own" on public.server_likes for delete using (auth.uid() = user_id);
