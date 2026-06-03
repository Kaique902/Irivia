import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Story, StoryNode, Comment, Challenge, Report } from '@/types';
import { sanitizeString, sanitizeUsername, sanitizePassword, validatePattern, hashPassword, checkRateLimit } from '@/lib/sanitize';
import { useNotificationStore } from '@/store/notifications';
import {
  dbRegister, dbLogin, dbAddStory, dbRemoveStory, dbAddNode, dbVoteNode,
  dbAddComment, dbAddReport, dbAddFeedback,
  dbCheckAdmin, dbAddAdminLog, dbRecordVisit, dbRecordVoteTime,
  dbPromoteUser, dbDemoteUser, dbGetStories,
} from '@/lib/db';

const EMOJI_GRID = [
  '🔥', '💧', '🌿', '⚡', '🌙',
  '💎', '🎯', '🦋', '🌸', '🎲',
  '🔮', '🎸', '🚀', '🎭', '🌊',
  '🦊', '🍄', '🎪', '🦋', '✨',
];

export interface User {
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
  createdAt: string;
  isAdmin: boolean;
}

interface AppState {
  stories: Story[];
  user: User | null;
  votedNodes: string[];
  users: User[];
  comments: Comment[];
  challenges: Challenge[];
  dailyVotes: string[];
  dailyNodeCount: number;
  pageVisits: number;
  visitLog: number[];
  voteLog: number[];
  feedbackLastShown: number | null;
  feedbackTexts: string[];
  
  // Auth
  register: (username: string, magicWord: string, pattern: number[]) => Promise<boolean>;
  login: (username: string, magicWord: string, pattern: number[]) => Promise<boolean>;
  logout: () => void;
  completeOnboarding: () => void;
  
  // Story actions
  loadStories: () => Promise<void>;
  addStory: (story: Story) => void;
  removeStory: (storyId: string) => void;
  addNode: (storyId: string, node: StoryNode) => void;
  voteNode: (nodeId: string, type: 'hot' | 'cold') => void;
  
  // Social
  followUser: (userId: string) => void;
  unfollowUser: (userId: string) => void;
  followStory: (storyId: string) => void;
  unfollowStory: (storyId: string) => void;
  toggleMuteStory: (storyId: string) => void;
  
  // Comments
  addComment: (comment: Comment) => void;
  getComments: (nodeId: string) => Comment[];
  
  // Challenges
  completeChallenge: (challengeId: string) => void;
  generateDailyChallenges: () => void;
  autoCompleteVoteChallenge: () => void;
  autoCompleteNodeChallenge: () => void;
  completeReadChallenge: () => void;
  recordVisit: () => void;
  recordVoteTime: () => void;
  submitFeedback: (text: string) => void;
  dismissFeedback: () => void;

  // Moderation
  reports: Report[];
  bannedUsers: string[];
  reportNode: (nodeId: string, storyId: string, reason: string, content: string) => void;
  resolveReport: (reportId: string) => void;
  dismissReport: (reportId: string) => void;
  removeNode: (storyId: string, nodeId: string) => void;
  banUser: (username: string) => void;
  setAdminStatus: (username: string) => Promise<boolean>;
  promoteUser: (username: string) => void;
  demoteUser: (username: string) => void;
  adminLogs: string[];
  addAdminLog: (action: string) => void;
}

