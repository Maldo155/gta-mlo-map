-- MLOMesh FiveM Servers Table
-- Run in Supabase SQL editor for your project

create table if not exists public.servers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

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

  mlo_ids jsonb default '[]'::jsonb,

  verified boolean default false,
  featured boolean default false,
  featured_order int,

  banner_url text,
  thumbnail_url text
);

create index if not exists servers_region_idx on servers(region);
create index if not exists servers_economy_type_idx on servers(economy_type);
create index if not exists servers_rp_type_idx on servers(rp_type);
create index if not exists servers_whitelisted_idx on servers(whitelisted);
create index if not exists servers_no_pay_to_win_idx on servers(no_pay_to_win);
create index if not exists servers_verified_idx on servers(verified);
create index if not exists servers_featured_idx on servers(featured);
create index if not exists servers_created_at_idx on servers(created_at desc);

alter table public.servers enable row level security;

drop policy if exists "servers_public_read" on public.servers;
create policy "servers_public_read" on public.servers for select using (true);

drop policy if exists "servers_insert" on public.servers;
create policy "servers_insert" on public.servers for insert with check (true);

drop policy if exists "servers_update" on public.servers;
create policy "servers_update" on public.servers for update using (true);
