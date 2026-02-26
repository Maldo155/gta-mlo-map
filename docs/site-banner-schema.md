# Site Banner Tables

## Homepage banner (`site_banner`)

Create this table in Supabase to store the editable status banner (homepage):

```sql
create table if not exists public.site_banner (
  id int primary key default 1,
  title text not null default 'Site Status: Early Access',
  subtitle text not null default 'The site is live, but we''re still refining the design.',
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
  constraint single_row check (id = 1)
);
```

Migration for existing tables:

```sql
alter table public.site_banner add column if not exists font_family text;
alter table public.site_banner add column if not exists title_font_size int default 32;
alter table public.site_banner add column if not exists subtitle_font_size int default 20;
alter table public.site_banner add column if not exists title_font_weight text default '900';
alter table public.site_banner add column if not exists letter_spacing text default '0.8px';
alter table public.site_banner add column if not exists subtitle_color text default '#fde68a';
alter table public.site_banner add column if not exists background_color text;
alter table public.site_banner add column if not exists border_color text;
alter table public.site_banner add column if not exists title_font_color text;
alter table public.site_banner add column if not exists animation text default 'flash';
```

Seed the initial row:

```sql
insert into public.site_banner (id, title, subtitle)
values (1, 'Site Status: Early Access', 'The site is live, but we''re still refining the design.')
on conflict (id) do nothing;
```

Enable RLS (optional; service role bypasses it):

```sql
alter table public.site_banner enable row level security;
create policy "Allow public read" on public.site_banner for select using (true);
create policy "Allow admin write" on public.site_banner for all using (true);
```

## FiveM Servers page banner (`site_banner_servers`)

Run the migration in `supabase/migrations/site_banner_enabled_and_servers.sql` to:
- Add `enabled` column to `site_banner` (toggle homepage banner on/off)
- Create `site_banner_servers` table for the FiveM servers page banner with its own enabled toggle
