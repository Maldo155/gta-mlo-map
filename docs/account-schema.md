# Account schema setup

Run these in Supabase SQL editor (one-time):

```sql
-- Profiles
create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  bio text,
  is_creator boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Saved MLOs
create table if not exists saved_mlos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mlo_id text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists saved_mlos_unique
  on saved_mlos(user_id, mlo_id);

-- Reviews owner
alter table mlo_requests add column if not exists user_id uuid;
create index if not exists mlo_requests_user_id_idx on mlo_requests(user_id);

-- Account type (creator | player | city_owner)
alter table profiles add column if not exists account_type text default 'player';

-- Creator onboarding (store, discord, website)
alter table profiles add column if not exists creator_store_url text;
alter table profiles add column if not exists creator_discord_url text;
alter table profiles add column if not exists creator_website_url text;
alter table profiles add column if not exists creator_display_name text;

-- City owner onboarding (connect, discord, server name)
alter table profiles add column if not exists city_connect_url text;
alter table profiles add column if not exists city_discord_url text;
alter table profiles add column if not exists city_server_name text;
alter table profiles add column if not exists city_website_url text;
```

Notes:
- These APIs use the service role, so RLS is not required for this MVP.
- `mlo_id` is stored as text to avoid type mismatch if your `mlos.id` is not UUID.
