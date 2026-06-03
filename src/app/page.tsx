'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/store';
import Header from '@/components/layout/Header';
import { getRecommendedStories } from '@/lib/feed';
import { Flame, Users, GitBranch, ArrowRight, TrendingUp, Sparkles, Trophy, Shield, Crown, Zap, Target, Bell, BellOff } from 'lucide-react';

const Onboarding = dynamic(() => import('@/components/ui/Onboarding'), { ssr: false });
const DailyChallenge = dynamic(() => import('@/components/ui/DailyChallenge'), { ssr: false });
const StoryOfTheDay = dynamic(() => import('@/components/ui/StoryOfTheDay'), { ssr: false });

export default function Home() {
  const { stories, user, completeOnboarding, votedNodes, users, followStory, unfollowStory } = useStore();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [feedFilter, setFeedFilter] = useState<'all' | 'trending' | 'recent' | 'following'>('all');

  useEffect(() => {
    if (user && !user.onboardingCompleted) {
      setShowOnboarding(true);
    }
  }, [user]);

  const handleOnboardingComplete = () => {
    completeOnboarding();
    setShowOnboarding(false);
  };

  // Get recommended stories based on user behavior
  const feedStories = useMemo(() => {
    let filtered = stories.filter(Boolean);
    
    switch (feedFilter) {
      case 'trending':
        filtered = filtered.filter(s => s.nodes.some(n => n.trending));
        break;
      case 'recent':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'following':
        if (user) {
          const followedUsernames = users
            .filter(u => user.following.includes(u.id))
            .map(u => u.username);
          filtered = filtered.filter(s =>
            s.nodes.some(n => followedUsernames.includes(n.author)) ||
            user.followedStories?.includes(s.id)
          );
        }
        break;
      default:
        filtered = getRecommendedStories(stories, votedNodes);
    }
    
    return filtered;
  }, [stories, feedFilter, votedNodes, user, users]);

  return (
    <div className="min-h-screen">
      <Header />

      {/* Onboarding */}
      <AnimatePresence>
        {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
      </AnimatePresence>

      {/* Hero */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-3">
              Histórias que <span className="text-orange-500">ganham vida</span>
            </h1>
            <p className="text-zinc-400 text-lg mb-6 max-w-xl mx-auto">
              Cada frase cria um novo caminho. Vote nos melhores ramos e ajude a moldar a narrativa.
            </p>
            {!user && (
              <Link href="/auth" className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-xl text-white font-bold transition-all">
                <Sparkles className="w-5 h-5" /> Comece Agora
              </Link>
            )}
          </motion.div>
        </div>
      </section>

      {/* User Stats */}
      {user && (
        <section className="px-4 pb-6">
          <div className="max-w-4xl mx-auto">
            <div className="card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-xl">
                  {user.avatar}
                </div>
                <div>
                  <p className="font-medium text-sm">Bem-vindo, {user.username}!</p>
                  <p className="text-xs text-zinc-500">Nível {user.level} · {user.xp} XP</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-zinc-500">
                <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-yellow-400" /> {user.xp}</span>
                <span className="flex items-center gap-1"><Flame className="w-3.5 h-3.5 text-orange-400" /> {user.streak}</span>
                <span className="flex items-center gap-1"><Target className="w-3.5 h-3.5 text-cyan-400" /> {user.contributions}</span>
              </div>
            </div>
          </div>
          {/* Daily Challenges */}
          <div className="max-w-4xl mx-auto mt-4">
            <DailyChallenge />
          </div>
        </section>
      )}

      {/* Story of the Day */}
      <section className="px-4 pb-6">
        <div className="max-w-4xl mx-auto">
          <StoryOfTheDay />
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 pb-8">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-3">
          {[
            { icon: Flame, label: 'Histórias', value: stories.length, color: 'text-orange-400' },
            { icon: GitBranch, label: 'Ramos', value: stories.reduce((a, s) => a + s.totalBranches, 0), color: 'text-cyan-400' },
            { icon: Users, label: 'Autores', value: stories.reduce((a, s) => a + s.participants, 0), color: 'text-zinc-400' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="card p-4 text-center">
              <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-1`} />
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-zinc-500">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Feed Filter Tabs */}
      <section className="px-4 pb-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            {[
              { key: 'all', label: 'Para Você', icon: Sparkles },
              { key: 'trending', label: 'Em Alta', icon: TrendingUp },
              { key: 'recent', label: 'Recentes', icon: Clock },
              ...(user ? [{ key: 'following', label: 'Seguindo', icon: Users }] : []),
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFeedFilter(tab.key as any)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  feedFilter === tab.key
                    ? 'bg-orange-500 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Stories Feed */}
      <section className="px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-4">
            {feedStories.map((story, i) => (
              <motion.div key={story.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Link href={`/${story.id}`} className="card block p-6 hover:border-orange-500/30 group">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-xs font-medium">{story.genre}</span>
                    {story.nodes[0]?.trending && (
                      <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-xs font-medium flex items-center gap-1">
                        <Flame className="w-3 h-3" /> Hot
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold mb-2 group-hover:text-orange-400 transition-colors">{story.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-4">{story.seed}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                      <span className="flex items-center gap-1"><GitBranch className="w-3.5 h-3.5" /> {story.totalBranches} ramos</span>
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {story.participants} autores</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {user && (
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); user.followedStories?.includes(story.id) ? unfollowStory(story.id) : followStory(story.id); }}
                          className={`p-1.5 rounded-lg transition-all ${user.followedStories?.includes(story.id) ? 'bg-orange-500/20 text-orange-400' : 'bg-zinc-800 text-zinc-500 hover:text-white'}`}
                          title={user.followedStories?.includes(story.id) ? 'Deixar de seguir' : 'Seguir história'}>
                          {user.followedStories?.includes(story.id) ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                        </button>
                      )}
                      <span className="text-orange-500 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                        Ler <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Clock(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
