-- Add enabled toggle to homepage banner (default true for existing)
alter table public.site_banner add column if not exists enabled boolean default true;

-- Create FiveM servers page banner table
create table if not exists public.site_banner_servers (
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
  constraint site_banner_servers_single_row check (id = 1)
);

insert into public.site_banner_servers (id, enabled, title, subtitle)
values (1, false, null, null)
on conflict (id) do nothing;

alter table public.site_banner_servers enable row level security;
drop policy if exists "site_banner_servers_public_read" on public.site_banner_servers;
create policy "site_banner_servers_public_read" on public.site_banner_servers for select using (true);
