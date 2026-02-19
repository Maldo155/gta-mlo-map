# Creator Tiles Schema

## Table: creator_tiles

```sql
create table if not exists public.creator_tiles (
  creator_key text primary key,
  banner_url text,
  fit_mode text check (fit_mode in ('cover', 'contain')),
  zoom numeric,
  position text,
  button_label text,
  button_url text,
  tile_border_glow boolean default false,
  tile_border_glow_color text,
  tile_text text,
  tile_text_font text,
  tile_text_size int default 16,
  tile_text_color text default '#ffffff',
  tile_text_position text default 'left center',
  logo_url text,
  spotlight_logo_size numeric,
  verified_creator boolean default false,
  partnership boolean default false,
  sort_order int,
  updated_at timestamptz not null default now()
);

-- If table already exists, add sort_order:
-- alter table public.creator_tiles add column if not exists sort_order int;

-- If table already exists, add badge columns:
-- alter table public.creator_tiles add column if not exists verified_creator boolean default false;
-- alter table public.creator_tiles add column if not exists partnership boolean default false;

-- Discord & description (optional, for Discord forum auto-posting):
-- alter table public.creator_tiles add column if not exists creator_discord_invite text;
-- alter table public.creator_tiles add column if not exists creator_description text;
-- Or run: supabase/creator-tiles-discord-fields.sql
--
-- If table already exists, add spotlight columns (required for Creator Spotlight logos).
-- Run in Supabase SQL editor for the project your **production** site uses (Vercel env vars):
--   alter table public.creator_tiles add column if not exists logo_url text;
--   alter table public.creator_tiles add column if not exists spotlight_logo_size numeric;
--
-- Optional earlier columns if you added the table before:
-- alter table public.creator_tiles add column if not exists tile_border_glow boolean default false;
-- alter table public.creator_tiles add column if not exists tile_border_glow_color text;
-- alter table public.creator_tiles add column if not exists tile_text text;
-- alter table public.creator_tiles add column if not exists tile_text_font text;
-- alter table public.creator_tiles add column if not exists tile_text_size int default 16;
-- alter table public.creator_tiles add column if not exists tile_text_color text default '#ffffff';
-- alter table public.creator_tiles add column if not exists tile_text_position text default 'left center';
```

## Storage

- Create a public bucket named `creator-tiles`.
- Public read is required for tile images (and for files under `logos/`) so tiles and Creator Spotlight logos render.
