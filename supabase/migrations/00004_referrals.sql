-- ============================================
-- Irivia — Referral tracking table
-- Run this in Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL,
  medium TEXT DEFAULT 'link',
  campaign TEXT DEFAULT 'direct',
  story_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_referrals_created ON public.referrals(created_at DESC);
CREATE INDEX idx_referrals_source ON public.referrals(source);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Admins can read all referrals
CREATE POLICY "referrals_select" ON public.referrals
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Anyone (even anonymous) can insert a referral
CREATE POLICY "referrals_insert" ON public.referrals
  FOR INSERT WITH CHECK (true);
