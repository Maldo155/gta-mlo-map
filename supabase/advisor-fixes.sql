-- MLOMesh – Supabase Advisor Fixes
-- Run in Supabase SQL Editor (Database → SQL Editor → New Query)
-- Fixes common 001 unindexed FKs and 0013 RLS disabled
--
-- If you see "relation does not exist", that table isn't in your project yet.
-- Comment out or remove that table's block and re-run.

-- 1. Indexes on foreign keys (001)
CREATE INDEX IF NOT EXISTS ix_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS ix_saved_mlos_user_id ON public.saved_mlos(user_id);
CREATE INDEX IF NOT EXISTS mlo_requests_user_id_idx ON public.mlo_requests(user_id);

-- 2. Enable RLS on read-only public tables (013)
ALTER TABLE IF EXISTS public.creator_tiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_public_read" ON public.creator_tiles;
CREATE POLICY "allow_public_read" ON public.creator_tiles FOR SELECT USING (true);

ALTER TABLE IF EXISTS public.site_banner ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_public_read" ON public.site_banner;
CREATE POLICY "allow_public_read" ON public.site_banner FOR SELECT USING (true);

ALTER TABLE IF EXISTS public.site_visits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_public_read" ON public.site_visits;
CREATE POLICY "allow_public_read" ON public.site_visits FOR SELECT USING (true);

ALTER TABLE IF EXISTS public.mlo_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_public_read" ON public.mlo_views;
CREATE POLICY "allow_public_read" ON public.mlo_views FOR SELECT USING (true);

ALTER TABLE IF EXISTS public.mlos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_public_read" ON public.mlos;
CREATE POLICY "allow_public_read" ON public.mlos FOR SELECT USING (true);

-- 3. Enable RLS on API-only tables – service_role bypasses RLS; anon blocked
ALTER TABLE IF EXISTS public.mlo_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_only" ON public.mlo_requests;
CREATE POLICY "service_role_only" ON public.mlo_requests FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE IF EXISTS public.mlo_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_only" ON public.mlo_submissions;
CREATE POLICY "service_role_only" ON public.mlo_submissions FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE IF EXISTS public.chat_threads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_only" ON public.chat_threads;
CREATE POLICY "service_role_only" ON public.chat_threads FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE IF EXISTS public.chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_only" ON public.chat_messages;
CREATE POLICY "service_role_only" ON public.chat_messages FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_only" ON public.profiles;
CREATE POLICY "service_role_only" ON public.profiles FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE IF EXISTS public.saved_mlos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_only" ON public.saved_mlos;
CREATE POLICY "service_role_only" ON public.saved_mlos FOR ALL USING (auth.role() = 'service_role');
