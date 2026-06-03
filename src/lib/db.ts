/**
 * Database abstraction layer.
 * Tries Supabase first, falls back to localStorage if not configured.
 */
import { getBrowserClient, getAdminClient, getSupabaseClient, supabaseUrl, supabaseAnonKey, isSupabaseConfigured } from './supabase';
import type { Story, StoryNode, Comment, Report, Challenge } from '@/types';

type User = {
  id: string;
  username: string;
  magicWord: string;
  pattern: number[];
  avatar: string;
  level: number;
  xp: number;
  streak: number;
  contributions: number;
  following: string[];
  followedStories: string[];
  mutedStories: string[];
  badges: string[];
  onboardingCompleted: boolean;
  isAdmin: boolean;
  createdAt: string;
};

// ─── Helpers ──────────────────────────────────────────────

const isServer = typeof window === 'undefined';

function getLocal<T>(key: string): T[] {
  if (isServer) return [];
  try {
    const stored = localStorage.getItem(`irivia-${key}`);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function setLocal<T>(key: string, data: T[]) {
  if (isServer) return;
  try {
    localStorage.setItem(`irivia-${key}`, JSON.stringify(data));
  } catch { /* quota exceeded */ }
}

// ─── Auth ──────────────────────────────────────────────────

export async function dbRegister(
  username: string,
  magicWord: string,
  pattern: number[],
): Promise<User | null> {
  if (!supabaseUrl || !supabaseAnonKey) return null;

  try {
    const client = await getSupabaseClient();
    const { data, error } = await client.auth.signUp({
      email: `${username.toLowerCase()}@irivia.local`,
      password: magicWord,
      options: {
        data: { username, magic_word: magicWord, pattern, avatar: '🔥' },
      },
    });
    if (error) throw error;
    if (data.user) {
      return {
        id: data.user.id,
        username,
        magicWord,
        pattern,
        avatar: '🔥',
        level: 1, xp: 0, streak: 0, contributions: 0,
        following: [], followedStories: [], mutedStories: [],
        badges: ['🌱 Primeiro Post'],
        onboardingCompleted: false, isAdmin: false,
        createdAt: new Date().toISOString(),
      };
    }
  } catch { /* registration failed */ }
  return null;
}

export async function dbLogin(
  username: string,
  magicWord: string,
  pattern: number[],
): Promise<User | null> {
  if (!supabaseUrl || !supabaseAnonKey) return null;

  try {
    const client = await getSupabaseClient();
    const { data, error } = await client.auth.signInWithPassword({
      email: `${username.toLowerCase()}@irivia.local`,
      password: magicWord,
    });
    if (error) throw error;
    if (data.user) {
      const { data: profile } = await client
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      if (profile) {
        if (JSON.stringify(profile.pattern) !== JSON.stringify(pattern)) return null;
        return profile as unknown as User;
      }
      // Profile not found (trigger may have failed) — insert it manually via admin client
      try {
        const admin = await getAdminClient();
        if (admin) {
          const { error: upsertErr } = await admin.from('profiles').upsert({
            id: data.user.id, username, magic_word: magicWord,
            pattern, avatar: '🔥', level: 1, xp: 0, streak: 0,
            contributions: 0, following: [], followed_stories: [],
            muted_stories: [], badges: ['🌱 Primeiro Post'],
            onboarding_completed: false, is_admin: false,
          }, { ignoreDuplicates: false });
          if (!upsertErr) {
            return {
              id: data.user.id, username, magicWord, pattern,
              avatar: '🔥', level: 1, xp: 0, streak: 0, contributions: 0,
              following: [], followedStories: [], mutedStories: [],
              badges: ['🌱 Primeiro Post'],
              onboardingCompleted: false, isAdmin: false,
              createdAt: new Date().toISOString(),
            };
          }
        }
      } catch { /* admin upsert failed */ }
    }
  } catch { /* login failed */ }
  return null;
}

// ─── Sync user updates ────────────────────────────────────

export async function dbUpdateUser(user: User, allUsers: User[]): Promise<void> {
  const supabase = await getBrowserClient();
  if (supabase) {
    try {
      await supabase.from('profiles').upsert({
        id: user.id,
        username: user.username,
        level: user.level,
        xp: user.xp,
        streak: user.streak,
        contributions: user.contributions,
        following: user.following,
        followed_stories: user.followedStories,
        muted_stories: user.mutedStories,
        onboarding_completed: user.onboardingCompleted,
        is_admin: user.isAdmin,
      });
    } catch { /* fall through */ }
  }
  setLocal('users', allUsers);
}

// ─── Stories ───────────────────────────────────────────────

export async function dbGetNodes(storyId: string): Promise<StoryNode[]> {
  if (!supabaseUrl || !supabaseAnonKey) return [];
  try {
    const client = await getSupabaseClient();
    const { data } = await client
      .from('story_nodes')
      .select('*')
      .eq('story_id', storyId)
      .order('created_at', { ascending: true });
    if (data) return data.map((n: any) => ({
      id: n.id,
      content: n.content,
      author: n.author,
      emotion: n.emotion,
      parentId: n.parent_id,
      votes: n.votes,
      hotVotes: n.hot_votes,
      coldVotes: n.cold_votes,
      trending: n.trending,
      createdAt: n.created_at,
    })) as StoryNode[];
  } catch { /* fall through */ }
  return [];
}

export async function dbGetStories(): Promise<Story[]> {
  if (!supabaseUrl || !supabaseAnonKey) return getLocal<Story>('stories');

  try {
    const client = await getSupabaseClient();
    const { data } = await client.from('stories').select('*').order('created_at', { ascending: false });
    if (!data || data.length === 0) {
      setLocal('stories', []);
      return [];
    }

    const stories = await Promise.all(data.map(async (row: any) => {
      const story = mapStory(row) as Story;
      const nodes = await dbGetNodes(story.id);
      story.nodes = nodes;
      return story;
    }));
    return stories;
  } catch {
    return getLocal<Story>('stories');
  }
}

export async function dbAddStory(story: Story): Promise<void> {
  const supabase = await getBrowserClient();
  if (supabase) {
    try {
      await supabase.from('stories').insert({
        id: story.id,
        title: story.title,
        seed: story.seed,
        genre: story.genre,
        total_branches: story.totalBranches,
        participants: story.participants,
        author_id: story.authorId,
        created_at: story.createdAt,
      });
      // Also insert the root node
      const rootNode = story.nodes[0];
      if (rootNode) {
        await supabase.from('story_nodes').insert({
          id: rootNode.id,
          story_id: story.id,
          content: rootNode.content,
          author: rootNode.author,
          emotion: rootNode.emotion,
          parent_id: rootNode.parentId,
          votes: rootNode.votes,
          hot_votes: rootNode.hotVotes,
          cold_votes: rootNode.coldVotes,
          trending: rootNode.trending,
          created_at: rootNode.createdAt,
        });
      }
      return;
    } catch { /* fall through */ }
  }
  const stories = getLocal<Story>('stories');
  setLocal('stories', [...stories, story]);
}

export async function dbRemoveStory(storyId: string): Promise<void> {
  const supabase = await getBrowserClient();
  if (supabase) {
    try {
      await supabase.from('stories').delete().eq('id', storyId);
      return;
    } catch { /* fall through */ }
  }
  const stories = getLocal<Story>('stories');
  setLocal('stories', stories.filter(s => s.id !== storyId));
}

export async function dbAddNode(storyId: string, node: StoryNode): Promise<void> {
  const supabase = await getBrowserClient();
  if (supabase) {
    try {
      await supabase.from('story_nodes').insert({
        id: node.id,
        story_id: storyId,
        content: node.content,
        author: node.author,
        emotion: node.emotion,
        parent_id: node.parentId,
        votes: node.votes,
        hot_votes: node.hotVotes,
        cold_votes: node.coldVotes,
        trending: node.trending,
        created_at: node.createdAt,
      });
      await supabase.rpc('increment_branches', { story_id: storyId });
      return;
    } catch { /* fall through */ }
  }
  const stories = getLocal<Story>('stories');
  setLocal('stories', stories.map(s =>
    s.id === storyId
      ? { ...s, nodes: [...s.nodes, node], totalBranches: s.totalBranches + 1 }
      : s
  ));
}

// ─── Votes ─────────────────────────────────────────────────

export async function dbVoteNode(
  userId: string,
  nodeId: string,
  type: 'hot' | 'cold',
  stories: Story[],
): Promise<Story[]> {
  if (!isValidUUID(userId)) {
    // localStorage user — skip Supabase, fall through
  } else {
    const supabase = await getBrowserClient();
    if (supabase) {
      try {
        await supabase.from('votes').upsert({
          user_id: userId,
          node_id: nodeId,
          type,
        }, { onConflict: 'user_id,node_id' });
        await supabase.from('vote_log').insert({ user_id: userId });
        return stories;
      } catch { /* fall through */ }
    }
  }
  // localStorage fallback
  return stories.map(s => ({
    ...s,
    nodes: s.nodes.map(n =>
      n.id === nodeId
        ? {
            ...n,
            votes: n.votes + 1,
            hotVotes: type === 'hot' ? n.hotVotes + 1 : n.hotVotes,
            coldVotes: type === 'cold' ? n.coldVotes + 1 : n.coldVotes,
          }
        : n
    ),
  }));
}

// ─── Comments ──────────────────────────────────────────────

export async function dbAddComment(comment: Comment): Promise<void> {
  const supabase = await getBrowserClient();
  if (supabase) {
    try {
      await supabase.from('comments').insert({
        id: comment.id,
        content: comment.content,
        author: comment.author,
        author_avatar: comment.authorAvatar,
        node_id: comment.nodeId,
        story_id: comment.storyId,
        created_at: comment.createdAt,
      });
      return;
    } catch { /* fall through */ }
  }
  const comments = getLocal<Comment>('comments');
  setLocal('comments', [...comments, comment]);
}

export async function dbGetComments(nodeId: string): Promise<Comment[]> {
  const supabase = await getBrowserClient();
  if (supabase) {
    try {
      const { data } = await supabase
        .from('comments')
        .select('*')
        .eq('node_id', nodeId)
        .order('created_at', { ascending: true });
      if (data) return data.map((c: any) => ({
        id: c.id, content: c.content, author: c.author, authorAvatar: c.author_avatar,
        nodeId: c.node_id, storyId: c.story_id, createdAt: c.created_at,
      })) as Comment[];
    } catch { /* fall through */ }
  }
  return getLocal<Comment>('comments').filter(c => c.nodeId === nodeId);
}

// ─── Reports ───────────────────────────────────────────────

export async function dbAddReport(report: Report): Promise<void> {
  const supabase = await getBrowserClient();
  if (supabase) {
    try {
      await supabase.from('reports').insert({
        id: report.id,
        node_id: report.nodeId,
        story_id: report.storyId,
        reason: report.reason,
        reported_by: report.reportedBy,
        content: report.content,
        status: report.status,
        created_at: report.createdAt,
      });
      return;
    } catch { /* fall through */ }
  }
  const reports = getLocal<Report>('reports');
  setLocal('reports', [...reports, report]);
}

// ─── Feedbacks ─────────────────────────────────────────────

export async function dbAddFeedback(username: string, text: string): Promise<void> {
  const supabase = await getBrowserClient();
  if (supabase) {
    try {
      await supabase.from('feedbacks').insert({ username, content: text });
      return;
    } catch { /* fall through */ }
  }
  const feedbacks = getLocal<string>('feedback-texts');
  setLocal('feedback-texts', [...feedbacks, text]);
}

// ─── Admin ─────────────────────────────────────────────────

export async function dbCheckAdmin(username: string): Promise<boolean> {
  const supabase = await getAdminClient();
  if (supabase) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('username', username)
        .single();
      return data?.is_admin ?? false;
    } catch { /* fall through */ }
  }
  // Check .admins.json via API
  try {
    const res = await fetch(`/api/admin/check?username=${encodeURIComponent(username)}`);
    const data = await res.json();
    return data.isAdmin;
  } catch {
    return false;
  }
}

