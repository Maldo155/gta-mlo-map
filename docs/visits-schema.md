# Site Visits Table

Create this table in Supabase to store the visit counter:

```sql
create table if not exists public.site_visits (
  id int primary key,
  count bigint not null default 0,
  updated_at timestamptz default now()
);
```

Optional: seed the row

```sql
insert into public.site_visits (id, count)
values (1, 0)
on conflict (id) do nothing;
```

Note: the counter now increments on every page load and does not use
`site_visit_events`.
