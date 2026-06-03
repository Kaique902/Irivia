'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useStore } from '@/store/store';
import { Crown, ArrowRight, Flame, GitBranch, Users } from 'lucide-react';

export default function StoryOfTheDay() {
  const { stories } = useStore();

  const storyOfDay = useMemo(() => {
    if (stories.length === 0) return null;
    const scored = stories.map(s => ({
      story: s,
      score: s.nodes.reduce((a, n) => a + n.votes, 0) + s.totalBranches * 5 + s.participants * 3,
    }));
    const today = new Date().getDate();
    const index = today % scored.length;
    return scored[index];
  }, [stories]);

  if (!storyOfDay) return null;

  const { story } = storyOfDay;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 via-orange-500/5 to-transparent"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-bl-full" />
      <div className="absolute top-2 right-2">
        <Crown className="w-6 h-6 text-yellow-400" />
      </div>

      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-[10px] font-bold flex items-center gap-1">
            <Crown className="w-3 h-3" /> História do Dia
          </span>
          <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-[10px]">{story.genre}</span>
        </div>

        <h3 className="text-lg font-bold mb-1">{story.title}</h3>
        <p className="text-zinc-400 text-sm leading-relaxed mb-4 line-clamp-2">{story.seed}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-yellow-400" /> {story.nodes.reduce((a, n) => a + n.votes, 0)} votos</span>
            <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" /> {story.totalBranches} ramos</span>
          </div>
          <Link href={`/${story.id}`}
            className="flex items-center gap-1 text-sm font-medium text-yellow-400 hover:text-yellow-300 transition-colors">
            Ler <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