const DEMO_STORIES: Story[] = [
  {
    id: 'demo',
    title: 'Chapeuzinho Vermelho',
    seed: 'Era uma vez uma menina chamada Chapeuzinho Vermelho. Sua avó, que morava do outro lado da floresta, estava doente. A mãe pediu que ela levasse uma cesta de doces para a avó. "Não fale com estranhos e não saia do caminho", avisou. Mas a floresta era cheia de escolhas…',
    genre: 'fantasia',
    totalBranches: 10,
    participants: 4,
    authorId: 'uadmin',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    nodes: [
      { id: 'c1', content: 'Era uma vez uma menina chamada Chapeuzinho Vermelho. Sua avó, que morava do outro lado da floresta, estava doente. A mãe pediu que ela levasse uma cesta de doces para a avó. "Não fale com estranhos e não saia do caminho", avisou. Mas a floresta era cheia de escolhas…', author: 'Admin', emotion: 'neutro', parentId: null, votes: 42, hotVotes: 38, coldVotes: 4, trending: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
      { id: 'c2', content: 'Chapeuzinho entrou na floresta pelo caminho mais curto. Logo encontrou o Lobo Mau, que perguntou: "Onde vai, menina?"', author: 'Admin', emotion: 'medo', parentId: 'c1', votes: 28, hotVotes: 24, coldVotes: 4, trending: true, createdAt: new Date(Date.now() - 84000000).toISOString() },
      { id: 'c3', content: '"Vou à casa da vovó levar doces", respondeu Chapeuzinho. O Lobo sorriu e disse: "Que bonita! Por que não colhe algumas flores para ela?"', author: 'Admin', emotion: 'alegria', parentId: 'c2', votes: 31, hotVotes: 27, coldVotes: 4, trending: true, createdAt: new Date(Date.now() - 81600000).toISOString() },
      { id: 'c4', content: 'Em vez de seguir o conselho do Lobo, Chapeuzinho correu direto para a casa da avó. O Lobo, furioso, tomou um atalho pela floresta.', author: 'Admin', emotion: 'surpresa', parentId: 'c3', votes: 19, hotVotes: 17, coldVotes: 2, trending: true, createdAt: new Date(Date.now() - 79200000).toISOString() },
      { id: 'c5', content: 'Chapeuzinho decidiu colher flores. Enquanto se distraía, o Lobo correu para a casa da avó, engoliu a velhinha e vestiu suas roupas.', author: 'Admin', emotion: 'medo', parentId: 'c3', votes: 25, hotVotes: 22, coldVotes: 3, trending: true, createdAt: new Date(Date.now() - 76800000).toISOString() },
      { id: 'c6', content: 'Chapeuzinho chegou à casa. "Vovó, que olhos grandes você tem!" disse ela. "É para te ver melhor", respondeu o Lobo disfarçado.', author: 'Admin', emotion: 'medo', parentId: 'c4', votes: 22, hotVotes: 20, coldVotes: 2, trending: true, createdAt: new Date(Date.now() - 74400000).toISOString() },
      { id: 'c7', content: 'Chapeuzinho notou algo estranho. "Vovó, que boca grande você tem!" O Lobo pulou da cama e tentou engoli-la também.', author: 'Admin', emotion: 'medo', parentId: 'c5', votes: 18, hotVotes: 16, coldVotes: 2, trending: true, createdAt: new Date(Date.now() - 72000000).toISOString() },
      { id: 'c8', content: 'Um caçador que passava ouviu os gritos. Ele entrou na casa, viu o Lobo de barriga cheia e pegou sua tesoura.', author: 'Admin', emotion: 'esperança', parentId: 'c6', votes: 27, hotVotes: 25, coldVotes: 2, trending: true, createdAt: new Date(Date.now() - 69600000).toISOString() },
      { id: 'c9', content: 'Chapeuzinho não fugiu. Ela pegou uma faca na cozinha e encarou o Lobo. "Você não vai machucar mais ninguém!"', author: 'Admin', emotion: 'coragem', parentId: 'c7', votes: 33, hotVotes: 30, coldVotes: 3, trending: true, createdAt: new Date(Date.now() - 67200000).toISOString() },
      { id: 'c10', content: 'O caçador abriu a barriga do Lobo com um golpe rápido. A avó saiu inteira e abraçou Chapeuzinho. Todas viveram felizes para sempre.', author: 'Admin', emotion: 'alegria', parentId: 'c8', votes: 40, hotVotes: 37, coldVotes: 3, trending: true, createdAt: new Date(Date.now() - 64800000).toISOString() },
    ],
  },
];

const CHALLENGE_PROMPTS = [
  { type: 'write' as const, prompt: 'Escreva uma frase com tema "medo"', xp: 15 },
  { type: 'write' as const, prompt: 'Escreva uma frase que comece com "De repente"', xp: 12 },
  { type: 'write' as const, prompt: 'Escreva uma frase com uma reviravolta', xp: 15 },
  { type: 'vote' as const, prompt: 'Vote em 3 histórias hoje', xp: 10 },
  { type: 'branch' as const, prompt: 'Crie uma nova ramificação', xp: 12 },
  { type: 'read' as const, prompt: 'Leia 2 histórias até o final', xp: 8 },
  { type: 'write' as const, prompt: 'Escreva uma frase com tema "amor"', xp: 12 },
  { type: 'vote' as const, prompt: 'Vote Hot em 5 ramos', xp: 15 },
];

export const EMOJIS = EMOJI_GRID;

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      stories: DEMO_STORIES,
      user: null,
      votedNodes: [],
      users: [],
      comments: [],
      challenges: [],
      reports: [],
      bannedUsers: [],
      dailyVotes: [],
      dailyNodeCount: 0,
      pageVisits: 0,
      visitLog: [],
      voteLog: [],
      feedbackLastShown: null,
      feedbackTexts: [],
      adminLogs: [],

      loadStories: async () => {
        const remote = await dbGetStories();
        if (remote.length > 0) {
          set((s) => {
            const existing = new Set(s.stories.map(r => r.id));
            const hasNew = remote.some(r => !existing.has(r.id));
            if (!hasNew) return {};
            const merged = [...remote];
            for (const local of s.stories) {
              if (!merged.find((r: Story) => r.id === local.id)) {
                merged.push(local);
              }
            }
            return { stories: merged };
          });
        }
      },

      register: async (username, magicWord, pattern) => {
        const { users, bannedUsers } = get();
        const cleanUsername = sanitizeUsername(username);
        const cleanWord = sanitizePassword(magicWord);
        if (!cleanUsername || cleanUsername.length < 2) return false;
        if (cleanWord.length < 9) return false;
        if (!validatePattern(pattern, EMOJI_GRID.length)) return false;
        if (bannedUsers.some(b => b.toLowerCase() === cleanUsername.toLowerCase())) return false;
        
        const hashed = await hashPassword(cleanWord);

        const dbUser = await dbRegister(cleanUsername, hashed, pattern);
        if (!dbUser) return false;

        const avatar = EMOJI_GRID[pattern[0]] || '✨';
        const newUser: User = { ...dbUser, avatar, magicWord: hashed };

        set({ users: [...users, newUser], user: newUser });
        await get().setAdminStatus(cleanUsername);
        return true;
      },

      login: async (username, magicWord, pattern) => {
        const { bannedUsers } = get();
        const cleanUsername = sanitizeUsername(username);
        const cleanWord = sanitizePassword(magicWord);
        if (!checkRateLimit(`login_${cleanUsername.toLowerCase()}`)) return false;
        if (bannedUsers.some(b => b.toLowerCase() === cleanUsername.toLowerCase())) return false;
        
        const hashed = await hashPassword(cleanWord);
        const found = await dbLogin(cleanUsername, hashed, pattern);
        if (!found) return false;
        set({ user: found });
        await get().setAdminStatus(cleanUsername);
        return true;
      },

      logout: async () => {
        set({ user: null });
        const { getBrowserClient } = await import('@/lib/supabase');
        const supabase = await getBrowserClient();
        if (supabase) await supabase.auth.signOut();
      },

      completeOnboarding: () => set((s) => ({
        user: s.user ? { ...s.user, onboardingCompleted: true } : null,
        users: s.users.map(u => 
          s.user && u.id === s.user.id ? { ...u, onboardingCompleted: true } : u
        ),
      })),

      addStory: (story) => {
        const cleanStory = {
          ...story,
          title: sanitizeString(story.title, 100),
          seed: sanitizeString(story.seed, 500),
          nodes: story.nodes.map(n => ({ ...n, content: sanitizeString(n.content, 500) })),
        };
        dbAddStory(cleanStory);
        set((s) => ({ stories: [...s.stories, cleanStory] }));
      },

      removeStory: (storyId) => {
        dbRemoveStory(storyId);
        set((s) => ({
          stories: s.stories.filter(st => st.id !== storyId),
          comments: s.comments.filter(c => c.storyId !== storyId),
          reports: s.reports.filter(r => r.storyId !== storyId),
        }));
      },

      addNode: (storyId, node) => {
        const { stories, users, user } = get();
        const story = stories.find(s => s.id === storyId);
        const cleanNode = { ...node, content: sanitizeString(node.content, 500) };
        dbAddNode(storyId, cleanNode);
        set((s) => ({
          stories: s.stories.map(st =>
            st.id === storyId ? { ...st, nodes: [...st.nodes, cleanNode], totalBranches: st.totalBranches + 1 } : st
          ),
          user: s.user ? { ...s.user, xp: s.user.xp + 10, contributions: s.user.contributions + 1, streak: s.user.streak + 1 } : null,
          dailyNodeCount: get().dailyNodeCount + 1,
        }));
        get().autoCompleteNodeChallenge();
        if (story && story.title) {
          useNotificationStore.getState().addNotification({
            type: 'story_update',
            message: `"${story.title}" — novo capítulo adicionado`,
            storyId: story.id,
            targetUsers: users.filter(u =>
              (u.followedStories ?? []).includes(story.id) && !(u.mutedStories ?? []).includes(story.id)
            ).map(u => u.id),
          });
        }
      },

      voteNode: (nodeId, type) => {
        const { stories, users, user } = get();
        const story = stories.find(s => s.nodes.some(n => n.id === nodeId));
        get().recordVoteTime();
        dbVoteNode(user?.id || '', nodeId, type, stories);
        set((s) => ({
          votedNodes: [...s.votedNodes, nodeId],
          dailyVotes: [...s.dailyVotes, nodeId],
          stories: s.stories.map(st => ({
            ...st,
            nodes: st.nodes.map(n =>
              n.id === nodeId
                ? { ...n, votes: n.votes + 1, hotVotes: type === 'hot' ? n.hotVotes + 1 : n.hotVotes, coldVotes: type === 'cold' ? n.coldVotes + 1 : n.coldVotes }
                : n
            ),
          })),
          user: s.user ? { ...s.user, xp: s.user.xp + (type === 'hot' ? 5 : 2) } : null,
        }));
        get().autoCompleteVoteChallenge();
        if (story && story.title) {
          useNotificationStore.getState().addNotification({
            type: 'story_vote',
            message: `"${story.title}" — novo voto recebido`,
            storyId: story.id,
            targetUsers: users.filter(u =>
              (u.followedStories ?? []).includes(story.id) && !(u.mutedStories ?? []).includes(story.id)
            ).map(u => u.id),
          });
        }
      },

      // Social
      followUser: (userId) => set((s) => ({
        user: s.user ? { ...s.user, following: [...s.user.following, userId] } : null,
        users: s.users.map(u => 
          s.user && u.id === s.user.id ? { ...u, following: [...u.following, userId] } : u
        ),
      })),

      unfollowUser: (userId) => set((s) => ({
        user: s.user ? { ...s.user, following: s.user.following.filter(id => id !== userId) } : null,
        users: s.users.map(u => 
          s.user && u.id === s.user.id ? { ...u, following: u.following.filter(id => id !== userId) } : u
        ),
      })),

      followStory: (storyId) => set((s) => ({
        user: s.user ? { ...s.user, followedStories: [...(s.user.followedStories ?? []), storyId] } : null,
      })),

      unfollowStory: (storyId) => set((s) => ({
        user: s.user ? { ...s.user, followedStories: (s.user.followedStories ?? []).filter(id => id !== storyId) } : null,
      })),

      toggleMuteStory: (storyId) => set((s) => {
        if (!s.user) return {};
        const currentMuted = s.user.mutedStories ?? [];
        const muted = currentMuted.includes(storyId)
          ? currentMuted.filter(id => id !== storyId)
          : [...currentMuted, storyId];
        return { user: { ...s.user, mutedStories: muted } };
      }),

      // Comments
      addComment: (comment) => {
        const cleanComment = { ...comment, content: sanitizeString(comment.content, 300) };
        dbAddComment(cleanComment);
        set((s) => ({ comments: [...s.comments, cleanComment] }));
      },
      getComments: (nodeId) => get().comments.filter(c => c.nodeId === nodeId),

      // Challenges
      completeChallenge: (challengeId) => set((s) => ({
        challenges: s.challenges.map(c => 
          c.id === challengeId ? { ...c, completed: true } : c
        ),
        user: s.user ? { ...s.user, xp: s.user.xp + (s.challenges.find(c => c.id === challengeId)?.xp || 0) } : null,
      })),

      generateDailyChallenges: () => {
        const today = new Date().toISOString().split('T')[0];
        const shuffled = [...CHALLENGE_PROMPTS].sort(() => Math.random() - 0.5);
        const daily = shuffled.slice(0, 3).map((p, i) => ({
          id: `ch${today}${i}`,
          ...p,
          completed: false,
          date: today,
        }));
        set({ challenges: daily, dailyVotes: [], dailyNodeCount: 0 });
      },

      autoCompleteVoteChallenge: () => {
        const { challenges } = get();
        const pending = challenges.find(c => !c.completed && c.type === 'vote');
        if (pending) get().completeChallenge(pending.id);
      },

      autoCompleteNodeChallenge: () => {
        const { challenges } = get();
        const writePending = challenges.find(c => !c.completed && c.type === 'write');
        if (writePending) get().completeChallenge(writePending.id);
        const branchPending = challenges.find(c => !c.completed && c.type === 'branch');
        if (branchPending) get().completeChallenge(branchPending.id);
      },

      completeReadChallenge: () => {
        const { challenges } = get();
        const pending = challenges.find(c => !c.completed && c.type === 'read');
        if (pending) get().completeChallenge(pending.id);
      },

      recordVisit: () => {
        const { user } = get();
        dbRecordVisit(user?.id);
        set((s) => ({
          pageVisits: s.pageVisits + 1,
          visitLog: [...s.visitLog.slice(-1999), Date.now()],
        }));
      },

      recordVoteTime: () => {
        const { user } = get();
        dbRecordVoteTime(user?.id);
        set((s) => ({
          voteLog: [...s.voteLog.slice(-1999), Date.now()],
        }));
      },

      submitFeedback: (text) => {
        const { user } = get();
        dbAddFeedback(user?.username || 'anon', text);
        set((s) => ({
          feedbackTexts: [...s.feedbackTexts, `[${new Date().toISOString()}] ${text}`],
        }));
      },

      dismissFeedback: () => set({
        feedbackLastShown: Date.now(),
      }),

      // Moderation
      reportNode: (nodeId, storyId, reason, content) => {
        const report: Report = {
          id: `r${Date.now()}`,
          nodeId,
          storyId,
          reason,
          reportedBy: get().user?.username || 'Anônimo',
          content,
          createdAt: new Date().toISOString(),
          status: 'pending',
        };
        dbAddReport(report);
        set((s) => ({ reports: [...s.reports, report] }));
      },

      resolveReport: (reportId) => {
        get().addAdminLog(`Denúncia #${reportId.slice(0, 8)} foi resolvida`);
        set((s) => ({
          reports: s.reports.map(r =>
            r.id === reportId ? { ...r, status: 'resolved' as const } : r
          ),
        }));
      },

      dismissReport: (reportId) => {
        get().addAdminLog(`Denúncia #${reportId.slice(0, 8)} foi ignorada`);
        set((s) => ({
          reports: s.reports.map(r =>
            r.id === reportId ? { ...r, status: 'dismissed' as const } : r
          ),
        }));
      },

      removeNode: (storyId, nodeId) => {
        get().addAdminLog(`Nó #${nodeId.slice(0, 8)} removido da história ${storyId.slice(0, 8)}`);
        set((s) => ({
          stories: s.stories.map(st =>
            st.id === storyId
              ? { ...st, nodes: st.nodes.filter(n => n.id !== nodeId), totalBranches: st.totalBranches - 1 }
              : st
          ),
          reports: s.reports.map(r =>
            r.nodeId === nodeId ? { ...r, status: 'resolved' as const } : r
          ),
        }));
      },

      banUser: (username) => set((s) => {
        if (s.user?.username === username) return {};
        get().addAdminLog(`Ban: "${username}" foi banido`);
        return {
          bannedUsers: [...s.bannedUsers, username],
          users: s.users.filter(u => u.username !== username),
        };
      }),

      // Admin
      addAdminLog: (action) => {
        dbAddAdminLog(`[${new Date().toISOString()}] ${action}`);
        set((s) => ({ adminLogs: [...s.adminLogs, `[${new Date().toISOString()}] ${action}`] }));
      },

      setAdminStatus: async (username) => {
        const isAdmin = await dbCheckAdmin(username);
        if (isAdmin) {
          set((s) => ({
            user: s.user ? { ...s.user, isAdmin: true } : null,
            users: s.users.map(u =>
              u.username.toLowerCase() === username.toLowerCase() ? { ...u, isAdmin: true } : u
            ),
          }));
        }
        return isAdmin;
      },

      promoteUser: (username) => {
        dbPromoteUser(username);
        get().addAdminLog(`Admin: "${username}" foi promovido a administrador`);
        set((s) => ({
          users: s.users.map(u =>
            u.username.toLowerCase() === username.toLowerCase() ? { ...u, isAdmin: true } : u
          ),
        }));
      },

      demoteUser: (username) => {
        dbDemoteUser(username);
        get().addAdminLog(`Admin: "${username}" foi removido de administrador`);
        set((s) => ({
          users: s.users.map(u =>
            u.username.toLowerCase() === username.toLowerCase() ? { ...u, isAdmin: false } : u
          ),
        }));
      },

    }),
    {
      name: 'irivia-v2',
      version: 1,
      migrate: (state: any) => {
        if (state.user) {
          state.user.followedStories ??= [];
          state.user.mutedStories ??= [];
        }
        if (state.users) {
          state.users = state.users.map((u: any) => ({
            ...u,
            followedStories: u.followedStories ?? [],
            mutedStories: u.mutedStories ?? [],
          }));
        }
        state.adminLogs ??= [];
        state.visitLog ??= [];
        state.voteLog ??= [];
        return state;
      },
    }
  )
);
