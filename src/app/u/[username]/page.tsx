'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useStore, EMOJIS } from '@/store/store';
import type { User } from '@/store/store';
import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Flame, BookOpen, Trophy, TrendingUp, Zap, Target, Star, Shield, UserPlus, UserCheck, Share2, GitBranch, Users, Check } from 'lucide-react';
import type { Story } from '@/types';

export default function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const router = useRouter();
  const { users, stories, user: currentUser, followUser, unfollowUser } = useStore();
  const [mounted, setMounted] = useState(false);
  const [remoteUser, setRemoteUser] = useState<User | null>(null);
  const [remoteStories, setRemoteStories] = useState<any[] | null>(null);
  const [loadingRemote, setLoadingRemote] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!username) return;
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) return;
    let cancelled = false;
    setLoadingRemote(true);
    const load = async () => {
      try {
        const { getSupabaseClient } = await import('@/lib/supabase');
        const c = await getSupabaseClient();
        if (!c) return;
        const { data } = await c.from('profiles').select('*').ilike('username', username).maybeSingle();
        if (cancelled) return;
        if (!data) { setLoadingRemote(false); return; }
        const user = {
          id: data.id, username: data.username, magicWord: data.magic_word,
          pattern: data.pattern, avatar: data.avatar, level: data.level,
          xp: data.xp, streak: data.streak, contributions: data.contributions,
          following: data.following || [], followedStories: data.followed_stories || [],
          mutedStories: data.muted_stories || [], badges: data.badges || [],
          onboardingCompleted: !!data.onboarding_completed, isAdmin: !!data.is_admin,
          createdAt: data.created_at,
        };
        setRemoteUser(user);
        const { data: storiesData } = await c.from('stories').select('id, title, genre, created_at')
          .eq('author_id', data.id).limit(50);
        if (!cancelled) { setRemoteStories(storiesData || []); setLoadingRemote(false); }
      } catch { if (!cancelled) setLoadingRemote(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [username, users]);

  const profileUser = useMemo(() => {
    if (!username) return null;
    return users.find(u => u.username.toLowerCase() === username?.toLowerCase()) || remoteUser || null;
  }, [users, username, remoteUser]);

  const userStories = useMemo(() => {
    if (remoteStories && remoteStories.length > 0) {
      return remoteStories.map(s => ({
        id: s.id, title: s.title, genre: s.genre, author: username,
        nodes: [], seed: '', createdAt: s.created_at,
      } as unknown as Story));
    }
    return stories.filter(s =>
      s.nodes.some(n => n.author.toLowerCase() === username?.toLowerCase())
    );
  }, [stories, username, remoteStories]);

  const isFollowing = currentUser && profileUser
    ? currentUser.following.includes(profileUser.id)
    : false;

  const handleShare = async () => {
    const url = `${window.location.origin}/u/${username}?utm_source=share&utm_medium=social&utm_campaign=profile`;
    if (navigator.share) {
      await navigator.share({
        title: `${profileUser?.username || username} — Irivia`,
        text: `Veja o perfil de ${profileUser?.username || username} no Irivia!`,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  if (!mounted) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!profileUser) {
    if (loadingRemote) {
      return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;
    }
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-4">🔍</p>
          <h2 className="text-xl font-bold mb-2">Usuário não encontrado</h2>
          <p className="text-zinc-500 text-sm mb-4">Ninguém com o nome &quot;{username}&quot; foi encontrado.</p>
          <button onClick={() => router.push('/')} className="text-orange-400 hover:text-orange-300">Voltar</button>
        </div>
      </div>
    );
  }

  const xpForNext = Math.pow(profileUser.level, 2) * 10;
  const xpProgress = ((profileUser.xp % xpForNext) / xpForNext) * 100;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-xl border-b border-[#27272a]">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-zinc-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" /> Voltar
          </button>
          <button onClick={handleShare}
            className="flex items-center gap-2 text-zinc-500 hover:text-orange-400 text-sm transition-colors">
            <Share2 className="w-4 h-4" /> Compartilhar
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-500/10 to-transparent rounded-bl-full" />

          <div className="flex items-start gap-4 mb-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-4xl shadow-lg shadow-orange-500/20">
              {profileUser.avatar}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-extrabold">{profileUser.username}</h1>
              <p className="text-zinc-500 text-sm flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold">
                  Nível {profileUser.level}
                </span>
                <span>{profileUser.xp} XP</span>
                <span>·</span>
                <span>🔥 {profileUser.streak} dias</span>
              </p>
            </div>
            {currentUser && currentUser.id !== profileUser.id && (
              <button
                onClick={() => isFollowing ? unfollowUser(profileUser.id) : followUser(profileUser.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isFollowing
                    ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    : 'bg-orange-500 text-white hover:bg-orange-400'
                }`}
              >
                {isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                {isFollowing ? 'Seguindo' : 'Seguir'}
              </button>
            )}
          </div>

          {/* XP Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-zinc-500 mb-1">
              <span>Progresso para nível {profileUser.level + 1}</span>
              <span>{profileUser.xp % xpForNext}/{xpForNext} XP</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress}%` }}
                transition={{ duration: 0.8 }}
                className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
              />
            </div>
          </div>

          {/* Badges */}
          {profileUser.badges.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {profileUser.badges.map((badge, i) => (
                <span key={i} className="px-2 py-1 rounded-full bg-zinc-800 text-zinc-300 text-[10px] flex items-center gap-1">
                  {badge}
                </span>
              ))}
            </div>
          )}
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: <BookOpen className="w-4 h-4" />, label: 'Contribuições', value: profileUser.contributions },
            { icon: <Trophy className="w-4 h-4" />, label: 'Nível', value: profileUser.level },
            { icon: <TrendingUp className="w-4 h-4" />, label: 'Streak', value: `${profileUser.streak} dias` },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
              className="card p-4 text-center">
              <div className="text-orange-400 flex justify-center mb-2">{stat.icon}</div>
              <p className="text-xl font-bold">{stat.value}</p>
              <p className="text-xs text-zinc-500">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Stories */}
        <section>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-orange-400" /> Histórias
          </h2>
          {userStories.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-zinc-500 text-sm">Nenhuma contribuição ainda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {userStories.map(story => {
                const userNodes = story.nodes.filter(n => n.author.toLowerCase() === username?.toLowerCase());
                const latestNode = userNodes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
                return (
                  <Link key={story.id} href={`/${story.id}`}
                    className="card p-4 block hover:border-orange-500/30 transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm mb-1 truncate">{story.title}</h3>
                        <p className="text-xs text-zinc-500 line-clamp-2">{story.seed}</p>
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-600">
                          <span className="px-1.5 py-0.5 rounded bg-zinc-800">{story.genre}</span>
                          <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" /> {story.totalBranches}</span>
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {story.participants}</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <span className="text-xs text-orange-400 font-medium">{userNodes.length} contribuições</span>
                        {latestNode && (
                          <p className="text-[10px] text-zinc-600 mt-1">
                            Última {new Date(latestNode.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
