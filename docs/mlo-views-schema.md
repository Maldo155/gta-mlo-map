# MLO views schema

Run in Supabase SQL editor (one-time):

```sql
create table if not exists mlo_views (
  mlo_id text primary key,
  view_count integer not null default 0,
  updated_at timestamptz not null default now()
);
```
