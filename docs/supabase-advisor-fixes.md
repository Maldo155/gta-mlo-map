# Supabase Advisor Issues – How to Fix

Supabase’s **Security Advisor** and **Performance Advisor** scan your database and report issues (you’re seeing about 18). This guide explains how to read them and fix the most common ones.

## Where to See the Issues

1. Open the [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Database** → **Security Advisor** and **Database** → **Performance Advisor**
4. Click each listed issue to see table names, columns, and suggested fixes

## Common Checks and Fixes

| Code | Name | Meaning | Typical Fix |
|------|------|---------|-------------|
| **001** | Unindexed foreign keys | Foreign key columns without indexes | Add `CREATE INDEX` on the FK column |
| **002** | Auth users exposed | `auth.users` exposed via PostgREST | Exclude `auth.users` from API or fix RLS |
| **004** | No primary key | Tables without a primary key | Add `PRIMARY KEY` to tables that need it |
| **005** | Unused index | Indexes never used in queries | Consider dropping with `DROP INDEX` |
| **007** | Policy exists RLS disabled | Policies exist but RLS is off | Run `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` |
| **008** | RLS enabled no policy | RLS on but no policies | Add policies (e.g. `CREATE POLICY`) |
| **009** | Duplicate index | Redundant indexes | Drop one of the duplicate indexes |
| **013** | RLS disabled in public | Tables in `public` without RLS | Enable RLS and add policies |
| **020** | Table bloat | Heavy table bloat | Run `VACUUM` (and optionally `ANALYZE`) |

## Run the Fix Script

The SQL script below addresses common issues for MLOMesh tables. **Review it first** and run in the Supabase SQL Editor: **Database** → **SQL Editor** → New Query.

```sql
-- ============================================================
-- MLOMesh – Supabase Advisor Fixes
-- Run in Supabase SQL Editor. Review before executing.
-- ============================================================

-- 1. INDEXES ON FOREIGN KEYS (fixes 001 - unindexed foreign keys)
-- Add only if the index doesn't already exist (safe to run multiple times)

CREATE INDEX IF NOT EXISTS ix_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS ix_saved_mlos_user_id ON public.saved_mlos(user_id);
CREATE INDEX IF NOT EXISTS ix_mlo_requests_user_id ON public.mlo_requests(user_id) WHERE user_id IS NOT NULL;

-- chat_messages.thread_id usually already has idx_chat_messages_thread_id from chat-tables.sql

-- 2. ENABLE RLS ON PUBLIC TABLES (fixes 0013 - RLS disabled in public)
-- Your app uses the service role, so RLS is bypassed for API calls.
-- These policies satisfy the advisor and restrict direct anon access.

-- Read-only public tables: allow anyone to SELECT
DO $$
DECLARE
  t text;
  tables_readonly text[] := ARRAY['creator_tiles','site_banner','site_visits','mlo_views','mlos'];
BEGIN
  FOREACH t IN ARRAY tables_readonly
  LOOP
    EXECUTE format('ALTER TABLE IF EXISTS public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "allow_public_read" ON public.%I', t);
    EXECUTE format('CREATE POLICY "allow_public_read" ON public.%I FOR SELECT USING (true)', t);
  EXCEPTION WHEN undefined_table THEN NULL;  -- table might not exist
  END LOOP;
END $$;

-- API-only tables: only service_role can access (anon gets nothing)
-- Note: service_role bypasses RLS, so API behavior is unchanged
DO $$
DECLARE
  t text;
  tables_api text[] := ARRAY['mlo_requests','mlo_submissions','chat_threads','chat_messages','profiles','saved_mlos'];
BEGIN
  FOREACH t IN ARRAY tables_api
  LOOP
    EXECUTE format('ALTER TABLE IF EXISTS public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "service_role_only" ON public.%I', t);
    EXECUTE format('CREATE POLICY "service_role_only" ON public.%I FOR ALL USING (auth.role() = ''service_role'')', t);
  EXCEPTION WHEN undefined_table THEN NULL;
  END LOOP;
END $$;
```

## Part 2: Fix the 11 Warnings + Multiple Permissive

After running the script above, if you still see **11 Warnings** (Auth RLS InitPlan, Multiple Permissive Policies) and **5 Suggestions**:

1. Run **`supabase/advisor-fixes-part2.sql`** in the SQL Editor. This:
   - Wraps `auth.role()` in `(select auth.role())` to fix Auth RLS InitPlan (6 tables)
   - Consolidates policies on `mlos` and `mlo_submissions` to remove Multiple Permissive
2. **Part 3** – If you still see **2 Errors** (RLS on `site_visit_events`, `fivem_servers`) and **2 Warnings** (Function Search Path, Leaked Password): Run **`supabase/advisor-fixes-part3.sql`** for the RLS and function fixes. For **Leaked Password Protection**, go to **Authentication** → **Providers** (or **Settings**) in the Supabase dashboard and enable it.
3. The **5 Suggestions (Info)** are optional:
   - **Unused index** (4 tables): Safe to ignore. These indexes support foreign keys and future queries.
   - **Auth connection strategy**: Project Settings only; adjust if you know what you're doing.

## Fixes You Should Handle Manually

- **002 – Auth users exposed**: If `auth.users` is exposed via the API, remove it from the exposed schema or tighten RLS.
- **005 – Unused index**: Check query plans before dropping; some indexes may be used infrequently.
- **009 – Duplicate index**: Compare index definitions and drop the redundant one.
- **020 – Table bloat**: Run `VACUUM ANALYZE <table>;` in the SQL Editor (or use Supabase’s maintenance tools).

## After Applying Fixes

1. Run the script above in the SQL Editor
2. Go back to **Security Advisor** and **Performance Advisor**
3. Click **Rerun** or refresh
4. Work through remaining issues from the list and apply targeted fixes

If you paste specific advisor messages (including table/column names), they can be turned into exact SQL fixes.
