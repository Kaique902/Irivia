'use client';

import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore, EMOJIS } from '@/store/store';
import { useState, useEffect } from 'react';
import AvatarPicker from '@/components/ui/AvatarPicker';
import { ArrowLeft, ArrowRight, Flame, BookOpen, Trophy, TrendingUp, LogOut, Zap, Shield, Copy, Check, MessageSquareText, Send, X, ThumbsUp, UserPlus, UserCheck, Bug, Edit3 } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, stories, users, followUser, unfollowUser, updateAvatar } = useStore();
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-4">🔒</p>
          <h2 className="text-xl font-bold mb-2">Faça login para ver seu perfil</h2>
          <button onClick={() => router.push('/auth')} className="text-orange-400 hover:text-orange-300">Ir para login</button>
        </div>
      </div>
    );
  }

  const xpForNext = Math.pow(user.level, 2) * 10;
  const xpProgress = ((user.xp % xpForNext) / xpForNext) * 100;

  const handleCopyPattern = () => {
    const patternStr = user.pattern.map(i => EMOJIS[i]).join(' ');
    navigator.clipboard.writeText(patternStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-xl border-b border-[#27272a]">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => router.push('/')} className="flex items-center gap-2 text-zinc-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" /> Voltar
          </button>
          <button onClick={() => { logout(); router.push('/auth'); }}
            className="flex items-center gap-2 text-zinc-500 hover:text-red-400 text-sm transition-colors">
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-500/10 to-transparent rounded-bl-full" />
          
          <div className="flex items-start gap-4 mb-4">
            <button onClick={() => setShowAvatarPicker(true)} className="relative group">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-4xl shadow-lg shadow-orange-500/20 overflow-hidden">
                {user.avatar.startsWith('data:') || user.avatar.startsWith('http') ? (
                  <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  user.avatar
                )}
              </div>
              <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Edit3 className="w-5 h-5 text-white" />
              </div>
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-extrabold">{user.username}</h1>
              <p className="text-zinc-500 text-sm flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold">
                  Nível {user.level}
                </span>
                <span>{user.xp} XP</span>
              </p>
            </div>
          </div>

          {/* Level Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
              <span>Progresso para Nível {user.level + 1}</span>
              <span>{user.xp % xpForNext} / {xpForNext} XP</span>
            </div>
            <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${xpProgress}%` }}
                className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full" />
            </div>
          </div>

          {/* Magic Key Display */}
          <div className="bg-zinc-900/80 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-zinc-500 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Sua Chave Visual
              </span>
              <button onClick={handleCopyPattern}
                className="text-xs text-zinc-500 hover:text-orange-400 flex items-center gap-1 transition-colors">
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                {user.pattern.map((i, idx) => (
                  <motion.span key={idx} initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="text-2xl w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                    {EMOJIS[i]}
                  </motion.span>
                ))}
              </div>
              <div className="text-xs text-zinc-500">
                <p>Palavra: <span className="text-orange-400 font-mono">{'•'.repeat(6)}</span></p>
                <p>Padrão: {user.pattern.length} emojis</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { icon: Zap, label: 'XP Total', value: user.xp.toLocaleString(), color: 'text-yellow-400' },
            { icon: Flame, label: 'Sequência', value: `${user.streak} dias`, color: 'text-orange-400' },
            { icon: BookOpen, label: 'Contribuições', value: user.contributions, color: 'text-cyan-400' },
            { icon: TrendingUp, label: 'Ranking', value: '#42', color: 'text-green-400' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="card p-4 text-center">
              <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
              <p className="text-xl font-bold">{stat.value}</p>
              <p className="text-xs text-zinc-500">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Badges */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="card p-5 mb-6">
          <h2 className="font-bold mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" /> Conquistas
          </h2>
          <div className="grid grid-cols-4 gap-3">
            {[
              { icon: '🌱', label: 'Primeiro Post', earned: user.contributions >= 1 },
              { icon: '🔥', label: '10 Votos Hot', earned: user.xp >= 50 },
              { icon: '⚡', label: '7 Dias Seguidos', earned: user.streak >= 7 },
              { icon: '📝', label: '20 Contribuições', earned: user.contributions >= 20 },
              { icon: '🏆', label: 'Nível 10', earned: user.level >= 10 },
              { icon: '💎', label: '100 Votos', earned: user.xp >= 500 },
              { icon: '🌟', label: 'Top 10', earned: false },
              { icon: '👑', label: 'Lenda', earned: user.level >= 25 },
            ].map((badge, i) => (
              <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 + i * 0.05 }}
                className={`text-center p-2 rounded-xl transition-all ${badge.earned ? 'bg-zinc-800/50 hover:bg-zinc-800' : 'bg-zinc-900/50 opacity-40'}`}>
                <span className="text-2xl block mb-1">{badge.icon}</span>
                <span className="text-[9px] text-zinc-400 leading-tight block">{badge.label}</span>
                {badge.earned && <span className="text-[8px] text-green-400 mt-1 block">✓</span>}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* People to follow */}
        {users.filter(u => u.id !== user.id).length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
            className="card p-5 mb-6">
            <h2 className="font-bold mb-3 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-cyan-400" /> Pessoas
            </h2>
            <div className="space-y-2">
              {users.filter(u => u.id !== user.id).slice(0, 5).map(otherUser => {
                const isFollowed = user.following.includes(otherUser.id);
                return (
                  <div key={otherUser.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-800/50 transition-all">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-base">
                        {otherUser.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{otherUser.username}</p>
                        <p className="text-xs text-zinc-500">Nível {otherUser.level} · {otherUser.xp} XP</p>
                      </div>
                    </div>
                    <button onClick={() => isFollowed ? unfollowUser(otherUser.id) : followUser(otherUser.id)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isFollowed ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
                      }`}>
                      {isFollowed ? <UserCheck className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
                      {isFollowed ? 'Seguindo' : 'Seguir'}
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Feedback */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="card p-5 mb-6 border-zinc-700/50">
          <button onClick={() => { setShowFeedback(true); setFeedbackSent(false); }}
            className="w-full flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <MessageSquareText className="w-5 h-5 text-orange-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">Enviar Feedback</p>
              <p className="text-xs text-zinc-500">Reporte bugs, sugira ideias ou elogie</p>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-600" />
          </button>
        </motion.div>

        {/* Feedback Modal */}
        <AnimatePresence>
          {showFeedback && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
              onClick={() => setShowFeedback(false)}>
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                className="w-full max-w-sm card p-5" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold">Feedback</h3>
                  <button onClick={() => setShowFeedback(false)} className="text-zinc-500 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-zinc-400 mb-3">Encontrou algum bug? Tem sugestões? Conte pra gente.</p>
                <textarea value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)}
                  className="input resize-none h-24 mb-3" placeholder="Digite seu feedback..." autoFocus />
                <div className="flex gap-2">
                  <button onClick={() => setShowFeedback(false)} className="btn btn-ghost flex-1">Cancelar</button>
                  <button onClick={() => {
                    if (!feedbackText.trim()) return;
                    useStore.getState().submitFeedback(feedbackText);
                    setFeedbackText('');
                    setShowFeedback(false);
                    setFeedbackSent(true);
                    setTimeout(() => setFeedbackSent(false), 3000);
                  }} disabled={!feedbackText.trim()}
                    className="btn btn-primary flex-1 flex items-center justify-center gap-1.5 disabled:opacity-40">
                    <Send className="w-3.5 h-3.5" /> Enviar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feedback toast */}
        <AnimatePresence>
          {feedbackSent && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto">
              <div className="px-4 py-3 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 text-sm flex items-center gap-2">
                <ThumbsUp className="w-4 h-4" /> Obrigado pelo feedback!
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* My Stories */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h2 className="font-bold mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-orange-400" /> Minhas Histórias
          </h2>
          <div className="space-y-2">
            {stories.slice(0, 3).map(story => (
              <Link key={story.id} href={`/${story.id}`} className="card p-4 flex items-center justify-between hover:border-orange-500/30 group">
                <div>
                  <h3 className="font-medium text-sm group-hover:text-orange-400 transition-colors">{story.title}</h3>
                  <p className="text-xs text-zinc-500">{story.totalBranches} ramos · {story.participants} autores</p>
                </div>
                <TrendingUp className="w-4 h-4 text-zinc-600 group-hover:text-orange-400 transition-colors" />
              </Link>
            ))}
          </div>
        </motion.div>
      </main>

      <AvatarPicker open={showAvatarPicker} onClose={() => setShowAvatarPicker(false)}
        onSelect={(avatar) => { updateAvatar(avatar); setShowAvatarPicker(false); }}
        currentAvatar={user.avatar} />
    </div>
  );
}

function Link({ href, children, ...props }: any) {
  const router = useRouter();
  return (
    <a href={href} onClick={(e) => { e.preventDefault(); router.push(href); }} {...props}>
      {children}
    </a>
  );
}
