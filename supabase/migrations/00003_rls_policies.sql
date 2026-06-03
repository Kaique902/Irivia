-- ============================================
-- Irivia — Missing RLS policies for analytics tables
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. page_visits: authenticated users can insert own visits
CREATE POLICY "page_visits_insert" ON public.page_visits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. page_visits: admins can read all (for analytics)
CREATE POLICY "page_visits_select" ON public.page_visits
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- 3. vote_log: authenticated users can insert own logs
CREATE POLICY "vote_log_insert" ON public.vote_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. vote_log: admins can read all (for analytics)
CREATE POLICY "vote_log_select" ON public.vote_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );
