-- Create FiveM homepage banner table (for /cities)
create table if not exists public.site_banner_cities (
  id int primary key default 1,
  enabled boolean not null default false,
  title text,
  subtitle text,
  font_family text,
  title_font_size int default 32,
  subtitle_font_size int default 20,
  title_font_weight text default '900',
  letter_spacing text default '0.8px',
  subtitle_color text default '#fde68a',
  title_font_color text,
  background_color text,
  border_color text,
  animation text default 'flash',
  updated_at timestamptz not null default now(),
  constraint site_banner_cities_single_row check (id = 1)
);

insert into public.site_banner_cities (id, enabled, title, subtitle)
values (1, false, null, null)
on conflict (id) do nothing;

alter table public.site_banner_cities enable row level security;
drop policy if exists "site_banner_cities_public_read" on public.site_banner_cities;
create policy "site_banner_cities_public_read" on public.site_banner_cities for select using (true);

-- Create gate page banner table (for / when showing gate)
create table if not exists public.site_banner_gate (
  id int primary key default 1,
  enabled boolean not null default false,
  title text,
  subtitle text,
  font_family text,
  title_font_size int default 32,
  subtitle_font_size int default 20,
  title_font_weight text default '900',
  letter_spacing text default '0.8px',
  subtitle_color text default '#fde68a',
  title_font_color text,
  background_color text,
  border_color text,
  animation text default 'flash',
  updated_at timestamptz not null default now(),
  constraint site_banner_gate_single_row check (id = 1)
);

insert into public.site_banner_gate (id, enabled, title, subtitle)
values (1, false, null, null)
on conflict (id) do nothing;

alter table public.site_banner_gate enable row level security;
drop policy if exists "site_banner_gate_public_read" on public.site_banner_gate;
create policy "site_banner_gate_public_read" on public.site_banner_gate for select using (true);
