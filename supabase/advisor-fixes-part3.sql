-- MLOMesh – Supabase Advisor Fixes (Part 3)
-- Fixes the remaining 2 Errors + 2 Warnings from your latest run
--
-- Run in Supabase SQL Editor. Expect the "destructive operation" warning – safe to run.

-- ============================================================
-- 1. Fix 2 ERRORS: RLS Disabled in Public
-- Tables: site_visit_events, fivem_servers
-- ============================================================

-- site_visit_events (legacy table – visits use site_visits now)
ALTER TABLE IF EXISTS public.site_visit_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_only" ON public.site_visit_events;
CREATE POLICY "service_role_only" ON public.site_visit_events FOR ALL
  USING ((select auth.role()) = 'service_role');

-- fivem_servers (your FiveM servers table)
ALTER TABLE IF EXISTS public.fivem_servers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_public_read" ON public.fivem_servers;
CREATE POLICY "allow_public_read" ON public.fivem_servers FOR SELECT USING (true);
-- If fivem_servers should be API-only (no direct read), use this instead:
-- DROP POLICY IF EXISTS "allow_public_read" ON public.fivem_servers;
-- CREATE POLICY "service_role_only" ON public.fivem_servers FOR ALL
--   USING ((select auth.role()) = 'service_role');

-- ============================================================
-- 2. Fix WARNING: Function Search Path Mutable
-- Function: public.increment_site_visits
-- ============================================================

ALTER FUNCTION public.increment_site_visits(integer)
  SET search_path = 'public';

-- If the function uses a different arg type (e.g. bigint), try:
-- ALTER FUNCTION public.increment_site_visits(bigint) SET search_path = 'public';
