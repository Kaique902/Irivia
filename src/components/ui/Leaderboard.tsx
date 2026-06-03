'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/store/store';
import { Trophy, Zap, Flame, BookOpen, Target, UserPlus, UserMinus } from 'lucide-react';

export default function Leaderboard() {
  const { users, stories, user: currentUser, followUser, unfollowUser } = useStore();

  const rankedUsers = useMemo(() => {
    return [...users]
      .sort((a, b) => b.xp - a.xp)
      .slice(0, 10)
      .map((user, index) => ({
        ...user,
        rank: index + 1,
        storiesCount: stories.filter(s => 
          s.nodes.some(n => n.author === user.username)
        ).length,
      }));
  }, [users, stories]);

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-500 to-amber-500';
    if (rank === 2) return 'from-gray-300 to-gray-400';
    if (rank === 3) return 'from-orange-600 to-amber-700';
    return 'from-zinc-600 to-zinc-700';
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="space-y-3">
      {rankedUsers.map((user, i) => (
        <motion.div
          key={user.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/50 hover:bg-zinc-800/50 transition-all"
        >
          {/* Rank */}
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getRankColor(user.rank)} flex items-center justify-center text-sm font-bold text-white`}>
            {getRankBadge(user.rank)}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-lg">{user.avatar}</span>
              <span className="font-medium text-white truncate">{user.username}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
              <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-400" /> {user.xp}</span>
              <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400" /> Nv.{user.level}</span>
            </div>
          </div>

          {/* Follow/Unfollow */}
          {currentUser && user.id !== currentUser.id && (
            <button
              onClick={() => currentUser.following.includes(user.id) ? unfollowUser(user.id) : followUser(user.id)}
              className={`p-2 rounded-xl text-xs transition-all flex items-center gap-1 ${
                currentUser.following.includes(user.id)
                  ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  : 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
              }`}
            >
              {currentUser.following.includes(user.id) ? (
                <><UserMinus className="w-3.5 h-3.5" /></>
              ) : (
                <><UserPlus className="w-3.5 h-3.5" /></>
              )}
            </button>
          )}

          {/* Stats */}
          <div className="text-right">
            <p className="text-lg font-bold text-white">{user.xp.toLocaleString()}</p>
            <p className="text-xs text-zinc-500">XP</p>
          </div>
        </motion.div>
      ))}

      {rankedUsers.length === 0 && (
        <div className="text-center py-8 text-zinc-500">
          <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhum ranking ainda</p>
        </div>
      )}
    </div>
  );
}
