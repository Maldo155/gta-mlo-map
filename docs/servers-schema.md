# Servers Schema (FiveM Server Listings)

## Overview

Structured server profiles for MLOMesh's FiveM server directory. Designed for traffic + future monetization (verified badges, featured placement, analytics).

## Table: servers

```sql
create table if not exists public.servers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Core Info
  server_name text not null,
  owner_name text,
  region text check (region in ('NA', 'EU', 'SA', 'OC', 'ASIA', 'OTHER')),
  language text default 'English',
  avg_player_count int,
  max_slots int,
  connect_url text not null,
  discord_url text,
  website_url text,
  description text,

  -- Gameplay Tags (search/filter goldmine)
  economy_type text check (economy_type in ('realistic', 'boosted', 'hardcore', 'custom')),
  rp_type text check (rp_type in ('serious', 'semi', 'casual')),
  whitelisted boolean default false,
  pd_active boolean default true,
  ems_active boolean default true,
  criminal_depth text check (criminal_depth in ('heists', 'gangs', 'both', 'minimal')),
  civ_jobs_count int,
  custom_mlo_count int,
  custom_script_count int,
  no_pay_to_win boolean default false,
  controller_friendly boolean default false,
  new_player_friendly boolean default true,

  -- MLO Stack (unique MLOMesh advantage)
  mlo_ids jsonb default '[]'::jsonb,

  -- Monetization hooks (Phase 3)
  verified boolean default false,
  featured boolean default false,
  featured_order int,

  -- Media
  banner_url text,
  thumbnail_url text
);

-- Indexes for filters
create index if not exists servers_region_idx on servers(region);
create index if not exists servers_economy_type_idx on servers(economy_type);
create index if not exists servers_rp_type_idx on servers(rp_type);
create index if not exists servers_whitelisted_idx on servers(whitelisted);
create index if not exists servers_no_pay_to_win_idx on servers(no_pay_to_win);
create index if not exists servers_verified_idx on servers(verified);
create index if not exists servers_featured_idx on servers(featured);
create index if not exists servers_created_at_idx on servers(created_at desc);

-- RLS: public read, insert/update via API (or admin)
alter table public.servers enable row level security;

create policy "servers_public_read" on public.servers for select using (true);
create policy "servers_insert" on public.servers for insert with check (true);
create policy "servers_update" on public.servers for update using (true);
```

## Storage

- Bucket `server-images` for logos and banners. Create via Supabase Dashboard (Storage → New bucket → "server-images", Public: Yes) or run `supabase/server-images-bucket.sql`.
- Users can upload images or paste external URLs for logo and banner.

## Tag Reference

| Field | Values | Player Want |
|-------|--------|-------------|
| economy_type | realistic, boosted, hardcore, custom | Realistic economy |
| rp_type | serious, semi, casual | Serious RP |
| whitelisted | boolean | Whitelisted servers |
| pd_active | boolean | Active PD |
| ems_active | boolean | Active EMS |
| criminal_depth | heists, gangs, both, minimal | Criminal content |
| no_pay_to_win | boolean | No P2W badge |
| controller_friendly | boolean | Controller support |
| new_player_friendly | boolean | Beginner friendly |

## SEO / Filter Pages (Phase 2+)

- /servers/serious-rp
- /servers/realistic-economy
- /servers/no-pay-to-win
- /servers/whitelisted
- /servers/high-custom-mlo
