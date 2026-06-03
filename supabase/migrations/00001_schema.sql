-- ============================================
-- Irivia — Full Schema Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Profiles (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  magic_word TEXT NOT NULL,
  pattern INT[] NOT NULL DEFAULT '{}',
  avatar TEXT DEFAULT '🔥',
  level INT DEFAULT 1,
  xp INT DEFAULT 0,
  streak INT DEFAULT 0,
  contributions INT DEFAULT 0,
  following UUID[] DEFAULT '{}',
  followed_stories TEXT[] DEFAULT '{}',
  muted_stories TEXT[] DEFAULT '{}',
  badges TEXT[] DEFAULT '{🌱 Primeiro Post}',
  onboarding_completed BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_profiles_username ON public.profiles USING gin (username gin_trgm_ops);
CREATE INDEX idx_profiles_xp ON public.profiles(xp DESC);

-- 2. Stories
CREATE TABLE public.stories (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  seed TEXT DEFAULT '',
  genre TEXT DEFAULT 'fantasia',
  total_branches INT DEFAULT 0,
  participants INT DEFAULT 0,
  author_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_stories_genre ON public.stories(genre);
CREATE INDEX idx_stories_created ON public.stories(created_at DESC);
CREATE INDEX idx_stories_title ON public.stories USING gin (title gin_trgm_ops);

-- 3. Story Nodes
CREATE TABLE public.story_nodes (
  id TEXT PRIMARY KEY,
  story_id TEXT REFERENCES public.stories(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  author_id UUID REFERENCES public.profiles(id),
  emotion TEXT DEFAULT 'neutro',
  parent_id TEXT,
  votes INT DEFAULT 0,
  hot_votes INT DEFAULT 0,
  cold_votes INT DEFAULT 0,
  trending BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_nodes_story ON public.story_nodes(story_id);
CREATE INDEX idx_nodes_parent ON public.story_nodes(parent_id);
CREATE INDEX idx_nodes_trending ON public.story_nodes(trending) WHERE trending = true;

-- 4. Votes
CREATE TABLE public.votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  node_id TEXT REFERENCES public.story_nodes(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('hot', 'cold')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, node_id)
);

CREATE INDEX idx_votes_user ON public.votes(user_id);
CREATE INDEX idx_votes_node ON public.votes(node_id);

-- 5. Comments
CREATE TABLE public.comments (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  author_avatar TEXT DEFAULT '🔥',
  author_id UUID REFERENCES public.profiles(id),
  node_id TEXT NOT NULL REFERENCES public.story_nodes(id) ON DELETE CASCADE,
  story_id TEXT NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_comments_node ON public.comments(node_id);

-- 6. Reports
CREATE TABLE public.reports (
  id TEXT PRIMARY KEY,
  node_id TEXT NOT NULL REFERENCES public.story_nodes(id) ON DELETE CASCADE,
  story_id TEXT NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  reported_by TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_reports_status ON public.reports(status);

-- 7. Feedbacks
CREATE TABLE public.feedbacks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Admin Logs
CREATE TABLE public.admin_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  admin_username TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_admin_logs_created ON public.admin_logs(created_at DESC);

-- 9. Daily Challenges
CREATE TABLE public.daily_challenges (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('write', 'vote', 'branch', 'read')),
  prompt TEXT NOT NULL,
  xp INT NOT NULL,
  date TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Page Visits Log
CREATE TABLE public.page_visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  path TEXT DEFAULT '/',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_page_visits_created ON public.page_visits(created_at);

-- 11. Vote Log (timeline)
CREATE TABLE public.vote_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_vote_log_created ON public.vote_log(created_at);

-- ============================================
-- Row Level Security
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vote_log ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all profiles, update only own
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Stories: anyone can read, only authenticated can insert/update
CREATE POLICY "stories_select" ON public.stories FOR SELECT USING (true);
CREATE POLICY "stories_insert" ON public.stories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "stories_update" ON public.stories FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "stories_delete" ON public.stories FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Nodes: anyone can read, authenticated can insert
CREATE POLICY "nodes_select" ON public.story_nodes FOR SELECT USING (true);
CREATE POLICY "nodes_insert" ON public.story_nodes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "nodes_delete" ON public.story_nodes FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Votes: authenticated can insert/delete own
CREATE POLICY "votes_select" ON public.votes FOR SELECT USING (true);
CREATE POLICY "votes_insert" ON public.votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "votes_delete" ON public.votes FOR DELETE USING (auth.uid() = user_id);

-- Comments: anyone can read, authenticated can insert
CREATE POLICY "comments_select" ON public.comments FOR SELECT USING (true);
CREATE POLICY "comments_insert" ON public.comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Reports: authenticated can insert, admin can read/update
CREATE POLICY "reports_insert" ON public.reports FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "reports_select" ON public.reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "reports_update" ON public.reports FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Feedbacks: authenticated can insert, admin can read
CREATE POLICY "feedbacks_insert" ON public.feedbacks FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "feedbacks_select" ON public.feedbacks FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Admin logs: admin can read/insert
CREATE POLICY "admin_logs_select" ON public.admin_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "admin_logs_insert" ON public.admin_logs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- ============================================
-- Functions
-- ============================================

-- Promote user to admin (called by setup API)
CREATE OR REPLACE FUNCTION public.promote_to_admin(target_username TEXT)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles SET is_admin = true WHERE username = target_username;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get admin status for a user
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS boolean AS $$
DECLARE
  result boolean;
BEGIN
  SELECT is_admin INTO result FROM public.profiles WHERE id = user_id;
  RETURN COALESCE(result, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, magic_word, pattern, avatar)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'magic_word',
    ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'pattern')::int),
    COALESCE(NEW.raw_user_meta_data->>'avatar', '🔥')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
