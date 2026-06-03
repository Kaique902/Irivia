'use client';

import { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/store';
import { ArrowLeft, Shield, Flag, Check, X, MessageSquareText, Users, BookOpen, GitBranch, Activity, ShieldCheck, ShieldOff, Crown, Eye, UserPlus, BarChart3 } from 'lucide-react';

const ModerationQueue = dynamic(() => import('@/components/ui/ModerationQueue'), { ssr: false });

type Tab = 'dashboard' | 'analytics' | 'denuncias' | 'feedbacks' | 'usuarios' | 'logs';
type Period = '24h' | '7d' | '30d' | 'all';

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [period, setPeriod] = useState<Period>('24h');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Re-sync admin status from server on mount
    if (user && !user.isAdmin) {
      useStore.getState().setAdminStatus(user.username);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    reports, feedbackTexts, user, users, stories, bannedUsers,
    promoteUser, demoteUser, adminLogs, pageVisits, visitLog, voteLog,
  } = useStore();

  // Only check admin status after mount to avoid hydration mismatch
  if (!mounted) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-4">🔒</p>
          <h2 className="text-xl font-bold mb-2">Acesso restrito</h2>
          <p className="text-zinc-400 mb-4 text-sm">Faça login para acessar o painel.</p>
          <button onClick={() => router.push('/auth')} className="text-orange-400 hover:text-orange-300">Ir para login</button>
        </div>
      </div>
    );
  }

  if (!user.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-4">🚫</p>
          <h2 className="text-xl font-bold mb-2">Sem permissão</h2>
          <p className="text-zinc-400 mb-4 text-sm">Apenas administradores podem acessar.</p>
          <button onClick={() => router.push('/')} className="text-orange-400 hover:text-orange-300">Voltar</button>
        </div>
      </div>
    );
  }

  const totalNodes = stories.reduce((a, s) => a + s.nodes.length, 0);
  const totalVotes = stories.reduce((a, s) => a + s.nodes.reduce((b, n) => b + n.votes, 0), 0);
  const pendingReports = reports.filter(r => r.status === 'pending').length;

  const tabs: { key: Tab; icon: any; label: string; count?: number }[] = [
    { key: 'dashboard', icon: Activity, label: 'Dashboard' },
    { key: 'analytics', icon: BarChart3, label: 'Analytics' },
    { key: 'denuncias', icon: Flag, label: 'Denúncias', count: pendingReports },
    { key: 'feedbacks', icon: MessageSquareText, label: 'Feedbacks', count: feedbackTexts.length },
    { key: 'usuarios', icon: Users, label: 'Usuários', count: users.length },
    { key: 'logs', icon: GitBranch, label: 'Logs' },
  ];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-xl border-b border-[#27272a]">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => router.push('/')} className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <span className="text-xs text-zinc-600 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-orange-400" /> Admin
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <Crown className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Painel Administrativo</h1>
              <p className="text-sm text-zinc-500">Gerencie o Irivia</p>
            </div>
          </div>
        </motion.div>

        {/* Top tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                tab === t.key
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}>
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-zinc-700 text-[10px]">{t.count}</span>
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Dashboard */}
          {tab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                  { icon: Users, label: 'Usuários', value: users.length, color: 'text-green-400' },
                  { icon: BookOpen, label: 'Histórias', value: stories.length, color: 'text-orange-400' },
                  { icon: GitBranch, label: 'Ramos', value: totalNodes, color: 'text-cyan-400' },
                  { icon: Flag, label: 'Denúncias pendentes', value: pendingReports, color: 'text-red-400' },
                  { icon: Check, label: 'Denúncias resolvidas', value: reports.filter(r => r.status === 'resolved').length, color: 'text-green-400' },
                  { icon: X, label: 'Denúncias ignoradas', value: reports.filter(r => r.status === 'dismissed').length, color: 'text-zinc-400' },
                  { icon: MessageSquareText, label: 'Feedbacks', value: feedbackTexts.length, color: 'text-purple-400' },
                  { icon: Shield, label: 'Banidos', value: bannedUsers.length, color: 'text-red-500' },
                ].map((stat, i) => (
                  <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }} className="card p-4 text-center">
                    <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-1`} />
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-zinc-500">{stat.label}</p>
                  </motion.div>
                ))}
              </div>

              <div className="card p-5">
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-orange-400" /> Atividade Geral
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-zinc-500 text-xs">Total de votos</p>
                    <p className="text-lg font-bold text-yellow-400">{totalVotes.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs">XP total da comunidade</p>
                    <p className="text-lg font-bold text-orange-400">{users.reduce((a, u) => a + u.xp, 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs">Média de votos/ramo</p>
                    <p className="text-lg font-bold text-cyan-400">{totalNodes > 0 ? (totalVotes / totalNodes).toFixed(1) : '0'}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs">Administradores</p>
                    <p className="text-lg font-bold text-orange-400">{users.filter(u => u.isAdmin).length}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Analytics */}
          {tab === 'analytics' && (
            <motion.div key="analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* Period filter */}
              <div className="flex gap-2 mb-6">
                {(['24h', '7d', '30d', 'all'] as Period[]).map(p => (
                  <button key={p} onClick={() => setPeriod(p)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      period === p ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}>
                    {p === '24h' ? 'Últimas 24h' : p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : 'Todo período'}
                  </button>
                ))}
              </div>

              {/* Stats with period filter */}
              {(() => {
                const cutoff = period === 'all' ? 0 : Date.now() - (
                  period === '24h' ? 86400000 : period === '7d' ? 604800000 : 2592000000
                );
                const visitsInPeriod = visitLog.filter(t => t >= cutoff).length;
                const accountsInPeriod = users.filter(u => new Date(u.createdAt).getTime() >= cutoff).length;
                const storiesInPeriod = stories.filter(s => new Date(s.createdAt).getTime() >= cutoff).length;
                const votesInPeriod = voteLog.filter(t => t >= cutoff).length;
                const maxVal = Math.max(visitsInPeriod, accountsInPeriod, storiesInPeriod, votesInPeriod, 1);

                const bars = [
                  { icon: Eye, label: 'Acessos', value: visitsInPeriod, total: pageVisits, color: 'bg-cyan-500' },
                  { icon: UserPlus, label: 'Contas criadas', value: accountsInPeriod, total: users.length, color: 'bg-green-500' },
                  { icon: BookOpen, label: 'Histórias criadas', value: storiesInPeriod, total: stories.length, color: 'bg-orange-500' },
                  { icon: Activity, label: 'Votos computados', value: votesInPeriod, total: visitLog.length > 0 ? pageVisits : 0, color: 'bg-purple-500' },
                ];

                return (
                  <div className="space-y-4">
                    <div className="card p-5">
                      <h3 className="font-bold text-sm mb-4">Período selecionado</h3>
                      <div className="space-y-4">
                        {bars.map(bar => (
                          <div key={bar.label}>
                            <div className="flex items-center justify-between mb-1.5 text-sm">
                              <span className="flex items-center gap-1.5 text-zinc-300">
                                <bar.icon className="w-3.5 h-3.5 text-zinc-500" />
                                {bar.label}
                              </span>
                              <span className="font-bold">{bar.value.toLocaleString()}</span>
                            </div>
                            <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${(bar.value / maxVal) * 100}%` }}
                                transition={{ duration: 0.6 }}
                                className={`h-full ${bar.color} rounded-full`} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { icon: Eye, label: 'Total de acessos', value: pageVisits.toLocaleString(), color: 'text-cyan-400' },
                        { icon: UserPlus, label: 'Total de contas', value: users.length, color: 'text-green-400' },
                        { icon: BookOpen, label: 'Total de histórias', value: stories.length, color: 'text-orange-400' },
                        { icon: Activity, label: 'Total de votos', value: stories.reduce((a, s) => a + s.nodes.reduce((b, n) => b + n.votes, 0), 0).toLocaleString(), color: 'text-purple-400' },
                      ].map((stat, i) => (
                        <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }} className="card p-4 text-center">
                          <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-1`} />
                          <p className="text-xl font-bold">{stat.value}</p>
                          <p className="text-xs text-zinc-500">{stat.label}</p>
                        </motion.div>
                      ))}
                    </div>

                    {/* Referral Sources */}
                    <ReferralStats />
                  </div>
                );
              })()}
            </motion.div>
          )}

          {/* Denúncias */}
          {tab === 'denuncias' && (
            <motion.div key="denuncias" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { icon: Flag, label: 'Pendentes', value: reports.filter(r => r.status === 'pending').length, color: 'text-red-400' },
                  { icon: Check, label: 'Resolvidas', value: reports.filter(r => r.status === 'resolved').length, color: 'text-green-400' },
                  { icon: X, label: 'Ignoradas', value: reports.filter(r => r.status === 'dismissed').length, color: 'text-zinc-400' },
                ].map((stat, i) => (
                  <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }} className="card p-4 text-center">
                    <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-1`} />
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-zinc-500">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
              <ModerationQueue />
            </motion.div>
          )}

          {/* Feedbacks */}
          {tab === 'feedbacks' && (
            <motion.div key="feedbacks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <p className="text-sm text-zinc-500 mb-4">Feedbacks enviados pelos usuários:</p>
              {feedbackTexts.length === 0 ? (
                <div className="card p-8 text-center">
                  <MessageSquareText className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                  <p className="text-sm text-zinc-500">Nenhum feedback recebido ainda.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {[...feedbackTexts].reverse().map((fb, i) => {
                    const match = fb.match(/^\[(.*?)\]\s*(.*)/);
                    const date = match ? match[1] : '';
                    const text = match ? match[2] : fb;
                    return (
                      <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }} className="card p-4">
                        <p className="text-sm text-zinc-300">{text}</p>
                        <p className="text-xs text-zinc-600 mt-2">{new Date(date).toLocaleString('pt-BR')}</p>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* Usuários */}
          {tab === 'usuarios' && (
            <motion.div key="usuarios" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <p className="text-sm text-zinc-500 mb-4">
                {users.length} usuário{users.length !== 1 && 's'} registrado{users.length !== 1 && 's'}
                {bannedUsers.length > 0 && ` · ${bannedUsers.length} banido${bannedUsers.length !== 1 && 's'}`}
              </p>
              {users.length === 0 ? (
                <div className="card p-8 text-center">
                  <Users className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                  <p className="text-sm text-zinc-500">Nenhum usuário registrado.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {users.map((u, i) => (
                    <motion.div key={u.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }} className="card p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center text-lg">
                          {u.avatar}
                        </div>
                        <div>
                          <p className="text-sm font-medium flex items-center gap-1.5">
                            {u.username}
                            {u.isAdmin && (
                              <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 text-[9px] font-bold">ADMIN</span>
                            )}
                          </p>
                          <p className="text-xs text-zinc-500">Nível {u.level} · {u.xp} XP</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {u.isAdmin ? (
                          <button onClick={() => demoteUser(u.username)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-zinc-800 text-zinc-400 hover:bg-red-500/20 hover:text-red-400 transition-all">
                            <ShieldOff className="w-3 h-3" /> Remover Admin
                          </button>
                        ) : (
                          <button onClick={() => promoteUser(u.username)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-all">
                            <ShieldCheck className="w-3 h-3" /> Promover Admin
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Logs */}
          {tab === 'logs' && (
            <motion.div key="logs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <p className="text-sm text-zinc-500 mb-4">Registro de ações administrativas:</p>
              {adminLogs.length === 0 ? (
                <div className="card p-8 text-center">
                  <Activity className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                  <p className="text-sm text-zinc-500">Nenhuma ação registrada ainda.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {[...adminLogs].reverse().map((log, i) => {
                    const match = log.match(/^\[(.*?)\]\s*(.*)/);
                    const date = match ? match[1] : '';
                    const text = match ? match[2] : log;
                    return (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/50 flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-zinc-300">{text}</p>
                          <p className="text-[10px] text-zinc-600 mt-0.5">{new Date(date).toLocaleString('pt-BR')}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function ReferralStats() {
  const [refs, setRefs] = useState<{ source: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { dbGetReferralStats } = await import('@/lib/db');
        const data = await dbGetReferralStats();
        setRefs(data);
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="card p-5 mt-4">
        <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-orange-400" /> Origens de Tráfego
        </h3>
        <p className="text-xs text-zinc-600">Carregando...</p>
      </div>
    );
  }

  if (refs.length === 0) return null;

  const maxCount = Math.max(...refs.map(r => r.count), 1);

  return (
    <div className="card p-5 mt-4">
      <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-orange-400" /> Origens de Tráfego
      </h3>
      <div className="space-y-2">
        {refs.map(ref => (
          <div key={ref.source}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-zinc-300 capitalize">{ref.source}</span>
              <span className="font-bold">{ref.count}</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(ref.count / maxCount) * 100}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-gradient-to-r from-orange-500 to-cyan-500 rounded-full"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
