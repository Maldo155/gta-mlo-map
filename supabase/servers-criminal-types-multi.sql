-- Criminal RP: multi-select (criminal_types array) replaces single criminal_depth
-- Run in Supabase SQL editor

-- 1. Add new column for multiple selections
alter table public.servers add column if not exists criminal_types jsonb default '[]'::jsonb;

-- 2. Migrate: "both" -> ["heists","gangs"], others -> single-item array
update public.servers set criminal_types = '["heists","gangs"]'::jsonb where criminal_depth = 'both';
update public.servers set criminal_types = jsonb_build_array(criminal_depth)
where criminal_depth is not null and criminal_depth != '' and criminal_depth != 'both'
  and (criminal_types is null or criminal_types = '[]'::jsonb);

-- 3. Drop old column
alter table public.servers drop column if exists criminal_depth;

-- 4. Add custom/other criminal types (free-text for anything we missed)
alter table public.servers add column if not exists criminal_other text;
