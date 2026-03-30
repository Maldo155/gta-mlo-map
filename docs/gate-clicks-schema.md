# Gate Clicks Table

Global counter for gate tile clicks (MLOs, Map, FiveM Cities). Run the migration in Supabase SQL Editor:

**File:** `supabase/migrations/20250227000000_gate_clicks.sql`

Or run this SQL manually:

```sql
create table if not exists public.gate_clicks (
  id int primary key,
  mlo bigint not null default 0,
  map bigint not null default 0,
  cities bigint not null default 0,
  updated_at timestamptz default now()
);

insert into public.gate_clicks (id, mlo, map, cities)
values (1, 0, 0, 0)
on conflict (id) do nothing;

alter table if exists public.gate_clicks enable row level security;
drop policy if exists "allow_public_read" on public.gate_clicks;
create policy "allow_public_read" on public.gate_clicks for select using (true);

create or replace function public.increment_gate_click(p_tile text)
returns json
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  r record;
begin
  if p_tile not in ('mlo', 'map', 'cities') then
    raise exception 'invalid tile: %', p_tile;
  end if;
  execute format(
    'update public.gate_clicks set %I = %I + 1, updated_at = now() where id = 1 returning mlo, map, cities',
    p_tile, p_tile
  ) into r;
  return json_build_object('mlo', r.mlo, 'map', r.map, 'cities', r.cities);
end;
$$;
```
