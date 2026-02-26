# Site Banner Servers + Homepage Enabled

Run these migrations in Supabase SQL editor.

## 1. Add `enabled` to site_banner (homepage)

```sql
alter table public.site_banner add column if not exists enabled boolean not null default true;
```

## 2. Create site_banner_servers table (FiveM servers page)

```sql
create table if not exists public.site_banner_servers (
  id int primary key default 1,
  enabled boolean not null default true,
  title text,
  subtitle text,
  font_family text,
  title_font_size int default 28,
  subtitle_font_size int default 16,
  title_font_weight text default '800',
  letter_spacing text default '0.5px',
  subtitle_color text default '#94a3b8',
  title_font_color text,
  background_color text,
  border_color text,
  animation text default 'flash',
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);

insert into public.site_banner_servers (id, enabled, title, subtitle)
values (1, false, 'FiveM Servers', 'Find and claim your city. Browse by economy, region, and more.')
on conflict (id) do nothing;

alter table public.site_banner_servers enable row level security;
drop policy if exists "Allow public read" on public.site_banner_servers;
create policy "Allow public read" on public.site_banner_servers for select using (true);
```
