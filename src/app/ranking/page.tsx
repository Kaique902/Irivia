'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Header from '@/components/layout/Header';
import Leaderboard from '@/components/ui/Leaderboard';
import { useStore } from '@/store/store';
import { ArrowLeft, Trophy, Zap, Flame, Target, TrendingUp } from 'lucide-react';

export default function RankingPage() {
  const router = useRouter();
  const { user, users } = useStore();

  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <button onClick={() => router.push('/')} className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-5 h-5" /> Voltar
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-extrabold mb-2 flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-400" />
            Ranking
          </h1>
          <p className="text-zinc-400 mb-8">Top contributors da semana</p>
        </motion.div>

        {/* Your Position */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-5 mb-6 border-orange-500/30"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-2xl">
                {user.avatar}
              </div>
              <div className="flex-1">
                <p className="text-xs text-zinc-500 mb-1">Sua posição</p>
                <p className="text-lg font-bold text-white">{user.username}</p>
                <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                  <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-400" /> {user.xp} XP</span>
                  <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400" /> Nv.{user.level}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-orange-400">#42</p>
                <p className="text-xs text-zinc-500">posição</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: Zap, label: 'Seu XP', value: user?.xp || 0, color: 'text-yellow-400' },
            { icon: Flame, label: 'Seu Nível', value: user?.level || 1, color: 'text-orange-400' },
            { icon: Target, label: 'Contribuições', value: user?.contributions || 0, color: 'text-cyan-400' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="card p-4 text-center"
            >
              <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-1`} />
              <p className="text-xl font-bold">{stat.value}</p>
              <p className="text-xs text-zinc-500">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-400" />
            Top Contribuidores
          </h2>
          <Leaderboard />
        </motion.div>
      </main>
    </div>
  );
}
