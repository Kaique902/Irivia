'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/store';
import { useNotificationStore } from '@/store/notifications';
import { StoryNode } from '@/types';
import { downloadStoryPDF } from '@/lib/exportPdf';
import { createNodeDeepLink } from '@/lib/shareCard';

const CommentSection = dynamic(() => import('@/components/story/CommentSection'), { ssr: false });
const ChallengeFriend = dynamic(() => import('@/components/ui/ChallengeFriend'), { ssr: false });
import { useToast } from '@/store/toast';
import { ArrowLeft, Flame, Snowflake, Plus, ChevronDown, ChevronUp, Send, X, Users, GitBranch, Sparkles, Flag, Check, Trophy, Zap, FileDown, Bell, BellOff, Trash2, Share2, Swords } from 'lucide-react';

// Confetti effect
function Confetti({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 1, y: -20, x: Math.random() * window.innerWidth }}
          animate={{
            opacity: 0,
            y: window.innerHeight,
            rotate: Math.random() * 360,
          }}
          transition={{ duration: 1.5 + Math.random(), delay: Math.random() * 0.3 }}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: ['#f97316', '#06b6d4', '#22c55e', '#eab308', '#ec4899'][i % 5],
          }}
        />
      ))}
    </div>
  );
}

export default function StoryPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const challengeType = searchParams.get('challenge');
  const [hydrated, setHydrated] = useState(false);
  const { stories, voteNode, addNode, removeStory, votedNodes, user, reportNode, completeReadChallenge, followStory, unfollowStory, toggleMuteStory, followUser, unfollowUser, users } = useStore();
  const { addNotification } = useNotificationStore();
  const { show: showToast } = useToast();
  const story = stories.find(s => s.id === id);

  useEffect(() => {
    if (useStore.persist.hasHydrated()) {
      setHydrated(true);
    } else {
      const unsub = useStore.persist.onFinishHydration(() => setHydrated(true));
      return () => unsub();
    }
  }, []);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newContent, setNewContent] = useState('');
  const [showBranches, setShowBranches] = useState<Set<string>>(new Set());
  const [reportingNode, setReportingNode] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [lastVoted, setLastVoted] = useState<string | null>(null);
  const [showStoryMenu, setShowStoryMenu] = useState(false);
  const [showXP, setShowXP] = useState<string | null>(null);
  const [sharingNode, setSharingNode] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const storyRef = useRef<HTMLDivElement>(null);
  const [readProgress, setReadProgress] = useState(0);
  const [maxProgress, setMaxProgress] = useState(0);

  // Build tree structure
  const childrenMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    story?.nodes.forEach(n => {
      if (n.parentId) {
        if (!map[n.parentId]) map[n.parentId] = [];
        map[n.parentId].push(n.id);
      }
    });
    return map;
  }, [story]);

  const nodeMap = useMemo(() => {
    const map: Record<string, StoryNode> = {};
    story?.nodes.forEach(n => { map[n.id] = n; });
    return map;
  }, [story]);

  // Find main path
  const mainPath = useMemo(() => {
    const path: string[] = [];
    if (!story) return path;
    const root = story.nodes.find(n => !n.parentId);
    if (!root) return path;
    let current = root.id;
    while (current) {
      path.push(current);
      const children = childrenMap[current] || [];
      if (children.length === 0) break;
      current = children.sort((a, b) => (nodeMap[b]?.votes || 0) - (nodeMap[a]?.votes || 0))[0];
    }
    return path;
  }, [story, childrenMap, nodeMap]);

  const maxVotes = story ? Math.max(...story.nodes.map(n => n.votes)) : 0;
  const isFollowingStory = user ? user.followedStories?.includes(story?.id || '') ?? false : false;
  const isMuted = user ? user.mutedStories?.includes(story?.id || '') ?? false : false;

  // Auto-complete read challenge on visit
  useEffect(() => {
    if (story) completeReadChallenge();
  }, [story, completeReadChallenge]);

  // Track reading progress (max only goes up)
  useEffect(() => {
    const handleScroll = () => {
      if (!storyRef.current) return;
      const scrolled = window.scrollY;
      const total = storyRef.current.scrollHeight - window.innerHeight;
      const progress = Math.min((scrolled / total) * 100, 100);
      setReadProgress(progress);
      setMaxProgress(p => Math.max(p, progress));
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Deep link: scroll to node on load
  useEffect(() => {
    if (!story || !hydrated) return;
    const params = new URLSearchParams(window.location.search);
    const targetNode = params.get('node');
    if (targetNode) {
      setTimeout(() => {
        const el = document.getElementById(`node-${targetNode}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [story, hydrated]);

  if (!story) {
    if (!hydrated) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-zinc-500 text-sm">Carregando...</p>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-4">📖</p>
          <h2 className="text-xl font-bold mb-2">História não encontrada</h2>
          <button onClick={() => router.push('/')} className="text-orange-400 hover:text-orange-300">Voltar</button>
        </div>
      </div>
    );
  }

  const handleAddNode = (parentId: string) => {
    if (!user) { showToast('Faça login para adicionar uma continuação', 'error'); return; }
    if (!newContent.trim()) return;
    const newNode: StoryNode = {
      id: `n${Date.now()}`,
      content: newContent,
      author: user?.username || 'Você',
      emotion: 'curiosidade',
      parentId,
      votes: 1,
      hotVotes: 1,
      coldVotes: 0,
      trending: false,
      createdAt: new Date().toISOString(),
    };
    addNode(story.id, newNode);
    setNewContent('');
    setAddingTo(null);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2000);
    
    // Notification
    addNotification({
      type: 'branch',
      message: `Você adicionou uma nova continuação em "${story.title}"`,
      storyId: story.id,
    });
  };

  const handleShareNode = async (node: StoryNode) => {
    if (sharingNode === node.id) { setSharingNode(null); return; }
    setSharingNode(node.id);
    const url = createNodeDeepLink(story.id, node.id, 'share');
    const branchCount = (childrenMap[node.id] || []).filter(id => !mainPath.includes(id)).length;
    const caption = `📖 "${story.title}"\n\n${node.content}\n\n🔥 ${node.hotVotes} · ❄️ ${node.coldVotes} · ${node.votes} votos${branchCount > 0 ? `\n🌿 +${branchCount} caminho${branchCount > 1 ? 's' : ''} alternativo${branchCount > 1 ? 's' : ''}` : ''}\n\n👇 Leia e vote no Irivia\n${url}`;
    try {
      const { generateShareImage } = await import('@/lib/shareCard');
      const blob = await generateShareImage(node, story.title, branchCount);
      const file = new File([blob], `irivia-${node.id}.png`, { type: 'image/png' });
      const canShareFiles = typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });
      if (canShareFiles) {
        navigator.clipboard.writeText(caption).catch(() => {});
        await navigator.share({
          title: `Irivia — ${story.title}`,
          text: caption.slice(0, 200),
          url,
          files: [file],
        });
      } else if (typeof navigator.share === 'function') {
        navigator.clipboard.writeText(caption).catch(() => {});
        await navigator.share({
          title: `Irivia — ${story.title}`,
          text: caption.slice(0, 200),
          url,
        });
      } else {
        // Fallback: download image + copy caption
        await navigator.clipboard.writeText(caption);
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `irivia-${story.title.slice(0, 30)}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 3000);
      }
    } catch { /* user cancelled or fallback */ }
    setSharingNode(null);
  };

  const handleVote = (nodeId: string, type: 'hot' | 'cold') => {
    if (!user) { showToast('Faça login para votar', 'error'); return; }
    if (votedNodes.includes(nodeId)) return;
    voteNode(nodeId, type);
    setLastVoted(nodeId);
    setShowXP(nodeId);
    if (type === 'hot') {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
    }
    setTimeout(() => setShowXP(null), 1500);
  };

  // Get readers count (simulated)
  const getReaders = (nodeId: string) => {
    const node = nodeMap[nodeId];
    if (!node) return 0;
    return Math.floor(node.votes * 2.3);
  };

  return (
    <div ref={storyRef} className="min-h-screen">
      <Confetti show={showConfetti} />

      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-40 h-1 bg-zinc-900">
        <motion.div
          className="h-full bg-gradient-to-r from-orange-500 to-orange-600"
          initial={{ width: 0 }}
          animate={{ width: `${maxProgress}%` }}
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#09090b]/80 backdrop-blur-xl border-b border-[#27272a]">
        <div className="max-w-3xl mx-auto px-4 h-12 flex items-center justify-between">
          <button onClick={() => router.push('/')} className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <div className="flex items-center gap-1.5">
            {/* Follow/subscribe story */}
            {user && (
              <div className="relative">
                <button onClick={() => setShowStoryMenu(!showStoryMenu)}
                  className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs transition-all">
                  {isMuted ? <BellOff className="w-3.5 h-3.5" /> : isFollowingStory ? <Bell className="w-3.5 h-3.5 text-orange-400" /> : <Bell className="w-3.5 h-3.5" />}
                </button>
                {showStoryMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowStoryMenu(false)} />
                    <div className="absolute right-0 top-full mt-1 w-48 card z-50 p-2">
                      <button onClick={() => { isFollowingStory ? unfollowStory(story.id) : followStory(story.id); setShowStoryMenu(false); }}
                        className="w-full p-2 rounded-lg text-left text-xs hover:bg-zinc-800 transition-all flex items-center gap-2">
                        {isFollowingStory ? <BellOff className="w-3.5 h-3.5 text-red-400" /> : <Bell className="w-3.5 h-3.5 text-orange-400" />}
                        {isFollowingStory ? 'Deixar de seguir' : 'Seguir história'}
                      </button>
                      <button onClick={() => { toggleMuteStory(story.id); setShowStoryMenu(false); }}
                        className="w-full p-2 rounded-lg text-left text-xs hover:bg-zinc-800 transition-all flex items-center gap-2">
                        {isMuted ? <Bell className="w-3.5 h-3.5 text-zinc-400" /> : <BellOff className="w-3.5 h-3.5 text-zinc-400" />}
                        {isMuted ? 'Ativar notificações' : 'Silenciar notificações'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
            <button onClick={() => downloadStoryPDF(story)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs transition-all">
              <FileDown className="w-3.5 h-3.5" /> PDF
            </button>
            {(user?.isAdmin || user?.id === story.authorId) && (
              <button onClick={() => { if (window.confirm('Deletar esta história? Esta ação não pode ser desfeita.')) { router.push('/'); setTimeout(() => removeStory(story.id), 100); } }}
                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs transition-all">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-zinc-500">
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {story.participants} autores</span>
            <span className="flex items-center gap-1"><GitBranch className="w-3.5 h-3.5" /> {story.totalBranches} ramos</span>
          </div>
        </div>

        {/* Reading progress indicator — sticky row below header */}
        <div className="max-w-3xl mx-auto px-4 pb-2 flex items-center gap-2 text-xs text-zinc-500">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800">
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span>Caminho principal</span>
          </div>
          <span>•</span>
          <span>{mainPath.length} frases no caminho</span>
          <span>•</span>
          <span>{Math.round(maxProgress)}% lido</span>
        </div>
      </header>

      {/* Challenge banner */}
      {challengeType && (
        <div className="max-w-3xl mx-auto px-4 pt-4">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-gradient-to-r from-orange-500/10 to-cyan-500/10 border border-orange-500/20 flex items-center gap-3">
            <Swords className="w-5 h-5 text-orange-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Desafio recebido!</p>
              <p className="text-xs text-zinc-400">
                {challengeType === 'write' && 'Seu amigo desafiou você a escrever uma continuação para esta história!'}
                {challengeType === 'branch' && 'Seu amigo desafiou você a criar um novo ramo nesta história!'}
                {challengeType === 'vote' && 'Seu amigo desafiou você a votar nos melhores rumos desta história!'}
              </p>
            </div>
            <button onClick={() => {
              if (challengeType === 'write' || challengeType === 'branch') {
                const lastNode = mainPath[mainPath.length - 1];
                if (lastNode) setAddingTo(lastNode);
              }
              const url = new URL(window.location.href);
              url.searchParams.delete('challenge');
              window.history.replaceState({}, '', url.toString());
            }}
              className="btn btn-primary text-xs py-1.5 px-3">
              {challengeType === 'vote' ? 'Votar' : 'Escrever'}
            </button>
          </motion.div>
        </div>
      )}

      {/* Story */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <span className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 text-xs font-medium mb-3 inline-block">{story.genre}</span>
          <h1 className="text-3xl font-extrabold mb-3">{story.title}</h1>
          <p className="text-zinc-400">Cada frase é um caminho. Vote nos melhores ramos ou adicione o seu.</p>
        </motion.div>

        {/* Main Path */}
        <div className="space-y-0">
          {mainPath.map((nodeId, index) => {
            const node = nodeMap[nodeId];
            if (!node) return null;
            const children = childrenMap[nodeId] || [];
            const branches = children.filter(id => !mainPath.includes(id));
            const hasBranches = branches.length > 0;
            const isExpanded = showBranches.has(nodeId);
            const isLast = index === mainPath.length - 1;
            const isVoted = votedNodes.includes(nodeId);
            const readers = getReaders(nodeId);

            return (
              <motion.div id={`node-${nodeId}`} key={nodeId} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.08 }}>
                {/* Connector line */}
                {index > 0 && (
                  <div className="flex justify-start ml-6 py-0">
                    <div className="w-0.5 h-6 bg-gradient-to-b from-zinc-700 to-zinc-800" />
                  </div>
                )}

                <div className="flex gap-4">
                  {/* Timeline dot - animated */}
                  <div className="flex-shrink-0 relative">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-lg border-2 transition-all ${
                        isVoted
                          ? 'bg-green-500/20 border-green-500/50 text-green-400'
                          : node.votes > maxVotes * 0.7
                          ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                      }`}
                    >
                      {isVoted ? <Check className="w-5 h-5" /> : index + 1}
                    </motion.div>
                    {/* Pulse effect for hot nodes */}
                    {node.votes > maxVotes * 0.7 && !isVoted && (
                      <div className="absolute inset-0 rounded-full bg-orange-500/20 animate-ping" />
                    )}
                  </div>

                  {/* Content card */}
                  <div className="flex-1 pb-6">
                    <motion.div
                      whileHover={{ borderColor: 'rgba(249, 115, 22, 0.3)' }}
                      className={`card p-5 ${isVoted ? 'border-green-500/20' : ''}`}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-[11px] font-bold text-zinc-300">
                            {node.author[0]}
                          </div>
                          <Link href={`/u/${encodeURIComponent(node.author)}`} className="text-sm text-zinc-400 hover:text-orange-400 transition-colors">
                            {node.author}
                          </Link>
                          {user && node.author !== user.username && (
                            <button onClick={() => {
                              if (!user) { showToast('Faça login para seguir usuários', 'error'); return; }
                              const authorUser = users.find(u => u.username === node.author);
                              if (authorUser) {
                                user.following.includes(authorUser.id) ? unfollowUser(authorUser.id) : followUser(authorUser.id);
                              }
                            }}
                              className="text-[10px] px-1.5 py-0.5 rounded border transition-all"
                            >
                              {users.find(u => u.username === node.author && user.following.includes(u.id)) ? 'Seguindo' : 'Seguir'}
                            </button>
                          )}
                          <span className="text-zinc-600">·</span>
                          <span className="text-xs text-zinc-500">{new Date(node.createdAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {node.trending && (
                            <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-bold flex items-center gap-1">
                              <Flame className="w-3 h-3" /> Hot
                            </span>
                          )}
                          <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                            <Users className="w-3 h-3" /> {readers} leram
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <p className="text-white leading-relaxed mb-4 text-[15px]">{node.content}</p>

                      {/* Vote bar */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
                          <span className="flex items-center gap-1 text-orange-400">
                            <Flame className="w-3 h-3" /> {node.hotVotes}
                          </span>
                          <span>{node.votes} votos</span>
                          <span className="flex items-center gap-1 text-cyan-400">
                            {node.coldVotes} <Snowflake className="w-3 h-3" />
                          </span>
                        </div>
                        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${node.votes > 0 ? (node.hotVotes / node.votes) * 100 : 50}%` }}
                            transition={{ duration: 0.5 }}
                            className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
                          />
                        </div>
                      </div>

                      {/* XP popup */}
                      <AnimatePresence>
                        {showXP === nodeId && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: -10 }}
                            exit={{ opacity: 0 }}
                            className="absolute top-2 right-2 px-3 py-1 rounded-full bg-green-500 text-white text-xs font-bold flex items-center gap-1"
                          >
                            <Zap className="w-3 h-3" /> +5 XP
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* CommentSection */}
                      <CommentSection nodeId={nodeId} storyId={story.id} />

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {!isVoted ? (
                          <>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleVote(nodeId, 'hot')}
                              className="btn bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 flex items-center gap-1.5"
                            >
                              <Flame className="w-3.5 h-3.5" /> Hot
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleVote(nodeId, 'cold')}
                              className="btn bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 flex items-center gap-1.5"
                            >
                              <Snowflake className="w-3.5 h-3.5" /> Cold
                            </motion.button>
                          </>
                        ) : (
                          <span className="text-xs text-green-400 flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-500/10">
                            <Check className="w-3.5 h-3.5" /> Votado
                          </span>
                        )}

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setAddingTo(addingTo === nodeId ? null : nodeId)}
                          className="btn btn-ghost flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" /> Continuar
                        </motion.button>

                        {hasBranches && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowBranches(prev => { const n = new Set(prev); if (n.has(nodeId)) n.delete(nodeId); else n.add(nodeId); return n; })}
                            className="btn btn-ghost flex items-center gap-1.5"
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            {branches.length} desvio{branches.length !== 1 && 's'}
                          </motion.button>
                        )}

                <ChallengeFriend storyId={story.id} storyTitle={story.title} />
                <button
                  onClick={() => handleShareNode(node)}
                  className="btn btn-ghost flex items-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setReportingNode(nodeId)} className="btn btn-ghost ml-auto text-zinc-600 hover:text-red-400 p-2">
                  <Flag className="w-3.5 h-3.5" />
                </button>
                      </div>

                      {/* Add form */}
                      <AnimatePresence>
                        {addingTo === nodeId && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            className="mt-4 pt-4 border-t border-zinc-800">
                            <textarea value={newContent} onChange={e => setNewContent(e.target.value)}
                              className="input resize-none h-20 mb-2" placeholder="Escreva a continuação..." autoFocus />
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-zinc-500">{newContent.length}/500</span>
                              <div className="flex gap-2">
                                <button onClick={() => handleAddNode(nodeId)} disabled={!newContent.trim()}
                                  className="btn btn-primary flex items-center gap-1.5 disabled:opacity-40">
                                  <Send className="w-3.5 h-3.5" /> Publicar
                                </button>
                                <button onClick={() => { setAddingTo(null); setNewContent(''); }} className="btn btn-ghost">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    {/* Branch alternatives */}
                    <AnimatePresence>
                      {isExpanded && hasBranches && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                          className="mt-2 space-y-2 ml-4">
                          {branches.map(branchId => {
                            const branch = nodeMap[branchId];
                            if (!branch) return null;
                            const branchVoted = votedNodes.includes(branchId);
                            const branchReaders = getReaders(branchId);
                            return (
                              <motion.div key={branchId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                className="card p-4 border-l-2 border-l-zinc-700 hover:border-l-orange-500/50 transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                  <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center text-[9px] font-bold text-zinc-400">
                                    {branch.author[0]}
                                  </div>
                                  <Link href={`/u/${encodeURIComponent(branch.author)}`} className="text-xs text-zinc-400 hover:text-orange-400 transition-colors">
                                    {branch.author}
                                  </Link>
                                  {user && branch.author !== user.username && (
                                    <button onClick={() => {
                                      const authorUser = users.find(u => u.username === branch.author);
                                      if (authorUser) {
                                        user.following.includes(authorUser.id) ? unfollowUser(authorUser.id) : followUser(authorUser.id);
                                      }
                                    }}
                                      className="text-[9px] px-1 py-0.5 rounded border transition-all"
                                    >
                                      {users.find(u => u.username === branch.author && user.following.includes(u.id)) ? 'Seguindo' : 'Seguir'}
                                    </button>
                                  )}
                                  <span className="text-zinc-600">·</span>
                                  <span className="text-[10px] text-zinc-500">{branch.votes} votos</span>
                                  </div>
                                  <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                                    <Users className="w-3 h-3" /> {branchReaders}
                                  </span>
                                </div>
                                <p className="text-sm text-zinc-300 leading-relaxed mb-3">{branch.content}</p>
                                <CommentSection nodeId={branchId} storyId={story.id} />
                                <div className="flex items-center gap-2">
                                  {!branchVoted ? (
                                    <>
                                      <button onClick={() => handleVote(branchId, 'hot')} className="btn bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 text-xs py-1 px-2">
                                        <Flame className="w-3 h-3 inline mr-1" />{branch.hotVotes}
                                      </button>
                                      <button onClick={() => handleVote(branchId, 'cold')} className="btn bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 text-xs py-1 px-2">
                                        <Snowflake className="w-3 h-3 inline mr-1" />{branch.coldVotes}
                                      </button>
                                    </>
                                  ) : (
                                    <span className="text-[10px] text-green-400 flex items-center gap-1">
                                      <Check className="w-3 h-3" /> Votado
                                    </span>
                                  )}
                                  <button onClick={() => setAddingTo(branchId)} className="btn btn-ghost text-xs py-1 px-2">
                                    <Plus className="w-3 h-3 inline mr-1" />Continuar
                                  </button>
                                  <button onClick={() => handleShareNode(branch)} className="btn btn-ghost text-xs py-1 px-2 ml-auto">
                                    <Share2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </motion.div>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Next step suggestion - only at branch points */}
                    {isLast && hasBranches && !showBranches.has(nodeId) && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                        className="mt-3 p-3 rounded-xl bg-orange-500/5 border border-orange-500/20 flex items-center gap-3">
                        <Sparkles className="w-5 h-5 text-orange-400 flex-shrink-0" />
                        <div className="text-xs text-zinc-400">
                          <span className="text-orange-400 font-medium">Novos caminhos disponíveis!</span> Clique em &quot;desvios&quot; para ver alternativas.
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* End CTA */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="card p-8 text-center mt-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-cyan-500/5" />
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-6 h-6 text-orange-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">Você chegou ao fim do caminho!</h3>
            <p className="text-zinc-400 mb-4 text-sm">Seja o próximo a continuar esta história e ganhe <span className="text-orange-400 font-bold">+10 XP</span></p>
            <button onClick={() => setAddingTo(mainPath[mainPath.length - 1])}
              className="btn btn-primary">
              <Plus className="w-4 h-4 inline mr-2" /> Adicionar Continuação
            </button>
          </div>
        </motion.div>

        {/* Story stats footer */}
        <div className="mt-8 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
          <div className="flex items-center justify-around text-center">
            <div>
              <p className="text-lg font-bold text-orange-400">{mainPath.length}</p>
              <p className="text-[10px] text-zinc-500">Frases no caminho</p>
            </div>
            <div className="w-px h-8 bg-zinc-800" />
            <div>
              <p className="text-lg font-bold text-cyan-400">{story.totalBranches}</p>
              <p className="text-[10px] text-zinc-500">Desvios</p>
            </div>
            <div className="w-px h-8 bg-zinc-800" />
            <div>
              <p className="text-lg font-bold text-green-400">{story.participants}</p>
              <p className="text-[10px] text-zinc-500">Contribuidores</p>
            </div>
            <div className="w-px h-8 bg-zinc-800" />
            <div>
              <p className="text-lg font-bold text-purple-400">{story.nodes.reduce((a, n) => a + n.votes, 0)}</p>
              <p className="text-[10px] text-zinc-500">Votos totais</p>
            </div>
          </div>
        </div>
      </main>

      {/* Report Modal */}
      <AnimatePresence>
        {reportingNode && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={() => setReportingNode(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="w-full max-w-sm card p-5" onClick={e => e.stopPropagation()}>
              <h3 className="font-bold mb-3">Denunciar</h3>
              <div className="space-y-2 mb-4">
                {['Spam', 'Ofensivo', 'Violência', 'Falso', 'Outro'].map(r => (
                  <button key={r} onClick={() => setReportReason(r)}
                    className={`w-full p-2.5 rounded-xl text-left text-sm transition-all ${reportReason === r ? 'bg-red-500/20 border border-red-500/30 text-red-300' : 'bg-zinc-800/50 text-zinc-300 hover:bg-zinc-800'}`}>
                    {r}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setReportingNode(null)} className="btn btn-ghost flex-1">Cancelar</button>
                <button onClick={() => {
                  if (reportReason && reportingNode) {
                    const node = nodeMap[reportingNode];
                    reportNode(reportingNode, story.id, reportReason, node?.content || '');
                    setReportingNode(null);
                    setReportReason('');
                  }
                }} disabled={!reportReason} className="btn bg-red-600 hover:bg-red-500 text-white flex-1 disabled:opacity-40">Enviar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
