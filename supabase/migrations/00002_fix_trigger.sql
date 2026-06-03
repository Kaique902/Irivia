-- ============================================
-- Irivia — Fix trigger pattern cast + missing functions
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Fix trigger: (NEW.raw_user_meta_data->>'pattern')::int[] is INVALID
--    Use: ARRAY(SELECT jsonb_array_elements_text(...)::int)
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

-- 2. Add missing increment_branches function
CREATE OR REPLACE FUNCTION public.increment_branches(story_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE public.stories SET total_branches = total_branches + 1 WHERE id = story_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
