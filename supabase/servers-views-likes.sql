-- Add views and likes for FiveM server tiles
-- Run in Supabase SQL editor

-- Views: incremented when any button on a tile is clicked
alter table public.servers add column if not exists views int not null default 0;

-- Likes: one per user per server, toggleable
create table if not exists public.server_likes (
  server_id uuid not null references public.servers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (server_id, user_id)
);

create index if not exists server_likes_user_id_idx on public.server_likes(user_id);
create index if not exists server_likes_server_id_idx on public.server_likes(server_id);

alter table public.server_likes enable row level security;

drop policy if exists "server_likes_select" on public.server_likes;
create policy "server_likes_select" on public.server_likes for select using (true);

drop policy if exists "server_likes_insert_own" on public.server_likes;
create policy "server_likes_insert_own" on public.server_likes for insert with check (auth.uid() = user_id);

drop policy if exists "server_likes_delete_own" on public.server_likes;
create policy "server_likes_delete_own" on public.server_likes for delete using (auth.uid() = user_id);
