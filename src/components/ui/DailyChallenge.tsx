'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useStore } from '@/store/store';
import { Target, Zap, Check, Flame, BookOpen, GitBranch } from 'lucide-react';

const typeIcons = {
  write: Pen,
  vote: Flame,
  branch: GitBranch,
  read: BookOpen,
};

const typeLinks = {
  write: '/create',
  vote: '/',
  branch: '/',
  read: '/',
};

function Pen(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}

const typeLabels: Record<string, string> = {
  write: 'Criar História',
  vote: 'Votar em Histórias',
  branch: 'Criar Ramificação',
  read: 'Ler uma História',
};

export default function DailyChallenge() {
  const router = useRouter();
  const { challenges, generateDailyChallenges, user } = useStore();

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const isToday = challenges.length > 0 && challenges[0].id.startsWith(`ch${today}`);
    if (!isToday) {
      generateDailyChallenges();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user || challenges.length === 0) return null;

  const completedCount = challenges.filter(c => c.completed).length;
  const allCompleted = completedCount === challenges.length;

  const handleClick = (type: string) => {
    router.push(typeLinks[type as keyof typeof typeLinks] || '/');
  };

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <Target className="w-4 h-4 text-orange-400" />
          Desafios de Hoje
        </h3>
        <span className="text-xs text-zinc-500">
          {completedCount}/{challenges.length}
        </span>
      </div>

      {allCompleted ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-4"
        >
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-2">
            <Check className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-sm text-green-400 font-medium">Todos completados!</p>
          <p className="text-xs text-zinc-500">Volte amanhã para novos desafios</p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          {challenges.map((challenge, i) => {
            const Icon = typeIcons[challenge.type] || Target;
            return (
              <motion.button
                key={challenge.id}
                onClick={() => !challenge.completed && handleClick(challenge.type)}
                disabled={challenge.completed}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left ${
                  challenge.completed
                    ? 'bg-green-500/10 border border-green-500/20 cursor-default'
                    : 'bg-zinc-800/50 hover:bg-zinc-800 border border-transparent cursor-pointer'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  challenge.completed ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-zinc-400'
                }`}>
                  {challenge.completed ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs leading-relaxed ${challenge.completed ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}>
                    {challenge.prompt}
                  </p>
                  {!challenge.completed && (
                    <span className="text-[10px] text-orange-400">{typeLabels[challenge.type]}</span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <Zap className="w-3 h-3 text-yellow-400" />
                  <span className="text-yellow-400">+{challenge.xp}</span>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