export async function dbAddAdminLog(action: string): Promise<void> {
  const supabase = await getAdminClient();
  if (supabase) {
    try {
      await supabase.from('admin_logs').insert({ action });
      return;
    } catch { /* fall through */ }
  }
  const logs = getLocal<string>('admin-logs');
  setLocal('admin-logs', [...logs, `[${new Date().toISOString()}] ${action}`]);
}

// ─── Helpers ──────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isValidUUID(id?: string): boolean {
  return !!id && UUID_RE.test(id);
}

// ─── Analytics ─────────────────────────────────────────────

export async function dbRecordVisit(userId?: string): Promise<void> {
  if (!isValidUUID(userId)) return;
  const supabase = await getBrowserClient();
  if (supabase) {
    try {
      await supabase.from('page_visits').insert({ user_id: userId });
      return;
    } catch { /* fall through */ }
  }
}

export async function dbRecordVoteTime(userId?: string): Promise<void> {
  if (!isValidUUID(userId)) return;
  const supabase = await getBrowserClient();
  if (supabase) {
    try {
      await supabase.from('vote_log').insert({ user_id: userId });
      return;
    } catch { /* fall through */ }
  }
}

// ─── Referral tracking ──────────────────────────────────────

export async function dbTrackReferral(source: string, medium: string, campaign: string, storyId?: string): Promise<void> {
  if (!supabaseUrl || !supabaseAnonKey) return;
  try {
    const client = await getSupabaseClient();
    await client.from('referrals').insert({ source, medium, campaign, story_id: storyId || null });
  } catch { /* silently fail */ }
}

