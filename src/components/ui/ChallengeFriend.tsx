'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createChallengeUrl, copyToClipboard } from '@/lib/share';
import { useStore } from '@/store/store';
import { useToast } from '@/store/toast';
import { Share2, Check, Copy, Swords, Zap } from 'lucide-react';

interface ChallengeFriendProps {
  storyId: string;
  storyTitle: string;
}

export default function ChallengeFriend({ storyId, storyTitle }: ChallengeFriendProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [challengeType, setChallengeType] = useState<'write' | 'branch' | 'vote'>('write');
  const { user, sendChallenge } = useStore();
  const { show: showToast } = useToast();

  const handleCopy = async () => {
    if (!user) { showToast('Faça login para desafiar alguém', 'error'); return; }
    sendChallenge(storyId, storyTitle, challengeType);
    const url = createChallengeUrl(storyId, challengeType);
    await copyToClipboard(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast(`Desafio de ${challengeType === 'branch' ? 'ramo' : challengeType === 'write' ? 'escrita' : 'voto'} criado! Link copiado.`);
  };

  const handleShare = async () => {
    if (!user) { showToast('Faça login para desafiar alguém', 'error'); return; }
    sendChallenge(storyId, storyTitle, challengeType);
    const url = createChallengeUrl(storyId, challengeType);
    if (navigator.share) {
      await navigator.share({
        title: `Desafio: ${storyTitle}`,
        text: `Aceita o desafio de continuar "${storyTitle}" no Irivia?`,
        url,
      });
    } else {
      await handleCopy();
    }
  };

  const xpMap = { write: 15, branch: 20, vote: 10 };

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-ghost flex items-center gap-1.5 text-xs"
      >
        <Swords className="w-3.5 h-3.5" /> Desafiar Alguém
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-3 p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3"
          >
            <p className="text-xs text-zinc-400">Desafie um amigo a continuar esta história:</p>

            <div className="flex gap-2">
              {[
                { type: 'write' as const, label: 'Escrever', xp: 15 },
                { type: 'branch' as const, label: 'Criar Ramo', xp: 20 },
                { type: 'vote' as const, label: 'Votar', xp: 10 },
              ].map(t => (
                <button
                  key={t.type}
                  onClick={() => setChallengeType(t.type)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all flex flex-col items-center ${
                    challengeType === t.type
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {t.label}
                  <span className="flex items-center gap-0.5 text-[10px] text-yellow-500"><Zap className="w-2.5 h-2.5" />+{t.xp}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleShare}
                className="btn btn-primary flex-1 flex items-center justify-center gap-1.5 text-xs py-2"
              >
                <Share2 className="w-3.5 h-3.5" /> Compartilhar
              </button>
              <button
                onClick={handleCopy}
                className="btn bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center gap-1.5 text-xs py-2"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copiado!' : 'Copiar Link'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
