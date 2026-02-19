-- MLOMesh – Supabase Advisor Fixes (Part 2)
-- Fixes remaining 11 Warnings + consolidates Multiple Permissive
-- Run in Supabase SQL Editor after advisor-fixes.sql
--
-- Fixes:
-- 1. Auth RLS InitPlan – wrap auth.role() in (select ...) for better performance
-- 2. Multiple Permissive Policies – drop all policies on mlos/mlo_submissions, keep one each

-- ============================================================
-- 1. Fix Auth RLS InitPlan (11 warnings on 6 tables)
-- Change: auth.role() → (select auth.role())
-- ============================================================

DROP POLICY IF EXISTS "service_role_only" ON public.mlo_requests;
CREATE POLICY "service_role_only" ON public.mlo_requests FOR ALL
  USING ((select auth.role()) = 'service_role');

DROP POLICY IF EXISTS "service_role_only" ON public.mlo_submissions;
CREATE POLICY "service_role_only" ON public.mlo_submissions FOR ALL
  USING ((select auth.role()) = 'service_role');

DROP POLICY IF EXISTS "service_role_only" ON public.chat_threads;
CREATE POLICY "service_role_only" ON public.chat_threads FOR ALL
  USING ((select auth.role()) = 'service_role');

DROP POLICY IF EXISTS "service_role_only" ON public.chat_messages;
CREATE POLICY "service_role_only" ON public.chat_messages FOR ALL
  USING ((select auth.role()) = 'service_role');

DROP POLICY IF EXISTS "service_role_only" ON public.profiles;
CREATE POLICY "service_role_only" ON public.profiles FOR ALL
  USING ((select auth.role()) = 'service_role');

DROP POLICY IF EXISTS "service_role_only" ON public.saved_mlos;
CREATE POLICY "service_role_only" ON public.saved_mlos FOR ALL
  USING ((select auth.role()) = 'service_role');

-- ============================================================
-- 2. Fix Multiple Permissive Policies (mlos, mlo_submissions)
-- Drop ALL existing policies, then create exactly one per table
-- ============================================================

-- mlos: drop every policy, keep only one SELECT for public read
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'mlos'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.mlos', pol.policyname);
  END LOOP;
END $$;
CREATE POLICY "allow_public_read" ON public.mlos FOR SELECT USING (true);

-- mlo_submissions: drop every policy, keep only service_role
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'mlo_submissions'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.mlo_submissions', pol.policyname);
  END LOOP;
END $$;
CREATE POLICY "service_role_only" ON public.mlo_submissions FOR ALL
  USING ((select auth.role()) = 'service_role');