export async function dbGetReferralStats(): Promise<{ source: string; count: number }[]> {
  const supabase = await getAdminClient();
  if (!supabase) return [];
  try {
    const { data } = await supabase.from('referrals').select('source');
    if (!data) return [];
    const counts: Record<string, number> = {};
    for (const r of data) {
      counts[r.source] = (counts[r.source] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);
  } catch { return []; }
}

// ─── Admin: promote/demote ─────────────────────────────────

export async function dbPromoteUser(username: string): Promise<void> {
  const supabase = await getAdminClient();
  if (supabase) {
    try {
      await supabase.rpc('promote_to_admin', { target_username: username });
      return;
    } catch { /* fall through */ }
  }
}

export async function dbDemoteUser(username: string): Promise<void> {
  const supabase = await getAdminClient();
  if (supabase) {
    try {
      await supabase.from('profiles').update({ is_admin: false }).eq('username', username);
      return;
    } catch { /* fall through */ }
  }
}

// ─── Mapper ────────────────────────────────────────────────

function mapStory(row: any): Story {
  return {
    id: row.id,
    title: row.title,
    seed: row.seed || '',
    genre: row.genre || 'fantasia',
    totalBranches: row.total_branches || 0,
    participants: row.participants || 0,
    authorId: row.author_id || '',
    createdAt: row.created_at,
    nodes: [],
  };
}
